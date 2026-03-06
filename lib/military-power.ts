/**
 * Military Power Index — sourced from Global Firepower (globalfirepower.com) 2025 rankings.
 * Lower pwrIndex = stronger. Metrics are publicly available aggregated figures.
 * Updated: 2025. Nuclear warhead counts from FAS/SIPRI estimates.
 */

export interface MilitaryPower {
  country: string;
  aliases: string[];           // Alternative names used in conflict zone factions/relatedCountries
  countryCode: string;         // ISO 3166-1 alpha-2
  rank: number;                // GFP 2025 global rank
  pwrIndex: number;            // Power Index (0.0000 = perfect)
  activeTroops: number;        // thousands
  reserveTroops: number;       // thousands
  tanks: number;
  armoredVehicles: number;
  aircraft: number;            // total fleet
  fighters: number;
  helicopters: number;
  navalVessels: number;
  submarines: number;
  destroyers: number;
  defenseBudgetB: number;      // USD billions
  nuclearWarheads?: number;    // FAS/SIPRI 2025 estimates
  tier: 'superpower' | 'major' | 'regional' | 'limited';
}

export const MILITARY_POWERS: MilitaryPower[] = [
  {
    country: 'United States', aliases: ['USA', 'US', 'America', 'United States of America'],
    countryCode: 'US', rank: 1, pwrIndex: 0.0744, tier: 'superpower',
    activeTroops: 1395, reserveTroops: 840, tanks: 5500, armoredVehicles: 41062,
    aircraft: 13247, fighters: 1914, helicopters: 5768, navalVessels: 484,
    submarines: 68, destroyers: 92, defenseBudgetB: 895, nuclearWarheads: 5550,
  },
  {
    country: 'Russia', aliases: ['Russian Federation', 'Russian', 'RU', 'USSR'],
    countryCode: 'RU', rank: 2, pwrIndex: 0.0788, tier: 'superpower',
    activeTroops: 1320, reserveTroops: 2000, tanks: 12420, armoredVehicles: 30122,
    aircraft: 4173, fighters: 772, helicopters: 1543, navalVessels: 598,
    submarines: 64, destroyers: 15, defenseBudgetB: 109, nuclearWarheads: 6257,
  },
  {
    country: 'China', aliases: ['PRC', "People's Republic of China", 'Chinese', 'PLA'],
    countryCode: 'CN', rank: 3, pwrIndex: 0.0854, tier: 'superpower',
    activeTroops: 2185, reserveTroops: 510, tanks: 5000, armoredVehicles: 35000,
    aircraft: 3309, fighters: 1232, helicopters: 912, navalVessels: 730,
    submarines: 79, destroyers: 52, defenseBudgetB: 292, nuclearWarheads: 500,
  },
  {
    country: 'India', aliases: ['Indian', 'IN', 'Hindustan'],
    countryCode: 'IN', rank: 4, pwrIndex: 0.1184, tier: 'major',
    activeTroops: 1455, reserveTroops: 1155, tanks: 4614, armoredVehicles: 8686,
    aircraft: 2229, fighters: 538, helicopters: 821, navalVessels: 293,
    submarines: 17, destroyers: 11, defenseBudgetB: 75, nuclearWarheads: 170,
  },
  {
    country: 'South Korea', aliases: ['ROK', 'Korean', 'Republic of Korea', 'KR'],
    countryCode: 'KR', rank: 5, pwrIndex: 0.1305, tier: 'major',
    activeTroops: 600, reserveTroops: 3100, tanks: 2614, armoredVehicles: 8000,
    aircraft: 1649, fighters: 400, helicopters: 740, navalVessels: 196,
    submarines: 22, destroyers: 12, defenseBudgetB: 46,
  },
  {
    country: 'United Kingdom', aliases: ['UK', 'Britain', 'British', 'England', 'GB'],
    countryCode: 'GB', rank: 6, pwrIndex: 0.1785, tier: 'major',
    activeTroops: 153, reserveTroops: 77, tanks: 227, armoredVehicles: 5015,
    aircraft: 693, fighters: 137, helicopters: 377, navalVessels: 76,
    submarines: 11, destroyers: 6, defenseBudgetB: 68, nuclearWarheads: 225,
  },
  {
    country: 'Japan', aliases: ['Japanese', 'JP', 'JSDF'],
    countryCode: 'JP', rank: 7, pwrIndex: 0.1838, tier: 'major',
    activeTroops: 247, reserveTroops: 56, tanks: 1004, armoredVehicles: 4900,
    aircraft: 1449, fighters: 295, helicopters: 537, navalVessels: 155,
    submarines: 22, destroyers: 36, defenseBudgetB: 51,
  },
  {
    country: 'France', aliases: ['French', 'FR', 'République française'],
    countryCode: 'FR', rank: 8, pwrIndex: 0.1872, tier: 'major',
    activeTroops: 203, reserveTroops: 35, tanks: 215, armoredVehicles: 6630,
    aircraft: 1048, fighters: 254, helicopters: 456, navalVessels: 118,
    submarines: 10, destroyers: 11, defenseBudgetB: 61, nuclearWarheads: 290,
  },
  {
    country: 'Turkey', aliases: ['Turkish', 'TR', 'Türkiye', 'Ottoman'],
    countryCode: 'TR', rank: 9, pwrIndex: 0.1961, tier: 'major',
    activeTroops: 355, reserveTroops: 379, tanks: 2229, armoredVehicles: 9900,
    aircraft: 1069, fighters: 206, helicopters: 456, navalVessels: 194,
    submarines: 12, destroyers: 16, defenseBudgetB: 26,
  },
  {
    country: 'Germany', aliases: ['German', 'DE', 'Bundeswehr', 'Deutschland'],
    countryCode: 'DE', rank: 10, pwrIndex: 0.2473, tier: 'major',
    activeTroops: 183, reserveTroops: 30, tanks: 296, armoredVehicles: 7600,
    aircraft: 617, fighters: 129, helicopters: 304, navalVessels: 81,
    submarines: 6, destroyers: 11, defenseBudgetB: 66,
  },
  {
    country: 'Pakistan', aliases: ['Pakistani', 'PK', 'ISI'],
    countryCode: 'PK', rank: 12, pwrIndex: 0.2513, tier: 'regional',
    activeTroops: 654, reserveTroops: 550, tanks: 2496, armoredVehicles: 8500,
    aircraft: 1387, fighters: 338, helicopters: 370, navalVessels: 114,
    submarines: 9, destroyers: 0, defenseBudgetB: 11, nuclearWarheads: 170,
  },
  {
    country: 'Israel', aliases: ['Israeli', 'IL', 'IDF', 'Zionist'],
    countryCode: 'IL', rank: 17, pwrIndex: 0.2730, tier: 'regional',
    activeTroops: 170, reserveTroops: 465, tanks: 1650, armoredVehicles: 43407,
    aircraft: 601, fighters: 241, helicopters: 148, navalVessels: 65,
    submarines: 5, destroyers: 0, defenseBudgetB: 24, nuclearWarheads: 90,
  },
  {
    country: 'Egypt', aliases: ['Egyptian', 'EG', 'Cairo'],
    countryCode: 'EG', rank: 14, pwrIndex: 0.2742, tier: 'regional',
    activeTroops: 439, reserveTroops: 479, tanks: 3735, armoredVehicles: 15800,
    aircraft: 1099, fighters: 218, helicopters: 290, navalVessels: 319,
    submarines: 9, destroyers: 0, defenseBudgetB: 11,
  },
  {
    country: 'Iran', aliases: ['Iranian', 'IR', 'Persia', 'Persian', 'IRGC', 'Tehran'],
    countryCode: 'IR', rank: 14, pwrIndex: 0.2843, tier: 'regional',
    activeTroops: 610, reserveTroops: 350, tanks: 1996, armoredVehicles: 6900,
    aircraft: 551, fighters: 186, helicopters: 129, navalVessels: 398,
    submarines: 29, destroyers: 0, defenseBudgetB: 10,
  },
  {
    country: 'Saudi Arabia', aliases: ['Saudi', 'SA', 'KSA', 'Riyadh', 'Saudi Coalition'],
    countryCode: 'SA', rank: 22, pwrIndex: 0.3016, tier: 'regional',
    activeTroops: 254, reserveTroops: 25, tanks: 1142, armoredVehicles: 6500,
    aircraft: 818, fighters: 240, helicopters: 266, navalVessels: 55,
    submarines: 0, destroyers: 0, defenseBudgetB: 80,
  },
  {
    country: 'Australia', aliases: ['Australian', 'AU', 'ADF'],
    countryCode: 'AU', rank: 27, pwrIndex: 0.3378, tier: 'regional',
    activeTroops: 59, reserveTroops: 29, tanks: 59, armoredVehicles: 3900,
    aircraft: 469, fighters: 72, helicopters: 163, navalVessels: 46,
    submarines: 6, destroyers: 3, defenseBudgetB: 33,
  },
  {
    country: 'Poland', aliases: ['Polish', 'PL'],
    countryCode: 'PL', rank: 20, pwrIndex: 0.2852, tier: 'regional',
    activeTroops: 220, reserveTroops: 75, tanks: 1009, armoredVehicles: 4500,
    aircraft: 465, fighters: 96, helicopters: 236, navalVessels: 47,
    submarines: 5, destroyers: 0, defenseBudgetB: 31,
  },
  {
    country: 'Ukraine', aliases: ['Ukrainian', 'UA', 'UAF', 'Kyiv', 'Kiev'],
    countryCode: 'UA', rank: 18, pwrIndex: 0.3589, tier: 'regional',
    activeTroops: 500, reserveTroops: 900, tanks: 2596, armoredVehicles: 12303,
    aircraft: 321, fighters: 98, helicopters: 112, navalVessels: 38,
    submarines: 0, destroyers: 0, defenseBudgetB: 44,
  },
  {
    country: 'North Korea', aliases: ['DPRK', 'KP', 'NK', 'Pyongyang'],
    countryCode: 'KP', rank: 36, pwrIndex: 0.4261, tier: 'regional',
    activeTroops: 1280, reserveTroops: 600, tanks: 5505, armoredVehicles: 12500,
    aircraft: 944, fighters: 458, helicopters: 202, navalVessels: 492,
    submarines: 83, destroyers: 0, defenseBudgetB: 4, nuclearWarheads: 50,
  },
  {
    country: 'Taiwan', aliases: ['ROC', 'TW', 'Republic of China', 'Taipei'],
    countryCode: 'TW', rank: 11, pwrIndex: 0.3093, tier: 'regional',
    activeTroops: 163, reserveTroops: 1657, tanks: 1110, armoredVehicles: 7700,
    aircraft: 744, fighters: 286, helicopters: 252, navalVessels: 206,
    submarines: 4, destroyers: 4, defenseBudgetB: 19,
  },
  {
    country: 'UAE', aliases: ['United Arab Emirates', 'Emirati', 'AE', 'Abu Dhabi'],
    countryCode: 'AE', rank: 37, pwrIndex: 0.4514, tier: 'regional',
    activeTroops: 63, reserveTroops: 0, tanks: 700, armoredVehicles: 3400,
    aircraft: 609, fighters: 167, helicopters: 165, navalVessels: 75,
    submarines: 0, destroyers: 0, defenseBudgetB: 23,
  },
  {
    country: 'Ethiopia', aliases: ['Ethiopian', 'ET', 'ENDF', 'Addis Ababa'],
    countryCode: 'ET', rank: 42, pwrIndex: 0.5044, tier: 'limited',
    activeTroops: 138, reserveTroops: 0, tanks: 560, armoredVehicles: 1500,
    aircraft: 82, fighters: 24, helicopters: 36, navalVessels: 0,
    submarines: 0, destroyers: 0, defenseBudgetB: 1.4,
  },
  {
    country: 'Jordan', aliases: ['Jordanian', 'JO', 'JAF', 'Amman'],
    countryCode: 'JO', rank: 71, pwrIndex: 0.6724, tier: 'limited',
    activeTroops: 101, reserveTroops: 65, tanks: 1321, armoredVehicles: 4700,
    aircraft: 253, fighters: 51, helicopters: 64, navalVessels: 1,
    submarines: 0, destroyers: 0, defenseBudgetB: 2.2,
  },
  {
    country: 'Lebanon', aliases: ['Lebanese', 'LB', 'LAF', 'Beirut'],
    countryCode: 'LB', rank: 102, pwrIndex: 0.9135, tier: 'limited',
    activeTroops: 60, reserveTroops: 0, tanks: 260, armoredVehicles: 1000,
    aircraft: 73, fighters: 0, helicopters: 54, navalVessels: 64,
    submarines: 0, destroyers: 0, defenseBudgetB: 0.5,
  },
  {
    country: 'Syria', aliases: ['Syrian', 'SY', 'SAA', 'Damascus'],
    countryCode: 'SY', rank: 60, pwrIndex: 0.6066, tier: 'limited',
    activeTroops: 169, reserveTroops: 0, tanks: 4950, armoredVehicles: 6900,
    aircraft: 339, fighters: 95, helicopters: 74, navalVessels: 69,
    submarines: 0, destroyers: 0, defenseBudgetB: 1.8,
  },
  {
    country: 'Sudan', aliases: ['Sudanese', 'SD', 'SAF', 'RSF', 'Khartoum'],
    countryCode: 'SD', rank: 80, pwrIndex: 0.7529, tier: 'limited',
    activeTroops: 109, reserveTroops: 0, tanks: 570, armoredVehicles: 2200,
    aircraft: 94, fighters: 30, helicopters: 22, navalVessels: 18,
    submarines: 0, destroyers: 0, defenseBudgetB: 1.2,
  },
  {
    country: 'Rwanda', aliases: ['Rwandan', 'RW', 'RDF', 'Kigali'],
    countryCode: 'RW', rank: 90, pwrIndex: 0.8218, tier: 'limited',
    activeTroops: 32, reserveTroops: 0, tanks: 24, armoredVehicles: 410,
    aircraft: 8, fighters: 0, helicopters: 8, navalVessels: 0,
    submarines: 0, destroyers: 0, defenseBudgetB: 0.5,
  },
  {
    country: 'Belarus', aliases: ['Belarusian', 'BY', 'Minsk'],
    countryCode: 'BY', rank: 44, pwrIndex: 0.5105, tier: 'regional',
    activeTroops: 65, reserveTroops: 290, tanks: 515, armoredVehicles: 2600,
    aircraft: 267, fighters: 89, helicopters: 87, navalVessels: 0,
    submarines: 0, destroyers: 0, defenseBudgetB: 1.0,
  },
  {
    country: 'Qatar', aliases: ['Qatari', 'QA', 'Doha'],
    countryCode: 'QA', rank: 96, pwrIndex: 0.8735, tier: 'limited',
    activeTroops: 16, reserveTroops: 0, tanks: 30, armoredVehicles: 600,
    aircraft: 125, fighters: 36, helicopters: 30, navalVessels: 22,
    submarines: 0, destroyers: 0, defenseBudgetB: 6,
  },
  {
    country: 'Philippines', aliases: ['Filipino', 'PH', 'AFP', 'Manila'],
    countryCode: 'PH', rank: 35, pwrIndex: 0.4212, tier: 'regional',
    activeTroops: 143, reserveTroops: 131, tanks: 0, armoredVehicles: 2740,
    aircraft: 245, fighters: 0, helicopters: 135, navalVessels: 106,
    submarines: 0, destroyers: 0, defenseBudgetB: 5.6,
  },
  {
    country: 'Chad', aliases: ['Chadian', 'TD', "N'Djamena"],
    countryCode: 'TD', rank: 111, pwrIndex: 0.9844, tier: 'limited',
    activeTroops: 34, reserveTroops: 0, tanks: 190, armoredVehicles: 700,
    aircraft: 20, fighters: 4, helicopters: 14, navalVessels: 0,
    submarines: 0, destroyers: 0, defenseBudgetB: 0.2,
  },
  {
    country: 'Somalia', aliases: ['Somali', 'SO', 'Mogadishu', 'SNA'],
    countryCode: 'SO', rank: 137, pwrIndex: 2.3108, tier: 'limited',
    activeTroops: 20, reserveTroops: 0, tanks: 0, armoredVehicles: 50,
    aircraft: 3, fighters: 0, helicopters: 3, navalVessels: 0,
    submarines: 0, destroyers: 0, defenseBudgetB: 0.06,
  },
  {
    country: 'Myanmar', aliases: ['Burmese', 'MM', 'Naypyidaw', 'Tatmadaw', 'SAC', 'Junta'],
    countryCode: 'MM', rank: 38, pwrIndex: 0.4551, tier: 'regional',
    activeTroops: 376, reserveTroops: 0, tanks: 779, armoredVehicles: 3800,
    aircraft: 252, fighters: 59, helicopters: 91, navalVessels: 116,
    submarines: 0, destroyers: 0, defenseBudgetB: 2.8,
  },
  {
    country: 'Angola', aliases: ['Angolan', 'AO', 'Luanda'],
    countryCode: 'AO', rank: 73, pwrIndex: 0.6820, tier: 'limited',
    activeTroops: 107, reserveTroops: 0, tanks: 370, armoredVehicles: 1750,
    aircraft: 91, fighters: 16, helicopters: 40, navalVessels: 13,
    submarines: 0, destroyers: 0, defenseBudgetB: 1.7,
  },
  {
    country: 'Niger', aliases: ['Nigerien', 'NE', 'Niamey'],
    countryCode: 'NE', rank: 119, pwrIndex: 1.1225, tier: 'limited',
    activeTroops: 25, reserveTroops: 0, tanks: 0, armoredVehicles: 250,
    aircraft: 15, fighters: 0, helicopters: 3, navalVessels: 0,
    submarines: 0, destroyers: 0, defenseBudgetB: 0.15,
  },
  {
    country: 'Eritrea', aliases: ['Eritrean', 'ER', 'Asmara', 'EDF'],
    countryCode: 'ER', rank: 94, pwrIndex: 0.8536, tier: 'limited',
    activeTroops: 200, reserveTroops: 120, tanks: 340, armoredVehicles: 300,
    aircraft: 37, fighters: 14, helicopters: 5, navalVessels: 5,
    submarines: 0, destroyers: 0, defenseBudgetB: 0.1,
  },
  {
    country: 'Uganda', aliases: ['Ugandan', 'UG', 'UPDF', 'Kampala'],
    countryCode: 'UG', rank: 91, pwrIndex: 0.8283, tier: 'limited',
    activeTroops: 45, reserveTroops: 0, tanks: 96, armoredVehicles: 600,
    aircraft: 47, fighters: 6, helicopters: 12, navalVessels: 3,
    submarines: 0, destroyers: 0, defenseBudgetB: 0.5,
  },
  {
    country: 'Iraq', aliases: ['Iraqi', 'IQ', 'Baghdad', 'ISF', 'PMU', 'Kataib'],
    countryCode: 'IQ', rank: 58, pwrIndex: 0.5960, tier: 'limited',
    activeTroops: 193, reserveTroops: 0, tanks: 360, armoredVehicles: 5650,
    aircraft: 271, fighters: 40, helicopters: 115, navalVessels: 35,
    submarines: 0, destroyers: 0, defenseBudgetB: 3.0,
  },
  {
    country: 'Thailand', aliases: ['Thai', 'TH', 'Bangkok', 'RTARF'],
    countryCode: 'TH', rank: 25, pwrIndex: 0.3224, tier: 'regional',
    activeTroops: 361, reserveTroops: 200, tanks: 755, armoredVehicles: 3000,
    aircraft: 560, fighters: 72, helicopters: 191, navalVessels: 81,
    submarines: 0, destroyers: 0, defenseBudgetB: 7.3,
  },
  {
    country: 'Estonia', aliases: ['Estonian', 'EE', 'Tallinn', 'EDF'],
    countryCode: 'EE', rank: 88, pwrIndex: 0.8052, tier: 'limited',
    activeTroops: 7, reserveTroops: 50, tanks: 0, armoredVehicles: 475,
    aircraft: 12, fighters: 0, helicopters: 3, navalVessels: 6,
    submarines: 0, destroyers: 0, defenseBudgetB: 1.2,
  },
  {
    country: 'NATO', aliases: ['NATO CCDCOE', 'North Atlantic Treaty Organization', 'Alliance'],
    countryCode: 'NT', rank: 0, pwrIndex: 0.0100, tier: 'superpower',
    activeTroops: 3500, reserveTroops: 5000, tanks: 15000, armoredVehicles: 80000,
    aircraft: 20000, fighters: 3500, helicopters: 8000, navalVessels: 1200,
    submarines: 200, destroyers: 180, defenseBudgetB: 1300, nuclearWarheads: 6300,
  },
];

