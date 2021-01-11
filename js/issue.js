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
import * as notificationSystem from './notificationsystem.js';

/**
 * @desc Send the issue
 */
async function postIssue(issue) {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${window.od.currentUser.authorization}`);
  headers.append('Content-Type', 'application/json');

  const options = {
    method: 'POST',
    body: JSON.stringify(issue),
    headers,
  };
  const url = '/API/tracker/issue';
  return fetch(url, options);
}

function catchingCallback(error) {
  console.error(error);
  return null;
}

export async function init() {
  const { id } = await launcher.getkeyinfo('tracker');

  if (id) {
    $('#top-issue-container').css('display', 'block');
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
          issue: {
            name: 'Bug',
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
        };

        bootbox.dialog({
          title: titleWindowBug || 'Issue',
          message: `
            <h3 class="text-center">Sumbit a new issue</h3>
            <div class="container w-100 h-75 d-flex justify-content-center flex-column">  
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
                postIssue(issue)
                  .then(() => {
                    notificationSystem.displayNotification('Issue', 'Your issue hase been posted', 'info');
                  })
                  .catch((error) => {
                    notificationSystem.displayNotification('Issue', error, 'error');
                    console.error(error);
                  });
              },
            },
          },
          animate: false,
        });

        $('#issue-summary')
          .on('input', function () {
            issue.summary = this.value;
          });

        $('#issue-description')
          .on('input', function () {
            issue.description = this.value;
          });
      });
  }
}
