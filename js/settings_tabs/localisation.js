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

import * as system from '../system.js';
import * as launcher from '../launcher.js';

import { settingsEvents } from '../settingsevents.js';

let firstAppear = true;

export function init(home, localisation) {
  system.hide(home);

  if (!firstAppear) {
    system.show(localisation);
    return;
  }
  firstAppear = false;

  system.removeAllChilds(document.getElementById('userxy'));
  document.getElementById('serverxy').innerText = '';
  launcher.getlocation().done((msg) => {
    let key; let span; let
      keyName;

    if (msg && msg.status === 200 && msg.result) {
      console.debug(`server location: ${msg.result.server}`);
      console.debug(`user location: ${msg.result.user}`);
    } else {
      console.error(`getlocation return invalid data object status:${msg.status}`);
      return;
    }

    for (key in msg.result.server) {
      if (!msg.result.server[key] || key === 'location') {
        continue;
      }

      span = document.createElement('span');
      keyName = key.toLocaleLowerCase().replace(/_/g, ' ');
      if (keyName.includes(' ')) {
        keyName = keyName.split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        span.textContent = `${keyName} : ${msg.result.server[key] ? msg.result.server[key] : null}`;
      } else {
        span.textContent = `${keyName.charAt(0).toUpperCase() + key.slice(1)} : ${msg.result.server[key] ? msg.result.server[key] : null}`;
      }
      document.getElementById('serverxy').appendChild(span);
    }

    for (key in msg.result.user) {
      if (!msg.result.user[key] || key === 'location') { continue; }
      span = document.createElement('span');
      keyName = key.toLocaleLowerCase().replace(/_/g, ' ');
      if (keyName.includes(' ')) {
        keyName = keyName.split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        span.textContent = `${keyName} : ${msg.result.user[key] ? msg.result.user[key] : null}`;
      } else { span.textContent = `${keyName.charAt(0).toUpperCase() + key.slice(1)} : ${msg.result.user[key] ? msg.result.user[key] : null}`; }

      document.getElementById('userxy').appendChild(span);
    }

    /*
    const userPosition = {
      lat: msg.result.user.location[0],
      lng: msg.result.user.location[1],
    };
    const serverPosition = {
      lat: msg.result.server.location[0],
      lng: msg.result.server.location[1],
    };
        const markerUser = new google.maps.Marker({
            position: userPosition,
            title: 'You'
        });

        const markerServer = new google.maps.Marker({
            position: serverPosition,
            map: map,
            title: 'Server'
        });
        map.setCenter(userPosition);
        markerServer.setMap(map);
        markerUser.setMap(map);
    */
  });
  system.show(localisation);
}

settingsEvents.addEventListener('close', () => {
  firstAppear = true;
});
