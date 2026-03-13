'use client';

import { MessageSquare, Link as LinkIcon, Gamepad2, FileText, Info } from 'lucide-react';

interface CoachingAdditionalInfoProps {
  coachingType: string;
  riotId: string;
  setRiotId: (val: string) => void;
  discordId: string;
  setDiscordId: (val: string) => void;
  vodLink: string;
  setVodLink: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
}

export default function CoachingAdditionalInfo({
  coachingType,
  riotId, setRiotId,
  discordId, setDiscordId,
  vodLink, setVodLink,
  note, setNote
}: CoachingAdditionalInfoProps) {

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            Thông tin bổ sung
        </h3>
        
        <div className="space-y-4">
            {/* Discord ID (Luôn hiện vì cần liên lạc) */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Discord ID / Username <span className="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    value={discordId} 
                    onChange={e => setDiscordId(e.target.value)} 
                    className={`w-full bg-zinc-900/50 border rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all ${!discordId ? 'border-blue-500/30' : 'border-white/10'}`} 
                    placeholder="VD: user#1234 hoặc username" 
                />
                <p className="text-[10px] text-zinc-500">Booster sẽ liên hệ với bạn qua Discord để bắt đầu buổi học.</p>
            </div>

            {/* Input riêng cho VOD REVIEW */}
            {coachingType === 'VOD_REVIEW' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> Link Video Match (Youtube/Drive) <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        value={vodLink} 
                        onChange={e => setVodLink(e.target.value)} 
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all" 
                        placeholder="https://youtu.be/..." 
                    />
                    <p className="text-[10px] text-zinc-500">Gửi link trận đấu bạn muốn phân tích. Đảm bảo video ở chế độ công khai hoặc không công khai.</p>
                </div>
            )}

            {/* Input riêng cho LIVE & DUO */}
            {['LIVE_COACHING', 'DUO_COACHING'].includes(coachingType) && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                        <Gamepad2 className="w-3 h-3" /> Riot ID (Ingame) <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        value={riotId} 
                        onChange={e => setRiotId(e.target.value)} 
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all" 
                        placeholder="VD: Faker#VN2" 
                    />
                    <p className="text-[10px] text-zinc-500">
                        {coachingType === 'DUO_COACHING' 
                            ? 'Booster sẽ kết bạn để mời vào phòng.' 
                            : 'Booster có thể cần xem lịch sử đấu hoặc Spectate bạn.'}
                    </p>
                </div>
            )}

            {/* Ghi chú thêm */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Ghi chú cho Booster (Tùy chọn)
                </label>
                <textarea 
                    value={note} 
                    onChange={e => setNote(e.target.value)} 
                    className="w-full h-24 bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all resize-none" 
                    placeholder="VD: Tôi muốn tập trung cải thiện khả năng đi đường..." 
                />
            </div>
        </div>
    </div>
  );
}
