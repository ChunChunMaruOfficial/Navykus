/**
 * «Ключевые направления» of a championship = the lines of its «Темы кейса» field (themesText).
 * The application form sends the index of the chosen line; the API resolves it against the
 * championship's own (source-language) text, so both sides must split the text the same way.
 */
export const championshipDirections = (themesText?: string | null) =>
  (themesText || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
