/**
 * Aura Golden 금융 계산 엔진 (calculations.ts)
 * 
 * 엑셀 시트 1과 2의 모든 수식을 정확하고 일관되게 계산하는 순수 유틸리티 모듈입니다.
 */

import { StockItem, MonthlyRecord, AnnualDividendItem, AnnualDividendSummary } from "@/types";

/**
 * 개별 종목의 매입금액, 평가금액, 평가손익, 수익률을 계산합니다.
 * 
 * [엑셀 수식 반영]
 * - 매입금액 = 수량 * 매입단가
 * - 평가금액 = 수량 * 현재가
 * - 평가손익 = (평가금액 - 매입금액) + 배당금/수익
 *   (단순 시세차익뿐만 아니라 해당 종목에서 발생한 배당금/수익이 합산되어 실질 손익을 반영함)
 * - 수익률 = (평가손익 / 매입금액) * 100
 * 
 * @param quantity 보유 수량
 * @param avgBuyPrice 매입단가 (평균단가)
 * @param currentPrice 현재가 (현재단가)
 * @param dividendOrProfit 배당금/수익
 */
export function calculateStockMetrics(
  quantity: number,
  avgBuyPrice: number,
  currentPrice: number,
  dividendOrProfit: number = 0
) {
  // 1. 매입금액 = 수량 * 매입단가
  const buyAmount = Math.round(quantity * avgBuyPrice);

  // 2. 평가금액 = 수량 * 현재가
  const evaluatedAmount = Math.round(quantity * currentPrice);

  // 3. 단순 시세차익
  const capitalGain = evaluatedAmount - buyAmount;

  // 4. 최종 평가손익 = 시세차익 + 배당금/수익 (엑셀 시트 1의 계산 방식)
  const evaluatedProfit = capitalGain + (Number(dividendOrProfit) || 0);

  // 5. 수익률 = (평가손익 / 매입금액) * 100
  const profitRate = buyAmount > 0 ? (evaluatedProfit / buyAmount) * 100 : 0;

  return {
    buyAmount,
    evaluatedAmount,
    dividendOrProfit: Number(dividendOrProfit) || 0,
    evaluatedProfit,
    profitRate: Number(profitRate.toFixed(2)), // 소수점 2자리 반올림
  };
}

/**
 * 특정 월의 전체 종목 리스트와 매도손익을 바탕으로 월별 종합 요약 지표를 계산합니다.
 * 
 * [엑셀 수식 일치 검증]
 * - 2026.09 기준:
 *   총 매입금액: 115,316,988
 *   총 평가금액: 121,361,090
 *   종목 배당합 + 매도손익(20,000) = 2,436,750
 *   총 평가손익: (121,361,090 - 115,316,988) + 2,436,750 = 8,480,852 (7.35%)
 *   실 투입 원금: 115,316,988 - 2,436,750 = 112,880,238
 */
export function calculateMonthlySummary(
  items: StockItem[],
  realizedGain: number = 0
): Omit<MonthlyRecord, "id" | "userId" | "yearMonth" | "items" | "memo"> {
  let totalBuyAmount = 0;
  let totalEvaluatedAmount = 0;
  let stockDividendSum = 0;

  for (const item of items) {
    totalBuyAmount += item.buyAmount;
    totalEvaluatedAmount += item.evaluatedAmount;
    stockDividendSum += (item.dividendOrProfit || 0);
  }

  // 총 배당금/수익 = 종목별 배당금 합계 + 월말 매도손익
  const totalDividendOrProfit = stockDividendSum + (Number(realizedGain) || 0);

  // 단순 주가 변동에 따른 평가차액
  const rawEvaluationDiff = totalEvaluatedAmount - totalBuyAmount;

  // 최종 합산 평가손익 = 시세차익 + 총 배당금/수익 (매도손익 포함)
  const totalProfit = rawEvaluationDiff + totalDividendOrProfit;

  // 전체 수익률 = (총 평가손익 / 총 매입금액) * 100
  const totalProfitRate =
    totalBuyAmount > 0 ? Number(((totalProfit / totalBuyAmount) * 100).toFixed(2)) : 0;

  // 실 투입 원금 (배당/수익 제외) = 총 매입금액 - 총 배당금/수익
  const realInvestedCapital = totalBuyAmount - totalDividendOrProfit;

  return {
    realizedGain: Number(realizedGain) || 0,
    realInvestedCapital,
    totalBuyAmount,
    totalEvaluatedAmount,
    totalDividendOrProfit,
    totalProfit,
    totalProfitRate,
  };
}

/**
 * 연간 배당금 매트릭스(1~12월)의 종목별 연간 합계 및 월별 합산 요약을 계산합니다.
 */
export function calculateAnnualDividendSummary(
  year: number,
  items: AnnualDividendItem[]
): AnnualDividendSummary {
  const monthlyTotals = new Array(12).fill(0);
  let grandTotal = 0;

  const processedItems = items.map((item) => {
    // 종목의 1~12월 합계
    const annualTotal = item.months.reduce((sum, val) => sum + (Number(val) || 0), 0);
    grandTotal += annualTotal;

    // 각 월별 합계 누적
    item.months.forEach((val, idx) => {
      monthlyTotals[idx] += Number(val) || 0;
    });

    return {
      ...item,
      annualTotal,
    };
  });

  return {
    year,
    items: processedItems,
    monthlyTotals,
    grandTotal,
  };
}

/**
 * 한국 원화(KRW) 천단위 콤마 포맷터
 */
export function formatKRW(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return "0";
  return new Intl.NumberFormat("ko-KR").format(Math.round(val));
}

/**
 * 수익률 퍼센트 포맷터 (예: +7.35%, -1.40%)
 */
export function formatPercent(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return "0.00%";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}
