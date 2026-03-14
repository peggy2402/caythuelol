import { Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function LoadingBlogs() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30 relative">
      <Navbar />
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pt-20">
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col items-center shadow-xl backdrop-blur-md">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-zinc-400 font-medium tracking-wide">Đang tải tin tức...</p>
        </div>
      </div>
    </div>
  );
}