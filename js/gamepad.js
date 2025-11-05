/* eslint-disable no-use-before-define */
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
 * @name logs
 * @module
 */
import * as system from './system.js';
import { broadcastEvent } from './broadcastevent.js';

/**
 * @function init
 * @return {void}
 * @desc Get files in printer-queue
 */
export const init = function () {
  // start the loop
  window.addEventListener("gamepadconnected",    gamepadconnect );
  window.addEventListener("gamepaddisconnected", gamepaddisconnect );
};


var gamepad_ws = null;

const buttonMap = [ "a","b","x","y","tl","tr","select","start","thumbl","thumbr" ];
const axisMap = ["x","y","rx","ry","hatx","haty"];

export const getgamepad_ws_url = () => {
  const path = `/gamepad?jwt_token=${window.od.currentUser.authorization}`;
  const url = window.od.net.getwsurl(path);
  return url;
};

function gamepadconnect(e) {
  console.log("Gamepad connected :", e.gamepad);
  if (!gamepad_ws || gamepad_ws.readyState !== WebSocket.OPEN) {
    let url = getgamepad_ws_url();
    console.log("Gamepad connecting to ", url);
    gamepad_ws = new WebSocket(url);
    gamepad_ws.addEventListener("open",  gamepad_ws_open  );
    gamepad_ws.addEventListener("close", gamepad_ws_close );
    gamepad_ws.addEventListener("error", gamepad_ws_error );
  }
}

function gamepaddisconnect(e) {
   console.log("Gamepad disconnected :", e.gamepad);
   if (gamepad_ws) {
	gamepad_ws.close();
	gamepad_ws = null;
   }
}


function gamepad_ws_open(event) {
  console.log( 'gamepad_ws open');
  show_gamepad_icon();
  pollGamepad()
}

function gamepad_ws_close(event) {
  console.log( 'gamepad_ws close');
  gamepad_ws = null;
  hide_gamepad_icon();
}

function gamepad_ws_error(event) {
  console.log( 'gamepad_ws error');
  gamepad_ws = null;
  // if (Object.keys(controllers).length > 0 )
  hide_gamepad_icon();
}

function sendEvent(type, name, value){
    if (gamepad_ws && gamepad_ws.readyState === WebSocket.OPEN){
        gamepad_ws.send(JSON.stringify({type:type, [type==="axis"?"axis":"button"]:name, value:value}));
    }
}

function show_gamepad_icon() {
  const gamepad = document.getElementById('gamepad');
  if (gamepad) {
	gamepad.style.display = 'block';
  }
}

function hide_gamepad_icon() {
  const gamepad = document.getElementById('gamepad');
  if (gamepad) {
        gamepad.style.display = 'none';
  }
}


function pollGamepad(){
    const gps = navigator.getGamepads();
    if(!gps) return;

    for(const gp of gps){
        if(!gp) continue;

        // Axes
        gp.axes.forEach((val,i)=>{
            // Convertir de [-1,1] en [0,255]
            const mapped = Math.round((val +1)/2*255);
            if(axisMap[i]) sendEvent("axis", axisMap[i], mapped);
        });

        // Buttons
        gp.buttons.forEach((btn,i)=>{
            if(buttonMap[i]){
                sendEvent("button", buttonMap[i], btn.pressed ? 1 : 0);
            }
        });
    }

    requestAnimationFrame(pollGamepad);
}

