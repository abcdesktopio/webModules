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

import * as systemMenu from './systemmenu.js';
import * as system from './system.js';
import * as languages from './languages.js';
import * as secrets from './secrets.js';

let draggedApp;

/**
 * @function openTab
 * @returns {void}
 * @desc Display apps for selected category
 */
function openTab(tabId) {
  const appListContainer = $('#appstore-applist')[0];
  const parentAppList = $('#appstore-applist')[0].parentElement;
  const clone = system.removeAllChilds($('#appstore-applist')[0], false);

  /**
    * @desc Generate apps for selected category 
  */
  for (
    const {
      cat,
      icon,
      icondata,
      id,
      launch,
      execmode,
      secrets_requirement,
      displayname,
    } of window.od.applist
  ) {

    if (typeof cat !== 'string') {
      continue;
    }

    const catParts = cat.split(',');
    for (const catPart of catParts) {
      if (catPart !== tabId) {
        continue;
      }

      //const url = window.od.net.urlrewrite(`../img/app/${icon}`);
      const url = "data:image/svg+xml;base64," + icondata;
      const li = system.getLIApp(id, launch, execmode, secrets_requirement);
      const wrapperIcon = document.createElement('div');
      const img = document.createElement('img');
      const p = document.createElement('p');
      const divAppLoader = document.createElement('div');
      const imageLock = document.createElement('img');

      li.className = 'appstore-item';
      img.src = url;

      wrapperIcon.className = 'd-flex justify-content-center align-items-center';
      wrapperIcon.appendChild(img);

      p.className = 'appname d-none d-sm-block';
      p.innerText = displayname;
      divAppLoader.className = 'container-app-loader';
      divAppLoader.setAttribute('launch', launch);
      divAppLoader.setAttribute('locked', li.getAttribute('locked'));

      imageLock.className = 'app-lock-icon';
      imageLock.src = 'img/lock.svg';

      li.appendChild(wrapperIcon);
      li.appendChild(p);
      li.appendChild(divAppLoader);
      li.appendChild(imageLock);

      clone.appendChild(li);
    }
  }

  parentAppList.replaceChild(clone, appListContainer);
  enableDrag();
  addListener();
}

/**
 * @function enableDrag
 * @returns {void}
 * @desc Make app element draggable to the dock.
 */
function enableDrag() {
  /*
    * Make application draggable
    */
  $('#appstore-applist li').draggable({
    opacity: 0.5,
    helper: 'clone',
    connectToSortable: '#dock ul',
    delay: 100,
    scroll: false,
    start(event, ui) {
      draggedApp = ui.helper[0].parentElement;
    },
    stop() {
      draggedApp = undefined;
    },
  });
}

/**
 * @function addListener
 * @returns {void}
 * @desc Add event for launching app.
 */
function addListener() {
  $('#appstore-applist li').click(function () {
    const container = this.querySelector('div.container-app-loader');
    const launchApp = () => {
      /**
       * Check if the apploader container have an apploader
       * Thus if it already has one don't run the application,
       * prevent from multipple appLoader for the same application
       */
      if (container.children.length === 0) {
        container.setAttribute('locked', this.getAttribute('locked'));
        const callbackOnAppIsRunning = () => {
          const appStoreWindow = document.querySelector('div.appstore-window');
          if (!appStoreWindow) {
            return;
          }

          const appStoreCloseButton = appStoreWindow.querySelector('button[class="bootbox-close-button close"]');

          if (appStoreCloseButton) {
            appStoreCloseButton.click();
          }
        };

        systemMenu.handleMenuClick(container, callbackOnAppIsRunning);
      }
    };

    if (this.getAttribute('locked') === 'true') {
      secrets.runAuthentication(launchApp);
    } else {
      launchApp();
    }
  });
}

/**
 * @function open
 * @returns {void}
 * @desc Open the window
 */
export const open = function () {
  const template = document.querySelector('template#appstore-window-template');
  const applicationTitle = languages.getTranslate('appstore-title');

  bootbox.dialog({
    title: applicationTitle || 'Applications',
    message: template.innerHTML,
    className: 'window-dialog appstore-window',
    onEscape: true,
    animate: false,
  });

  openTab('office');
  $('.appstore-window .content-apps .button').click(function() {
    openTab(this.id);
  });
  languages.applyLanguage();
};

/**
 * @function getDraggedApp
 * @returns {object} draggedApp
 * @desc Make app element draggable to the dock.
 */
export const getDraggedApp = function () {
  return draggedApp;
};
