'use strict';

const debug = require('debug')('google-play-scraper');
const requestLib = require('got');
const throttled = require('./throttle.js');
const tough = require("tough-cookie");
const cookiejar = new tough.CookieJar();

const someCookie = tough.Cookie.parse('NID=511=I5nW1kQHvPirJdATXPBv7oFCNgf9sB-lDg8tu82wunsw_t4Y4tPZ8C4_8vAM0Z5PZ_FhvGgrKnfQ1S1Vld_d_MgAquM8y_ElErwHHleyrQlLCHpbNe5ee0ee1AMbLKQZtnP4SpridwHpc_gUL5wrCFucjqgWi6BSmAoWAbQXpRa9vrGRC8xJSNZex4axkfif5ALmFsWMyMl_SA; expires=Thu, 24-Nov-2022 05:03:21 GMT; path=/; domain=.google.com; Secure; HttpOnly; SameSite=none')
cookiejar.setCookieSync(someCookie, 'https://play.google.com')
async function doRequest (opts, limit) {
  const newOpts = {
    ...opts,
    cookieJar: cookiejar
  }

  return new Promise((resolve, reject) => {
    let req;
    if (limit) {
      req = throttled(
        requestLib, {
          interval: 1000,
          limit: limit,
        }
      );
    } else {
      req = requestLib;
    }
    req(newOpts)
      .then((response) => resolve(response.body))
      .catch((error) => reject(error));
  });
}

function request (opts, limit) {
  debug('Making request: %j', opts);
  return doRequest(opts, limit)
    .then(function (response) {
      debug('Request finished');
      return response;
    })
    .catch(function (reason) {
      debug('Request error:', reason.message, reason.response && reason.response.statusCode);

      let message = 'Error requesting Google Play:' + reason.message;
      if (reason.response && reason.response.statusCode === 404) {
        message = 'App not found (404)';
      }
      const err = Error(message);
      err.status = reason.response && reason.response.statusCode;
      throw err;
    });
}

module.exports = request;
