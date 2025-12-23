export const queryKeys = {
  mensas: {
    all: ['mensas'] as const,
    list: (filters?: any) => [...queryKeys.mensas.all, 'list', filters] as const,
  },
  meals: {
    all: ['meals'] as const,
    list: (filters?: any) => [...queryKeys.meals.all, 'list', filters] as const,
    byCanteen: (canteenId: string, date?: string) =>
      [...queryKeys.meals.all, 'byCanteen', canteenId, date] as const,
  },
  additives: {
    all: ['additives'] as const,
  },
  badges: {
    all: ['badges'] as const,
  },
};
