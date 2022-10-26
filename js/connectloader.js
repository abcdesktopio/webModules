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


/**
 * @function init
 * @returns {void}
 * @desc Init HTML element circle.
 */
export const init = function () {
  document.addEventListener('broadway.connected', 	broadwayconnected);
  document.addEventListener('broadway.disconnected',broadwaydisconnected);
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
  console.log('connect loader status: ' + status );
  welcomeSystem.showStatus(status);

  if (status === 'Connection') {
    welcomeSystem.close();
  }

  if (status === 'Normal') {
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
    const overScreenMessage = document.getElementById('overScreenMessageData');
    if (overScreenMessage) { 
      overScreenMessage.textContent = getTranslate('over-screen-message-data'); 
    }
    const overScreenMessageDataPlease = document.getElementById('overScreenMessageDataPlease');
    if (overScreenMessageDataPlease) { 
      overScreenMessageDataPlease.textContent = getTranslate('over-screen-message-data-please'); 
    }
    const overScreenMessageDataReload = document.getElementById('overScreenMessageDataReload');
    if (overScreenMessageDataReload) { 
      overScreenMessageDataReload.textContent = getTranslate('over-screen-message-data-reload'); 
    }
    const overScreenMessageDatathisPage = document.getElementById('overScreenMessageDatathisPage');
    if (overScreenMessageDatathisPage) { 
      overScreenMessageDatathisPage.textContent = getTranslate('over-screen-message-data-this-page'); 
    }
    const overScreen = document.getElementById('overScreen');
    if (overScreen) { 
      system.show(overScreen); 
    }
  }

  if (status === 'Disconnect') {
  }

  if (status === 'Failed') {
    console.error(status);
  }
};