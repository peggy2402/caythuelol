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
  const { details, pricing, match_history } = order;
  const { calc_mode, start_lp, target_lp, num_games, unit_price_per_lp, modifier_pct } = details;
  
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
    const start = parseInt(start_lp || '0');
    const current = parseInt(details.current_lp || start_lp || '0');
    const target = parseInt(target_lp || '0');
    const targetDiff = Math.max(1, target - start);

    // --- PRE-CALC: ORIGINAL BASE PRICE (GIÁ GỐC ĐƠN HÀNG) ---
    // Dùng để tham chiếu tính phí sàn và giá mỗi trận (cho BY_GAMES)
    const originalBase = pricing.base_price || (
        calc_mode === 'BY_LP' 
            ? Math.max(0, (parseInt(target_lp)||0) - (parseInt(start_lp)||0)) * (unit_price_per_lp||0)
            : (num_games||0) * (unit_price_per_lp||0) * (details.lp_gain || 20)
    );

    // --- BƯỚC 1: TÍNH GIÁ GỐC THỰC TẾ (actualBasePrice) ---
    if (calc_mode === 'BY_LP') {
        // Ưu tiên tính theo match_history nếu có, nếu không thì fallback về current_lp
        const totalLpChange = match_history?.reduce((sum: number, m: any) => sum + (m.lp_change || 0), 0);
        const gained = typeof totalLpChange === 'number' ? totalLpChange : Math.max(0, current - start);

        actualBasePrice = gained * (unit_price_per_lp || 0);
        console.log("actualBasePrice: " + actualBasePrice);
        progressText = `${gained} / ${targetDiff} LP`;
        progressPercent = Math.min(100, Math.round((gained / targetDiff) * 100));
    } else { // BY_GAMES
        const wins = match_history?.filter((m: any) => m.result === 'WIN').length || 0;
        const losses = match_history?.filter((m: any) => m.result === 'LOSS').length || 0;
        const netWins = wins - losses;

        // --- FIX LOGIC: TÍNH TIỀN DỰA TRÊN TỔNG LP THỰC TẾ (KHÔNG DÙNG ESTIMATE 20LP) ---
        // Cộng dồn toàn bộ LP thay đổi (Dương/Âm) từ lịch sử đấu
        const totalLpGained = match_history?.reduce((sum: number, m: any) => sum + (parseInt(m.lp_change) || 0), 0) || 0;
        
        // Giá thực tế = Tổng LP thực * Giá mỗi LP
        actualBasePrice = Math.max(0, totalLpGained) * (unit_price_per_lp || 0);

        progressText = `${netWins}/${num_games} Trận (Net) [${totalLpGained > 0 ? '+' : ''}${totalLpGained} LP]`;
        progressPercent = Math.min(100, Math.round((Math.max(0, netWins) / num_games) * 100));
    }

    // --- BƯỚC 2: TÍNH TOÁN LẠI TOÀN BỘ GIÁ TRỊ DỰA TRÊN GIÁ GỐC THỰC TẾ (A) ---

    // 1. Elo Fee (Nếu có modifier thì tính vào A luôn hoặc tách ra tùy logic, ở đây coi như một phần của giá cày)
    const eloFeeValue = actualBasePrice * ((modifier_pct || 0) / 100);

    // 2. Options Fee
    let actualOptionsFee = 0;
    const originalOptions = order.options || {};
    
    // --- ROBUST CONFIG RETRIEVAL ---
    // Tìm cấu hình options trong cả booster_info (cũ) và games (mới)
    let boosterOptionsConfig = boosterData?.booster_info?.service_settings?.options;
    if (!boosterOptionsConfig && boosterData?.games) {
        const lolGame = boosterData.games.find((g: any) => g.gameCode === 'LOL');
        boosterOptionsConfig = lolGame?.metadata?.options || {};
    }
    boosterOptionsConfig = boosterOptionsConfig || {};
    // -------------------------------

    // Phí theo %
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
    
    // Phí cố định
    if (originalOptions.streaming && boosterOptionsConfig.streaming > 0) {
        actualOptionsFee += boosterOptionsConfig.streaming;
    }

    // 3. Platform Fee
    // Tính % phí sàn (Nếu originalBase = 0 thì fee% = 0 để tránh NaN)
    const platformFeePercent = (originalBase > 0) ? (pricing.platform_fee / originalBase) : 0;
    const actualPlatformFee = (actualBasePrice + eloFeeValue) * platformFeePercent;

    // 4. Actual Total (D = A + EloFee + C + B)
    const actualTotal = Math.round(actualBasePrice + eloFeeValue + actualOptionsFee + actualPlatformFee);
    const paidDeposit = pricing.deposit_amount || 0;
    const remaining = Math.round(actualTotal - paidDeposit);
    const boosterReceive = Math.round(actualBasePrice + eloFeeValue + actualOptionsFee); // Thu nhập thực của Booster (Trước khi trừ tạm ứng)

    return {
        actualBasePrice,
        eloFeeValue,
        actualOptionsFee,
        actualPlatformFee,
        actualTotal,
        boosterReceive,
        paidDeposit,
        remaining,
        progressText,
        progressPercent,
        status: remaining > 0 ? 'OWE' : remaining < 0 ? 'REFUND' : 'SETTLED',
        isLowEarnings: boosterReceive <= 0 // Cảnh báo nếu thu nhập <= 0
    };
  }, [details, pricing, match_history, calc_mode, order.options, boosterData]);

  const handlePayRemaining = () => {
      if (onPayRemaining) {
          onPayRemaining(settlement.remaining);
      }
  };

  const handleRefund = () => {
      if (onRefund) {
          onRefund(Math.abs(settlement.remaining));
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
                Tiến độ cày {calc_mode === 'BY_LP' ? 'Điểm (LP)' : 'Trận (Net Wins)'}
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
                        {calc_mode === 'BY_GAMES' ? '0' : `${start_lp || 0} LP`}
                    </div>
                </div>
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 flex sm:block justify-between items-center sm:text-center relative min-w-0">
                    <div className="text-[11px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate flex items-center gap-2">
                        Hiện tại
                        {/* Indicator for LP Gain (Mobile inline) */}
                        <span className="sm:hidden bg-blue-500/20 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-blue-500/30 whitespace-nowrap">
                            {calc_mode === 'BY_GAMES' 
                                ? 'Net' 
                                : (() => {
                                    const diff = (parseInt(details.current_lp) || 0) - (parseInt(start_lp) || 0);
                                    return diff > 0 ? `+${diff}` : diff;
                                })()
                            }
                        </span>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-blue-400 sm:mt-1 truncate">
                        {calc_mode === 'BY_GAMES' ? (
                            (() => {
                                const wins = match_history?.filter((m: any) => m.result === 'WIN').length || 0;
                                const losses = match_history?.filter((m: any) => m.result === 'LOSS').length || 0;
                                return wins - losses;
                            })()
                        ) : (
                            details.current_lp || 0
                        )}
                        {calc_mode === 'BY_GAMES' ? '' : ' LP'}
                    </div>
                    {/* Indicator for LP Gain (Desktop absolute) */}
                    <div className="hidden sm:block absolute -top-2 -right-2 bg-blue-500/20 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-blue-500/30 whitespace-nowrap">
                        {calc_mode === 'BY_GAMES' 
                            ? 'Net' 
                            : (() => {
                                const diff = (parseInt(details.current_lp) || 0) - (parseInt(start_lp) || 0);
                                return diff > 0 ? `+${diff}` : diff;
                            })()
                        }
                    </div>
                </div>
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 flex sm:block justify-between items-center sm:text-center min-w-0">
                    <div className="text-[11px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">Mục tiêu</div>
                    <div className="text-base sm:text-lg font-bold text-yellow-400 sm:mt-1 truncate">
                        {calc_mode === 'BY_LP' ? `${target_lp} LP` : `${num_games} Trận`}
                    </div>
                </div>
            </div>
            
            {/* Sparkline Chart */}
            {hasMatches && lpTrendData.length > 1 && (
                <div className="mt-6 pt-4 border-t border-zinc-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Biểu đồ tích lũy LP</span>
                        <span className={`text-xs font-bold ${lpTrendData[lpTrendData.length - 1] >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {lpTrendData[lpTrendData.length - 1] > 0 ? '+' : ''}{lpTrendData[lpTrendData.length - 1]} LP
                        </span>
                    </div>
                    <SparklineChart data={lpTrendData} color={lpTrendData[lpTrendData.length - 1] >= 0 ? '#4ade80' : '#f87171'} height={50} />
                </div>
            )}
        </div>

        {/* 2. Settlement Preview (Real-time Money) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                <DollarSign className="w-5 h-5 text-green-500" /> 
                Tạm tính quyết toán
            </h3>
            
            <div className="space-y-3 text-sm relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400">Giá trị đơn gốc (Dự kiến):</span>
                    <span className="text-zinc-500 line-through decoration-zinc-600">{pricing.total_amount.toLocaleString()} đ</span>
                </div>

                {hasMatches ? (
                    <div className="flex flex-col justify-between items-center p-3 bg-blue-900/10 rounded-xl border border-blue-500/20">
                        <span className="text-blue-200 font-medium">Giá trị thực tế (Hiện tại):</span>
                        <div className="text-right group relative cursor-help">
                            <span className="text-blue-400 font-bold text-lg">{settlement.actualTotal.toLocaleString()} đ</span>
                            {/* Tooltip Breakdown */}
                            <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-zinc-300 space-y-1">
                                <div className="font-bold text-white border-b border-zinc-700 pb-1 mb-1">Chi tiết tính toán:</div>
                                <div className="flex justify-between"><span>Giá cày (A):</span> <span>{settlement.actualBasePrice.toLocaleString('vi-VN')} đ</span></div>
                                {settlement.eloFeeValue !== 0 && (
                                    <div className="flex justify-between">
                                        <span>Hệ số Elo:</span> 
                                        <span className={settlement.eloFeeValue > 0 ? 'text-red-400' : 'text-green-400'}>{settlement.eloFeeValue > 0 ? '+' : ''}{settlement.eloFeeValue.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                )}
                                {settlement.actualOptionsFee > 0 && (
                                    <div className="flex justify-between text-yellow-400">
                                        <span>Options (C):</span> 
                                        <span>+{settlement.actualOptionsFee.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-zinc-500"><span>Phí sàn (B):</span> <span>+{settlement.actualPlatformFee.toLocaleString('vi-VN')} đ</span></div>
                                <div className="border-t border-zinc-700 pt-1 mt-1 font-bold text-right text-blue-400">= {settlement.actualTotal.toLocaleString('vi-VN')} đ</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center p-3 bg-zinc-950/30 rounded-xl border border-zinc-800 border-dashed">
                        <span className="text-zinc-500">Giá trị thực tế:</span>
                        <span className="text-zinc-500 italic">Đang chờ cập nhật trận đấu...</span>
                    </div>
                )}

                {/* Hiển thị Thực nhận dành riêng cho Booster */}
                {isBooster && hasMatches && (
                    <div className="flex flex-col justify-between items-center p-3 bg-emerald-900/10 rounded-xl border border-emerald-500/20">
                        <span className="text-emerald-200 font-medium">Số tiền về ví:</span>
                        <span className="text-emerald-400 font-bold text-lg">{settlement.boosterReceive.toLocaleString()} đ</span>
                    </div>
                )}

                {/* Cảnh báo thu nhập thấp cho Booster */}
                {isBooster && hasMatches && settlement.isLowEarnings && (
                    <div className="flex gap-3 p-3 bg-orange-900/20 rounded-xl border border-orange-500/50">
                        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                        <div className="text-sm">
                            <span className="text-orange-200 font-bold block mb-1">Cảnh báo thu nhập thấp!</span>
                            <span className="text-orange-300/80">
                                Do số trận thua (Loss) quá nhiều, thu nhập thực tế của bạn đang ở mức thấp hoặc âm ({settlement.boosterReceive.toLocaleString()} đ).
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col justify-between items-center p-3 bg-zinc-950/50 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400">Đã đặt cọc ({Math.round((pricing.deposit_amount / pricing.total_amount) * 100)}%):</span>
                    <span className="text-yellow-500 font-bold">- {settlement.paidDeposit.toLocaleString()} đ</span>
                </div>

                <div className="border-t border-zinc-800 my-2"></div>

                {hasMatches && settlement.status === 'OWE' && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 sm:p-4 bg-red-900/10 rounded-xl border border-red-500/30 animate-pulse">
                        <div className="flex items-center gap-2 min-w-0">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <span className="text-red-200 font-bold text-sm sm:text-base truncate">
                                {isCustomer ? 'Cần trả thêm:' : 'Khách trả thêm:'}
                            </span>
                        </div>
                        
                        {isCustomer ? (
                            <button 
                                onClick={handlePayRemaining}
                                className="w-full sm:w-auto py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20 active:scale-[0.98]"
                                title="Thanh toán ngay"
                            >
                                <Wallet className="w-4 h-4 shrink-0" />
                                <span>Thanh toán {settlement.remaining.toLocaleString()} đ</span>
                            </button>
                        ) : (
                            <span className="text-red-400 font-black text-lg sm:text-xl whitespace-nowrap w-full sm:w-auto text-left sm:text-right">
                                {settlement.remaining.toLocaleString()} đ
                            </span>
                        )}
                    </div>
                )}

                {hasMatches && settlement.status === 'REFUND' && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 sm:p-4 bg-green-900/10 rounded-xl border border-green-500/30">
                        <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                            <span className="text-green-200 font-bold text-sm sm:text-base truncate">
                                {isCustomer 
                                    ? 'Hoàn lại:' 
                                    : (isBooster ? 'Cần hoàn lại:' : 'Hoàn lại khách:')}
                            </span>
                        </div>
                        
                        {isBooster ? (
                            <button 
                                onClick={handleRefund}
                                className="w-full sm:w-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                                title="Xác nhận hoàn tiền"
                            >
                                <RefreshCcw className="w-4 h-4 shrink-0" />
                                <span>Xác nhận hoàn {Math.abs(settlement.remaining).toLocaleString()} đ</span>
                            </button>
                        ) : (
                            <span className="text-green-400 font-black text-lg sm:text-xl whitespace-nowrap w-full sm:w-auto text-left sm:text-right">
                                {Math.abs(settlement.remaining).toLocaleString()} đ
                            </span>
                        )}
                    </div>
                )}

                {hasMatches && settlement.status === 'SETTLED' && (
                    <div className="flex justify-between items-center p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-zinc-400" />
                            <span className="text-zinc-300 font-bold">Đã thanh toán đủ</span>
                        </div>
                        <span className="text-zinc-400 font-bold">0 đ</span>
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
                <p className="text-xs text-zinc-500 italic">
                    Số tiền quyết toán cuối cùng sẽ được chốt khi Booster bấm "Báo cáo hoàn thành". Hệ thống sẽ tự động tính toán dựa trên số liệu thực tế.
                </p>
            </div>
        </div>
    </div>
  );
}