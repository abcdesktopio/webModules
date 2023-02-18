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

/*
import '../node_modules/xterm/lib/xterm.js';  
import '../node_modules/xterm-addon-fit/lib/xterm-addon-fit.js';
import '../node_modules/xterm-addon-web-links/lib/xterm-addon-web-links.js';
import '../node_modules/xterm-addon-attach/lib/xterm-addon-attach.js';
*/


/**
 * @name webshell
 * @module
 */

export let _this;
export let top;
export let _style;
export let isfullscreen = false;
export let isopen = false;
export let reduce = false;
export let term = null;

let pid;
let termOpen = false;
let socketURL;
let socket;

const xtermjsTheme = {
  foreground: '#F8F8F8',
  background: '#000000', //'#2D2E2C',
  selectionBackground: '#5DA5D533',
  black: '#000000',
  brightBlack: '#262625',
  red: '#CE5C5C',
  brightRed: '#FF7272',
  green: '#5BCC5B',
  brightGreen: '#72FF72',
  yellow: '#CCCC5B',
  brightYellow: '#FFFF72',
  blue: '#5D5DD3',
  brightBlue: '#7279FF',
  magenta: '#BC5ED1',
  brightMagenta: '#E572FF',
  cyan: '#5DA5D5',
  brightCyan: '#72F0FF',
  white: '#F8F8F8',
  brightWhite: '#FFFFFF'
};

/**
 * @function init
 * @returns {void}
 * @desc Init basic event close.
 *
 */
export const init = function () {
  _this = document.getElementById('webshell');
  top = document.getElementById('shell');
  if (_this) {
    _style = _this.style;
    _this.querySelector('.control').addEventListener('dblclick', fullscreen);
    _this.querySelector('.grab').addEventListener('mousedown', resizing);
    _this.querySelector('.close').addEventListener('click', close);
    _this.querySelector('.reduce').addEventListener('click', minimize);
  }
  if (top) {
    top.addEventListener('click', maximize);
  }
};



/**
 * @function open
 * @returns {void}
 * @desc Open window.
 *
 */
export const open = function () {
  system.show(_this);
  system.activeWindow(_this);
  if (!isopen) {
    createTerminal();
  }
};

/**
 * @function close
 * @returns {void}
 * @desc Close window.
 *
 */
export const close = function () {
  system.hide(_this);
  isopen = false;
  isfullscreen = false;
  closeTerminal();
};

export const minimize = function () {
  system.hide(_this);
  reduce = true;
  system.show(top);
};

export const maximize = function () {
  system.show(_this);
  reduce = false;
  system.activeWindow(_this);
  window.term.focus();
  system.hide(top);
};

export const fullscreen = function () {
  if (isfullscreen) {
    _this.style = _style;
    _this.style.display = 'block';
    isfullscreen = false;
  } else {
    _this.style.width = '100%';
    _this.style.height = 'calc(100% - 85px)';
    _this.style.top = '0px';
    _this.style.left = '0px';
    isfullscreen = true;
  }
  updateTerminalSizeandResize();
};

export const resize = function () {
  
  if (!window.term || !isopen) {
    return;
  }
 
  /**
   * @desc Put the terminal as in fullscreen on small devices
   */
  if (!isfullscreen && window.innerWidth <= 700) {
    fullscreen();
    return;
  }

  window.term._addonManager._addons[0].instance.fit();
  window.term.focus();
};

export const resizing = function () {
  _this.style.overflow = 'hidden';
  _this.style.opacity = '0.70';
  _this.style.cursor = 'se-resize';

  function move(ev) {
    let x;
    let y;
    x = ev.pageX - _this.offsetLeft;
    y = ev.pageY - _this.offsetTop;
    if (_this.offsetLeft + x > document.body.clientWidth) {
      x = document.body.clientWidth - _this.offsetLeft;
    }
    _this.style.width = `${x}px`;
    _this.style.height = `${y}px`;
  }

  function up() {
    _this.style.overflow = '';
    _this.style.opacity = '';
    _this.style.cursor = '';

    updateTerminalSize();
    resize();

    document.getElementById('noVNC_canvas').removeEventListener('mousemove', move);
    document.getElementById('noVNC_canvas').removeEventListener('mouseup', up);
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
  }
  document.getElementById('noVNC_canvas').addEventListener('mousemove', move);
  document.getElementById('noVNC_canvas').addEventListener('mouseup', up);
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
};


function initOptions(term) {
}

function closeTerminal() {
  if (socket) {
    socket.close();
  }
  socket = null;
}


function onClose() {
 isopen = false;
 termOpen = false;
 pid=0;
}

