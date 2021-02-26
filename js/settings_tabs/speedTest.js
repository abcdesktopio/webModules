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

import * as system from '../system.js';

import { settingsEvents } from '../settingsevents.js';
import * as languages from '../languages.js';

let firstAppear = true;

let isRunning = false;

let dlColor = '';
let ulColor = '';
let pingColor = '';
let jitColor = '';
let progColor = '#EEEEEE';

const applyColors = (color = '') => {
  dlColor = color;
  ulColor = color;
  pingColor = color;
  jitColor = color;
  progColor = color;
};

const meterBk = '#E0E0E0';

// SPEEDTEST AND UI CODE
let w = null; // speedtest worker
let data = null; // data from worker
let animationFrame = null; //
let intervallCall = null; // intervallCall

function I(id) {
  return document.getElementById(id);
}

// CODE FOR GAUGES
function drawMeter(c, amount, bk, fg, progress, prog) {
  try {
    const ctx = c.getContext('2d');
    const dp = window.devicePixelRatio || 1;
    const cw = c.clientWidth * dp;
    const ch = c.clientHeight * dp;
    const sizScale = ch * 0.0055;
    if (c.width === cw && c.height === ch) {
      ctx.clearRect(0, 0, cw, ch);
    } else {
      c.width = cw;
      c.height = ch;
    }
    ctx.beginPath();
    ctx.strokeStyle = bk;
    ctx.lineWidth = 16 * sizScale;
    ctx.arc(c.width / 2,
      c.height - 58 * sizScale,
      c.height / 1.8 - ctx.lineWidth,
      -Math.PI * 1.1,
      Math.PI * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = fg;
    ctx.lineWidth = 16 * sizScale;
    ctx.arc(
      c.width / 2,
      c.height - 58 * sizScale,
      c.height / 1.8 - ctx.lineWidth,
      -Math.PI * 1.1,
      amount * Math.PI * 1.2 - Math.PI * 1.1,
    );
    ctx.stroke();
    if (typeof progress !== 'undefined') {
      ctx.fillStyle = prog;
      ctx.fillRect(c.width * 0.3, c.height - 16 * sizScale, c.width * 0.4 * progress, 4 * sizScale);
    }
  } catch (err) {
    // nothing to do
    console.error(err);
  }
}

function mbpsToAmount(s) {
  return 1 - (1 / (1.3 ** Math.sqrt(s)));
}

function msToAmount(s) {
  return 1 - (1 / (1.08 ** Math.sqrt(s)));
}

function startStop() {
  if (w != null) {
    if (window.cancelAnimationFrame && animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    if (intervallCall) {
      clearInterval(intervallCall);
      intervallCall = null;
    }
    // speedtest is running, abort
    w.postMessage('abort');
    w = null;
    data = null;
    I('startStopBtn').className = '';
    initUI();
    isRunning = false;
  } else {
    isRunning = true;
    // test is not running, begin
    let url = 'js/speedtest_worker.js';
    url = window.od.net.urlrewrite(url);
    w = new Worker(url);

    const settings = {
      url_dl: window.od.net.urlrewrite('/speedtest/garbage.php'), // path to a large file or garbage.php, used for download test. must be relative to this js file
      url_ul: window.od.net.urlrewrite('/speedtest/empty.php'), // path to an empty file, used for upload test. must be relative to this js file
      url_ping: window.od.net.urlrewrite('/speedtest/empty.php'), // path to an empty file, used for ping test. must be relative to this js file
      url_getIp: window.od.net.urlrewrite('/speedtest/getIP.php'), // path to getIP.php relative to this js file, or a similar thing that outputs the client's ip
      url_telemetry: window.od.net.urlrewrite('/speedtest/telemetry.php'), // path to the script that adds telemetry data to the database
    };

    let httpdata = 'start';
    httpdata += ` ${JSON.stringify(settings)}`;
    w.postMessage(httpdata); // Add optional parameters as a JSON object to this command

    I('startStopBtn').className = 'running';
    w.onmessage = function (e) {
      data = JSON.parse(e.data);
      const status = data.testState;
      if (status >= 4) {
        // test completed
        I('startStopBtn').className = '';
        w = null;
        updateUI(true);

        if (window.cancelAnimationFrame && animationFrame) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        if (intervallCall) {
          clearInterval(intervallCall);
          intervallCall = null;
        }
      }
    };
    if (window.requestAnimationFrame && animationFrame == null) {
      animationFrame = window.requestAnimationFrame(frame);
    }
    if (!intervallCall) { intervallCall = setInterval(() => { w.postMessage('status'); }, 100); } // ask for status every 100ms
  }
}

// this function reads the data sent back by the worker and updates the UI
function updateUI(forced) {
  if (!forced && !w) return;
  if (!data) return;
  if (!data.testState) return;
  const status = data.testState;

  I('settings-speedTest-ip').textContent = data.clientIp;
  I('dlText').textContent = (status === 1 && data.dlStatus === 0) ? '...' : data.dlStatus;
  drawMeter(I('dlMeter'), mbpsToAmount(Number(data.dlStatus * (status === 1 ? oscillate() : 1))), meterBk, dlColor, Number(data.dlProgress), progColor);
  I('ulText').textContent = (status === 3 && data.ulStatus === 0) ? '...' : data.ulStatus;
  drawMeter(I('ulMeter'), mbpsToAmount(Number(data.ulStatus * (status === 3 ? oscillate() : 1))), meterBk, ulColor, Number(data.ulProgress), progColor);
  I('pingText').textContent = data.pingStatus;
  drawMeter(I('pingMeter'), msToAmount(Number(data.pingStatus * (status === 2 ? oscillate() : 1))), meterBk, pingColor, Number(data.pingProgress), progColor);
  I('jitText').textContent = data.jitterStatus;
  drawMeter(I('jitMeter'), msToAmount(Number(data.jitterStatus * (status === 2 ? oscillate() : 1))), meterBk, jitColor, Number(data.pingProgress), progColor);
}

function oscillate() {
  return 1 + 0.02 * Math.sin(Date.now() / 100);
}

function frame() {
  updateUI();
  animationFrame = window.requestAnimationFrame(frame);
}

// function to (re)initialize UI
function initUI() {
  drawMeter(I('dlMeter'), 0, meterBk, dlColor, 0);
  drawMeter(I('ulMeter'), 0, meterBk, ulColor, 0);
  drawMeter(I('pingMeter'), 0, meterBk, pingColor, 0);
  drawMeter(I('jitMeter'), 0, meterBk, jitColor, 0);
  I('dlText').textContent = '';
  I('ulText').textContent = '';
  I('pingText').textContent = '';
  I('jitText').textContent = '';
  I('settings-speedTest-ip').textContent = languages.getTranslate('settings-speedTest-ip');
}

export function init(home, speedtest) {
  system.hide(home);
  system.show(speedtest);

  applyColors('#6EC6F0');
  if (firstAppear) {
    fetch('/transpile/config/ui.json')
      .then(system.checkError)
      .then((res) => res.json())
      .then((conf) => {
        const { colors = [] } = conf;
        const tertiary = colors.find((c) => c.name === '@tertiary');
        if (tertiary) {
          applyColors(tertiary.value);
        }
      })
      .catch((e) => {
        console.error(e);
      });
    firstAppear = false;
    const startStopBtn = speedtest.querySelector('#startStopBtn');
    if (startStopBtn) {
      startStopBtn.addEventListener('click', startStop);
    }
    initUI();
  }
}

function handlingStop() {
  firstAppear = true;
  if (isRunning) {
    startStop();
  }
}

settingsEvents.addEventListener('beforeBack', handlingStop);
settingsEvents.addEventListener('close', handlingStop);
