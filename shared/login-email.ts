export const LOGIN_EMAIL_DOMAIN = "greenedu.nk";

export function loginEmail(value: string) {
  const entered = value.trim();
  return entered.includes("@") ? entered : `${entered}@${LOGIN_EMAIL_DOMAIN}`;
}
