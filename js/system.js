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

import * as languages from './languages.js';
import { broadcastEvent } from './broadcastevent.js';
import * as secrets from './secrets.js';

/**
 * @function horloge
 * @param  {object} el HTML element
 * @return {void}
 * @desc Init horloge
 */
export function horloge(el) {
  let elhtml = document.getElementById(el);

  function actualiser() {
    const date = new Date();
    let str = date.getHours();
    const min = date.getMinutes();
    str += `:${min < 10 ? '0' : ''}${min}`;
    if (elhtml) {
      const p = document.createElement('p');
      p.innerText = str;
      elhtml = removeAllChilds(elhtml);
      elhtml.appendChild(p);
    }
  }
  actualiser();
  setInterval(actualiser, 60000);
}

/**
 * @function activeWindow
 * @global
 * @params {object} elem HTML element
 * @returns {void}
 * @desc Add selected-window to the element.
 */
export function activeWindow(elem) {
  const windows = document.querySelectorAll('.window');
  for (let i = 0; i < windows.length; i++) {
    windows[i].classList.remove('selected-window');
  }
  if (elem) { elem.classList.add('selected-window'); }
}

/**
 * @function show
 * @global
 * @params {object} elem HTML element
 * @returns {void}
 * @desc Display block element.
 */
export function show(elem) {
  if (elem) {
    elem.style.display = 'block';
    return true;
  }

  return false;
}

/**
 * @function hide
 * @global
 * @params {object} elem HTML element
 * @returns {void}
 * @desc Display none element.
 */
export function hide(elem) {
  if (elem) { elem.style.display = 'none'; }
}

/**
 * @function updateNbConnect
 * @global
 * @params {integer} number
 * @returns {void}
 * @desc Update number of connected session on the top bar.
 */
export function updateNbConnect(number) {
  const share = document.getElementById('share');
  const num = document.getElementById('nb');
  if (share && num) {
    num.innerText = number;
    if (number > 1) {
      share.style.display = 'block';
      num.style.display = 'block';
    } else {
      share.style.display = 'none';
      num.style.display = 'none';
    }
  }
}

/**
 * @function takeScreenshot
 * @global
 * @returns {void}
 * @desc Take a screenshot and download it.
 */
export function takeScreenshot() {
  const canvas = document.getElementById('noVNC_canvas');
  const screenShotTitle = languages.getTranslate('screen-shot-title');
  const screenShotDownload = languages.getTranslate('screen-shot-download');

  bootbox.dialog({
    title: screenShotTitle || 'Screenshot',
    message: '<img id="screenImg" src=""/>',
    className: 'window-dialog',
    onEscape: true,
    backdrop: true,
    buttons: {
      cancel: {
        label: screenShotDownload || 'Download',
        className: 'window-button',
        callback: () => {
          const date = new Date();
          window.download(canvas.toDataURL('image/jpeg'), `desktop_${date.toISOString()}.jpg`, 'image/jpeg');
        },
      },
    },
    animate: false,
  });

  if (canvas) {
    const img = document.getElementById('screenImg');
    if (img) {
      img.src = canvas.toDataURL('image/jpeg');
    }
  }
}

/**
 * @function setUsername
 * @global
 * @param {string} name Username
 * @return {void}
 * @desc Display username on the top bar.
 */
export function setUsername(name) {
  if (!name) {
    name = 'undefined';
    console.error('system.js:setUsername name is undefined');
  }
  if (name.indexOf('@') !== -1) {
    name = name.slice(0, name.indexOf('@'));
  }

  const htmlusername = document.getElementById('username');
  if (htmlusername) { htmlusername.textContent = name; }
}

/**
 * @function addAppLoader
 * @param {object} element HTML Element
 * @returns {void}
 * @desc Create a temporary loader icon of application in the dock.
 */
export const addAppLoader = function (element) {
  const loader = document.createElement('img');
  loader.src = window.od.net.urlrewrite('/img/loader.svg');
  loader.className = 'appLoader';
  if (element) { element.appendChild(loader); }
};

/**
 * @function removeAppLoader
 * @param {object} element HTML Element
 * @returns {void}
 * @desc Remove loader icon of application in the dock.
 */
export const removeAppLoader = function (element) {
  if (element) {
    const el = element.querySelector('.appLoader');
    if (el) { element.removeChild(el); }
  }
};

/**
 * @function removeAllChilds
 * @param {HTMLElement} elt
 * @param {boolean} replaceInParent
 * @desc Allow to remove all childs of an html element
 */
export const removeAllChilds = (elt, replaceInParent = true) => {
  const clone = elt.cloneNode(true);
  while (clone.childNodes.length) {
    clone.removeChild(clone.childNodes[0]);
  }

  if (replaceInParent) {
    elt.parentNode.replaceChild(clone, elt);
  }

  return clone;
};

const getJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
};

export const checkError = async (res) => {
  if (res.ok) {
    return res;
  }

  let content;

  try {
    content = await res.text();
  } catch (e) {
    throw res;
  }

  let json = null;
  if (json = getJSON(content)) {
    throw json;
  } else {
    throw content;
  }
};

export function getCardWrappers() {
  const cardContainer = document.createElement('div');
  const cardBody = document.createElement('div');
  cardContainer.className = 'card';
  cardContainer.style = 'margin-top:15px; overflow-x:auto;';
  cardBody.className = 'card-body d-flex';
  cardContainer.appendChild(cardBody);
  return {
    cardContainer,
    cardBody,
  };
}

/**
 * 
 * @param {string} id 
 * @param {string} launch 
 * @param {string} execmode 
 * @param {string[]} secrets_requirement 
 * @returns {HTMLLIElement}
 */
export function getLIApp(
  id = '',
  launch = '',
  execmode  = '',
  secrets_requirement = [],
) {
  const li = document.createElement('li');
  li.id = id;
  li.setAttribute('locked', 'false');
  li.setAttribute('launch', launch);

  if (execmode === 'frontendjs') {
    li.setAttribute('execmode', execmode);
  }

  if (Array.isArray(secrets_requirement)) {
    if (secrets.needAuthorizationForSecrets(secrets_requirement)) {
      li.setAttribute('locked', 'true');
    }
    li.setAttribute('secrets_requirement', JSON.stringify(secrets_requirement));
  } else {
    li.setAttribute('secrets_requirement', JSON.stringify([]));
  }

  return li;
}

broadcastEvent.addEventListener('connect.counter', ({ detail: { connectCounter } }) => updateNbConnect(connectCounter));
