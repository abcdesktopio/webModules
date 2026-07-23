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
  /*
    if (element_added) {
    const div_welcomeinfo = document.getElementById('welcomeinfo');
    if (div_welcomeinfo)
      div_welcomeinfo.appendChild(document.createElement("hr"));
  } 
  */   
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

    if (msg.title) {
	    let element_title = document.createElement("p");
    	element_title.appendChild(document.createTextNode(msg.title));
      element_title.className = "login-brand__additionnalloginScreencontenttag";
   	  div.appendChild(element_title);
	    element_added = true;
    }

    if (msg.information) {
	    // div.appendChild(document.createElement("br"));
    	let element_msg_information = document.createElement("div");
    	element_msg_information.innerHTML = msg.information;
    	element_msg_information.classList.add('login-brand__welcomeinfomessage');
	    div.appendChild(element_msg_information);
    }

    if (msg.script) {
      // To dynamically add a script tag, you need to create a new script element and append it to the target element.
      // You can do this for external scripts:
      if (msg.script.src) {
        let newScript = document.createElement("script");
        newScript.async = msg.script.async;
        newScript.src = msg.script.src;
        div.appendChild(newScript);
      }
      // And inline scripts:
      if (msg.script.data) {
        let newScript = document.createElement("script");
        let inlineScript = document.createTextNode(msg.script.data);
        newScript.appendChild(inlineScript);
        div.appendChild(newScript);
      }
    }

    div_welcomeinfo.appendChild(div);
  }
}


export function init() {
  launcher.getkeyinfo('welcomeinfo').done((msg) => {
    if (msg && msg.id && msg.id.welcome) {
      show( msg.id.welcome );
    }
  });
}
