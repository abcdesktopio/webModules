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
import * as notificationSystem from './notificationsystem.js';
import * as languages from './languages.js';

/**
 * @name clipboard
 * @module
 */

let cparea;
let localclip = '';

const initNavigatorPermission = function (acceptcuttext, sendcuttext) {
  if (!acceptcuttext && !sendcuttext ) {
    // nothing to do acceptcuttext and sendcuttext are disabled
    return;
  }

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

    let promisePermissionsArray = [] //  [awaitingPermissionRead, awaitingPermissionWrite]
    if (acceptcuttext) 
      promisePermissionsArray.concat( awaitingPermissionRead );

    if (sendcuttext)
      promisePermissionsArray.concat( awaitingPermissionWrite );

    Promise.all(promisePermissionsArray)
      .then(() => {
        if (navigator.clipboard && navigator.clipboard.readText) {
          // handler start here 
          clipboardHandler();
        }
      });
  }
}


/**
 * @function init
 * @returns {void}
 * @desc Init events for clipboard.
 */
export const init = function () {
  // we keep this code commented but it should works, but it does not
  // This section does not work
  // clipboardchange is never received, why ?
  //
  // if (navigator && navigator.clipboard && navigator.clipboard.addEventListener)
  // 	navigator.clipboard.addEventListener( "clipboardchange", clipboardEventHandler );
  // same as previous
  //     window.addEventListener('clipboardchange', () => {
  //                    console.log('Clipboard contents changed');
  //    });
  //
  //
  const copypaste = document.getElementById('copypaste');
  if (copypaste) {
    launcher.getenv().then( (data) => {
      // copypaste.style.display is hidden by default
      if (data && data.env) {
        const noacceptcuttext = (data.env.ACCEPTCUTTEXT === 'disabled');
        const nosendcuttext   = (data.env.SENDCUTTEXT   === 'disabled');
        if ( noacceptcuttext )  { console.info('ACCEPTCUTTEXT is disabled by env, in the desktop'); }
        if ( nosendcuttext )    { console.info('SENDCUTTEXT is disabled by env, in the desktop');   }
        if ( noacceptcuttext && nosendcuttext ) {
          // nothing to do
          console.info('All clipboard CUTTEXT features are disabled by env, no clipboard icon on top');
          // filerservice is disabled 
          notificationSystem.displayNotification(  languages.getTranslate('clipboard'), languages.getTranslate('clipboard-disabled') , 'deny', undefined, undefined, -1 );
          return;
        }
        
        initNavigatorPermission( !noacceptcuttext, !nosendcuttext );
        copypaste.style.display = 'block';  // show copypaste	icon
        cparea = copypaste.querySelector('textarea');
        // if the server does not accept cut text
        if (noacceptcuttext) {
          // remove the send button
          const sendbtn = copypaste.querySelector('#send');
          if (sendbtn && cparea && cparea.style) {
            sendbtn.remove();
            // update the width and the maxWidth of the textarea
            // to reuse the size of the removed send button
            cparea.style.width = '260px';
            cparea.style.maxWidth = cparea.style.width;
          }
        } // if the serveraccept cut text
        else {
          // bind click event to sendClipboard
          copypaste.querySelector('#send').addEventListener('click', () => { sendClipboard(); });
        }
      }
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
  if (cparea) {
  	cparea.value = data;
  	// send notification to plugin
  	window.postMessage({ action: 'copyClipboard', data });
  }
};
