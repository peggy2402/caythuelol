'use client';

import { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, AlertCircle, TrendingUp, DollarSign, Info, AlertTriangle, Wallet, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import SparklineChart from '@/components/SparklineChart';

interface NetWinsOrderViewProps {
  order: any;
  isBooster: boolean;
  isCustomer: boolean;
  onPayRemaining?: (amount: number) => void;
  onRefund?: (amount: number) => void;
}

export default function NetWinsOrderView({ order, isBooster, isCustomer, onPayRemaining, onRefund }: NetWinsOrderViewProps) {
  const { details = {}, pricing = {}, match_history = [] } = order || {};
  const gameCode = (order?.game || order?.gameCode || details?.game || order?.snapshot?.gameCode || 'LOL').toUpperCase();
  const isAov = ['AOV', 'LIENQUAN', 'LQM', 'ARENA_OF_VALOR'].includes(gameCode);
  
  // Xác định rõ cày điểm / sao (Point Boost) hay cày số trận thắng (Net Wins Games)
  const isPointBoost = Boolean(
    details?.is_point_boost ||
    details?.calc_mode === 'BY_LP' ||
    details?.calc_mode === 'BY_STAR' ||
    details?.segment
  );
  const calcMode = isPointBoost ? 'BY_LP' : (details?.calc_mode || 'BY_GAMES');
  const unit = details?.unit || (isAov ? 'Sao' : 'LP');

  const start_lp = parseInt(details?.start_lp ?? details?.current_points ?? 0);
  const target_lp = parseInt(details?.target_lp ?? details?.desired_points ?? details?.target_points ?? (start_lp + (details?.gained_points || 0)));
  const current_lp = parseInt(details?.current_lp ?? details?.current_points ?? start_lp);
  const gained_target = parseInt(details?.gained_points ?? Math.max(1, target_lp - start_lp));
  const num_games = parseInt(details?.num_games ?? (isPointBoost ? gained_target : 1));
  const unit_price_per_lp = parseFloat(details?.unit_price_per_lp ?? details?.rate ?? 0);
  const modifier_pct = parseFloat(details?.modifier_pct ?? 0);
  
  // State để lưu thông tin Booster đầy đủ (bao gồm config)
  const [boosterData, setBoosterData] = useState<any>(order.boosterId);

  // Effect: Đảm bảo luôn có boosterData đầy đủ
  useEffect(() => {
      const bId = order.boosterId;
      // Kiểm tra xem đã có config chưa (booster_info hoặc games)
      const hasConfig = bId && typeof bId === 'object' && (bId.booster_info || bId.games);
      
      if (!hasConfig && bId) {
          const id = typeof bId === 'string' ? bId : bId._id;
          if (id) {
              fetch(`/api/boosters/${id}`)
                  .then(res => res.json())
                  .then(data => { if (data.booster) setBoosterData(data.booster); })
                  .catch(err => console.error("Failed to fetch booster config", err));
          }
      } else {
          setBoosterData(bId);
      }
  }, [order.boosterId]);

  // --- LOGIC TÍNH TOÁN THỰC TẾ (REAL-TIME SETTLEMENT) ---
  const settlement = useMemo(() => {
    let actualBasePrice = 0;
    let progressText = '';
    let progressPercent = 0;
    const start = start_lp;
    const current = current_lp;
    const target = target_lp;
    const targetDiff = Math.max(1, gained_target || (target - start));

    // 1. GIÁ DỊCH VỤ GỐC (Dành cho Booster: không bao gồm phí sàn của Admin)
    const originalBoosterBase = Number(pricing.base_price ?? pricing.original_price ?? 0) || (
        calcMode === 'BY_LP' 
            ? targetDiff * (unit_price_per_lp || 0)
            : (num_games || 0) * (unit_price_per_lp || 0) * (details?.lp_gain || 20)
    );

    // 2. TỔNG GIÁ ĐƠN GỐC (Dành cho Customer: gồm cả phí dịch vụ sàn của Admin)
    const originalCustomerTotal = Number(pricing.total_amount ?? pricing.final_price ?? originalBoosterBase);

    // 3. TỶ LỆ PHÍ SÀN (Platform Fee Rate - Khoản phí thuộc về Admin)
    const platformFeeAmount = Number(pricing.service_fee ?? pricing.platform_fee ?? 0);
    let feeRate = 0;
    if (typeof pricing.platform_fee_percent === 'number' && pricing.platform_fee_percent > 0) {
        feeRate = pricing.platform_fee_percent / 100;
    } else if (originalBoosterBase > 0 && platformFeeAmount > 0) {
        feeRate = platformFeeAmount / originalBoosterBase;
    } else if (originalCustomerTotal > originalBoosterBase && originalBoosterBase > 0) {
        feeRate = (originalCustomerTotal - originalBoosterBase) / originalBoosterBase;
    } else {
        feeRate = 0.02; // Mặc định 2% phí sàn
    }

    // 4. TÍNH GIÁ GỐC THỰC TẾ (actualBasePrice) THEO TIẾN ĐỘ THỰC TẾ
    if (calcMode === 'BY_LP') {
        const totalLpChange = match_history?.reduce((sum: number, m: any) => sum + (m.lp_change || 0), 0);
        const gained = typeof totalLpChange === 'number' && match_history.length > 0 ? totalLpChange : Math.max(0, current - start);

        actualBasePrice = gained * (unit_price_per_lp || 0);
        progressText = `${gained} / ${targetDiff} ${unit}`;
        progressPercent = Math.min(100, Math.round((gained / targetDiff) * 100));
    } else { // BY_GAMES
        const wins = match_history?.filter((m: any) => m.result === 'WIN').length || 0;
        const losses = match_history?.filter((m: any) => m.result === 'LOSS').length || 0;
        const netWins = wins - losses;
        const totalLpGained = match_history?.reduce((sum: number, m: any) => sum + (parseInt(m.lp_change) || 0), 0) || 0;
        
        actualBasePrice = Math.max(0, totalLpGained) * (unit_price_per_lp || 0);
        const safeGames = Math.max(1, num_games || 1);
        progressText = `${netWins}/${num_games || 0} Trận (Net) [${totalLpGained > 0 ? '+' : ''}${totalLpGained} ${unit}]`;
        progressPercent = Math.min(100, Math.round((Math.max(0, netWins) / safeGames) * 100));
    }

    // 5. Elo Fee & Options Fee
    const eloFeeValue = actualBasePrice * ((modifier_pct || 0) / 100);
    let actualOptionsFee = 0;
    const originalOptions = order.options || {};
    
    let boosterOptionsConfig = boosterData?.booster_info?.service_settings?.options;
    if (!boosterOptionsConfig && boosterData?.games) {
        const matchedGame =
          boosterData.games.find((g: any) => (g.gameCode || '').toUpperCase() === gameCode) ||
          boosterData.games.find((g: any) => g.gameCode === 'LOL');
        boosterOptionsConfig = matchedGame?.metadata?.options || {};
    }
    boosterOptionsConfig = boosterOptionsConfig || {};

    if (originalOptions.express && boosterOptionsConfig.express > 0) {
        actualOptionsFee += actualBasePrice * (boosterOptionsConfig.express / 100);
    }
    if (originalOptions.duo && boosterOptionsConfig.duo > 0) {
        actualOptionsFee += actualBasePrice * (boosterOptionsConfig.duo / 100);
    }
    if (originalOptions.specificChamps && boosterOptionsConfig.specificChamps > 0) {
        actualOptionsFee += actualBasePrice * (boosterOptionsConfig.specificChamps / 100);
    }
    if (Array.isArray(originalOptions.schedule) && originalOptions.schedule.length > 0 && boosterOptionsConfig.schedule && boosterOptionsConfig.scheduleFee > 0) {
        actualOptionsFee += actualBasePrice * (boosterOptionsConfig.scheduleFee / 100);
    }
    if (originalOptions.streaming && boosterOptionsConfig.streaming > 0) {
        actualOptionsFee += boosterOptionsConfig.streaming;
    }

    // 6. TỔNG THU NHẬP THỰC TẾ CỦA BOOSTER (Không tính phí sàn của Admin)
    const boosterActualTotal = Math.round(actualBasePrice + eloFeeValue + actualOptionsFee);

    // 7. PHÍ SÀN ADMIN THỰC TẾ
    const actualAdminFee = Math.round(boosterActualTotal * feeRate);

    // 8. TỔNG GIÁ TRỊ THỰC TẾ CỦA CUSTOMER (Gồm cả phí sàn Admin)
    const customerActualTotal = Math.round(boosterActualTotal + actualAdminFee);

    // 9. TIỀN CỌC ĐÃ THANH TOÁN (Paid Deposit)
    const customerPaidDeposit = Number(pricing.deposit_amount || pricing.total_amount || 0);
    const depositPercent = pricing.deposit_amount && pricing.total_amount 
        ? Math.round((pricing.deposit_amount / pricing.total_amount) * 100) 
        : 100;
    const depositRatio = depositPercent / 100;

    // Tiền cọc tương ứng phần thu nhập của Booster (không bao gồm cọc phí Admin)
    const boosterPaidDeposit = Math.round(originalBoosterBase * depositRatio);

    // 10. SỐ TIỀN CÒN LẠI (Remaining Settlement)
    // - Khách cần bù thêm (hoặc được hoàn lại):
    const customerRemaining = customerActualTotal - customerPaidDeposit;

    // - Booster sẽ nhận thêm về ví (hoặc hoàn trả tạm ứng):
    const boosterRemaining = boosterActualTotal - boosterPaidDeposit;

    // Trạng thái quyết toán: OWE (Cần trả thêm) | REFUND (Hoàn tiền) | SETTLED (Đủ)
    const isAlreadySettled = Boolean(order.payment?.final_paid || order.pricing?.settlement_status === 'SETTLED');
    const status = isAlreadySettled
        ? 'SETTLED'
        : customerRemaining > 0 
            ? 'OWE' 
            : customerRemaining < 0 
                ? 'REFUND' 
                : 'SETTLED';

    return {
        originalBoosterBase,
        originalCustomerTotal,
        actualBasePrice,
        eloFeeValue,
        actualOptionsFee,
        actualAdminFee,
        feeRate,
        boosterActualTotal,
        customerActualTotal,
        boosterPaidDeposit,
        customerPaidDeposit,
        depositPercent,
        customerRemaining,
        boosterRemaining,
        progressText,
        progressPercent,
        status,
        isLowEarnings: boosterActualTotal <= 0,
    };
  }, [details, pricing, match_history, calcMode, order.options, order.payment, boosterData]);

  const isCompleted = order.status === 'COMPLETED';

  const handlePayRemaining = () => {
      if (onPayRemaining) {
          onPayRemaining(settlement.customerRemaining);
      }
  };

  const handleRefund = () => {
      if (onRefund) {
          onRefund(Math.abs(settlement.customerRemaining));
      }
  };

  // --- Dữ liệu cho biểu đồ Sparkline ---
  const lpTrendData = useMemo(() => {
      if (!match_history || match_history.length === 0) return [];
      let cumulative = 0;
      // Bắt đầu từ 0
      const data = [0];
      match_history.forEach((m: any) => {
          cumulative += (parseInt(m.lp_change) || 0);
          data.push(cumulative);
      });
      return data;
  }, [match_history]);

  // Logic: Chỉ hiển thị quyết toán khi đã có trận đấu (để tránh hiển thị phí Streaming/Options khi chưa cày)
  const hasMatches = order.match_history && order.match_history.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* 1. Progress Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                <TrendingUp className="w-5 h-5 text-blue-500" /> 
                Tiến độ cày {calcMode === 'BY_LP' ? (isAov ? `Số Sao (Liên Quân)` : `Điểm (${unit})`) : 'Trận (Net Wins)'}
            </h3>
            
            <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${settlement.progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </div>
            <div className="flex justify-between text-sm font-medium mb-6">
                <span className="text-zinc-400">Đã đạt được: <span className="text-white font-bold">{settlement.progressText}</span></span>
                <span className="text-blue-400 font-bold">{settlement.progressPercent}%</span>
            </div>

            {/* Chi tiết thông số */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 flex sm:block justify-between items-center sm:text-center min-w-0">
                    <div className="text-[11px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">Bắt đầu</div>
                    <div className="text-base sm:text-lg font-bold text-white sm:mt-1 truncate">
                        {calcMode === 'BY_GAMES' ? '0' : `${start_lp} ${unit}`}
                    </div>
                </div>
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 flex sm:block justify-between items-center sm:text-center relative min-w-0">
                    <div className="text-[11px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate flex items-center gap-2">
                        Hiện tại
                        {/* Indicator for LP Gain (Mobile inline) */}
                        {(() => {
                            const diff = current_lp - start_lp;
                            if (diff === 0) return null;
                            return (
                                <span className={`sm:hidden text-[10px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${
                                    diff > 0 
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                }`}>
                                    {calcMode === 'BY_GAMES' ? 'Net' : `${diff > 0 ? '+' : ''}${diff}`}
                                </span>
                            );
                        })()}
                    </div>
                    <div className="text-base sm:text-lg font-bold text-blue-400 sm:mt-1 truncate">
                        {calcMode === 'BY_GAMES' ? (
                            (() => {
                                const wins = match_history?.filter((m: any) => m.result === 'WIN').length || 0;
                                const losses = match_history?.filter((m: any) => m.result === 'LOSS').length || 0;
                                return wins - losses;
                            })()
                        ) : (
                            current_lp
                        )}
                        {calcMode === 'BY_GAMES' ? '' : ` ${unit}`}
                    </div>
                    {/* Indicator for LP Gain (Desktop absolute) */}
                    {(() => {
                        const diff = current_lp - start_lp;
                        if (diff === 0) return null;
                        return (
                            <div className={`hidden sm:block absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shadow-sm ${
                                diff > 0 
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}>
                                {calcMode === 'BY_GAMES' ? 'Net' : `${diff > 0 ? '+' : ''}${diff} ${unit}`}
                            </div>
                        );
                    })()}
                </div>
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 flex sm:block justify-between items-center sm:text-center min-w-0">
                    <div className="text-[11px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">Mục tiêu</div>
                    <div className="text-base sm:text-lg font-bold text-yellow-400 sm:mt-1 truncate">
                        {calcMode === 'BY_LP' ? `${target_lp} ${unit}` : `${num_games} Trận`}
                    </div>
                </div>
            </div>

            {/* Chi tiết lũy tiến theo mốc sao Liên Quân nếu có */}
            {isAov && Array.isArray(details?.star_breakdown) && details.star_breakdown.length > 0 && (
                <div className="mt-4 p-3.5 rounded-xl bg-zinc-950/60 border border-amber-500/20 space-y-2">
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        Chi tiết đơn giá theo mốc Sao Liên Quân
                    </div>
                    <div className="space-y-1.5">
                        {details.star_breakdown.map((seg: any, idx: number) => (
                            <div key={seg.tierId || idx} className="flex items-center justify-between text-xs gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    {seg.image && (
                                        <img src={seg.image} alt={seg.label} className="w-5 h-5 object-contain shrink-0" />
                                    )}
                                    <span className="text-zinc-300 truncate">
                                        {seg.label}
                                        {typeof seg.fromStar === 'number' && typeof seg.toStar === 'number'
                                            ? ` (${seg.fromStar}★ → ${seg.toStar}★)`
                                            : ''}
                                    </span>
                                </div>
                                <span className="font-mono text-cyan-400 font-bold whitespace-nowrap">
                                    {seg.stars} sao × {Number(seg.ratePerStar || 0).toLocaleString('vi-VN')}đ = {Number(seg.subtotal || 0).toLocaleString('vi-VN')}đ
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Sparkline Chart */}
            {hasMatches && lpTrendData.length > 1 && (
                <div className="mt-6 pt-4 border-t border-zinc-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Biểu đồ tích lũy {unit}</span>
                        <span className={`text-xs font-bold ${lpTrendData[lpTrendData.length - 1] >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {lpTrendData[lpTrendData.length - 1] > 0 ? '+' : ''}{lpTrendData[lpTrendData.length - 1]} {unit}
                        </span>
                    </div>
                    <SparklineChart data={lpTrendData} color={lpTrendData[lpTrendData.length - 1] >= 0 ? '#4ade80' : '#f87171'} height={50} />
                </div>
            )}
        </div>

        {/* 2. Settlement Preview (Real-time Money) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" /> 
                    {isCompleted ? 'Quyết toán đơn hàng' : 'Tạm tính quyết toán'}
                </h3>
                {!isCompleted && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium inline-flex items-center gap-1.5 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        Đang cày • Tạm tính theo tiến độ
                    </span>
                )}
            </div>
            
            <div className="space-y-3 text-sm relative z-10">
                {/* 1. Giá trị đơn gốc (Dự kiến) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400">
                        {isBooster ? 'Doanh thu đơn gốc (Dự kiến):' : 'Giá trị đơn gốc (Dự kiến):'}
                    </span>
                    <span className="text-zinc-500 line-through decoration-zinc-600 font-mono">
                        {(isBooster ? settlement.originalBoosterBase : settlement.originalCustomerTotal).toLocaleString()} đ
                    </span>
                </div>

                {/* 2. Giá trị thực tế (Hiện tại) */}
                {hasMatches ? (
                    <div className="flex flex-col justify-between items-center p-3 bg-blue-900/10 rounded-xl border border-blue-500/20">
                        <span className="text-blue-200 font-medium">
                            {isBooster ? 'Thu nhập thực tế (Hiện tại):' : 'Giá trị thực tế (Hiện tại):'}
                        </span>
                        <div className="text-right group relative cursor-help">
                            <span className="text-blue-400 font-bold text-lg font-mono">
                                {(isBooster ? settlement.boosterActualTotal : settlement.customerActualTotal).toLocaleString()} đ
                            </span>
                            {/* Tooltip Breakdown */}
                            <div className="absolute bottom-full right-0 mb-2 w-72 p-3 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-zinc-300 space-y-1">
                                <div className="font-bold text-white border-b border-zinc-700 pb-1 mb-1">Chi tiết tính toán thực tế:</div>
                                <div className="flex justify-between">
                                    <span>Giá cày (A):</span> 
                                    <span className="font-mono">{settlement.actualBasePrice.toLocaleString('vi-VN')} đ</span>
                                </div>
                                {settlement.eloFeeValue !== 0 && (
                                    <div className="flex justify-between">
                                        <span>Hệ số Elo:</span> 
                                        <span className={`font-mono ${settlement.eloFeeValue > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                            {settlement.eloFeeValue > 0 ? '+' : ''}{settlement.eloFeeValue.toLocaleString('vi-VN')} đ
                                        </span>
                                    </div>
                                )}
                                {settlement.actualOptionsFee > 0 && (
                                    <div className="flex justify-between text-yellow-400">
                                        <span>Tùy chọn thêm (Options):</span> 
                                        <span className="font-mono">+{settlement.actualOptionsFee.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                )}
                                {isCustomer && (
                                    <div className="flex justify-between text-zinc-400">
                                        <span>Phí dịch vụ sàn (Admin):</span> 
                                        <span className="font-mono">+{settlement.actualAdminFee.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                )}
                                <div className="border-t border-zinc-700 pt-1 mt-1 font-bold text-right text-blue-400 font-mono">
                                    = {(isBooster ? settlement.boosterActualTotal : settlement.customerActualTotal).toLocaleString('vi-VN')} đ
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center p-3 bg-zinc-950/30 rounded-xl border border-zinc-800 border-dashed">
                        <span className="text-zinc-500">{isBooster ? 'Thu nhập thực tế:' : 'Giá trị thực tế:'}</span>
                        <span className="text-zinc-500 italic">Đang chờ cập nhật trận đấu...</span>
                    </div>
                )}

                {/* 3. Cảnh báo thu nhập thấp cho Booster */}
                {isBooster && hasMatches && settlement.isLowEarnings && (
                    <div className="flex gap-3 p-3 bg-orange-900/20 rounded-xl border border-orange-500/50">
                        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                        <div className="text-sm">
                            <span className="text-orange-200 font-bold block mb-1">Cảnh báo thu nhập thấp!</span>
                            <span className="text-orange-300/80">
                                Do số trận thua (Loss) quá nhiều, thu nhập thực tế của bạn đang ở mức thấp ({settlement.boosterActualTotal.toLocaleString()} đ).
                            </span>
                        </div>
                    </div>
                )}

                {/* 4. Đã thanh toán trước / Đã nhận cọc tạm ứng */}
                <div className="flex flex-col justify-between items-center p-3 bg-zinc-950/50 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400">
                        {isBooster
                            ? `Đã nhận cọc tạm ứng (${settlement.depositPercent}%):`
                            : `Đã thanh toán trước (${settlement.depositPercent}%):`}
                    </span>
                    <span className="text-yellow-500 font-bold font-mono">
                        - {(isBooster ? settlement.boosterPaidDeposit : settlement.customerPaidDeposit).toLocaleString()} đ
                    </span>
                </div>

                <div className="border-t border-zinc-800 my-2"></div>

                {/* 5. Kết quả quyết toán: CẦN TRẢ THÊM (OWE) */}
                {hasMatches && settlement.status === 'OWE' && (
                    <div className="p-3.5 sm:p-4 bg-red-900/10 rounded-xl border border-red-500/30 space-y-2.5">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                <span className="text-red-200 font-bold text-sm sm:text-base truncate">
                                    {isCustomer 
                                        ? (isCompleted ? 'Cần thanh toán thêm:' : 'Dự kiến cần thanh toán thêm:') 
                                        : (isBooster 
                                            ? (isCompleted ? 'Số tiền về ví còn lại:' : 'Dự kiến thu nhập còn lại:') 
                                            : 'Khách cần thanh toán thêm:')}
                                </span>
                            </div>
                            
                            {isCustomer ? (
                                isCompleted ? (
                                    <button 
                                        onClick={handlePayRemaining}
                                        className="w-full sm:w-auto py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20 active:scale-[0.98] cursor-pointer"
                                        title="Thanh toán ngay"
                                    >
                                        <Wallet className="w-4 h-4 shrink-0" />
                                        <span>Thanh toán {settlement.customerRemaining.toLocaleString()} đ</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-400 font-black text-lg sm:text-xl whitespace-nowrap font-mono">
                                            {settlement.customerRemaining.toLocaleString()} đ
                                        </span>
                                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium whitespace-nowrap">
                                            Chờ chốt đơn
                                        </span>
                                    </div>
                                )
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className={`font-black text-lg sm:text-xl whitespace-nowrap font-mono ${isBooster ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isBooster ? `+${settlement.boosterRemaining.toLocaleString()}` : `${settlement.customerRemaining.toLocaleString()}`} đ
                                    </span>
                                    {!isCompleted && (
                                        <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium whitespace-nowrap">
                                            Tạm tính
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Hướng dẫn thanh toán cho khách hàng */}
                        {isCustomer && !isCompleted && (
                            <div className="pt-2 border-t border-red-500/20 text-xs text-zinc-400 flex items-start gap-1.5">
                                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>
                                    Khoản thanh toán thêm sẽ được mở sau khi Booster cày xong và bấm <b>"Báo cáo hoàn thành"</b>.
                                </span>
                            </div>
                        )}

                        {isCustomer && isCompleted && (
                            <div className="pt-2 border-t border-red-500/20 text-xs text-amber-300 flex items-start gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>
                                    Booster đã báo cáo hoàn thành đơn hàng. Vui lòng thanh toán số tiền còn lại để hoàn tất nghiệm thu.
                                </span>
                            </div>
                        )}

                        {/* Ghi chú minh bạch cho Booster */}
                        {isBooster && (
                            <div className="pt-2 border-t border-red-500/20 text-[11px] text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <span>Khách thanh toán thêm: <b className="text-white font-mono">{settlement.customerRemaining.toLocaleString()} đ</b></span>
                                <span>Phí sàn Admin: <b className="text-amber-400 font-mono">+{settlement.actualAdminFee.toLocaleString()} đ</b></span>
                            </div>
                        )}
                    </div>
                )}

                {/* 6. Kết quả quyết toán: HOÀN LẠI (REFUND) */}
                {hasMatches && settlement.status === 'REFUND' && (
                    <div className="p-3.5 sm:p-4 bg-green-900/10 rounded-xl border border-green-500/30 space-y-2">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                <span className="text-green-200 font-bold text-sm sm:text-base truncate">
                                    {isCustomer 
                                        ? (isCompleted ? 'Được hoàn lại về ví:' : 'Dự kiến được hoàn lại:') 
                                        : (isBooster 
                                            ? (isCompleted ? 'Cần hoàn lại khách:' : 'Dự kiến hoàn khách nếu dừng cày:') 
                                            : 'Hoàn lại khách:')}
                                </span>
                            </div>
                            
                            {isBooster ? (
                                isCompleted ? (
                                    <button 
                                        onClick={handleRefund}
                                        className="w-full sm:w-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] cursor-pointer"
                                        title="Xác nhận hoàn tiền"
                                    >
                                        <RefreshCcw className="w-4 h-4 shrink-0" />
                                        <span>Xác nhận hoàn {Math.abs(settlement.customerRemaining).toLocaleString()} đ</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400 font-black text-lg sm:text-xl whitespace-nowrap font-mono">
                                            {Math.abs(settlement.customerRemaining).toLocaleString()} đ
                                        </span>
                                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium whitespace-nowrap">
                                            Tạm tính
                                        </span>
                                    </div>
                                )
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400 font-black text-lg sm:text-xl whitespace-nowrap font-mono">
                                        {Math.abs(settlement.customerRemaining).toLocaleString()} đ
                                    </span>
                                    {!isCompleted && (
                                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium whitespace-nowrap">
                                            Tạm tính
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {!isCompleted && (
                            <div className="pt-2 border-t border-green-500/20 text-xs text-zinc-400 flex items-start gap-1.5">
                                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>
                                    Tiền cọc thừa sẽ được hệ thống tự động hoàn lại vào ví của bạn khi đơn hàng kết thúc.
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* 7. Kết quả quyết toán: ĐÃ ĐỦ (SETTLED) */}
                {hasMatches && settlement.status === 'SETTLED' && (
                    <div className="flex justify-between items-center p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-zinc-200 font-bold">
                                {isBooster ? 'Đã đủ số tiền theo hợp đồng' : 'Đã thanh toán đủ'}
                            </span>
                        </div>
                        <span className="text-emerald-400 font-bold font-mono">0 đ</span>
                    </div>
                )}

                {!hasMatches && (
                    <div className="text-center py-2 text-zinc-500 text-xs italic">
                        Hệ thống sẽ tự động tính toán quyết toán sau khi có trận đấu đầu tiên.
                    </div>
                )}
            </div>

            <div className="mt-4 flex gap-2 items-start p-3 bg-zinc-950/30 rounded-lg border border-zinc-800/50">
                <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-400 leading-relaxed">
                    {isCompleted 
                        ? (isAov
                            ? 'Đơn hàng đã hoàn thành. Khoản quyết toán được tính toán chính xác dựa trên số Sao Liên Quân thực tế đã hoàn tất.'
                            : 'Đơn hàng đã hoàn thành. Khoản quyết toán được tính toán chính xác dựa trên dữ liệu thực tế từ Riot Games.')
                        : 'Số tiền quyết toán cuối cùng sẽ được chốt khi Booster bấm "Báo cáo hoàn thành". Trong quá trình cày, điểm số có thể thay đổi nên hệ thống chỉ hiển thị tạm tính.'}
                </p>
            </div>
        </div>
    </div>
  );
}