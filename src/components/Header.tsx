"use client";

/**
 * Aura Golden 상단 헤더 컴포넌트 (Header.tsx)
 * 
 * [피드백 4 대응: 대시보드(수익률 꺾은선 차트) 탭 추가]
 * 럭셔리 골드 브랜딩, 탭 네비게이션(대시보드 / 월별 자산관리 / 배당금 관리 / 배포 가이드),
 * 그리고 로그인/로그아웃 프로필 바를 제공합니다.
 */

import React from "react";
import {
  Sparkles,
  BarChart3,
  Coins,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  BookOpen,
  LineChart,
} from "lucide-react";
import { AuthUser } from "@/lib/dataStore";

export type NavTabType = "dashboard" | "monthly" | "dividends" | "guide";

interface HeaderProps {
  activeTab: NavTabType;
  onTabChange: (tab: NavTabType) => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onLogout,
  onOpenLogin,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-aura-border bg-aura-bg/95 backdrop-blur supports-[backdrop-filter]:bg-aura-bg/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* 1. 좌측 메인 브랜딩 로고 (Aura Golden) */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onTabChange("dashboard")}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-700 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-aura-card rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-extrabold tracking-wider gold-text-gradient">
                  AURA GOLDEN
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full">
                  PRO
                </span>
              </div>
              <p className="text-xs text-aura-muted font-medium tracking-tight">
                주식계좌 및 배당금 종합 자산관리 시스템
              </p>
            </div>
          </div>

          {/* 2. 중앙 탭 네비게이션 (대시보드 / 월별 자산 / 연간 배당금 / 배포 가이드) */}
          <nav className="hidden lg:flex items-center space-x-1.5 bg-aura-card/70 p-1.5 rounded-xl border border-aura-border">
            {/* [피드백 4] 대시보드 탭 */}
            <button
              onClick={() => onTabChange("dashboard")}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === "dashboard"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-md shadow-amber-500/25 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-aura-border/50"
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>수익률 대시보드</span>
            </button>

            <button
              onClick={() => onTabChange("monthly")}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === "monthly"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-md shadow-amber-500/25 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-aura-border/50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>월별 주식계좌 관리</span>
            </button>

            <button
              onClick={() => onTabChange("dividends")}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === "dividends"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-md shadow-amber-500/25 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-aura-border/50"
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>연간 배당금 관리</span>
            </button>

            <button
              onClick={() => onTabChange("guide")}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === "guide"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-md shadow-amber-500/25 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-aura-border/50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>배포 & 가이드</span>
            </button>
          </nav>

          {/* 3. 우측 유저 프로필 & 로그인/로그아웃 */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-2.5">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-aura-card border border-aura-border">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-200">{currentUser.name}</p>
                    <p className="text-[10px] text-aura-muted">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="로그아웃"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>로그인 / 인증</span>
              </button>
            )}
          </div>
        </div>

        {/* 모바일/태블릿용 보조 탭 네비게이션 */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-aura-border/60 overflow-x-auto gap-1">
          <button
            onClick={() => onTabChange("dashboard")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
              activeTab === "dashboard" ? "bg-amber-500 text-black font-bold" : "text-slate-400"
            }`}
          >
            수익률 대시보드
          </button>
          <button
            onClick={() => onTabChange("monthly")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
              activeTab === "monthly" ? "bg-amber-500 text-black font-bold" : "text-slate-400"
            }`}
          >
            월별 계좌관리
          </button>
          <button
            onClick={() => onTabChange("dividends")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
              activeTab === "dividends" ? "bg-amber-500 text-black font-bold" : "text-slate-400"
            }`}
          >
            연간 배당금
          </button>
          <button
            onClick={() => onTabChange("guide")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
              activeTab === "guide" ? "bg-amber-500 text-black font-bold" : "text-slate-400"
            }`}
          >
            가이드
          </button>
        </div>
      </div>
    </header>
  );
};
