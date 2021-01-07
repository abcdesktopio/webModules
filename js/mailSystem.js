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

import * as script from './scripts.js';
import * as launcher from './launcher.js';
import * as system from './system.js';

let _this;
let iframe;
let fullscreen = false;
let _style;

/**
 * @function init
 * @return {void}
 */
export const init = function () {
  _this = document.getElementById('mailFrame');
  if (_this) {
    launcher.getkeyinfo('zimbra').done((msg) => {
      if (msg.id) {
        document.getElementById('topMail').addEventListener('click', open);
        system.show(document.getElementById('topMail'));
      }
    });
    iframe = _this.querySelector('iframe');
    iframe.src = '';
    _this.querySelector('.close').addEventListener('click', close);
    _this.querySelector('.control').addEventListener('dblclick', resize);
    $('#mailFrame').resizable({
      containment: 'document',
    });
    _style = _this.style;
    resize();
  }
};

/**
 * @function open
 * @return {void}
 */
export const open = function () {
  launcher.getzimbraurl().done((myrequest) => {
    if (myrequest && myrequest.status == 200) {
      iframe.src = myrequest.result.url;
      system.activeWindow(_this);
      script.closeTopRightDropDowns();
      _this.style.display = 'block';
    }
  });
};

/**
 * @function close
 * @return {void}
 */
export const close = function () {
  _this.style.display = 'none';
};

export const resize = function () {
  if (fullscreen) {
    _this.style = _style;
    _this.style.display = 'block';
    fullscreen = false;
  } else {
    _this.style.width = '100%';
    _this.style.height = 'calc(100% - 85px)';
    _this.style.top = '0px';
    _this.style.left = '0px';
    fullscreen = true;
  }
};
