export const queryKeys = {
  debts: {
    all: ['debts'] as const,
    byUser: (userId: string) => ['debts', userId] as const,
  },
  goals: {
    all: ['goals'] as const,
    byUser: (userId: string) => ['goals', userId] as const,
  },
  wealth: {
    all: ['wealth'] as const,
    assetsByUser: (userId: string) => ['wealth', userId, 'assets'] as const,
    passivesByUser: (userId: string) => ['wealth', userId, 'passives'] as const,
    historyByUser: (userId: string) => ['wealth', userId, 'history'] as const,
  },
  user: {
    all: ['user'] as const,
    profile: (userId: string) => ['user', userId, 'profile'] as const,
  },
  categories: {
    all: ['categories'] as const,
    byUser: (userId: string) => ['categories', userId] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    byUser: (userId: string) => ['transactions', userId] as const,
  },
  cards: {
    all: ['cards'] as const,
    byUser: (userId: string) => ['cards', userId] as const,
  },
  bills: {
    all: ['recurring_bills'] as const,
    byUser: (userId: string) => ['recurring_bills', userId] as const,
  },
  presence: {
    all: ['presence'] as const,
    byUser: (userId: string) => ['presence', userId] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
};
