const {
  getCashInConfig,
  getCashOutNaturalPersonConfig,
  getCashOutLegalPersonConfig,
} = require('./service');

const data = require(`../${process.argv[2]}`);

const getWeekNumber = (date) => {
  const d = new Date(date);
  const dayMilliseconds = 86400000;
  const numberOfDays = 7;
  const thursdayDay = 4;
  const dayNum = d.getUTCDay() || numberOfDays;
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + thursdayDay - dayNum);
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  return Math.ceil((((d - yearStart) / dayMilliseconds) + 1) / numberOfDays);
};

const getFeeAmount = (amount, percents) => {
  const fractionDigits = 2;
  return parseFloat((amount * percents) / 100).toFixed(fractionDigits);
};

const getCashInFee = (amount, config) => {
  const { percents, max: { amount: maxFee } } = config;
  const fee = getFeeAmount(amount, percents);
  if (fee >= maxFee) {
    const fractionDigits = 2;
    return maxFee.toFixed(fractionDigits);
  }
  return fee;
};

const getCashOutFee = (transaction, totalCashOut, configs) => {
  const {
    user_id: userID, user_type: userType, date, operation: { amount },
  } = transaction;

  if (userType === 'natural') {
    const { percents, week_limit: { amount: maxWeekAmount } } = configs.cashOutNaturalPersonConfig;
    const weekOfYear = getWeekNumber(date);
    const dateYear = new Date(date).getFullYear();
    const cashOutAmount = totalCashOut?.[userID]?.[dateYear]?.[weekOfYear] || 0;
    const totalCashOutByUser = {
      ...totalCashOut,
      [userID]: {
        ...totalCashOut?.[userID],
        [dateYear]: {
          ...totalCashOut?.[userID]?.[dateYear],
          [weekOfYear]: cashOutAmount + amount,
        },
      },
    };
    if (cashOutAmount + amount > maxWeekAmount && cashOutAmount <= maxWeekAmount) {
      return {
        totalCashOutByUser,
        fee: getFeeAmount((cashOutAmount + amount - maxWeekAmount), percents),
      };
    }
    if (cashOutAmount > maxWeekAmount) {
      return {
        totalCashOutByUser,
        fee: getFeeAmount(amount, percents),
      };
    }
    return {
      fee: '0.00',
      totalCashOutByUser,
    };
  }

  if (userType === 'juridical') {
    const { percents, min: { amount: minFee } } = configs.cashOutLegalPersonConfig;
    const fee = getFeeAmount(amount, percents);
    if (fee <= minFee) {
      const fractionDigits = 2;
      return {
        fee: minFee.toFixed(fractionDigits),
        totalCashOutByUser: totalCashOut,
      };
    }
    return {
      fee,
      totalCashOutByUser: totalCashOut,
    };
  }

  return {
    fee: '',
    totalCashOutByUser: totalCashOut,
  };
};

async function getConfigs() {
  const cashInConfig = await getCashInConfig();
  const cashOutNaturalPersonConfig = await getCashOutNaturalPersonConfig();
  const cashOutLegalPersonConfig = await getCashOutLegalPersonConfig();
  return {
    cashInConfig,
    cashOutConfigs: {
      cashOutNaturalPersonConfig,
      cashOutLegalPersonConfig,
    },
  };
}

const calculateCommission = async () => {
  let totalCashOut = {};
  const configs = await getConfigs();
  return data.map((transaction) => {
    const { type, operation: { amount } } = transaction;
    if (type === 'cash_in') {
      const fee = getCashInFee(amount, configs.cashInConfig);
      console.log(fee);
      return fee;
    }
    if (type === 'cash_out') {
      const {
        fee,
        totalCashOutByUser,
      } = getCashOutFee(transaction, totalCashOut, configs.cashOutConfigs);
      totalCashOut = totalCashOutByUser;
      console.log(fee);
      return fee;
    }
    return '';
  });
};

module.exports = {
  calculateCommission,
  getWeekNumber,
  getCashInFee,
  getCashOutFee,
};
