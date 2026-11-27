'use client';

import { Lock, Trophy, ShieldCheck } from 'lucide-react';

export default function EscrowGuarantees() {
  const guarantees = [
    {
      icon: Lock,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/30',
      title: '100% Tiền Giữ Tại Escrow',
      description: 'Tiền cọc của bạn được đóng băng an toàn và chỉ giải ngân cho Booster khi bạn kiểm tra và xác nhận hoàn thành đơn.'
    },
    {
      icon: Trophy,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      title: 'Booster Thách Đấu Định Danh',
      description: 'Toàn bộ Booster đều được xác thực danh tính KYC, ký hợp đồng cam kết trách nhiệm và đóng quỹ bảo chứng uy tín.'
    },
    {
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      title: 'Ảo Hóa VPN & Ẩn Danh',
      description: 'Tự động gán VPN theo IP khu vực của bạn, bật chế độ Offline không hiển thị online với bạn bè trong game.'
    }
  ];

  return (
    <div className="mt-20 rounded-3xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-cyan-950/30 border border-zinc-800 p-8 backdrop-blur-xl">
      <div className="grid md:grid-cols-3 gap-6">
        {guarantees.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl border ${item.iconBg} ${item.iconColor} shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
