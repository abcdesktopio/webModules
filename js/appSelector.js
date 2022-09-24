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

import * as system from './system.js';
import { broadcastEvent } from './broadcastevent.js';

/**
 * @name Appstore
 * @module
 */
let self;
export const enabled = false;

/**
 * @function init
 * @returns {void}
 * @desc Add events listener on category buttons and provide application from our application list.
 */
export const init = function () { };

/**
 * @function open
 * @returns {void}
 * @desc Open the window
 */
export const open = function () {
  system.show(self);
};

/**
 * @function close
 * @returns {void}
 * @desc Close the window.
 */
export const close = function () {
  system.hide(self);
  const noVNCCanvas = document.getElementById('noVNC_canvas');
  if (noVNCCanvas) { 
    noVNCCanvas.focus(); 
  }
};

export const updateWindowList = function (windowList) {
  console.log("windowList.length = " + windowList.length);
  if (windowList.length === 0) { 
      open(); 
    } else { 
      close(); 
    }
};

broadcastEvent.addEventListener('window.list', ({ detail: { windowList } }) => {
  if (enabled) {
    updateWindowList(windowList);
  }
});
