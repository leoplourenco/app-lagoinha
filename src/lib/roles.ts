import type { Ministry, MinistryMember } from '../types/database'

type Membership = MinistryMember & { ministry?: Ministry }

export function roleTitle(opts: {
  isAdmin: boolean
  isLeader: boolean
}) {
  if (opts.isAdmin) return 'Admin'
  if (opts.isLeader) return 'Líder'
  return 'Voluntário'
}

/** Memberships onde a pessoa é líder (admin NÃO entra aqui). */
export function leaderMemberships(memberships: Membership[]) {
  return memberships.filter((m) => m.role === 'leader')
}

export function leaderMinistryIds(memberships: Membership[]) {
  return leaderMemberships(memberships).map((m) => m.ministry_id)
}

export function leaderMinistryNames(memberships: Membership[]) {
  return leaderMemberships(memberships)
    .map((m) => m.ministry?.name)
    .filter(Boolean) as string[]
}

/** Pode gerir este ministério? Admin = todos; líder = só os seus. */
export function canManageMinistry(
  memberships: Membership[],
  ministryId: string,
  isAdmin: boolean,
) {
  if (isAdmin) return true
  return leaderMinistryIds(memberships).includes(ministryId)
}
