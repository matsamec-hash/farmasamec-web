/**
 * Verze a platnost regulatorních předpisů pro nitrátovou směrnici.
 * Aktualizujte při vydání nového akčního programu (přibližně každé 4 roky).
 */

/**
 * Označení aktuálně platného předpisu.
 * 6. akční program: NV 262/2012 Sb. ve znění NV 193/2024 Sb., účinnost od 1.7.2024.
 */
export const REGULATION_VERSION =
  'NV 262/2012 Sb. ve znění NV 193/2024 Sb. (6. akční program)';

/**
 * Datum skončení platnosti aktuálního akčního programu.
 * 6. AP platí 2024–2028; příští revize očekávána v roce 2028.
 */
export const REGULATION_VALID_UNTIL = '2028-06-30';

/**
 * Zkontroluje, zda platnost aktuálního předpisu vypršela.
 *
 * @param currentDate - ISO datum (YYYY-MM-DD), výchozí = dnešní datum
 * @returns true pokud je datum po datu platnosti (předpis je pravděpodobně zastaralý)
 */
export function isRegulationExpired(currentDate?: string): boolean {
  const checkDate = currentDate ?? new Date().toISOString().slice(0, 10);
  return checkDate > REGULATION_VALID_UNTIL;
}
