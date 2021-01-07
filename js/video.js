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
/**
 * @name Video
 * @module
 */

const self = {};
let _this;
let video;

/**
 * @function init
 * @returns {void}
 * @desc Init basic event close.
 *
 */
export const init = function () {
  _this = document.getElementById('videoPlayer');
  video = _this.querySelector('video');
  if (_this && video) {
    _this.querySelector('.close').addEventListener('click', self.close);
  }
};

/**
 * @function read
 * @param {string} file URL to the video file
 * @returns {void}
 * @desc Open window and read video media.
 *
 */
export const read = function (file) {
  video.src = window.od.net.urlrewrite(file);
  open();
};

/**
 * @function open
 * @returns {void}
 * @desc Open window.
 *
 */
export const open = function () {
  system.show(_this);
  system.activeWindow(_this);
};

/**
 * @function close
 * @returns {void}
 * @desc Close window.
 *
 */
export const close = function () {
  system.hide(_this);
  video.src = '';
};
