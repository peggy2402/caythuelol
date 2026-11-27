// src/app/(dashboard)/booster/services/components/BoosterChampionPoolSection.tsx
'use client';

import React from 'react';
import { Shield, Plus, X } from 'lucide-react';

interface BoosterChampionPoolSectionProps {
  playingChampions: string[];
  allChampionsList: any[];
  onOpenModal: () => void;
  onRemoveChampion: (champName: string) => void;
}

export const BoosterChampionPoolSection: React.FC<BoosterChampionPoolSectionProps> = ({
  playingChampions,
  allChampionsList,
  onOpenModal,
  onRemoveChampion,
}) => {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Shield size={18} className="text-cyan-400" />
            <span>5. Bể Tướng Tủ Sở Trường (Champion Pool)</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Chọn các tướng bạn tự tin đạt tỷ lệ thắng cao nhất (3 – 10 tướng). Khách hàng sẽ nhìn thấy danh sách này trên hồ sơ cá nhân và được gợi ý ưu tiên chọn khi đặt gói &quot;Tùy chọn tướng (+30%)&quot;.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition-all cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
        >
          <Plus size={15} />
          <span>{playingChampions.length > 0 ? 'Thêm / Đổi tướng tủ' : '+ Chọn tướng tủ'}</span>
        </button>
      </div>

      {/* Danh sách tướng tủ hiện tại */}
      {playingChampions.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">
              Đang cấu hình: <strong className="text-white font-bold">{playingChampions.length}/10</strong> tướng tủ
            </span>
            <span className="text-[11px] text-cyan-400 font-bold">
              ✓ Đã đồng bộ lên hồ sơ công khai &amp; gợi ý khi khách đặt đơn
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {playingChampions.map((champName) => {
              const champObj = allChampionsList.find(
                (c) =>
                  c.name?.toLowerCase() === champName?.toLowerCase() ||
                  c.id?.toLowerCase() === champName?.toLowerCase()
              );
              return (
                <div
                  key={champName}
                  className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-cyan-500/40 flex items-center gap-3 transition-colors group relative"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-cyan-400/40 shrink-0 bg-zinc-900 shadow-inner">
                    {champObj?.imageUrl ? (
                      <img
                        src={champObj.imageUrl}
                        alt={champName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-cyan-400 bg-zinc-800">
                        {champName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-black text-white block truncate">
                      {champObj?.name || champName}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {champObj?.tags?.join(', ') || 'Tướng tủ'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveChampion(champName)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Xóa tướng này"
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          onClick={onOpenModal}
          className="p-8 border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 text-center cursor-pointer bg-zinc-950/30 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Shield size={24} />
          </div>
          <span className="text-sm font-bold text-white group-hover:text-cyan-300">
            Bạn chưa cấu hình Tướng tủ nào
          </span>
          <span className="text-xs text-zinc-400 max-w-md">
            Bấm vào đây để chọn các vị tướng bạn có kỹ năng cao nhất. Tướng tủ sẽ được hiển thị với huy hiệu nổi bật trên hồ sơ Booster và được gợi ý cho khách hàng.
          </span>
        </div>
      )}
    </div>
  );
};
