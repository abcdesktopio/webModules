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
import * as printer from './printer.js';
import * as searchSettings from './searchSettings.js';

import { settingsEvents } from './settingsevents.js';

import * as systemStartTab from './settings_tabs/systemStart.js';
import * as userTab from './settings_tabs/user.js';
import * as localisationTab from './settings_tabs/localisation.js';
import * as logsTab from './settings_tabs/logs.js';
import * as audioTab from './settings_tabs/audio.js';
import * as printersTab from './settings_tabs/printer.js';
import * as speedTestTab from './settings_tabs/speedTest.js';
import * as screenColorTab from './settings_tabs/screenColor.js';
import * as containersTab from './settings_tabs/containers.js';

import * as languages from './languages.js';

const config = {
  enabledTabsHeaders: [],
};

/**
 * @function init
 * @returns {void}
 * @desc Add an event listener for closing the window.
 */
export const open = function () {
  const templateTitle = document.querySelector('template#settings-window-title-template');
  const templateBody = document.querySelector('template#settings-window-body-template');

  bootbox.dialog({
    title: templateTitle.innerHTML,
    message: `
      <div id="settings-window">
        ${templateBody.innerHTML}
      </div>
    `,
    className: 'window-dialog window-dialog-settings',
    animate: false,
    onEscape: () => {
      settingsEvents.dispatchEvent(new CustomEvent('close'));
    },
  });

  const settingsTitle = document.getElementById('settings-title');
  const windowsettings = document.getElementById('settings-window');

  settingsTitle.innerText = languages.getTranslate('settings-title');

  const clone = windowsettings.cloneNode(true);

  searchSettings.init(config);
  const tabsHeader = Array.from(clone.querySelectorAll('.tab-header'));

  for (const tabHeader of tabsHeader.map((t) => $(t))) {
    const tabName = tabHeader.attr('tab').replace('-tab', '');
    if (config.enabledTabsHeaders.includes(tabName)) {
      tabHeader.removeClass('d-none');
    }

    tabHeader.click(function () {
      const target = $(this).attr('tab');
      let showFunction;
      switch (target) {
        case 'system-tab':
          showFunction = systemStartTab.init;
          setTitleSuffix(languages.getTranslate('settings-system-title'));
          break;
        case 'user-tab':
          showFunction = userTab.init;
          setTitleSuffix(languages.getTranslate('settings-user-title'));
          break;
        case 'localisation-tab':
          showFunction = localisationTab.init;
          setTitleSuffix(languages.getTranslate('settings-location-title'));
          break;
        case 'printers-tab':
          showFunction = printersTab.init;
          setTitleSuffix(languages.getTranslate('settings-printer-title'));
          break;
        case 'logs-tab':
          showFunction = logsTab.init;
          setTitleSuffix(languages.getTranslate('settings-logs-title'));
          break;
        case 'speedtest-tab':
          showFunction = speedTestTab.init;
          setTitleSuffix(languages.getTranslate('settings-speedTest-title'));
          break;
        case 'audio-tab':
          showFunction = audioTab.init;
          setTitleSuffix(languages.getTranslate('settings-audio-title'));
          break;
        case 'screen-background-tab':
          showFunction = screenColorTab.init;
          setTitleSuffix(languages.getTranslate('settings-background-title'));
          break;
        case 'container-tab':
          showFunction = containersTab.init;
          setTitleSuffix(languages.getTranslate('settings-containers-title'));
          break;
        case 'opensource-tab':
	        let strWindowFeatures = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";
          window.open("https://www.abcdesktop.io", "abcdesktop.io", strWindowFeatures );
          return;
        case 'support-tab':
          const hidenSpanForUrlSupportGlobalValue = document.getElementById('hiden-span-for-url-support-global-value');
          if (hidenSpanForUrlSupportGlobalValue && hidenSpanForUrlSupportGlobalValue.innerText) {
            window.open(hidenSpanForUrlSupportGlobalValue.innerText, 'abcdesktop.io');
          }
          return;
        default:
          showFunction = () => { console.error('No tab found'); };
          break;
      }

      const selector = `div#${target}`;
      const tabToShow = clone.querySelector(selector);
      const home = Array.from(clone.querySelectorAll('div.tab'))[0];
      showFunction(home, tabToShow);
      system.show(back);
    });
  }

  const back = document.querySelector('#settings-back-button');
  if (back) {
    back.addEventListener('click', () => {
      settingsEvents.dispatchEvent(new CustomEvent('beforeBack'));
      showHome();
      setTitleSuffix();
      settingsEvents.dispatchEvent(new CustomEvent('back'));
    });
  }

  windowsettings.parentElement.replaceChild(clone, windowsettings);

  $('div[id^=buttons-screen-] label')
    .each(function () {
      const current = this;
      const jqElt = $(current);

      jqElt.click(() => {
        Array.from(jqElt.parent().children()).forEach((elt) => {
          if (elt !== this && $(elt).hasClass('btn-settings-active')) {
            $(elt).removeClass('btn-settings-active');
            const viewId = $(elt).data('view');
            const viewElt = $(`#${viewId}`);
            if (!viewElt.hasClass('d-none')) {
              viewElt.addClass('d-none');
            }
          }
        });

        jqElt.addClass('btn-settings-active');
        const viewId = jqElt.data('view');
        const viewElt = $(`#${viewId}`);
        viewElt.removeClass('d-none');
      });
    });

  settingsEvents.dispatchEvent(new CustomEvent('open'));
  showHome();

  languages.applyLanguage();
  function showHome() {
    const tabs = Array.from(clone.querySelectorAll('div.tab'));
    const home = tabs[0];
    for (const tab of tabs.slice(1)) {
      system.hide(tab);
    }
    system.hide(back);
    system.show(home);
  }

  function setTitleSuffix(name = '') {
    const settingsTitle = document.getElementById('settings-title');
    if (settingsTitle) {
      settingsTitle.innerText = `${languages.getTranslate('settings-title')}${name ? `:${name}` : ''}`;
    }
  }
};

document.addEventListener('broadway.connected', () => {
  launcher.getSettings()
    .then((res) => {
      if (res.code === 200) {
        config.enabledTabsHeaders = res.data;
        printer.handlerSettingsConfig(config);
        if (config.enabledTabsHeaders.includes('audio')) {
          $('#speakers').css('display', 'block');
        }
      }
    });
});
