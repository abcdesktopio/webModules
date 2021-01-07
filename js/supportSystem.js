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

const self = {};
let _this;
let title;
let popup;

export const init = function () {
  _this = document.getElementById('support');
  popup = document.getElementById('support-window');
  if (_this && popup) {
    _this.querySelector('.close').addEventListener('click', self.close);
    $('.block').on('click', function () {
      $('#home').hide();
      title = `${this.querySelector('h3').textContent} Support`;
      document.querySelector('#request h1').textContent = title;
      $('#request').show();
    });

    _this.querySelector('#back').addEventListener('click', () => {
      goHome();
    });

    _this.querySelector('form').addEventListener('submit', () => {
      const subject = _this.querySelector('#subject').value;
      const first = _this.querySelector('#first').value;
      const second = _this.querySelector('#second').value;
      const third = _this.querySelector('#third').value;
      sendMail(title, subject, first, second, third);
    });

    popup.querySelector('.cancel').addEventListener('click', () => {
      hidePopup();
    });
    popup.querySelector('.close').addEventListener('click', () => {
      hidePopup();
    });
    popup.querySelector('#confirm').addEventListener('click', () => {
      sendSupportMail();
    });
  }
};

export const open = function () {
  _this.style.display = 'block';
  system.activeWindow(_this);
};

export const close = function () {
  _this.style.display = 'none';
};

function clear() {
  _this.querySelector('#subject').value = '';
  _this.querySelector('#first').value = '';
  _this.querySelector('#second').value = '';
  _this.querySelector('#third').value = '';
}

function goHome() {
  _this.querySelector('#request').style.display = 'none';
  _this.querySelector('#home').style.display = 'block';
}

function sendMail(category, subject, arg1, arg2, arg3) {
  clear();
  goHome();
  // support();
  console.log(category, subject, arg1, arg2, arg3);
}
/*
function showPopup() {
    popup.style.display = 'block';
}
*/
function hidePopup() {
  popup.style.display = 'none';
}

function sendSupportMail() {
  /* if (currentUser.name !== "anonymous") {
        //support();
    } else {
        errorMessage.openAnonymous();
    } */
  hidePopup();
}
