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
 * @name welcomeinfo
 * @module
 */

import * as launcher from './launcher.js';
import * as languages from './languages.js';

let element_added = false;

function show( arr_msg ) {
  arr_msg.forEach((element) => add(element));
  if (element_added) {
    const div_welcomeinfo = document.getElementById('welcomeinfo');
    if (div_welcomeinfo)
      div_welcomeinfo.appendChild(document.createElement("hr"));
  }    
}


function checkdate( msg ) {
  const date_now = Date.now();
  if (msg.notbefore) {
    const date_notbefore = Date.parse(msg.notbefore);
    if (date_now < date_notbefore)
      return false;
  }
  if (msg.notafter) {
    const date_notafter = Date.parse(msg.notafter);
    if (date_now > date_notafter)
      return false;
  }
  return true;
} 

function add( msg ) {
  const div_welcomeinfo = document.getElementById('welcomeinfo');
  if (!checkdate(msg))
    return;

  if (div_welcomeinfo) {
    var div = document.createElement("div");
    div.appendChild(document.createElement("hr"));

    let element_title = document.createElement("code");
    element_title.appendChild(document.createTextNode(msg.title));
    div.appendChild(element_title);

    div.appendChild(document.createElement("br"));
    div.appendChild(document.createElement("br"));

    let element_msg_information = document.createElement("div");
    let msg_information = document.createTextNode(msg.information);
    element_msg_information.appendChild(msg_information);
    element_msg_information.classList.add('welcomeinfomessage');

    div.appendChild(element_msg_information);
    div_welcomeinfo.appendChild(div);
    element_added = true;
  }
}


export function init() {
  launcher.getkeyinfo('welcomeinfo').done((msg) => {
    if (msg && msg.id && msg.id.welcome) {
      show( msg.id.welcome );
    }
  });
}
