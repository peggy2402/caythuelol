'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User as UserIcon, Check, X, Shield, UserCheck } from 'lucide-react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

export interface AdminUserItem {
  _id: string;
  username: string;
  email: string;
  role: string;
  profile?: {
    avatar?: string;
    full_name?: string;
  };
  wallet_balance?: number;
  createdAt?: string;
}

interface UserSelectDropdownProps {
  onSelect: (user: AdminUserItem | null) => void;
  selectedUser: AdminUserItem | null;
  placeholder?: string;
  excludeRoles?: string[]; // Ví dụ loại trừ những ai đã là 'BOOSTER' hoặc 'STAFF'
}

export default function UserSelectDropdown({
  onSelect,
  selectedUser,
  placeholder = 'Tìm theo tên đăng nhập hoặc email...',
  excludeRoles = [],
}: UserSelectDropdownProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper auth headers
  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Search users API
  useEffect(() => {
    if (selectedUser) return; // Nếu đã chọn thì không search

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/admin/users?limit=15&search=${encodeURIComponent(query)}`, {
        headers: getHeaders(),
      })
        .then((res) => res.json())
        .then((data) => {
          let list: AdminUserItem[] = data.users || [];
          if (excludeRoles.length > 0) {
            list = list.filter((u) => !excludeRoles.includes(u.role));
          }
          setUsers(list);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedUser]);

  // Click outside để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (user: AdminUserItem) => {
    onSelect(user);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
  };

  // Nếu đã chọn một người dùng -> Hiển thị thẻ thông tin đã chọn
  if (selectedUser) {
    const displayName = selectedUser.profile?.full_name || selectedUser.username;
    return (
      <div className="flex items-center justify-between p-3 bg-zinc-950 border border-blue-500/50 rounded-xl shadow-inner animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative border border-blue-500/30 shrink-0">
            {selectedUser.profile?.avatar ? (
              <Image
                src={selectedUser.profile.avatar}
                alt={selectedUser.username}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <UserIcon size={18} />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{displayName}</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-zinc-800 text-blue-400 border border-zinc-700">
                {selectedUser.role}
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-0.5">
              @{selectedUser.username} · {selectedUser.email}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700 transition-colors"
        >
          <X size={13} /> Chọn người khác
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Box */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-inner"
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4 animate-spin pointer-events-none" />
        ) : query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Dropdown Options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto custom-dark-scrollbar divide-y divide-zinc-800/60 origin-top"
          >
            {loading && users.length === 0 ? (
              <div className="p-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Đang tìm kiếm...
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                Không tìm thấy người dùng nào phù hợp.
              </div>
            ) : (
              users.map((u) => {
                const disp = u.profile?.full_name || u.username;
                return (
                  <div
                    key={u._id}
                    onClick={() => handleSelect(u)}
                    className="flex items-center justify-between p-3 hover:bg-blue-600/10 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden relative border border-zinc-700 shrink-0">
                        {u.profile?.avatar ? (
                          <Image src={u.profile.avatar} alt={u.username} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <UserIcon size={14} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs truncate group-hover:text-blue-400">
                            {disp}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {u.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono truncate">
                          @{u.username} · {u.email}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded bg-zinc-800 group-hover:bg-blue-600 text-zinc-300 group-hover:text-white text-xs font-medium transition-colors shrink-0"
                    >
                      Chọn
                    </button>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
