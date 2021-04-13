const fetch = require("node-fetch");

const data = require(`./${process.argv[2]}`)

const getCashInConfig = async () => {
  const response = await fetch('https://private-00d723-paysera.apiary-proxy.com/cash-in')
  return await response.json();
}

const getCashOutNaturalPersonConfig = async () => {
  const response = await fetch('https://private-00d723-paysera.apiary-proxy.com/cash-out-natural')
  return await response.json();
}

const getCashOutLegalPersonConfig = async () => {
  const response = await fetch('https://private-00d723-paysera.apiary-proxy.com/cash-out-juridical')
  return await response.json();
}

const getWeekNumber = (date) => {
  const d = new Date(date)
  const dayMilliseconds = 86400000
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1))
  return Math.ceil((((d - yearStart) / dayMilliseconds) + 1)/7)
}

const getFeeAmount = (amount, percents) => {
  return parseFloat(amount * percents / 100).toFixed(2)
}

const getCashInFee = (amount, config) => {
  const { percents, max: { amount: maxFee }} = config
  const fee = getFeeAmount(amount, percents)
  fee >= 5 ? console.log(maxFee.toFixed(2)) : console.log(fee)
}

const getCashOutFee = (transaction, totalCashOut, configs) => {
  const { user_id, user_type, date, operation: { amount }} = transaction

  if (user_type === 'natural') {
    const { percents, week_limit: { amount: maxWeekAmount }} = configs.cashOutNaturalPersonConfig
    const weekOfYear = getWeekNumber(date)
    const cashOutAmount = totalCashOut?.[user_id]?.[weekOfYear] || 0
    if (cashOutAmount + amount > maxWeekAmount && cashOutAmount <= maxWeekAmount) {
      console.log(getFeeAmount((cashOutAmount  + amount - maxWeekAmount), percents))
      totalCashOut[user_id] = {
        [weekOfYear]: cashOutAmount + amount
      }
    } else {
      if (cashOutAmount > maxWeekAmount) {
        console.log(getFeeAmount(amount, percents))
        totalCashOut[user_id] = {
          [weekOfYear]: cashOutAmount + amount
        }
      } else {
        console.log('0.00')
      }
    }
  }

  if (user_type === 'juridical') {
    const { percents, min: { amount: minFee }} = configs.cashOutLegalPersonConfig
    const fee = getFeeAmount(amount, percents)
    fee <= minFee ? console.log(minFee) : console.log(fee)
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

const calculateCommission = () => {
  const totalCashOut = {}
  getConfigs().then((configs) => {
    data.map(transaction => {
      const {type, operation: {amount}} = transaction
      if (type === 'cash_in') {
        getCashInFee(amount, configs.cashInConfig)
      }
      if (type === 'cash_out') {
        getCashOutFee(transaction, totalCashOut, configs.cashOutConfigs)
      }
    })
  })
}

calculateCommission()