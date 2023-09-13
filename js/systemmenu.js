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
 * @name SystemMenu
 * @module
 */

import * as launcher from './launcher.js';
import * as system from './system.js';
import * as errorMessage from './errormessage.js';
import * as webshell from './webshell.js';

import { broadcastEvent } from './broadcastevent.js';
import * as secrets from './secrets.js';
// import * as speaker from './speaker/main.js';


let myMenuApps;
let enable = true;
let windowList = [];
let xMousePosition = 0;
let yMousePosition = 0;

/**
 * @function clickDockActive
 * @desc call when client clicked on an active dock
 */
function clickDockActive() {
  if (this.attributes.execmode) handleMenuClick(this);
  if (this.attributes.wid.value) {
    let listWid = [];
    try {
      listWid = JSON.parse(this.attributes.wid.value);
    } catch (e) {
      console.error(e);
    }
    launcher.activatewindows(listWid);
  } else {
    // launcher.activatewindowbypid(this.attributes.pid.value);
  }
}

/**
 * @function init
 * @returns {void}
 * @desc Init events, load user's menu from MongoDB and make dock sortable (jQuery).
 */
export const init = function () { 
  if (!document.getElementById('dock')) {
    enable = false;
    console.warning('searchZone is disabled');
    return;
  }

  loadMenu();

  $(() => {
    let removeIntent = false;
    $('#dock ul').sortable({
      over(event, ui) {
        const last = ui.item[0].lastElementChild;
        if (last && last.tagName) {
          if (last.tagName.toUpperCase() === 'P') { // On add app in the dock the last element is <p>
            last.style.width = '100px';
            last.style.margin = '0 auto';
          }
        }

        removeIntent = false;
      },
      out() {
        removeIntent = true;
      },
      stop() {
        saveMenu();
      },
      beforeStop(event, ui) {
        if (!ui.item[0] || !ui.item[0]) {
          return;
        }

        $(ui.item[0])
          .find('img')
          .css('transform', 'scale(1) translateX(0)');

        if (removeIntent === true
                    && ui.item[0].id !== 'search'
                    && ui.item[0].classList.contains('active') === false) {
          $(ui.item[0]).remove();
        }
      },
      receive(event, ui) {
        if (!ui.item[0]) {
          return;
        }

        const last = ui.item[0].lastElementChild;
        last.style.margin = 'none';
        last.style.width = 'none';
        const liDock = ui.helper[0];
        const appname = ui.item[0].innerText;
        liDock.id = ui.item[0].id;
        liDock.attributes.style.nodeValue = '';
        liDock.className = liDock.className.replace('appstore-item', '');
        const docklist = document.getElementById('docklist');
        const apps = Array.from(docklist.children);
        let cpt = 0;

        if (numberAppsCanBeAdd(docklist, countDisplayedApps(apps)) <= 0) {
          tryReduceDock(docklist, apps);
        }

        for (const app of apps) {
          if (liDock.attributes.launch.nodeValue === app.attributes.launch.nodeValue) {
            cpt++;
            if (cpt === 2) {
              app.remove();
              break;
            }
          }
        }

        const img = $(ui.item[0]).find('img')[0];
        liDock.innerHTML = '';
        liDock.appendChild(getAppFragment(appname, img.src));

        clicklistener();
        mouselistener();
      },
      placeholder: 'placehold',
      delay: 150,
      helper: 'clone',
      scroll: false,
    });
  });

  clicklistener();
  mouselistener();
  document.getElementById('dock').onmousemove = function (e) {
    xMousePosition = e.clientX;
    yMousePosition = e.clientY;
  };
  window.contextmenu = document.getElementById('contextmenu');
};

function initialStates() {
  $('#dock ul li').each(function () {
    const img = Array.from($(this).find('img'))
      .find((img) => $(img).hasClass('appIconDock'));
    if (img && img.style) {
      img.style.transform = 'scale(1) translateX(0px)';
    }
  });
}

