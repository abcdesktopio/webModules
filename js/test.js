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

export var waitingFor;
export var div;
export var pid;
export var iddivTestWindow;
export var tasklist;
export var loaded;

export const init = function () {
  tasklist = new Array();
  iddivTestWindow = 'divTestWindow';
  loaded = true;
};

export const newTestWindow = function (innerHTML) {
  const mydiv = document.createElement('div');
  mydiv.id = iddivTestWindow;
  mydiv.style.display = 'none';
  mydiv.innerHTML = innerHTML;
  return mydiv;
};

export const findTask = function (windowTitle) {
  let bfind = false;
  if (!window.od.test.tasklist) { return bfind; }
  bfind = window.od.test.tasklist.find((element) => {
    const b = element.indexOf(windowTitle);
    return b != -1;
  });
  if (bfind) {
    window.od.test.tasklist = new Array();
    bfind = true;
  } else { bfind = false; }
  return bfind;
};

export const broadcastWL = function (msg) {
  if (msg && msg.data) {
    for (let i = 0; i < msg.data.length; i++) {
      if (!msg.data[i].title) continue;
      const windowsTitle = msg.data[i].title;
      if (!window.od.test.tasklist) window.od.test.tasklist = new Array();
      window.od.test.tasklist.push(windowsTitle);
      // console.log( 'test.broadcastWL ' + windowsTitle );
    /*
		var windowsTitle = msg.data[i].title;
		console.log( windowsTitle );
		if ( windowsTitle.indexOf( waitingFor ) != -1  ) {
			var mydiv = window.od.test.newTestWindow( windowsTitle );
			document.body.appendChild(mydiv);
			pid = msg.data[i].pid;
		}
		*/
    }
  }
};

export const sendText = function (msg) {
  for (let i = 0; i < msg.length; i++) {
    const code = msg.charCodeAt(i);
    if (code) {
      window.od.broadway.rfb.sendKey(code);
    }
  }
};

export const setFocus = function () {
  // document.activeElement.blur();
  // activatewindowbypid(pid);
};

export const randomFilename = function (t) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < t; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }

  return text;
};

export const getLorem = function (n) {
  const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed mollis accumsan tincidunt. In malesuada risus at hendrerit posuere. Nunc auctor libero sed sem porttitor sodales. Ut accumsan ipsum quis mi commodo, vitae tristique magna aliquet. Sed in mi eget tortor dictum gravida eget non mi. Nam vitae nulla posuere, pretium velit eget, congue est. Etiam vehicula arcu et ligula porta pulvinar. Nullam eget est est. Quisque sed efficitur massa. Ut in neque ac quam pellentesque venenatis. Aliquam erat volutpat. Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

  n = (n) || lorem.length;
  // var lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed mollis accumsan tincidunt.";
  return lorem.substring(0, n);
};

export const type = function (words) {
  const start = new Date().getTime();
  (function writer(i) {
    const string = words[i];
    if (words.length <= i++) {
      // self.sendText(string);
      const end = new Date().getTime();
      console.log((end - start) / 1000);
      // document.body.appendChild(div);
      return;
    }
    sendText(string);
    const rand = Math.floor(Math.random() * (200)) + 50;
    setTimeout(() => { writer(i); }, rand);
  }(0));
};
