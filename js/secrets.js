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

import * as launcher from './launcher.js';
import * as languages from './languages.js';

export const secretsEvents = new EventTarget();

/**
 * 
 * @param {string[]} secretRequirementList 
 * @desc Return true if at least one of the secret requirement of an application is not present in the current secret authorized list
 * @returns {boolean} 
 */
export function needAuthorizationForSecrets(secretRequirementList = []) {
  if (secretRequirementList === null) {
    return false;
  }

  /**
   * 
   * @param {string} secretRequierement 
   * @desc Here this predicate is true if the element is present in the global secret list
   */
  const predicate = (secretRequierement) => window.od.secrets.includes(secretRequierement);


  /**
   * @desc Considering the previous predicate if at least one required secret is not present in the global secret list
   * an authorization will be needed for having these secrets
   */
  return !secretRequirementList.some(predicate);
}

async function refreshSecretList() {
  const { result } = await launcher.getSecrets();
  window.od.secrets = result;
}

/**
 * @desc Browse for all locked app in the DOM and then 
*/
function repaintForUnlockAuthorizedApp() {

  /**
   *
   * @param {HTMLLIElement} lockedApplication 
   * @returns {boolean}
   * @desc Predicate function returning true for a given application which need to be authorized
   *  and false otherwise
   */
  const predicate = (lockedApplication) => needAuthorizationForSecrets(
    JSON.parse(
      lockedApplication.getAttribute('secrets_requirement')
    )
  );

  const lockedApplications = Array.from(
    document.querySelectorAll('li[locked=true]')
  ).filter(predicate);

  for (const lockedApplication of lockedApplications) {
    lockedApplication.setAttribute('locked', 'false');
  }
}

/**
 * 
 * @param {Function} launchApp 
 */
export async function runAuthentication(launchApp) {
  let authentWindowInputId;
  let authWindowInputPassword;
  const template = document.querySelector('#authent-window-template');
  const titleAuthenticationWindow = await languages.getTranslate('title-authentication-window');
  const labelCancelButton = await languages.getTranslate('cancel-button');
  const labelSendButton = await languages.getTranslate('send-button');

  bootbox.dialog({
    title: titleAuthenticationWindow || 'Authentication',
    message: template.innerHTML,
    className: 'window-dialog authent-window',
    animate: false,
    onEscape: true,
    buttons: {
      cancel: {
        label: labelCancelButton || 'Cancel',
      },
      send: {
        label: labelSendButton || 'Send',
        className: 'window-button',
        callback: async () => {
          try {
            await launcher.buildsecret(authWindowInputPassword.value);
            await refreshSecretList();
            repaintForUnlockAuthorizedApp();
            launchApp();
          } catch(e) {
            console.error(e);
          }
        },
      },
    },
  });

  if (authentWindowInputId = document.querySelector('.authent-window #authent-window-input-id')) {
    authentWindowInputId.value = window.od.currentUser.userid;
  }

  authWindowInputPassword = document.getElementById('authent-window-input-password');
}

document.addEventListener('broadway.connected', async () => {
  try {
    await refreshSecretList();
    secretsEvents.dispatchEvent(new CustomEvent('loaded'));
  } catch(e) {
    console.error(e);
  }
});
