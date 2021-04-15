const fetch = require('node-fetch');
const {
  getCashInConfig,
  getCashOutNaturalPersonConfig,
  getCashOutLegalPersonConfig,
} = require('../script');

jest.mock('node-fetch');

describe('Get cash in config', () => {
  it('should return data from backend', async () => {
    const expectedResponse = {
      percents: 0.03,
      max: {
        amount: 5,
        currency: 'EUR',
      },
    };
    fetch.mockReturnValue(Promise.resolve({ json: () => Promise.resolve(expectedResponse) }));
    const data = await getCashInConfig();

    expect(data).toEqual(expectedResponse);
  });
});

describe('Get cash out natural person config', () => {
  it('should return data from backend', async () => {
    const expectedResponse = {
      percents: 0.3,
      week_limit: {
        amount: 1000,
        currency: 'EUR',
      },
    };
    fetch.mockReturnValue(Promise.resolve({ json: () => Promise.resolve(expectedResponse) }));
    const data = await getCashOutNaturalPersonConfig();

    expect(data).toEqual(expectedResponse);
  });
});

describe('Get cash out legal person config', () => {
  it('should return data from backend', async () => {
    const expectedResponse = {
      percents: 0.3,
      min: {
        amount: 0.5,
        currency: 'EUR',
      },
    };
    fetch.mockReturnValue(Promise.resolve({ json: () => Promise.resolve(expectedResponse) }));
    const data = await getCashOutLegalPersonConfig();

    expect(data).toEqual(expectedResponse);
  });
});