/**
 * @function clicklistener
 * @returns {void}
 * @desc Add events click on applications present in the dock.
 */
export const clicklistener = function () {
  // Check if systemMenu has been initialized
  if (!enable) return;

  $('#dock ul li').off('click');
  $('#dock ul li').on('click', function () {
    if (this.classList.contains('active') === false) handleMenuClick(this);
  });

  $('#dock ul li').off('mousedown');
  $('#dock ul li').on('mousedown', function ({ target }) {
    initialStates();
    const menucapt = this.querySelector('.appname');
    if (menucapt === target || Array.from($(menucapt).find('*')).includes(target)) {
      return;
    }

    const img = Array.from($(this).find('img'))
      .find((img) => $(img).hasClass('appIconDock'));

    if (img && img.style) {
      img.style.transform = 'scale(0.9) translateX(-3px)';
    }
  });

  $('#dock ul li').off('mouseup');
  $('#dock ul li').on('mouseup', initialStates);

  $('#dock ul li').off('contextmenu');
  $('#dock ul li').on('contextmenu', function (e) {
    showContextmenu(this.classList.contains('active'), this, e);
    e.preventDefault();
  });

  $('#docklist .active').off('click');
  $('#docklist .active').on('click', clickDockActive);
};

/**
 * @function mouselistener
 * @returns {void}
 * @desc Add events click on applications present in the dock.
 */
export const mouselistener = function () {
  // Check if systemMenu has been initialized
  if (!enable) return;

  if (!window.od.isTactile) {
    $('#docklist li').off('mouseover');
    $('#docklist li')
      .on('mouseover', function (evtMouse) {
        initialStates();
        const container = Array.from(this.children)
          .find((child) => child.className === 'appcontainer');

        const jqelt = $(this);
        const arrowDock = jqelt.find('.arrow-dock');
        // Code for evt mouseover
        if (container) container.style.display = 'block';

        const childs = Array.from(jqelt.find('*'));
        if (childs.includes(evtMouse.target)) {
          arrowDock.css('transform', 'translateX(16.5px)');
          jqelt.css({ position: 'relative', top: '2px' });
          setTimeout(() => jqelt.css({ position: 'static', top: '0' }), 200);
        }
      });

    $('#docklist li').off('mouseleave');
    $('#docklist li')
      .on('mouseleave', function () {
        initialStates();
        // Code for evt mouseleave
        const container = Array.from(this.children)
          .find((child) => child.className === 'appcontainer');
        if (container) container.style.display = 'none';
      });
  }
};

let getWihndowListIsPending = false;

