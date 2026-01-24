/**
 * Normalisiert deutsche Strings für die Verwendung als Keys oder Dateinamen.
 * Ersetzt Umlaute und ß durch ihre Ascii-Entsprechungen.
 *
 * @param str Der zu normalisierende String
 * @returns Der normalisierte String (kleingeschrieben, ohne Sonderzeichen)
 */
export const normalizeGermanString = (str: string): string => {
  if (!str) return '';

  return str.toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    // Behalte nur Buchstaben und Zahlen
    .replace(/[^a-z0-9]/g, '');
};
