import { type MealPrice } from '@/services/mensaApi';
import { type ProfileStatus } from '@/contexts/ProfileContext';

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss');

const PRICE_TYPE_TOKENS: Record<ProfileStatus, string[]> = {
  student: ['studierende', 'student', 'students'],
  employee: ['angestellte', 'bedienstete', 'mitarbeiter', 'employee', 'staff'],
  guest: ['gaste', 'guest', 'guests'],
};

const matchesPriceType = (priceType: string, tokens: string[]): boolean => {
  const normalized = normalize(priceType);
  return tokens.some((token) => normalized.includes(token));
};

export const selectPriceForStatus = (
  prices: MealPrice[] | undefined,
  status: ProfileStatus | null | undefined
): { price: number | null; priceType?: string } => {
  if (!prices || prices.length === 0) {
    return { price: null };
  }

  if (status) {
    const tokens = PRICE_TYPE_TOKENS[status];
    const match = prices.find((price) => matchesPriceType(price.priceType, tokens));
    if (match) {
      return { price: match.price, priceType: match.priceType };
    }
  }

  const fallback = prices[0];
  return { price: fallback.price, priceType: fallback.priceType };
};

export const getPriceTypeKeyForStatus = (
  status: ProfileStatus | null | undefined
): 'priceTypes.students' | 'priceTypes.employees' | 'priceTypes.guests' => {
  switch (status) {
    case 'employee':
      return 'priceTypes.employees';
    case 'guest':
      return 'priceTypes.guests';
    case 'student':
    default:
      return 'priceTypes.students';
  }
};
