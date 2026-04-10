/** Set at signup; cleared when email is verified, replaced with show-once key. */
export const bankPromptEligibleKey = (userId: string) => `dductly_bank_prompt_eligible_${userId}`;

/** After verified email; dashboard shows modal once then clears this. */
export const bankPromptShowOnceKey = (userId: string) => `dductly_show_bank_connect_once_${userId}`;

/** User dismissed modal or finished connect — never auto-prompt again. */
export const bankPromptDismissedKey = (userId: string) => `dductly_bank_connect_dismissed_${userId}`;

export function markBankPromptEligibleAfterSignup(userId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(bankPromptEligibleKey(userId), "1");
  } catch {
    /* quota / private mode */
  }
}

/** Call when email verification succeeds (any tab). */
export function activateBankPromptForFirstDashboardVisit(userId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    const eligible = localStorage.getItem(bankPromptEligibleKey(userId));
    if (eligible !== "1") return;
    localStorage.removeItem(bankPromptEligibleKey(userId));
    localStorage.setItem(bankPromptShowOnceKey(userId), "1");
  } catch {
    /* ignore */
  }
}

export function shouldShowBankConnectModal(userId: string): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    if (localStorage.getItem(bankPromptDismissedKey(userId)) === "1") return false;
    return localStorage.getItem(bankPromptShowOnceKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function clearBankPromptShowOnce(userId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(bankPromptShowOnceKey(userId));
  } catch {
    /* ignore */
  }
}

export function markBankPromptDismissed(userId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(bankPromptDismissedKey(userId), "1");
  } catch {
    /* ignore */
  }
}
