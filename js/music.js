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
 * @name Music
 * @module
 */

let _this;
let playpause;
let progress;
let icon;

/**
 * @function init
 * @returns {void}
 * @desc Init player events.
 *
 */
export const init = function () {
  _this = document.getElementById('audioplayer');
  if (_this) {
    playpause = document.getElementById('playpause');
    progress = document.getElementById('progressBar');
    icon = document.querySelector('#music img');
    playpause.addEventListener('click', togglePlay);

    // Update progress bar everysecond
    _this.addEventListener('timeupdate', updateProgress, false);

    // Apply media information to the player
    _this.addEventListener('loadedmetadata', () => {
      console.log(`Playing ${_this.src}, for: ${_this.duration}seconds.`);
      progress.max = _this.duration;
      let name = _this.src.split('/');
      name = name[name.length - 1];
      name = decodeURI(name);
      document.getElementById('audioName').innerText = name;
      togglePlay();
      document.getElementById('music').style.display = 'block';
    });

    // When the media ended
    _this.addEventListener('ended', () => {
      playpause.title = 'play';
      playpause.className = 'play';
      icon.src = window.od.net.urlrewrite('../img/top/music.svg');
      progress.value = 0;
    });

    // Go back or forward with progress bar
    progress.addEventListener('input', function () {
      _this.currentTime = this.value;
    });
  }
};

/**
 * @function read
 * @param {string} music music url
 * @returns {void}
 * @desc Init player events.
 */
export const read = function (music) {
  _this.src = window.od.net.urlrewrite(music);
  _this.style.display = 'block';
};

/**
 * @function togglePlay
 * @returns {void}
 * @desc Play / pause the player.
 *
 */
function togglePlay() {
  if (_this.paused || _this.ended) {
    playpause.title = 'pause';
    playpause.className = 'pause';
    icon.src = window.od.net.urlrewrite('../img/top/music_on.svg');
    _this.play();
  } else {
    playpause.title = 'play';
    playpause.className = 'play';
    icon.src = window.od.net.urlrewrite('../img/top/music.svg');
    _this.pause();
  }
}

/**
 * @function updateProgress
 * @returns {void}
 * @desc Update the progress bar.
 *
 */
function updateProgress() {
  progress.value = _this.currentTime;
}

/**
 * @function setVolume
 * @param {integer} vol from 0 to 1
 * @returns {void}
 * @desc Set player's volume scale from 0 to 1.
 * @example music.setVolume(0.3); // will set volume to 30%.
 */
export const setVolume = function (vol) {
  _this.volume = vol;
};
