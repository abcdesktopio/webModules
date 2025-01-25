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

import * as launcher from '../launcher.js';
import { broadcastEvent } from '../broadcastevent.js';
import * as notificationSystem from '../notificationsystem.js';

const scriptUrl="/js/microphone/recorderWorkletProcessor.js";

var microphone_websocket = null;
var mediaRecorder = null;
var audio_context = null;
var microphone_state = 'none'; 

export const getmicrophone_ws_url = () => {
  const path = `/microphone?jwt_token=${window.od.currentUser.authorization}`;
  const url = window.od.net.getwsurl(path);
  return url;
};

const handle_microphone_audioprocess = async (e) => {
  if (microphone_websocket && microphone_websocket.readyState === WebSocket.OPEN) { 
     // e.data is Float32Array (512 bytes)
     microphone_websocket.send( e.data );
  }
}

const microphone_websocket_onclose = async (e) => {
   microphone_state = 'none';
   updateIconMicrophone(microphone_state);
}

const microphone_websocket_onerror = async (e) => {
   microphone_state = 'none';
   updateIconMicrophone(microphone_state);
}

const initMicrophone = async () => {
  if (navigator.mediaDevices) {
  	console.log("getUserMedia supported.");
  	const constraints = { audio: true, video: false };
  	const chunks = [];

  	navigator.mediaDevices
    		.getUserMedia(constraints)
    		.then((stream) => {

                    audio_context = new window.AudioContext();
                    const mediastream_source = audio_context.createMediaStreamSource( stream );
	            const microphone_ws_url = getmicrophone_ws_url();
                    microphone_websocket = new WebSocket( microphone_ws_url );
		    microphone_websocket.onclose = microphone_websocket_onclose();
		    microphone_websocket.onclose = microphone_websocket_onerror();

		    microphone_websocket.onopen = (event) => {
  		      // load audio processor
		      // scriptUrl="/js/microphone/recorderWorkletProcessor.js" 
    		      audio_context.audioWorklet.addModule( scriptUrl ).then( () => {
    		    	// Create node AudioWorkletNode
    		    	const recorderNode = new AudioWorkletNode(audio_context, "recorder-worklet");
			// listen message from processor
                    	recorderNode.port.onmessage = handle_microphone_audioprocess;
			// connect recorderNode and audio_context.destination
                    	mediastream_source.connect(recorderNode).connect(audio_context.destination);
			// it's fine can enable microphone icon
			microphone_state = 'recording';
			updateIconMicrophone(microphone_state);
                    	console.log("Streaming microphone audio...");
		      });
		   };
    		})
    		.catch((error) => {
     			console.log(error);
    		});
  }
}

const configureMicrophone = async () => {
  // console.log( 'configureSpeaker call' );
  // The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.
  //
  launcher.isPulseAvailable().then( 
	  (res) => {
              if (res.status === 200) {
                initMicrophone();
	      }
          } 
  ); 
};

const unconfigureMicrophone = async () => {
  console.log( 'unconfigureMicrophone call' );
  if (microphone_websocket && microphone_websocket.readyState === WebSocket.OPEN) {
	  microphone_websocket.close();
  }
  microphone_websocket = null;
  
  if (audio_context) {
	  audio_context.close();
	  audio_context = null;
  }
  microphone_state = 'none';
  updateIconMicrophone(microphone_state);
}

export async function microphoneavailableConnect() {
  let microphone=document.getElementById('microphone');
  if (microphone) {
    launcher.isPulseAvailable().then(
          (res) => {
              if (res.status === 200) {
                microphone.style.display = 'block';
              }
          }
    );
  }       
}


export async function init() {
  document.addEventListener('broadway.connected', microphoneavailableConnect);
  // document.addEventListener('broadway.disconnected', unconfigureMicrophone);
};

export async function updateState() {
  if (microphone_state === 'none')
        configureMicrophone();
  if (microphone_state === 'recording')
        unconfigureMicrophone();	
}

function displayNotificationNoMicrophone(notification_desc)
{
  // In this case the user did not make any interaction.
  // Thus we print a notification.
  const title = 'Sound disabled';
  const desc = (notification_desc) ? notification_desc : 'Microphone is not listenning';
  const type = '';
  const img = '../img/top/mic.svg';
  const url = '';
  const duration = 5000;
  notificationSystem.displayNotification(title, desc, type, img, url, duration);
}


/*
export const updateIconVolumeLevel = () => {
  const volumeLevel = document.getElementById('volume_level');
  if (volumeLevel) {
    const value = Number(volumeLevel.value);
    let srcImg = '';
    // find a icon using the volumeLevel.value 
    if (value > 0.66) {
      srcImg = '../img/top/Volume_High.svg';
    } else if (value > 0.33) {
      srcImg = '../img/top/Volume_Mid.svg';
    } else if (value > 0) {
      srcImg = '../img/top/Volume_Low.svg';
    } else {
      srcImg = '../img/top/Volume_None.svg';
    }
    // change the icon 
    $('#speakers-logo').attr('src', srcImg);
  }
};

function displayNotificationNoSound(notification_desc)
{
  // In this case the user did not make any interaction.
  // Thus we print a notification.
  const title = 'Sound disabled';
  const desc = (notification_desc) ? notification_desc : 'Please use secure https to enable sound';
  const type = '';
  const img = '../img/top/Volume_None.svg';
  const url = '';
  const duration = 5000;
  notificationSystem.displayNotification(title, desc, type, img, url, duration);
}


function displayNotificationWebRTCError( msg )
{
  // In this case the user did not make any interaction.
  // Thus we print a notification ti display error message.
  const title = 'WebRTC error';
  const desc = msg;
  const type = '';
  const img = '../img/top/Volume_None.svg';
  const url = '';
  const duration = 5000;
  notificationSystem.displayNotification(title, desc, type, img, url, duration);
}
*/


broadcastEvent.addEventListener('speaker.available', async ({ detail: { available } }) => {
  console.log( 'speaker.available pulseaudio microphone', available );
  if (available) {
     microphoneavailableConnect();
  }
});


export const updateIconMicrophone = ( state ) => {
  let srcImg = '../img/top/mic.svg';
  if ( state === 'recording') 
    srcImg = '../img/top/mic_recording.svg'; 
  // change the icon
  $('#microphone-logo').attr('src', srcImg);
};

