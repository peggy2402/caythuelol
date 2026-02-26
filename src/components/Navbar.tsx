'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Menu, 
  User, 
  Wallet, 
  History, 
  LogOut, 
  LayoutDashboard, 
  ChevronDown,
  FileText
} from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Kiểm tra localStorage khi component mount (chỉ chạy ở client)
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.reload(); // Reload để reset trạng thái
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md transition-all">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 overflow-hidden rounded-lg transition-transform group-hover:scale-105">
            <Image src="/logo.png" alt="CTL Logo" fill className="object-cover" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white group-hover:text-blue-400 transition-colors">
            CAYTHUE<span className="text-blue-500">LOL</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link href="/services" className="hover:text-white transition-colors">Dịch vụ</Link>
          <Link href="/boosters" className="hover:text-white transition-colors">Booster</Link>
          <Link href="/blog" className="hover:text-white transition-colors">Tin tức</Link>
          
          {user ? (
            <div className="relative ml-4">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 rounded-full border border-white/10 bg-zinc-900/50 py-1.5 pl-2 pr-4 transition-colors hover:bg-zinc-800 hover:border-blue-500/30"
              >
                <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[1px]">
                   <div className="h-full w-full rounded-full bg-zinc-950 flex items-center justify-center">
                      {user.profile?.avatar ? (
                        <Image src={user.profile.avatar} alt="Avatar" width={32} height={32} className="rounded-full" />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                   </div>
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white leading-none mb-1">{user.username}</div>
                  <div className="text-[10px] font-medium text-blue-400 leading-none">
                    {user.wallet_balance?.toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-xl shadow-black/50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Vai trò</p>
                    <p className="text-sm font-medium text-blue-400">{user.role}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                    <Link href="/dashboard/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                      <User className="h-4 w-4" /> Hồ sơ
                    </Link>
                    <Link href="/dashboard/wallet" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                      <Wallet className="h-4 w-4" /> Nạp tiền
                    </Link>
                    <Link href="/dashboard/orders" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                      <FileText className="h-4 w-4" /> Đơn hàng
                    </Link>
                    <Link href="/dashboard/orders" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                      <History className="h-4 w-4" /> Lịch sử đặt hàng
                    </Link>
                  </div>

                  <div className="mt-1 border-t border-white/5 pt-1">
                    <button 
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="hover:text-white transition-colors">Đăng nhập</Link>
              <Link
                href="/dashboard"
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/40 hover:-translate-y-0.5"
              >
                Thuê Ngay
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 text-zinc-400 hover:text-white">
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      {/* Overlay click to close dropdown */}
      {isDropdownOpen && <div className="fixed inset-0 z-[-1]" onClick={() => setIsDropdownOpen(false)} />}
    </header>
  );
}