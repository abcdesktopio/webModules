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
 * @name AboutSystem
 * @module
 */

import * as launcher from './launcher.js';
import * as system from './system.js';
import * as languages from './languages.js';

let networkinterfacesdescriptions = {};
let networkinterfaces = {};

export const tipsinfoEvents = new EventTarget();

/**
 * @function init
 * @returns {void}
 * @desc Add an event listener for closing the window.
 */
export const init = function() {
  for (var key in networkinterfacesdescriptions){
    networkinterfaces[ networkinterfacesdescriptions[key] ] = 'unknow';
  }
}

/**
 * @function open
 * @returns {void}
 * @desc Add an event listener for closing the window.
 */
export const open = function () {
  readRenderDescription();
};

function readRenderDescription() {
  launcher.getdesktopdescription()
    .then((res) => {
      // should be like networkinterfacesdescriptions = { 'private': 'lo', 'public': 'eth0' };
      if (res && res.result) {
        fetch('/tips/template/tipsinfo-window-body-template.mustache.html')
        .then((response) => response.text())
        .then((template) => {
          if (res.result.sshconfig) {
            // render commandline
            for (var key in res.result.sshconfig){
              for (var keyos in res.result.sshconfig[key]){
                let newrenderdata = Mustache.render(res.result.sshconfig[key][keyos], res.result );
                res.result.sshconfig[key][keyos] = newrenderdata;
              }
            }
          }
          var tipsinfo_innerHTML = Mustache.render(template, res.result );
          showpage( tipsinfo_innerHTML );
        });
      }
    });
}



function showpage( tipsinfo_innerHTML ) {
  const templateTitle = document.querySelector('template#tipsinfo-window-title-template');
  const templateBody = document.querySelector('template#tipsinfo-window-body-template');

  bootbox.dialog({
    title: templateTitle.innerHTML,
    message: `
      <div id="tipsinfo-window">
        ${tipsinfo_innerHTML}
      </div>
    `,
    className: 'window-dialog window-dialog-settings',
    animate: false,
    onEscape: () => {
      tipsinfoEvents.dispatchEvent(new CustomEvent('close'));
    },
  });

  /*
  const settingsTitle = document.getElementById('tipsinfo-title');
  const windowsettings = document.getElementById('tipsinfo-window');
  const networkmap = document.getElementById('networkmap');
  networkmap 
  settingsTitle.innerText = languages.getTranslate('tipsinfo-title');

  const clone = windowsettings.cloneNode(true);
  windowsettings.parentElement.replaceChild(clone, windowsettings);

  languages.applyLanguage();
  */

  function setTitleSuffix(name = '') {
    const tipsinfoTitle = document.getElementById('tipsinfo-title');
    if (tipsinfoTitle) {
      tipsinfoTitle.innerText = `${languages.getTranslate('tipsinfo-title')}${name ? `:${name}` : ''}`;
    }
  }

}

function showatlogin() {
  launcher.getkeyinfo('tipsinfo').done((msg) => {
    if (msg && msg.id && msg.id.networkmap) {
      open();
    }
  });
}

document.addEventListener('broadway.connected', showatlogin);