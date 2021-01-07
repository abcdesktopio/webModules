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
 * @name broadcastSystem
 * @module
 */

import { broadcastEvent } from './broadcastevent.js';
import * as launcher from './launcher.js';
import { checkError } from './system.js';

let wsbroadcast;

/**
 * @function open
 * @params {object} jsonParameters
 * @params {callback} callback
 * @return {void}
 * @desc Open the broadcast WebSocket
 */
function open(jsonParameters, callback = () => { }) {
  const path = `/broadcast?${window.od.currentUser.authorization}`;
  const broadcasturl = window.od.net.getwsurl(path);
  wsbroadcast = new WebSocket(broadcasturl);

  wsbroadcast.onerror = () => {
    console.info('Failed to connect to broadcast service');
  };

  wsbroadcast.onopen = () => {
    // console.log('wsbroadcast.open');
    console.log(jsonParameters);
    wsbroadcast.send(jsonParameters);
  };

  wsbroadcast.onmessage = callback;
}

/**
 * @function close
 * @return {void}
 * @desc Close the broadcast WebSocket
 */
export const close = () => {
  if (wsbroadcast) {
    wsbroadcast.close();
  }
  wsbroadcast = null;
};

/**
 * @function connect
 * @param  {callback} callback
 * @return {void}
 * @desc Manage broadcast events
 */
export const connect = () => {
  close();
  const jsonParameters = JSON.stringify({
    method: 'hello',
    user: window.od.currentUser,
  });
  open(jsonParameters, (msgevent) => {
    const msg = JSON.parse(msgevent.data);
    console.log(`broadcastSystem:msgevent: ${msg.method}`);
    if (msg.method === 'hello') {
      broadcastEvent.dispatchEvent(
        new CustomEvent('hello', { detail: { user: msg.user } }),
      );
    }
    if (msg.method === 'bye') {
      broadcastEvent.dispatchEvent(
        new CustomEvent('bye', { detail: { user: msg.user } }),
      );
    }
    if (msg.method === 'proc.started') {
      broadcastEvent.dispatchEvent(
        new CustomEvent('proc.started', { detail: { appStarted: msg.data } }),
      );
    }

    if (msg.method === 'proc.killed') {
      broadcastEvent.dispatchEvent(
        new CustomEvent('proc.killed', { detail: { procKilled: msg.data } }),
      );
    }
    if (msg.method === 'keepalive') {
      // Nothing to do
    }
    if (msg.method === 'window.list') {
      broadcastEvent.dispatchEvent(
        new CustomEvent('window.list', { detail: { windowList: msg.data } }),
      );
    }
    if (msg.method === 'printer.new') {
      console.log('printer', msg);
      broadcastEvent.dispatchEvent(
        new CustomEvent('printer.new', { detail: { data: msg.data } }),
      );
    }

    if (msg.method === 'download') {
      console.log('download', msg);
      const {
        files: [file],
      } = msg.data;
      const url = `/filer?${new URLSearchParams({ file })}`;
      const headers = new Headers();
      headers.append(
        'Authorization',
        `Bearer ${window.od.currentUser.authorization}`,
      );
      const options = {
        headers,
      };

      fetch(url, options)
        .then(checkError)
        .then((res) => res.blob())
        .then((blobZipFile) => {
          const urlBlob = URL.createObjectURL(blobZipFile);
          const a = document.createElement('a');
          a.href = urlBlob;
          a.target = '_blank';
          const parts = file.split('/');
          const name = parts[parts.length - 1];

          if (blobZipFile.type === 'application/zip') {
            a.download = `${name}.zip`;
          } else if (file.includes('/')) {
            a.download = name;
          } else {
            a.download = file;
          }

          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(urlBlob);
        });
    }

    if (msg.method === 'logout') {
      launcher.logout(msg.data);
    }

    if (msg.method === 'ocrun') {
      console.log(msg.data);
      broadcastEvent.dispatchEvent(
        new CustomEvent('ocrun', { detail: { data_dict: msg.data } }),
      );
    }

    if (msg.method === 'connect.counter') {
      broadcastEvent.dispatchEvent(
        new CustomEvent('connect.counter', {
          detail: { connectCounter: msg.data },
        }),
      );
    }

    if (msg.method === 'display.setBackgroundBorderColor') {
      broadcastEvent.dispatchEvent(
        new CustomEvent('display.setBackgroundBorderColor', {
          detail: { color: msg.data },
        }),
      );
    }
  });
};

/**
 * @function broadwayconnected
 * @param  {event} myevent
 * @return {void}
 * @desc Callback for broadwayconnected event
 */
export const broadwayconnected = () => {
  // console.log('broadcastSystem:broadwayconnected event call back');
  connect();
};

/**
 * @function broadwayconnected
 * @param  {event} myevent
 * @return {void}
 * @desc Callback for broadwaydisconnected event
 */
export const broadwaydisconnected = () => {
  // console.log('broadcastSystem:broadwaydisconnected event call back');
  close();
};

/**
 * @function init
 * @return {void}
 * @desc Get proclist from os.py and create event listener on broadway connect and disconnect.
 */
export const init = () => {
  wsbroadcast = null;
  document.addEventListener('broadway.connected', broadwayconnected);
  document.addEventListener('broadway.disconnected', broadwaydisconnected);
};
