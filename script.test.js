const fetch = require('node-fetch');
const {
  getCashInConfig,
  getCashOutNaturalPersonConfig,
  getCashOutLegalPersonConfig,
  getWeekNumber,
  getCashInFee,
  getCashOutFee,
} = require('./script');

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

describe('Get week number for', () => {
  it('2016-01-05', () => {
    const date = '2016-01-05';
    expect(getWeekNumber(date)).toBe(1);
  });

  it('2016-02-15', () => {
    const date = '2016-02-15';
    expect(getWeekNumber(date)).toBe(7);
  });
});

describe('Cash in fee', () => {
  const config = {
    percents: 0.03,
    max: {
      amount: 5,
      currency: 'EUR',
    },
  };

  it('for 200 EUR', () => {
    expect(getCashInFee(200, config)).toBe('0.06');
  });

  it('for 1 million EUR', () => {
    expect(getCashInFee(1000000, config)).toBe('5.00');
  });
});

describe('Cash out fee', () => {
  const cashOutConfigs = {
    cashOutNaturalPersonConfig: {
      percents: 0.3,
      week_limit: {
        amount: 1000,
        currency: 'EUR',
      },
    },
    cashOutLegalPersonConfig: {
      percents: 0.3,
      min: {
        amount: 0.5,
        currency: 'EUR',
      },
    },
  };

  const totalCashOut = {};

  it('for 300.00 EUR, user_id: 2, date: 2016-01-06, juridical person', () => {
    const transaction = {
      date: '2016-01-06',
      user_id: 2,
      user_type: 'juridical',
      type: 'cash_out',
      operation: {
        amount: 300.00,
        currency: 'EUR',
      },
    };
    expect(getCashOutFee(transaction, totalCashOut, cashOutConfigs)).toBe('0.90');
  });

  it('for 30.00 EUR, user_id: 2, date: 2016-01-06, juridical person', () => {
    const transaction = {
      date: '2016-01-06',
      user_id: 2,
      user_type: 'juridical',
      type: 'cash_out',
      operation: {
        amount: 30.00,
        currency: 'EUR',
      },
    };
    expect(getCashOutFee(transaction, totalCashOut, cashOutConfigs)).toBe('0.50');
  });

  it('for 30000.00 EUR, user_id: 1, date: 2016-01-06, natural person', () => {
    const transaction = {
      date: '2016-01-06',
      user_id: 1,
      user_type: 'natural',
      type: 'cash_out',
      operation: {
        amount: 30000,
        currency: 'EUR',
      },
    };
    expect(getCashOutFee(transaction, totalCashOut, cashOutConfigs)).toBe('87.00');
  });

  it('for 1000 EUR, user_id: 1, date: 2016-01-07, natural person', () => {
    const transaction = {
      date: '2016-01-07',
      user_id: 1,
      user_type: 'natural',
      type: 'cash_out',
      operation: {
        amount: 1000,
        currency: 'EUR',
      },
    };
    expect(getCashOutFee(transaction, totalCashOut, cashOutConfigs)).toBe('3.00');
  });

  it('for 1000 EUR, user_id: 3, date: 2016-01-10, natural person', () => {
    const transaction = {
      date: '2016-01-10',
      user_id: 3,
      user_type: 'natural',
      type: 'cash_out',
      operation: {
        amount: 1000,
        currency: 'EUR',
      },
    };
    expect(getCashOutFee(transaction, totalCashOut, cashOutConfigs)).toBe('0.00');
  });
});
