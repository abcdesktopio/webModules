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
 * @name tipsinfo
 * @module
 */

import * as launcher from './launcher.js';
import * as languages from './languages.js';

export const snapshotinfoEvents = new EventTarget();

/**
 * @function init
 * @returns {void}
 * @desc Add an event listener for closing the window.
 */
export const init = function() {
}

/**
 * @function open
 * @returns {void}
 * @desc Add an event listener for closing the window.
 */
export const list = function () {
};


/**
 * @function open
 * @returns {void}
 * @desc Add an event listener for closing the window.
 */
export const version = function () {
  console.log( 'snapshot.version()' );
  launcher.requestSnapshotAPI( 'version', null, 'GET')
        .then((res) => {
		console.log( res );
        });
};


/**
 * @function open
 * @returns {void}
 * @desc Add an event listener for closing the window.
 */
export const snapshot = function () {
  console.log( 'snapshot.snapshot()' );
  let snap = launcher.requestSnapshotAPI('snapshot')
	 .then((res) => {
                if (res) {
                        console.log( res );
                }
        });
};


