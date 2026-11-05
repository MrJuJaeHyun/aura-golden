"use client";

/**
 * Aura Golden 메인 대시보드 페이지 (page.tsx)
 * 
 * [완전한 보안 & 초기 데이터 제로(Zero Data) 정책]
 * 1. 신규 사용자는 데이터가 일절 없는 깨끗한 상태에서 시작합니다.
 * 2. 월별 정산 내역이 없을 때도 에러 없이 직관적인 [첫 달 생성하기] 카드를 제공합니다.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Header, NavTabType } from "@/components/Header";
import { MonthlyPortfolioView } from "@/components/MonthlyPortfolioView";
import { AnnualDividendView } from "@/components/AnnualDividendView";
import { DashboardView } from "@/components/DashboardView";
import { DeploymentGuideView } from "@/components/DeploymentGuideView";
import { AuthModal } from "@/components/AuthModal";
import {
  getLocalUser,
  setLocalUser,
  getMonthlyRecords,
  getMonthlyRecordByYearMonth,
  createEmptyMonthlyRecord,
  AuthUser,
} from "@/lib/dataStore";
import { MonthlyRecord } from "@/types";
import { Lock, Sparkles, PlusCircle, Calendar } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTabType>("monthly");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMandatoryLogin, setIsMandatoryLogin] = useState(false);

  // 월별 포트폴리오 상태
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [currentYearMonth, setCurrentYearMonth] = useState<string>("");
  const [currentRecord, setCurrentRecord] = useState<MonthlyRecord | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 첫 달 생성 모달/입력 상태
  const [firstMonthInput, setFirstMonthInput] = useState(
    `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")}`
  );

  // 데이터 새로고침 콜백
  const refreshData = useCallback(() => {
    const allRecords = getMonthlyRecords();
    setRecords(allRecords);

    if (allRecords.length > 0) {
      const targetYM =
        currentYearMonth && allRecords.some((r) => r.yearMonth === currentYearMonth)
          ? currentYearMonth
          : allRecords[0].yearMonth;
      const rec = getMonthlyRecordByYearMonth(targetYM) || allRecords[0];
      setCurrentYearMonth(rec.yearMonth);
      setCurrentRecord(rec);
    } else {
      setCurrentYearMonth("");
      setCurrentRecord(null);
    }
  }, [currentYearMonth]);

  // 초기 로딩 시 세션 및 데이터 로드
  useEffect(() => {
    const user = getLocalUser();
    if (user) {
      setCurrentUser(user);
    } else {
      setIsAuthModalOpen(true);
      setIsMandatoryLogin(true);
    }

    refreshData();
    setIsLoaded(true);
  }, [refreshData]);

  // 연월 변경
  const handleSelectYearMonth = (ym: string) => {
    setCurrentYearMonth(ym);
    const rec = getMonthlyRecordByYearMonth(ym);
    if (rec) setCurrentRecord(rec);
  };

  // 로그인 성공 콜백
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    setIsMandatoryLogin(false);
    refreshData();
  };

  // 로그아웃
  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      setLocalUser(null);
      setCurrentUser(null);
      setIsMandatoryLogin(true);
      setIsAuthModalOpen(true);
    }
  };

  // 첫 번째 월 생성 핸들러
  const handleCreateFirstMonth = (e: React.FormEvent) => {
    e.preventDefault();
    const ym = firstMonthInput.trim();
    if (!/^\d{4}\.\d{2}$/.test(ym)) {
      alert("연월 형식은 'YYYY.MM' (예: 2026.11) 형태로 입력해주세요.");
      return;
    }
    const created = createEmptyMonthlyRecord(ym);
    setCurrentYearMonth(created.yearMonth);
    setCurrentRecord(created);
    refreshData();
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-aura-bg flex items-center justify-center text-amber-400">
        <div className="flex flex-col items-center space-y-3">
          <Sparkles className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-semibold tracking-wider gold-text-gradient">
            Aura Golden 로딩 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aura-bg text-slate-100 flex flex-col">
      
      {/* 1. 상단 글로벌 헤더 (Aura Golden 브랜딩) */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => {
          setIsMandatoryLogin(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* 2. 메인 바디 컨텐츠 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 미로그인 상태 안내 배너 */}
        {!currentUser && !isAuthModalOpen && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm font-bold text-amber-300">보안 잠금 모드</p>
                <p className="text-xs text-aura-muted">
                  현재 게스트 모드로 보호 중입니다. 나만의 안전한 자산 관리를 위해 로그인해 주세요.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsMandatoryLogin(false);
                setIsAuthModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 transition"
            >
              로그인하기
            </button>
          </div>
        )}

        {/* 탭 0: 대시보드 (월별 수익률 꺾은선 차트) */}
        {activeTab === "dashboard" && <DashboardView />}

        {/* 탭 1: 월별 주식계좌 자산 관리 시트 */}
        {activeTab === "monthly" && (
          currentRecord ? (
            <MonthlyPortfolioView
              records={records}
              currentRecord={currentRecord}
              onSelectYearMonth={handleSelectYearMonth}
              onRefresh={refreshData}
            />
          ) : (
            /* 월별 정산 기록이 아직 하나도 없는 완전한 빈 상태 카드 */
            <div className="p-8 sm:p-12 rounded-3xl bg-aura-card border border-aura-border text-center max-w-xl mx-auto shadow-2xl space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100 gold-text-gradient">
                  아직 등록된 월별 정산 내역이 없습니다
                </h3>
                <p className="text-xs text-aura-muted mt-2 leading-relaxed">
                  Aura Golden은 사용자의 완전한 개인정보 보호를 위해 샘플 데이터를 남기지 않습니다.<br />
                  시작할 첫 기준 연월(예: 2026.11)을 입력하고 첫 포트폴리오를 작성해 보세요!
                </p>
              </div>

              <form onSubmit={handleCreateFirstMonth} className="max-w-xs mx-auto space-y-3 pt-2">
                <input
                  type="text"
                  required
                  value={firstMonthInput}
                  onChange={(e) => setFirstMonthInput(e.target.value)}
                  placeholder="예: 2026.11"
                  className="w-full px-4 py-2.5 bg-aura-bg border border-aura-border rounded-xl text-center font-bold text-sm text-amber-300 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 shadow-md transition flex items-center justify-center space-x-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>첫 번째 월 생성하고 시작하기</span>
                </button>
              </form>
            </div>
          )
        )}

        {/* 탭 2: 연간 종목별 배당금 매트릭스 시트 */}
        {activeTab === "dividends" && <AnnualDividendView />}

        {/* 탭 3: Vercel 배포 및 설정 가이드 */}
        {activeTab === "guide" && <DeploymentGuideView />}

      </main>

      {/* 3. 푸터 */}
      <footer className="border-t border-aura-border/80 py-6 text-center text-xs text-aura-muted bg-aura-bg/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center space-x-1">
            <span className="gold-text-gradient font-bold">Aura Golden</span>
            <span>— 주식계좌 & 배당금 종합 자산관리 시스템</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Next.js 14 • Supabase • Vercel Ready
          </p>
        </div>
      </footer>

      {/* 4. 보안 인증 모달 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        isMandatory={isMandatoryLogin}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

    </div>
  );
}
