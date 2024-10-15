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
 * @name desktopfeatures
 * @module
 */

import * as launcher from './launcher.js';
import * as languages from './languages.js';

let element_added = false;

function show( msg ) {
  // 
  const div_desktopfeatures = document.getElementById('desktopfeatures');
  if (div_desktopfeatures)
  	add(msg);
}

function onclickfeaturesclass(element) {
	if (element) {
		const div_desktopfeatures = document.getElementById('desktopfeatures');
		if (div_desktopfeatures) {
			if (!div_desktopfeatures.features)
			  div_desktopfeatures.features = {};
			div_desktopfeatures.features[element.srcElement.name] = element.srcElement.id;
		}
	}
}

function add( msg ) {
  const div_desktopfeatures = document.getElementById('desktopfeatures');

  /*
<ul class="nav nav-pills nav-fill gap-2 p-1 small bg-primary rounded-1 shadow-sm" id="pillNav2" role="tablist" style="--bs-nav-link-color: var(--bs-white); --bs-nav-pills-link-active-color: var(--bs-primary); --bs-nav-pills-link-active-bg: var(--bs-white); id="desktopfeaturesul">	
 <li class="nav-item" role="presentation">
    <button class="nav-link rounded-1 active" id="home-tab2" data-bs-toggle="tab" type="button" role="tab" aria-selected="true">Hello</button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link rounded-1" id="profile-tab2" data-bs-toggle="tab" type="button" role="tab" aria-selected="false" tabindex="-1">Profile</button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link rounded-1" id="contact-tab2" data-bs-toggle="tab" type="button" role="tab" aria-selected="false" tabindex="-1">Contact</button>
  </li>
</ul>		
*/
  if (div_desktopfeatures) {
    
    let ul = document.getElementById("desktopfeaturesul");
    if (!ul) return;

    let selected=true;
    for(var key in msg) {
	if (key === "default") continue;

	// create li
    	//  <li class="nav-item" role="presentation">
    	let li  = document.createElement("li");
    	li.setAttribute("class", "nav-item");
    	li.setAttribute("role", "presentation");

	// create button
    	// <button class="nav-link rounded-1 active" id="home-tab2" data-bs-toggle="tab" type="button" role="tab" aria-selected="true">Hello</button>
    	let button = document.createElement("button");
	let classname = "nav-link rounded-1";
	if (selected) classname += " active";
    	button.setAttribute("class", classname);
    	button.setAttribute("id", key );
	// id should be unique but you can use multiple form elements with the same NAME. 
	// This is standard for how radio buttons work so you can force one seletion of a radio button group.
	button.setAttribute("name", 'executeclassname' );
	button.setAttribute("data-bs-toggle", "tab" );
	button.setAttribute("type", "button" );
	button.setAttribute("role", "tab" );
	button.setAttribute("aria-selected", selected);
	button.textContent = msg[key].description;
	button.addEventListener("click", onclickfeaturesclass );

	// append element 
	li.appendChild(button,null);
	ul.appendChild(li,null);

	// only the first one is selected by default
	selected=false;
    }
    // if we add li and ul
    if (!selected) {
	// show div desktopfeatures
     	div_desktopfeatures.style.display = 'block';
    }
  }
}


export function init() {
  // if desktopfeatures exist
  const div_desktopfeatures = document.getElementById('desktopfeatures');
  if (div_desktopfeatures) {
	// query backand api to get features_permissions_executeclasses
  	launcher.getkeyinfo('features_permissions_executeclasses').done((msg) => {
    	if (msg && msg.id ) {
      		show( msg.id );
    	}
  	});
  }
}
