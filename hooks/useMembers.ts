import { useState, useEffect } from 'react';
import { Member } from '@/types';
import { StorageService } from '@/services/storageService';

export function useMembers() {
  const [members, setMembers] = useState<Member[]>(() => StorageService.loadMembersSync());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    StorageService.loadData().then((data) => {
      if (!alive) return;
      setMembers(data.members ?? []);
      setIsHydrated(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    StorageService.saveMembers(members);
  }, [members, isHydrated]);

  const addMember = (data: Omit<Member, 'id'>) => {
    const newMember: Member = { ...data, id: `mbr-${Date.now()}` };
    setMembers(prev => [...prev, newMember]);
  };

  const updateMember = (updated: Member) => {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const deleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  return { members, addMember, updateMember, deleteMember };
}
