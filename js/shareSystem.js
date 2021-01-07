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
 * @name shareSystem
 * @module
 */
import * as launcher from './launcher.js';
import * as notificationSystem from './notificationsystem.js';
import * as system from './system.js';

let email;
let _this;
let topIcon;

/**
 * @function init
 * @returns {void}
 * @desc Add event listener for buttons share Read only and Full acces.
 *
 */
export const init = function () {
  _this = document.getElementById('shareWindow');
  topIcon = document.getElementById('share');
  if (_this && topIcon) {
    _this.querySelector('.close').addEventListener('click', close);
    launcher.getkeyinfo('share').done((msg) => {
      if (msg.id) {
        /* show(topIcon);
                topIcon.addEventListener("click", function() {
                    closeTopRightDropDowns();
                    self.open();
                }) */
      }
    });

    _this.querySelector('#viewOnly').addEventListener('click', () => {
      if (checkEmail() == true) {
        launcher.share(email, 'ro').done(callback);
      } else {
        _this.querySelector('#email').style.borderColor = 'red';
      }
    });

    _this.querySelector('#fullAccess').addEventListener('click', () => {
      if (checkEmail() == true) {
        launcher.share(email, 'rw').done(callback);
      } else {
        _this.querySelector('#email').style.borderColor = 'red';
      }
    });
  }
};

/**
 * @function open
 * @returns {void}
 * @desc Open share window.
 *
 */
export const open = function () {
  system.show(_this);
  system.activeWindow(_this);
};

/**
 * @function close
 * @returns {void}
 * @desc Close share window.
 *
 */
export const close = function () {
  system.hide(_this);
};

/**
 * @function checkEmail
 * @returns {void}
 * @desc Verify email address is valid.
 *
 */
function checkEmail() {
  email = _this.querySelector('#email').value.toLowerCase();
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
  return re.test(email);
}

/**
 * @function callback
 * @returns {void}
 * @desc Created a notification to view the result of sharing.
 *
 */
function callback(msgstatus, msg) {
  close();
  if (msgstatus == 'success') { notificationSystem.displayNotification('Share', msg, 'info'); } else { notificationSystem.displayNotification('Share', msg, 'error'); }
}
