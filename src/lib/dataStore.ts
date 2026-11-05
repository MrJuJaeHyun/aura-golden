/**
 * Aura Golden 데이터 저장소 엔진 (dataStore.ts)
 * 
 * [완전한 보안 & 데이터 초기화(Zero Data)]
 * 1. 어떠한 계정으로 로그인/가입하더라도 최초에는 자산 및 배당금 데이터가 전혀 없는 완전한 빈 상태([])로 시작합니다.
 * 2. 사용자가 직접 [+ 새 월 생성] 및 [+ 종목 추가]를 통해 처음부터 자신의 진짜 자산만 관리합니다.
 * 3. 사용자별 완전 격리: 각 사용자의 자산은 오직 자신의 ID(userId) 공간에만 저장되며, 타 계정에서 절대 조회할 수 없습니다.
 */

import {
  MonthlyRecord,
  StockItem,
  AnnualDividendItem,
  MonthlyPerformancePoint,
  DEFAULT_ACCOUNTS,
} from "@/types";
import { calculateStockMetrics, calculateMonthlySummary } from "./calculations";
import { hashPassword } from "./crypto";

// 저장소 키 프리픽스
const STORAGE_PREFIX_MONTHLY = "aura_golden_monthly_records_";
const STORAGE_PREFIX_DIVIDENDS = "aura_golden_annual_dividends_";
const STORAGE_PREFIX_ACCOUNTS = "aura_golden_accounts_";
const STORAGE_PREFIX_DIV_YEARS = "aura_golden_dividend_years_";

const STORAGE_KEY_AUTH_SESSION = "aura_golden_auth_session";
const STORAGE_KEY_USERS_DB = "aura_golden_registered_users";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface RegisteredAccount {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

// ----------------------------------------------------------------------
// 1. 유저 계정 데이터베이스 & 인증 관리
// ----------------------------------------------------------------------

export function getAllRegisteredUsers(): RegisteredAccount[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * 신규 회원가입 (이메일 중복 체크 & 비밀번호 단방향 암호화)
 * 신규 생성된 계정은 완전히 빈 상태(자산 0건, 배당 0건)로 생성됩니다.
 */
export async function registerLocalAccount(
  emailInput: string,
  passwordInput: string
): Promise<AuthUser> {
  const email = emailInput.trim().toLowerCase();
  if (!email || !passwordInput) {
    throw new Error("이메일과 비밀번호를 모두 입력해주세요.");
  }
  if (passwordInput.length < 4) {
    throw new Error("보안을 위해 비밀번호는 4자리 이상이어야 합니다.");
  }

  const users = getAllRegisteredUsers();

  // 이메일 고유값 중복 검증
  const existing = users.find((u) => u.email === email);
  if (existing) {
    throw new Error(
      `'${email}'은(는) 이미 등록된 이메일 주소입니다. [로그인] 탭으로 전환하여 로그인해 주세요.`
    );
  }

  // SHA-256 암호화 해싱
  const passwordHash = await hashPassword(passwordInput);

  const newUser: RegisteredAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email,
    passwordHash,
    name: email.split("@")[0] || "사용자",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));

  const authUser: AuthUser = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
  };

  // 신규 계정 전용 완전히 빈 격리 저장소 초기화 (샘플 데이터 일절 없음)
  initZeroDataForUser(newUser.id);

  setLocalUser(authUser);
  return authUser;
}

/**
 * 사용자 로그인 (이메일 및 비밀번호 검증)
 */
export async function loginLocalAccount(
  emailInput: string,
  passwordInput: string
): Promise<AuthUser> {
  const email = emailInput.trim().toLowerCase();
  const users = getAllRegisteredUsers();

  const user = users.find((u) => u.email === email);
  if (!user) {
    throw new Error(
      `등록되지 않은 이메일 주소입니다. [회원가입] 탭에서 계정을 먼저 생성해 주세요.`
    );
  }

  const inputHash = await hashPassword(passwordInput);
  if (user.passwordHash !== inputHash) {
    throw new Error("비밀번호가 일치하지 않습니다. 비밀번호를 다시 확인해 주세요.");
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  setLocalUser(authUser);
  return authUser;
}

export function getLocalUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(STORAGE_KEY_AUTH_SESSION);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export function setLocalUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
  } else {
    localStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(user));
  }
}

/**
 * 신규 가입자 전용 빈 저장소 초기화 (모든 데이터 0건)
 */
