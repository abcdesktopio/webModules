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
 * @function logoffClicked
 * @returns {void}
 * @desc Disconnect the user, and remove his session.
 *
 */
export const logoffClicked = function () {
  launcher.docker_logoff();
};

/**
 * @function disconnectClicked
 * @returns {void}
 * @desc Disconnect the use from the session
 */
export const disconnectClicked = function () {
  launcher.disconnect();
};

/**
 * @function open
 * @returns {void}
 * @desc Open logoff window.
 */
export const logoffOpen = function () {
  const logOffTitle = languages.getTranslate('log-off-title');
  const logOffWarningQuestion = languages.getTranslate('log-off-warning-question');
  const logOffCancelBtn = languages.getTranslate('log-off-cancel-btn');
  const logOffBtn = languages.getTranslate('log-off-logOff-btn');
  const disconnectBtn = languages.getTranslate('log-off-disconnect-btn');

  bootbox.dialog({
    title: logOffTitle || 'Logoff',
    message: `
            <div class=" container w-100">
                <div class="row">
                    <div class="col-2">
                        <img class="logoff-img-window" src="img/top/logout.svg">
                    </div>
                    <div class="col-10 d-flex align-items-center">
                        <span>${logOffWarningQuestion || 'Are you sure you want to logoff your desktop ?'}</span>
                    </div>
                </div>
            </div>
        `,
    className: 'window-dialog-small',
    onEscape: true,
    backdrop: true,
    buttons: {
      cancel: {
        label: logOffCancelBtn || 'Cancel',
      },
      logOff: {
        label: logOffBtn || 'Logoff',
        className: 'button-log-off',
        callback: logoffClicked,
      },
      disconnect: {
        label: disconnectBtn || 'Disconnect',
        className: 'window-button',
        callback: disconnectClicked,
      },
    },
    animate: false,
  });
};

export const init = function () {
  launcher.getkeyinfo('menuconfig')
    .done((ret) => {
      if (ret.id) {
        for (const key in ret.id) {
          if (ret.id[key]) {
            const elt = document.getElementById(key);
            if (elt) {
              const li = elt.parentElement;
              li.style.display = 'block';
              const dropDown = li.parentElement;
              const indexDivider = Array.from(dropDown.children).indexOf(li) + 1;
              const divider = dropDown.children[indexDivider];
              if (divider) { divider.style.display = 'block'; }
            }
          }
        }
      }
      // document.getElementById("logoff-window") should always exist
      // Add an event listener for close , logoff and cancel buttons to the menu
    });
};
