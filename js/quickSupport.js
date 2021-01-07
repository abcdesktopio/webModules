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
 * @name quickSupport
 * @module
 */

import * as launcher from './launcher.js';
import * as script from './scripts.js';
import * as system from './system.js';

let support;
let popup;
export const init = function () {
  support = document.getElementById('support');
  popup = document.getElementById('supportWindow');
  popup.querySelector('.close').addEventListener('click', close);
  popup.querySelector('#cancel').addEventListener('click', close);
  popup.querySelector('#yes').addEventListener('click', contactSupport);

  launcher.getkeyinfo('support').done((msg) => {
    if (msg.id) {
      system.show(support);
      support.addEventListener('click', () => {
        system.show(popup);
        system.activeWindow(popup);
        script.closesupportRightDropDowns();
      });
    }
  });
};

export const close = function () {
  system.hide(popup);
};

export const contactSupport = function () {
  launcher.support();
};
