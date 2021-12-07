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
  headers.append('ABCAuthorization', `Bearer ${window.od.currentUser.authorization}`);
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

let attempt = 0;
export async function init() {
  try {
    const templateIssue = document.querySelector('template#issue-window-template');
    const { id } = await launcher.getkeyinfo('tracker');

    if (id) {
      $('#top-issue-container').css('display', 'block');
      $('#top-issue')
        .click(async () => {
          const titleWindowIssue = languages.getTranslate('title-window-issue');
          const cancelButtonTranslation = languages.getTranslate('issue-cancel-button');
          const sendButtonTranslation = languages.getTranslate('issue-send-button');

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
            title: titleWindowIssue || 'Issue',
            message: templateIssue.innerHTML,
            className: 'window-dialog',
            onEscape: true,
            backdrop: true,
            buttons: {
              cancel: {
                label: cancelButtonTranslation || 'Cancel',
              },
              send: {
                label: sendButtonTranslation || 'Send',
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

          languages.applyLanguage();

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
  } catch (e) {
    console.error(e);
    attempt++;
    if (attempt <= 5) {
      await init();
    }
  }
}
