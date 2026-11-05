# 🌟 Aura Golden - 주식계좌 및 배당금 종합 자산관리 시스템

엑셀로 관리하던 월말 주식계좌 자산 정산과 연간 배당금 관리를 웹 환경에서 직관적이고 안전하게 관리할 수 있도록 구축된 프리미엄 웹 애플리케이션입니다.

---

## ✨ 핵심 기능

1. **상단 골드 럭셔리 브랜딩**
   - 세련되고 신뢰감을 주는 딥 다크 네이비와 샴페인 골드 테마 디자인
2. **월별 주식계좌 자산 관리 (첨부 시트 1)**
   - 계좌별(연금저축, IRP, 일반, ISA 등) 그룹핑 테이블
   - 수량 × 단가/현재가에 따른 매입금액, 평가금액, 평가손익, 수익률 실시간 자동 계산
   - **매도손익 행** 및 **실 투입 원금(총매입금액 - 총배당수익)** 자동 반영
   - **이전 달 포트폴리오 1초 복사(Carry Over)** 기능으로 월말 입력 공수 최소화
3. **연간 배당금 관리 매트릭스 (첨부 시트 2)**
   - 연도별 종목 × 1~12월 배당금 매트릭스 그리드
   - 셀 클릭 즉시 수정 가능한 초고속 인라인 편집
   - 월별 배당금 추이 인터랙티브 차트 및 종목별/월별 합계 실시간 집계
4. **강력한 보안 및 암호화 (규칙 8)**
   - 로그인 가드로 인가된 사용자만 본인의 포트폴리오 열람 및 편집 가능
   - Supabase RLS(Row Level Security) 정책을 적용하여 사용자 간 완벽한 데이터 격리

---

## 🚀 빠른 시작 (로컬 실행)

```bash
# 1. 패키지 설치
npm install

# 2. 로컬 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하여 즉시 테스트할 수 있습니다.

---

## 🗄️ Supabase 데이터베이스 쿼리 적용 (규칙 7 준수)

모든 SQL 쿼리 파일은 `supabase/queries/` 폴더에 순번 접두사로 관리됩니다.

1. [Supabase](https://supabase.com) 프로젝트 생성
2. 좌측 메뉴 **[SQL Editor]** → **[New query]** 클릭
3. `supabase/queries/001_initial_schema.sql` 파일 내용 복사 후 실행(Run)

---

## 🌐 Vercel 배포 단계

1. 코드를 GitHub 저장소에 푸시합니다.
2. [Vercel](https://vercel.com)에서 해당 저장소를 Import합니다.
3. Environment Variables에 다음을 등록합니다:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
4. **Deploy** 버튼을 누르면 전 세계 어디서든 나만의 주식관리 웹사이트가 가동됩니다!
