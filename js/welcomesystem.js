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
 * @name WelcomeSystem
 * @module
 */

import * as launcher from './launcher.js';
import odApiClient from './odapiclient.js';
import * as auth from './auth.js';

const welcomeSystem = (function () {
  const managers = {};
  let $ui;
  let $statusText;

  return new (class exported {
    constructor() {
      this.broadcast = launcher.broadcastwindowslist;
    }

    init() {
      $statusText = $('#statusText');
      $ui = $('#loginScreen');
      const self = this;
      return odApiClient.auth.getauthconfig()
        .done(
          (config) => {
            if (config) { self.applyConfig(config); } else { window.od.connectLoader.showError('API Service return empty config. This is a configuration error.'); }
          },
        )
        .fail(
          () => {
            window.od.connectLoader.showError('API Service is unreachable. Please try to reload.');
          },
        );
    }

    applyConfig(config) {
      const self = this;
      const onlogin = function () { self.onlogin(); };

      managers.sharing = new auth.SharingAuthManager('sharing', '#connectShare', {}, onlogin);

      for (const i in config.managers) {
        const cfg = config.managers[i];
        let manager = null;

        if (cfg.providers && cfg.providers.length) {
          switch (cfg.name) {
            case 'external':
              manager = new auth.ExternalAuthManager(cfg.name, '#connectGP', cfg, onlogin);
              break;
            case 'explicit':
              manager = new auth.ExplicitAuthManager(cfg.name, '#activeDirectory', cfg, onlogin);
              break;
            case 'implicit':
              manager = new auth.ImplicitAuthManager(cfg.name, '#connectGP', cfg, onlogin);
              break;
          }

          if (manager) managers[manager.name] = manager;
        }
      }
    }

    /**
         * @function close
         * @returns {void}
         * @desc Close the window.
         */
    close() {
      $ui.addClass('hide');
      setTimeout(() => { $ui.hide(); }, 1500);
    }

    showMessage(message) {
      // removeClass is need
      // if previous message was an error messsage
      // the message class stay in error
      $statusText.removeClass();

      if (message) {
        $statusText.html(message).show();
      } else {
        $statusText.removeClass();
        $statusText.html('').hide();
      }
    }

    showStatus(message) {
      const msg = `<img src="${window.od.net.urlrewrite('img/ring.svg')}" /><span>${message}</span>`;
      this.showMessage(msg);
    }

    showError(message) {
      $statusText.addClass('error').html(message);
    }

    getStatus() {
      $statusText.text();
    }

    login(managerName, providerName) {
      const manager = managers[managerName];
      if (manager) {
        const provider = manager.getProvider(providerName);
        manager.login(provider);
      }
    }

    getDefaultProviderName(managerName) {
      let providerName;
      const manager = managers[managerName];
      if (manager) {
        const provider = manager.getDefaultProvider();
        if (provider) { providerName = provider.name; }
      }
      return providerName;
    }

    onlogin() {
      this.showStatus('Loading...');
      for (const name in managers) managers[name].close();
    }

    open() {
      $ui.show();
      if (window.od.sharing === true && managers.sharing) {
        managers.sharing.open();
      } else {
        for (const name in managers) managers[name].open();
      }
    }
  })();
}());
export default welcomeSystem;
