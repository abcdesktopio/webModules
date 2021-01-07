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

import * as notificationSystem from './notificationsystem.js';
import * as languages from './languages.js';

/**
 * @name ResolutionSettings
 * @module
 */
let idAnimationTopRecord = 0;
let recordingState = 'No record is running';
let urlDownload = '';
let filename = '';
let isDownloadWaiting = false;

const DEFAULTCOLOR = '#6EC6F0';
const RED = '#ff0000';

let mediaSource;
let mediaRecorder;
let recordedBlobs;
let sourceBuffer;
let canvas;
let stream;
if (window.MediaSource) {
  mediaSource = new window.MediaSource();
  mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
}

let isRecording = false;

// Handlers Begin
function handleSourceOpen() {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function handleStop(event) {
  console.log('Recorder stopped: ', event);
  const date = new Date();
  const superBuffer = new Blob(recordedBlobs, { type: 'video/webm' });
  urlDownload = window.URL.createObjectURL(superBuffer);
  filename = `recorded_video_date.${date.toISOString()}.webm`;
}
// Handlers End

/**
 * @param {string} color
 */
const changeColorTopRecord = (color = '') => {
  $('.screen-record-animation').each(function () {
    const svg = this.getSVGDocument();
    if (!svg) {
      return;
    }

    const childs = Array.from($(svg).find('*')).map((c) => $(c));

    if (color) {
      childs.forEach((child) => {
        child.attr('fill', color);
      });
    } else {
      childs.forEach((child) => {
        if (child.attr('fill') === DEFAULTCOLOR) { child.attr('fill', RED); } else { child.attr('fill', DEFAULTCOLOR); }
      });
    }
  });
};

/**
 * @function open
 * @returns {void}
 * @desc Open the window.
 */
export function open() {
  if (!mediaSource) {
    notificationSystem.displayNotification('Screen Record', 'Not enable on your device', 'error', 'img/top/record.svg');
    return;
  }

  const screenRecordNoRecording = languages.getTranslate('screen-record-no-recording');
  const screenRecordProcessing = languages.getTranslate('screen-record-processing');
  const screenRecordTitle = languages.getTranslate('screen-record-title');
  const screenRecordComplete = languages.getTranslate('screen-record-complete');
  const screenRecordDowloaded = languages.getTranslate('screen-record-dowloaded');

  const screenRecordCancelBtn = languages.getTranslate('screen-record-cancel-btn');
  const screenRecordStoptBtn = languages.getTranslate('screen-record-stop-btn');
  const screenRecordStartBtn = languages.getTranslate('screen-record-start-btn');
  const screenRecordDownloadBtn = languages.getTranslate('screen-record-download-btn');

  if (!isRecording && !recordedBlobs) {
    recordingState = screenRecordNoRecording || 'No record is running';
  }

  bootbox.dialog({
    title: screenRecordTitle || 'Screen Record',
    message: `
            <div id="screenRecord">
                <object class="screen-record-animation" type="image/svg+xml" data="./img/top/record.svg"></object>
                <span id="recording-state-view">${recordingState}</span>
            </div>
        `,
    className: 'window-dialog-small',
    onEscape: true,
    backdrop: true,
    buttons: {
      cancel: {
        label: screenRecordCancelBtn || 'Cancel',
      },
      start: {
        label: isRecording ? (screenRecordStoptBtn || 'Stop') : (screenRecordStartBtn || 'Start'),
        className: 'window-button',
        callback: () => {
          const btnDownload = $('#recordDl');
          if (isRecording) {
            stopRecord();
            recordingState = screenRecordComplete || 'Record is complete';
            $('#recording-state-view').text(recordingState);
            const btnHandle = document.getElementById('handle-record-btn');
            btnHandle.innerText = screenRecordStartBtn || 'Start';
            isDownloadWaiting = true;
            if (btnDownload.hasClass('d-none')) {
              $(btnDownload).removeClass('d-none');
            }
            return;
          }

          startRecord();

          recordingState = screenRecordProcessing || 'Record is processing...';
          $('#recording-state-view').text(recordingState);
          if (!btnDownload.hasClass('d-none')) {
            btnDownload.addClass('d-none');
          }
        },
      },
      download: {
        label: screenRecordDownloadBtn || 'Download',
        className: 'd-none btn-download-record',
        callback: () => {
          const a = document.createElement('a');
          a.setAttribute('href', urlDownload);
          a.setAttribute('download', filename);
          $(a).appendTo('body');
          a.click();
          $(a).remove();
          recordingState = screenRecordDowloaded || 'Recording downloaded';
          $('#recording-state-view').text(recordingState);
          isDownloadWaiting = false;
        },
      },
    },
    animate: false,
  });
  $('.window-button').attr('id', 'handle-record-btn');
  $('.btn-download-record').attr('id', 'recordDl');

  if (isDownloadWaiting) {
    $('.btn-download-record').removeClass('d-none');
  }
}

const startRecord = () => {
  canvas = document.getElementById('noVNC_canvas');
  if (!canvas && canvas.captureStream) {
    return;
  }

  stream = canvas.captureStream();
  if (!stream) {
    return;
  }

  let options = { mimeType: 'video/webm' };
  recordedBlobs = [];
  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (e0) {
    console.log('Unable to create MediaRecorder with options Object: ', e0);
    try {
      options = { mimeType: 'video/webm,codecs=vp9' };
      mediaRecorder = new MediaRecorder(stream, options);
    } catch (e1) {
      console.log('Unable to create MediaRecorder with options Object: ', e1);
      try {
        options = 'video/vp8';// Chrome 47
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e2) {
        alert('MediaRecorder is not supported by this browser.\n\n'
                + 'Try Firefox 29 or later, or Chrome 47 or later, '
                + 'with Enable experimental Web Platform features enabled from chrome://flags.');
        console.error('Exception while creating MediaRecorder:', e2);
        return;
      }
    }
  }

  idAnimationTopRecord = setInterval(() => {
    changeColorTopRecord();
  }, 500);

  isRecording = true;
  notificationSystem.displayNotification('Screen Record', 'Recording...', '', 'img/top/record.svg');
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(100);
  console.log('MediaRecorder started', mediaRecorder);
};

const stopRecord = () => {
  clearInterval(idAnimationTopRecord);
  changeColorTopRecord(DEFAULTCOLOR);
  isRecording = false;
  mediaRecorder.stop();
  notificationSystem.displayNotification('Screen Record', 'Recording ended', '', 'img/top/record.svg');
};
