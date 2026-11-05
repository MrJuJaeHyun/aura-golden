/**
 * Aura Golden 자산관리 시스템 - 핵심 타입 정의
 * 
 * 엑셀 시트 1: 월별 주식계좌 자산 관리
 * 엑셀 시트 2: 연간 종목별 배당금 매트릭스
 * 뷰 3: 대시보드 (월별 수익률 꺾은선 그래프)
 */

// 1. 개별 종목 자산 데이터 (엑셀의 한 row)
export interface StockItem {
  id: string;
  monthlyRecordId: string; // 소속된 연월 ID
  accountId: string;       // 계좌 ID (예: '연금저축(한화투자)')
  accountName: string;     // 계좌 표시명
  stockName: string;       // 종목명 (예: 'ACE 미국S&P500')
  quantity: number;        // 수량
  avgBuyPrice: number;     // 매입단가 (평균단가)
  currentPrice: number;    // 현재가 (현재단가)
  buyAmount: number;       // 총매입금액 = 수량 * 매입단가
  evaluatedAmount: number; // 평가금액 = 수량 * 현재가
  dividendOrProfit: number;// 배당금/수익
  evaluatedProfit: number; // 평가손익 = 평가금액 - 매입금액
  profitRate: number;      // 수익률 = (평가손익 / 매입금액) * 100
  orderIndex?: number;
}

// 2. 계좌별 그룹핑 데이터 (UI 렌더링용)
export interface AccountGroup {
  accountId: string;
  accountName: string;
  items: StockItem[];
  subtotalBuyAmount: number;
  subtotalEvaluatedAmount: number;
  subtotalDividendOrProfit: number;
  subtotalEvaluatedProfit: number;
  subtotalProfitRate: number;
}

// 3. 월별 정산 마스터 데이터 (한 달의 전체 요약)
export interface MonthlyRecord {
  id: string;
  userId: string;
  yearMonth: string;          // '2026.09', '2026.10'
  realizedGain: number;       // 월말 매도손익 (예: 20000, -336743)
  realInvestedCapital: number;// 실 투입 원금 = 총매입금액 - 배당금/수익 합계
  memo?: string;
  items: StockItem[];
  // 계산된 요약 집계값
  totalBuyAmount: number;        // 총 매입금액 합계
  totalEvaluatedAmount: number;  // 총 평가금액 합계
  totalDividendOrProfit: number; // 총 배당금/수익 합계 (개별 종목 배당합 + 매도손익)
  totalProfit: number;           // 총 손익 = (평가금액 - 매입금액) + 총 배당금/수익
  totalProfitRate: number;       // 총 수익률 = (총 손익 / 총 매입금액) * 100
}

// 4. 연간 종목별 배당금 매트릭스 데이터 (엑셀 시트 2)
export interface AnnualDividendItem {
  id: string;
  userId: string;
  year: number;          // 2026
  stockName: string;     // 종목명 (예: 'TIGER 미국배당다우존스')
  months: number[];      // 1월 ~ 12월 배당금 (길이 12의 배열)
  annualTotal: number;   // 연간 합계
  orderIndex?: number;
}

// 5. 연간 배당금 요약 통계
export interface AnnualDividendSummary {
  year: number;
  items: AnnualDividendItem[];
  monthlyTotals: number[]; // 각 월별(1~12월) 합계 (길이 12)
  grandTotal: number;      // 연간 총 배당금 합계
}

// 6. 대시보드 꺾은선 차트용 월별 데이터 포인트
export interface MonthlyPerformancePoint {
  yearMonth: string;
  totalBuyAmount: number;
  totalEvaluatedAmount: number;
  realInvestedCapital: number;
  totalProfit: number;
  totalProfitRate: number;
  totalDividendOrProfit: number;
}

// 7. 지원되는 기본 계좌 목록 프리셋
export const DEFAULT_ACCOUNTS = [
  "연금저축(한화투자)",
  "연금저축(미래에셋)",
  "일반(토스)",
  "IRP(퇴직금-미래)",
  "IRP(개인-한국)",
  "ISA",
];
