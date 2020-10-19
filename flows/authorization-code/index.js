const { Issuer, generators } = require('openid-client');
const open = require('open');
const config = require('./config.json');
let client, state, nonce;

const fastify = require('fastify')();

(async () => {
  try {
    const issuer = await Issuer.discover(config.iss);
    client = new issuer.Client(config.client);
    const parameters = {
      redirect_uri: config.client.redirect_uris[0],
      response_type: config.client.response_types[0],
      scope: config.scope
    };
    state = generators.state();
    nonce = generators.state();
    console.log('state ->', state);
    console.log('nonce ->', nonce);
    const authorizationUrl = client.authorizationUrl({ ...parameters, state, nonce });
    console.log('Authorization URL ->', authorizationUrl);
    await open(authorizationUrl, { app: 'chromium' });
  } catch (error) {
    console.error(error);
    process.exit();
  }
})();


const tokenRenovate = async (client, tokenSet) => {
  console.log('verifing token');
  if (tokenSet.expired()) {
    tokenSet = await client.refresh(tokenSet);
    console.log('request refresh token /token', tokenSet);
  }
  return tokenSet;
};

fastify.get('/redirect', async (request, reply) => {
  console.log('Redirect with authorization code');
  
  try {
    const params = client.callbackParams(request);
    console.log('params ->', params);
    let tokenSet = await client.callback(config.client.redirect_uris[0], params ,{ state, nonce });
    console.log('access_token ->', tokenSet);
    let userInfo = await client.userinfo(tokenSet);

    setInterval(async () => {
      tokenSet = await tokenRenovate(client, tokenSet);
      userInfo = await client.userinfo(tokenSet);
      console.log('response userinfo ->', userInfo);
    }, 5000);
    reply.type('text/html').code(200);
    return `<h1>Successful authentication!!!</h1><pre><code>${JSON.stringify(userInfo, undefined, 2)}</code></pre>`;
    
  } catch (error) {
    console.error(error);
  }
});

fastify.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
});