// Busca sem acento e sem caixa: ela digita "joao" e acha "João Cristóvão".
// O NFD separa a letra do acento, e \p{Mn} (nonspacing mark) tira o acento solto.
const COMBINING_MARKS = /\p{Mn}/gu;

export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Casa pelo COMEÇO do nome, pelo primeiro nome mesmo: digitar "a" traz só quem começa
// com A, e "jo" traz João e Josefar, não "Ernestina dos Anjos". Filtra desde a primeira
// letra e vai apertando conforme ela digita. Como compara o nome inteiro a partir do
// início, digitar "joao cri" também acha.
export function matchesSearch(haystack: string, needle: string): boolean {
  const query = normalizeForSearch(needle);
  if (!query) return true;
  return normalizeForSearch(haystack).startsWith(query);
}
