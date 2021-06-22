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
 * @name SoundSystem
 * @module
 */

import * as notificationSystem from '../../notificationsystem.js';
import * as music from './music.js';

let volumelvl;

export const setSoundLevel = function (_level) {
  const level = (_level) || 0.5; // 50 % default value
  if (volumelvl) { volumelvl.value = level; }
  window.myplayer.volume(level);
};

/**
 * @function init
 * @returns {void}
 * @desc Init events and variables to manage sound volume.
 *
 */
export const init = function () {
  music.init();
  volumelvl = document.getElementById('volume_level');
  if (volumelvl) {
    volumelvl.value = 0;
    const speakers = document.getElementById('speakers');
    if (speakers) {
      // old event was "input"
      volumelvl.addEventListener('input', function () {
        if (!window.myplayer) {
          const innerHTML = 'Your web browser does not handle all audio API to process real time sound streaming';
          if (notificationSystem) { notificationSystem.displayNotification('Real time audio API unsupported', innerHTML, 'info', null, null, 6000); }
          return;
        }
        if (this.value > 0 && window.myplayer.state() !== 'running') {
          if (window.myplayer && typeof window.myplayer.play === 'function') { window.myplayer.play(); } else {
            const innerHTML = 'Your web browser does not handle all audio API to process real time sound streaming';
            if (notificationSystem) { notificationSystem.displayNotification('Real time audio API unsupported', innerHTML, 'info', null, null, 3000); }
          }
        }

        if (this.value === 0) {
          window.myplayer.stop();
        }
        music.setVolume(this.value);

        window.myplayer.volume(this.value);
        const ocaudio = document.getElementById('oc_audio');
        if (ocaudio) {
          ocaudio.volume = this.value;
        }
      });
    }
  }
};
