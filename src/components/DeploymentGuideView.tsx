"use client";

/**
 * Aura Golden Vercel 배포 및 설정 가이드 컴포넌트 (DeploymentGuideView.tsx)
 * 
 * 사용자가 언제 어디서든 웹으로 접속하여 관리할 수 있도록
 * 1. Supabase 데이터베이스 생성 및 SQL 쿼리 적용
 * 2. GitHub 저장소 연동
 * 3. Vercel 원클릭 배포 및 환경 변수 등록
 * 과정을 초보자도 쉽게 따라 할 수 있도록 정리한 인터랙티브 가이드입니다.
 */

import React, { useState } from "react";
import {
  Rocket,
  Database,
  Cloud,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldAlert,
  Terminal,
  Lock,
} from "lucide-react";

export const DeploymentGuideView: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const gitCommands = `# 1. Git 저장소 초기화 및 커밋
git init
git add .
git commit -m "feat: Aura Golden - 주식계좌 및 배당금 관리 시스템 완성"

# 2. GitHub 원격 저장소 연결 및 푸시
git branch -M main
git remote add origin https://github.com/사용자아이디/aura-golden.git
git push -u origin main`;

  const schemaQueryPath = "supabase/queries/001_initial_schema.sql";

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* 1. 배포 가이드 인트로 배너 */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-600/10 to-aura-card border-2 border-amber-500/40 shadow-xl">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Rocket className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white gold-text-gradient">
              Aura Golden Vercel 배포 및 클라우드 동기화 가이드
            </h2>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              본 가이드를 따라 하시면 몇 분 안에 나만의 개인 금융 대시보드가 **Vercel**에 배포되어,
              PC와 스마트폰 브라우저 어디서나 안전하게 로그인하여 자산을 관리하실 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 2. 단계별 가이드 카드 (Step 1 ~ Step 4) */}
      <div className="space-y-6">
        
        {/* Step 1: Supabase 데이터베이스 생성 (선택 및 권장) */}
        <div className="p-6 rounded-2xl bg-aura-card border border-aura-border shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-sm">
              1
            </span>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">
                Supabase 데이터베이스 생성 및 SQL 스키마 실행
              </h3>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-300 leading-relaxed pl-11">
            <p>
              1. <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-amber-400 font-bold hover:underline inline-flex items-center space-x-1">
                <span>Supabase 공식 웹사이트</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>에 무료로 가입하고 <strong>[New Project]</strong>를 생성합니다.
            </p>
            <p>
              2. 좌측 메뉴에서 <strong>[SQL Editor]</strong>로 이동하여 <strong>[New query]</strong>를 클릭합니다.
            </p>
            <p>
              3. 프로젝트 내 <code className="px-2 py-0.5 rounded bg-aura-bg border border-aura-border text-amber-300 font-mono text-xs">{schemaQueryPath}</code> 파일의 내용을 전체 복사하여 붙여넣고 <strong>[Run]</strong> 버튼을 실행합니다.
            </p>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center space-x-2">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span>
                이 스크립트는 계좌, 월별 포트폴리오, 배당금 테이블과 함께 <strong>RLS(행 단위 보안 정책)</strong>을 자동으로 적용하여 오직 본인의 금융 데이터만 암호화 열람되도록 보장합니다.
              </span>
            </div>
            <p>
              4. 좌측 <strong>[Project Settings]</strong> → <strong>[API]</strong>에서 다음 두 값을 메모합니다:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 font-mono pl-2">
              <li><strong className="text-amber-300">Project URL</strong> (예: https://xxxx.supabase.co)</li>
              <li><strong className="text-amber-300">anon public key</strong> (예: eyJhbGciOi...)</li>
            </ul>
          </div>
        </div>

        {/* Step 2: GitHub에 코드 올리기 */}
        <div className="p-6 rounded-2xl bg-aura-card border border-aura-border shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-sm">
              2
            </span>
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">
                GitHub 원격 저장소에 코드 업로드 (Push)
              </h3>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-300 leading-relaxed pl-11">
            <p>
              1. <a href="https://github.com" target="_blank" rel="noreferrer" className="text-amber-400 font-bold hover:underline inline-flex items-center space-x-1">
                <span>GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>에서 <strong>[New repository]</strong>를 생성합니다 (예: <code className="text-amber-300">aura-golden</code>, 비공개 권장).
            </p>
            <p>2. 프로젝트 터미널에서 다음 명령어를 순서대로 실행합니다:</p>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-aura-bg border border-aura-border text-xs font-mono text-emerald-400 overflow-x-auto">
                {gitCommands}
              </pre>
              <button
                onClick={() => handleCopy(gitCommands, "git")}
                className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-aura-card border border-aura-border text-xs text-slate-300 hover:text-white flex items-center space-x-1"
              >
                {copiedKey === "git" ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>복사됨!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>명령어 복사</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Step 3: Vercel 배포 */}
        <div className="p-6 rounded-2xl bg-aura-card border border-aura-border shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-sm">
              3
            </span>
            <div className="flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">
                Vercel 프로젝트 연동 및 원클릭 배포
              </h3>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-300 leading-relaxed pl-11">
            <p>
              1. <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-amber-400 font-bold hover:underline inline-flex items-center space-x-1">
                <span>Vercel 공식 웹사이트</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>에 GitHub 계정으로 로그인합니다.
            </p>
            <p>
              2. <strong>[Add New...]</strong> → <strong>[Project]</strong>를 클릭하고 방금 올린 <code className="text-amber-300">aura-golden</code> 저장소를 선택(Import)합니다.
            </p>
            <p>
              3. <strong>Environment Variables (환경 변수)</strong> 항목에 1단계에서 메모한 값을 등록합니다:
            </p>
            <div className="space-y-2 p-3 bg-aura-bg border border-aura-border rounded-xl text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">NEXT_PUBLIC_SUPABASE_URL</span>
                <span className="text-aura-muted">https://your-project.supabase.co</span>
              </div>
              <div className="flex items-center justify-between border-t border-aura-border pt-2">
                <span className="text-slate-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                <span className="text-aura-muted">eyJhbGciOi...</span>
              </div>
            </div>
            <p>
              4. <strong>[Deploy]</strong> 버튼을 누르면 약 1~2분 만에 무료 글로벌 HTTPS 주소(예: <code className="text-amber-300">https://aura-golden.vercel.app</code>)로 전 세계 어디서든 즉시 접속 가능한 나만의 주식관리 웹앱이 완성됩니다!
            </p>
          </div>
        </div>

        {/* Step 4: 배포 후 사용 및 로그인 */}
        <div className="p-6 rounded-2xl bg-aura-card border border-aura-border shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-sm">
              4
            </span>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">
                모바일 & PC 어디서든 접속 및 로그인 관리
              </h3>
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-300 leading-relaxed pl-11">
            <p>
              • 배포된 웹사이트에 접속하면 상단의 <strong>[보안 인증]</strong>을 통해 계정을 생성하거나 로그인합니다.
            </p>
            <p>
              • 스마트폰(아이폰/갤럭시)의 Safari 또는 Chrome 브라우저에서 <strong>[홈 화면에 추가]</strong>를 누르면 일반 네이티브 금융 앱처럼 설치되어 전체 화면으로 더욱 편리하게 이용할 수 있습니다.
            </p>
            <p>
              • 모든 수정 및 입력은 실시간으로 저장되며, 언제 어디서든 월말 정산과 배당금을 누락 없이 관리하실 수 있습니다.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
