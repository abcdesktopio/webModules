/*
* Software Name : abcdesktop.io
* Version: 0.2
* SPDX-FileCopyrightText: Copyright (c) 2020-2021 Orange
* SPDX-License-Identifier: GPL-2.0-only
*
* This software is distributed under the GNU General Public License v2.0 only
* see the "license.txt" file for more details.
*
* Author: abcdesktop.io team
* Software description: cloud native desktop service
*/

/**
 * @name Logmein
 * @module
 */

import * as launcher from './launcher.js';

export var _authProvider = 'anonymous'; // default value
export var _authToken = null;

let _isLogmein = false;
let _m = _authProvider;

/**
 * @function isLogmein
 * @returns {boolean}
 * @desc Return _isLogmein (boolean)
 *
 */
export const isLogmein = function () {
  console.debug('function logmein:isLogmein');
  console.debug(`logmein:isLogmein isLogmein=${_isLogmein}`);
  return _isLogmein;
};

/**
 * @function init
 * @returns {void}
 * @desc Parsing current URI and provide _isLogmein with Boolean for auto login
 *
 */
export const init = function () {
  const queryparams = parseQueryString(location.search.split('?')[1] || '');
  _m = queryparams.m;
  _authProvider = (_m === 'anonymous') ? 'anonymous' : queryparams.provider;
  _authToken = queryparams.token;
  _isLogmein = (_m === 'auth' || !!_authProvider);
};

/**
 * @function restoreUserContext
 * @returns {void}
 * @desc launcher.getUserInfo(), if success container is ready
 *
 */
export const restoreUserContext = function () {
  console.debug('function logmein:restoreUserContext');

  const authDeferred = $.Deferred();
  // call getUserInfo
  // to check credentials
  return launcher.getUserInfo().then(
    (userinfo) => {
      console.debug('function logmein:restoreUserContext:getUserInfo.then()');
      if (userinfo && userinfo.name && userinfo.provider) {
        // console.debug('logmein:restoreUserContext:getUserInfo userinfo is valid object ');
        window.od.currentUser = {
          ...window.od.currentUser,
          ...userinfo,
        };
        launcher.refresh_usertoken();
        launcher.runAppsOrDesktop();
      } else {
        // console.debug('function logmein:restoreUserContext return null user info');
        authDeferred.reject('Service returned invalid user info');
      }
      return authDeferred.promise();
    },
    () => {
      console.log('self.restoreUserContext failed');
    },
  );
};


/**
 * @function restoreUserContext
 * @returns {void}
 * @desc launcher.getUserInfo(), if success container is ready
 *
 */
 export const createUserContext = function () {
  console.debug('function logmein:restoreUserContext');

  // call getUserInfo
  // to check credentials
  return launcher.getUserInfo().then(
    (userinfo) => {
      console.debug('function logmein:createUserContext:getUserInfo.then()');
      if (userinfo && userinfo.name && userinfo.provider) {
        console.debug('logmein:createUserContext:getUserInfo userinfo is valid object ');
        window.od.currentUser = {
          ...window.od.currentUser,
          ...userinfo,
        };
        return launcher.runAppsOrDesktop();
      } else {
        console.error('function logmein:createUserContext return null user info');
        Promise.reject({status:500, message:'getUserInfo() returns invalid data:' + userinfo});
      }
    }
  );
};



/**
 * @function parseQueryString
 * @param {string} str URI
 * @returns {object}
 * @desc URI parser return array
 *
 */
export const parseQueryString = function (str) {
  if (typeof str !== 'string') {
    return {};
  }

  str = str.trim().replace(/^(\?|#|&)/, '');

  if (!str) {
    return {};
  }

  return str.split('&').reduce((ret, param) => {
    const parts = param.replace(/\+/g, ' ').split('=');
    // Firefox (pre 40) decodes `%3D` to `=`
    // https://github.com/sindresorhus/query-string/pull/37
    let key = parts.shift();
    let val = parts.length > 0 ? parts.join('=') : undefined;

    key = decodeURIComponent(key);

    // missing `=` should be `null`:
    // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
    val = val === undefined ? null : decodeURIComponent(val);

    if (!{}.hasOwnProperty.call(ret, key)) {
      ret[key] = val;
    } else if (Array.isArray(ret[key])) {
      ret[key].push(val);
    } else {
      ret[key] = [ret[key], val];
    }

    return ret;
  }, {});
};
