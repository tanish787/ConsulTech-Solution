import { LoyaltyLevel } from '../types';

/**
 * Calculates loyalty level based on months of membership
 * Bronze: 0-5 months
 * Silver: 6-11 months
 * Gold: 12-23 months
 * Platinum: 24+ months
 */
export const calculateLoyaltyLevel = (monthsOfMembership: number): LoyaltyLevel => {
  if (monthsOfMembership >= 24) {
    return 'Platinum';
  } else if (monthsOfMembership >= 12) {
    return 'Gold';
  } else if (monthsOfMembership >= 6) {
    return 'Silver';
  } else {
    return 'Bronze';
  }
};

/**
 * Calculates months between two dates
 */
export const calculateMonthsDifference = (startDate: Date | string, endDate: Date | string = new Date()): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months += end.getMonth() - start.getMonth();

  return Math.max(0, months);
};

/**
 * Calculates the next loyalty level and months until reaching it
 */
export const getNextLoyaltyLevel = (
  currentMonths: number
): {
  nextLevel: LoyaltyLevel | null;
  monthsUntilNext: number | null;
} => {
  const thresholds = [0, 6, 12, 24];
  const levels: LoyaltyLevel[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];

  for (let i = 0; i < thresholds.length; i++) {
    if (currentMonths < thresholds[i]) {
      const monthsUntil = thresholds[i] - currentMonths;
      return {
        nextLevel: levels[i],
        monthsUntilNext: monthsUntil,
      };
    }
  }

  return {
    nextLevel: null,
    monthsUntilNext: null,
  };
};
