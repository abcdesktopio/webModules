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

import * as system from './system.js';
import { broadcastEvent } from './broadcastevent.js';

/**
 * @name printSystem
 * @module
 */

/**
 * @function doPrint
 * @param {url} url URL to PDF File
 * @returns {void}
 * @desc Start local print from PDF file.
 *
 */
export const doPrint = (file) => {
  const endpoint = '/printerfiler';
  const params = new URLSearchParams({ file });
  const url = `${endpoint}?${params}`;

  const headers = new Headers();
  headers.append('ABCAuthorization', `Bearer ${window.od.currentUser.authorization}`);

  const req = {
    mathod: 'GET',
    headers,
  };

  return fetch(window.od.net.urlrewrite(url), req)
    .then(system.checkError)
    .then((res) => res.blob())
    .then((response) => {
      const blob = response.slice(0, response.size, 'application/pdf');
      const dataUrl = URL.createObjectURL(blob);
      const iframe = document.getElementById('framePDF');
      if (!iframe) {
        console.error('ElementbyId framePDF doesnot exist, print support disable');
        return;
      }

      iframe.src = dataUrl;
      iframe.onload = () => {
        setTimeout(() => {
          iframe.focus();
          try {
            iframe.contentWindow.print();
          } catch (e) {
            // print function failed
            // send notification to print the file manualy
            window.open(iframe.src);
          }
        }, 1);
      };
      iframe.blur();
    })
    .catch((e) => {
      console.error(`Download pdf file failed : ${e}`);
      return e;
    });
};

broadcastEvent.addEventListener('printer.new', ({ detail: { data } }) => {
  if (data && data.newfile === true) {
    doPrint(`~/${data.path}`);
  }
});
