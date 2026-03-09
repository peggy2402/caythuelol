'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Clock, FileText, User, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const res = await fetch(`/api/admin/transactions/${id}`);
        const data = await res.json();
        if (res.ok) {
          setTransaction(data.transaction);
        } else {
          toast.error(data.error || 'Không tìm thấy giao dịch');
          router.push('/admin/transactions');
        }
      } catch (error) {
        toast.error('Lỗi kết nối');
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [id, router]);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!transaction) return null;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Chi tiết Giao dịch</h1>
            <p className="text-zinc-400 text-sm font-mono">#{transaction._id}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
            transaction.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
            transaction.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
            'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            {transaction.status}
          </span>
        </div>

        <div className="p-6 space-y-8">
          {/* Amount & Type */}
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="text-sm text-zinc-500 mb-1">Số tiền</div>
              <div className={`text-2xl font-bold ${['DEPOSIT', 'PAYMENT_RELEASE', 'REFUND'].includes(transaction.type) ? 'text-green-500' : 'text-red-500'}`}>
                {['DEPOSIT', 'PAYMENT_RELEASE', 'REFUND'].includes(transaction.type) ? '+' : ''}{formatCurrency(transaction.amount)}
              </div>
            </div>
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <div className="text-sm text-zinc-500 mb-1">Loại giao dịch</div>
              <div className="text-lg font-bold text-white">{transaction.type}</div>
            </div>
          </div>

          {/* User Info */}
          <div>
            <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Thông tin người dùng
            </h3>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                {transaction.userId?.profile?.avatar ? (
                  <img src={transaction.userId.profile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : <User className="w-6 h-6" />}
              </div>
              <div>
                <div className="font-bold text-white">{transaction.userId?.username || 'Unknown'}</div>
                <div className="text-sm text-zinc-500">{transaction.userId?.email}</div>
              </div>
              <Link href={`/admin/users/${transaction.userId?._id}`} className="ml-auto text-sm text-blue-400 hover:underline">
                Xem hồ sơ
              </Link>
            </div>
          </div>

          {/* Related Order */}
          {transaction.orderId && (
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Đơn hàng liên quan
              </h3>
              <Link href={`/orders/${transaction.orderId}`} className="block bg-zinc-950 p-4 rounded-xl border border-zinc-800 hover:border-blue-500/50 transition-colors group">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                      Đơn hàng #{transaction.orderId.toString().slice(-6).toUpperCase()}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">Bấm để xem chi tiết</div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-zinc-600 rotate-180 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            </div>
          )}

          {/* Metadata */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Dữ liệu bổ sung (Metadata)
              </h3>
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 overflow-x-auto">
                <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">
                  {JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