/**
 * @function showContextmenu
 * @param {boolean} status Application is running or not
 * @param {object} element HTML element you clicked on
 * @param {object} e event jQuery
 * @returns {void}
 * @desc Show context menu (right clic).
*/
export const showContextmenu = function (status, element) {
  console.debug('showContextmenu');
  system.show(window.contextmenu);
  if (status === true) {
    if (!getWihndowListIsPending) {
      getWihndowListIsPending = true;
      launcher.getwindowslist()
        .then((msg) => {
          const cloneContexmenue = system.removeAllChilds(window.contextmenu, false);
          for (const { wm_class, id, title } of msg.data) {
            if (wm_class === element.attributes.launch.value) {
              const divider = document.createElement('li');
              const win = document.createElement('li');
              const img = document.createElement('img');
              const div = document.createElement('div');
              const url = element.querySelector('img').src;

              divider.className = 'divider';

              win.id = id;
              win.addEventListener('click', async () => {
                try {
                  await launcher.activatewindows([Number(id)]);
                  $('#noVNC_canvas').focus();
                } catch(e) {
                  console.error(e);
                }
              });

              img.src = url;
              div.innerText = title;

              win.appendChild(img);
              win.appendChild(div);

              cloneContexmenue.appendChild(win);
              cloneContexmenue.appendChild(divider);
            }
          }

          const close = document.createElement('li');
          close.innerHTML = "<img src='../img/round_close.svg'/><span> Close</span>";
          close.addEventListener('click', () => {
            if (element.attributes.wid) {
              let listWid;
              try {
                listWid = JSON.parse(element.attributes.wid.value);
              } catch (e) {
                console.error(e);
              }
              launcher.closewindows(listWid);
            }
          });

          cloneContexmenue.appendChild(close);
          // Replace clone and original contextmenu for be able to get the offsetHeight
          window.contextmenu.parentNode.replaceChild(cloneContexmenue, window.contextmenu);
          window.contextmenu = cloneContexmenue;

	  const offsetHeight = document.getElementById('dock').clientHeight;
	  const elementrect =  element.getBoundingClientRect();
	  const menu_top = elementrect.y - offsetHeight; 
	  window.contextmenu.style.top = menu_top + 'px';

          // if (window.innerWidth - xMousePosition < cloneContexmenue.clientWidth) {
	  if (window.innerWidth - elementrect.x < cloneContexmenue.clientWidth) {
            window.contextmenu.style.right = '0px';
          } else {
            window.contextmenu.style.left = elementrect.x + 'px';
            window.contextmenu.style.right = 'initial';
          }

          getWihndowListIsPending = false;
        });
    }
  } else {
    const cloneContextMenu = system.removeAllChilds(window.contextmenu, false);

    const open = document.createElement('li');
    open.innerHTML = 'Open';
    open.addEventListener('click', () => {
      handleMenuClick(element);
    });

    cloneContextMenu.appendChild(open);
    const elementrect =  element.getBoundingClientRect();
    const offsetHeight = document.getElementById('dock').clientHeight;
    const menu_top = elementrect.y - offsetHeight/2;
    cloneContextMenu.style.top = menu_top + 'px';
    cloneContextMenu.style.left = elementrect.x + 'px';
    cloneContextMenu.style.right = 'initial';

    window.contextmenu.parentNode.replaceChild(cloneContextMenu, window.contextmenu);
    window.contextmenu = cloneContextMenu;
  }
};

function getListWidApp(app) {
  console.debug('getListWidApp');
  const listWid = [];
  for (let i = 0; i < windowList.length; i++) {
    const win = windowList[i];
    if (win.wm_class !== 'N/A') {
      if (app.attributes.launch.value === win.wm_class) listWid.push(win.id);
    }
  }
  return listWid;
}

/**
 * @function updateWindowList
 * @param {object} data List of application windows running for this user
 * @returns {void}
 * @desc Called by broadcastSystem when an application window is opened or closed.
 */
export const updateWindowList = function (data) {
  // console.debug('systemmenu updateWindowList')
  // Check if systemMenu has been initialized
  if (!enable) return;
  windowList = data;
  const docklist = Array.from(document.querySelectorAll('#docklist li'));
  if (docklist) {
    for (const [i, app] of docklist.entries()) {
      const listWid = [];
      for (const win of data) {
        if (win.wm_class !== 'N/A') {
          if (app.attributes.launch.value === win.wm_class) listWid.push(win.id);
          if (i === 0) appStarted(win);
        }
      }
      app.setAttribute('wid', JSON.stringify(listWid));
    }
  }
  appKilled(data);
};

/**
 * @function appStarted
 * @param {object} data List of application windows running for this user
 * @returns {void}
 * @desc Update status of dock's applications who as started.
 */
