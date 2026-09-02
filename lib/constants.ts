export interface StateProvince {
  name: string;
  code: string;
  majorCities: string[];
}

export interface SupportedCountry {
  name: string;
  code: 'USA' | 'CAN';
  iso2: 'US' | 'CA';
  flag: string;
  currency: string;
  currencySymbol: string;
  states: StateProvince[];
}

export const SUPPORTED_REGIONS: SupportedCountry[] = [
  {
    name: 'United States',
    code: 'USA',
    iso2: 'US',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    states: [
      {
        name: 'North Carolina',
        code: 'NC',
        majorCities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'],
      },
      {
        name: 'Oklahoma',
        code: 'OK',
        majorCities: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond'],
      },
      {
        name: 'Georgia',
        code: 'GA',
        majorCities: ['Atlanta', 'Savannah', 'Augusta', 'Columbus', 'Athens'],
      },
      {
        name: 'Alaska',
        code: 'AK',
        majorCities: ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan'],
      },
      {
        name: 'New Hampshire',
        code: 'NH',
        majorCities: ['Manchester', 'Nashua', 'Concord', 'Derry', 'Dover'],
      },
      {
        name: 'Maine',
        code: 'ME',
        majorCities: ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn'],
      },
      {
        name: 'Kentucky',
        code: 'KY',
        majorCities: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington'],
      },
    ],
  },
  {
    name: 'Canada',
    code: 'CAN',
    iso2: 'CA',
    flag: '🇨🇦',
    currency: 'CAD',
    currencySymbol: 'CA$',
    states: [
      {
        name: 'Ontario',
        code: 'ON',
        majorCities: ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton'],
      },
      {
        name: 'British Columbia',
        code: 'BC',
        majorCities: ['Vancouver', 'Victoria', 'Surrey', 'Burnaby', 'Richmond'],
      },
    ],
  },
];

export const getCountryByCode = (code?: string): SupportedCountry | undefined => {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return SUPPORTED_REGIONS.find(
    (c) => c.code === upper || c.iso2 === upper || c.name.toLowerCase() === code.toLowerCase()
  );
};

export const getStatesForCountry = (countryCode?: string): StateProvince[] => {
  const country = getCountryByCode(countryCode);
  return country ? country.states : [];
};

export const getAllSupportedStates = (): { country: SupportedCountry; state: StateProvince }[] => {
  const list: { country: SupportedCountry; state: StateProvince }[] = [];
  SUPPORTED_REGIONS.forEach((c) => {
    c.states.forEach((s) => {
      list.push({ country: c, state: s });
    });
  });
  return list;
};
