/**
 * Supabase 브라우저 클라이언트 모듈 (client.ts)
 * 
 * Vercel 배포 시 환경 변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)를 통해
 * 안전하게 연결되며, 미설정 시 안전하게 null을 반환하여 로컬 저장소 모드로 전환됩니다.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
