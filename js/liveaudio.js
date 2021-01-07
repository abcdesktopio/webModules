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
 * @name liveAudio
 * @module
 */

let id = null;

/**
 * @function init
 * @return {void}
 * @desc Create event listener on broadway connect and disconnect.
 */
export const init = function () {
  id = 'oc_audio';
  document.addEventListener('broadway.connected', broadwayconnected);
  document.addEventListener('broadway.disconnected', broadwaydisconnected);
};

/**
 * @function broadwayconnected
 * @param  {event} myevent
 * @return {void}
 * @desc Callback for broadwayconnected event
 */
export const broadwayconnected = function () {
  // handle myEvent
  console.log('liveaudio:broadwayconnected event call back');
  connect();
};

/**
 * @function broadwayconnected
 * @param  {event} myevent
 * @return {void}
 * @desc Callback for broadwaydisconnected event
 */
export const broadwaydisconnected = function () {
  // handle myEvent
  console.log('liveaudio:broadwaydisconnected event call back');
  disconnect();
};

/**
 * @function connect
 * @return {void}
 * @desc Connect stream to html audio element.
 */
export const connect = function () {
  let myaudio = document.getElementById(id);
  if (!myaudio) {
    myaudio = document.createElement('audio');
    myaudio.id 		 = id;
    myaudio.autoplay = true;
    myaudio.src 	 = '/live';
    myaudio.preload	 = 'none';	// Requests that the browser not preload the audio file. The browser is free to ignore this request.
    this.audio 		 = myaudio;
    myaudio.addEventListener('error', audiolog, false);
    document.body.appendChild(myaudio);
  }
};

/**
 * @function audiolog
 * @param  {object} e
 * @return {void}
 */
export const audiolog = function (e) {
  let message = '';
  // audio playback failed - show a message saying why
  // to get the source of the audio element use $(this).src
  switch (e.target.error.code) {
    case e.target.error.MEDIA_ERR_ABORTED:
      message = 'You aborted the video playback.';
      break;
    case e.target.error.MEDIA_ERR_NETWORK:
      message = 'A network error caused the audio download to fail.';
      break;
    case e.target.error.MEDIA_ERR_DECODE:
      message = 'The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.';
      break;
    case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
      // origin message
      // message = 'The video audio not be loaded, either because the server or network failed or because the format is not supported.';
      // Audio server has no data to send
      // try to reconnect
      message = 'The video audio not be loaded, either because the server or network failed - try again';
      connect();
      break;

    default:
      message = 'An unknown audio error occurred.';
      break;
  }
  console.log(`AUDIO LOG: ${message}`);
};

/**
 * @function disconnect
 * @return {void}
 * @desc Disconnect audio stream.
 */
export const disconnect = function () {
  const myaudio = document.getElementById(id);
  if (myaudio) {
    const { parentNode } = myaudio;
    if (parentNode) {
      parentNode.removeChild(myaudio);
    }
  }
};
