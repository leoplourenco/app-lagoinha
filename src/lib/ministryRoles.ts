/** Funções oficiais por ministério (slug). */
export const MINISTRY_ROLES: Record<string, string[]> = {
  host: ['Acompanhar o visitante', 'Dar apoio'],
  sala: ['Controle de acessos (Porta)', 'Cozinha', 'Repositor'],
}

export function rolesForMinistrySlug(slug?: string | null): string[] {
  if (!slug) return []
  return MINISTRY_ROLES[slug] ?? []
}
