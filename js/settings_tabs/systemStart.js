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

import { settingsEvents } from '../settingsevents.js';

let firstAppear = true;

function getScreenInfos() {
  const navigatorName = document.getElementById('navigator-name');
  const userAgent = document.getElementById('user-agent');
  if (navigatorName) { navigatorName.innerText = navigator.appCodeName; }

  if (userAgent) { userAgent.innerText = navigator.userAgent; }

  const jsScreenWidth = document.getElementById('js-screen-width');
  if (jsScreenWidth) { jsScreenWidth.innerText = `${screen.width}px`; }

  const jsScreenHeight = document.getElementById('js-screen-height');
  if (jsScreenHeight) { jsScreenHeight.innerText = `${screen.height}px`; }

  const jsWindowInnerHeight = document.getElementById('js-window-innerHeight');
  if (jsWindowInnerHeight) { jsWindowInnerHeight.innerText = `${document.documentElement.clientHeight}px`; }

  const jsWindowInnerWidth = document.getElementById('js-window-innerWidth');
  if (jsWindowInnerWidth) { jsWindowInnerWidth.innerText = `${document.documentElement.clientWidth}px`; }

  const jsPixelRatio = document.getElementById('js-pixel-ratio');
  if (jsPixelRatio) { jsPixelRatio.innerText = `${window.devicePixelRatio}px`; }

  const rootFontSize = document.getElementById('root-font-size');
  if (rootFontSize) { rootFontSize.innerText = window.getComputedStyle(document.body, null).getPropertyValue('font-size'); }

  const deviceOrientation = document.getElementById('device-orientation');
  if (deviceOrientation && screen.orientation) {
    deviceOrientation.innerText = screen.orientation.type;
  }
}

export function init(home, tab) {
  system.hide(home);
  const overview = tab.querySelector('#overview');

  if (!firstAppear) {
    system.show(tab);
    return;
  }

  firstAppear = false;
  system.removeAllChilds(document.getElementById('overview'));

  launcher.getWebModulesVersion()
    .then((version) => {
      const systemTab = document.getElementById('system-tab');
      if (!systemTab) {
        return;
      }

      const settingsVersions = systemTab.querySelector('div.settings-versions');
      if (!settingsVersions) {
        return;
      }

      const paragraphes = settingsVersions.querySelectorAll('p');

      if (!(paragraphes instanceof NodeList)) {
        return;
      }

      const [webFrontDate, webFrontVersion] = paragraphes;

      if (!webFrontDate || !webFrontVersion) {
        return;
      }

      webFrontDate.innerText = `Date : ${version.date}`;
      webFrontVersion.innerText = `Version : ${version.version}`;
    })
    .catch(console.error);

  launcher.getPyosVersion()
    .then((version) => {
      if (version.status === 200) {
        const systemTab = document.getElementById('system-tab');
        if (!systemTab) {
          return;
        }

        const settingsVersions = systemTab.querySelector('div.settings-versions');
        if (!settingsVersions) {
          return;
        }

        const paragraphes = settingsVersions.querySelectorAll('p');

        if (!(paragraphes instanceof NodeList)) {
          return;
        }

        const apiServerDate = paragraphes[2];
        const apiServerVersion = paragraphes[3];

        if (!apiServerDate || !apiServerVersion) {
          return;
        }

        apiServerDate.innerText = `Date : ${version.date}`;
        apiServerVersion.innerText = `Version : ${version.version}`;
      }
    });

  launcher.getSpawnerVersion()
    .then((version) => {
      const systemTab = document.getElementById('system-tab');
      if (!systemTab) {
        return;
      }

      const settingsVersions = systemTab.querySelector('div.settings-versions');
      if (!settingsVersions) {
        return;
      }

      const paragraphes = settingsVersions.querySelectorAll('p');

      if (!(paragraphes instanceof NodeList)) {
        return;
      }

      const spawnerServerDate = paragraphes[4];
      const spawnerServerVersion = paragraphes[5];

      if (!spawnerServerDate || !spawnerServerVersion) {
        return;
      }

      spawnerServerDate.innerText = `Date : ${version.date}`;
      spawnerServerVersion.innerText = `Version : ${version.version}`;
    });

  launcher.about()
    .then((msg) => {
      const fragment = document.createDocumentFragment();
      for (const key in msg) {
        if (!(key in msg) || msg[key] === null) {
          continue;
        }

        let keyName = key.toLocaleLowerCase().replace(/_/g, ' ');
        let titleValue;
        let textValue;

        if (keyName.includes(' ')) {
          keyName = keyName.split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .reduce((prev, cur) => `${prev} ${cur}`, '');
          titleValue = keyName.toUpperCase();
          textValue = `${msg[key] ? msg[key] : null}`;
        } else {
          titleValue = `${keyName.charAt(0).toUpperCase() + key.slice(1)}`;
          textValue = `${msg[key] ? msg[key] : null}`;
        }

        fragment.appendChild(getWrapperCard(titleValue, textValue));
      }
      overview.appendChild(fragment);
    });

  // Display
  getScreenInfos();

  overview.appendChild(getWrapperCard('JWT token', window.od.currentUser.authorization, 'col-12'));
  system.show(tab);

  /**
   * 
   * @param {string} title 
   * @param {string} value 
   * @returns 
   */
  function getWrapperCard(title, value, wrapperCardClassName = 'col-xl-6 col-lg-6 col-12') {
    const wrapperCard = document.createElement('div');
    const cardBody = document.createElement('div');
    const card = document.createElement('div');
    const titleKey = document.createElement('h6');
    const spanValue = document.createElement('span');

    card.className = 'card';
    cardBody.className = 'card-body';
    cardBody.style.overflowX = 'auto';
    wrapperCard.className = wrapperCardClassName;
    wrapperCard.style.marginTop = '15px';
  
    titleKey.textContent = title;
    spanValue.textContent = value;

    cardBody.appendChild(titleKey);
    cardBody.appendChild(spanValue);
    card.appendChild(cardBody);
    wrapperCard.appendChild(card);

    return wrapperCard;
  }
}

window.addEventListener('resize', getScreenInfos);

settingsEvents.addEventListener('close', () => {
  firstAppear = true;
});
