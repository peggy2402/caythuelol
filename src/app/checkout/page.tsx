'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Wallet, ArrowRight, AlertCircle, CheckCircle2, TicketPercent, X, Tag } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

function CheckoutContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));

    // Load data from localStorage instead of URL
    const pendingData = localStorage.getItem('pendingCheckout');
    if (pendingData) {
      setOrderData(JSON.parse(pendingData));
      // Optional: Clear data after loading to prevent reuse on refresh if desired
      // localStorage.removeItem('pendingCheckout'); 
    } else {
      toast.error('Không tìm thấy thông tin đơn hàng');
      router.push('/services');
    }
  }, [router]);

  if (!orderData) return <div className="min-h-screen bg-zinc-950 pt-24 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  const { pricing, serviceType, details, booster, options, queueType } = orderData;
  const depositAmount = pricing.deposit_amount || 0;
  const totalAmount = pricing.total_amount || 0;
  const walletBalance = user?.wallet_balance || 0;
  const isDepositService = serviceType === 'NET_WINS';
  
  // Calculate final price with discount
  let paymentAmount = isDepositService ? depositAmount : totalAmount;
  let discountValue = 0;
  if (appliedCoupon) {
      if (appliedCoupon.type === 'PERCENTAGE') {
          // Discount is applied on the total order value, not the deposit amount
          discountValue = (totalAmount * appliedCoupon.value) / 100;
      } else { // FIXED
          discountValue = appliedCoupon.value;
      }
      // Discount should not make price negative or exceed the payment amount
      discountValue = Math.min(discountValue, paymentAmount);
      paymentAmount -= discountValue;
  }

  const isSufficient = walletBalance >= paymentAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá.');
      return;
    }
    setIsApplyingCoupon(true);
    try {
      // This API needs to be created.
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            code: couponCode, 
            orderValue: totalAmount,
            boosterId: booster?._id // Gửi thêm ID của Booster để check mã của họ
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mã giảm giá không hợp lệ hoặc không thể áp dụng.');

      setAppliedCoupon(data.coupon);
      toast.success(`Áp dụng mã giảm giá thành công!`);
    } catch (error: any) {
      toast.error(error.message);
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

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
          pricing: {
            ...pricing,
            total_amount: paymentAmount, // Send the final discounted price
            coupon_code: appliedCoupon?.code,
            discount_amount: discountValue,
          },
          queueType: orderData.queueType
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success('Thanh toán thành công!');
      router.push(`/orders/${result.orderId}`);

    } catch (error: any) {
      toast.error(error.message || 'Lỗi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const renderOrderDetails = () => {
    switch (serviceType) {
      case 'RANK_BOOST':
        return (
          <>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Rank hiện tại</span>
              <span className="font-bold text-white">{details.current_rank}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Rank mong muốn</span>
              <span className="font-bold text-yellow-400">{details.desired_rank}</span>
            </div>
          </>
        );
      case 'NET_WINS':
        return (
          <>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Rank hiện tại</span>
              <span className="font-bold text-white">{details.current_rank || details.rank} ({details.current_lp} LP)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Mục tiêu</span>
              <span className="font-bold text-yellow-400">
                {details.calc_mode === 'BY_GAMES' ? `${details.num_games} Trận thắng` : `${details.target_lp} LP`}
              </span>
            </div>
          </>
        );
      case 'PLACEMENTS':
        return (
          <>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Rank mùa trước</span>
              <span className="font-bold text-white">{details.prev_rank}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Số trận</span>
              <span className="font-bold text-yellow-400">{details.num_games} Trận</span>
            </div>
          </>
        );
      case 'LEVELING':
        return (
          <>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Level hiện tại</span>
              <span className="font-bold text-white">{details.current_level}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Level mong muốn</span>
              <span className="font-bold text-yellow-400">{details.desired_level}</span>
            </div>
          </>
        );
       case 'MASTERY':
        return (
          <>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Tướng</span>
              <span className="font-bold text-white">{details.champion}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Mục tiêu</span>
              <span className="font-bold text-yellow-400">Cấp {details.current_mastery} ➜ {details.desired_mastery}</span>
            </div>
          </>
        );
       case 'PROMOTION':
        return (
          <>
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Chuỗi thăng hạng</span>
              <span className="font-bold text-yellow-400">{details.promo_from} ➜ {details.promo_to}</span>
            </div>
          </>
        );
      default:
        return (
            <div className="flex justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Thông tin</span>
              <span className="font-bold text-white">Chi tiết trong đơn hàng</span>
            </div>
        );
    }
  };

  const OPTION_LABELS: Record<string, string> = {
    express: 'Cày siêu tốc',
    duo: 'Chơi cùng Booster',
    streaming: 'Xem trực tiếp (Streaming)',
    specificChamps: 'Chơi tướng chỉ định',
    schedule: 'Đặt lịch cày',
    roles: 'Vị trí đi đường'
  };

  // Lọc các tùy chọn đang kích hoạt (true hoặc mảng có dữ liệu)
  const activeOptions = Object.entries(options || {}).filter(([_, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return !!value;
  });

  // Tách riêng các tùy chọn phức tạp
  const scheduleOption = activeOptions.find(([k]) => k === 'schedule');
  const rolesOption = activeOptions.find(([k]) => k === 'roles');
  const simpleOptions = activeOptions.filter(([k, v]) => {
      if (k === 'schedule' && Array.isArray(v)) return false;
      if (k === 'roles' && Array.isArray(v)) return false;
      return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans pt-24 pb-20 px-4">
      <Navbar />
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <ShieldCheck className="text-green-500 w-8 h-8" />
          Xác nhận thanh toán
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
                {renderOrderDetails()}
                {queueType && serviceType !== 'LEVELING' && serviceType !== 'MASTERY' && (
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-400">Loại hàng chờ</span>
                    <span className="font-bold">{['SOLO', 'SOLO_DUO'].includes(queueType) ? 'Đơn / Đôi' : 'Linh hoạt'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-400">Thông tin tài khoản</h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-zinc-800"><span className="text-zinc-400">Tài khoản</span><span className="font-mono">{details.account_username}</span></div>
                <div className="flex justify-between py-2 border-b border-zinc-800"><span className="text-zinc-400">Mật khẩu</span><span>••••••••</span></div>
                <div className="flex justify-between py-2 border-b border-zinc-800"><span className="text-zinc-400">Server</span><span className="font-bold">{details.server}</span></div>
              </div>
            </div>
            {/* Options Info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-400">Tùy chọn thêm</h2>
              {activeOptions.length > 0 ? (
                <div className="space-y-4 text-sm">
                  {/* 1. Các tùy chọn đơn giản */}
                  {simpleOptions.map(([key]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-b-0">
                      <span className="text-zinc-300">{OPTION_LABELS[key] || key}</span>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  ))}

                  {/* 2. Vị trí (Roles) */}
                  {rolesOption && Array.isArray(rolesOption[1]) && (
                    <div className="py-2 border-b border-zinc-800 last:border-b-0">
                        <span className="text-zinc-300 block mb-2 font-medium">Vị trí đi đường:</span>
                        <div className="flex flex-wrap gap-2">
                            {rolesOption[1].map((role: string) => (
                                <span key={role} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700 font-bold">{role}</span>
                            ))}
                        </div>
                    </div>
                  )}

                  {/* 3. Lịch cấm (Schedule) */}
                  {scheduleOption && Array.isArray(scheduleOption[1]) && (
                    <div className="py-2 border-b border-zinc-800 last:border-b-0">
                        <span className="text-zinc-300 block mb-2 font-medium">Khung giờ nghỉ (Cấm chơi):</span>
                        <div className="flex flex-wrap gap-2">
                            {scheduleOption[1].map((w: any, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs font-bold">{w.start} - {w.end}</span>
                            ))}
                        </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm text-center py-4">Không có tùy chọn thêm nào được chọn.</p>
              )}
            </div>
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6">
              <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Quy trình thanh toán đảm bảo
              </h3>
              <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                <li>Số tiền sẽ được <strong>hệ thống giữ (Escrow)</strong> an toàn.</li>
                <li>Booster chỉ nhận được tiền khi hoàn thành đơn hàng.</li>
                {isDepositService ? (
                    <li>Đây là dịch vụ <strong>Đặt cọc</strong>. Bạn sẽ thanh toán phần còn lại sau khi đơn hàng hoàn tất.</li>
                ) : (
                    <li>Bạn sẽ thanh toán <strong>100% giá trị đơn hàng</strong> ngay bây giờ.</li>
                )}
                <li>Nếu Booster hủy đơn hoặc không hoàn thành, bạn sẽ được <strong>hoàn tiền</strong>.</li>
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

              {/* Coupon Section */}
              <div className="mb-6 bg-zinc-950/50 rounded-xl border border-zinc-800 p-4">
                <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Tag className="w-3 h-3" /> Mã giảm giá
                </label>

                <div
                  className={`relative flex items-center bg-zinc-900 border rounded-lg transition-all overflow-hidden ${
                    appliedCoupon
                      ? "border-green-500/50 ring-1 ring-green-500/10"
                      : "border-zinc-700 focus-within:border-blue-500"
                  }`}
                >
                  <div className="pl-3 text-zinc-500 flex items-center shrink-0">
                    <TicketPercent className="w-4 h-4" />
                  </div>

                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã giảm giá..."
                    disabled={!!appliedCoupon}
                    className="flex-1 min-w-0 bg-transparent border-none px-3 py-2.5 text-sm text-white font-mono font-medium placeholder:text-zinc-600 focus:ring-0 focus:outline-none disabled:opacity-50 uppercase"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !appliedCoupon && couponCode.trim()) {
                        handleApplyCoupon();
                      }
                    }}
                  />

                  <div className="pr-1.5 flex items-center shrink-0">
                    {appliedCoupon ? (
                      <button
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode("");
                        }}
                        className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-red-400 transition-colors"
                        title="Xóa mã"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center whitespace-nowrap"
                      >
                        {isApplyingCoupon ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Áp dụng"
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {appliedCoupon && (
                  <div className="mt-3 flex items-center justify-between text-xs bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                    <span className="text-green-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Mã hợp lệ:
                      <span className="font-mono font-bold text-white">
                        {appliedCoupon.code}
                      </span>
                    </span>

                    <span className="text-white font-bold bg-green-500/20 px-2 py-0.5 rounded">
                      -
                      {appliedCoupon.type === "PERCENTAGE"
                        ? `${appliedCoupon.value}%`
                        : `${discountValue.toLocaleString()}đ`}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-800 my-4 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-300">{isDepositService ? 'Tiền cọc cần thanh toán:' : 'Thanh toán ngay:'}</span>
                  <span className="text-xl font-bold text-green-400">{paymentAmount.toLocaleString()} đ</span>
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
                  Số dư không đủ. Vui lòng nạp thêm { (paymentAmount - walletBalance).toLocaleString() } đ
                </div>
              )}

              {isSufficient ? (
                <button
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/20"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                  {isDepositService ? 'Xác nhận & Đặt cọc' : 'Thanh toán ngay'}
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