function initZeroDataForUser(userId: string): void {
  if (typeof window === "undefined") return;

  // 1. 월별 포트폴리오: 완전히 빈 배열
  localStorage.setItem(`${STORAGE_PREFIX_MONTHLY}${userId}`, JSON.stringify([]));

  // 2. 연간 배당금: 완전히 빈 배열
  localStorage.setItem(`${STORAGE_PREFIX_DIVIDENDS}${userId}`, JSON.stringify([]));

  // 3. 계좌 목록: 기본 추천 프리셋 제공 (추가/삭제 자유)
  localStorage.setItem(`${STORAGE_PREFIX_ACCOUNTS}${userId}`, JSON.stringify(DEFAULT_ACCOUNTS));

  // 4. 배당 연도: 현재 연도(2026)만 기본 설정
  localStorage.setItem(`${STORAGE_PREFIX_DIV_YEARS}${userId}`, JSON.stringify([new Date().getFullYear()]));
}

// ----------------------------------------------------------------------
// 2. 계정별 완전 격리된 데이터 CRUD 함수 (User-Isolated Storage)
// ----------------------------------------------------------------------

function getCurrentUserId(): string {
  const user = getLocalUser();
  return user ? user.id : "guest_unauthorized";
}

/**
 * 등록된 계좌 목록 조회
 */
