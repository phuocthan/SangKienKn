export type SessionPolicy = {
  warningTabs: number;
  closeTabs: number;
  warningIdleSeconds: number;
  closeIdleSeconds: number;
};
export const DEFAULT_SESSION_POLICY: SessionPolicy = {
  warningTabs: 2,
  closeTabs: 4,
  warningIdleSeconds: 105,
  closeIdleSeconds: 120,
};
export function validSessionPolicy(p: SessionPolicy): boolean {
  return (
    !!p &&
    [
      p.warningTabs,
      p.closeTabs,
      p.warningIdleSeconds,
      p.closeIdleSeconds,
    ].every(Number.isInteger) &&
    p.warningTabs >= 1 &&
    p.closeTabs > p.warningTabs &&
    p.closeTabs <= 20 &&
    p.warningIdleSeconds >= 5 &&
    p.closeIdleSeconds > p.warningIdleSeconds &&
    p.closeIdleSeconds <= 3600
  );
}
