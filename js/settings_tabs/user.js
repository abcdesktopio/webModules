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

import * as system from '../system.js';
import * as launcher from '../launcher.js';
import * as whichBrowser from '../which-browser.js';

import { settingsEvents } from '../settingsevents.js';

let firstAppear = true;

const providerImg = {
  facebook: '../img/welcome/facebook_icon.svg',
  google: '../img/welcome/google_icon.svg',
  orange: '../img/welcome/orange_icon.svg',
  mobile: '../img/welcome/mobileconnect_icon.svg',
  anonymous: '../img/welcome/anonymous_icon.svg',
  activedirectory: '../img/welcome/activedirectory_icon.svg',
  ldap: '../img/welcome/ldap.svg',
};

const osImg = {
  Linux: '../img/linux.svg',
  Ubuntu: '../img/ubuntu.svg',
  Windows: '../img/windows.svg',
  'Mac OS': '../img/apple.svg',
  iOS: '../img/apple.svg',
  Android: '../img/android.svg',
};

const browserImg = {
  Chrome: '../img/google-chrome.svg',
  Firefox: '../img/firefox-icons.svg',
  Safari: '../img/safari.svg',
  'Mobile Safari': '../img/safari.svg',
  Edge: '../img/edge.svg',
  IE: '../img/IE.svg',
  default: '../img/browser.svg',
};

/**
 * @function setProvider
 * @returns {void}
 * @desc Display user's connection provider inside the window.
 */
function setProvider() {
  let url; let
    provider;

  try {
    url = providerImg[window.od.currentUser.providertype];
  } catch (e) {
    url = '../img/welcome/anonymous_icon.svg';
  }

  try {
    provider = `Auth: ${window.od.currentUser.providertype} ${window.od.currentUser.provider.charAt(0).toUpperCase()}${window.od.currentUser.provider.slice(1)}`;
  } catch (e) {
    provider = 'AuthenticationProvider';
  }

  url = window.od.net.urlrewrite(url);

  const fragment = document.createDocumentFragment();
  const wrapperImage = document.createElement('div');
  wrapperImage.className = 'col-6 d-md-block d-sm-block d-none';
  const wrapperText = document.createElement('div');
  wrapperText.className = 'd-flex col-6 align-items-center';

  const img = document.createElement('img');
  const span = document.createElement('span');
  span.innerText = provider;
  img.src = url;
  img.style = 'float:right;';

  wrapperImage.appendChild(img);
  wrapperText.appendChild(span);
  fragment.appendChild(wrapperImage);
  fragment.appendChild(wrapperText);
  system.removeAllChilds(document.querySelector('#settings-user-provider'))
    .appendChild(fragment);
}

/**
 * @function setName
 * @returns {void}
 * @desc Display user's name, picture and userID inside the window.
 */
function setName() {
  let url;
  const { name } = window.od.currentUser;
  const { userid } = window.od.currentUser;

  if (window.od.currentUser.photo) {
    // the image format depend on ldap storage attribut value
    const { photo } = window.od.currentUser;
    url = `data:;base64,${photo}`;
  } else {
    try {
      url = (window.od.currentUser.picture) ? window.od.currentUser.picture : '../img/top/place-offline.svg';
    } catch (e) {
      url = '../img/top/place-offline.svg';
      console.log(`settings.js:setName ${e}`);
    }
  }

  url = window.od.net.urlrewrite(url);

  const fragment = document.createDocumentFragment();
  const wrapperImage = document.createElement('div');
  wrapperImage.className = 'col-6 d-md-block d-sm-block d-none';
  const wrapperText = document.createElement('div');
  wrapperText.className = 'd-flex col-6 align-items-center row';

  const img = document.createElement('img');
  const spanName = document.createElement('span');
  const spanId = document.createElement('span');

  img.src = url;
  img.style = 'float:right;';
  spanName.id = 'name';
  spanName.innerText = name;

  spanId.id = 'userID';
  spanId.innerText = ` ID : ${userid}`;

  wrapperImage.appendChild(img);
  wrapperText.appendChild(getSpanContainer(spanName, 'col-xl-3 col-lg-4 col-md-12 col-xs-12 align-items-center'));
  wrapperText.appendChild(getSpanContainer(spanId, 'col-xl-9 col-lg-8 d-xl-block d-lg-block d-none  align-items-center'));
  fragment.appendChild(wrapperImage);
  fragment.appendChild(wrapperText);

  system.removeAllChilds(document.querySelector('#settings-user-name'))
    .appendChild(fragment);

  function getSpanContainer(span, className) {
    const spanContainer = document.createElement('div');
    spanContainer.className = className;
    spanContainer.appendChild(span);
    return spanContainer;
  }
}

