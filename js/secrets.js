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

import * as launcher from './launcher.js';
import * as languages from './languages.js';

/**
 * 
 * @param {Function} launchApp 
 */
export async function runAuthentication(launchApp) {
  const template = document.querySelector('#authent-window-template');
  const labelCancelButton = await languages.getTranslate('cancel-button');
  const labelSendButton = await languages.getTranslate('send-button');

  bootbox.dialog({
    title: 'Authentication',
    message: template.innerHTML,
    className: 'window-dialog authent-window',
    animate: false,
    onEscape: true,
    backdrop: true,
    buttons: {
      cancel: {
        label: labelCancelButton || 'Cancel',
      },
      send: {
        label: labelSendButton || 'Send',
        className: 'window-button',
        callback: () => {
          launchApp();
        },
      },
    },
  });
}

document.addEventListener('broadway.connected', async () => {
  const { result } = await launcher.getSecrets();
  window.od.secrets = result;
});
