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

import {
  wavify,
  WAVE_FORMAT_PCM,
  WAVE_FORMAT_ULAW,
  WAVE_FORMAT_ALAW,
} from './wavify.js';

import { concat } from './concat.js';

function pad(buffer) {
  const currentSample = new Float32Array(1);

  buffer.copyFromChannel(currentSample, 0, 0);

  let wasPositive = currentSample[0] > 0;

  for (let i = 0; i < buffer.length; i += 1) {
    buffer.copyFromChannel(currentSample, 0, i);

    if ((wasPositive && currentSample[0] < 0) || (!wasPositive && currentSample[0] > 0)) {
      break;
    }

    currentSample[0] = 0;
    buffer.copyToChannel(currentSample, 0, i);
  }

  buffer.copyFromChannel(currentSample, 0, buffer.length - 1);

  wasPositive = currentSample[0] > 0;

  for (let i = buffer.length - 1; i > 0; i -= 1) {
    buffer.copyFromChannel(currentSample, 0, i);

    if ((wasPositive && currentSample[0] < 0) || (!wasPositive && currentSample[0] > 0)) {
      break;
    }

    currentSample[0] = 0;
    buffer.copyToChannel(currentSample, 0, i);
  }

  return buffer;
}

export function mkWavPlayerSink(_numberOfChannels, _bitsPerSample, _sampleRate, format) {
  let sink;
  if (format === WAVE_FORMAT_PCM) { sink = (_bitsPerSample === 8) ? 'u' : 's'; }
  if (format === WAVE_FORMAT_ALAW) { sink = 'alaw'; }
  if (format === WAVE_FORMAT_ULAW) { sink = 'ulaw'; }
  sink += `${_bitsPerSample}_${_numberOfChannels}_${_sampleRate}`;
  return sink;
}

