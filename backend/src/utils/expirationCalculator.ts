export interface ExpirationDefaults {
  [category: string]: number;
}

const EXPIRATION_DAYS: ExpirationDefaults = {
  vegetables: 7,
  fruits: 7,
  leafy_greens: 5,
  herbs: 5,
  dairy: 14,
  milk: 7,
  cheese: 30,
  yogurt: 14,
  proteins: 3,
  meat: 3,
  poultry: 3,
  fish: 2,
  seafood: 2,
  eggs: 21,
  grains: 180,
  bread: 7,
  pasta: 365,
  rice: 365,
  flour: 180,
  spices: 730,
  condiments: 365,
  sauces: 180,
  oils: 365,
  canned: 730,
  frozen: 90,
  nuts: 180,
  seeds: 180,
  legumes: 365,
  other: 30,
};

export class ExpirationCalculator {
  static calculateExpirationDate(category: string, customDays?: number): Date {
    const days =
      customDays ||
      EXPIRATION_DAYS[category.toLowerCase()] ||
      EXPIRATION_DAYS.other;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    return expirationDate;
  }

  static getDefaultDays(category: string): number {
    return EXPIRATION_DAYS[category.toLowerCase()] || EXPIRATION_DAYS.other;
  }

  static isExpiringSoon(
    expirationDate: Date,
    daysThreshold: number = 3,
  ): boolean {
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= daysThreshold && diffDays >= 0;
  }

  static isExpired(expirationDate: Date): boolean {
    return new Date() > expirationDate;
  }
}
