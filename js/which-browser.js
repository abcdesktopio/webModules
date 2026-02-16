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
 * @name whichBrowser
 * @module
 */

import * as ocuaparser from './ocuaparser.js';

let OSName = 'Unknown';
let BrowserName = 'Unknown';
let OS;
let browser;

export const init = function () {
  const ua = navigator.userAgent.toLowerCase();
  OS = ocuaparser.getOS();
  browser = ocuaparser.getBrowser();
  window.isAndroid = (!!ua.match('android'));
  window.isIOS = (!!ua.match(/(ipad|iphone|ipod)/g));
  window.isWindows = (!!ua.match('windows'));
  window.isLinux = (ua.match('android') ? false : (!!ua.match('linux')));
  window.isBSD = (!!ua.match('bsd'));
  window.isMacOSX = (!!ua.match('mac osx'));

  window.isInternetExplorer = (!!ua.match('msie'));
  window.isSafari = (ua.match(/(chromium|chrome|crios)/g) ? false : (!!ua.match('safari')));
  window.isOpera = (!!ua.match('opera'));
  window.isChrome = (!!ua.match(/(chromium|chrome|crios)/g));
  window.isFirefox = (ua.match('like gecko') ? false : (!!ua.match(/(gecko|fennec|firefox)/g)));

  const webkitVer = parseInt((/WebKit\/([0-9]+)/.exec(navigator.appVersion) || 0)[1], 10) || void 0; // also match AppleWebKit
  window.isNativeChrome = window.isAndroid && webkitVer <= 537 && navigator.vendor.toLowerCase().indexOf('google') == 0;

  if (window.isInternetExplorer) { BrowserName = 'IE'; } else if (window.isSafari) { BrowserName = 'Safari'; } else if (window.isOpera) { BrowserName = 'Opera'; } else if (window.isChrome) { BrowserName = 'Chrome'; } else if (window.isFirefox) { BrowserName = 'Firefox'; } else if (window.isNativeChrome) { BrowserName = 'NativeChrome'; } else { BrowserName = 'Unknown'; }

  if (window.isAndroid) { OSName = 'Android'; } else if (window.isIOS) { OSName = 'iOS'; } else if (window.isWindows) { OSName = 'Windows'; } else if (window.isLinux) { OSName = 'Linux'; } else if (window.isBSD) { OSName = 'BSD'; } else if (window.isMacOSX) { OSName = 'MacOSX'; } else { OSName = 'Unknown'; }
};

export const getOS = function () {
  return OSName;
};

export const getBrowser = function () {
  return BrowserName;
};

export const getBrowserInfo = function () {
  return browser;
};

export const getOSInfo = function () {
  return OS;
};
