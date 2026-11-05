/**
 * Aura Golden 보안 및 암호화 모듈 (crypto.ts)
 * 
 * [규칙 8: 강력한 보안 및 암호화 준수]
 * 브라우저 표준 Web Crypto API(SHA-256)를 활용하여
 * 사용자의 비밀번호를 절대 평문으로 저장하지 않고 안전하게 솔트 해시 처리합니다.
 */

const SECURITY_SALT = "AuraGolden_UltraSecure_Salt_2026_!@#$";

/**
 * 비밀번호를 안전하게 단방향 암호화(SHA-256) 해싱합니다.
 * @param password 원본 평문 비밀번호
 * @returns 64자리 16진수 해시 문자열
 */
export async function hashPassword(password: string): Promise<string> {
  // 비밀번호와 보안 솔트를 결합
  const salted = `${SECURITY_SALT}:${password}:${SECURITY_SALT}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(salted);

  // SHA-256 해시 계산
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hashHex;
}
