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

import * as appstore from './appstore.js';
import * as broadcastSystem from './broadcastsystem.js';
import BroadwayVNC from './broadway-vnc.js';
import * as clipboard from './clipboard.js';
import * as connectLoader from './connectloader.js';
import * as systemMenu from './systemmenu.js';
import welcomeSystem from './welcomesystem.js';
import * as launcher from './launcher.js';
import * as shareSystem from './shareSystem.js';
import * as mailSystem from './mailSystem.js';
import * as quickSupport from './quickSupport.js';
import * as logmein from './logmein.js';
import * as searchSystem from './search.js';
import * as upload from './upload.js';
import * as errorMessage from './errormessage.js';
import * as soundSystem from './soundSystem.js';
import * as notificationSystem from './notificationsystem.js';
import * as printer from './printer.js';
import * as music from './music.js';
import * as windowMessage from './windowMessage.js';
import * as ocuaparser from './ocuaparser.js';
import * as webshell from './webshell.js';
import * as appSelector from './appSelector.js';
import * as speaker from './speaker.js';
import * as whichBrowser from './which-browser.js';
import * as screenRecord from './screenRecord.js';
import * as menu from './menu.js';
import * as system from './system.js';
import * as settings from './settings.js';
import * as languages from './languages.js';
import * as bug from './issue.js';

//
// Build od AbcDesktop Window Object
//
window.od = {};
window.od.isTactile = 'ontouchstart' in window;
window.od.currentUser = null;

window.od.getmimeforfile = launcher.getmimeforfile;

window.od.broadway = null;
window.od.applist = null;
window.od.isShared = false;
window.od.listprinter = launcher.listprinter;

// Permit external call from test module
// There entry point use window.od to becalled from external scritpt
window.od.ocrun = launcher.ocrun;
window.od.test = window.test;
window.od.docker_logoff = launcher.docker_logoff;
// end of external call from test module

// stream debug
// REMOVE THIS AFTER DEBUG
window.od.get_stream = launcher.get_stream;
window.od.destroy_stream = launcher.destroy_stream;

const _this = this;
let lastTouchEnd = 0;

document.addEventListener('DOMContentLoaded', () => {
  // Init window.id.net functions
  // add network low level url rewrite call
  // build the object window.od.net.funct*
  odinit();

  // map connectLoader to window object for launcher direct call
  window.od.connectLoader = connectLoader;

  // init all object whithout user context dependenties
  setupbeforeuserloginin();

  // check if query string contains auth params. parseUrl call
  const bInitContinue = parseUrl();

  languages.init();
  // Init basic event click for welcome window THEN call init
  welcomeSystem.init().always(
    () => {
      if (bInitContinue) { init(); }
    },
  );
});

/**
 * @function setupbeforeuserloginin
 * @returns {void}
 * @desc Init modules that are not required before the user logs on.
 */
function setupbeforeuserloginin() {
  // Init events on body
  initGlobalEvents();

  // Parsing current URI and provide isLogmein with Boolean for auto login
  logmein.init();

  // Create object UAParser for reading User Agent
  ocuaparser.init();

  // Create object WhichBrowser Parser-JavaScript
  whichBrowser.init();

  // Create broadway object and bind keyboard events and create canvas
  window.od.broadway = new BroadwayVNC(this);
  window.od.broadway.init();

  // Init basic event for message window
  windowMessage.init();

  // Init HTML element circle.
  connectLoader.init();

  // init error message
  errorMessage.init();

  // Initialize default variable for notification system module
  notificationSystem.init();

  // Init a dropzone on document.documentElement with Dropzone lib
  // upload.init();
  initRotation();

  // Show or Hide the virtual keyboard if the device is a touch device.
  setupisPCApp();

  // Add events support button
  quickSupport.init();

  // Add event for dock's search bar and filter keycode for different feature.
  searchSystem.init();

  // Init music player events.
  // music.init();
  // Init video player events.
  // video.init();

  // Add an event listener pinch for resizing the resolution if device have a touchscreen.
  if (window.od.isTactile) {
    noDoubleTap();
  }

  // Add events for webshell
  webshell.init();
}

