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
import * as printSystem from './printSystem.js';
import * as system from './system.js';
import { broadcastEvent } from './broadcastevent.js';

let self;
let ul;
let enable = false;
let settingsConfigProvided = false;
let tryedToGetFilesBeforSettingsConfig = false;
export let hasFiles = false;

/**
 * @function init
 * @return {void}
 * @desc Get files in printer-queue
 */
export const init = function () {
  self = document.getElementById('printer');
  if (self) {
    ul = self.querySelector('ul');
    if (ul) {
      document.addEventListener('broadway.connected', getFiles);
    }
  }
};

/**
 * @function showFiles
 * @param  {object} files  File list
 * @return {void}
 * @desc Display files on DOM.
 */
export const showFiles = function (files) {
  let url; let path;
  if (!enable) return;

  ul = system.removeAllChilds(ul);
  if (files.length === 0) {
    hasFiles = false;
    return;
  }
  hasFiles = true;

  const fragment = document.createDocumentFragment();
  for (const file of files) {
    const li = document.createElement('li');
    const leftContainer = document.createElement('div');
    const p = document.createElement('p');
    const imgLeft = document.createElement('img');
    const del = document.createElement('div');
    const imgDel = document.createElement('img');

    leftContainer.className = 'left-container';

    url = '../img/top/printer.svg';
    url = window.od.net.urlrewrite(url);
    imgLeft.src = url;

    path = `/home/balloon/.printer-queue/${file}`;
    path = window.od.net.urlrewrite(path);

    p.setAttribute('path', path);
    p.className = 'fileName';
    p.innerText = files;

    del.className = 'deletePrint';
    url = '../img/folder/close.svg';
    url = window.od.net.urlrewrite(url);
    imgDel.src = url;

    del.setAttribute('name', file);
    del.addEventListener('click', function () {
      removeFile(this.attributes.name.value);
    });

    p.addEventListener('click', function () {
      printSystem.doPrint(this.attributes.path.value);
    });

    p.appendChild(imgLeft);
    del.appendChild(imgDel);

    leftContainer.appendChild(imgLeft);
    leftContainer.appendChild(p);

    li.appendChild(leftContainer);
    li.appendChild(del);
    fragment.appendChild(li);
  }
  ul.appendChild(fragment);
};

/**
 * @function getFiles
 * @return {void}
 * @desc List files in printer-queue
 */
export const getFiles = function () {
  if (!enable) {
    if (!settingsConfigProvided) {
      tryedToGetFilesBeforSettingsConfig = true;
    }
    return;
  }

  const xhr = new XMLHttpRequest();
  const url = window.od.net.urlrewrite('/printerfiler/directory/list');
  xhr.open('GET', `${url}?directory=/home/balloon/.printer-queue`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('ABCAuthorization', `Bearer ${window.od.currentUser.authorization}`);
  xhr.onreadystatechange = () => {
    if (xhr.status === 200
        && xhr.readyState === 4
        && xhr.response) {
      try {
        const files = JSON.parse(xhr.response);
        showFiles(files);
      } catch (e) {
        console.error(e);
      }
    }
  };
  xhr.onerror = () => {
    console.log('list .printer-queue access failed');
  };
  xhr.send();
};

/**
 * @function removeFile
 * @param  {string} file file name
 * @return {void}
 * @desc Delete file from printer-queue.
 */
export const removeFile = function (file) {
  if (!enable) return;
  if (file) {
    const xhr = new XMLHttpRequest();
    const url = window.od.net.urlrewrite('/printerfiler');
    xhr.open('DELETE', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('ABCAuthorization', `Bearer ${window.od.currentUser.authorization}`);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        getFiles();
      }
    };
    xhr.send(JSON.stringify({
      file: `/home/balloon/.printer-queue/${file}`,
    }));
  }
};

broadcastEvent.addEventListener('printer.new', ({ detail: { data } }) => {
  if (data && data.newfile === true) {
    getFiles();
  }
});

broadcastEvent.addEventListener('printer.available', ({ detail: { available } }) => {
  console.log( `printer.available=${available}` );
  enable = available;
  const printer = document.querySelector('#printer');
  const printerIcon = document.querySelector('#printer img');
  if (!printer) return;
  if (!printerIcon) return;
  if (available) {
    printer.style.display = 'block';
    printerIcon.src = '../img/top/printer.svg';
  } else {
    printerIcon.src = '../img/top/printer_None.svg';
  }
});

export const handlerSettingsConfig = (config) => {
  if (config.enabledTabsHeaders.includes('printers')) {
    enable = true;
    settingsConfigProvided = true;
    const printer = document.querySelector('#printer');
    if (printer)
       printer.style.display = 'block';
    const printerIcon = document.querySelector('#printer img');
    if (printerIcon) {
      printerIcon.src = '../img/top/printer.svg';
    }
    if (tryedToGetFilesBeforSettingsConfig) {
      getFiles();
    }
  }
};
