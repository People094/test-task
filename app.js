const fetch = require("node-fetch");

fetch('https://private-00d723-paysera.apiary-proxy.com/cash-in')
  .then(res => res.json())
  .then(json => console.log(json))