/**
 * @function setupafteruserloginin
 * @returns {void}
 * @desc Init modules that are not required before the user logs on.
 */
window.od.setupafteruserloginin = function () {
  // call odApiClient.composer.getUserAppList
  // need user token
  launcher.initUserApplist()
    .done(initApplist_callback);

  // Init events and variables to manage sound volume.
  // need desktop token
  soundSystem.init();

  // Add event listener for buttons share window.
  shareSystem.init();

  // Get proclist from os.py and create event listener on broadway connect and disconnect.
  broadcastSystem.init();

  // Init clipboard events.
  clipboard.init();

  // Create event listener on broadway connect and disconnect for VNC audio
  // liveAudio.init();
  speaker.init();

  quickSupport.init();
  printer.init();

  // Init music player events.
  music.init();

  // Set url inside iframe & make windows resizable
  // Init a dropzone on document.documentElement with Dropzone lib
  upload.init();

  // init mail
  // call launcher.getkeyinfo
  mailSystem.init();

  // load menu from od.config file
  // call launcher.getkeyinfo("menuconfig")
  // Add an event listener for close , logoff and cancel buttons to the menu
  // need a user token
  menu.init();

  system.setUsername(window.od.currentUser.name);

  // window.od.video = video;
  // window.od.music = music;
};

function initApplist_callback() {
  appSelector.init();
  systemMenu.init();
  launcher.generateDesktopFiles(window.od.applist);
}

function odinit() {
  window.od.net = {};
  window.od.net.urlrewrite = function (url) {
    if (typeof window.DanaUrl === 'function') {
      url = window.DanaUrl(url);
    }
    return url;
  };

  window.od.logoff = function () {
    const newlocation = window.location.origin;
    if (typeof window.DanaGetIVEHostname === 'function') {
      // newlocation = 'https://' + window.DanaGetIVEHostname() + '/dana-na/auth/logout.cgi';
      close();
    }
    window.location = newlocation;
  };

  window.od.net.wsurlrewrite = function (wsurl) {
    if (typeof DanaWSUrl === 'function') {
      // safe to use the function
      wsurl = window.DanaWSUrl(wsurl);
    }
    return wsurl;
  };

  window.od.net.getorignwsurl = function (path, host, useport) {
    let defaultport;
    let url;
    let urlport = '';
    let s = '/'; // for / in url
    if (window.location.protocol.substring(0, 5) == 'https') {
      defaultport = 443;
      url = 'wss';
    } else {
      defaultport = 80;
      url = 'ws';
    }

    if (typeof window.DanaOrigHost === 'function') {
      // set host to OrigHost
      host = window.DanaOrigHost();
    }

    const hostname = (host) || window.location.hostname;
    // get the server tcp port for the browser
    const port = (useport) || window.location.port;

    // if the port is not a default port like 80 for HTTP, or 443 for HTTPS
    if (port && port !== defaultport) { urlport = `:${port}`; } // add the TCP port to URL

    // If there is a already a '/' at the end
    // s default value is /
    // do not add twice
    if (path && path.charAt(0) === '/') { s = ''; }

    url = `${url}://${hostname}${urlport}${s}${path}`;

    return url;
  };

  window.od.net.getwsurl = function (path, host, useport) {
    const url = window.od.net.getorignwsurl(path, host, useport);
    return window.od.net.wsurlrewrite(url);
  };
}

function initGlobalEvents() {
  document.body.addEventListener('click', (e) => {
    if (window.contextmenu && window.contextmenu.style.display === 'block') {
      window.contextmenu.style.display = 'none';
      window.contextmenu.style.right = 'initial';
      window.contextmenu.style.top = 'initial';
      window.contextmenu.style.left = 'initial';
      window.contextmenu = system.removeAllChilds(window.contextmenu);
      e.preventDefault();
    }
  });
}

