/* eslint-disable max-len */
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
 * @name WindowMessage
 * @module
 */

import * as system from './system.js';

let self;

/**
 * @function init
 * @returns {void}
 * @desc Init basic event.
 *
 */
export const init = function () {
  self = document.getElementById('windowMessage');
  const t = self.querySelector('#cancel');
  if (self && t) {
    t.addEventListener('click', refresh);
  }
};

/**
 * @function open
 * @param {string} title
 * @param {string} message
 * @param {string} type
 * @param {string} status
 * @param {callback} callback
 * @returns {void}
 * @desc Opens a window when you try to connect with a different provider than the previous time.
 * @example windowMessage.open("Orange Connect", "You have already created your workspace with " + Cookies.get('auth_provider') + " connect, if you change the connection, a new workspace will be created.", "yn", "oauth", LoginOrange.open)
 */
export const open = function (title, message, type, status, callback) {
  system.show(self);
  system.activeWindow(self);
  console.log(self.querySelector('#message'));
  self.querySelector('#title').innerText = title;
  self.querySelector('#message').innerText = message;
  if (callback) {
    self.querySelector('#reload').addEventListener('click', () => {
      close();
      callback();
    });
  } else {
    self.querySelector('#reload').addEventListener('click', refresh);
  }
  switch (status) {
    case 'facebook':
      self.querySelector('#new').src = 'img/welcome/facebook_icon.svg';
      self.querySelector('#old').src = `img/welcome/${window.Cookies.get('auth_provider')}_icon.svg`;
      break;
    case 'orange':
    case 'orangeconnect':
    case 'mobileorange':
      self.querySelector('#new').src = 'img/welcome/orange_icon.svg';
      self.querySelector('#old').src = `img/welcome/${window.Cookies.get('auth_provider')}_icon.svg`;
      break;
    case 'googgle':
      self.querySelector('#new').src = 'img/welcome/google_icon.svg';
      self.querySelector('#old').src = `img/welcome/${window.Cookies.get('auth_provider')}_icon.svg`;
      break;
    case 'github':
      self.querySelector('#new').src = 'img/welcome/github_icon.svg';
      self.querySelector('#old').src = `img/welcome/${window.Cookies.get('auth_provider')}_icon.svg`;
      break;
    default:
      break;
  }
  if (type === 'yn') {
    document.getElementById('reload').innerHTML = 'Continue';
    document.getElementById('reload').style.display = 'block';
    document.getElementById('cancel').style.display = 'block';
  } else {
    document.getElementById('reload').innerHTML = 'Reload';
    document.getElementById('reload').style.display = 'block';
    document.getElementById('cancel').style.display = 'none';
  }
};

/**
 * @function close
 * @returns {void}
 * @desc Close the window.
 *
 */
export const close = function () {
  system.hide(self);
};

/**
 * @function refresh
 * @returns {void}
 * @desc Reload your browser.
 *
 */
function refresh() {
  const strPort = (window.location.port) ? ':' + window.location.port : '';
  window.location.href = window.location.protocol + '//' + window.location.hostname + strPort; 
}
