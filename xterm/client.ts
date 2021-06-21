/// <reference path="./typings/xterm.d.ts"/>
import { Terminal } from './lib/public/Terminal';
import * as attach from './lib/addons/attach/attach';
import * as fit from './lib/addons/fit/fit';
import * as fullscreen from './lib/addons/fullscreen/fullscreen';
import * as search from './lib/addons/search/search';
import * as webLinks from './lib/addons/webLinks/webLinks';

// Pulling in the module's types relies on the <reference> above, it's looks a
// little weird here as we're importing "this" module
import { Terminal as TerminalType } from 'xterm';

export interface IWindowWithTerminal extends Window {
  term: TerminalType;
  createTerminal:Function;
  closeTerminal:Function;
  od:any;
}
declare let window: IWindowWithTerminal;

Terminal.applyAddon(attach);
Terminal.applyAddon(fit);
Terminal.applyAddon(fullscreen);
Terminal.applyAddon(search);
Terminal.applyAddon(webLinks);

let term;
let socketURL;
let socket;
let currentSocket;
let pid;

const terminalContainer = document.getElementById('terminal-container');

window.createTerminal = function (onWSClose) {
  // Clean terminal
  while (terminalContainer.children.length) {
    terminalContainer.removeChild(terminalContainer.children[0]);
  }

  term = new Terminal({cursorBlink: true,cols: 80,rows: 24});
  window.term = term;  // Expose `term` to window for debugging purposes
  term.onResize((size: { cols: number, rows: number }) => {
    if (!pid) {
      return;
    }

    const cols = size.cols;
    const rows = size.rows;
    const url = window.od.net.urlrewrite('/terminals/' + pid + '/size?cols=' + cols + '&rows=' + rows);
    const options = {
      method: 'POST',
      headers : {
        'Authorization':'Bearer ' + window.od.currentUser.authorization
      }
    };
    fetch(url, options)
      .catch(() => {
        console.log("resize terminal failed");
      });
  });

  socketURL =  window.od.net.getorignwsurl('/terminals/');
  term.open(terminalContainer);
  //term.winptyCompatInit();
  term.fit();
  term.focus();

  // fit is called within a setTimeout, cols and rows need this.
  setTimeout(async function () {
    try {
      const { urlrewrite } = window.od.net;
      const url = urlrewrite(`/terminals?cols=${term.cols}&rows=${term.rows}`);
      const options : RequestInit = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.od.currentUser.authorization}`
        },
      };

      const res = await fetch(url, options);
      const pid:number = await res.json();

      socketURL += `${pid}?${window.od.currentUser.authorization}`;
      socket = new WebSocket( window.od.net.wsurlrewrite(socketURL) );
      socket.onopen = runRealTerminal;
      socket.onerror = runFakeTerminal;
      socket.onclose = () => {
        if (typeof onWSClose === "function") {
          onWSClose();
        }
        currentSocket = null;
      };
      currentSocket = socket;
    } catch(e) {
      console.error("create terminals failed", e);
    }
  }, 0);
};

window.closeTerminal = function() {
  if (currentSocket) {
    currentSocket.close();
  }
  else
    console.warn("No socket found");
};

function runRealTerminal() {
  term.attach(socket);
  term._initialized = true;
}

function runFakeTerminal() {
  if (term._initialized) {
    return;
  }

  term._initialized = true;

  let shellprompt = '$ ';

  term.prompt = function () {
    term.write('\r\n' + shellprompt);
  };

  term.writeln('Welcome to xterm.js');
  term.writeln('This is a local terminal emulation, without a real terminal in the back-end.');
  term.writeln('Type some keys and commands to play around.');
  term.writeln('');
  term.prompt();

  term.onKey((e: { key: string, domEvent: KeyboardEvent }) => {
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
