export interface CountryItem {
  name: string;
  code: string;
  dialCode: string;
  isCaribbean?: boolean;
}

// All Caribbean Countries and Territories (Sovereign nations, dependencies, and CARICOM members)
export const CARIBBEAN_COUNTRIES: CountryItem[] = [
  { name: 'Anguilla', code: 'AI', dialCode: '+1-264', isCaribbean: true },
  { name: 'Antigua and Barbuda', code: 'AG', dialCode: '+1-268', isCaribbean: true },
  { name: 'Aruba', code: 'AW', dialCode: '+297', isCaribbean: true },
  { name: 'Bahamas', code: 'BS', dialCode: '+1-242', isCaribbean: true },
  { name: 'Barbados', code: 'BB', dialCode: '+1-246', isCaribbean: true },
  { name: 'Belize', code: 'BZ', dialCode: '+501', isCaribbean: true },
  { name: 'Bermuda', code: 'BM', dialCode: '+1-441', isCaribbean: true },
  { name: 'Bonaire, Sint Eustatius and Saba', code: 'BQ', dialCode: '+599', isCaribbean: true },
  { name: 'British Virgin Islands', code: 'VG', dialCode: '+1-284', isCaribbean: true },
  { name: 'Cayman Islands', code: 'KY', dialCode: '+1-345', isCaribbean: true },
  { name: 'Cuba', code: 'CU', dialCode: '+53', isCaribbean: true },
  { name: 'Curaçao', code: 'CW', dialCode: '+599', isCaribbean: true },
  { name: 'Dominica', code: 'DM', dialCode: '+1-767', isCaribbean: true },
  { name: 'Dominican Republic', code: 'DO', dialCode: '+1-809', isCaribbean: true },
  { name: 'Grenada', code: 'GD', dialCode: '+1-473', isCaribbean: true },
  { name: 'Guadeloupe', code: 'GP', dialCode: '+590', isCaribbean: true },
  { name: 'Guyana', code: 'GY', dialCode: '+592', isCaribbean: true },
  { name: 'Haiti', code: 'HT', dialCode: '+509', isCaribbean: true },
  { name: 'Jamaica', code: 'JM', dialCode: '+1-876', isCaribbean: true },
  { name: 'Martinique', code: 'MQ', dialCode: '+596', isCaribbean: true },
  { name: 'Montserrat', code: 'MS', dialCode: '+1-664', isCaribbean: true },
  { name: 'Puerto Rico', code: 'PR', dialCode: '+1-787', isCaribbean: true },
  { name: 'Saint Barthélemy', code: 'BL', dialCode: '+590', isCaribbean: true },
  { name: 'Saint Kitts and Nevis', code: 'KN', dialCode: '+1-869', isCaribbean: true },
  { name: 'Saint Lucia', code: 'LC', dialCode: '+1-758', isCaribbean: true },
  { name: 'Saint Martin (French part)', code: 'MF', dialCode: '+590', isCaribbean: true },
  { name: 'Saint Vincent and the Grenadines', code: 'VC', dialCode: '+1-784', isCaribbean: true },
  { name: 'Sint Maarten (Dutch part)', code: 'SX', dialCode: '+1-721', isCaribbean: true },
  { name: 'Suriname', code: 'SR', dialCode: '+597', isCaribbean: true },
  { name: 'Trinidad and Tobago', code: 'TT', dialCode: '+1-868', isCaribbean: true },
  { name: 'Turks and Caicos Islands', code: 'TC', dialCode: '+1-649', isCaribbean: true },
  { name: 'United States Virgin Islands', code: 'VI', dialCode: '+1-340', isCaribbean: true }
];

// Major Global & International Countries
export const GLOBAL_COUNTRIES: CountryItem[] = [
  { name: 'United States', code: 'US', dialCode: '+1' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
  { name: 'Canada', code: 'CA', dialCode: '+1' },
  { name: 'Australia', code: 'AU', dialCode: '+61' },
  { name: 'Germany', code: 'DE', dialCode: '+49' },
  { name: 'France', code: 'FR', dialCode: '+33' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41' },
  { name: 'Singapore', code: 'SG', dialCode: '+65' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31' },
  { name: 'Ireland', code: 'IE', dialCode: '+353' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64' },
  { name: 'Spain', code: 'ES', dialCode: '+34' },
  { name: 'Italy', code: 'IT', dialCode: '+39' },
  { name: 'Brazil', code: 'BR', dialCode: '+55' },
  { name: 'Mexico', code: 'MX', dialCode: '+52' },
  { name: 'Panama', code: 'PA', dialCode: '+507' },
  { name: 'Costa Rica', code: 'CR', dialCode: '+506' },
  { name: 'Colombia', code: 'CO', dialCode: '+57' },
  { name: 'Argentina', code: 'AR', dialCode: '+54' },
  { name: 'Chile', code: 'CL', dialCode: '+56' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234' },
  { name: 'Kenya', code: 'KE', dialCode: '+254' },
  { name: 'Ghana', code: 'GH', dialCode: '+233' },
  { name: 'India', code: 'IN', dialCode: '+91' },
  { name: 'Japan', code: 'JP', dialCode: '+81' },
  { name: 'South Korea', code: 'KR', dialCode: '+82' },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966' },
  { name: 'Qatar', code: 'QA', dialCode: '+974' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965' },
  { name: 'Norway', code: 'NO', dialCode: '+47' },
  { name: 'Sweden', code: 'SE', dialCode: '+46' },
  { name: 'Denmark', code: 'DK', dialCode: '+45' },
  { name: 'Finland', code: 'FI', dialCode: '+358' },
  { name: 'Austria', code: 'AT', dialCode: '+43' },
  { name: 'Belgium', code: 'BE', dialCode: '+32' },
  { name: 'Portugal', code: 'PT', dialCode: '+351' },
  { name: 'Poland', code: 'PL', dialCode: '+48' },
  { name: 'Cyprus', code: 'CY', dialCode: '+357' },
  { name: 'Malta', code: 'MT', dialCode: '+356' },
  { name: 'Greece', code: 'GR', dialCode: '+30' },
  { name: 'Turkey', code: 'TR', dialCode: '+90' },
  { name: 'Israel', code: 'IL', dialCode: '+972' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62' },
  { name: 'Philippines', code: 'PH', dialCode: '+63' },
  { name: 'Thailand', code: 'TH', dialCode: '+66' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84' }
];

// Combined full country list
export const ALL_COUNTRIES: CountryItem[] = [
  ...CARIBBEAN_COUNTRIES,
  ...GLOBAL_COUNTRIES
];
