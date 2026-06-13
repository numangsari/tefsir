export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Form etiketleri ve yardım metinleri için kısa özet */
export const PASSWORD_REQUIREMENTS_HINT =
  "En az 8 karakter; en az bir harf ve bir rakam içermeli.";

const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "11111111",
  "00000000",
  "password",
  "password1",
  "password123",
  "qwerty123",
  "qwertyui",
  "abcdefgh",
  "sifre123",
  "sifre1234",
  "tefsir123",
  "kuran123",
  "admin123",
  "welcome1",
]);

export type PasswordValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validatePassword(password: string): PasswordValidationResult {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      error: `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`,
    };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      ok: false,
      error: `Şifre en fazla ${PASSWORD_MAX_LENGTH} karakter olabilir.`,
    };
  }

  if (!/\p{L}/u.test(password)) {
    return { ok: false, error: "Şifre en az bir harf içermeli." };
  }

  if (!/\d/.test(password)) {
    return { ok: false, error: "Şifre en az bir rakam içermeli." };
  }

  if (/^(.)\1+$/.test(password)) {
    return { ok: false, error: "Şifre aynı karakterin tekrarı olamaz." };
  }

  const normalized = password.trim().toLowerCase();
  if (COMMON_PASSWORDS.has(normalized)) {
    return {
      ok: false,
      error: "Bu şifre çok yaygın; lütfen daha güçlü bir şifre seçin.",
    };
  }

  return { ok: true };
}

/** Kayıtta e-posta ile çok benzer şifreleri reddeder (ör. ad@site.com → ad123456). */
export function validatePasswordAgainstEmail(
  password: string,
  email: string
): PasswordValidationResult {
  const base = validatePassword(password);
  if (!base.ok) return base;

  const local = email.split("@")[0]?.trim().toLowerCase();
  if (local && local.length >= 4) {
    const pw = password.trim().toLowerCase();
    if (pw === local || pw.includes(local) || local.includes(pw)) {
      return {
        ok: false,
        error: "Şifre e-posta adresinizle çok benzer olamaz.",
      };
    }
  }

  return { ok: true };
}
