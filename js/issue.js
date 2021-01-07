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

import * as languages from './languages.js';
import * as whichBrowser from './which-browser.js';
import * as launcher from './launcher.js';

/**
 * @desc Send the issue
 */
async function postIssue(issue) {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${window.od.currentUser.authorization}`);

  const options = {
    method: 'POST',
    body: JSON.stringify(issue),
    headers,
  };
  const url = '/API/Jira/rest/api/2/issue';
  return fetch(url, options);
}

function catchingCallback(error) {
  console.error(error);
  return null;
}

export function init() {
  $('#top-issue')
    .click(async () => {
      const titleWindowBug = languages.getTranslate('');
      const cancelButton = languages.getTranslate('');
      const sendButton = languages.getTranslate('');

      const {
        cn,
        givenName,
        mail,
        provider,
        providertype,
        pulseaudiotcpport,
        sessionid,
        target_ip: targetIp,
      } = window.od.currentUser;

      const awaitingSpawnerVersion = launcher.getSpawnerVersion()
        .catch(catchingCallback);

      const awaitingPyosVersion = launcher.getPyosVersion()
        .catch(catchingCallback);

      const awaitingWebModulesVersion = launcher.getWebModulesVersion()
        .catch(catchingCallback);

      const awaitingUserContainerInfos = launcher.about()
        .catch(catchingCallback);

      const [
        spawnerVersion,
        pyosVersion,
        webModulesVersion,
        userContainerInfos,
      ] = await Promise.all([
        awaitingSpawnerVersion,
        awaitingPyosVersion,
        awaitingWebModulesVersion,
        awaitingUserContainerInfos,
      ]);

      const issue = {
        fields: {
          issuetype: {
            name: 'authentication',
          },
          summary: '',
          description: '',
          cn,
          givenName,
          mail,
          provider,
          providertype,
          pulseaudiotcpport,
          sessionid,
          screen,
          targetIp,
          os: whichBrowser.getOSInfo()?.name,
          browser: whichBrowser.getBrowserInfo()?.name,
          spawnerVersion,
          pyosVersion,
          webModulesVersion,
          ...userContainerInfos,
        },
      };

      bootbox.dialog({
        title: titleWindowBug || 'Issue',
        message: `
        <h3 class="text-center">Sumbit a new issue</h3>
        <div class="container w-100 h-75 d-flex justify-content-center flex-column">  
          <div class="form-group">
            <label for="issue-type">Issue type</label>
            <select class="form-control" id="issue-type">
              <option value="authentication">Authentication</option>
              <option value="settings">Settings</option>
              <option value="applications">Applications</option>
              <option value="screen-shot">Screen-shot</option>
              <option value="screen-record">Screen-record</option>
              <option value="log-out">Log out</option>
              <option value="other">Other</option>
            </select>
          </div>
          <input id="issue-summary" placeholder="Summary" />
          <textarea id="issue-description" class="h-50" placeholder="Your report"></textarea>
        </div>
      `,
        className: 'window-dialog',
        onEscape: true,
        backdrop: true,
        buttons: {
          cancel: {
            label: cancelButton || 'Cancel',
          },
          send: {
            label: sendButton || 'Send',
            className: 'window-button',
            callback: () => {
              postIssue(issue);
            },
          },
        },
        animate: false,
      });

      $('#issue-type')
        .on('change', function () {
          issue.fields.issuetype.name = this.value;
        });

      $('#issue-summary')
        .on('input', function () {
          issue.fields.summary = this.value;
        });

      $('#issue-description')
        .on('input', function () {
          issue.fields.description = this.value;
        });
    });
}
