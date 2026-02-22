import http from 'http';
import { readFile, writeFile, rename, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.resolve(__dirname, '../data/seed.json');
const DIST_PATH = path.resolve(__dirname, '../dist');
const PORT = Number(process.env.PORT) || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10 MB
const AI_TIMEOUT_MS = 30_000;

const DEFAULT_DATA = {
  projects: [],
  activeProjectId: '',
  timeLogs: [],
  members: [],
  aiSettings: {
    enabled: true,
    model: 'gemini-2.5-flash',
  },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': CORS_ORIGIN,
  'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

// --- Write queue: serialize concurrent writes ---
let writeChain = Promise.resolve();
const enqueueWrite = (fn) => {
  writeChain = writeChain.then(fn, fn);
  return writeChain;
};

// --- Data file I/O ---
const readDataFile = async () => {
  try {
    const raw = await readFile(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return normalizeData(parsed, DEFAULT_DATA);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      await writeDataFile(DEFAULT_DATA);
      return DEFAULT_DATA;
    }
    console.error('Failed to read data file:', error);
    return DEFAULT_DATA;
  }
};

const writeDataFile = async (data) => {
  const payload = JSON.stringify(data, null, 2);
  const tmpPath = `${DATA_PATH}.tmp`;
  await writeFile(tmpPath, payload, 'utf-8');
  try {
    await rename(tmpPath, DATA_PATH);
  } catch (error) {
    // Some container bind-mount strategies do not allow atomic rename over mounted files.
    if (error && (error.code === 'EXDEV' || error.code === 'EBUSY' || error.code === 'EPERM')) {
      await writeFile(DATA_PATH, payload, 'utf-8');
      return;
    }
    throw error;
  }
};

// --- Validators ---
const isValidProject = (p) => {
  if (!p || typeof p !== 'object') return false;
  if (typeof p.id !== 'string' || !p.id) return false;
  if (typeof p.name !== 'string') return false;
  if (!Array.isArray(p.stages)) return false;
  if (!Array.isArray(p.tasks)) return false;
  return true;
};

const isValidTimeLog = (l) => {
  if (!l || typeof l !== 'object') return false;
  if (typeof l.id !== 'string' || !l.id) return false;
  if (typeof l.taskId !== 'string' || !l.taskId) return false;
  if (typeof l.hours !== 'number' || l.hours < 0) return false;
  if (typeof l.date !== 'string') return false;
  return true;
};

const isValidMember = (m) => {
  if (!m || typeof m !== 'object') return false;
  if (typeof m.id !== 'string' || !m.id) return false;
  if (typeof m.name !== 'string') return false;
  if (typeof m.role !== 'string') return false;
  if (typeof m.color !== 'string') return false;
  return true;
};

const normalizeData = (input, fallback) => {
  const safeFallback = fallback && typeof fallback === 'object' ? fallback : DEFAULT_DATA;
  const fallbackMembers = Array.isArray(safeFallback.members) ? safeFallback.members : [];

  return {
    projects: Array.isArray(input.projects) ? input.projects.filter(isValidProject) : safeFallback.projects,
    activeProjectId: typeof input.activeProjectId === 'string' ? input.activeProjectId : safeFallback.activeProjectId,
    timeLogs: Array.isArray(input.timeLogs) ? input.timeLogs.filter(isValidTimeLog) : safeFallback.timeLogs,
    members: Array.isArray(input.members) ? input.members.filter(isValidMember) : fallbackMembers,
    aiSettings: input.aiSettings && typeof input.aiSettings.enabled === 'boolean' && typeof input.aiSettings.model === 'string'
      ? input.aiSettings
      : safeFallback.aiSettings,
  };
};

// --- Read request body with size limit ---
const readBody = (req, maxSize) => new Promise((resolve, reject) => {
  let size = 0;
  const chunks = [];

  req.on('error', (err) => reject(err));

  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > maxSize) {
      req.destroy();
      reject(Object.assign(new Error('Payload too large'), { code: 'PAYLOAD_TOO_LARGE' }));
    } else {
      chunks.push(chunk);
    }
  });

  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
});

// --- Gemini AI helpers ---
let genAI = null;

const getGenAI = async () => {
  if (genAI) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const { GoogleGenAI } = await import('@google/genai');
  genAI = new GoogleGenAI({ apiKey });
  return genAI;
};

const callGemini = async (model, contents, config) => {
  const ai = await getGenAI();
  if (!ai) throw new Error('GEMINI_API_KEY is not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await ai.models.generateContent(
      { model, contents, config },
      { signal: controller.signal },
    );
    return response.text ? response.text.trim() : null;
  } finally {
    clearTimeout(timer);
  }
};

const tryStatFile = async (filePath) => {
  try {
    const fileStat = await stat(filePath);
    return fileStat.isFile();
  } catch (error) {
    if (error && error.code === 'ENOENT') return false;
    throw error;
  }
};

