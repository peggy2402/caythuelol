'use client';

import { useState } from 'react';
import { Play, Clock, AlertTriangle, CheckCircle2, Loader2, Terminal, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface CronJob {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST';
}

const CRON_JOBS: CronJob[] = [
  {
    id: 'coaching_reminder',
    name: 'Gửi Email Nhắc Nhở Coaching',
    description: 'Quét các đơn hàng Coaching sắp diễn ra trong 1 giờ tới và gửi email nhắc nhở cho Booster.',
    endpoint: '/api/cron/reminders/coaching',
    method: 'GET'
  },
  {
    id: 'order_expire',
    name: 'Hủy Đơn Hàng Quá Hạn',
    description: 'Tự động hủy và hoàn tiền các đơn hàng đã thanh toán nhưng không có Booster nhận sau 3 ngày.',
    endpoint: '/api/cron/orders/expire',
    method: 'GET'
  }
];

export default function AdminCronPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, any>>({});
  const [forceExecution, setForceExecution] = useState(false);

  const triggerCron = async (job: CronJob) => {
    setLoading(job.id);
    setLogs(prev => ({ ...prev, [job.id]: null })); // Clear old log
    
    try {
      const startTime = performance.now();
      const url = forceExecution ? `${job.endpoint}?force=true` : job.endpoint;
      const res = await fetch(url, { method: job.method });
      const data = await res.json();
      const endTime = performance.now();
      
      const duration = (endTime - startTime).toFixed(2);
      
      setLogs(prev => ({ 
        ...prev, 
        [job.id]: {
          status: res.ok ? 'success' : 'error',
          duration: `${duration}ms`,
          timestamp: new Date().toLocaleString(),
          response: data
        } 
      }));

      if (res.ok) {
        toast.success(`Chạy tác vụ "${job.name}" thành công`);
      } else {
        toast.error(`Tác vụ "${job.name}" gặp lỗi`);
      }
    } catch (error: any) {
      setLogs(prev => ({ 
        ...prev, 
        [job.id]: {
          status: 'error',
          timestamp: new Date().toLocaleString(),
          response: { error: error.message }
        } 
      }));
      toast.error(`Lỗi kết nối khi chạy tác vụ`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="w-8 h-8 text-blue-500" />
          Quản lý Cron Jobs
        </h1>
      </div>
      
      {/* Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
        <label className="flex items-center gap-3 cursor-pointer select-none group">
          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${forceExecution ? 'bg-blue-600 border-blue-600' : 'border-zinc-600 bg-zinc-800 group-hover:border-zinc-500'}`}>
            {forceExecution && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
          </div>
          <input type="checkbox" checked={forceExecution} onChange={(e) => setForceExecution(e.target.checked)} className="hidden" />
          <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Force Execution (Bỏ qua điều kiện thời gian)</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {CRON_JOBS.map((job) => (
          <div key={job.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{job.name}</h3>
                <p className="text-zinc-400 text-sm">{job.description}</p>
                <code className="text-xs text-zinc-600 mt-2 block font-mono bg-zinc-950/50 px-2 py-1 rounded w-fit">{job.method} {job.endpoint}</code>
              </div>
              <button
                onClick={() => triggerCron(job)}
                disabled={loading === job.id}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 shrink-0"
              >
                {loading === job.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : forceExecution ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                {forceExecution ? 'Retry / Force' : 'Chạy ngay'}
              </button>
            </div>

            {logs[job.id] && (
              <div className={`mt-4 rounded-lg border p-4 text-xs font-mono overflow-x-auto ${logs[job.id].status === 'success' ? 'bg-green-950/10 border-green-500/20 text-green-300' : 'bg-red-950/10 border-red-500/20 text-red-300'}`}>
                 <div className="flex justify-between items-center mb-2 opacity-70 border-b border-white/10 pb-2">
                    <span className="flex items-center gap-2"><Terminal className="w-3 h-3" /> Console Output</span>
                    <span>{logs[job.id].timestamp} ({logs[job.id].duration})</span>
                 </div>
                 <pre>{JSON.stringify(logs[job.id].response, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}