'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Calendar,
  Loader2,
  Info,
  BarChart3,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { apiFetch } from '@/lib/api';

interface KpiMetric {
  key: string;
  label: string;
  unit: string;
  current: number | null;
  previous: number | null;
  delta: number | null;
  direction: 'UP' | 'DOWN' | 'FLAT';
  isPositiveChange: boolean | null;
  invertedPolarity: boolean;
  meaning: string;
}

interface RecentFormResponse {
  success: boolean;
  note: string;
  booster: {
    _id: string;
    username: string;
    displayName: string;
    overallScore: number | null;
    overallTier: string | null;
    overallTierName: string | null;
  };
  period: {
    days: number;
    granularity: 'day' | 'week';
    timezone: string;
  };
  trend: {
    status: 'IMPROVING' | 'STABLE' | 'DECLINING';
    label: string;
    score: number;
    highlights: string[];
  };
  kpis: KpiMetric[];
  timelineChart: Array<{
    dateKey: string;
    label: string;
    current: number;
    previous: number;
  }>;
}

interface BoosterRecentFormProps {
  boosterId: string;
  title?: string;
}

export default function BoosterRecentForm({
  boosterId,
  title = 'Phong độ gần đây (Trình độ & Xếp hạng)',
}: BoosterRecentFormProps) {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [granularity, setGranularity] = useState<'day' | 'week'>('day');
  const [data, setData] = useState<RecentFormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentForm = useCallback(async () => {
    if (!boosterId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<RecentFormResponse>(
        `/api/ranking/booster/${boosterId}/recent-form?days=${days}&granularity=${granularity}`
      );
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu phong độ gần đây');
    } finally {
      setLoading(false);
    }
  }, [boosterId, days, granularity]);

  useEffect(() => {
    fetchRecentForm();
  }, [fetchRecentForm]);

  const formatMetricValue = (val: number | null, unit: string) => {
    if (val === null || val === undefined) return '--';
    if (unit === '%') return `${val}%`;
    if (unit === '★') return `${val.toFixed(1)} ★`;
    return `${val.toLocaleString('vi-VN')} ${unit}`;
  };

  const formatDelta = (delta: number | null, unit: string) => {
    if (delta === null || delta === undefined) return 'N/A';
    const sign = delta > 0 ? '+' : '';
    if (unit === '%') return `${sign}${delta}%`;
    if (unit === '★') return `${sign}${delta.toFixed(1)} ★`;
    return `${sign}${delta} ${unit}`;
  };

  const trendStyles = {
    IMPROVING: {
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      box: 'from-emerald-950/30 via-zinc-900 to-zinc-900 border-emerald-500/30',
      icon: TrendingUp,
    },
    STABLE: {
      badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      box: 'from-blue-950/30 via-zinc-900 to-zinc-900 border-blue-500/30',
      icon: Minus,
    },
    DECLINING: {
      badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      box: 'from-rose-950/30 via-zinc-900 to-zinc-900 border-rose-500/30',
      icon: TrendingDown,
    },
  };

  return (
    <section className="rounded-2xl sm:rounded-3xl bg-zinc-900/60 border border-white/10 p-5 sm:p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>{title}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>
              Theo dõi hiệu suất {days} ngày gần nhất so với {days} ngày liền trước (không thay thế Performance Score tổng thể).
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector */}
          <div className="inline-flex items-center rounded-xl bg-zinc-950 border border-white/10 p-1">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  days === d
                    ? 'bg-cyan-500 text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {d} ngày
              </button>
            ))}
          </div>

          {/* Chart Granularity Selector */}
          <div className="inline-flex items-center rounded-xl bg-zinc-950 border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setGranularity('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                granularity === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Theo ngày
            </button>
            <button
              type="button"
              onClick={() => setGranularity('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                granularity === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Theo tuần
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
          <span className="text-xs font-medium">Đang tổng hợp số liệu {days} ngày...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : data ? (
        <>
          {/* Trend Banner & Highlights */}
          {(() => {
            const st = trendStyles[data.trend.status] || trendStyles.STABLE;
            const TrendIcon = st.icon;
            return (
              <div className={`rounded-2xl bg-gradient-to-br ${st.box} border p-5 space-y-3`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${st.badge}`}
                    >
                      <TrendIcon className="w-4 h-4" />
                      {data.trend.label} ({data.trend.status})
                    </span>
                    <span className="text-xs text-zinc-400">
                      Điểm biến động:{' '}
                      <strong className="text-white font-mono">
                        {data.trend.score > 0 ? `+${data.trend.score}` : data.trend.score}
                      </strong>
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    Múi giờ: {data.period.timezone}
                  </div>
                </div>

                {/* Notable Fluctuation Explanations */}
                <div className="space-y-1.5 pt-1">
                  {data.trend.highlights.map((h, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* KPI Grid (7 chỉ số chi tiết + 1 thẻ Performance Trend tổng hợp = 8 chỉ số) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {data.kpis.map((kpi) => {
              const ArrowIcon =
                kpi.direction === 'UP'
                  ? TrendingUp
                  : kpi.direction === 'DOWN'
                    ? TrendingDown
                    : Minus;

              const changeColor =
                kpi.isPositiveChange === true
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : kpi.isPositiveChange === false
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-zinc-400 bg-zinc-800/70 border-white/10';

              return (
                <div
                  key={kpi.key}
                  className="rounded-2xl bg-zinc-950/80 border border-white/10 p-4 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-400">{kpi.label}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${changeColor}`}
                    >
                      <ArrowIcon className="w-3 h-3" />
                      {formatDelta(kpi.delta, kpi.unit)}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-2xl font-black text-white font-mono">
                      {formatMetricValue(kpi.current, kpi.unit)}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Kỳ trước: {formatMetricValue(kpi.previous, kpi.unit)}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed border-t border-white/5 pt-2">
                    {kpi.meaning}
                  </p>
                </div>
              );
            })}

            {/* Thẻ thứ 8: Performance Trend & Overall Reference */}
            <div className="rounded-2xl bg-zinc-950/80 border border-cyan-500/25 p-4 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-cyan-400">Xu hướng phong độ</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {days} ngày
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xl font-black text-white">{data.trend.label}</span>
                {data.booster.overallTierName && (
                  <span className="text-[11px] text-zinc-400">
                    Tier: <strong className="text-amber-400">{data.booster.overallTierName}</strong>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed border-t border-white/5 pt-2">
                Đánh giá đa chiều (thành công, rating, đúng hạn, hủy đơn & khiếu nại xác nhận).
              </p>
            </div>
          </div>

          {/* Activity Timeline Chart */}
          <div className="rounded-2xl bg-zinc-950/70 border border-white/10 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                Số đơn hoàn thành ({granularity === 'day' ? 'theo ngày' : 'theo tuần'}) — Kỳ hiện tại vs Kỳ trước
              </h3>
            </div>

            {data.timelineChart.every((p) => p.current === 0 && p.previous === 0) ? (
              <div className="h-52 flex items-center justify-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                Chưa có đơn hàng hoàn thành nào trong {days * 2} ngày qua để vẽ biểu đồ.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.timelineChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#71717a', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      interval={granularity === 'day' && days >= 30 ? Math.floor(days / 10) : 0}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#71717a', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: 'rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#fff',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Bar
                      dataKey="current"
                      name={`Kỳ hiện tại (${days}N)`}
                      fill="#06b6d4"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="previous"
                      name={`Kỳ trước (${days}N)`}
                      fill="#52525b"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