/**
 * @function setOS
 * @returns {void}
 * @desc Display user's OS informations inside the window.
 */
function setOS(ua) {
  const objOS = ua.getOS();
  let url = '../img/welcome/anonymous_icon.svg'; // unknow icon
  const OS = whichBrowser.getOSInfo();
  try {
    if (OS && OS.name) {
      url = osImg[OS.name];
    }
  } catch (e) {
    console.log(`settings.js:setOS ${e}`);
  }
  url = window.od.net.urlrewrite(url);

  const osElt = system.removeAllChilds(document.querySelector('#settings-user-os'));
  const fragment = document.createDocumentFragment();
  const wrapperImage = document.createElement('div');
  wrapperImage.className = 'col-6 d-md-block d-sm-block d-none align-items-center';
  const wrapperText = document.createElement('div');
  wrapperText.className = 'd-flex col-6 align-items-center';

  const img = document.createElement('img');
  const span = document.createElement('span');

  img.src = url;
  img.style = 'float:right;';
  span.innerText = `${objOS.name} ${objOS.version}`;

  wrapperImage.appendChild(img);
  wrapperText.appendChild(span);
  fragment.appendChild(wrapperImage);
  fragment.appendChild(wrapperText);

  osElt.appendChild(fragment);
}

/**
 * @function setBrowser
 * @returns {void}
 * @desc Display user's browser informations inside the window.
 */
function setBrowser(ua) {
  const objBrowser = ua.getBrowser();
  const browser = whichBrowser.getBrowserInfo();

  let url = browserImg.default;
  let name = 'default';
  try {
    name = browser.name;
    url = browserImg[name];
  } catch (e) {
    console.log(`settings.js:setBrowser ${e}`);
  }

  url = window.od.net.urlrewrite(url);

  const browserElt = system.removeAllChilds(document.querySelector('#settings-user-browser'));
  const fragment = document.createDocumentFragment();
  const wrapperImage = document.createElement('div');
  wrapperImage.className = 'col-6 d-md-block d-sm-block d-none';
  const wrapperText = document.createElement('div');
  wrapperText.className = 'd-flex col-6 align-items-center';

  const img = document.createElement('img');
  const span = document.createElement('span');

  img.src = url;
  img.style = 'float:right;';
  span.innerText = `${name} ${objBrowser.version}`;

  wrapperImage.appendChild(img);
  wrapperText.appendChild(span);
  fragment.appendChild(wrapperImage);
  fragment.appendChild(wrapperText);

  browserElt.appendChild(fragment);
}

/**
 * @function buildHistoryList
 * @param {object} obj loginHistory JSON
 * @returns {void}
 * @desc Builds the HTML Table out of loginHistory json data.
 */
function buildHistoryList(loginHistory, user) {
  const table = user.querySelector('#history');
  const mappedArray = loginHistory.map((login) => {
    const ua = new UAParser(login.useragent);
    const objBrowser = ua.getBrowser();
    const urlBrowser = browserImg[objBrowser.name];
    const objOS = ua.getOS();
    let urlOS = osImg[objOS.name];
    urlOS = window.od.net.urlrewrite(urlOS);
    return {
      date: `<span style="white-space: nowrap;">${login.date}</span>`,
      ipaddr: login.ipaddr,
      node: login.node ? login.node : 'N/A',
      useragent: `
        <div class="d-flex justify-content-center align-items-center">
          <img  src="${urlBrowser}" />
          <span class="d-none d-xl-block d-lg-block d-md-block" style="white-space: nowrap;">
            ${objBrowser.name} ${objBrowser.version}
          </span>
        </div>
      `,
      os: `
        <div class="d-flex justify-content-center align-items-center">
          <img src="${urlOS}" />
          <span class="d-none d-xl-block d-lg-block d-md-block" style="white-space: nowrap;">
            ${objOS.name} ${objOS.version}
          </span>
        </div>
      `,
    };
  });
  table.dataset.data = JSON.stringify(mappedArray);
  $(table).bootstrapTable();
}

export function init(home, user) {
  system.hide(home);
  if (!firstAppear) {
    system.show(user);
    return;
  }
  firstAppear = false;

  const ua = new UAParser(navigator.userAgent);
  /* hide home and show user */

  // Provider settings only if user is not a shared access users
  if (!window.od.isShared) {
    setProvider();
  }

  // set name
  setName();
  // set browser
  setBrowser(ua);
  // set OS
  setOS(ua);

  // get login history from collection history
  launcher.getCollection('loginHistory')
    .done((msg) => {
      if (msg.status === 200) {
        const history = msg.result;
        buildHistoryList(history, user);
      }
    });
  system.show(user);
}

settingsEvents.addEventListener('close', () => {
  firstAppear = true;
});
