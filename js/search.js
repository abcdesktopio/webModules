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
 * @name searchSystem
 * @module
 */
import * as systemMenu from './systemmenu.js';
import * as launcher from './launcher.js';
import * as system from './system.js';
import * as languages from './languages.js';
import * as tipsinfo from './tipsinfo.js';

const cache = {};
export let draggedApp;
let overlay;
let _this; let appZone; let fileZone; let searchBar; let
  closeZone;
let enable = true;
let abortController;

/**
 * @function init
 * @returns {void}
 * @desc Add event for dock's search bar and filter keycode for different feature.
 *
 */
export const init = function () {
  _this = document.getElementById('searchZone');
  if (!_this) {
    enable = false;
    console.log('searchZone is disabled');
    return;
  }
  appZone = _this.querySelector('#appZone');
  fileZone = _this.querySelector('#fileZone');
  searchBar = document.getElementById('searchBar');
  closeZone = document.getElementById('closeZone');

  languages.applyLanguage();

  if (closeZone) {
    closeZone.addEventListener('click', () => {
      close();
    });
  }

  if (searchBar) {
    searchBar.addEventListener('focus', () => {
      createOverlayClose();
    });

    searchBar.addEventListener('keyup', function (e) {
      // Press ENTER : Launche File or App if there is only one result
      if (e.keyCode === 13) {
        const app = document.querySelectorAll('#searchZone .icon.app');
        const file = document.querySelectorAll('#searchZone .icon.file');
        if (app.length === 1 && file.length === 0) {
          app[0].click();
        } else if (app.length === 0 && file.length === 1) {
          file[0].click();
        }
      } else {
        // Press ESCAPE : End search
        if (e.keyCode === 27) {
          close();
        } 
        // if value is not empty
        else if (this.value !== '') {
          const pattern = new RegExp(`^${this.value}`, 'i');
          const apps = window.od.applist.filter((app) => (
            typeof app.keyword === 'string'
                && app.keyword.split(',').some((keyword) => pattern.test(keyword))
          ));

          // Clear last search
          $('#searchZone #appZone li').remove();
          $('#searchZone #fileZone li').remove();

          let url;
          // Add new Apps search result
          for (const { cat, icon, icondata, id, displayname, launch, execmode, secrets_requirement } of apps) {
            if (cat) {
              const li = system.getLIApp(id, launch, execmode, secrets_requirement);
              const iconApp = document.createElement('img');
              const nameApp = document.createElement('div');
              const iconLock = document.createElement('img');

              li.className = `icon app ${cat[0]}`;
              // url = window.od.net.urlrewrite(`../img/app/${icon}`);
              url = "data:image/svg+xml;base64," + icondata;
              iconApp.src = url;
              nameApp.className = 'appname';
              nameApp.innerText = displayname;
              iconLock.className = 'search-lock-icon';
              iconLock.src = 'img/lock.svg';

              li.appendChild(iconApp);
              li.appendChild(nameApp);
              li.appendChild(iconLock);

              li.addEventListener('click', function () {
                if (abortController) {
                  console.log('Previous search cancel by click in app zone');
                  abortController.abort();
                }
                hideFileZone();
                systemMenu.handleMenuClick(this);
                close();
              });
              appZone.appendChild(li);
            }
          }
          if (apps.length > 0) {
            showAppZone();
          } else {
            hideAppZone();
          }
          if (abortController) {
            abortController.abort();
          }

          // File search
          abortController = new AbortController();
          launcher
            .filesearch(this.value, abortController)
            .then(({ data: files }) => {
              const fragment = document.createDocumentFragment();
              for (const file of files) {
                if (fileZone.children.length <= 30) {
                  const li = document.createElement('li');
                  li.className = 'icon file';
                  li.setAttribute('launch', file.file);
                  li.setAttribute('mime', file.mime);
                  let name = file.file.split('/');
                  name = name[name.length - 1];
                  let img;
                  if (file.mime) {
                    img = file.mime.split('/').join('-');
                  } else {
                    img = 'unknown';
                  }

                  if (cache[img]) {
                    const imgElt = document.createElement('img');
                    const div = document.createElement('div');
                    imgElt.src = cache[img].img;

                    div.className = 'appname';
                    div.innerText = name;
                    li.style.border = cache[img].color;

                    li.appendChild(imgElt);
                    li.appendChild(div);
                  } else {
                    const div = document.createElement('div');
                    div.className = 'appname';
                    div.innerText = name;
                    li.appendChild(div);
                    checkImg(img, li);
                  }

                  li.addEventListener('click', function () {
                    const path = this.attributes.launch.value;
                    const run_dict = {
                      image: this.attributes.mime.value,
                      args: path,
                    };
                    launcher.ocrun(run_dict);
                    close();
                  });
                  fragment.appendChild(li);
                }
              }

              fileZone.appendChild(fragment);
              if (fileZone.children.length > 1) {
                showFileZone();
              } else {
                hideFileZone();
              }
            })
            .catch((e) => {
              if (e.message
                && e.message !== 'The user aborted a request.') {
                console.error(e);
              }
            });
        } else {
          if (abortController) {
            abortController.abort();
          }

          hideAppZone();
          hideFileZone();
          hideCloseZone();
        }
      }
      enableDrag();
    });
  }
};

