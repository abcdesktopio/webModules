/* Helper functions for debugging */

/**
 * @name BroadwayVNC
 * @module
 */
import {
  clipboardsync,
  getTopAndDockHeight,
} from './launcher.js';
import * as WebUtil from './noVNC/app/webutil.js';
import KeyTable from './noVNC/core/input/keysym.js';
import RFB from './noVNC/core/rfb.js';
import keysyms from './noVNC/core/input/keysymdef.js';
import Keyboard from './noVNC/core/input/keyboard.js';
import * as clipboard from './clipboard.js';

function readyStateToMsg(readyState) {
  let msg = '';
  if (!readyState) { return msg; }
  // Values come from https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
  switch (readyState) {
    case WebSocket.CLOSED:
      msg = 'The connection is closed or could not be opened.';
      break;
    case WebSocket.CLOSING:
      msg = 'The connection is in the process of closing.';
      break;
    case WebSocket.OPEN:
      msg = 'The connection is open and ready to communicate.';
      break;
    case WebSocket.CONNECTING:
      msg = 'Socket has been created. The connection is not yet open.';
      break;
    default:
      msg = 'Invalid socket readyState.';
  }
  return msg;
}

export default function BroadwayVNC() {
  let rfb = null;
  let lastKeyboardinput = null;
  const defaultKeyboardinputLen = 100;
  let isTouchDevice = false;
  let keyboardinput = null;

  /**
     * @function setview_only
     * @param {boolean} mode
     * @return {void}
     * @desc Toggle readonly mode
     */
  this.setview_only = function (mode) {
    this.view_only = mode;
  };

  /**
     * @function androidMouseCallHandler
     * @param {number} x
     * @param {number} y
     * @param {boolean} down
     * @param {integer} button
     * @return {void}
     * @desc Wrap android's mouse event to X11
     */
  this.androidMouseCallHandler = function (x, y, down, button) {
    console.log(`androidMouseCallHandler (${x},${y},${down},${button})`);
    // Translate mouse y
    // Remove the offsetTop og canvas
    // y -= this.canvas.offsetTop;

    //
    // Translate mouse x
    // get marging size and remove the half size for each side
    // margingx = (window.innerWidth - this.canvas.width) / 2;
    // x -= margingx;
    rfb._handleMouseButton(x, y, down, button);
  };

  /**
     * @function syncClipBoardtoAbcDesktop
     * @param {string} clipBoardTextData
     * @return {void}
     * @desc Send data to VNC RFB Clipboard
     */
  this.syncClipBoardtoAbcDesktop = function (clipBoardTextData) {
    if (clipBoardTextData) {
      console.log(`syncClipBoardtoAbcDesktop: send data to VNC clipboard ${clipBoardTextData}`);
      rfb.clipboardPasteFrom(clipBoardTextData);
      // sync data between the clipboard PRIMARY and clipboard CLIPBOARD
      // use for GTK application inside the opendektop graphicals container
      clipboardsync();
    }
  };

  /**
     * @function syncClipBoardtoUserAgent
     * @param {object} rfb
     * @param {string} clipBoardTextData
     * @return {void}
     * @desc Send data from VNC to Android device when user has copy somthing
     */
  // The user has copy somthing like TEXT (only ?) to the clipboard in the desktop session
  // Recieve the text data and forward to the device
  // Send data from VNC to device
  function syncClipBoardtoUserAgent(clipBoardTextData) {
    if (clipBoardTextData && clipBoardTextData.detail) {
      console.log(`VNC2Android:ClipBoardCopy ${clipBoardTextData.detail.text}`);
      if (typeof window.JsHandler === 'undefined') {
        clipboard.getClipboard(clipBoardTextData.detail.text);
      } else {
        window.JsHandler.ClipBoardJStoJava(clipBoardTextData.detail.text);
      }

      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(clipBoardTextData.detail.text)
          .catch((e) => {
            if (e) {
              if (e.message !== 'Document is not focused.') {
                console.error(e);
              }
            }
          });
      }
    }
  }

  /**
     * @function reconnect
     * @param {object} e
     * @return {void}
     * @desc Reconnect user to VNC
     */
  /* function reconnect(e) {
        console.debug('broadway_vnc:_reconnect', e);

        if (window.od.broadway.isReconnecting()) {
            console.log('Nothing to do broadway reconnecting is processing');
            return;
        }

        window.od.broadway.setReconnecting(true);
        console.log('reconnecting: broadway.connect();');
        window.od.broadway.connect();
        Util.stopEvent(e);
    } */

  function createNewEvent(eventName) {
    let myevent;
    if (typeof (Event) === 'function') {
      myevent = new Event(eventName);
    } else {
      myevent = document.createEvent('Event');
      myevent.initEvent(eventName, true, true);
    }
    return myevent;
  }

  /**
     * @function isReconnecting
     * @return {Boolean}
     * @desc Return reconnection status
     */
  this.isReconnecting = function () {
    return this._reconnecting;
  };

  /**
     * @function setReconnecting
     * @param {boolean} value
     * @return {Boolean}
     * @desc Set reconnection status
     */
  this.setReconnecting = function (value) {
    this._reconnecting = value;
  };

  /**
     * @function init
     * @return {void}
     * @desc Bind keyboard event and create canvas {@link creatediv}
     */
  this.init = function () {
    isTouchDevice = ('ontouchstart' in document.documentElement)
                                 // requried for Chrome debugger
                                 || (document.ontouchstart !== undefined)
                                 // required for MS Surface
                                 || (navigator.maxTouchPoints > 0)
                                 || (navigator.msMaxTouchPoints > 0);

    // // Bind keyboard event
    // keyboardinput = document.getElementById('keyboardinput');

    // keyboardinput.oninput = keyInput;
    // keyboardinput.onblur = keyInputBlur;
    // keyboardinput.onsubmit = function() {
    //     return false;
    // };

    // Util.addEvent(window, 'load', this.keyboardinputReset);
    // Bind event for zoom
    //
    keyboardinput = document.getElementById('noVNC_keyboardinput');
    if (!keyboardinput) return;

    const touchKeyboard = new Keyboard(keyboardinput);
    touchKeyboard.onkeyevent = this.keyEvent;
    touchKeyboard.grab();

    keyboardinput.addEventListener('input', this.keyInput);
    keyboardinput.addEventListener('focus', this.onfocusVirtualKeyboard);
    keyboardinput.addEventListener('blur', 	this.onblurVirtualKeyboard);
    keyboardinput.addEventListener('submit', () => false);

    document.documentElement.addEventListener('mousedown', this.keepVirtualKeyboard, true);
  };

  this.showVirtualKeyboard = function () {
    // VirtualKeyboard enable only on TouchDevice
    if (!isTouchDevice) return;

    const input = document.getElementById('noVNC_keyboardinput');

    // Sanity Check
    if (!input) return;
    if (document.activeElement == input) return;

    input.focus();
    try {
      const l = input.value.length;
      // Move the caret to the end
      input.setSelectionRange(l, l);
    } catch (err) {
      console.error(err);
    } // setSelectionRange is undefined in Google Chrome
  };

  this.hideVirtualKeyboard = () => {
    // VirtualKeyboard enable only on TouchDevice
    if (!isTouchDevice) return;

    const input = document.getElementById('noVNC_keyboardinput');
    if (document.activeElement != input) return;
    input.blur();
  };

  this.toggleVirtualKeyboard = () => {
    const keyboard = document.getElementById('keyboard');
    if (keyboard && keyboard.classList.contains('noVNC_selected')) { this.hideVirtualKeyboard(); } else { this.showVirtualKeyboard(); }
  };

  this.onfocusVirtualKeyboard = function () {
    const keyboard = document.getElementById('keyboard');
    if (keyboard) { keyboard.classList.add('noVNC_selected'); }
    if (window.od.rfb) {
      window.od.rfb.focusOnClick = false;
    }
  };

  this.onblurVirtualKeyboard = function () {
    const keyboard = document.getElementById('keyboard');
    if (keyboard) { keyboard.classList.remove('noVNC_selected'); }
    if (window.od.broadway.rfb) {
      window.od.broadway.rfb.focusOnClick = true;
    }
  };

  this.keepVirtualKeyboard = function (event) {
    const input = document.getElementById('noVNC_keyboardinput');

    // Only prevent focus change if the virtual keyboard is active
    if (document.activeElement != input) {
      return;
    }

    // Only allow focus to move to other elements that need
    // focus to function properly
    if (event.target.form !== undefined) {
      switch (event.target.type) {
        case 'text':
        case 'email':
        case 'search':
        case 'password':
        case 'tel':
        case 'url':
        case 'textarea':
        case 'select-one':
        case 'select-multiple':
          return;
      }
    }
    event.preventDefault();
  };

  this.keyboardinputReset = function () {
    const kbi = document.getElementById('noVNC_keyboardinput');
    if (kbi) {
      kbi.value = new Array(defaultKeyboardinputLen).join('_');
      lastKeyboardinput = kbi.value;
    }
  };

  this.keyEvent = function (keysym, code, down) {
    if (window.od.broadway.rfb) { window.od.broadway.rfb.sendKey(keysym, code, down); }
  };

  // When normal keyboard events are left uncought, use the input events from
  // the keyboardinput element instead and generate the corresponding key events.
  // This code is required since some browsers on Android are inconsistent in
  // sending keyCodes in the normal keyboard events when using on screen keyboards.
  this.keyInput = (event) => {
    if (!window.od.broadway.rfb) return;

    const newValue = event.target.value;

    if (!lastKeyboardinput) {
      this.keyboardinputReset();
    }

    const oldValue = lastKeyboardinput;
    let newLen;

    try {
      // Try to check caret position since whitespace at the end
      // will not be considered by value.length in some browsers
      newLen = Math.max(event.target.selectionStart, newValue.length);
    } catch (err) {
      // selectionStart is undefined in Google Chrome
      newLen = newValue.length;
    }
    const oldLen = oldValue.length;

    let backspaces;
    let inputs = newLen - oldLen;
    if (inputs < 0) {
      backspaces = -inputs;
    } else {
      backspaces = 0;
    }

    // Compare the old string with the new to account for
    // text-corrections or other input that modify existing text
    let i;
    for (i = 0; i < Math.min(oldLen, newLen); i++) {
      if (newValue.charAt(i) != oldValue.charAt(i)) {
        inputs = newLen - i;
        backspaces = oldLen - i;
        break;
      }
    }

    // Send the key events
    for (i = 0; i < backspaces; i++) {
      window.od.broadway.rfb.sendKey(KeyTable.XK_BackSpace, 'Backspace');
    }
    for (i = newLen - inputs; i < newLen; i++) {
      window.od.broadway.rfb.sendKey(keysyms.lookup(newValue.charCodeAt(i)));
    }

    // Control the text content length in the keyboardinput element
    if (newLen > 2 * defaultKeyboardinputLen) {
      this.keyboardinputReset();
    } else if (newLen < 1) {
      // There always have to be some text in the keyboardinput
      // element with which backspace can interact.
      this.keyboardinputReset();
      // This sometimes causes the keyboard to disappear for a second
      // but it is required for the android keyboard to recognize that
      // text has been added to the field
      event.target.blur();
      // This has to be ran outside of the input handler in order to work
      setTimeout(event.target.focus.bind(event.target), 0);
    } else {
      lastKeyboardinput = newValue;
    }
  };

  function sendevent(name) {
    try {
      const myevent = createNewEvent(name);
      document.dispatchEvent(myevent);
    } catch (err) {
      console.log(err);
    }
  }

  this.connected = function () {
    sendevent('broadway.connected');
  };

  this.disconnected = function (e) {
    sendevent('broadway.disconnected');

    // This is only to write log
    if (e instanceof Event) {
      let msg = 'Disconnected: ';
      let source = '';
      if (e.target && e.target.constructor && e.target.constructor.name) { source = e.target.constructor.name; }
      if (rfb && rfb._sock && rfb._sock._websocket && rfb._sock._websocket.readyState) {
        const readyStateMessage = readyStateToMsg(rfb._sock._websocket.readyState);
        msg += `${source}: ${readyStateMessage}`;
      }
      console.log(msg);
    }
  };

  this.isConnected = function (e) {
    if (rfb && rfb._rfbConnectionState) { return rfb._rfbConnectionState == 'connected'; }
    return false;
  };

  /**
     * @function connect
     * @param  {callback} callback
     * @return {void}
     * @desc Connect user to VNC Server.
     */
  this.connect = function () {
    let password;
    let path;
    let url;
    let port;
    password = window.od.currentUser.vncpassword;
    this.keyboardinputReset();

    // set path value from window.od.currentUser.websocketrouting
    //
    //  
    if (window.od.currentUser.websocketrouting && window.od.currentUser.websocketrouting === 'bridge')
    {
      path = '';
      port = window.od.currentUser.websockettcpport;
    }
    else
    { 
      path = `websockify?jwt_token=${window.od.currentUser.authorization}`;
    }
    url = window.od.net.getwsurl(path, window.od.currentUser.target_ip, port );
   
    try {
      rfb = null;
      rfb = new RFB(document.body, url, {
        repeaterID: WebUtil.getConfigVar('repeaterID', ''),
        shared: WebUtil.getConfigVar('shared', true),
        credentials: { password },
      });
      
      // set an id to the RFB canvas
      // after the constructor
      rfb._canvas.id = 'noVNC_canvas';

      // 
      // set default background
      rfb._screen.style.background = '#6ec6f0';
      rfb._screenSize = function () {
        const h = this._screen.offsetHeight - getTopAndDockHeight();
        return {
          w: this._screen.offsetWidth,
          h,
        };
      };
      
      // Is a boolean indicating if the remote session should be clipped to its container. 
      // When disabled scrollbars will be shown to handle the resulting overflow. Disabled by default.
      rfb.clipViewport = true;

      // Permit RFB autoresize
      // indicating if a request to resize the remote session
      // should be sent whenever the container changes dimensions.
      rfb.resizeSession = true;

      // Permit RFB viewport
      // indicating if the remote session should be scaled
      // locally so it fits its container. When disabled it will be centered
      // if the remote session is smaller than its container, or handled
      // according to `clipViewport` if it is larger.
      rfb.scaleViewport = true;

    } catch (exc) {
      // this.updateState(null, 'fatal', null, 'Unable to create RFB client -- ' + exc);
      console.error(`Unable to create RFB client -- ${exc}`);
      return; // don't continue trying to connect
    }

    // Store rfb in window object
    window.od.broadway.rfb = rfb;
    window.od.broadway.rfb.addEventListener('connect',    this.connected);
    window.od.broadway.rfb.addEventListener('disconnect', this.disconnected);
    window.od.broadway.rfb.addEventListener('clipboard',  syncClipBoardtoUserAgent);
  };
}
