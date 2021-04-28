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

import * as notificationSystem from '../../notificationsystem.js';
import * as launcher from '../../launcher.js';

import * as wavplayer from './wavplayer.js';
import * as wavify from './wavify.js';
import * as soundSystem from './soundSystem.js';

/**
 * @name speaker
 * @module
 */

const numberOfChannels = 1;
let bitsPerSample = 8; // 16;
let sampleRate = 8000; // 8000; //44100;
let lowwatermark = 512;
let latency = 0.2;
let format = wavify.WAVE_FORMAT_ULAW;
let sink = 'default sink';

let scheduleBuffersTimeout = 50;
const bandwithSettings = [
  { sampleRate: 8000, format: wavify.WAVE_FORMAT_ULAW, bitsPerSample: 8 },
  { sampleRate: 11025, format: wavify.WAVE_FORMAT_PCM, bitsPerSample: 8 },
  { sampleRate: 22050, format: wavify.WAVE_FORMAT_PCM, bitsPerSample: 16 },
  { sampleRate: 44100, format: wavify.WAVE_FORMAT_PCM, bitsPerSample: 16 },
];

export async function init() {
  soundSystem.init();
  if (checkBrowser()) {
    sink = wavplayer.mkWavPlayerSink(numberOfChannels, bitsPerSample, sampleRate, format);
    await launcher.setAudioQuality(sink);

    document.getElementById('volume_level').disabled = false;

    window.myplayer = wavplayer.WavPlayer(
      numberOfChannels,
      bitsPerSample,
      sampleRate,
      lowwatermark,
      latency,
      format,
      scheduleBuffersTimeout,
    );
  } else {
    window.myplayer = null;
    disableSpeaker();
    throw new Error('not supported');
  }
};

/**
 * @function setlowwatermark
 * @param {number} _lowwatermark
 */
export const setlowwatermark = function (_lowwatermark) {
  lowwatermark = _lowwatermark;
  if (window.myplayer && window.myplayer.state() === 'running') { window.myplayer.setlowwatermark(lowwatermark); }
};

export const getlowwatermark = function () {
  return lowwatermark;
};

export const setlatency = function (_latency) {
  latency = _latency;
  if (window.myplayer) { window.myplayer.setlatency(latency); }
};

export const getlatency = function () {
  return latency;
};

/**
 * @function setscheduleBuffersTimeout
 * @param {number} _scheduleBuffersTimeout
 */
export const setscheduleBuffersTimeout = function (_scheduleBuffersTimeout) {
  scheduleBuffersTimeout = _scheduleBuffersTimeout;
  if (window.myplayer) { window.myplayer.setscheduleBuffersTimeout(scheduleBuffersTimeout); }
};

/**
 * @function getscheduleBuffersTimeout
 * @returns {number}
 */
export const getscheduleBuffersTimeout = function () {
  return scheduleBuffersTimeout;
};

/**
 * @function setBandWidth
 * @param {number} index
 */
export const setBandWidth = function (index) {
  let oldState;
  if (window.myplayer) { oldState = window.myplayer.state(); }

  if (index < 0 || index > bandwithSettings.length) { return; }

  sampleRate = bandwithSettings[index].sampleRate;
  format = bandwithSettings[index].format;
  bitsPerSample = bandwithSettings[index].bitsPerSample;

  // Stop the current stream
  if (window.myplayer && oldState === 'running') { window.myplayer.stop(); }

  // Build the new url stream to the pulse sink
  sink = wavplayer.mkWavPlayerSink(numberOfChannels, bitsPerSample, sampleRate, format);

  // New WavPlayer
  launcher.setAudioQuality(sink)
    .then(() => {
      window.myplayer = wavplayer.WavPlayer(
        numberOfChannels,
        bitsPerSample,
        sampleRate,
        lowwatermark,
        latency,
        format,
        scheduleBuffersTimeout,
      );
      if (oldState === 'running') { window.myplayer.play(); }
    });
};

/**
 * @function getBandWidth
 * @returns {string}
 */
export const getBandWidth = () => {
  if (format === wavify.WAVE_FORMAT_PCM) { return 'hight'; }
  if (format === wavify.WAVE_FORMAT_ULAW || format === wavify.WAVE_FORMAT_ALAW) { return 'low'; }
  return '';
};

/**
 * @function getTextFormat
 * @returns {string}
 */
export const getTextFormat = function () {
  if (format === wavify.WAVE_FORMAT_PCM) { return `Wave PCM  ${bitsPerSample} bits per sample, ${sampleRate}bits/s mono`; }
  if (format === wavify.WAVE_FORMAT_ULAW) { return `ULaw G711 ${bitsPerSample} bits per sample, ${sampleRate}bits/s mono`; }
  if (format === wavify.WAVE_FORMAT_ALAW) { return `ALaw G711 ${bitsPerSample} bits pre sample, ${sampleRate}bits/s mono`; }
  return 'Unkonw format, not supported';
};

/**
 * @function getSinkFormat
 * @returns {string}
 */
export const getSinkFormat = function () {
  return `pulse:${sink}`;
};

/**
 * @function playTest
 * @param {Fucntion} callback
 * @desc
 */
export const playTest = function (callback) {
  function doPlayTestSound(err) {
    if (err || !window.myplayer) { return; }

    if (window.myplayer.state() !== 'running') {
      soundSystem.setSoundLevel(0.5); // Update UI
      window.myplayer.play();
    }

    launcher.playAudioSample()
      .then(callback);
  }

  if (!window.myplayer) { init(doPlayTestSound); } else { doPlayTestSound(); }
};

/**
 * @function checkBrowser
 * @returns {boolean}
 */
function checkBrowser() {
  const myAudioContext = window.AudioContext // Default
    || window.webkitAudioContext // Safari and old versions of Chrome
    || false;
  const copyFromChannel = AudioBuffer.prototype.copyFromChannel || false;
  return (myAudioContext && copyFromChannel);
}

function notificationSystemSoundErrorMessage() {
  const notificationErrorMessage = 'Your web browser does not handle all audio API to process real time sound streaming';
  if (notificationSystem) { notificationSystem.displayNotification('Real time sound unsupported', notificationErrorMessage, 'info', null, null, 10000); }
}

function disableSpeaker() {
  notificationSystemSoundErrorMessage();
}