export const appStarted = function (data) {
  // console.debug('appStarted');
  let isPresent = false;
  let isActive = false;

  // Check if systemMenu has been initialized
  if (!enable) return;

  const dock = document.querySelectorAll('#docklist li');
  if (dock) {
    for (let i = 0; i < dock.length; i++) {
      const app = dock[i];
      if (!app.attributes.launch) continue;

      if (app.classList.contains('active') && app.attributes.launch.value === data.wm_class) {
        isActive = true;
        isPresent = true;
      }
      // console.info( 'app.attributes.launch.value=' + app.attributes.launch.value );
      // console.info( 'data.wm_class=' + data.wm_class );
      // console.info( 'isActive=' + isActive );
      if (app.attributes.launch.value === data.wm_class && isActive === false) {
        isPresent = true;
        const puce = document.createElement('div');
        puce.className = 'puce';
        app.appendChild(puce);
        app.classList.toggle('active');
        app.setAttribute('pid', data.pid);
        app.setAttribute('state', 'running');
        $('#docklist .active').off('click');
        $('#docklist .active').on('click', clickDockActive);
      }
    }

    if (isPresent === false) {
      const appDiv = createAppdiv(data);
      if (appDiv) {
        const docklist = document.querySelector('#docklist');
        if (docklist) docklist.appendChild(appDiv);
      }
      clicklistener();
      mouselistener();
    }
  }
};

/**
 * @function appKilled
 * @param {object} data List of application windows running for this user
 * @returns {void}
 * @desc Update status of dock's applications who as been stopped.
 */
export const appKilled = function (data) {
  // Check if systemMenu has been initialized
  if (!enable) return;

  const docklist = document.querySelectorAll('#docklist li.active');
  let isRunning = false;
  for (const dock of docklist) {
    isRunning = false;
    for (let j = 0; j < data.length; j++) {
      if (dock.attributes.launch.value === data[j].wm_class) {
        isRunning = true;
      }
    }
    if (isRunning === false && !dock.attributes.execmode) {
      const puce = dock.querySelector('.puce');
      if (puce) dock.removeChild(puce);
      if (dock.classList.contains('temporary')) dock.parentNode.removeChild(dock);

      $('#docklist .active').off('click');
      dock.classList.toggle('active');
      dock.removeAttribute('pid');
      dock.setAttribute('state', 'down');
      clicklistener();
      mouselistener();
    }
  }
};

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
      system.addAppLoader(clickedApp);
      clickedApp.setAttribute('state', 'started');
      $(clickedApp).find('img.appLoader')
        .addClass('appLoaderDock');
    } else if (myapptolaunch.execmode === 'frontendjs' || !myapptolaunch) {
      switch (clickedApp.attributes.launch.value) {
        case 'frontendjs.phone':
          // phone.open();
          break;
        case 'frontendjs.webshell':
          webshell.open(clickedApp.attributes.launch.value);
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
    system.addAppLoader(clickedApp);
    clickedApp.setAttribute('state', 'started');
    $(clickedApp).find('img.appLoader')
      .addClass('appLoaderDock');
    // speaker.letsPlaySound();
  }
};

/**
 * @function saveMenu
 * @returns {void}
 * @desc Send to MongoDB a save of current user's Dock.
 */
export const saveMenu = function () {
  const myMenu = document.querySelectorAll('#docklist li');
  myMenuApps = [];
  for (let i = 0; i < myMenu.length; i++) 
    myMenuApps.push(myMenu[i].attributes.launch.value);
  launcher.set('dock', myMenuApps);
};

