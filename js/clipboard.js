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
 * @name clipboard
 * @module
 */

let cparea;
let localclip = '';

/**
 * @function init
 * @returns {void}
 * @desc Init events for clipboard.
 */
export const init = function () {
  if (navigator.permissions && navigator.permissions.query) {
    // Debug info clipboard-read
    const awaitingPermissionRead = navigator.permissions.query({ name: 'clipboard-read', allowWithoutGesture: true })
      .then((permissionStatus) => {
        // Will be 'granted', 'denied' or 'prompt':
        console.debug(`navigator.permissions.query clipboard-read:${permissionStatus.state}`);

        // Listen for changes to the permission state
        permissionStatus.onchange = () => { console.debug(permissionStatus.state); };
      })
      .catch(console.error);

    // Debug info clipboard-write
    const awaitingPermissionWrite = navigator.permissions.query({ name: 'clipboard-write', allowWithoutGesture: true })
      .then((permissionStatus) => {
        // Will be 'granted', 'denied' or 'prompt':
        console.debug(`navigator.permissions.query clipboard-write:${permissionStatus.state}`);

        // Listen for changes to the permission state
        permissionStatus.onchange = () => { console.debug(permissionStatus.state); };
      })
      .catch(console.error);

    Promise.all([awaitingPermissionRead, awaitingPermissionWrite])
      .then(() => {
        if (navigator.clipboard && navigator.clipboard.readText) {
          clipboardHandler();
        }
      });
  }

  // Keep this code, it should works, but it does not
  // This section does not work
  // clipboardchange is never received, why ?
  // if (navigator && navigator.clipboard && navigator.clipboard.addEventListener)
  // 	navigator.clipboard.addEventListener( "clipboardchange", clipboardEventHandler );
  // same as previous
  //     window.addEventListener('clipboardchange', () => {
  //                    console.log('Clipboard contents changed');
  //    });
  //

  const copypaste = document.getElementById('copypaste');
  if (copypaste) {
    cparea = copypaste.querySelector('textarea');
    copypaste.querySelector('#send').addEventListener('click', () => {
      sendClipboard();
    });
  }
};

function clipboardHandler() {
  window.addEventListener('focus', handlingClipboardChanges);
  document.addEventListener('copy', handlingClipboardChanges);
  document.addEventListener('cut', handlingClipboardChanges);

  async function handlingClipboardChanges() {
    try {
      const currentClip = await navigator.clipboard.readText();
      if (currentClip !== localclip) {
        localclip = currentClip;
        pastClipboard(currentClip);
      }
    } catch (e) {
      if (e.message !== 'Document is not focused.') {
        console.error(e);
      }
    }
  }
}

function handleCopyClipboard(clipText) {
  if (clipText !== localclip) {
    localclip = clipText;
    pastClipboard(clipText);
  }
}

function clipboardEventHandler(e) {
  console.log('clipboardEventHandler event received');
  try {
    navigator.clipboard.readText().then(handleCopyClipboard);
  } catch (e) {
    if (e.message !== 'Document is not focused.') {
      console.error(e);
    }
  }
}

/**
 * @function sendClipboard
 * @returns {void}
 * @desc Send string to container clipboard and clear textarea
 *
 */
function sendClipboard() {
  if (cparea) {
    pastClipboard(cparea.value);
    cparea.value = '';
  }
}

/**
 * @function pastClipboard
 * @returns {void}
 * @desc Send string to container clipboard.
 *
 */
function pastClipboard(text) {
  window.od.broadway.syncClipBoardtoAbcDesktop(text);
}

/**
 * @function sendClipboard
 * @returns {void}
 * @desc Get string from container clipbard.
 *
 */
export const getClipboard = function (data) {
  cparea.value = data;
  // send notification to plugin
  window.postMessage({ action: 'copyClipboard', data });
};
