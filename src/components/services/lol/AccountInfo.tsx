// src/components/services/lol/AccountInfo.tsx
'use client';

import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const ACCOUNT_TYPES = [
    { id: 'RIOT', name: 'Riot' },
    { id: 'GOOGLE', name: 'Google' },
    { id: 'FACEBOOK', name: 'Facebook' },
    { id: 'APPLE', name: 'Apple' },
    { id: 'XBOX', name: 'Xbox' },
    { id: 'PLAYSTATION', name: 'PlayStation' }
];

const SERVER_NAMES: Record<string, string> = {
  'VN': 'Việt Nam',
  'KR': 'Hàn Quốc',
  'JP': 'Nhật Bản',
  'NA': 'Bắc Mỹ',
  'EUW': 'Tây Âu',
  'EUNE': 'Đông – Bắc Âu',
  'OCE': 'Châu Đại Dương',
  'RU': 'Nga',
  'TR': 'Thổ Nhĩ Kỳ',
  'BR': 'Brasil',
  'LAN': 'Bắc Mỹ La-tinh',
  'LAS': 'Nam Mỹ La-tinh',
  'PH': 'Philippines',
  'SG': 'Singapore, Malaysia, Indonesia',
  'TH': 'Thái Lan',
  'TW': 'Đài Bắc Trung Hoa',
  'ME': 'Trung Đông'
};

interface AccountInfoProps {
  accountType: string;
  setAccountType: (val: string) => void;
  server: string;
  setServer: (val: string) => void;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  servers?: string[];
  disabled?: boolean;
}

export default function AccountInfo({
  accountType, setAccountType,
  server, setServer,
  username, setUsername,
  password, setPassword,
  servers = [],
  disabled = false
}: AccountInfoProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4">Thông tin tài khoản</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Loại tài khoản</label>
                <div className="relative">
                    <select value={accountType} onChange={e => setAccountType(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all font-medium">
                        {ACCOUNT_TYPES.map(t => <option key={t.id} value={t.id} className="bg-zinc-900">{t.name}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Server</label>
                <div className="relative">
                    <select value={server} onChange={e => setServer(e.target.value)} disabled={disabled} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all font-medium disabled:opacity-50">
                        <option value="" disabled>-- Chọn server --</option>
                        {servers.map((s: string) => (
                            <option key={s} value={s} className="bg-zinc-900">{SERVER_NAMES[s] || s}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Tài khoản</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={`w-full bg-zinc-900/50 border rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none ${username && username.length < 3 ? 'border-red-500/50' : 'border-white/10'}`} placeholder="Tên đăng nhập" />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Mật khẩu</label>
                <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className={`w-full bg-zinc-900/50 border rounded-xl pl-4 pr-10 py-3 text-white focus:border-blue-500/50 outline-none ${password && password.length < 3 ? 'border-red-500/50' : 'border-white/10'}`} placeholder="Mật khẩu game" />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}
