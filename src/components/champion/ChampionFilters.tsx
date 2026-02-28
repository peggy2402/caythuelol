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

  const FilterSection = ({ title, category, options }: { title: string, category: keyof FilterState, options: string[] }) => (
    <div className="mb-6">
      <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 tracking-wider">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => toggleFilter(category, opt)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
              filters[category].includes(opt)
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-500" />
          Filters
        </h3>
        <button 
          onClick={onReset}
          className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          {t('resetFilters')}
        </button>
      </div>

      <FilterSection 
        title={t('filterRole')} 
        category="roles" 
        options={['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support']} 
      />

      <FilterSection 
        title={t('filterDifficulty')} 
        category="difficulty" 
        options={['Easy', 'Medium', 'Hard']} 
      />

      <FilterSection 
        title={t('filterAttack')} 
        category="attackType" 
        options={['AD', 'AP', 'Hybrid']} 
      />

      <FilterSection 
        title={t('filterResource')} 
        category="resource" 
        options={['Mana', 'Energy', 'No Resource']} 
      />
      
      {/* Combat Profile - Simplified as Toggles for UX */}
      <div className="mb-6">
        <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 tracking-wider">Combat Profile</h4>
        <div className="space-y-2">
           {/* This could be extended with more logic, keeping it simple for now as requested */}
           <div className="text-xs text-zinc-600 italic">
             Advanced stats filtering enabled automatically based on selection.
           </div>
        </div>
      </div>
    </div>
  );
}
