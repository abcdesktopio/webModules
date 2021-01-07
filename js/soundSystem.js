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

import * as music from './music.js';
import * as notificationSystem from './notificationsystem.js';

let volumelvl;
let icon;

export const setSoundLevel = function (_level) {
  const level = (_level) || 0.5; // 50 % default value
  if (volumelvl) { volumelvl.value = level; }
  if (icon) { icon.src = getIcon(level); }
  window.myplayer.volume(level);
};

export const getIcon = function (level) {
  let src;
  if (level <= 0.3) {
    src = window.od.net.urlrewrite('../img/top/Volume_Low.svg');
  } else if (volumelvl.value <= 0.7) src = window.od.net.urlrewrite('../img/top/Volume_Mid.svg');
  else src = window.od.net.urlrewrite('../img/top/Volume_High.svg');
  if (level == 0) { src = window.od.net.urlrewrite('../img/top/Volume_None.svg'); }
  return src;
};

/**
 * @function init
 * @returns {void}
 * @desc Init events and variables to manage sound volume.
 *
 */
export const init = function () {
  volumelvl = document.getElementById('volume_level');
  if (volumelvl) {
    volumelvl.value = 0;
    const speakers = document.getElementById('speakers');
    if (speakers) {
      icon = speakers.querySelector('img');
      if (icon) {
        // old event was "input"
        volumelvl.addEventListener('input', async function () {
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
          icon.src = getIcon(this.value);
          if (this.value == 0) {
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
  }
};
