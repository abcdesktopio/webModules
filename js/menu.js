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
import * as printer from './printer.js';
import { closeTopRightDropDowns } from './scripts.js';
import { setCapture } from './noVNC/core/util/events.js';

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
  const controlBar = document.getElementById("abcdesktop_control_bar");
  setTimeout(() => {
    controlBar.classList.remove("abcdesktop_open");
  }, 5000);
};

// Code adapted from : https://github.com/novnc/noVNC

/* GLOBAL VARIABLES */

const controlBarAnchor = document.getElementById("abcdesktop_control_bar_anchor");
const controlBarHandle = document.getElementById("abcdesktop_control_bar_handle");
const controlBar = document.getElementById("abcdesktop_control_bar");
const hints = document.getElementsByClassName('abcdesktop_control_bar_hint');
let controlbarDownClientY = 0;
let controlbarDownOffsetY = 0;
let controlbarDownClientX = 0;
let controlbarDownOffsetX = 0;
let controlbarGrabbed = false;
let controlbarMoving = false;
let controlbarOnTop = true;
let currentSnapping = "top";

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

/* END GLOBAL VARIABLES */

/* HELPER FUNCTIONS */

/**
 * Check if the device is a touch device or not.
 * If the device is a touch device, it returns true and sets the global variable deviceType to "touch".
 * If the device is not a touch device, it returns false and sets the global variable deviceType to "mouse".
 * @returns {boolean} true if the device is a touch device, false otherwise.
*/
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

export const calculateControlBarHandlePositioning = () => {
  if (controlbarOnTop) {
    const controlBarRect = controlBar.getBoundingClientRect();
    controlBarHandle.style.transform = `translateX(${Math.round((controlBarRect.width -50) / 2)}px)`;
  } else {
    const controlBarRect = controlBar.getBoundingClientRect();
    console.log(controlBarRect.height);
    controlBarHandle.style.transform = `translateY(${Math.round((controlBarRect.height -50) / 2)}px)`;
  }
}

/**
 * Opens the control bar by adding the "abcdesktop_open" class to the element.
 * @param {Element} e - The element to add the class to.
 */
const openControlbar = (e) => {
  e.classList.add("abcdesktop_open");
}

/**
 * Closes the control bar by removing the "abcdesktop_open" class from the element.
 * Also calls closeTopRightDropDowns() to close any open top right drop downs.
 * @param {Element} e - The element to remove the class from.
 */
const closeControlbar = (e) => {
  closeTopRightDropDowns();
  e.classList.remove("abcdesktop_open")
}

/**
 * Toggles the control bar by either adding or removing the "abcdesktop_open" class
 * from the given element.
 * @param {Element} e - The element to toggle the control bar on.
 */
const toggleControlbar = (e) => {
  if (e.classList.contains("abcdesktop_open")) {
      closeControlbar(e);
  } else {
      openControlbar(e);
  }
}

/**
 * Shows or hides all control bar hints, except for the current snapping position.
 * If animate is true, the transition will be animated, otherwise it will be instantaneous.
 * @param {boolean} show - Whether to show or hide the hints.
 * @param {boolean} [animate=true] - Whether to animate the transition.
 */
const showControlbarHints = (show, animate=true) => {
  for (const hint of hints) {
    if (hint.id === `abcdesktop_${currentSnapping}_control_bar_hint`) {
      continue;
    }

    if (animate) {
        hint.classList.remove("abcdesktop_notransition");
    } else {
        hint.classList.add("abcdesktop_notransition");
    }

    if (show) {
        hint.classList.add("abcdesktop_active");
    } else {
        hint.classList.remove("abcdesktop_active");
    }

  }
}

const toggleControlbarChangeSnapping = () => {
  // Temporarily disable animation, if bar is displayed, to avoid weird
  // movement. The transitionend-event will not fire when display=none.
  const controlBarDisplayStyle = window.getComputedStyle(controlBar).display;
  if (controlBarDisplayStyle !== 'none') {
      controlBar.style.transitionDuration = '0s';
      controlBar.addEventListener('transitionend', () => controlBar.style.transitionDuration = '');
  }

  // Consider this a movement of the handle
  controlbarMoving = true;

  // The user has "followed" hint, let's hide it until the next drag
  showControlbarHints(false, false);
}

/**
 * Snaps the control bar to the left edge of the window, if it's not already there.
 * If the control bar is currently snapped to the right or top edge, this will toggle
 * the control bar's snapping position and hide all control bar hints until the next
 * drag.
 */
const snapToLeft = () => {
  if (controlBarAnchor.classList.contains("abcdesktop_right") || controlBarAnchor.classList.contains("abcdesktop_top")){
    toggleControlbarChangeSnapping();
    controlBarAnchor.classList.remove("abcdesktop_top");
    controlBarAnchor.classList.remove("abcdesktop_right");
    currentSnapping = "left";
    controlbarOnTop = false;
  }
}

/**
 * Snaps the control bar to the right edge of the window, if it's not already there.
 * If the control bar is currently snapped to the left or top edge, this will toggle
 * the control bar's snapping position and hide all control bar hints until the next
 * drag.
 */
