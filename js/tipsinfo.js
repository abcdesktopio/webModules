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
 * @name AboutSystem
 * @module
 */

import * as launcher from './launcher.js';
import * as system from './system.js';
import * as languages from './languages.js';

const config = {
  enabledTabsHeaders: [],
};

export const tipsinfoEvents = new EventTarget();

/**
 * @function init
 * @returns {void}
 * @desc Add an event listener for closing the window.
 */
export const open = function () {
  const templateTitle = document.querySelector('template#tipsinfo-window-title-template');
  const templateBody = document.querySelector('template#tipsinfo-window-body-template');

  bootbox.dialog({
    title: templateTitle.innerHTML,
    message: `
      <div id="tipsinfo-window">
        ${templateBody.innerHTML}
      </div>
    `,
    className: 'window-dialog window-dialog-settings',
    animate: false,
    onEscape: () => {
      tipsinfoEvents.dispatchEvent(new CustomEvent('close'));
    },
  });

  const settingsTitle = document.getElementById('tipsinfo-title');
  const windowsettings = document.getElementById('tipsinfo-window');

  settingsTitle.innerText = languages.getTranslate('tipsinfo-title');

  const clone = windowsettings.cloneNode(true);

  

  windowsettings.parentElement.replaceChild(clone, windowsettings);

  languages.applyLanguage();
  
  function setTitleSuffix(name = '') {
    const tipsinfoTitle = document.getElementById('tipsinfo-title');
    if (tipsinfoTitle) {
      tipsinfoTitle.innerText = `${languages.getTranslate('tipsinfo-title')}${name ? `:${name}` : ''}`;
    }
  }
};

document.addEventListener('broadway.connected', () => {
  launcher.getSettings()
    .then((res) => {
      if (res.code === 200) {
        config.enabledTabsHeaders = res.data;
        printer.handlerSettingsConfig(config);
        if (config.enabledTabsHeaders.includes('audio')) {
          $('#speakers').css('display', 'block');
        }
      }
    });
});
