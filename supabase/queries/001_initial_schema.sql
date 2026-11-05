-- ====================================================================
-- Aura Golden: 주식계좌 자산관리 및 배당금 관리 초기 데이터베이스 스키마
-- 파일명: 001_initial_schema.sql
-- 설명: 계좌, 월별 포트폴리오, 월별 종목 상세, 연간 배당금 매트릭스 및 RLS 보안 정책 정의
-- ====================================================================

-- 1. 확장 기능 활성화 (UUID 생성용)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 계좌 테이블 (연금저축, IRP, 일반, ISA 등)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 예: '연금저축(한화투자)', '일반(토스)'
    account_type TEXT,  -- 예: 'PENSION', 'IRP', 'GENERAL', 'ISA'
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 월별 자산관리 마스터 테이블 (연월별 스냅샷)
CREATE TABLE IF NOT EXISTS public.monthly_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year_month VARCHAR(7) NOT NULL, -- 예: '2026.09', '2026.10'
    realized_gain NUMERIC DEFAULT 0, -- 해당 월 매도손익 (예: 20000, -336743)
    real_invested_capital NUMERIC DEFAULT 0, -- 실 투입원금 (총매입금액 - 배당/수익 합계)
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_year_month UNIQUE(user_id, year_month)
);

-- 5. 월별 종목 상세 보유 내역 테이블
CREATE TABLE IF NOT EXISTS public.monthly_stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monthly_record_id UUID NOT NULL REFERENCES public.monthly_records(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    account_name TEXT NOT NULL, -- 빠른 조회를 위한 계좌명 백업
    stock_name TEXT NOT NULL,   -- 종목명 (예: 'ACE 미국S&P500')
    quantity NUMERIC NOT NULL DEFAULT 0,      -- 수량
    avg_buy_price NUMERIC NOT NULL DEFAULT 0, -- 매입단가 (평균단가)
    current_price NUMERIC NOT NULL DEFAULT 0, -- 현재가 (현재단가)
    buy_amount NUMERIC NOT NULL DEFAULT 0,    -- 매입금액 (수량 * 매입단가)
    evaluated_amount NUMERIC NOT NULL DEFAULT 0, -- 평가금액 (수량 * 현재가)
    dividend_or_profit NUMERIC NOT NULL DEFAULT 0, -- 배당금/수익
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 연도별 종목 배당금 매트릭스 테이블 (첨부 2번 이미지 대응)
CREATE TABLE IF NOT EXISTS public.annual_dividends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,      -- 예: 2026
    stock_name TEXT NOT NULL,   -- 종목명
    m1 NUMERIC DEFAULT 0,
    m2 NUMERIC DEFAULT 0,
    m3 NUMERIC DEFAULT 0,
    m4 NUMERIC DEFAULT 0,
    m5 NUMERIC DEFAULT 0,
    m6 NUMERIC DEFAULT 0,
    m7 NUMERIC DEFAULT 0,
    m8 NUMERIC DEFAULT 0,
    m9 NUMERIC DEFAULT 0,
    m10 NUMERIC DEFAULT 0,
    m11 NUMERIC DEFAULT 0,
    m12 NUMERIC DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_year_stock UNIQUE(user_id, year, stock_name)
);

-- ====================================================================
-- RLS (Row Level Security) 보안 설정 (규칙 8: 강력한 보안 및 격리)
-- ====================================================================

-- 모든 테이블 RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_dividends ENABLE ROW LEVEL SECURITY;

-- 1) profiles 정책
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- 2) accounts 정책
CREATE POLICY "Users can view own accounts" 
    ON public.accounts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" 
    ON public.accounts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" 
    ON public.accounts FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" 
    ON public.accounts FOR DELETE 
    USING (auth.uid() = user_id);

-- 3) monthly_records 정책
CREATE POLICY "Users can view own monthly records" 
    ON public.monthly_records FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly records" 
    ON public.monthly_records FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly records" 
    ON public.monthly_records FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly records" 
    ON public.monthly_records FOR DELETE 
    USING (auth.uid() = user_id);

-- 4) monthly_stock_items 정책 (monthly_records의 user_id 참조 검증)
CREATE POLICY "Users can view own stock items" 
    ON public.monthly_stock_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.monthly_records mr 
            WHERE mr.id = monthly_stock_items.monthly_record_id 
            AND mr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own stock items" 
    ON public.monthly_stock_items FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.monthly_records mr 
            WHERE mr.id = monthly_stock_items.monthly_record_id 
            AND mr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own stock items" 
    ON public.monthly_stock_items FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.monthly_records mr 
            WHERE mr.id = monthly_stock_items.monthly_record_id 
            AND mr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own stock items" 
    ON public.monthly_stock_items FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.monthly_records mr 
            WHERE mr.id = monthly_stock_items.monthly_record_id 
            AND mr.user_id = auth.uid()
        )
    );

-- 5) annual_dividends 정책
CREATE POLICY "Users can view own dividends" 
    ON public.annual_dividends FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dividends" 
    ON public.annual_dividends FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dividends" 
    ON public.annual_dividends FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dividends" 
    ON public.annual_dividends FOR DELETE 
    USING (auth.uid() = user_id);

-- 회원가입 시 public.profiles 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (new.id, new.email, split_part(new.email, '@', 1));
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
