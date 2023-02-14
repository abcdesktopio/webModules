/* eslint-disable no-use-before-define */
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
 * @name logs
 * @module
 */
import * as printSystem from './printSystem.js';
import * as system from './system.js';
import { broadcastEvent } from './broadcastevent.js';

let self;
let enable = false;
let settingsConfigProvided = false;

/**
 * @function init
 * @return {void}
 * @desc Get files in printer-queue
 */
export const init = function () {
  self = document.getElementById('printer');
};

broadcastEvent.addEventListener('printer.available', ({ detail: { available } }) => {
  console.log( `printer.available=${available}` );
  enable = available;
  const printer = document.querySelector('#printer');
  const printerIcon = document.querySelector('#printer img');
  if (!printer) return;
  if (!printerIcon) return;
  if (available) {
    printer.style.display = 'block';
    printerIcon.src = '../img/top/printer.svg';
  } else {
    printerIcon.src = '../img/top/printer_None.svg';
  }
});

export const handlerSettingsConfig = (config) => {
  if (config.enabledTabsHeaders.includes('printers')) {
    enable = true;
    settingsConfigProvided = true;
    const printer = document.querySelector('#printer');
    if (printer)
       printer.style.display = 'block';
    const printerIcon = document.querySelector('#printer img');
    if (printerIcon) {
      printerIcon.src = '../img/top/printer.svg';
    }
  }
};
