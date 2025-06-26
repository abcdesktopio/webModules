/* Helper functions for debugging */

/**
 * @name BroadwayVNC
 * @module
 */
import { isTouchDevice } from './noVNC/core/util/browser.js';
import { clipboardsync, getTopAndDockHeight } from './launcher.js';
import * as WebUtil from './noVNC/app/webutil.js';
import RFB from './noVNC/core/rfb.js';
import * as clipboard from './clipboard.js';
import KeyTable from "./noVNC/core/input/keysym.js";
import keysyms from "./noVNC/core/input/keysymdef.js";
import Keyboard from "./noVNC/core/input/keyboard.js";

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
  let keyboardinput = null;
  let touchKeyboard = null;
  let toggleVirtualKeyboardFlag = false;
  

  /**
     * @function syncClipBoardtoAbcDesktop
     * @param {string} clipBoardTextData
     * @return {void}
     * @desc Send data to VNC RFB Clipboard
     */
  this.syncClipBoardtoAbcDesktop = function(clipBoardTextData) {
    if (clipBoardTextData) {
      // console.log(`syncClipBoardtoAbcDesktop: send data to VNC clipboard ${clipBoardTextData}`);
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
  this.syncClipBoardtoUserAgent = function(clipBoardTextData) {
    if (clipBoardTextData && clipBoardTextData.detail) {
      // console.log(`VNC2Android:ClipBoardCopy ${clipBoardTextData.detail.text}`);
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
     * @function init
     * @return {void}
     * @desc Bind keyboard event and create canvas {@link creatediv}
     */
  this.init = function() {

    if (isTouchDevice) {
      const keyboardinput = document.getElementById('noVNC_keyboardinput');
      if (keyboardinput) {
        touchKeyboard = new Keyboard(keyboardinput);
        touchKeyboard.onkeyevent = keyEvent;
        touchKeyboard.grab();
        keyboardinput.addEventListener('input', this.keyInput);
        keyboardinput.addEventListener('submit', () => false);   
        keyboardinput.addEventListener('focus', this.onfocusVirtualKeyboard);
        document.documentElement.addEventListener('mousedown', this.keepVirtualKeyboard, true); 
      }
    }
  };


  this.showVirtualKeyboard = function() {
    if (!isTouchDevice) return;
    const input = document.getElementById('noVNC_keyboardinput');
    if (document.activeElement == input) return;
    input.focus();
    try {
        const l = input.value.length;
        // Move the caret to the end
        input.setSelectionRange(l, l);
    } catch (err) {
        // setSelectionRange is undefined in Google Chrome
    }
  }

  this.hideVirtualKeyboard = function() {
    if (!isTouchDevice) return;
    const input = document.getElementById('noVNC_keyboardinput');
    if (document.activeElement != input) return;
    input.blur();
  }

  this.toggleVirtualKeyboard = function() {
    if (!isTouchDevice) return;
    if (toggleVirtualKeyboardFlag) {
      toggleVirtualKeyboardFlag = false;
      this.hideVirtualKeyboard();
    } else {
      toggleVirtualKeyboardFlag = true;
      this.showVirtualKeyboard();
    } 
  }
  this.onfocusVirtualKeyboard = function() {
    if ( window.od.broadway.rfb) {
      rfb.focusOnClick = false;
    }
  }

  this.onblurVirtualKeyboard = function(event) {
   
    if (window.od.broadway.rfb) {
        rfb.focusOnClick = true;
    }
},



  this.keepVirtualKeyboard = function(event) {
    
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
  }
  
  this.keyboardinputReset = function () {
    const kbi = document.getElementById('noVNC_keyboardinput');
    kbi.value = new Array(defaultKeyboardinputLen).join("_");
    lastKeyboardinput = kbi.value;
  }
  
function keyEvent(keysym, code, down) {
    if (!window.od.broadway.rfb) return;
    window.od.broadway.rfb.sendKey(keysym, code, down);
  }
  
  // When normal keyboard events are left uncought, use the input events from
  // the keyboardinput element instead and generate the corresponding key events.
  // This code is required since some browsers on Android are inconsistent in
  // sending keyCodes in the normal keyboard events when using on screen keyboards.
  this.keyInput = function (event) {

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

      let inputs = newLen - oldLen;
      let backspaces = inputs < 0 ? -inputs : 0;

      // Compare the old string with the new to account for
      // text-corrections or other input that modify existing text
      for (let i = 0; i < Math.min(oldLen, newLen); i++) {
          if (newValue.charAt(i) != oldValue.charAt(i)) {
              inputs = newLen - i;
              backspaces = oldLen - i;
              break;
          }
      }

      // Send the key events
      for (let i = 0; i < backspaces; i++) {
          rfb.sendKey(KeyTable.XK_BackSpace, "Backspace");
      }
      for (let i = newLen - inputs; i < newLen; i++) {
          rfb.sendKey(keysyms.lookup(newValue.charCodeAt(i)));
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
  }



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

    if (isTouchDevice) {
      // if the user is using a touch device, reset the virtual keyboard
      this.keyboardinputReset();
    }

    // set path value from window.od.currentUser.websocketrouting
    //
    //  
    if (window.od.currentUser.websocketrouting && window.od.currentUser.websocketrouting === 'bridge') {
      path = '';
      port = window.od.currentUser.websockettcpport;
    } 
    else { 
      path = `websockify?jwt_token=${window.od.currentUser.authorization}`;
    }
    url = window.od.net.getwsurl(path, window.od.currentUser.target_ip, port );
   
    try {
      let noVNC_container = document.getElementById('noVNC_container');
      if (noVNC_container) {
        noVNC_container.style.display = 'block';
      }
      else {
        noVNC_container = document.body;
      }
      rfb = new RFB( noVNC_container, url,
	      {	repeaterID: WebUtil.getConfigVar('repeaterID', ''),
        	shared: WebUtil.getConfigVar('shared', true),
        	credentials: { password },
      	}
      );
      
      // set an id to the RFB canvas
      // after the constructor
      rfb._canvas.id = 'noVNC_canvas';
      rfb.qualityLevel = 8;
      // 
      // set default background by reading value from body 
      rfb._screen.style.background = window.getComputedStyle(document.body).getPropertyValue('background-color');
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
    window.od.broadway.rfb.addEventListener('clipboard',  this.syncClipBoardtoUserAgent);
  };
}
