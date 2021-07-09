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

const state = {
  soundIsEnabled: false,
  pulseAudioIsAvailable: false,
  pulseAudioIsConfigured: false,
};

const configureSpeaker = async () => {
  if (!state.soundIsEnabled) {
    if (webrtcProtocol.janusSupported() && await webrtcProtocol.enabled()) {
      try {
        const {
          result: {
            id,
            host,
            hostip,
            audioport,
            pin,
          },
        } = await launcher.getStream();

        webrtcProtocol.configuration.received = true;
        webrtcProtocol.configuration.id = id;
        webrtcProtocol.configuration.host = host;
        webrtcProtocol.configuration.audioport = audioport;
        webrtcProtocol.configuration.pin = pin;

        const {
          data: {
            pulseAudioIsConfigured,
            pulseAudioIsAvailable,
          }
        } = await launcher.configurePulse(hostip, audioport);

        if (pulseAudioIsAvailable) {
          state.pulseAudioIsAvailable = pulseAudioIsAvailable;
        }

        if (pulseAudioIsConfigured) {
          state.pulseAudioIsConfigured = pulseAudioIsConfigured;
          console.log('Pulseaudio has already been configured in webRTC mode');
        }

        if (pulseAudioIsAvailable && pulseAudioIsConfigured) {
          if (!webrtcProtocol.state.connected &&
            !webrtcProtocol.state.connecting
          ) {
            await webrtcProtocol.connectToGateway();
            setLevelSound();
          }
        }
      } catch(e) {
        console.error(e);
        await httpProtocol.init();
        window.od.currentUser.speakerMode = 'ULAW';
      }
    } else {
      await httpProtocol.init();
      window.od.currentUser.speakerMode = 'ULAW';
    }
    state.soundIsEnabled = true;
  }
};

export const init = () => {
  document.addEventListener('broadway.connected', configureSpeaker);
};

export const updateIconVolumLevel = () => {
  const volumeLevel = document.getElementById('volume_level');
  const value = Number(volumeLevel.value);
  let srcImg = '';

  if (value > 0.66) {
    srcImg = '../img/top/Volume_High.svg';
  } else if (value > 0.33) {
    srcImg = '../img/top/Volume_Mid.svg';
  } else if (value > 0) {
    srcImg = '../img/top/Volume_Low.svg';
  } else {
    srcImg = '../img/top/Volume_None.svg';
  }

  $('#speakers-logo').attr('src', srcImg);
};

const setLevelSound = () => {
  const audio = document.getElementById('audioplayer');
  if (!audio.paused) {
    updateIconVolumLevel();
  }
}

broadcastEvent.addEventListener('speaker.available', async ({ detail: { available } }) => {
  if (available) {
    state.pulseAudioIsAvailable = true;
    $('#speakers').css('display', 'block');
    if (
      webrtcProtocol.configuration.received &&
      !webrtcProtocol.state.connected &&
      !webrtcProtocol.state.connecting
      ) {
      try {
        await webrtcProtocol.connectToGateway();
        setLevelSound();
      } catch(e) {
        console.error(e);
      }
    }
  } else {
    state.pulseAudioIsAvailable = false;
    if (webrtcProtocol.state.connected) {
      webrtcProtocol.destroySession();
    }
    $('#speakers').css('display', 'none');
  }
});
