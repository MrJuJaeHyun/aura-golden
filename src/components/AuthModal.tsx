"use client";

/**
 * Aura Golden 보안 로그인 / 회원가입 컴포넌트 (AuthModal.tsx)
 * 
 * [규칙 8: 강력한 보안 및 암호화 준수]
 * 1. 이메일 고유성(Unique) 엄격 검증: 이미 존재하는 이메일로 중복 가입 시도 시 즉시 차단
 * 2. 비밀번호 단방향 암호화(SHA-256) 검증: 비밀번호 불일치 시 로그인 차단
 * 3. 계정별 완전 격리: 인증된 본인의 계정에만 데이터가 분리 저장/조회됨
 */

import React, { useState } from "react";
import { Lock, Mail, KeyRound, Sparkles, AlertCircle, ShieldCheck, UserCheck } from "lucide-react";
import { registerLocalAccount, loginLocalAccount, AuthUser } from "@/lib/dataStore";
import { createClient } from "@/lib/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: AuthUser) => void;
  isMandatory?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isMandatory = false,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const supabase = createClient();

      if (supabase) {
        // [1] Supabase Auth 클라우드 연동 모드
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            const user: AuthUser = {
              id: data.user.id,
              email: data.user.email || email,
              name: (data.user.email || email).split("@")[0],
            };
            onSuccess(user);
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            const user: AuthUser = {
              id: data.user.id,
              email: data.user.email || email,
              name: (data.user.email || email).split("@")[0],
            };
            onSuccess(user);
          }
        }
      } else {
        // [2] 로컬 보안 데이터베이스 모드 (이메일 고유성 검증 및 비밀번호 암호화)
        if (isSignUp) {
          // 회원가입: 이메일 중복 체크 & 비밀번호 해싱 암호화 저장
          const user = await registerLocalAccount(email, password);
          onSuccess(user);
        } else {
          // 로그인: 이메일 존재 여부 & 비밀번호 해시 일치 확인
          const user = await loginLocalAccount(email, password);
          onSuccess(user);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("인증 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-aura-card border border-aura-border rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        
        {/* 상단 골드 림 라인 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />

        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-3 shadow-inner">
            {isSignUp ? (
              <UserCheck className="w-7 h-7 text-amber-400" />
            ) : (
              <Lock className="w-7 h-7 text-amber-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight gold-text-gradient">
            {isSignUp ? "새 계정 생성 (회원가입)" : "Aura Golden 보안 로그인"}
          </h2>
          <p className="text-xs text-aura-muted mt-1">
            {isSignUp
              ? "고유한 계정을 생성하여 나만의 독립된 자산 공간을 생성합니다"
              : "로그인한 계정의 개인 자산 및 배당금 포트폴리오만 안전하게 로드됩니다"}
          </p>
        </div>

        {/* 에러 메시지 배너 */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              이메일 주소 (계정 고유 식별자)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="user@auragolden.com"
                className="w-full pl-10 pr-4 py-2.5 bg-aura-bg border border-aura-border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              비밀번호 {isSignUp && <span className="text-amber-400 font-normal">(암호화 저장됨)</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-aura-bg border border-aura-border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3 px-4 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 shadow-lg shadow-amber-500/25 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>보안 인증 확인 중...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{isSignUp ? "계정 등록 및 시작하기" : "안전하게 대시보드 입장"}</span>
              </>
            )}
          </button>
        </form>

        {/* 탭 전환 (로그인 <-> 회원가입) */}
        <div className="mt-5 pt-4 border-t border-aura-border flex items-center justify-between text-xs text-aura-muted">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage("");
            }}
            className="text-amber-400 hover:underline font-semibold"
          >
            {isSignUp ? "← 이미 계정이 있으신가요? 로그인하기" : "새 계정이 필요하신가요? 회원가입하기 →"}
          </button>

          {!isMandatory && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              닫기
            </button>
          )}
        </div>

        <div className="mt-4 p-2.5 bg-aura-bg/80 rounded-xl border border-aura-border text-[11px] text-slate-400 flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            모든 계정의 자산 데이터는 분리 격리되어 저장되며, 타 계정에서 절대 조회할 수 없습니다.
          </span>
        </div>
      </div>
    </div>
  );
};