const getMimeType = (filePath) => MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

const serveFile = async (res, filePath) => {
  try {
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
    res.end(content);
    return true;
  } catch (error) {
    if (error && error.code === 'ENOENT') return false;
    throw error;
  }
};

const resolveDistPath = (pathname) => {
  const decodedPath = decodeURIComponent(pathname);
  const normalized = path.normalize(path.join(DIST_PATH, decodedPath));
  return normalized.startsWith(DIST_PATH) ? normalized : null;
};

// --- HTTP Server ---
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const { pathname } = url;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // GET /api/data
  if (pathname === '/api/data' && req.method === 'GET') {
    const data = await readDataFile();
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  // PUT /api/data
  if (pathname === '/api/data' && req.method === 'PUT') {
    try {
      const body = await readBody(req, MAX_BODY_SIZE);
      const incoming = body ? JSON.parse(body) : {};
      await enqueueWrite(async () => {
        const current = await readDataFile();
        const normalized = normalizeData(incoming, current);
        await writeDataFile(normalized);
      });
      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      console.error('Failed to save /api/data payload:', error);
      if (error.code === 'PAYLOAD_TOO_LARGE') {
        res.writeHead(413, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Payload too large' }));
      } else if (error instanceof SyntaxError) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }));
      } else {
        res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Failed to persist data' }));
      }
    }
    return;
  }

  // POST /api/ai/generate-plan
  if (pathname === '/api/ai/generate-plan' && req.method === 'POST') {
    try {
      const body = await readBody(req, MAX_BODY_SIZE);
      const { description, model } = JSON.parse(body);
      if (!description || !model) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Missing description or model' }));
        return;
      }

      const text = await callGemini(
        model,
        `Generate a detailed project plan for: ${description}. Include stages and specific tasks for each stage with dates.`,
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              stages: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING' },
                    tasks: {
                      type: 'ARRAY',
                      items: {
                        type: 'OBJECT',
                        properties: {
                          title: { type: 'STRING' },
                          description: { type: 'STRING' },
                          estimatedHours: { type: 'NUMBER' },
                          durationDays: { type: 'NUMBER' },
                        },
                        required: ['title', 'description', 'estimatedHours', 'durationDays'],
                      },
                    },
                  },
                  required: ['name', 'tasks'],
                },
              },
            },
            required: ['stages'],
          },
        },
      );

      if (!text) {
        res.writeHead(502, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Empty AI response' }));
        return;
      }

      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, data: JSON.parse(text) }));
    } catch (error) {
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY is not configured')) {
        res.writeHead(503, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'GEMINI_API_KEY is not configured' }));
        return;
      }
      console.error('AI generate-plan error:', error);
      const status = error.name === 'AbortError' ? 504 : 500;
      res.writeHead(status, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: error.name === 'AbortError' ? 'AI request timed out' : 'AI generation failed' }));
    }
    return;
  }

  // POST /api/ai/insights
  if (pathname === '/api/ai/insights' && req.method === 'POST') {
    try {
      const body = await readBody(req, MAX_BODY_SIZE);
      const { projectData, model } = JSON.parse(body);
      if (!projectData || !model) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Missing projectData or model' }));
        return;
      }

      const text = await callGemini(
        model,
        `Analyze this project data and provide 3 key insights or suggestions for improvement: ${JSON.stringify(projectData)}`,
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                description: { type: 'STRING' },
                urgency: { type: 'STRING', enum: ['Low', 'Medium', 'High'] },
              },
              required: ['title', 'description', 'urgency'],
            },
          },
        },
      );

      if (!text) {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, data: [] }));
        return;
      }

      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, data: JSON.parse(text) }));
    } catch (error) {
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY is not configured')) {
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, data: [] }));
        return;
      }
      console.error('AI insights error:', error);
      const status = error.name === 'AbortError' ? 504 : 500;
      res.writeHead(status, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: error.name === 'AbortError' ? 'AI request timed out' : 'AI insights failed' }));
    }
    return;
  }

  if (req.method === 'GET' && !pathname.startsWith('/api')) {
    try {
      const requestPath = pathname === '/' ? '/index.html' : pathname;
      const candidateFile = resolveDistPath(requestPath);

      if (candidateFile && await tryStatFile(candidateFile)) {
        const served = await serveFile(res, candidateFile);
        if (served) return;
      }

      // SPA fallback only for route-like URLs (without file extension).
      if (!path.extname(pathname)) {
        const indexPath = path.join(DIST_PATH, 'index.html');
        const served = await serveFile(res, indexPath);
        if (served) return;
      }
    } catch (error) {
      console.error('Static file serving error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Failed to serve frontend assets' }));
      return;
    }
  }

  res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Planea server running on http://localhost:${PORT}`);
  console.log(`Using data file: ${DATA_PATH}`);
  console.log(`Serving frontend from: ${DIST_PATH}`);
});
