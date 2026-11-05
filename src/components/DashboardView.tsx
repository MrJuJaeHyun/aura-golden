"use client";

/**
 * Aura Golden 자산 대시보드 및 월별 수익률 꺾은선 그래프 뷰 (DashboardView.tsx)
 * 
 * [피드백 4 대응]
 * - 월별 누적 수익률(%) 추이를 직관적인 꺾은선 그래프(Line Chart)로 시각화
 * - 실 투입 원금 대비 총 자산(평가금액)의 성장 추이 분석
 * - 인터랙티브 SVG 차트 및 데이터 포인트 호버 툴팁 지원
 */

import React, { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, BarChart2, Calendar } from "lucide-react";
import { getMonthlyPerformanceHistory } from "@/lib/dataStore";
import { formatKRW, formatPercent } from "@/lib/calculations";
import { MonthlyPerformancePoint } from "@/types";

export const DashboardView: React.FC = () => {
  const history: MonthlyPerformancePoint[] = getMonthlyPerformanceHistory();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 최신 월 데이터 및 전월 대비 계산
  const latest = history.length > 0 ? history[history.length - 1] : null;

  // 차트 렌더링을 위한 좌표 계산 (SVG)
  const chartWidth = 700;
  const chartHeight = 260;
  const paddingX = 60;
  const paddingY = 40;

  // 수익률 최소/최대값 산출 (최소 -5% ~ +15% 기본 여유 확보)
  const allRates = history.map((h) => h.totalProfitRate);
  const minRate = Math.min(...allRates, 0) - 2;
  const maxRate = Math.max(...allRates, 10) + 3;
  const rateRange = maxRate - minRate || 1;

  // 데이터 포인트 좌표 배열 변환
  const points = history.map((item, idx) => {
    const x =
      history.length === 1
        ? chartWidth / 2
        : paddingX + (idx / (history.length - 1)) * (chartWidth - paddingX * 2);
    const y =
      chartHeight -
      paddingY -
      ((item.totalProfitRate - minRate) / rateRange) * (chartHeight - paddingY * 2);
    return { x, y, item, idx };
  });

  // 꺾은선 SVG path 생성
  const linePath = points.reduce((path, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
  }, "");

  // 영역 채우기용 path (그라데이션)
  const zeroY =
    chartHeight - paddingY - ((0 - minRate) / rateRange) * (chartHeight - paddingY * 2);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${
          points[0].x
        } ${chartHeight - paddingY} Z`
      : "";

  return (
    <div className="space-y-6">
      
      {/* 1. 상단 핵심 성과 지표 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 현재 총 평가자산 */}
        <div className="p-5 rounded-2xl bg-aura-card border border-aura-border shadow-lg">
          <div className="flex items-center justify-between text-aura-muted">
            <span className="text-xs font-semibold">총 평가자산</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">
            ₩ {latest ? formatKRW(latest.totalEvaluatedAmount) : "0"}
          </p>
          <p className="text-[11px] text-aura-muted mt-1">
            최근 집계: {latest ? latest.yearMonth : "-"}
          </p>
        </div>

        {/* 누적 실 투입 원금 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 to-aura-card border-2 border-amber-500/40 shadow-lg">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-bold">실 투입 원금 (순원금)</span>
            <PiggyBank className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 gold-text-gradient">
            ₩ {latest ? formatKRW(latest.realInvestedCapital) : "0"}
          </p>
          <p className="text-[11px] text-aura-muted mt-1">
            총매입금 - 누적배당수익
          </p>
        </div>

        {/* 총 누적 배당금 및 수익 */}
        <div className="p-5 rounded-2xl bg-aura-card border border-aura-border shadow-lg">
          <div className="flex items-center justify-between text-aura-muted">
            <span className="text-xs font-semibold">누적 배당금 / 매도수익</span>
            <BarChart2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">
            ₩ {latest ? formatKRW(latest.totalDividendOrProfit) : "0"}
          </p>
          <p className="text-[11px] text-aura-muted mt-1">
            배당금 + 실현 매도손익
          </p>
        </div>

        {/* 최근 총 수익률 */}
        <div className={`p-5 rounded-2xl bg-aura-card border shadow-lg ${
          latest && latest.totalProfitRate >= 0 ? "border-rose-500/30" : "border-sky-500/30"
        }`}>
          <div className="flex items-center justify-between text-aura-muted">
            <span className="text-xs font-semibold">최근 종합 수익률</span>
            {latest && latest.totalProfitRate >= 0 ? (
              <TrendingUp className="w-5 h-5 text-rose-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-sky-400" />
            )}
          </div>
          <p className={`text-2xl font-black mt-2 ${
            latest && latest.totalProfitRate >= 0 ? "text-rose-500" : "text-sky-400"
          }`}>
            {latest ? formatPercent(latest.totalProfitRate) : "0.00%"}
          </p>
          <p className="text-[11px] text-aura-muted mt-1">
            평가손익: ₩ {latest ? formatKRW(latest.totalProfit) : "0"}
          </p>
        </div>

      </div>

      {/* 2. 메인: 월별 수익률 추이 꺾은선 차트 (Line Chart) */}
      <div className="p-6 rounded-2xl bg-aura-card border border-aura-border shadow-xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              월별 포트폴리오 수익률 추이 (꺾은선 그래프)
            </h3>
          </div>
          <div className="flex items-center space-x-4 text-xs text-aura-muted">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span>수익률 (%)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-slate-500 inline-block" />
              <span>0% 기준선</span>
            </span>
          </div>
        </div>

        {/* 반응형 SVG 꺾은선 그래프 영역 */}
        <div className="w-full overflow-x-auto">
          {history.length === 0 ? (
            <div className="py-16 text-center text-aura-muted flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-200">
                아직 누적된 월별 정산 기록이 없습니다.
              </p>
              <p className="text-xs text-aura-muted">
                상단의 <strong>[월별 주식계좌 관리]</strong> 탭에서 첫 달의 자산을 기록하시면, 이곳에 멋진 월별 수익률 꺾은선 그래프가 자동으로 그려집니다!
              </p>
            </div>
          ) : (
          <div className="min-w-[650px] relative">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                {/* 꺾은선 아래 그라데이션 */}
                <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* 가로 보조 그리드 라인 */}
              {[minRate, 0, (minRate + maxRate) / 2, maxRate].map((r, i) => {
                const y =
                  chartHeight -
                  paddingY -
                  ((r - minRate) / rateRange) * (chartHeight - paddingY * 2);
                const isZero = Math.abs(r) < 0.1;
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke={isZero ? "#64748b" : "#1e293b"}
                      strokeWidth={isZero ? 1.5 : 1}
                      strokeDasharray={isZero ? "4 4" : undefined}
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      fill="#94a3b8"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {r.toFixed(1)}%
                    </text>
                  </g>
                );
              })}

              {/* 영역 그라데이션 채우기 */}
              {areaPath && <path d={areaPath} fill="url(#rateGradient)" />}

              {/* 꺾은선 메인 라인 */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#d4af37"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* 데이터 포인트 도트 & 호버 인터랙션 */}
              {points.map((pt) => {
                const isHovered = hoveredIndex === pt.idx;
                return (
                  <g key={pt.idx}>
                    {/* 투명한 확장 클릭/호버 감지 영역 */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="16"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(pt.idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                    {/* 바깥 링 */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? "7" : "5"}
                      fill="#0b0f19"
                      stroke="#d4af37"
                      strokeWidth="2.5"
                      className="transition-all duration-150 pointer-events-none"
                    />
                    {/* 내부 포인트 */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="2.5"
                      fill="#ffffff"
                      className="pointer-events-none"
                    />
                    {/* x축 연월 라벨 */}
                    <text
                      x={pt.x}
                      y={chartHeight - 12}
                      fill="#cbd5e1"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {pt.item.yearMonth}
                    </text>
                    {/* 도트 위 퍼센트 표시 */}
                    <text
                      x={pt.x}
                      y={pt.y - 12}
                      fill={pt.item.totalProfitRate >= 0 ? "#f43f5e" : "#38bdf8"}
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {formatPercent(pt.item.totalProfitRate)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* 마우스 호버 시 상세 플로팅 툴팁 */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <div
                className="absolute z-20 pointer-events-none bg-aura-card/95 border border-amber-400 p-3 rounded-xl shadow-2xl text-xs backdrop-blur"
                style={{
                  left: `${Math.min(
                    Math.max((points[hoveredIndex].x / chartWidth) * 100, 15),
                    80
                  )}%`,
                  top: "20px",
                  transform: "translateX(-50%)",
                }}
              >
                <p className="font-bold text-amber-300 border-b border-aura-border pb-1 mb-1.5 flex items-center justify-between">
                  <span>{points[hoveredIndex].item.yearMonth} 정산 결과</span>
                  <span className="text-rose-400 font-mono">
                    {formatPercent(points[hoveredIndex].item.totalProfitRate)}
                  </span>
                </p>
                <div className="space-y-1 text-slate-300 font-mono">
                  <div className="flex justify-between space-x-4">
                    <span className="text-aura-muted">총 평가금액:</span>
                    <span className="font-bold text-white">
                      ₩ {formatKRW(points[hoveredIndex].item.totalEvaluatedAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between space-x-4">
                    <span className="text-aura-muted">실 투입원금:</span>
                    <span className="text-amber-300">
                      ₩ {formatKRW(points[hoveredIndex].item.realInvestedCapital)}
                    </span>
                  </div>
                  <div className="flex justify-between space-x-4">
                    <span className="text-aura-muted">총 손익:</span>
                    <span
                      className={
                        points[hoveredIndex].item.totalProfit >= 0
                          ? "text-rose-400 font-bold"
                          : "text-sky-400 font-bold"
                      }
                    >
                      ₩ {formatKRW(points[hoveredIndex].item.totalProfit)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* 3. 월별 히스토리 요약 표 */}
      <div className="bg-aura-card border border-aura-border rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-aura-border flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-slate-100">
            월별 누적 성과 요약 테이블
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs finance-table">
            <thead>
              <tr className="bg-amber-400 text-black font-extrabold text-[12px] border-b border-amber-500">
                <th className="py-3 px-4 text-center">연월</th>
                <th className="py-3 px-4 text-center">총 매입금액</th>
                <th className="py-3 px-4 text-center">총 평가금액</th>
                <th className="py-3 px-4 text-center">총 배당/매도수익</th>
                <th className="py-3 px-4 text-center">실 투입 원금</th>
                <th className="py-3 px-4 text-center">총 평가손익</th>
                <th className="py-3 px-4 text-center">최종 수익률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border font-medium text-slate-200">
              {history.map((row) => (
                <tr key={row.yearMonth} className="hover:bg-aura-cardHover/60 transition">
                  <td className="py-3.5 px-4 text-center font-bold text-amber-300 font-mono">
                    {row.yearMonth}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                    {formatKRW(row.totalBuyAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-100 font-semibold">
                    {formatKRW(row.totalEvaluatedAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                    {formatKRW(row.totalDividendOrProfit)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-amber-300 font-bold">
                    {formatKRW(row.realInvestedCapital)}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right font-mono font-bold ${
                      row.totalProfit >= 0 ? "text-rose-500" : "text-sky-400"
                    }`}
                  >
                    {formatKRW(row.totalProfit)}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right font-mono font-black ${
                      row.totalProfitRate >= 0 ? "text-rose-500" : "text-sky-400"
                    }`}
                  >
                    {formatPercent(row.totalProfitRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
