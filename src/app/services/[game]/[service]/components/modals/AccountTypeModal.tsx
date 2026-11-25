'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Check, Shield } from 'lucide-react';
import { toast } from 'sonner';
import ProviderLogo from '../ProviderLogo';

interface AccountTypeItem {
  id: string;
  name: string;
  desc: string;
  badge?: string;
  logo?: string;
}

interface AccountTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountType: string;
  onSelectAccountType: (typeId: string, typeName: string) => void;
  activeAccountTypes: AccountTypeItem[];
}

export function AccountTypeModal({
  isOpen,
  onClose,
  accountType,
  onSelectAccountType,
  activeAccountTypes,
}: AccountTypeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="account-type-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="account-type-modal-panel"
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
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Chọn Loại Tài Khoản</h3>
                  <p className="text-xs text-zinc-400">
                    Chọn nền tảng tài khoản bạn dùng để đăng nhập vào game
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Provider Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto custom-dark-scrollbar py-1 pr-1">
              {activeAccountTypes.map((acc) => {
                const isSelected = accountType === acc.id;
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      onSelectAccountType(acc.id, acc.name);
                      onClose();
                      toast.success(`Đã chọn loại tài khoản ${acc.name}`);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-950/30 border-purple-500 ring-1 ring-purple-500/50 shadow-md'
                        : 'bg-zinc-950/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900/90 border border-zinc-800 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                        <ProviderLogo provider={acc.id} className="w-6 h-6 object-contain" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-xs sm:text-sm">
                            {acc.name}
                          </span>
                          {acc.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              {acc.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          {acc.desc}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/30">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
              <span className="flex items-center gap-1.5">
                <Shield size={12} className="text-emerald-400" />
                <span>Bảo mật thông tin đăng nhập tuyệt đối</span>
              </span>
              <button
                type="button"
                onClick={onClose}
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

export default AccountTypeModal;
