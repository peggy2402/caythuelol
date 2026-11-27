'use client';

import React from 'react';
import { Shield, X, Globe, ChevronsUpDown, Loader2 } from 'lucide-react';
import ServerFlag from '@/components/ServerFlag';
import { getServerByCode } from '@/lib/servers';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    username: string;
    password: string;
    platform: string;
    server: string;
    note: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      username: string;
      password: string;
      platform: string;
      server: string;
      note: string;
    }>
  >;
  onOpenServerModal: () => void;
  isSubmitting: boolean;
  onSave: () => void;
}

export default function EditAccountModal({
  isOpen,
  onClose,
  form,
  setForm,
  onOpenServerModal,
  isSubmitting,
  onSave,
}: EditAccountModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Chỉnh sửa tài khoản Game</h3>
              <p className="text-xs text-zinc-400">Cập nhật ID, mật khẩu hoặc ghi chú cho Booster</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded-lg cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Tên đăng nhập / ID:</label>
              <input
                type="text"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-blue-500 outline-none"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="Username..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Mật khẩu game:</label>
              <input
                type="text"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-blue-500 outline-none"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Mật khẩu..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Nền tảng:</label>
              <input
                type="text"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 outline-none uppercase"
                value={form.platform}
                onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value }))}
                placeholder="Riot / Steam / Garena..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5 flex items-center justify-between">
                <span>Máy chủ (Server):</span>
                <span
                  onClick={onOpenServerModal}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  Chọn từ danh sách
                </span>
              </label>
              <button
                type="button"
                onClick={onOpenServerModal}
                className="w-full bg-zinc-950 border border-zinc-700 hover:border-zinc-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-blue-500 outline-none flex items-center justify-between transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getServerByCode(form.server) ? (
                    <>
                      <ServerFlag code={getServerByCode(form.server)?.code} size="sm" />
                      <span className="font-semibold text-white truncate">
                        {getServerByCode(form.server)?.name}
                      </span>
                      <span className="text-[11px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-white/5 font-mono shrink-0">
                        {getServerByCode(form.server)?.code}
                      </span>
                    </>
                  ) : form.server ? (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-zinc-400" />
                      <span className="font-mono text-white font-bold">{form.server}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Globe className="w-4 h-4 text-zinc-500" />
                      <span>Chọn máy chủ (VN, SEA, KR...)...</span>
                    </div>
                  )}
                </div>
                <ChevronsUpDown className="w-4 h-4 text-zinc-400 group-hover:text-white shrink-0 ml-2 transition-colors" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Ghi chú thêm cho Booster:</label>
            <textarea
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none h-20"
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Ví dụ: Chỉ cày sau 23h đêm, không tiêu Tinh Hoa Lam..."
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            onClick={onSave}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
