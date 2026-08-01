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
import * as languages from './languages.js';
import * as secrets from './secrets.js';
import * as launcher from './launcher.js';
import * as webshell from './webshell.js';

let appstore_dialog;
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
      sha_id,
      created,
    } of window.od.applist
  ) {

    if (typeof cat !== 'string') {
      // continue;
      cat = 'Office';
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

      li.setAttribute('data-bs-toggle', 'tooltip');
      li.setAttribute('data-bs-html', 'true');
      li.setAttribute('data-bs-title', 
        `<p class="tooltipTitle"><b class="tooltipTitle">Launch :</b> ${launch}<br>
        <b class="tooltipTitle">ID :</b> ${sha_id}<br>
        <b class="tooltipTitle">Created :</b> ${created}</p>`);

      li.appendChild(wrapperIcon);
      li.appendChild(p);
      li.appendChild(divAppLoader);
      li.appendChild(imageLock);

      clone.appendChild(li);
    }
  }

  parentAppList.replaceChild(clone, appListContainer);

  addListener();

   // Initialize Bootstrap tooltips
   const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
   tooltipTriggerList.forEach(function (tooltipTriggerEl) {
     new bootstrap.Tooltip(tooltipTriggerEl);
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

          const appStoreCloseButton = appStoreWindow.querySelector('.bootbox-close-button');

          if (appStoreCloseButton) {
            appStoreCloseButton.click();
          }
        };

        handleMenuClick(container, callbackOnAppIsRunning);
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
 * @function handleMenuClick
 * @param {object} clickedApp HTML element you clicked on inside the dock.
 * @param {Function} onAppIsRunning Optional callback called when the application is running
 * @returns {void}
 * @desc Check if your application is HTML or X11 application.
 */
export const handleMenuClick = function (clickedApp, onAppIsRunning = () => {}) {
  if (clickedApp.attributes.launch.value === 'keyboard') {
    window.od.broadway.showVirtualKeyboard();
  }

  // look for the applications myapptolaunch
  const myapptolaunch =  window.od.applist.find(
        ({ launch }) => clickedApp.attributes.launch.value === launch
  );

  // myapptolaunch is found, check properties
  if (myapptolaunch) {
    if (myapptolaunch.execmode === 'builtin') {
      launcher.launch(myapptolaunch.launch, '', clickedApp);
    } else
      if (myapptolaunch.execmode === 'frontendjs') {
        switch (clickedApp.attributes.launch.value) {
          case 'frontendjs.webshell':
            webshell.open();
            break;
          default:
            errorMessage.open();
            break;
        }
    } else {
      // This myapptolaunch is a docker image
      if (clickedApp.getAttribute('locked') === 'false') {
        launchDockerApplication();
        
      } else {
        secrets.runAuthentication(launchDockerApplication);
      }
    }
  }

 function launchDockerApplication() {
    const runDict = { image: myapptolaunch.id, args: '' };
    launcher.ocrun(runDict, clickedApp, onAppIsRunning);
    close();
  }
};


/**
 * @function filterAppList
 * @param {string} query Text typed in the search input.
 * @returns {void}
 * @desc Show/hide the currently displayed apps that match the search query.
 */
function filterAppList(query) {
  const needle = query.trim().toLowerCase();
  $('#appstore-applist > li').each(function () {
    const name = this.querySelector('p.appname');
    const match = !needle || (name && name.innerText.toLowerCase().includes(needle));
    this.style.display = match ? '' : 'none';
  });
}

/**
 * @function close
 * @returns {void}
 * @desc Close the window
 */
export const close = function () {
  if (appstore_dialog) {
    appstore_dialog.modal('hide');  
  }
}



/**
 * @function open
 * @returns {void}
 * @desc Open the window
 */
export const open = function () {
  const applicationtemplateTitle = document.querySelector('template#appstore-window-title-template');
  const template = document.querySelector('template#appstore-window-template');
  const applicationTitle = languages.getTranslate('appstore-title');

  appstore_dialog = bootbox.dialog({
    title: applicationtemplateTitle.innerHTML,
    message: template.innerHTML,
    className: 'window-dialog appstore-window',
    closeButton: false, // Removes the top-right 'X' close button
    onEscape: true,
    animate: false,
  });

  $('.appstore-window .content-apps .button').click(function() {
    openTab(this.id);
  });

  const tabButtons = appstore_dialog.find('.content-apps .button');
  const searchInput = appstore_dialog.find('#appstore-search-placeholder');

  tabButtons.filter('#office').addClass('active');
  tabButtons.on('click', function () {
    tabButtons.removeClass('active');
    $(this).addClass('active');
    searchInput.val('');
    filterAppList('');
  });

  searchInput.on('input', function () {
    filterAppList(this.value);
  });

  languages.applyLanguage();

  const close_btn = document.getElementById('appstore-close-button');
  if (close_btn) {
    close_btn.addEventListener('click', close );
  }
  
  openTab('office'); // default tab to open when the appstore is opened

  };