export const internalLoadMenu = function (apps) {
  const docklist = document.getElementById('docklist');
  console.debug(`Adding ${apps.length} applications in the docklist element`);
  // if apps is empty
  // then add all applications with showinview 'dock'
  if (apps.length === 0) {
    for (let i = 0; i < window.od.applist.length; i++) {
      if (window.od.applist[i].showinview === 'dock') 
	      apps.push(window.od.applist[i]);
    }
  }

  // update dock
  for (
    const {
      // icon,
      icondata,
      launch,
      container_id,
      execmode,
      id,
      displayname,
      name,
      secrets_requirement
    } of apps
  ) {
    // const imgurl = window.od.net.urlrewrite(`../img/app/${icon}`);
    const imgurl =  "data:image/svg+xml;base64," + icondata;
    const li = system.getLIApp(id, launch, execmode, secrets_requirement);

    li.setAttribute('name', name);
    li.setAttribute('container_id', container_id);
    li.setAttribute('state', 'down');

    li.innerHTML = '';
    li.appendChild(getAppFragment(displayname, imgurl));

    mouselistener();
    docklist.appendChild(li);
  }

  clicklistener();
  mouselistener();

  
  launcher.getwindowslist()
    .then((msg) => {
      // console.debug( 'launcher.getwindowslist response' );
      updateWindowList(msg.data);
      const docklist = document.getElementById('docklist');
      const childs = Array.from(docklist.children);
      tryReduceDock(docklist, childs);
      // Now init app is done
      // let's bind event in always
      // console.debug('now binding addEventListener window.list');
      broadcastEvent.addEventListener('proc.started',({ detail: { procStarted } }) => appStarted(procStarted));
      broadcastEvent.addEventListener('proc.killed', ({ detail: { procKilled  } }) => appKilled(procKilled));
      broadcastEvent.addEventListener('window.list', ({ detail: { windowList  } }) => updateWindowList(windowList));
    });
  
};

/**
 * @function loadMenu
 * @returns {void}
 * @desc Send to MongoDB a save of current user's Dock.
 */
export const loadMenu = function () {
  const apps = [];
  if (!window.od.applist)
    console.warn( 'loadMenu is trying to read undefined data from window.od.applist' );
  launcher.get('dock')
    .done((msg) => {
      if (msg && msg.status === 200 && msg.result) {
        const dockapplist = msg.result;
        console.log( 'user dock application list is ' +  dockapplist );
        for (let i = 0; i < dockapplist.length; i++) {
          window.od.applist.forEach(element => {
            // if dock application exist data[i] === element.launch
            // and application is not hideindock
            if (dockapplist[i] === element.launch && !element.hideindock) {
              // add entry in dock
              // console.log( 'adding ' +  element.launch + ' to apps' );
              apps.push(element);
            }
          });
        }
      }
    })
    .always(() => {
      internalLoadMenu(apps);
      // console.log('binding addEventListener window.list');
      // broadcastEvent.addEventListener('proc.started',({ detail: { procStarted } }) => appStarted(procStarted));
      // broadcastEvent.addEventListener('proc.killed', ({ detail: { procKilled  } }) => appKilled(procKilled));
      // broadcastEvent.addEventListener('window.list', ({ detail: { windowList  } }) => updateWindowList(windowList));
    });
};

export const getAppFragment = function (appName, imgUrl) {
  const appFragment = document.createDocumentFragment();
  const divAppContainer = document.createElement('div');
  const divAppName = document.createElement('div');
  const spanArrowDock = document.createElement('span');
  const wrapperIcons = document.createElement('div');
  const img = document.createElement('img');
  const iconLock = document.createElement('img');

  divAppContainer.className = 'appcontainer';
  divAppName.className = 'appname';
  divAppName.innerText = appName;

  spanArrowDock.className = 'arrow-dock';

  divAppContainer.appendChild(divAppName);
  divAppContainer.appendChild(spanArrowDock);

  wrapperIcons.className = 'd-flex flex-column';

  img.className = 'appIconDock';
  img.src = imgUrl;
  iconLock.src = 'img/lock.svg';
  iconLock.className = 'dock-lock-icon';

  wrapperIcons.appendChild(img);
  wrapperIcons.appendChild(iconLock);

  appFragment.appendChild(divAppContainer);
  appFragment.appendChild(wrapperIcons);

  return appFragment;
};

/**
 * @function createAppdiv
 * @param {object} data Information of the application
 * @returns {object} li HTML element <li> ready for the dock
 * @desc Create a temporary icon of a running application who wasn't in the dock.
 */
