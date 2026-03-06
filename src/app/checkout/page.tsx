'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Wallet, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Parse Data from URL (In real app, use Context or Zustand for complex objects)
  // Here we assume params are passed as JSON string for simplicity in this demo
  const dataParam = searchParams.get('data');
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));

    if (dataParam) {
      try {
        setOrderData(JSON.parse(decodeURIComponent(dataParam)));
      } catch (e) {
        toast.error('Dữ liệu đơn hàng không hợp lệ');
        router.push('/services');
      }
    }
  }, [dataParam, router]);

  if (!orderData) return <div className="min-h-screen bg-zinc-950 pt-24 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  const { pricing, serviceType, details, booster } = orderData;
  const depositAmount = pricing.deposit_amount || 0;
  const walletBalance = user?.wallet_balance || 0;
  const isSufficient = walletBalance >= depositAmount;

  const handleConfirmPayment = async () => {
    if (!isSufficient) {
      toast.error('Số dư không đủ, vui lòng nạp thêm!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: serviceType,
          boosterId: booster?._id,
          details: details,
          options: orderData.options,
          pricing: pricing,
          queueType: orderData.queueType
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success('Thanh toán cọc thành công!');
      router.push(`/orders/${result.orderId}`);

    } catch (error: any) {
      toast.error(error.message || 'Lỗi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans pt-24 pb-20 px-4">
      <Navbar />
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <ShieldCheck className="text-green-500 w-8 h-8" />
          Xác nhận thanh toán (Escrow)
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Order Summary */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-400">Chi tiết đơn hàng</h2>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Dịch vụ</span>
                  <span className="font-bold">{serviceType}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Booster</span>
                  <span className="font-bold">{booster?.username || 'Ngẫu nhiên'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Rank hiện tại</span>
                  <span>{details.current_rank} ({details.current_lp} LP)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Mục tiêu</span>
                  <span className="text-yellow-400 font-bold">
                    {details.target_lp ? `${details.target_lp} LP` : `${details.num_games} Trận`}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6">
              <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Quy trình thanh toán đảm bảo
              </h3>
              <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                <li>Số tiền cọc sẽ được <strong>hệ thống giữ (Escrow)</strong>.</li>
                <li>Booster chỉ nhận được tiền khi hoàn thành đơn hàng.</li>
                <li>Nếu Booster hủy đơn, bạn sẽ được <strong>hoàn tiền 100%</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Right: Payment Action */}
          <div className="md:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-24">
              <div className="mb-6">
                <div className="text-zinc-400 text-sm mb-1">Tổng giá trị ước tính</div>
                <div className="text-2xl font-bold text-white">{pricing.total_amount.toLocaleString()} đ</div>
              </div>

              <div className="border-t border-zinc-800 my-4 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-300">Tiền cọc cần thanh toán:</span>
                  <span className="text-xl font-bold text-green-400">{depositAmount.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-500">
                  <span>Số dư ví:</span>
                  <span className={isSufficient ? 'text-blue-400' : 'text-red-500'}>
                    {walletBalance.toLocaleString()} đ
                  </span>
                </div>
              </div>

              {!isSufficient && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center">
                  Số dư không đủ. Vui lòng nạp thêm { (depositAmount - walletBalance).toLocaleString() } đ
                </div>
              )}

              {isSufficient ? (
                <button
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/20"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                  Xác nhận & Đặt cọc
                </button>
              ) : (
                <button
                  onClick={() => router.push('/wallet')}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Wallet /> Nạp tiền ngay
                </button>
              )}

              <p className="text-[10px] text-zinc-600 text-center mt-4">
                Bằng việc xác nhận, bạn đồng ý với điều khoản dịch vụ của chúng tôi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}