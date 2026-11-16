/** Funções oficiais por ministério (slug). */
export const MINISTRY_ROLES: Record<string, string[]> = {
  host: ['Acompanhar o visitante', 'Dar apoio'],
  sala: ['Controle de acessos (Porta)', 'Cozinha', 'Repositor'],
  midia: [
    'Copy',
    'Edição',
    'Fotografia',
    'Transmissão',
    'Story',
    'Som',
    'Projeção',
    'Captação',
    'Iluminação',
    'Conteúdo',
    'Social Media',
    'Técnica',
  ],
  // Diaconato, Intercessão, Produção, Estacionamento: funções livres na escala por enquanto
}

export function rolesForMinistrySlug(slug?: string | null): string[] {
  if (!slug) return []
  return MINISTRY_ROLES[slug] ?? []
}
