const fetch = require("node-fetch")

const data = require(`./${process.argv[2]}`)

const getCashInConfig = async () => {
  const response = await fetch('https://private-00d723-paysera.apiary-proxy.com/cash-in')
  return response.json();
}

const getCashOutNaturalPersonConfig = async () => {
  const response = await fetch('https://private-00d723-paysera.apiary-proxy.com/cash-out-natural')
  return response.json();
}

const getCashOutLegalPersonConfig = async () => {
  const response = await fetch('https://private-00d723-paysera.apiary-proxy.com/cash-out-juridical')
  return response.json();
}

const getWeekNumber = (date) => {
  const d = new Date(date)
  const dayMilliseconds = 86400000
  const numberOfDays = 7
  const thursdayDay = 4
  const dayNum = d.getUTCDay() || numberOfDays
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + thursdayDay - dayNum)
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1))
  // Calculate full weeks to nearest Thursday
  return Math.ceil((((d - yearStart) / dayMilliseconds) + 1) / numberOfDays)
}

const getFeeAmount = (amount, percents) => {
  const fractionDigits = 2
  return parseFloat(amount * percents / 100).toFixed(fractionDigits)
}

const getCashInFee = (amount, config) => {
  const { percents, max: { amount: maxFee }} = config
  const fee = getFeeAmount(amount, percents)
  if ( fee >= maxFee) {
    const fractionDigits = 2
    return maxFee.toFixed(fractionDigits)
  } else {
    return fee
  }
}

const getCashOutFee = (transaction, totalCashOut, configs) => {
  const { user_id, user_type, date, operation: { amount }} = transaction

  if (user_type === 'natural') {
    const { percents, week_limit: { amount: maxWeekAmount }} = configs.cashOutNaturalPersonConfig
    const weekOfYear = getWeekNumber(date)
    const cashOutAmount = totalCashOut?.[user_id]?.[weekOfYear] || 0
    if (cashOutAmount + amount > maxWeekAmount && cashOutAmount <= maxWeekAmount) {
      totalCashOut[user_id] = {
        [weekOfYear]: cashOutAmount + amount
      }
     return getFeeAmount((cashOutAmount  + amount - maxWeekAmount), percents)
    } else {
      if (cashOutAmount > maxWeekAmount) {
        totalCashOut[user_id] = {
          [weekOfYear]: cashOutAmount + amount
        }
        return getFeeAmount(amount, percents)
      } else {
        return '0.00'
      }
    }
  }

  if (user_type === 'juridical') {
    const { percents, min: { amount: minFee }} = configs.cashOutLegalPersonConfig
    const fee = getFeeAmount(amount, percents)
    if (fee <= minFee) {
      const fractionDigits = 2
      return minFee.toFixed(fractionDigits)
    } else {
      return fee
    }
  }
}

async function getConfigs() {
  const cashInConfig = await getCashInConfig()
  const cashOutNaturalPersonConfig = await getCashOutNaturalPersonConfig()
  const cashOutLegalPersonConfig = await getCashOutLegalPersonConfig()
  return {
    cashInConfig,
    cashOutConfigs: {
      cashOutNaturalPersonConfig,
      cashOutLegalPersonConfig
    }
  }
}

const calculateCommission = async () => {
  const totalCashOut = {}
  const configs = await getConfigs()
  return data.map(transaction => {
    const {type, operation: {amount}} = transaction
    if (type === 'cash_in') {
      console.log(getCashInFee(amount, configs.cashInConfig))
    } else if (type === 'cash_out') {
      console.log(getCashOutFee(transaction, totalCashOut, configs.cashOutConfigs))
    }
  })
}

module.exports = {
  calculateCommission,
  getCashInConfig,
  getCashOutNaturalPersonConfig,
  getCashOutLegalPersonConfig,
  getWeekNumber,
  getCashInFee,
  getCashOutFee,
  getConfigs
}