/** Find military power data by country name or alias.
 *  Handles compound faction names like "Iran/IRGC" or "Israel/IDF" by
 *  trying each slash/comma-separated token until one matches. */
export function getMilitaryPower(name: string): MilitaryPower | undefined {
  const tryMatch = (token: string) => {
    const t = token.trim().toLowerCase();
    if (t.length < 2) return undefined;
    return MILITARY_POWERS.find(
      m => m.country.toLowerCase() === t || m.aliases.some(a => a.toLowerCase() === t),
    );
  };

  // Direct match first
  const direct = tryMatch(name);
  if (direct) return direct;

  // Split on / , ; and try each token (handles "Iran/IRGC", "Israel/IDF", etc.)
  const parts = name.split(/[/,;]+/);
  if (parts.length > 1) {
    for (const part of parts) {
      const match = tryMatch(part);
      if (match) return match;
    }
  }

  return undefined;
}

/** Get power data for a list of faction/country names */
export function getZoneMilitaryData(factions: string[], relatedCountries: string[] = []): MilitaryPower[] {
  const all = [...factions, ...relatedCountries];
  const seen = new Set<string>();
  const results: MilitaryPower[] = [];
  for (const name of all) {
    const mp = getMilitaryPower(name);
    if (mp && !seen.has(mp.countryCode)) {
      seen.add(mp.countryCode);
      results.push(mp);
    }
  }
  return results.sort((a, b) => a.rank - b.rank);
}

export const TIER_COLORS: Record<MilitaryPower['tier'], string> = {
  superpower: '#ff2200',
  major:      '#ff8800',
  regional:   '#ffcc00',
  limited:    '#44aa66',
};

export const TIER_LABELS: Record<MilitaryPower['tier'], string> = {
  superpower: 'SUPERPOWER',
  major:      'MAJOR POWER',
  regional:   'REGIONAL',
  limited:    'LIMITED',
};
