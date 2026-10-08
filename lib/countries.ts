// lib/countries.ts
// Country list for the story form — COUNTRY ONLY, no precise
// location (that's the product rule: a story is placed by its
// country, pinned at the country's centroid). Centroids are
// approximate geographic centers, good enough for a world map
// pin; multiple stories from one country cluster together.

export interface Country { code: string; name: string; lat: number; lng: number }

// [ISO 3166-1 alpha-2, name, centroid lat, centroid lng]
const RAW: [string, string, number, number][] = [
  ['US', 'United States', 39.8, -98.6], ['CA', 'Canada', 58.0, -106.3], ['MX', 'Mexico', 23.6, -102.6],
  ['GT', 'Guatemala', 15.5, -90.3], ['BZ', 'Belize', 17.2, -88.7], ['HN', 'Honduras', 15.2, -86.2],
  ['SV', 'El Salvador', 13.8, -88.9], ['NI', 'Nicaragua', 12.9, -85.0], ['CR', 'Costa Rica', 9.7, -84.0],
  ['PA', 'Panama', 8.5, -80.8], ['CU', 'Cuba', 21.5, -78.7], ['DO', 'Dominican Republic', 18.7, -70.2],
  ['HT', 'Haiti', 19.0, -72.4], ['JM', 'Jamaica', 18.1, -77.3], ['BS', 'Bahamas', 25.0, -77.4],
  ['PR', 'Puerto Rico', 18.2, -66.5], ['TT', 'Trinidad and Tobago', 10.4, -61.3],
  ['BR', 'Brazil', -10.8, -52.9], ['AR', 'Argentina', -38.4, -63.6], ['CL', 'Chile', -31.8, -70.9],
  ['PE', 'Peru', -9.2, -75.0], ['CO', 'Colombia', 4.6, -74.1], ['VE', 'Venezuela', 7.1, -66.2],
  ['EC', 'Ecuador', -1.5, -78.2], ['BO', 'Bolivia', -16.3, -64.6], ['PY', 'Paraguay', -23.4, -58.4],
  ['UY', 'Uruguay', -32.5, -55.8], ['GY', 'Guyana', 4.9, -58.9], ['SR', 'Suriname', 3.9, -56.0],
  ['GB', 'United Kingdom', 55.4, -3.4], ['IE', 'Ireland', 53.4, -8.2], ['FR', 'France', 46.6, 2.5],
  ['ES', 'Spain', 40.2, -3.6], ['PT', 'Portugal', 39.6, -8.0], ['IT', 'Italy', 42.8, 12.8],
  ['DE', 'Germany', 51.1, 10.4], ['NL', 'Netherlands', 52.2, 5.3], ['BE', 'Belgium', 50.5, 4.5],
  ['LU', 'Luxembourg', 49.8, 6.1], ['CH', 'Switzerland', 46.8, 8.2], ['AT', 'Austria', 47.6, 14.1],
  ['PL', 'Poland', 51.9, 19.1], ['CZ', 'Czechia', 49.8, 15.5], ['SK', 'Slovakia', 48.7, 19.7],
  ['HU', 'Hungary', 47.2, 19.5], ['DK', 'Denmark', 56.3, 9.5], ['SE', 'Sweden', 62.0, 15.0],
  ['NO', 'Norway', 64.5, 12.0], ['FI', 'Finland', 63.0, 26.0], ['IS', 'Iceland', 65.0, -18.7],
  ['EE', 'Estonia', 58.8, 25.0], ['LV', 'Latvia', 56.9, 24.6], ['LT', 'Lithuania', 55.9, 23.9],
  ['GR', 'Greece', 39.1, 21.8], ['HR', 'Croatia', 45.3, 16.4], ['SI', 'Slovenia', 46.1, 14.8],
  ['BA', 'Bosnia and Herzegovina', 43.9, 18.0], ['RS', 'Serbia', 44.0, 20.8], ['ME', 'Montenegro', 42.7, 19.4],
  ['MK', 'North Macedonia', 41.6, 21.7], ['AL', 'Albania', 41.1, 20.0], ['BG', 'Bulgaria', 42.8, 25.5],
  ['RO', 'Romania', 45.9, 25.0], ['MD', 'Moldova', 47.4, 28.4], ['UA', 'Ukraine', 48.4, 31.2],
  ['BY', 'Belarus', 53.6, 27.8], ['RU', 'Russia', 60.0, 90.0], ['TR', 'Türkiye', 39.0, 35.2],
  ['CY', 'Cyprus', 35.0, 33.0], ['MT', 'Malta', 35.9, 14.4],
  ['NG', 'Nigeria', 9.1, 8.7], ['GH', 'Ghana', 7.9, -1.2], ['CI', "Côte d'Ivoire", 7.6, -5.6],
  ['SN', 'Senegal', 14.5, -14.5], ['ML', 'Mali', 17.6, -2.0], ['BF', 'Burkina Faso', 12.2, -1.7],
  ['NE', 'Niger', 17.6, 9.5], ['TD', 'Chad', 15.5, 18.7], ['SD', 'Sudan', 13.8, 30.2],
  ['ET', 'Ethiopia', 9.1, 40.5], ['KE', 'Kenya', 0.5, 37.9], ['TZ', 'Tanzania', -6.4, 34.9],
  ['UG', 'Uganda', 1.4, 32.4], ['RW', 'Rwanda', -1.9, 29.9], ['SO', 'Somalia', 5.2, 46.2],
  ['EG', 'Egypt', 26.8, 30.8], ['LY', 'Libya', 26.3, 17.3], ['TN', 'Tunisia', 33.9, 9.6],
  ['DZ', 'Algeria', 28.0, 2.0], ['MA', 'Morocco', 31.8, -6.1], ['AO', 'Angola', -12.5, 17.9],
  ['ZM', 'Zambia', -13.1, 27.8], ['ZW', 'Zimbabwe', -19.0, 29.9], ['MZ', 'Mozambique', -17.3, 35.5],
  ['ZA', 'South Africa', -29.0, 25.0], ['NA', 'Namibia', -22.0, 18.5], ['BW', 'Botswana', -22.3, 24.7],
  ['MG', 'Madagascar', -18.8, 47.0], ['CM', 'Cameroon', 5.7, 12.3], ['CD', 'DR Congo', -2.9, 23.7],
  ['CG', 'Republic of the Congo', -0.7, 15.0], ['GA', 'Gabon', -0.8, 11.6],
  ['SA', 'Saudi Arabia', 24.6, 46.7], ['YE', 'Yemen', 15.6, 47.6], ['OM', 'Oman', 21.5, 57.9],
  ['AE', 'United Arab Emirates', 24.2, 54.4], ['QA', 'Qatar', 25.3, 51.2], ['KW', 'Kuwait', 29.3, 47.5],
  ['IQ', 'Iraq', 33.2, 43.7], ['IR', 'Iran', 32.4, 53.7], ['IL', 'Israel', 31.0, 34.9],
  ['PS', 'Palestine', 31.9, 35.2], ['JO', 'Jordan', 31.2, 36.6], ['LB', 'Lebanon', 33.9, 35.9],
  ['SY', 'Syria', 35.0, 38.0], ['AF', 'Afghanistan', 33.9, 67.7], ['PK', 'Pakistan', 30.4, 69.3],
  ['IN', 'India', 21.1, 78.0], ['NP', 'Nepal', 28.4, 84.1], ['BD', 'Bangladesh', 23.7, 90.4],
  ['LK', 'Sri Lanka', 7.9, 80.8], ['MM', 'Myanmar', 21.9, 96.0], ['TH', 'Thailand', 15.9, 101.0],
  ['VN', 'Vietnam', 14.1, 108.3], ['KH', 'Cambodia', 12.7, 105.0], ['LA', 'Laos', 19.9, 102.5],
  ['MY', 'Malaysia', 4.2, 102.2], ['SG', 'Singapore', 1.35, 103.8], ['ID', 'Indonesia', -2.2, 118.0],
  ['PH', 'Philippines', 12.9, 121.8], ['CN', 'China', 35.0, 105.0], ['TW', 'Taiwan', 23.7, 121.0],
  ['HK', 'Hong Kong', 22.3, 114.2], ['JP', 'Japan', 36.2, 138.3], ['KR', 'South Korea', 36.6, 127.9],
  ['MN', 'Mongolia', 46.9, 103.8], ['KZ', 'Kazakhstan', 48.2, 66.9], ['UZ', 'Uzbekistan', 41.4, 64.6],
  ['TM', 'Turkmenistan', 39.1, 59.6], ['TJ', 'Tajikistan', 38.9, 71.3], ['KG', 'Kyrgyzstan', 41.2, 74.8],
  ['AU', 'Australia', -25.3, 133.8], ['NZ', 'New Zealand', -41.8, 172.8], ['PG', 'Papua New Guinea', -6.3, 147.0],
  ['FJ', 'Fiji', -17.7, 178.1], ['SB', 'Solomon Islands', -9.2, 160.2],
]

export const COUNTRIES: Country[] = RAW
  .map(([code, name, lat, lng]) => ({ code, name, lat, lng }))
  .sort((a, b) => a.name.localeCompare(b.name))

const BY_CODE = new Map(COUNTRIES.map(c => [c.code, c]))

export function countryByCode(code: string | null | undefined): Country | null {
  if (!code) return null
  return BY_CODE.get(code.trim().toUpperCase()) ?? null
}