export function getCustomAccounts(): string[] {
  if (typeof window === "undefined") return DEFAULT_ACCOUNTS;
  const uid = getCurrentUserId();
  const raw = localStorage.getItem(`${STORAGE_PREFIX_ACCOUNTS}${uid}`);
  if (!raw) {
    return DEFAULT_ACCOUNTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

/**
 * 새로운 계좌 추가
 */
export function addCustomAccount(newAccountName: string): string[] {
  if (typeof window === "undefined") return DEFAULT_ACCOUNTS;
  const trimmed = newAccountName.trim();
  if (!trimmed) return getCustomAccounts();

  const uid = getCurrentUserId();
  const current = getCustomAccounts();
  if (!current.includes(trimmed)) {
    const updated = [...current, trimmed];
    localStorage.setItem(`${STORAGE_PREFIX_ACCOUNTS}${uid}`, JSON.stringify(updated));
    return updated;
  }
  return current;
}

/**
 * 월별 포트폴리오 기록 조회 (본인 계정 데이터만 반환, 최초에는 [])
 */
export function getMonthlyRecords(): MonthlyRecord[] {
  if (typeof window === "undefined") return [];
  const uid = getCurrentUserId();
  if (uid === "guest_unauthorized") return [];

  const raw = localStorage.getItem(`${STORAGE_PREFIX_MONTHLY}${uid}`);
  if (!raw) {
    initZeroDataForUser(uid);
    return [];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getMonthlyRecordByYearMonth(yearMonth: string): MonthlyRecord | null {
  const records = getMonthlyRecords();
  return records.find((r) => r.yearMonth === yearMonth) || null;
}

/**
 * 새로운 빈 월별 레코드 생성
 */
export function createEmptyMonthlyRecord(yearMonth: string): MonthlyRecord {
  const uid = getCurrentUserId();
  const newRecord: MonthlyRecord = {
    id: `rec_${yearMonth.replace(".", "_")}_${Date.now()}`,
    userId: uid,
    yearMonth,
    realizedGain: 0,
    realInvestedCapital: 0,
    items: [],
    memo: `${yearMonth} 정산`,
    totalBuyAmount: 0,
    totalEvaluatedAmount: 0,
    totalDividendOrProfit: 0,
    totalProfit: 0,
    totalProfitRate: 0,
  };
  saveMonthlyRecord(newRecord);
  return newRecord;
}

/**
 * 월별 포트폴리오 저장/업데이트
 */
export function saveMonthlyRecord(record: MonthlyRecord): void {
  if (typeof window === "undefined") return;
  const uid = getCurrentUserId();
  const records = getMonthlyRecords();
  const index = records.findIndex((r) => r.yearMonth === record.yearMonth);

  const summary = calculateMonthlySummary(record.items, record.realizedGain);
  const updatedRecord: MonthlyRecord = {
    ...record,
    userId: uid,
    ...summary,
  };

  if (index >= 0) {
    records[index] = updatedRecord;
  } else {
    records.unshift(updatedRecord);
  }

  records.sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
  localStorage.setItem(`${STORAGE_PREFIX_MONTHLY}${uid}`, JSON.stringify(records));
}

/**
 * 인라인 수정
 */
export function updateStockItemField(
  yearMonth: string,
  itemId: string,
  field: "quantity" | "avgBuyPrice" | "currentPrice" | "dividendOrProfit",
  value: number
): MonthlyRecord {
  const record = getMonthlyRecordByYearMonth(yearMonth);
  if (!record) throw new Error("해당 월 레코드가 없습니다.");

  const itemIdx = record.items.findIndex((i) => i.id === itemId);
  if (itemIdx === 0 || itemIdx > 0) {
    const currentItem = record.items[itemIdx];
    const newQty = field === "quantity" ? value : currentItem.quantity;
    const newAvgPrice = field === "avgBuyPrice" ? value : currentItem.avgBuyPrice;
    const newCurPrice = field === "currentPrice" ? value : currentItem.currentPrice;
    const newDiv = field === "dividendOrProfit" ? value : currentItem.dividendOrProfit;

    const metrics = calculateStockMetrics(newQty, newAvgPrice, newCurPrice, newDiv);

    record.items[itemIdx] = {
      ...currentItem,
      quantity: newQty,
      avgBuyPrice: newAvgPrice,
      currentPrice: newCurPrice,
      ...metrics,
    };

    saveMonthlyRecord(record);
  }

  return getMonthlyRecordByYearMonth(yearMonth)!;
}

export function upsertStockItem(
  yearMonth: string,
  itemInput: {
    id?: string;
    accountName: string;
    stockName: string;
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
    dividendOrProfit?: number;
  }
): MonthlyRecord {
  const uid = getCurrentUserId();
  let record = getMonthlyRecordByYearMonth(yearMonth);
  if (!record) {
    record = createEmptyMonthlyRecord(yearMonth);
  }

  const metrics = calculateStockMetrics(
    itemInput.quantity,
    itemInput.avgBuyPrice,
    itemInput.currentPrice,
    itemInput.dividendOrProfit || 0
  );

  const itemId = itemInput.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newItem: StockItem = {
    id: itemId,
    monthlyRecordId: record.id,
    accountId: `acc_${itemInput.accountName}`,
    accountName: itemInput.accountName,
    stockName: itemInput.stockName,
    quantity: itemInput.quantity,
    avgBuyPrice: itemInput.avgBuyPrice,
    currentPrice: itemInput.currentPrice,
    ...metrics,
  };

  const existingIdx = record.items.findIndex((i) => i.id === itemId);
  if (existingIdx >= 0) {
    record.items[existingIdx] = newItem;
  } else {
    record.items.push(newItem);
  }

  saveMonthlyRecord(record);
  return getMonthlyRecordByYearMonth(yearMonth)!;
}

export function deleteStockItem(yearMonth: string, itemId: string): MonthlyRecord {
  const record = getMonthlyRecordByYearMonth(yearMonth);
  if (!record) throw new Error("해당 연월 데이터를 찾을 수 없습니다.");

  record.items = record.items.filter((i) => i.id !== itemId);
  saveMonthlyRecord(record);
  return getMonthlyRecordByYearMonth(yearMonth)!;
}

export function updateMonthlyRealizedGain(yearMonth: string, realizedGain: number): MonthlyRecord {
  const record = getMonthlyRecordByYearMonth(yearMonth);
  if (!record) throw new Error("해당 연월 데이터를 찾을 수 없습니다.");

  record.realizedGain = realizedGain;
  saveMonthlyRecord(record);
  return getMonthlyRecordByYearMonth(yearMonth)!;
}

export function copyPortfolioFromPreviousMonth(
  fromYearMonth: string,
  toYearMonth: string
): MonthlyRecord {
  const uid = getCurrentUserId();
  const source = getMonthlyRecordByYearMonth(fromYearMonth);
  if (!source) throw new Error("복사할 원본 연월 데이터가 없습니다.");

  const copiedItems: StockItem[] = source.items.map((item, idx) => {
    const metrics = calculateStockMetrics(
      item.quantity,
      item.avgBuyPrice,
      item.currentPrice,
      0
    );
    return {
      id: `item_${toYearMonth.replace(".", "_")}_${idx + 1}_${Date.now()}`,
      monthlyRecordId: `rec_${toYearMonth.replace(".", "_")}`,
      accountId: item.accountId,
      accountName: item.accountName,
      stockName: item.stockName,
      quantity: item.quantity,
      avgBuyPrice: item.avgBuyPrice,
      currentPrice: item.currentPrice,
      ...metrics,
    };
  });

  const newRecord: MonthlyRecord = {
    id: `rec_${toYearMonth.replace(".", "_")}`,
    userId: uid,
    yearMonth: toYearMonth,
    realizedGain: 0,
    realInvestedCapital: 0,
    items: copiedItems,
    memo: `${toYearMonth} 정산`,
    totalBuyAmount: 0,
    totalEvaluatedAmount: 0,
    totalDividendOrProfit: 0,
    totalProfit: 0,
    totalProfitRate: 0,
  };

  saveMonthlyRecord(newRecord);
  return getMonthlyRecordByYearMonth(toYearMonth)!;
}

/**
 * 대시보드 성과 히스토리 반환
 */
export function getMonthlyPerformanceHistory(): MonthlyPerformancePoint[] {
  const records = getMonthlyRecords();
  const sorted = [...records].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));

  return sorted.map((r) => ({
    yearMonth: r.yearMonth,
    totalBuyAmount: r.totalBuyAmount,
    totalEvaluatedAmount: r.totalEvaluatedAmount,
    realInvestedCapital: r.realInvestedCapital,
    totalProfit: r.totalProfit,
    totalProfitRate: r.totalProfitRate,
    totalDividendOrProfit: r.totalDividendOrProfit,
  }));
}

/**
 * 배당금 연도 목록 조회
 */
export function getDividendYears(): number[] {
  if (typeof window === "undefined") return [new Date().getFullYear()];
  const uid = getCurrentUserId();
  const raw = localStorage.getItem(`${STORAGE_PREFIX_DIV_YEARS}${uid}`);
  if (!raw) return [new Date().getFullYear()];
  try {
    return JSON.parse(raw);
  } catch {
    return [new Date().getFullYear()];
  }
}

/**
 * 새로운 배당 연도 추가
 */
export function addDividendYear(newYear: number): number[] {
  if (typeof window === "undefined") return [newYear];
  const uid = getCurrentUserId();
  const years = getDividendYears();
  if (!years.includes(newYear)) {
    const updated = [...years, newYear].sort((a, b) => a - b);
    localStorage.setItem(`${STORAGE_PREFIX_DIV_YEARS}${uid}`, JSON.stringify(updated));
    return updated;
  }
  return years;
}

/**
 * 연간 배당금 매트릭스 조회 (최초 빈 배열 [])
 */
export function getAnnualDividends(year: number = new Date().getFullYear()): AnnualDividendItem[] {
  if (typeof window === "undefined") return [];
  const uid = getCurrentUserId();
  if (uid === "guest_unauthorized") return [];

  const raw = localStorage.getItem(`${STORAGE_PREFIX_DIVIDENDS}${uid}`);
  if (!raw) {
    initZeroDataForUser(uid);
    return [];
  }

  try {
    const all = JSON.parse(raw) as AnnualDividendItem[];
    return all.filter((d) => d.year === year);
  } catch {
    return [];
  }
}

/**
 * 특정 연도/월 배당금 수정
 */
export function updateDividendMonth(
  year: number,
  stockName: string,
  monthIndex: number,
  amount: number
): AnnualDividendItem[] {
  if (typeof window === "undefined") return [];
  const uid = getCurrentUserId();
  const raw = localStorage.getItem(`${STORAGE_PREFIX_DIVIDENDS}${uid}`);
  let all: AnnualDividendItem[] = raw ? JSON.parse(raw) : [];

  let item = all.find((d) => d.year === year && d.stockName === stockName);
  if (!item) {
    const months = new Array(12).fill(0);
    months[monthIndex] = amount;
    item = {
      id: `div_${Date.now()}`,
      userId: uid,
      year,
      stockName,
      months,
      annualTotal: amount,
    };
    all.push(item);
  } else {
    item.months[monthIndex] = amount;
    item.annualTotal = item.months.reduce((sum, val) => sum + (Number(val) || 0), 0);
  }

  localStorage.setItem(`${STORAGE_PREFIX_DIVIDENDS}${uid}`, JSON.stringify(all));
  return all.filter((d) => d.year === year);
}

/**
 * 배당 종목 추가
 */
export function addDividendStock(year: number, stockName: string): AnnualDividendItem[] {
  if (typeof window === "undefined") return [];
  const uid = getCurrentUserId();
  const raw = localStorage.getItem(`${STORAGE_PREFIX_DIVIDENDS}${uid}`);
  let all: AnnualDividendItem[] = raw ? JSON.parse(raw) : [];

  const existing = all.find((d) => d.year === year && d.stockName === stockName);
  if (!existing) {
    all.push({
      id: `div_${Date.now()}`,
      userId: uid,
      year,
      stockName,
      months: new Array(12).fill(0),
      annualTotal: 0,
    });
    localStorage.setItem(`${STORAGE_PREFIX_DIVIDENDS}${uid}`, JSON.stringify(all));
  }

  return all.filter((d) => d.year === year);
}

/**
 * 배당 종목 삭제
 */
export function deleteDividendStock(year: number, stockName: string): AnnualDividendItem[] {
  if (typeof window === "undefined") return [];
  const uid = getCurrentUserId();
  const raw = localStorage.getItem(`${STORAGE_PREFIX_DIVIDENDS}${uid}`);
  let all: AnnualDividendItem[] = raw ? JSON.parse(raw) : [];

  all = all.filter((d) => !(d.year === year && d.stockName === stockName));
  localStorage.setItem(`${STORAGE_PREFIX_DIVIDENDS}${uid}`, JSON.stringify(all));
  return all.filter((d) => d.year === year);
}
