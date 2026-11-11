'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Swords,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Trophy,
  Target,
  TrendingUp,
  Zap,
  Medal,
  Users,
  Banknote,
  type LucideIcon,
} from 'lucide-react';

export interface ServiceItem {
  key: string;
  name: string;
  gameTag: string;
  category: 'RANK' | 'OTHER';
  desc: string;
  href: string;
  iconName: string;
  badgeBg: string;
  cardBg: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Swords,
  TrendingUp,
  Target,
  Medal,
  Zap,
  Users,
  Banknote,
};

interface BoosterServicesListProps {
  services: ServiceItem[];
  boosterName: string;
}

const ITEMS_PER_PAGE = 4; // 2x2 grid for perfect visual symmetry

export default function BoosterServicesList({
  services,
  boosterName,
}: BoosterServicesListProps) {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'RANK' | 'OTHER'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter services by category
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'ALL') return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE) || 1;

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Reset to page 1 when category changes
  const handleCategoryChange = (cat: 'ALL' | 'RANK' | 'OTHER') => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  // Paginated items
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredServices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredServices, currentPage]);

  const rankCount = services.filter((s) => s.category === 'RANK').length;
  const otherCount = services.filter((s) => s.category === 'OTHER').length;

  return (
    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
            <Swords size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">Dịch vụ cung cấp</h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                {services.length}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Chọn dịch vụ để đặt hàng trực tiếp cùng Booster {boosterName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300">
            <Gamepad2 size={13} className="text-blue-400" />
            LMHT
          </span>

          {/* Quick Pagination Arrows in Header */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 transition-all"
                title="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-zinc-300">
                {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 transition-all"
                title="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => handleCategoryChange('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/60'
          }`}
        >
          Tất cả ({services.length})
        </button>

        {rankCount > 0 && (
          <button
            type="button"
            onClick={() => handleCategoryChange('RANK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'RANK'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/60'
            }`}
          >
            ⚔️ Cày Rank & Elo ({rankCount})
          </button>
        )}

        {otherCount > 0 && (
          <button
            type="button"
            onClick={() => handleCategoryChange('OTHER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'OTHER'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/60'
            }`}
          >
            🎯 Kỹ Năng & Khác ({otherCount})
          </button>
        )}
      </div>

      {/* Services Grid (Fixed 2x2 layout per page) */}
      {paginatedServices.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm">Không có dịch vụ trong danh mục này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 min-h-[240px]">
          {paginatedServices.map((svc) => {
            const ServiceIcon = ICON_MAP[svc.iconName] || Swords;
            return (
              <Link
                key={svc.key}
                href={svc.href}
                className={`group flex flex-col justify-between p-4 rounded-xl border border-white/10 bg-zinc-950/60 transition-all duration-200 ${svc.cardBg} hover:-translate-y-0.5 hover:shadow-lg shadow-sm`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${svc.badgeBg}`}>
                      {svc.gameTag}
                    </span>
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 group-hover:text-white group-hover:scale-105 transition-all">
                      <ServiceIcon size={16} />
                    </div>
                  </div>

                  <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors line-clamp-1">
                    {svc.name}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {svc.desc}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                  <span>Đặt dịch vụ ngay</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom Pagination Controls & Indicator */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePageChange(idx + 1)}
                className={`h-2 rounded-full transition-all ${
                  currentPage === idx + 1
                    ? 'w-6 bg-blue-500 shadow-sm shadow-blue-500/50'
                    : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                }`}
                title={`Trang ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-xs font-medium text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
              <span>Trang trước</span>
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-xs font-medium text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span>Trang sau</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