export const createAppdiv = function (data) {
  for (const { launch, icon, icondata, displayname } of window.od.applist) {
    if (launch === data.wm_class) {
      const li = document.createElement('li');
      li.setAttribute('launch', launch);
      li.setAttribute('pid', data.pid);
      li.setAttribute('wid', JSON.stringify(getListWidApp(li)));
      li.setAttribute('state', 'down');
      mouselistener();

      li.className = 'temporary active';

      // const imgurl = window.od.net.urlrewrite(`../img/app/${icon}`);
      const imgurl = "data:image/svg+xml;base64," + icondata;
      const divPuce = document.createElement('div');
      const fragment = getAppFragment(displayname, imgurl);

      divPuce.className = 'puce';

      fragment.appendChild(divPuce);
      li.appendChild(fragment);

      return li;
    }
  }
  return null;
};

// secrets.secretsEvents.addEventListener('loaded', init);

const numberAppsCanBeAdd = function (docklist, nbrDisplayedApps) {
  const docklistWidth = docklist.offsetWidth;
  const widthApp = 45; // Default width per apps
  const maxNumberApp = docklistWidth / widthApp;
  return parseInt(maxNumberApp - nbrDisplayedApps, 10);
};

const countDisplayedApps = function (childs) {
  return childs
    .reduce((sum, elt) => (elt.style.display !== 'none' ? sum + 1 : sum), 0); // Count number of displayed apps
};

const removeAppInDock = function (childs) {
  for (const child of childs) {
    // Only displayed apps
    if (child.style.display !== 'none') {
      // Keyboards can't be hidde
      if (child.getAttribute('launch') !== 'keyboard') {
        // Only down application can be  hide (not running, and not started)
        if (child.getAttribute('state') === 'down') {
          child.style.display = 'none';
          return true;
        }
      }
    }
  }
  return false;
};

/**
 * @param {HTMLUListElement} docklist
 * @param {Array<HTMLLIElement>} childs
 * @desc Try to remove all apps required in the dock
 * @returns {boolean} Return true if almost one app has been removed
 */
export const tryReduceDock = function (docklist, childs) {
  if (!docklist) return false;
  let nbrDisplayedApps = 0;
  let appRemoved = false;
  // Stop if their is no apps to hide
  while ((nbrDisplayedApps = countDisplayedApps(childs)) && numberAppsCanBeAdd(docklist, nbrDisplayedApps) <= 0
  ) {
    // Continue while we can't add an app
    const anAppRemoved = removeAppInDock(childs);
    if (!appRemoved && anAppRemoved) appRemoved = anAppRemoved;
    // Stop if can't hide more apps
    if (!anAppRemoved) { return appRemoved; }
  }
  return appRemoved;
};


// console.log('binding addEventListener window.list');
// broadcastEvent.addEventListener('proc.started',({ detail: { procStarted } }) => appStarted(procStarted));
// broadcastEvent.addEventListener('proc.killed', ({ detail: { procKilled  } }) => appKilled(procKilled));
// broadcastEvent.addEventListener('window.list', ({ detail: { windowList  } }) => updateWindowList(windowList));

const docklist = document.getElementById('docklist');
let lastWindowWidth = window.innerWidth;
let timeoutId;

if (docklist) {
  window.addEventListener('resize', () => {
    const childs = Array.from(docklist.children);
    if (lastWindowWidth >= window.innerWidth) {
      tryReduceDock(docklist, childs); // Try to reduce the number of apps in the dock
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      // This strategy allow to show hiddens apps only at the end of the resize
      timeoutId = setTimeout(() => {
        const displayedApps = countDisplayedApps(childs);
        const nbrHiddenApps = childs.length - displayedApps - 1;
        const nbrAppsToAdd = numberAppsCanBeAdd(docklist, displayedApps);
        if (nbrHiddenApps !== 0 && nbrAppsToAdd > 0) {
          let counter = 0;
          for (const child of childs) {
            if (child.getAttribute('launch') !== 'keyboard' && child.style.display === 'none') {
              child.style.display = 'block';
              counter++;
              // Display the maximum of capable apps
              if (counter === nbrAppsToAdd) { break; }
            }
          }
        }
      }, 100);
    }
    lastWindowWidth = window.innerWidth;
  });
}