/**
 * @function showFileZone
 * @returns {void}
 * @desc Show File section.
 *
 */
function showFileZone() {
  system.show(fileZone);
  system.show(closeZone);
}

/**
 * @function showAppZone
 * @returns {void}
 * @desc Show App section.
 *
 */
function showAppZone() {
  system.show(appZone);
  system.show(closeZone);
}

/**
 * @function hideCloseZone
 * @returns {void}
 * @desc Hide Close div
 */
function hideCloseZone() {
  system.hide(closeZone);
}

/**
 * @function hideFileZone
 * @returns {void}
 * @desc Hide File section.
 *
 */
function hideFileZone() {
  if (fileZone) system.hide(fileZone);
}
/**
 * @function hideAppZone
 * @returns {void}
 * @desc Hide App section.
 *
 */
function hideAppZone() {
  system.hide(appZone);
}

/**
 * @function createOverlayClose
 * @returns {void}
 * @desc Create element for closing search result by clicking out of the frame.
 *
 */
function createOverlayClose() {
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'overlayClose';
    overlay.style.position = 'absolute';
    overlay.style.height = '100%';
    overlay.style.width = '100%';
    overlay.style.top = '0';
    overlay.addEventListener('click', close);
    document.body.appendChild(overlay);
  }
}

/**
 * @function close
 * @returns {void}
 * @desc Close the search result frame.
 *
 */
export const close = function () {
  // check if the searchobject has been initialized
  if (!enable) return;

  hideFileZone();
  hideAppZone();

  if (searchBar) searchBar.value = '';
  if (overlay) {
    document.body.removeChild(overlay);
    // document.getElementById('overlayClose').remove();
  }
  overlay = undefined;
  if (searchBar) searchBar.blur();
  system.hide(closeZone);
};

export const abortSearch = function () {
  abortController.abort();
};

/**
 * @function checkImg
 * @returns {void}
 * @desc Check if the icon for this mimetype exist else show unknow icon.
 *
 */
function checkImg(img, div) {
  const image = new Image();
  image.onload = function () {
    div.insertBefore(image, div.firstChild);
    cache[img] = {
      img: window.od.net.urlrewrite(`../mimetypes/${img}.svg`),
    };
  };
  image.onerror = function () {
    image.src = window.od.net.urlrewrite('../mimetypes/unknown.svg');
    div.insertBefore(image, div.firstChild);
  };
  image.src = window.od.net.urlrewrite(`../mimetypes/${img}.svg`);
}

/**
 * @function enableDrag
 * @returns {void}
 * @desc Enable drag from app search result to the dock.
 *
 */
function enableDrag() {
  /*
   * Make application draggable
   */
  $('#appZone li').draggable({
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
