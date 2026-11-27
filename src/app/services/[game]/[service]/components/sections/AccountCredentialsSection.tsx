import React from 'react';
import { ChevronDown } from 'lucide-react';
import { ProviderLogo } from '../ProviderLogo';

interface AccountCredentialsSectionProps {
  setIsAccountTypeModalOpen: (open: boolean) => void;
  accountType: string;
  currentAccountTypeObj: { id: string; name: string };
  isAov: boolean;
  ingameAccount: string;
  setIngameAccount: (val: string) => void;
  ingamePassword: string;
  setIngamePassword: (val: string) => void;
  orderNote: string;
  setOrderNote: (val: string) => void;
}

export function AccountCredentialsSection({
  setIsAccountTypeModalOpen,
  accountType,
  currentAccountTypeObj,
  isAov,
  ingameAccount,
  setIngameAccount,
  ingamePassword,
  setIngamePassword,
  orderNote,
  setOrderNote,
}: AccountCredentialsSectionProps) {
  return (
    <div className="pt-2 border-t border-zinc-800/80">
      <span className="text-xs font-bold text-zinc-300 block mb-3 uppercase tracking-wider">
        Thông tin tài khoản cần cày
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Nút Chọn Loại Tài Khoản (Modal Popup) */}
        <div className="sm:col-span-4">
          <label className="text-xs font-semibold text-zinc-400 block mb-1">
            Loại Tài Khoản <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsAccountTypeModalOpen(true)}
            className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white flex items-center justify-between transition-colors shadow-inner group cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                <ProviderLogo provider={accountType} className="w-4 h-4 object-contain" />
              </div>
              <span className="font-bold truncate text-white">{currentAccountTypeObj.name}</span>
            </div>
            <ChevronDown size={13} className="text-zinc-500 group-hover:text-white shrink-0 ml-1 transition-colors" />
          </button>
        </div>

        <div className="sm:col-span-4">
          <label className="text-xs font-semibold text-zinc-400 block mb-1">
            Tài khoản cần cày <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder={
              isAov
                ? accountType === 'Garena'
                  ? 'Tài khoản Garena (Tên đăng nhập / Email / SĐT)'
                  : accountType === 'Facebook'
                  ? 'Tài khoản Facebook (Email / SĐT đăng nhập)'
                  : accountType === 'Apple'
                  ? 'Apple ID / Email iCloud'
                  : accountType === 'Google'
                  ? 'Tài khoản Google (Email / Gmail)'
                  : 'Tài khoản Liên Quân cần cày'
                : 'Tên đăng nhập / Riot ID'
            }
            value={ingameAccount}
            onChange={(e) => setIngameAccount(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="sm:col-span-4">
          <label className="text-xs font-semibold text-zinc-400 block mb-1">
            Mật khẩu tài khoản <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            placeholder="Điền mật khẩu"
            value={ingamePassword}
            onChange={(e) => setIngamePassword(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="text-xs font-semibold text-zinc-400 block mb-1">
          Ghi chú thêm cho Booster (tuỳ chọn)
        </label>
        <textarea
          rows={2}
          placeholder="Ví dụ: Chỉ cày vào buổi tối sau 20h, không dùng IP lạ, chat với bạn bè..."
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors"
        />
      </div>
    </div>
  );
}

export default AccountCredentialsSection;
