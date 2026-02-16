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

import * as launcher from './launcher.js';
import * as languages from './languages.js';

let menuconfig;

/**
 * @function logoffClicked
 * @returns {void}
 * @desc Disconnect the user, and remove his session.
 *
 */
export const logoffClicked = function () {
  launcher.docker_logoff();
};

/**
 * @function disconnectClicked
 * @returns {void}
 * @desc Disconnect the use from the session
 */
export const disconnectClicked = function () {
  launcher.disconnect();
};

/**
 * @function open
 * @returns {void}
 * @desc Open logoff window.
 */
export const logoffOpen = function () {
  const logOffTitle = languages.getTranslate('log-off-title');
  const logOffCancelBtn = languages.getTranslate('log-off-cancel-btn');
  const logOffBtn = languages.getTranslate('log-off-logOff-btn');
  const disconnectBtn = languages.getTranslate('log-off-disconnect-btn');
  const templateLogOff = document.getElementById('log-off-window-template');

  const buttons = {
    cancel: {
      label: logOffCancelBtn || 'Cancel',
      className: 'd-xl-block d-lg-block d-md-block d-none btn-outline-secondary',
    },
    logOff: {
      label: logOffBtn || 'Logoff',
      className: 'button-log-off',
      callback: logoffClicked,
    },
  };

  if (!menuconfig) {
	  console.error( 'Fatal error: menuconfig is not defined !');
	  return;
  }

  if (!menuconfig.disconnect) {
          console.error( 'menuconfig.disconnect is not defined, or disabled by config file');
          return;
  }

  if (window.od.currentUser.providertype !== 'anonymous') {
    buttons.disconnect = {
      label: disconnectBtn || 'Just disconnect',
      className: 'window-button',
      callback: disconnectClicked,
    };
  }

  bootbox.dialog({
    title: logOffTitle || 'Logoff',
    message: templateLogOff.innerHTML,
    className: 'window-dialog-small',
    onEscape: true,
    backdrop: true,
    buttons,
    animate: false,
  });

  languages.applyLanguage();
};

export const init = function () {
  launcher.getkeyinfo('menuconfig')
    .done((ret) => {
      if (ret.id) {
        menuconfig = ret.id;
        let documentmenu=document.getElementById('mainmenu');
        if (documentmenu) {
          let documentmenuentries = documentmenu.querySelectorAll(".state");
          // ready the key menu
          documentmenuentries.forEach(elt => {
            let menuentryid = elt.id;
            if ( menuentryid ) {
              if (!menuconfig[menuentryid]) {
                // the entry is disabled by config file
                elt.parentElement.remove();
              }
              else {
                //  the entry is enable
                const li = elt.parentElement;
                li.style.display = 'block';
                const dropDown = li.parentElement;
                const indexDivider = Array.from(dropDown.children).indexOf(li) + 1;
                const divider = dropDown.children[indexDivider];
                if (divider) { divider.style.display = 'block'; }
              }
            }
          });
        }
      }
      // document.getElementById("logoff-window") should always exist
      // Add an event listener for close , logoff and cancel buttons to the menu
    }
  );
};

// Base code from https://codingartistweb.com/2022/08/draggable-div-with-javascript/

let moveMenuIcon = document.getElementById("move-menu");
let draggableMenu = document.getElementById("top-right");
let initialX = 0,
  initialY = 0;
let moveElement = false;
let dropDownDirectionRight = false;

let events = {
  mouse: {
    down: "mousedown",
    move: "mousemove",
    up: "mouseup",
  },
  touch: {
    down: "touchstart",
    move: "touchmove",
    up: "touchend",
  },
};

let deviceType = "";

//Detech touch device
const isTouchDevice = () => {
  try {
    //We try to create TouchEvent (it would fail for desktops and throw error)
    document.createEvent("TouchEvent");
    deviceType = "touch";
    return true;
  } catch (e) {
    deviceType = "mouse";
    return false;
  }
};

isTouchDevice();

const stopMovement = (e) => {
  moveElement = false;
  moveMenuIcon.style.cursor = "grab";
};

let copyPasteDropdown = document.querySelector("#copypaste .drop-down");
let speakersDropdown = document.querySelector("#speakers .drop-down");
let nameDropdown = document.querySelector("#name .drop-down");

//Start (mouse down / touch start)
moveMenuIcon.addEventListener(events[deviceType].down, (e) => {

  e.preventDefault();
  //initial x and y points
  initialX = !isTouchDevice() ? e.clientX : e.touches[0].clientX;
  initialY = !isTouchDevice() ? e.clientY : e.touches[0].clientY;

  moveMenuIcon.style.cursor = "grabbing";

  //Start movement
  moveElement = true;
});

//Move
document.addEventListener(events[deviceType].move, (e) => {
  //if movement == true then set top and left to new X andY while removing any offset
  if (moveElement) {
    e.preventDefault();
    let newX = !isTouchDevice() ? e.clientX : e.touches[0].clientX;
    let newY = !isTouchDevice() ? e.clientY : e.touches[0].clientY;

    // next position
    let nextTop  = draggableMenu.offsetTop  - (initialY - newY);
    let nextLeft = draggableMenu.offsetLeft - (initialX - newX);

    // screen limits definition
    const maxLeft = window.innerWidth  - draggableMenu.offsetWidth;
    const maxTop  = window.innerHeight - draggableMenu.offsetHeight - 44; // 44 is the height of the desktop toolbar

    if (nextLeft < 0) nextLeft = 0;
    if (nextTop  < 0) nextTop  = 0;
    if (nextLeft > maxLeft) nextLeft = maxLeft;
    if (nextTop  > maxTop)  nextTop  = maxTop;

    draggableMenu.style.left = nextLeft + "px";
    draggableMenu.style.top  = nextTop  + "px";

    if (newX > window.innerWidth / 2 && dropDownDirectionRight === true) {
      dropDownDirectionRight = false;
      console.log("dropown à gauche");
      copyPasteDropdown.style.right = "59px";
      copyPasteDropdown.style.setProperty('--arrow-left', '103%');
      copyPasteDropdown.style.setProperty('--arrow-rotate', '90deg');

      speakersDropdown.style.right = "59px"; 
      speakersDropdown.style.setProperty('--arrow-left', '104%');
      speakersDropdown.style.setProperty('--arrow-rotate', '90deg');

      nameDropdown.style.right = "63px";
      nameDropdown.style.setProperty('--arrow-left', '105%');
      nameDropdown.style.setProperty('--arrow-rotate', '90deg');
    }
    
    if (newX < window.innerWidth / 2 && dropDownDirectionRight === false) {
      dropDownDirectionRight = true;
      console.log("dropown à droite")
      copyPasteDropdown.style.right = "-313px";
      copyPasteDropdown.style.setProperty('--arrow-left', '-2%');
      copyPasteDropdown.style.setProperty('--arrow-rotate', '-90deg');

      speakersDropdown.style.right = "-159px"; 
      speakersDropdown.style.setProperty('--arrow-left', '-4%');
      speakersDropdown.style.setProperty('--arrow-rotate', '-90deg');

      nameDropdown.style.right = "-239px";
      nameDropdown.style.setProperty('--arrow-left', '-4%');
      nameDropdown.style.setProperty('--arrow-rotate', '-90deg');
    }

    initialX = newX;
    initialY = newY;
  }
});

//mouse up / touch end
document.addEventListener(events[deviceType].up, stopMovement);