/**
 * Normaliza um termo de busca digitado pelo usuário antes de comparar.
 *
 * - troca espaços especiais (ins_divisível, fino etc.) por espaço comum
 * - remove espaços no início e no fim
 * - junta espaços duplos no meio em um só
 * - converte para minúsculas
 *
 * Assim "TLL01 ", "tll01 " e "Tll01" encontram o mesmo produto.
 */
export function normalizeSearchTerm(term: string): string {
  return (term ?? '')
    .replace(/\u00a0|\u2007|\u202f|\u3000/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
