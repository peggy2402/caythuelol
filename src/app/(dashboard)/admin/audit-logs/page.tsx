'use client';

import { useState, useEffect } from 'react';
import { Loader2, Shield, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Log {
  _id: string;
  actorId: { username: string; email: string };
  action: string;
  description: string;
  ipAddress: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${pageNum}&limit=20`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
        setPage(data.pagination.page);
      } else {
        toast.error('Lỗi tải dữ liệu');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-blue-500" /> Nhật ký hệ thống (Audit Log)
          </h1>
          <p className="text-zinc-400 text-sm">Theo dõi các thay đổi quan trọng trong hệ thống.</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Người thực hiện</th>
                <th className="px-6 py-4">Hành động</th>
                <th className="px-6 py-4">Chi tiết</th>
                <th className="px-6 py-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-full"></div></td></tr>
                ))
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{log.actorId?.username || 'Unknown'}</div>
                      <div className="text-xs text-zinc-500">{log.actorId?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 max-w-md truncate" title={log.description}>
                      {log.description}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Chưa có nhật ký nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden">
          {loading ? (
             <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500"/></div>
          ) : logs.length === 0 ? (
             <div className="p-8 text-center text-zinc-500">Chưa có nhật ký nào.</div>
          ) : (
             logs.map((log) => (
                <div key={log._id} className="p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/30 transition-colors space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white text-sm">{log.actorId?.username || 'Unknown'}</div>
                      <div className="text-xs text-zinc-500">{log.actorId?.email}</div>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {log.action}
                    </span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs space-y-2">
                     <div className="text-zinc-300 break-words">{log.description}</div>
                     <div className="flex items-center gap-2 text-zinc-500 font-mono pt-2 border-t border-zinc-800/50">
                        <span className="uppercase text-[10px]">IP:</span> {log.ipAddress}
                     </div>
                  </div>

                  <div className="flex justify-end">
                     <span className="text-xs text-zinc-500 flex items-center gap-1">
                       <Clock className="w-3 h-3" /> {new Date(log.createdAt).toLocaleString('vi-VN')}
                     </span>
                  </div>
                </div>
             ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 p-4 border-t border-zinc-800 bg-zinc-900/50">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <span className="text-sm text-zinc-400">Trang <span className="text-white font-medium">{page}</span> / {totalPages}</span>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
