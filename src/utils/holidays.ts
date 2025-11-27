export interface Holiday {
  name: string;
  emoji: string;
  month: number; // 1-12
  day: number;
  searchTerms: string[];
  featured: string[];
  culture: string;
}

export const HOLIDAYS: Holiday[] = [
  // Christian Holidays
  {
    name: 'Christmas',
    emoji: '🎄',
    month: 12,
    day: 25,
    searchTerms: ['christmas', 'holiday', 'festive', 'xmas'],
    featured: ['roast turkey', 'sugar cookies', 'eggnog', 'glazed ham'],
    culture: 'Christian',
  },
  {
    name: 'Easter',
    emoji: '🐰',
    month: 4,
    day: 9, // 2025 - varies yearly
    searchTerms: ['easter', 'spring', 'brunch'],
    featured: ['hot cross buns', 'deviled eggs', 'lamb', 'carrot cake'],
    culture: 'Christian',
  },

  // Jewish Holidays
  {
    name: 'Hanukkah',
    emoji: '🕎',
    month: 12,
    day: 14, // 2025 - varies yearly
    searchTerms: ['hanukkah', 'chanukah', 'jewish'],
    featured: ['latkes', 'sufganiyot', 'brisket', 'challah'],
    culture: 'Jewish',
  },
  {
    name: 'Passover',
    emoji: '🍷',
    month: 4,
    day: 13, // 2025 - varies yearly
    searchTerms: ['passover', 'pesach', 'seder'],
    featured: ['matzo ball soup', 'brisket', 'charoset', 'gefilte fish'],
    culture: 'Jewish',
  },
  {
    name: 'Rosh Hashanah',
    emoji: '🍎',
    month: 9,
    day: 23, // 2025 - varies yearly
    searchTerms: ['rosh hashanah', 'jewish new year'],
    featured: ['honey cake', 'apple honey', 'challah', 'brisket'],
    culture: 'Jewish',
  },

  // Islamic Holidays
  {
    name: 'Eid al-Fitr',
    emoji: '🌙',
    month: 3,
    day: 30, // 2025 - varies yearly (lunar calendar)
    searchTerms: ['eid', 'eid al fitr', 'ramadan', 'islamic'],
    featured: ['biryani', 'samosas', 'baklava', 'kebabs'],
    culture: 'Islamic',
  },
  {
    name: 'Eid al-Adha',
    emoji: '🕌',
    month: 6,
    day: 6, // 2025 - varies yearly (lunar calendar)
    searchTerms: ['eid al adha', 'eid', 'islamic'],
    featured: ['lamb curry', 'biryani', 'kebabs', 'haleem'],
    culture: 'Islamic',
  },

  // Hindu Holidays
  {
    name: 'Diwali',
    emoji: '🪔',
    month: 10,
    day: 20, // 2025 - varies yearly
    searchTerms: ['diwali', 'deepavali', 'hindu', 'indian'],
    featured: ['samosas', 'gulab jamun', 'biryani', 'ladoo'],
    culture: 'Hindu',
  },
  {
    name: 'Holi',
    emoji: '🎨',
    month: 3,
    day: 14, // 2025 - varies yearly
    searchTerms: ['holi', 'hindu', 'spring festival'],
    featured: ['gujiya', 'thandai', 'pakoras', 'chaat'],
    culture: 'Hindu',
  },

  // Chinese Holidays
  {
    name: 'Chinese New Year',
    emoji: '🧧',
    month: 1,
    day: 29, // 2025 - varies yearly (lunar calendar)
    searchTerms: ['chinese new year', 'lunar new year', 'spring festival'],
    featured: ['dumplings', 'spring rolls', 'nian gao', 'fish'],
    culture: 'Chinese',
  },
  {
    name: 'Mid-Autumn Festival',
    emoji: '🥮',
    month: 9,
    day: 29, // 2025 - varies yearly
    searchTerms: ['mid autumn', 'moon festival', 'mooncake'],
    featured: ['mooncakes', 'tea', 'pomelo', 'lotus seed paste'],
    culture: 'Chinese',
  },

  // American/Secular Holidays
  {
    name: 'Thanksgiving',
    emoji: '🦃',
    month: 11,
    day: 27, // 2025 - 4th Thursday
    searchTerms: ['thanksgiving', 'turkey day'],
    featured: ['roast turkey', 'stuffing', 'pumpkin pie', 'cranberry sauce'],
    culture: 'American',
  },
  {
    name: 'Halloween',
    emoji: '🎃',
    month: 10,
    day: 31,
    searchTerms: ['halloween', 'spooky', 'fall'],
    featured: ['pumpkin pie', 'candy apples', 'caramel corn', 'spider cookies'],
    culture: 'American',
  },
  {
    name: '4th of July',
    emoji: '🎆',
    month: 7,
    day: 4,
    searchTerms: ['4th of july', 'independence day', 'bbq', 'summer'],
    featured: ['hot dogs', 'hamburgers', 'bbq ribs', 'apple pie'],
    culture: 'American',
  },
  {
    name: "New Year's Day",
    emoji: '🎉',
    month: 1,
    day: 1,
    searchTerms: ['new year', 'party', 'celebration'],
    featured: [
      'appetizers',
      'champagne cocktails',
      'party snacks',
      'black eyed peas',
    ],
    culture: 'Universal',
  },
  {
    name: "Valentine's Day",
    emoji: '💝',
    month: 2,
    day: 14,
    searchTerms: ['valentine', 'romantic', 'date night'],
    featured: [
      'chocolate desserts',
      'romantic dinner',
      'pasta',
      'wine pairing',
    ],
    culture: 'Universal',
  },
  {
    name: "Mother's Day",
    emoji: '💐',
    month: 5,
    day: 11, // 2025 - 2nd Sunday
    searchTerms: ['mother day', 'brunch', 'mom'],
    featured: ['brunch recipes', 'pancakes', 'quiche', 'mimosas'],
    culture: 'Universal',
  },
  {
    name: "Father's Day",
    emoji: '👔',
    month: 6,
    day: 15, // 2025 - 3rd Sunday
    searchTerms: ['father day', 'dad', 'bbq', 'grilling'],
    featured: ['steak', 'bbq ribs', 'burgers', 'grilled chicken'],
    culture: 'Universal',
  },

  // Mexican Holidays
  {
    name: 'Cinco de Mayo',
    emoji: '🌮',
    month: 5,
    day: 5,
    searchTerms: ['cinco de mayo', 'mexican', 'fiesta'],
    featured: ['tacos', 'guacamole', 'enchiladas', 'margaritas'],
    culture: 'Mexican',
  },
  {
    name: 'Day of the Dead',
    emoji: '💀',
    month: 11,
    day: 2,
    searchTerms: ['dia de los muertos', 'day of the dead', 'mexican'],
    featured: ['pan de muerto', 'tamales', 'mole', 'hot chocolate'],
    culture: 'Mexican',
  },
];

