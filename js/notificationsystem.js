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

/*
 * Notif creation pattern =>
  notificationSystem.displayNotification('Title','Message',['Type'],['Icon']);
 * 3 predefined type with predefined icon : error , warning , info
 *
 */

/**
 * @name NotificationSystem
 * @module
 */

import { broadcastEvent } from './broadcastevent.js';
import * as languages from './languages.js';

let currentNotif = 0;

/**
 * @function displayNotification
 * @returns {void}
 * @desc Create and display a notification
 * @param  {string} title Title
 * @param  {string} desc  Description
 * @param  {string} type   Type for predefined notification
 * @param  {url} img   Custom icon
 * @param  {url} url   Link on click
 * @example notificationSystem.displayNotification('Title','Message','error');
 * Predifined type and icon, there is 4 predefined type with predefined icon :
 * error , warning , info, place
 * @example notificationSystem.displayNotification('Title','Message','','myicon.png');
 * // Personnal icon
 */
export const displayNotification = function (title, desc, type, img, url, duration) {
  const mydelay = (duration) || 3000;
  if (currentNotif >= 6) {
    currentNotif = 0;
  }
  for (let i = 1; i <= 6; i++) {
    if ($(`#notification${i}`).attr('style') === 'display: none;') {
      $(`#notification${i}`).remove();
    }
  }
  switch (type) {
    case 'error':
      img = '../img/error/error.svg';
      break;
    case 'warning':
      img = '../img/error/warning.svg';
      break;
    case 'info':
      img = '../img/error/info.svg';
      break;
    case 'deny':
      img = '../img/error/deny.svg';
      break;
    case 'place':
      img = '../img/top/place-available.svg';
      break;
    default:
      break;
  }

  img = window.od.net.urlrewrite(img);
  if (url) { url = window.od.net.urlrewrite(url); }
  currentNotif++;

  const notif = {
    img,
    title,
    desc,
    type,
    url,
    delay: mydelay,
  };

  showNotification(notif);
};

/**
 * @function showNotification
 * @returns {void}
 * @desc Show the last created notification.
 *
 */
export const showNotification = function (notif) {
  const closeNotifBtn = languages.getTranslate('notification-close-notif-btn');
  const myNotif = document.createElement('div');
  myNotif.style.display = 'none';
  myNotif.classList.add('notification');
  myNotif.id = `notification${currentNotif}`;

  const divContainer = document.createElement('div');
  const divRow = document.createElement('div');
  const divFirstCol = document.createElement('div');
  const img = document.createElement('img');
  const pTitle = document.createElement('p');
  const pDescription = document.createElement('p');
  const divSecondCol = document.createElement('div');
  const span = document.createElement('span');

  divContainer.className = 'container h-100';
  divRow.className = 'row h-100';

  divFirstCol.className = 'col-10';
  img.src = notif.img;
  pTitle.className = 'title';
  pTitle.innerText = notif.title;

  pDescription.className = 'description';
  pDescription.innerText = notif.desc;

  divFirstCol.appendChild(img);
  divFirstCol.appendChild(pTitle);
  divFirstCol.appendChild(pDescription);

  divSecondCol.className = 'col-xl-2 col-lg-2 d-xl-flex d-lg-flex d-none justify-content-center align-items-center close-notification';
  span.className = 'closeNotif';
  span.setAttribute('data-notif', `notification${currentNotif}`);
  span.style.cursor = 'pointer';
  span.innerText = closeNotifBtn || 'Close';

  divSecondCol.appendChild(span);

  divRow.appendChild(divFirstCol);
  divRow.appendChild(divSecondCol);
  divContainer.appendChild(divRow);
  myNotif.appendChild(divContainer);

  // If notif contains URL create link.
  if (notif.url) {
    myNotif.addEventListener('click', () => {
      window.open(notif.url, '_blank');
    });
  }
  const panel = document.querySelector('.notifyPanel');
  if (panel) {
    panel.appendChild(myNotif);
    Array.from(document.querySelectorAll('.closeNotif'))
      .map((c) => $(c))
      .forEach((close) => close.click(() => $(`#${close.data('notif')}`).hide('slide', { direction: 'right' })));
    const notificationElt = $(`#notification${currentNotif}`);
    notificationElt.show('slide', { direction: 'right' });
    setTimeout(() => {
      notificationElt.hide('slide', { direction: 'right' });
    }, notif.delay);
  }
};

broadcastEvent.addEventListener('hello', ({ detail: { user } }) => {
  // the mime image type can be jpeg or png, do not set the image format
  // replace user.photo ? `data:image/png;base64, ${user.photo}` : '../img/top/place-available.svg';
  // by user.photo ? `data:;base64, ${user.photo}` : '../img/top/place-available.svg';
  // the image format depend on ldap storage attribut value
  const picture = user.photo ? `data:;base64,${user.photo}` : window.od.net.urlrewrite('../img/top/place-available.svg');
  displayNotification(user.name, 'Connected', '', picture);
});

broadcastEvent.addEventListener('bye', ({ detail: { user } }) => {
  // the mime image type can be jpeg or png, do not set the image format
  // replace user.photo ? `data:image/png;base64, ${user.photo}` : '../img/top/place-available.svg';
  // by user.photo ? `data:;base64, ${user.photo}` : '../img/top/place-available.svg';
  // the image format depend on ldap storage attribut value
  const picture = user.photo ? `data:;base64,${user.photo}` : window.od.net.urlrewrite('../img/top/place-available.svg');
  displayNotification(user.name, 'Disconnected', '', picture);
});