const snapToRight = () => {
  if (!controlBarAnchor.classList.contains("abcdesktop_right")){
    toggleControlbarChangeSnapping();
    controlBarAnchor.classList.remove("abcdesktop_top");
    controlBarAnchor.classList.add("abcdesktop_right");
    currentSnapping = "right";
    controlbarOnTop = false;
  }
}

/**
 * Snaps the control bar to the top edge of the window, if it's not already there.
 * If the control bar is currently snapped to the left or right edge, this will toggle
 * the control bar's snapping position and hide all control bar hints until the next
 * drag.
 */
const snapToTop = () => {
  if (!controlBarAnchor.classList.contains("abcdesktop_top")) {
    toggleControlbarChangeSnapping();
    controlBarAnchor.classList.add("abcdesktop_top");
    controlBarAnchor.classList.remove("abcdesktop_right");
    currentSnapping = "top";
    controlbarOnTop = true;
  }
}

/**
 * Checks if the control bar should be snapped to the left, right, or top edge
 * of the window based on the pointer's position.
 * If the control bar should be snapped, the appropriate snapping function
 * will be called.
 * @param {{clientX: number, clientY: number}} ptr - The pointer event
 */
const checkChangeSnapping = (ptr) => {
  const { clientX, clientY } = ptr;
  const leftEdge = window.innerWidth * 0.1;
  const rightEdge = window.innerWidth * 0.9;
  const topEdge = window.innerHeight * 0.1;

  if (clientX < leftEdge) {
    snapToLeft();
  } else if (clientX > rightEdge) {
    snapToRight();
  } else if (clientY < topEdge) {
    snapToTop();
  }
}

/* END OF HELPER FUNCTIONS */

/* START OF EVENT HANDLERS */

isTouchDevice();

document.addEventListener('broadway.connected', () => {
  launcher.getSettings()
    .then((res) => {
      if (res.code === 200) {
        const config = {
          enabledTabsHeaders: [],
        }
        config.enabledTabsHeaders = res.data;
        printer.handlerSettingsConfig(config);
        if (config.enabledTabsHeaders.includes('audio')) {
          $('#speakers').css('display', 'block');
        }
      }
      calculateControlBarHandlePositioning();
    });
});

document.addEventListener('printer.available', async ({ detail: { available } })  => {
  if (available){
    calculateControlBarHandlePositioning();
  }
})

document.addEventListener('speaker.available', async ({ detail: { available } })  => {
  if (available){
    calculateControlBarHandlePositioning();
  }
})


//Start (mouse down / touch start)
controlBarHandle.addEventListener(events[deviceType].down, (e) => {
  const ptr = !isTouchDevice() ? e : e.touches[0];

  const bounds = controlBarHandle.getBoundingClientRect();

  if(controlbarOnTop){
    controlbarDownClientX = ptr.clientX;
    controlbarDownOffsetX = ptr.clientX - bounds.left; 
  }
  else {
    controlbarDownClientY = ptr.clientY;
    controlbarDownOffsetY = ptr.clientY - bounds.top;
  }

  controlbarGrabbed = true;
  controlbarMoving = false;

  showControlbarHints(true);

  if (deviceType === "mouse") {
    setCapture(controlBarHandle); 
  }

  e.preventDefault();
  e.stopPropagation();
});

//Move
document.addEventListener(events[deviceType].move, moveControlbarHandle, true);

document.addEventListener(events[deviceType].up, (e) => {
  if (controlbarGrabbed && !controlbarMoving) {
    toggleControlbar(controlBar);
    e.preventDefault();
    e.stopPropagation();
  }

  controlbarGrabbed = false;
  controlbarMoving = false;
  showControlbarHints(false);
});

function moveControlbarHandle(e) {
  if (!controlbarGrabbed) return;
  
  const ptr = !isTouchDevice() ? e : e.touches[0];

  checkChangeSnapping(ptr);

  if(controlbarOnTop && !controlbarMoving) {
    if (Math.abs(ptr.clientX - controlbarDownClientX) < 3) return;
    controlbarMoving = true;
  }
  else if (!controlbarMoving) {
    if (Math.abs(ptr.clientY - controlbarDownClientY) < 3) return;
    controlbarMoving = true;
  }
  
  dragControlBarHandle(ptr);
}

function dragControlBarHandle(ptr) {
  const handleHeight = controlBarHandle.offsetHeight;
  const handleWidth = controlBarHandle.offsetWidth;
  const controlBarRect = controlBar.getBoundingClientRect();
  const margin = 10;

  if (controlbarOnTop) {
    // Absolute position
    let newX = ptr.clientX - controlbarDownOffsetX;

    // Limits
    let clampedX = Math.max(controlBarRect.left + margin,
      Math.min(newX,
        controlBarRect.left + controlBarRect.width - handleWidth - margin));

    // Relative transform
    const relativeX = clampedX - controlBarRect.left;
    controlBarHandle.style.transform = `translateX(${relativeX}px)`;
  }
  else {
    // Absolute position
    let newY = ptr.clientY - controlbarDownOffsetY;

    // Limits
    let clampedY = Math.max(controlBarRect.top + margin,
      Math.min(newY,
        controlBarRect.top + controlBarRect.height - handleHeight - margin));

    // Relative transform
    const relativeY = clampedY - controlBarRect.top;
    controlBarHandle.style.transform = `translateY(${relativeY}px)`;
  }
}

/* END OF EVENT HANDLERS */