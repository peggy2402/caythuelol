'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { Filter, RotateCcw } from 'lucide-react';

export interface FilterState {
  roles: string[];
  difficulty: string[];
  attackType: string[];
  resource: string[];
}

interface FilterOption {
  value: string;
  label: string;
}

interface ChampionFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
}

export default function ChampionFilters({ filters, setFilters, onReset }: ChampionFiltersProps) {
  const { t } = useLanguage();

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const roleOptions: FilterOption[] = [
    { value: 'Fighter', label: 'Đấu Sĩ' },
    { value: 'Tank', label: 'Đỡ Đòn' },
    { value: 'Mage', label: 'Pháp Sư' },
    { value: 'Assassin', label: 'Sát Thủ' },
    { value: 'Marksman', label: 'Xạ Thủ' },
    { value: 'Support', label: 'Hỗ Trợ' },
  ];

  const difficultyOptions: FilterOption[] = [
    { value: 'Easy', label: 'Dễ' },
    { value: 'Medium', label: 'Trung Bình' },
    { value: 'Hard', label: 'Khó' },
  ];

  const attackOptions: FilterOption[] = [
    { value: 'AD', label: 'Vật Lý (AD)' },
    { value: 'AP', label: 'Phép Thuật (AP)' },
    { value: 'Hybrid', label: 'Hỗn Hợp (Hybrid)' },
  ];

  const resourceOptions: FilterOption[] = [
    { value: 'Mana', label: 'Năng Lượng (Mana)' },
    { value: 'Energy', label: 'Nội Năng (Energy)' },
    { value: 'No Resource', label: 'Không Tốn' },
  ];

  const FilterSection = ({ 
    title, 
    category, 
    options 
  }: { 
    title: string; 
    category: keyof FilterState; 
    options: FilterOption[];
  }) => (
    <div className="mb-5">
      <h4 className="text-xs font-bold text-zinc-400 uppercase mb-2.5 tracking-wider">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const isSelected = filters[category].includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleFilter(category, opt.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-cyan-600/30 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>Bộ lọc tướng</span>
        </h3>
        <button 
          type="button"
          onClick={onReset}
          className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t('resetFilters') || 'Đặt lại'}</span>
        </button>
      </div>

      <FilterSection 
        title={t('filterRole') || 'Vai trò'} 
        category="roles" 
        options={roleOptions} 
      />

      <FilterSection 
        title={t('filterDifficulty') || 'Độ khó'} 
        category="difficulty" 
        options={difficultyOptions} 
      />

      <FilterSection 
        title={t('filterAttack') || 'Loại sát thương'} 
        category="attackType" 
        options={attackOptions} 
      />

      <FilterSection 
        title={t('filterResource') || 'Tài nguyên sử dụng'} 
        category="resource" 
        options={resourceOptions} 
      />
    </div>
  );
}