export const getUpcomingHoliday = (): Holiday | null => {
  const today = new Date();

  // Find holidays within next 30 days
  const upcoming = HOLIDAYS.filter(holiday => {
    const holidayDate = new Date(
      today.getFullYear(),
      holiday.month - 1,
      holiday.day,
    );
    const daysUntil = Math.ceil(
      (holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    // If holiday already passed this year, check next year
    if (daysUntil < 0) {
      const nextYearDate = new Date(
        today.getFullYear() + 1,
        holiday.month - 1,
        holiday.day,
      );
      const daysUntilNextYear = Math.ceil(
        (nextYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysUntilNextYear >= 0 && daysUntilNextYear <= 30;
    }

    return daysUntil >= 0 && daysUntil <= 30;
  });

  // Return closest holiday
  if (upcoming.length === 0) return null;

  return upcoming.sort((a, b) => {
    const dateA = new Date(today.getFullYear(), a.month - 1, a.day);
    const dateB = new Date(today.getFullYear(), b.month - 1, b.day);
    return dateA.getTime() - dateB.getTime();
  })[0];
};

export const getDaysUntilHoliday = (holiday: Holiday): number => {
  const today = new Date();
  const holidayDate = new Date(
    today.getFullYear(),
    holiday.month - 1,
    holiday.day,
  );
  const daysUntil = Math.ceil(
    (holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntil < 0) {
    const nextYearDate = new Date(
      today.getFullYear() + 1,
      holiday.month - 1,
      holiday.day,
    );
    return Math.ceil(
      (nextYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  return daysUntil;
};