export function WavPlayer(
  _numberOfChannels,
  _bitsPerSample,
  _sampleRate,
  _lowwatermark,
  _latency,
  _format,
  _scheduleBuffersTimeout,
) {
  let context;
  let gainNode;
  let hasCanceled_ = false;

  const numberOfChannels = (_numberOfChannels) || 1; // default value mono
  const bitsPerSample = (_bitsPerSample) || 8; // 8 bits
  const sampleRate = (_sampleRate) || 8000; // 11025
  let lowwatermark = (_lowwatermark) || 512; // 512 bytes
  let latency = (_latency) || 0.2; // 0.2 ->
  let scheduleBuffersTimeout = (_scheduleBuffersTimeout) || 100;
  const format = (_format) || WAVE_FORMAT_ULAW; // PCM=1, ALAW=6, ULAW=7
  const sink = mkWavPlayerSink(numberOfChannels, bitsPerSample, sampleRate, format);
  const defaulturl = `/${sink}`;

  function play(_url) {
    let nextTime = 0;
    let url = (_url) || defaulturl;
    const audioStack = [];

    // This is not supported by pulseaudio
    // Need to change the access-control-allow-origin
    // if (window.od.currentUser.websocketrouting
    //     && window.od.currentUser.websocketrouting === 'bridge')
    //  url = 'http://' + window.od.currentUser.target_ip + ':' + window.od.currentUser.pulseaudiotcpport + '/listen/source/' + sink + '.monitor';

    url = window.od.net.urlrewrite(url);
    hasCanceled_ = false;

    context = new (window.AudioContext || window.webkitAudioContext)();
    if (!context) {
      // AudioContext is unsupported
      console.error('AudioContext is unsupported');
      return;
    }
    gainNode = context.createGain();
    gainNode.gain.value = 1;
    let scheduleBuffersTimeoutId = null;

    function scheduleBuffers() {
      // var _myduration = 0;

      if (hasCanceled_) {
        scheduleBuffersTimeoutId = null;
        return;
      }

      while (
        audioStack.length > 0
                && audioStack[0].buffer !== undefined
                && nextTime < context.currentTime + 2
      ) {
        const { currentTime } = context;

        const source = context.createBufferSource();

        const segment = audioStack.shift();

        source.buffer = pad(segment.buffer);
        source.connect(gainNode);
        gainNode.connect(context.destination);

        if (nextTime === 0) {
          nextTime = currentTime + 0.2;
          // latency; /// add 700ms latency to work well across systems - tune this if you like
        }

        let { duration } = source.buffer;
        let offset = 0;

        if (currentTime > nextTime) {
          offset = currentTime - nextTime;
          nextTime = currentTime;
          duration -= offset;
        }

        source.start(nextTime, offset);
        source.stop(nextTime + duration);
        // _myduration = duration + _myduration;
        nextTime += duration;
        // Make the next buffer wait the length of the last buffer before being played
      }
      // _myduration =  _myduration * 100;
      // console.log( '_myduration=' + _myduration );
      scheduleBuffersTimeoutId = setTimeout(() => { scheduleBuffers(); }, scheduleBuffersTimeout);
    }

    const options = {
      credentials: 'same-origin',
      headers: {
        'ABCAuthorization': `Bearer ${window.od.currentUser.authorization}`,
      },
    };

    fetch(url, options)
      .then((response) => {
        if (!response.body) {
          console.error('reponse.body is not defined');
          console.error(response);
          return;
        }

        const reader = response.body.getReader();
        if (!reader) {
          console.error('reader is not defined');
          console.error(response.type);
          return;
        }

        // This variable holds a possibly dangling byte.
        let rest = null;
        let isFirstBuffer = true;

        const read = function () {
          reader.read().then((a) => {
            // console.log(a);
            if (hasCanceled_) {
              reader.cancel();
              return;
            }
            if (a.value && a.value.buffer) {
              let buffer;
              const segment = {};

              if (rest !== null) {
                buffer = concat(rest, a.value.buffer);
              } else {
                buffer = a.value.buffer;
              }

              // Make sure that the first buffer is lager then 44 bytes.
              if (isFirstBuffer && buffer.byteLength <= 44) {
                rest = buffer;
                read();
                return;
              }

              if (isFirstBuffer) {
                isFirstBuffer = false;
              }

              // if buffer.byteLength is odd
              if (buffer.byteLength % 2 === 0) {
                rest = buffer.slice(-2, -1);
                buffer = buffer.slice(0, -1);
              } else {
                rest = null;
              }

              audioStack.push(segment);
              const myNewAudioData = wavify(
                buffer,
                numberOfChannels,
                sampleRate,
                bitsPerSample,
                format,
              );
              context.decodeAudioData(myNewAudioData,
                (audioBuffer) => {
                  segment.buffer = audioBuffer;
                  if (scheduleBuffersTimeoutId === null) {
                    scheduleBuffers();
                  }
                },
                (e) => { console.error(`Error with decoding audio data ${e}`); });
            }

            if (a.done) {
              return;
            }

            // continue reading
            read();
          });
        };

        // start reading
        read();
      });
  }

  return {
    setscheduleBuffersTimeout(_scheduleBuffersTimeout) {
      scheduleBuffersTimeout = _scheduleBuffersTimeout;
    },
    getscheduleBuffersTimeout() { return scheduleBuffersTimeout; },
    setlatency(_latency) { latency = _latency; },
    getlatency() { return latency; },
    setlowwatermark(_lowwatermark) { lowwatermark = _lowwatermark; },
    getlowwatermark() { return lowwatermark; },
    sink() { return sink; },
    play(url) { play(url); },
    stop() {
      hasCanceled_ = true;
      if (context) {
        context.close();
      }
    },
    state() {
      if (context) {
        return context.state;
      }
      return 'closed';
    },
    volume(vol) {
      if (gainNode && gainNode.gain) gainNode.gain.value = vol;
    },
  };
}