function noDoubleTap() {
  document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
}

function parseQueryString(str) {
  if (!str) { str = location.search.split('?')[1] || ''; }

  str = str.trim().replace(/^(\?|#|&)/, '');

  if (!str) {
    return {};
  }

  return str.split('&').reduce((ret, param) => {
    const parts = param.replace(/\+/g, ' ').split('=');
    // Firefox (pre 40) decodes `%3D` to `=`
    // https://github.com/sindresorhus/query-string/pull/37
    let key = parts.shift();
    let val = parts.length > 0 ? parts.join('=') : undefined;

    key = decodeURIComponent(key);

    // missing `=` should be `null`:
    // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
    val = val === undefined ? null : decodeURIComponent(val);

    if (!{}.hasOwnProperty.call(ret, key)) {
      ret[key] = val;
    } else if (Array.isArray(ret[key])) {
      ret[key].push(val);
    } else {
      ret[key] = [ret[key], val];
    }

    return ret;
  }, {});
}

function parseUrl() {
  const queryparams = parseQueryString();

  if (typeof queryparams === 'object') {
    const { m } = queryparams;
    if (m === 'error') {
      windowMessage.open('Error', queryparams.message, queryparams.type, queryparams.status);
      return false;
    }
    if (isCompatibleBrowser() === false) {
      errorMessage.openNavMessage(whichBrowser.getBrowserInfo());
      return false;
    }
    return true;
  }
  return false;
}

/**
 * @function setupisPCApp
 * @global
 * @return {void}
 * @desc Show or Hide the virtual keyboard if the device is a touch device.
 */
function setupisPCApp() {
  if (ocuaparser.isTouch() || navigator.maxTouchPoints > 0) { $('.only-mobile').css('display', 'inline-block'); } else { $('.only-mobile').css('display', 'none'); }
}

/**
 * @function isCompatibleBrowser
 * @global
 * @return bool
 * @desc Check if user's browser version is compatible.
 */
function isCompatibleBrowser() {
  /*
     * Check browser version
     */
  const navInfo = whichBrowser.getBrowserInfo();
  const version = parseInt(navInfo.version, 10);
  switch (navInfo.name) {
    case 'Chrome Headless':
      if (version < 41) return false;
      break;
    case 'Chrome':
      if (version < 41) return false;
      break;
    case 'Chromium':
      if (version < 41) return false;
      break;
    case 'Firefox':
      if (version < 32) return false;
      break;
    case 'IE':
      if (version < 11) return false;
      break;
    case 'Safari':
      if (version < 8) return false;
      break;
    case 'Mobile Safari':
      if (version < 9) return false;
      break;
    case 'Opera':
      if (version < 27) return false;
      break;
    case 'Edge':
      if (version < 12) return false;
      break;
    default:
      console.log(`Web browser unlisted: ${navInfo.name}`);
      return false;
  }

  return true;
}

/**
 * @function init
 * @global
 * @return {void}
 * @desc Init top menu, set check if share token is present.
 * If user use Android app and make windows draggable.
 */
function init() {
  console.info('function script:init()');

  // check if we are running inside the orange android
  // Application webview
  window.isAndroidApplicationMode = ocuaparser.isAbcDesktopAndroidApplication();
  /**
    // check if shared token or not
    if ( !isShared() ) {
        console.info( 'function script:init: not a shared login');
        console.debug( 'function script::logmein.tryReconnect()');
        logmein.restoreUserContext().fail(function () {
            console.info( 'function script:init:logmein.tryReconnect has no user context');
            welcomeSystem.open();
        });
    } else {
        console.info( 'function script:init: welcomeSystem.open()');
        welcomeSystem.open();
    }
    */

  const parsedQueryString = parseQueryString();
  let { provider } = parsedQueryString;
  const { manager } = parsedQueryString;

  console.debug('function script::logmein.tryReconnect()');

  // try to restor previous user context
  logmein.restoreUserContext().fail(() => {
    console.info('no user previous context, running standart welcome');
    // Check if querySting contains autologin parameters
    if (manager === 'implicit') {
      // no auth is required
      if (!provider) { provider = welcomeSystem.getDefaultProviderName(manager); }
      welcomeSystem.login(manager, provider);
    } else { welcomeSystem.open(); }
  });

  $('.window').mousedown(function () { system.activeWindow(this); });

  // setup menu
  setupTopMenu();

  // set fullscreen option callback in top menu
  $('#fullscreen').on('click', () => { toggleFullScreen(); });

  // enable time at the top
  system.horloge('time');

  // enable drag and drap applications
  drag();
}

function drag() {
  const controls = document.querySelectorAll('.control');
  let startX;
  let startY;
  let startOffsetLeft;
  let startOffsetTop;
  let startElement;
  for (let i = 0; i < controls.length; i++) {
    if (controls[i].parentElement.id === 'appstore-window') { continue; }

    controls[i].addEventListener('mousedown', (ev1) => {
      startX = ev1.clientX;
      startY = ev1.clientY;
      startElement = ev1.target;
      startOffsetLeft = startElement.parentElement.offsetLeft;
      startOffsetTop = startElement.parentElement.offsetTop;
      document.addEventListener('mousemove', move);
      document.getElementById('noVNC_canvas').addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      document.getElementById('noVNC_canvas').addEventListener('mouseup', up);
    });
    controls[i].addEventListener('mouseup', up);
  }

  function move(ev) {
    let x;
    let y;
    x = ev.pageX - startX;
    y = ev.pageY - startY;
    // y = ev.pageY - ev.target.parentElement.offsetTop;
    // if (ev.target.parentElement.offsetLeft + x > document.body.clientWidth) {
    //     x = document.body.clientWidth - ev.target.parentElement.offsetLeft;
    // }
    x += startOffsetLeft;
    y = y + startOffsetTop - 15;
    if (x < 0) {
      x = 0;
    }
    if (y < 0) {
      y = 0;
    }
    if (x > document.body.clientWidth - startElement.parentElement.clientWidth) {
      x = document.body.clientWidth - startElement.parentElement.clientWidth;
    }
    if (y > document.body.clientHeight - startElement.parentElement.clientHeight - 86) {
      y = document.body.clientHeight - startElement.parentElement.clientHeight - 86;
    }
    startElement.parentElement.style.left = `${x}px`;
    startElement.parentElement.style.top = `${y}px`;
  }

  function up() {
    document.removeEventListener('mousemove', move);
    const c = document.getElementById('noVNC_canvas');
    // Should be undefined if session has been disconnected
    if (c) { c.removeEventListener('mousemove', move); }
  }
}

/**
 * @function toggleFullScreen
 * @global
 * @param none
 * @return {void}
 * @desc Toggle fullscreen.
 */
function toggleFullScreen() {
  // alternative standard method
  if (!document.fullscreenElement
    && !document.mozFullScreenElement
    && !document.webkitFullscreenElement
    && !document.msFullscreenElement) {
    // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
    $('#fullscreen img').attr('src', 'img/top/fullscreen-back.svg');
    $('#fullscreen').attr('state', 'true');
  } else {
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    $('#fullscreen img').attr('src', 'img/top/fullscreen.svg');
    $('#fullscreen').attr('state', 'false');
  }
}

/**
 * @function setupTopMenu
 * @global
 * @return {void}
 * @desc Init all top menu events
 */
function setupTopMenu() {
  $('#top #top-right div').bind('click', function () {
    const hasSelected = $(this).hasClass('selected');
    if (!$(this).hasClass('keep')) {
      closeTopRightDropDowns();
    }
    if (!hasSelected) {
      $('#top #top-right div').removeClass('selected');
      $('#top #top-right .drop-down').hide();
      $(this).addClass('selected');
      $('.drop-down', this).show();
      addTransOverlay();
      // $('#top #top-right div').bind('mouseover', function() {
      //     if (!$(this).hasClass('selected')) {
      //         $('#top #top-right div').removeClass('selected');
      //         $('#top #top-right .drop-down').hide();
      //         $(this).addClass('selected');
      //         $('.drop-down', this).show();
      //     }
      // });
    }
  });

  $('#top #top-left div').bind('click', function () {
    const hasSelected = $(this).hasClass('selected');
    if (!$(this).hasClass('keep')) {
      closeTopLeftDropDowns();
    }
    if (!hasSelected) {
      $(this).addClass('selected');
      $('.drop-down', this).show();
      addTransOverlay();
      $('#top #top-left div').bind('mouseover', function () {
        if (!$(this).hasClass('selected')) {
          $('#top #top-left div').removeClass('selected');
          $('#top #top-left .drop-down').hide();
          $(this).addClass('selected');
          $('.drop-down', this).show();
        }
      });
    } else {
      $('#top #top-left div').unbind('mouseover');
    }
  });

  $('#top #top-right div ul li').bind('click', function () {
    addTransOverlay();

    if (!this.children
        || !(this.children instanceof HTMLCollection)
        || !this.children[0].id) {
      return;
    }

    switch (this.children[0].id) {
      case 'settings':
        settings.open();
        break;

      case 'appstore':
        appstore.open();
        break;

      case 'screenshot':
        system.takeScreenshot();
        break;

      case 'record':
        screenRecord.open();
        break;

      case 'logout':
        menu.logoffOpen();
        break;

      default:
        console.error(`Invalid menu entry ${this.children[0].id}`);
        break;
    }
  });

  $('#top #top-right #speakers .slider').slider({
    min: 0,
    max: 100,
    step: 1,
    value: 30,
    slide() {
      const currentPercent = $(this).slider('option', 'value');
      _this.sliderUpdate(currentPercent);
    },
    stop() {
      const currentPercent = $(this).slider('option', 'value');
      _this.sliderUpdate(currentPercent);
    },
  });

  $('#placement').click(() => {
    launcher.placeAllWindows();
  });

  bug.init();
}

/**
 * @function closeTopRightDropDowns
 * @global
 * @return {void}
 * @desc Close top right drop down
 */
export function closeTopRightDropDowns() {
  $('#top #top-right div').removeClass('selected');
  $('#top #top-right .drop-down').hide();
  $('.fullscreenTransOverlay').unbind('click');
  $('.fullscreenTransOverlay').remove();
  $('#top #top-right div').unbind('mouseover');
}

/**
 * @function closeTopLeftDropDowns
 * @global
 * @return {void}
 * @desc Close top left drop down
 */
export function closeTopLeftDropDowns() {
  $('#top #top-left div').removeClass('selected');
  $('#top #top-left .drop-down').hide();
  $('.fullscreenTransOverlay').unbind('click');
  $('.fullscreenTransOverlay').remove();
  $('#top #top-left div').unbind('mouseover');
}

export function formToJSON(form) {
  const obj = {};
  const elements = form.querySelectorAll('input, select, textarea');
  for (let i = 0; i < elements.length; ++i) {
    const element = elements[i];
    const { name } = element;
    const { value } = element;
    const { checked } = element;

    if (name) {
      if (element.type === 'checkbox') {
        obj[name] = checked;
      } else {
        obj[name] = value;
      }
    }
  }

  return obj;
}

/**
 * @function addTransOverlay
 * @global
 * @return {void}
 * @desc Creates a div that allows to close the menu with one click out of the menu.
 */
function addTransOverlay() {
  $('body').append('<div class="fullscreenTransOverlay"></div>');
  // systemMenu.setLocked(true);
  $('.fullscreenTransOverlay').bind('click', () => {
    closeTopRightDropDowns();
    closeTopLeftDropDowns();
  });
}

function initRotation() {
  // Only for Ios Safari
  if (window.isIOS && window.isSafari) {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
      // Hidde the bottom tool bar
        window.scrollTo(0, 1); // Scroll to x=0,y=1
      }, 1000); // Wait one second for refresh screen image
    });
  }
}
