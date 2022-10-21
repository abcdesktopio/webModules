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
import * as notificationSystem from '../notificationsystem.js';

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
	    media,
	    token,
          },
        } = await launcher.getStream();
	/*
 	{	"status": 200, 
  		"result": {
  			"id": 5, 
  			"name": "mp-5", 
  			"description": "alex-b90f6896-de78-4ca1-937c-f6780e55c79c", 
  			"pin": "Q8DLpnH6T5", 
  			"enabled": true, 
  			"viewers": 0, 
  			"type": "live", 
 			"media": [{"mindex": 0, "type": "audio", "mid": "a", "label": "audio", "pt": 8, "rtpmap": "PCMA/8000", "port": 5105, "age_ms": 5}], 
  			"host": "janus.domain.local", 
  			"hostip": "1.2.3.4"
		}, 
  		"message": "ok" }
	*/
	let useAudioPort = audioport;
	// janus change format in release 1.0
	if (!audioport && Array.isArray(media)) {
		useAudioPort=media[0].port;
	}
        webrtcProtocol.configuration.received = true;
        webrtcProtocol.configuration.id = id;
        webrtcProtocol.configuration.host = host;
        webrtcProtocol.configuration.audioport = useAudioPort;
        webrtcProtocol.configuration.pin = pin;
	webrtcProtocol.configuration.token = token;
        const {
          data: {
            pulseAudioIsConfigured,
            pulseAudioIsAvailable,
          }
        } = await launcher.configurePulse(hostip, useAudioPort);

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
            $('#speakers').css('display', 'block');
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
};

export const letsPlaySound = () => {
    const audio = document.getElementById('audioplayer');
    if (audio.available) {
        audio.play();
    }
};

export const enableSoundIcon = (level) => {
    const audio = document.getElementById('audioplayer');
    if (audio) {
        const volumeLevel = document.getElementById('volume_level');
        volumeLevel.value = (Number.isInteger(level)) ? level : 1;
        setLevelSound();
        $('#speakers').css('display', 'block');
        updateIconVolumLevel();
    }
};
 

export const displayNotificationNoSound = () => {
    // In this case the user did not make any interaction.
    // Thus we print a notification for asking the user to activate the song.
    const title = 'Sound disabled';
    const desc = 'Please click on icon to hear sound';
    const type = '';
    const img = '../img/top/Volume_None.svg';
    const url = '';
    const duration = 5000;
    notificationSystem.displayNotification(title, desc, type, img, url, duration);
}


document.addEventListener('speaker.webrtcState', async ({ detail: { available } }) => {
    const audio = document.getElementById('audioplayer');
    audio.available = available;
    if (available) {
	const audio = document.getElementById('audioplayer');
	var promise = audio.play();

	if (promise !== undefined) {
  		promise.then(_ => {
    		// Autoplay started!
			  enableSoundIcon();
  		}).catch(error => {
			  enableSoundIcon( 0 );
			  displayNotificationNoSound();
    		// Autoplay was prevented.
    		// Show a "Play" button so that user can start playback.
  		});
	  }
  }
});


broadcastEvent.addEventListener('speaker.available', async ({ detail: { available } }) => {
  if (available) {
    state.pulseAudioIsAvailable = true;
    if (
      webrtcProtocol.configuration.received &&
      !webrtcProtocol.state.connected &&
      !webrtcProtocol.state.connecting
      ) {
      try {
        await webrtcProtocol.connectToGateway();
        setLevelSound();
        $('#speakers').css('display', 'block');
      } catch(e) {
        console.error(e);
      }
    }
  } else {
    $('#speakers').css('display', 'none');
    state.pulseAudioIsAvailable = false;
    if (webrtcProtocol.state.connected) {
      webrtcProtocol.destroySession();
    }
  }
});
