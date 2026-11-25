'use client';

import React from 'react';
import { Shield, Pencil, Eye, EyeOff, Lock } from 'lucide-react';

interface OrderAccountCardProps {
  order: any;
  isCustomer: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  onOpenEditAccount: () => void;
}

export default function OrderAccountCard({
  order,
  isCustomer,
  showPassword,
  setShowPassword,
  onOpenEditAccount,
}: OrderAccountCardProps) {
  const username =
    order.details?.account_info?.username ||
    order.details?.account_username ||
    order.account_credentials?.username ||
    'Chưa cập nhật';
  const rawPassword =
    order.details?.account_info?.password ||
    order.details?.account_password ||
    order.account_credentials?.password ||
    '';
  const platform =
    order.details?.account_info?.platform ||
    order.details?.account_type ||
    order.account_credentials?.platform ||
    'RIOT';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-zinc-400 uppercase flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" /> Tài khoản Game
        </h3>
        {isCustomer && ['PENDING_PAYMENT', 'PAID'].includes(order.status) && (
          <button
            onClick={onOpenEditAccount}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
        <div>
          <span className="text-xs text-zinc-500 block">Nền tảng / Loại tài khoản</span>
          <span className="font-medium text-white uppercase">{platform}</span>
        </div>
        <div>
          <span className="text-xs text-zinc-500 block">Tên tài khoản / Đăng nhập</span>
          <span className="font-mono text-cyan-300 font-bold text-sm">{username}</span>
        </div>
        <div>
          <span className="text-xs text-zinc-500 block">Mật khẩu</span>
          <div className="font-mono text-white flex items-center gap-2">
            <span>{showPassword ? rawPassword || '••••••••' : '••••••••'}</span>
            {rawPassword ? (
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            ) : (
              <Lock className="w-3 h-3 text-zinc-600" />
            )}
          </div>
        </div>
        <div>
          <span className="text-xs text-zinc-500 block">Máy chủ (Server)</span>
          <span className="text-white font-medium">{order.details?.server || 'Mặc định'}</span>
        </div>
        <div>
          <span className="text-xs text-zinc-500 block">Chế độ</span>
          <span className="text-white">
            {['SOLO', 'SOLO_DUO'].includes(order.details?.queue_type || order.details?.queueType)
              ? 'Đơn / Đôi'
              : (order.details?.queue_type || order.details?.queueType) === 'FLEX'
              ? 'Linh Hoạt'
              : order.details?.queue_type || order.details?.queueType || 'Mặc định'}
          </span>
        </div>
        {order.details?.note && (
          <div className="md:col-span-2 pt-2 border-t border-zinc-900">
            <span className="text-xs text-zinc-500 block">Ghi chú</span>
            <p className="text-xs text-zinc-300 bg-zinc-900/60 p-2.5 rounded-lg border border-white/5 mt-1">
              {order.details.note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
