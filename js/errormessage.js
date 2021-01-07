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

import welcomeSystem from './welcomesystem.js';
import * as system from './system.js';
import * as menu from './menu.js';

/**
 * @name ErrorMessage
 * @module
 */

let _this;
let NavMessage;

/**
 * @function init
 * @returns {void}
 * @desc Add events and default variables
 */
export const init = function () {
  _this = document.querySelector('.error-window');
  if (_this) {
    $('.error-window  .control .close').bind('click', () => {
      close();
    });

    document.querySelector('#anonymous-error .close').addEventListener('click', self.closeAnonymous);
    document.querySelector('#anonymous-error #connect').addEventListener('click', () => {
      menu.logoffClicked();
    });

    NavMessage = document.getElementById('navMessage');
    NavMessage.querySelector('#btnIgnore').addEventListener('click', () => {
      document.getElementById('fullbcg').style.display = 'none';
      welcomeSystem.init();
    });
  }
};

/**
 * @function open
 * @returns {void}
 * @desc Open error window
 */
export const open = function () {
  system.show(_this);
};

/**
 * @function close
 * @returns {void}
 * @desc Close error window
 */
export const close = function () {
  system.hide(_this);
};

/**
 * @function openAnonymous
 * @returns {void}
 * @desc Open anonymous error window
 */
export const openAnonymous = function () {
  document.getElementById('anonymous-error').style.display = 'block';
};

/**
 * @function closeAnonymous
 * @returns {void}
 * @desc Close anonymous error window
 */
export const closeAnonymous = function () {
  document.getElementById('anonymous-error').style.display = 'none';
};

/**
 * @function closeAnonymous
 * @returns {void}
 * @desc Show popup for old brower
 */
export const openNavMessage = function (navInfo) {
  document.getElementById('fullbcg').style.display = 'block';
  NavMessage.style.display = 'block';
  if (navInfo.name && navInfo.version) {
    NavMessage.querySelector('#currentNav').inneText = `${navInfo.name} ${navInfo.version}`;
  }
};
