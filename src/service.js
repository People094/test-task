const fetch = require('node-fetch');

const domainUrl = 'https://private-00d723-paysera.apiary-proxy.com/';

const getCashInConfig = async () => {
  const response = await fetch(`${domainUrl}cash-in`);
  return response.json();
};

const getCashOutNaturalPersonConfig = async () => {
  const response = await fetch(`${domainUrl}cash-out-natural`);
  return response.json();
};

const getCashOutLegalPersonConfig = async () => {
  const response = await fetch(`${domainUrl}cash-out-juridical`);
  return response.json();
};

module.exports = {
  getCashInConfig,
  getCashOutNaturalPersonConfig,
  getCashOutLegalPersonConfig,
};
