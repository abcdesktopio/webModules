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
 * @name ConnectLoader
 * @module
 */

import welcomeSystem from './welcomesystem.js';
import * as ocuaparser from './ocuaparser.js';
import * as system from './system.js';
import { getTranslate } from './languages.js';

let circle;
export var statusText;

/**
 * @function init
 * @returns {void}
 * @desc Init HTML element circle.
 */
export const init = function () {
  circle = document.getElementById('c100');
  statusText = document.getElementById('statusText');
  document.querySelector('#connectloader').addEventListener('click', () => {
    window.od.broadway.connect();
  });
  document.addEventListener('broadway.connected', 	broadwayconnected);
  document.addEventListener('broadway.disconnected', 	broadwaydisconnected);
};

/**
 * @function broadwayconnected
 * @param  {event} myevent
 * @return {void}
 * @desc Callback for broadwayconnected event
 */
const broadwayconnected = function () {
  editStatus('Normal');
};

/**
 * @function broadwaydisconnected
 * @param  {event} myevent
 * @return {void}
 * @desc Callback for broadwaydisconnected event
 */
const broadwaydisconnected = function () {
  editStatus('Disconnected');
};

/**
 * @function editStatus
 * @param {object} status
 * @returns {void}
 * @desc Update loader information from status.
 *
 */
export const editStatus = function (status) {
  try {
    const mystatus = status.charAt(0).toUpperCase() + status.slice(1);
    status = mystatus;
  } catch (e) {
    console.error(e);
  }

  welcomeSystem.showStatus(status);

  if (status === 'Connection') {
    welcomeSystem.close();
    if (ocuaparser.isSoundSupported()) { document.querySelector('#connectSound').play(); }
  }

  if (status === 'Normal') {
    document.querySelector('#connectloader').style.display = 'none';
    welcomeSystem.close();
    if (ocuaparser.isSoundSupported()) {
      const connectSound = document.querySelector('#connectSound');
      if (connectSound && (typeof connectSound.play === 'function')) {
        try {
          const playPromise = connectSound.play();
          // In browsers that don’t yet support this functionality,
          // playPromise won’t be defined.
          if (playPromise !== undefined) {
            playPromise.then(() => {
              // Automatic playback started!
            }).catch((error) => {
              console.error(error);
              // Automatic playback failed.
              // Show a UI element to let the user manually start playback.
            });
          }
        } catch (err) {
          console.log(err);
        }
      }
    }
  }

  if (status === 'Disconnected') {
    /*
      document.querySelector('#reconnect').style.display = 'block';
      document.querySelector('#connectloader').style.display = 'block';
      document.querySelector('#waiting').style.display = 'none';
      circle.querySelector('#percent').style.display = 'none';
      circle.querySelector('span').style.display = 'none';
      */

    const overScreenMessage = document.getElementById('overScreenMessageData');
    if (overScreenMessage) { overScreenMessage.textContent = getTranslate('over-screen-message-data'); }
    const overScreen = document.getElementById('overScreen');
    if (overScreen) { system.show(overScreen); }
  }

  if (status === 'Disconnect') {
  }

  if (status === 'Failed') {
    console.error(status);
  }
};

/**
 * @function close
 * @returns {void}
 * @desc Close connect loader
 *
 */
export const close = function () {
  welcomeSystem.showMessage('');
};

export const hide = function () {
  document.querySelector('#reconnect').style.display = 'none';
  document.querySelector('#connectloader').style.display = 'none';
  document.querySelector('#waiting').style.display = 'none';
  circle.querySelector('#percent').style.display = 'none';
  circle.querySelector('span').style.display = 'none';
};

export const showError = function (error) {
  welcomeSystem.showError(error);
};

/**
 * @function connect
 * @returns {void}
 * @desc Start connection
 *
 */
export const connect = function () {
  editStatus('Authentication');
};
