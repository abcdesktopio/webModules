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

export function init(home, logs) {
  system.hide(home);

  if (!firstAppear) {
    system.show(logs);
    return;
  }
  firstAppear = false;

  launcher.getLogs((data) => {
    const logsTab = system.removeAllChilds(document.getElementById('logs-tab'));
    if (!logsTab) {
      return;
    }

    const div = document.createElement('div');
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    div.className = 'container-logs card';
    data.result.split('\n')
      .map((row) => {
        const p = document.createElement('p');
        p.innerText = row;
        p.style.margin = 0;
        return p;
      })
      .reduce((cardBody, p) => {
        cardBody.appendChild(p);
        return cardBody;
      }, cardBody);

    div.appendChild(cardBody);
    logsTab.appendChild(div);
  });
  system.show(logs);
}

settingsEvents.addEventListener('close', () => {
  firstAppear = true;
});
