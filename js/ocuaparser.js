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
 * @name ocuaparser
 * @module
 */

let parser = null;

/**
 * @function init
 * @returns {void}
 * @desc Create object UAParser for reading User Agent.
 * @see {@link https://github.com/faisalman/ua-parser-js| UAParser GitHub}
 */
export const init = function () {
  parser = new window.UAParser();
  window.od.isTactile = isTouch();
};

/**
 * @function isTouch
 * @returns {boolean}
 * @desc Check if terminal have touchscreen or not.
 */
export const isTouch = function () {
  let bReturn = false;
  if (parser) {
    const device = parser.getDevice();
    if (device.type === 'mobile' || device.type === 'tablet') { bReturn = true; }
  }
  return bReturn;
};

/**
 * @function isAbcDesktopAndroidApplication
 * @returns {boolean}
 * @desc Check if user is running AbcDesktop on Android application.
 */
export const isAbcDesktopAndroidApplication = function () {
  let bReturn = false;
  const ua = parser.getUA();
  // Check if UserAgent contains AbcDesktop
  // User Agent set by the Webview Android
  const n = ua.indexOf('Orange_Composer_Webview');
  bReturn = n !== -1;
  return bReturn;
};

/**
 * @function getBrowser
 * @returns {object}
 * @desc Return user's browser informations.
 */
export const getBrowser = function () {
  const navInfo = parser.getBrowser();
  return navInfo;
};

/**
 * @function isSoundSupported
 * @returns boolean
 * @desc Return true if sound is supported.
 */
export const isSoundSupported = function () {
  let bReturn = false;
  try {
    if (parser) {
      const os = parser.getOS();
      // Only Windows, Linux and Mac OS
      // No mobile devices
      if (os.name === 'Windows' || os.name === 'Linux' || os.name === 'Mac OS') {
        const browser = parser.getBrowser();
        // Running Chrome, Edge or Firefox
        // Safari does NOT support sound without user events
        if (browser.name === 'Chrome' || browser.name === 'Edge' || browser.name === 'Firefox') { bReturn = true; }
      }
    }
  } catch (e) {
    // Nothing to do
    console.error(e);
  }
  return bReturn;
};

/**
 * @function getOS
 * @returns {object}
 * @desc Return user's OS informations.
 */
export const getOS = function () {
  return parser.getOS();
};