function createTerminal() {

  let bReturn = false;
  let terminalContainer = document.getElementById('terminal-container');

  // Clean terminal
  while (terminalContainer.children.length) {
    terminalContainer.removeChild(terminalContainer.children[0]);
  }

  const isWindows = ['Windows', 'Win16', 'Win32', 'WinCE'].indexOf(navigator.platform) >= 0;
  
  term = new Terminal({
    allowProposedApi: true,
    windowsMode: isWindows,
    fontFamily: '"Fira Code", courier-new, courier, monospace, "Powerline Extra Symbols"',
    theme: xtermjsTheme,
    cursorBlink: false,
    cols: 80,
    rows: 24,
    scrollback: 0
  } );


  window.term = term;  // Expose `term` to window for debugging purposes

  term.onResize((size) => {
    if (!pid || !termOpen) {
      return;
    }

    const cols = size.cols;
    const rows = size.rows;
    const url = window.od.net.urlrewrite('/terminals/' + pid + '/size?cols=' + cols + '&rows=' + rows);
    const options = {
      method: 'POST',
      headers : {
        'ABCAuthorization':'Bearer ' + window.od.currentUser.authorization
      }
    };
    // console.log("resizing terminal " + url );
    fetch(url, options)
      .catch(() => {
        console.log("resize terminal failed");
      });
  });

  let protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
  socketURL = protocol + location.hostname + ((location.port) ? (':' + location.port) : '') + '/terminals/';

  // webgl loading failed for some reason, attach with DOM renderer
  term.open(terminalContainer);
  term.focus();

  // fit is called within a setTimeout, cols and rows need this.
  setTimeout(async () => {
    initOptions(term);

    // Set terminal size again to set the specific dimensions on the shell
    updateTerminalSize();

    const { urlrewrite } = window.od.net;
    const url = urlrewrite(`/terminals?cols=${term.cols}&rows=${term.rows}`);
    const options = {
      method: 'POST',
      headers: {
        'ABCAuthorization': `Bearer ${window.od.currentUser.authorization}`
      },
    };

    const res = await fetch(url, options);
    pid = await res.json();

    socketURL += `${pid}?${window.od.currentUser.authorization}`;
    socket = new WebSocket( window.od.net.wsurlrewrite(socketURL) );
    socket.onopen = runRealTerminal;
    socket.onclose = onClose;
    socket.onerror = runFakeErrorTerminal;
  }, 0);

}


function runRealTerminal() {
  const fitAddon = new FitAddon.FitAddon();
  const attachAddon = new AttachAddon.AttachAddon(socket);
  const webLinksAddon = new WebLinksAddon.WebLinksAddon();
  term.loadAddon(fitAddon); // fit is the first one
  term.loadAddon(attachAddon);
  term.loadAddon(webLinksAddon);
  term._initialized = true;
  termOpen = true;
  fitAddon.fit();
  isopen = true;
  // initAddons(term);
}





function runFakeErrorTerminal() {

  if (term._initialized) {
    return;
  }

  term._initialized = true;

  let shellprompt = '$ ';

  term.prompt = function () {
    term.write('\r\n' + shellprompt);
  };

  term.writeln('Welcome to xterm.js');
  term.writeln('The terminal back-end can not be reach.');
  term.writeln('This is an error.');
  term.writeln('Type some keys and commands to play around.');
  term.writeln('');
  term.prompt();

  term.onKey((e) => {
    const ev = e.domEvent;
    const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

    if (ev.keyCode === 13) {
      term.prompt();
    } else if (ev.keyCode === 8) {
     // Do not delete the prompt
      if (term._core.buffer.x > 2) {
        term.write('\b \b');
      }
    } else if (printable) {
      term.write(e.key);
    }
  });
  term.on('paste', function (data, ev) {
    term.write(data);
  });
}
   

function addDomListener(element, type, handler) {
  element.addEventListener(type, handler);
  term._core.register({ dispose: () => element.removeEventListener(type, handler) });
}

function updateTerminalSize() {

  if (!window.term || !isopen) {
    return;
  }

  let webshell = document.getElementById('webshell');
  let terminalContainer = document.getElementById('terminal-container');
  
  let webshellcontrol = document.getElementById('webshellcontrol');
  let controlpadheight = (webshellcontrol) ? webshellcontrol.clientHeight : 0;
  // console.log( 'webshellcontrol.clientHeight=' + controlpadheight);

  let width = webshell.clientWidth;
  let height = webshell.clientHeight - controlpadheight; 
  // console.log( 'terminalContainer width=' + width + ' height=' + height );

  terminalContainer.style.width  = width  + 'px';
  terminalContainer.style.height = height + 'px';;
}

function updateTerminalSizeandResize() {
  updateTerminalSize();
  resize();
}

window.addEventListener('resize', updateTerminalSizeandResize);
