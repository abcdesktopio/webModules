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

import * as httpProtocol from './httpProtocol/main.js';
import * as webrtcProtocol from './webrtcProtocol/main.js';

export const init = () => {
  document.addEventListener('broadway.connected', () => {
    if (webrtcProtocol.janusSupported()) {
      webrtcProtocol.init()
        .then(() => {
          const audio = document.getElementById('audioplayer');
          if (!audio.paused) {
            updateIconVolumLevel();
          }
        });
    } else {
      httpProtocol.init();
    }
  });
};

export const updateIconVolumLevel = () => {
  const volumeLevel = document.getElementById('volume_level');
  let srcImg = '';
  if (volumeLevel.value > 0.66) {
    srcImg = '../img/top/Volume_High.svg';
  } else if (volumeLevel.value > 0.33) {
    srcImg = '../img/top/Volume_Mid.svg';
  } else if (volumeLevel.value > 0) {
    srcImg = '../img/top/Volume_Low.svg';
  } else {
    srcImg = '../img/top/Volume_None.svg';
  }
  $('#speakers-logo').attr('src', srcImg);
};
