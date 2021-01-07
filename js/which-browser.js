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

/**
 * @function IeVersion
 * @global
 * @returns {object} IE informations
 * @desc Return IE Version.
 */
function IeVersion() {
  // Set defaults
  const value = {
    IsIE: false,
    IsEdge: false,
    EdgeHtmlVersion: 0,
    TrueVersion: 0,
    ActingVersion: 0,
    CompatibilityMode: false,
  };

  // Try to find the Trident version number
  const trident = navigator.userAgent.match(/Trident\/(\d+)/);
  if (trident) {
    value.IsIE = true;
    // Convert from the Trident version number to the IE version number
    value.TrueVersion = parseInt(trident[1], 10) + 4;
  }

  // Try to find the MSIE number
  const msie = navigator.userAgent.match(/MSIE (\d+)/);
  if (msie) {
    value.IsIE = true;
    // Find the IE version number from the user agent string
    value.ActingVersion = parseInt(msie[1]);
  } else {
    // Must be IE 11 in "edge" mode
    value.ActingVersion = value.TrueVersion;
  }

  // If we have both a Trident and MSIE version number, see if they're different
  if (value.IsIE && value.TrueVersion > 0 && value.ActingVersion > 0) {
    // In compatibility mode if the trident number doesn't match up with the MSIE number
    value.CompatibilityMode = value.TrueVersion != value.ActingVersion;
  }

  // Try to find Edge and the EdgeHTML vesion number
  const edge = navigator.userAgent.match(/Edge\/(\d+\.\d+)$/);
  if (edge) {
    value.IsEdge = true;
    value.EdgeHtmlVersion = edge[1];
  }
  return value;
}
/**
 * @function IeVersion
 * @global
 * @returns {void}
 * @desc If IE version is compatible load missing script else show error message.
 */
export const IECheck = function () {
  const IEinfo = IeVersion();
  if (IEinfo.IsIE && IEinfo.ActingVersion < 11) {
    document.getElementById('fullbcg').style.display = 'block';
    document.getElementById('IEMessage').style.display = 'block';
    document.getElementById('IEMessage').querySelector('#version').innerHTML = IEinfo.ActingVersion;
    return true;
  }
  if (IEinfo.IsIE) {
    // Add missing function to IE
    setupMissingFunctionForInternetExplorer();
  }
  return false;
};

/**
 * @function setupMissingFunctionForInternetExplorer
 * @global
 * @returns {void}
 * @desc Polyfill required methods that are missing on IE (string.include , document.querySelectorAll , document.querySelector).
 */
function setupMissingFunctionForInternetExplorer() {
  if (!String.prototype.includes) {
    String.prototype.includes = function () {
      return String.prototype.indexOf.apply(this, arguments) !== -1;
    };
  }

  if (!window.Console.prototype.info) {
    window.Console.prototype.info = function (string) {
      console.log(string);
    };
  }

  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^\s+|\s+$/g, '');
    };
  }

  if (!document.querySelectorAll) {
    document.querySelectorAll = function (selectors) {
      const style = document.createElement('style');
      const elements = [];
      let element;
      document.documentElement.firstChild.appendChild(style);
      document._qsa = [];

      style.styleSheet.cssText = `${selectors}{x-qsa:expression(document._qsa && document._qsa.push(this))}`;
      window.scrollBy(0, 0);
      style.parentNode.removeChild(style);

      while (document._qsa.length) {
        element = document._qsa.shift();
        element.style.removeAttribute('x-qsa');
        elements.push(element);
      }
      document._qsa = null;
      return elements;
    };
  }

  if (!document.querySelector) {
    document.querySelector = function (selectors) {
      const elements = document.querySelectorAll(selectors);
      return (elements.length) ? elements[0] : null;
    };
  }
}
