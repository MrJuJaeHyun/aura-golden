/**
 * Aura Golden 초기 템플릿 정의 (initialData.ts)
 * 
 * 사용자 요청에 따라 모든 샘플/데모 데이터를 완전히 삭제하고,
 * 신규 가입한 어떠한 계정도 완전한 빈 상태(Zero Data)에서 안전하게 시작하도록 설정합니다.
 */

import { MonthlyRecord, AnnualDividendItem } from "@/types";

// 기본 빈 월별 레코드 목록 (초기 데이터 완전 비움)
export const emptyMonthlyRecords: MonthlyRecord[] = [];

// 기본 빈 연간 배당금 목록 (초기 데이터 완전 비움)
export const emptyAnnualDividends: AnnualDividendItem[] = [];
