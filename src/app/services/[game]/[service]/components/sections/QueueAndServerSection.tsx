import React from 'react';
import { Swords, Users, ChevronDown } from 'lucide-react';
import ServerFlag from '@/components/ServerFlag';
import { LolServer } from '../../constants/bookingConfig';

interface QueueAndServerSectionProps {
  isValorant: boolean;
  isAov: boolean;
  isMatches: boolean;
  isPlacements: boolean;
  queueType: string;
  setQueueType: (q: string) => void;
  currentServerObj: LolServer;
  setIsServerModalOpen: (open: boolean) => void;
}

export function QueueAndServerSection({
  isValorant,
  isAov,
  isMatches,
  isPlacements,
  queueType,
  setQueueType,
  currentServerObj,
  setIsServerModalOpen,
}: QueueAndServerSectionProps) {
  if (isValorant || isAov || isMatches || isPlacements) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Loại Hàng Đợi */}
      <div>
        <label className="text-xs font-bold text-zinc-300 block mb-2">
          Loại xếp hạng <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setQueueType('SOLO_DUO')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              queueType === 'SOLO_DUO'
                ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/40'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Swords size={13} />
            <span>Đơn / Đôi</span>
          </button>
          <button
            type="button"
            onClick={() => setQueueType('FLEX')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              queueType === 'FLEX'
                ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/40'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Users size={13} />
            <span>Linh Hoạt (Flex)</span>
          </button>
        </div>
      </div>

      {/* Chọn Server (Modal Popup giữa màn hình) */}
      <div>
        <label className="text-xs font-bold text-zinc-300 block mb-2 flex items-center justify-between">
          <span>
            Chọn Máy Chủ (Server) <span className="text-red-500">*</span>
          </span>
          <span
            className="text-[11px] text-blue-400 cursor-pointer font-semibold"
            onClick={() => setIsServerModalOpen(true)}
          >
            16 máy chủ
          </span>
        </label>
        <button
          type="button"
          onClick={() => setIsServerModalOpen(true)}
          className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium flex items-center justify-between transition-all group shadow-inner cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <ServerFlag code={currentServerObj.code} size="sm" />
            <span className="font-bold truncate text-white">{currentServerObj.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
              {currentServerObj.code} · {currentServerObj.platformId}
            </span>
          </div>
          <ChevronDown
            size={14}
            className="text-zinc-500 group-hover:text-white shrink-0 ml-1 transition-colors"
          />
        </button>
      </div>
    </div>
  );
}

export default QueueAndServerSection;
