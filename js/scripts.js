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
import welcomeSystem from './welcomesystem.js';
import * as launcher from './launcher.js';
import * as shareSystem from './shareSystem.js';
import * as mailSystem from './mailSystem.js';
import * as quickSupport from './quickSupport.js';
import * as logmein from './logmein.js';
import * as searchSystem from './search.js';
import * as upload from './upload.js';
import * as errorMessage from './errormessage.js';
import * as printer from './printer.js';
import * as windowMessage from './windowMessage.js';
import * as ocuaparser from './ocuaparser.js';
import * as webshell from './webshell.js';
import * as appSelector from './appSelector.js';
import * as speaker from './speaker/main.js';
import * as whichBrowser from './which-browser.js';
import * as screenRecord from './screenRecord.js';
import * as menu from './menu.js';
import * as system from './system.js';
import * as settings from './settings.js';
import * as tipsinfo from './tipsinfo.js';
import * as languages from './languages.js';
import * as bug from './issue.js';
import * as systemMenu from './systemmenu.js';
import userGeolocation from './geolocation.js';
import './secrets.js';

//
// Build od AbcDesktop Window Object
//
window.od = {};
window.od.isTactile = 'ontouchstart' in window;
window.od.currentUser = null;

window.od.getmimeforfile = launcher.getmimeforfile;

window.od.broadway = null;
window.od.applist = null;


// Permit external call from test module
// There entry point use window.od call from external scripts
window.od.ocrun = launcher.ocrun;
window.od.test = window.test;
window.od.docker_logoff = launcher.docker_logoff;
// end of external call from test module

let lastTouchEnd = 0;

