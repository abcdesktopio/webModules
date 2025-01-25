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

/*
 * Javascript app for negotiating and streaming a sendrecv webrtc stream
 * with a GStreamer app. Runs only in passive mode, i.e., responds to offers
 * with answers, exchanges ICE candidates, and streams.
 */


/*
 * Origin source code 
 * https://github.com/centricular/gstwebrtc-demos/blob/master/sendrecv/js/webrtc.js
 *
 */

import * as launcher from '../launcher.js';
import { broadcastEvent } from '../broadcastevent.js';
import * as notificationSystem from '../notificationsystem.js';
import JSMpeg from '../jsmpeg-player.esm.js';

var jsmpeg = null;

export const getsound_ws_url = () => {
  const path = `/sound?jwt_token=${window.od.currentUser.authorization}`;
  const url = window.od.net.getwsurl(path);
  return url;  
}

const configureSpeaker = async () => {
  // console.log( 'configureSpeaker call' );
  // The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.
  //
  // launcher.isPulseAvailable().then( speakeravailableConnect ); 
}

const unconfigureSpeaker = async () => {
  console.log( 'unconfigureSpeaker call' );
  if (jsmpeg) {	
  	console.log( 'JSMpeg.Player destroying' );
  	jsmpeg.destroy();
        jsmpeg = null;
        console.log( 'JSMpeg.Player destroyed' );
  }
}


const speakeravailableConnect = async ( default_volume) => {
  let volume = (default_volume === undefined ) ? 1 : default_volume;
  
  if (jsmpeg === null) {
	const url = getsound_ws_url();
	console.log('creating JSMpeg.Player with', url );
       	jsmpeg = new JSMpeg.Player( url, {} );
	console.log('JSMpeg.Player created');
  }
  else
  {
	if (volume === 0 ) {
		console.log( 'JSMpeg.Player destroying' );
		jsmpeg.destroy();
		jsmpeg = null;
		console.log( 'JSMpeg.Player destroyed' );
	}
  }

  if (jsmpeg)
  	jsmpeg.volume = volume;

}


export const updateVolumeLevel = async (volume) => { 
  if (jsmpeg) 
      jsmpeg.volume = volume;
  await speakeravailableConnect( volume );
}

export async function init() {
  document.addEventListener('broadway.connected',    configureSpeaker);
  document.addEventListener('broadway.disconnected', unconfigureSpeaker);
};


export async function updateVolume( volume ) {
      updateIconVolumeLevel( volume );
      updateVolumeLevel( volume );
}

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

broadcastEvent.addEventListener('speaker.available', async ({ detail: { available } }) => {
  console.log( 'speaker.available pulsespeaker', available );
  if (available) {
    speakeravailableConnect();
  }
});



