'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export type UserRole = 'ADMIN' | 'STAFF' | 'BOOSTER' | 'CUSTOMER' | string;
export type VipTier = 'SILVER' | 'GOLD' | 'DIAMOND' | 'VIP Bạc' | 'VIP Vàng' | 'VIP Kim Cương' | string;

export interface UserBadgeProps {
  role?: UserRole;
  vipTier?: VipTier;
  totalSpent?: number;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  tooltipText?: string;
  tooltipPosition?: 'auto' | 'top' | 'bottom';
}

export function getUserBadgeConfig(
  role?: UserRole,
  vipTier?: VipTier,
  totalSpent?: number,
  customTooltip?: string
) {
  const normalizedRole = (role || 'CUSTOMER').toUpperCase();

  if (normalizedRole === 'ADMIN') {
    return {
      src: '/images/icons/admin.png',
      alt: 'Super Admin',
      tooltip: customTooltip || 'Super Admin - Quản trị viên tối cao',
    };
  }

  if (normalizedRole === 'STAFF') {
    return {
      src: '/images/icons/staff.png',
      alt: 'Staff',
      tooltip: customTooltip || 'Ban Điều Hành / Staff',
    };
  }

  if (normalizedRole === 'BOOSTER') {
    return {
      src: '/images/icons/booster.png',
      alt: 'Verified Booster',
      tooltip: customTooltip || 'Đã được xác minh',
    };
  }

  // Customer VIP logic
  const normVip = (vipTier || '').toUpperCase();
  const spent = typeof totalSpent === 'number' ? totalSpent : 0;

  if (normVip.includes('DIAMOND') || normVip.includes('KIM CƯƠNG') || spent >= 5000000) {
    return {
      src: '/images/icons/customer-vip-diamond.png',
      alt: 'VIP Kim Cương',
      tooltip: customTooltip || 'VIP Kim Cương - Khách hàng thượng lưu',
    };
  }

  if (normVip.includes('GOLD') || normVip.includes('VÀNG') || spent >= 2000000) {
    return {
      src: '/images/icons/customer-vip-gold.png',
      alt: 'VIP Vàng',
      tooltip: customTooltip || 'VIP Vàng - Khách hàng thân thiết',
    };
  }

  if (normVip.includes('SILVER') || normVip.includes('BẠC') || spent >= 500000) {
    return {
      src: '/images/icons/customer-vip-silver.png',
      alt: 'VIP Bạc',
      tooltip: customTooltip || 'VIP Bạc - Khách hàng tích cực',
    };
  }

  if (normVip.includes('VIP')) {
    return {
      src: '/images/icons/customer-vip.png',
      alt: 'VIP Member',
      tooltip: customTooltip || 'Khách hàng VIP',
    };
  }

  return {
    src: '/images/icons/customer.png',
    alt: 'Khách hàng thành viên',
    tooltip: customTooltip || 'Khách hàng thành viên',
  };
}

const SIZE_MAP: Record<string, number> = {
  xs: 15,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
};

export default function UserBadge({
  role = 'CUSTOMER',
  vipTier,
  totalSpent,
  size = 'sm',
  className = '',
  tooltipText,
  tooltipPosition = 'auto',
}: UserBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [placement, setPlacement] = useState<'center' | 'left' | 'right'>('center');
  const [vPlacement, setVPlacement] = useState<'top' | 'bottom'>('top');
  const badgeRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 18;
  const config = getUserBadgeConfig(role, vipTier, totalSpent, tooltipText);

  const checkPosition = () => {
    if (badgeRef.current && typeof window !== 'undefined') {
      const rect = badgeRef.current.getBoundingClientRect();
      const tooltipEstimateWidth = 240; // Ước lượng độ rộng tooltip
      const halfWidth = tooltipEstimateWidth / 2;

      // Xử lý vị trí ngang (tránh tràn mép trái/phải)
      if (rect.left < halfWidth) {
        setPlacement('left'); // Lệch sang phải khi nằm quá sát mép trái
      } else if (window.innerWidth - rect.right < halfWidth) {
        setPlacement('right'); // Lệch sang trái khi nằm quá sát mép phải
      } else {
        setPlacement('center');
      }

      // Xử lý vị trí dọc (tránh bị khuất khi nằm sát đỉnh màn hình/Topbar)
      if (tooltipPosition === 'bottom' || (tooltipPosition !== 'top' && rect.top < 65)) {
        setVPlacement('bottom');
      } else {
        setVPlacement('top');
      }
    }
  };

  const handleMouseEnter = () => {
    checkPosition();
    setShowTooltip(true);
  };

  const handleTrigger = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    checkPosition();
    setShowTooltip((prev) => !prev);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span
      ref={badgeRef}
      className={`relative inline-flex items-center justify-center shrink-0 cursor-pointer select-none group align-middle ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleTrigger}
    >
      <img
        src={config.src}
        alt={config.alt}
        width={pixelSize}
        height={pixelSize}
        className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-transform duration-200 group-hover:scale-110 active:scale-95 inline-block"
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
      />

      {/* Floating Tooltip */}
      {showTooltip && (
        <span
          className={`absolute px-2.5 py-1 rounded-lg bg-zinc-900/95 border border-white/15 text-white text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5 ${
            vPlacement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
          } ${
            placement === 'left'
              ? 'left-0 translate-x-0'
              : placement === 'right'
              ? 'right-0 left-auto translate-x-0'
              : 'left-1/2 -translate-x-1/2'
          }`}
          style={{ minWidth: 'max-content' }}
        >
          <span>{config.tooltip}</span>
          <span
            className={`absolute border-4 border-transparent ${
              vPlacement === 'bottom'
                ? 'bottom-full border-b-zinc-900'
                : 'top-full border-t-zinc-900'
            } ${
              placement === 'left'
                ? 'left-3 translate-x-0'
                : placement === 'right'
                ? 'right-3 left-auto translate-x-0'
                : 'left-1/2 -translate-x-1/2'
            }`}
          />
        </span>
      )}
    </span>
  );
}

/**
 * Component hiển thị Tên + Huy hiệu + Username có cấu trúc chuẩn
 * layout="stacked": Tên + Huy hiệu ở hàng 1, @username ở hàng 2
 * layout="inline": Tên + Huy hiệu + @username ở cùng 1 hàng
 */
export function UserNameWithBadge({
  name,
  username,
  role = 'CUSTOMER',
  vipTier,
  totalSpent,
  badgeSize = 'sm',
  layout = 'inline',
  className = '',
  nameClassName = 'font-bold text-white',
  usernameClassName = 'text-xs text-zinc-400 font-mono',
}: {
  name: string;
  username?: string;
  role?: UserRole;
  vipTier?: VipTier;
  totalSpent?: number;
  badgeSize?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'inline' | 'stacked';
  className?: string;
  nameClassName?: string;
  usernameClassName?: string;
}) {
  if (layout === 'stacked') {
    return (
      <div className={`flex flex-col min-w-0 ${className}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`truncate ${nameClassName}`}>{name}</span>
          <UserBadge role={role} vipTier={vipTier} totalSpent={totalSpent} size={badgeSize} />
        </div>
        {username && (
          <span className={`truncate ${usernameClassName}`}>
            @{username.replace(/^@/, '')}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 min-w-0 ${className}`}>
      <span className={`truncate ${nameClassName}`}>{name}</span>
      <UserBadge role={role} vipTier={vipTier} totalSpent={totalSpent} size={badgeSize} />
      {username && (
        <span className={`truncate ${usernameClassName}`}>
          @{username.replace(/^@/, '')}
        </span>
      )}
    </div>
  );
}
