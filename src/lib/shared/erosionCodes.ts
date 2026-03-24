// Erosion risk categories from LPIS (DZES 5)
// SEO = Silně erozně ohrožená (Strongly erosion-threatened)
// MEO = Mírně erozně ohrožená (Moderately erosion-threatened)
// NEO = Neerozně ohrožená (Not erosion-threatened)

/** Hex colors for erosion risk categories — used for map polygon fill */
export const EROSION_COLORS: Record<string, string> = {
  SEO: '#dc2626', // red-600
  MEO: '#f59e0b', // amber-500
  NEO: '#16a34a', // green-600
};

/** Czech labels for erosion risk categories */
export const EROSION_LABELS: Record<string, string> = {
  SEO: 'Silně erozně ohrožená',
  MEO: 'Mírně erozně ohrožená',
  NEO: 'Neerozně ohrožená',
};

/** Short labels for badges */
export const EROSION_SHORT_LABELS: Record<string, string> = {
  SEO: 'SEO',
  MEO: 'MEO',
  NEO: 'NEO',
};
