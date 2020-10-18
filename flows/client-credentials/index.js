'use strict';

const { Issuer } = require('openid-client');
const config = require('./config.json');

const tokenRenovate = async (client, tokenSet = { expired: () => true }) => {
  console.log('verifing token');
  if (tokenSet.expired()) {
    tokenSet = await client.grant({
      grant_type: 'client_credentials'
    });
    console.log('request /token', tokenSet);
  }
  return tokenSet;
};

const requestCustomResource = async (client, tokenSet) => {
  const response = await client.requestResource(`${config.iss}${config.custom_resource}`, tokenSet.access_token); // default GET
  const responseFormat = response.body.toString('utf8');
  console.log('response - request custom resource', responseFormat);
  return responseFormat;
};


(async () => {
  console.log('Initializing client');
  try {
    const issuer = await Issuer.discover(config.iss);
    const client = new issuer.Client(config.client);
    let tokenSet = await tokenRenovate(client);
    await requestCustomResource(client, tokenSet);
  
    setInterval(async () => {
      tokenSet = await tokenRenovate(client, tokenSet);
      await requestCustomResource(client, tokenSet);
    }, 5000);
  } catch (error) {
    console.error('Error: ', error);
  }
})();