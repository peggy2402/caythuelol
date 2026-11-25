'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, Search, Check } from 'lucide-react';
import ServerFlag from '@/components/ServerFlag';
import { toast } from 'sonner';
import { LOL_SERVERS, LolServer } from '../../constants/bookingConfig';

interface ServerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: string;
  onSelectServer: (serverCode: string) => void;
  servers?: LolServer[];
}

export function ServerSelectModal({
  isOpen,
  onClose,
  server,
  onSelectServer,
  servers = LOL_SERVERS,
}: ServerSelectModalProps) {
  const [serverSearchTerm, setServerSearchTerm] = useState('');
  const [serverRegionFilter, setServerRegionFilter] = useState('ALL');

  const serverRegions = useMemo(() => {
    const list = Array.from(new Set(servers.map((s) => s.region)));
    return ['ALL', ...list];
  }, [servers]);

  const filteredServers = useMemo(() => {
    return servers.filter((s) => {
      const matchRegion = serverRegionFilter === 'ALL' || s.region === serverRegionFilter;
      const q = serverSearchTerm.toLowerCase().trim();
      if (!q) return matchRegion;
      const matchQuery =
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.platformId.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q);
      return matchRegion && matchQuery;
    });
  }, [servers, serverSearchTerm, serverRegionFilter]);

  const handleClose = () => {
    onClose();
    setServerSearchTerm('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="server-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            key="server-modal-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#0e1017] border border-white/10 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-[0_25px_80px_rgba(0,0,0,0.85)] space-y-4 relative max-h-[90vh] flex flex-col will-change-transform cursor-default"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Globe size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Chọn Máy Chủ (Server)</h3>
                  <p className="text-xs text-zinc-400">
                    Mặc định là Vietnam (VN) · Hỗ trợ toàn bộ 16 máy chủ toàn cầu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Box */}
            <div className="relative shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm theo tên máy chủ (Vietnam, Korea, NA...) hoặc mã VN, KR, EUW..."
                value={serverSearchTerm}
                onChange={(e) => setServerSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Region Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {serverRegions.map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setServerRegionFilter(reg)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    serverRegionFilter === reg
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {reg === 'ALL' ? 'Tất cả khu vực' : reg}
                </button>
              ))}
            </div>

            {/* Server Grid Scrollable */}
            <div className="overflow-y-auto custom-dark-scrollbar space-y-2 pr-1 flex-1 min-h-[260px] max-h-[460px]">
              {filteredServers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredServers.map((s) => {
                    const isSelected = server === s.code;
                    return (
                      <div
                        key={s.code}
                        onClick={() => {
                          onSelectServer(s.code);
                          handleClose();
                          toast.success(`Đã chọn máy chủ ${s.name} (${s.code})`);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50 shadow-md'
                            : 'bg-zinc-950/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ServerFlag code={s.code} size="md" />
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs sm:text-sm text-white truncate">
                              {s.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono truncate">
                              {s.code} · {s.platformId} ({s.region})
                            </div>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                            <Check size={14} />
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500 hover:text-blue-400 font-semibold shrink-0">
                            Chọn
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500 space-y-2">
                  <Search className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="text-xs">Không tìm thấy máy chủ nào khớp với &quot;{serverSearchTerm}&quot;</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
              <span>{filteredServers.length} máy chủ sẵn sàng</span>
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-zinc-400 hover:text-white font-medium"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ServerSelectModal;
