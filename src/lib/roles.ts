import type { Ministry, MinistryMember } from '../types/database'

export function roleTitle(opts: {
  isAdmin: boolean
  isLeader: boolean
}) {
  if (opts.isAdmin) return 'Admin'
  if (opts.isLeader) return 'Líder'
  return 'Voluntário'
}

export function leaderMinistryNames(
  memberships: (MinistryMember & { ministry?: Ministry })[],
) {
  return memberships
    .filter((m) => m.role === 'leader')
    .map((m) => m.ministry?.name)
    .filter(Boolean) as string[]
}
