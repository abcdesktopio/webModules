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
import * as launcher from '../launcher.js';
import { broadcastEvent } from '../broadcastevent.js';

const webrtcEnabled = async () => {
  const { id } = await launcher.getkeyinfo('webrtc');
  return id;
};

const configuerSpeaker = async () => {
  if (webrtcProtocol.janusSupported() && await webrtcEnabled()) {
    await webrtcProtocol.init();
    const audio = document.getElementById('audioplayer');
    if (!audio.paused) {
      updateIconVolumLevel();
    }
  } else {
    await httpProtocol.init();
  }
};

export const init = () => {
  document.addEventListener('broadway.connected', configuerSpeaker);
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

broadcastEvent.addEventListener('speaker.available', async ({ detail: { available } }) => {
  if (available) {
    $('#speakers').css('display', 'block');
    await configuerSpeaker();
  } else {
    $('#speakers').css('display', 'none');
  }
});