document.addEventListener('DOMContentLoaded', () => {

  if (typeof document.body.style.zoom   === "undefined") { 
	  console.log('document.body.style.zoom is undefined');
  }
  else {
  	document.body.style.zoom = 1;
  }

  // Init window.od.net functions
  // add network low level url rewrite call
  // build the object window.od.net.funct*
  odinit();

  // map connectLoader to window object for launcher direct call
  window.od.connectLoader = connectLoader;

  // init all object whithout user context dependenties
  setupbeforeuserloginin();

  // check if query string contains auth params. parseUrl call
  // const bInitContinue = parseUrl();

  // init i18l load json files
  languages.init();

  // Init basic event click for welcome window THEN call init
  welcomeSystem.init().always( () => {
      init(); 
    }
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

  // GDPR cookies
  initAllowCookies();
  if (!window.Cookies.get('allowCookies')) {
    // console.log('allowCookies not found');
    system.show(document.getElementById('cookieConsent'));
  }


  // init geolocation 
  userGeolocation.init();

  // Create object UAParser for reading User Agent
  ocuaparser.init();

  // Create object WhichBrowser Parser-JavaScript
  whichBrowser.init();

  // Create broadway object and bind keyboard events and create canvas
  window.od.broadway = new BroadwayVNC(this);
  window.od.broadway.init();

  // Init basic event for message window
  windowMessage.init();

  // Init event to show login and status progression
  connectLoader.init();

  // init error message
  errorMessage.init();

  // Init a dropzone on document.documentElement with Dropzone lib
  // upload.init();
  initRotation();

  // Show or Hide the virtual keyboard if the device is a touch device.
  setupisPCApp();

  // Add events support button
  quickSupport.init();

  // Add event for dock's search bar and filter keycode for different feature.
  searchSystem.init();

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
    .done(initApplistcallback)
    .fail( ({ status, error }) => { 
      console.error( 'initUserApplist failed' ); 
      console.error( error ); 
    });

  // Add event listener for buttons share window.
  shareSystem.init();

  // Get proclist from od.py and create event listener on broadway connect and disconnect.
  broadcastSystem.init();

  // Init clipboard events.
  clipboard.init();

  // Create event listener on broadway connect and disconnect for VNC audio
  // liveAudio.init();
  speaker.init();

  quickSupport.init();
  printer.init();

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

  // init tips
  // call launcher.getkeyinfo
  tipsinfo.init();

  // show user name in top left screen
  system.setUsername(window.od.currentUser.name);
};

function initApplistcallback() {
  // console.info( 'initApplistcallback' );
  appSelector.init();
  launcher.generateDesktopFiles(window.od.applist)
    .then( (data) => { 
      // console.log( data ); 
      if (data)
        console.log( 'generateDesktopFiles mimetype database updated ' + data.code )
      systemMenu.init(); 
    })
    .catch( (err) => {
      console.error( 'generateDesktopFiles failed' );
      console.error( err );
    });
}

function odinit() {
  window.od.net = {};
  window.od.net.urlrewrite = function (url) {
    if (typeof window.DanaUrl === 'function') {
      url = window.DanaUrl(url);
    }
    return url;
  };

  window.od.logoff = function (url) {
    if (!url || url === '/' )
      url = window.location.origin;
    if (typeof window.DanaGetIVEHostname === 'function') {
      // newlocation = 'https://' + window.DanaGetIVEHostname() + '/dana-na/auth/logout.cgi';
      close();
    }
    window.location = url;
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

    // if we use https then use wss
    // if we use http  then use ws
    if (window.location.protocol.substring(0, 5) === 'https') {
      defaultport = 443;
      url = 'wss';
    } else {
      defaultport = 80;
      url = 'ws';
    }

    // for pulse gateway
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
  
  console.debug('function script::logmein.tryReconnect()');

  // try to restor previous user context
  logmein.restoreUserContext().fail(() => {
    console.info('no user previous context, running standart welcome');
    welcomeSystem.open();
  });


  $('.window').mousedown(function () { system.activeWindow(this); });

  // setup menu
  setupTopMenu();

  // set fullscreen option callback in top menu
  $('#fullscreen').on('click', () => { toggleFullScreen(); });
  // event then fullscreenchange
  // can be a mouse click event or an escape key event
  // set fullscreen option icon [] or #
  document.onfullscreenchange = setFullScreenUI;

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
  } else if (document.cancelFullScreen) {
    document.cancelFullScreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitCancelFullScreen) {
    document.webkitCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

/**
 * @function setFullScreenUI
 * @global
 * @param none
 * @return {void}
 * @desc set fullscreen User Interface.
 */
function setFullScreenUI() {
  console.log('setFullScreenUI');
  if (!document.fullscreenElement && !document.mozFullScreenElement
      && !document.webkitFullscreenElement && !document.msFullscreenElement) {
    $('#fullscreen img').attr('src', 'img/top/fullscreen.svg');
    $('#fullscreen').attr('state', 'false');
  } else {
    $('#fullscreen img').attr('src', 'img/top/fullscreen-back.svg');
    $('#fullscreen').attr('state', 'true');
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
    if (this.id === 'printer') {
      return;
    }

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
        || !this.children[0]
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

      case 'tips':
          tipsinfo.open();
          break;

      case 'logout':
        menu.logoffOpen();
        break;

      case 'grabmouse':
        requestInputLock();
        break;

      default:
        console.error(`Invalid menu entry ${this.children[0].id}`);
        break;
    }
  });

  const audioplayer = document.getElementById('audioplayer');
  $('#top #top-right #speakers #volume_level')
    .on('input', function () {
      if (this.value > 0 && audioplayer.paused)
      {
        audioplayer.play();
      }
      if (Number(this.value) === 0 )
      {
        audioplayer.pause();
      }
      audioplayer.volume = this.value;
      speaker.updateIconVolumLevel();
    });

  $('#placement').click(() => {
    launcher.placeAllWindows();
  });

  bug.init();
}

/**
 * @function requestInputLock
 * @global
 * @return {void}
 * @desc force to grab mouse input for game like minecraft
 *       make sure that vnc server support this option
 *       works with realvnc server on arm64
 */
export function requestInputLock() {
  window.od.broadway.rfb.requestInputLock({ pointer: true });
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

function initAllowCookies() {
  if (document.getElementById('cookieConsent')) {
    $('#btnDeny').click(() => {
      window.Cookies.remove('allowCookies', { path: '/' });
      system.hide(document.getElementById('cookieConsent'));
    });
    $('#btnAccept').click(() => {
      window.Cookies.set('allowCookies', 'true', { path: '/', expires: 7 });
      system.hide(document.getElementById('cookieConsent'));
    });
  }
}
