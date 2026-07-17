// Busca sem acento e sem caixa: ela digita "joao" e acha "João Cristóvão".
// O NFD separa a letra do acento, e \p{Mn} (nonspacing mark) tira o acento solto.
const COMBINING_MARKS = /\p{Mn}/gu;

export function normalizeForSearch(text: string): string {
  return text.normalize("NFD").replace(COMBINING_MARKS, "").toLowerCase().trim();
}

export function matchesSearch(haystack: string, needle: string): boolean {
  const query = normalizeForSearch(needle);
  if (!query) return true;
  const target = normalizeForSearch(haystack);
  return query.split(/\s+/).every((term) => target.includes(term));
}
