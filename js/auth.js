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

import * as windowMessage from './windowMessage.js';
import * as launcher from './launcher.js';

export class AuthManager {
  constructor(name, ui, config, onlogin, parents) {
    this.name = name;
    this.$ui = $(ui);
    this.providers = {};
    this.onlogin = onlogin;
    this.parents = parents
    this.initProviders(config.providers || {});
  }

  initProviders(config) {
    for (const i in config) {
      const provider = this.createProvider(config[i]);
      if (provider) this.setProvider(provider);
    }
  }

  createProvider(config) {
    return $.extend(true, { name }, config);
  }

  getProvider(name) {
    return this.providers[name];
  }

  setProvider(provider) {
    this.providers[provider.name] = provider;
  }

  getDefaultProvider() {
    let provider;
    const providerkeys = Object.keys(this.providers);
    if (providerkeys.length === 1) { provider = this.providers[providerkeys[0]]; }
    return provider;
  }

  manageLogin(providerName) {
    const provider = this.getProvider(providerName);
    if (!provider) return false;

    if (this.onlogin) this.onlogin(this, provider);
    return this.login(provider);
  }

  login(provider) {

  }

  open() {
    this.$ui.show();
  }

  close() {
    this.$ui.hide();
  }
}


export class MetaExplicitAuthManager extends AuthManager {
  constructor(name, ui, config, onlogin, parents) {
    super(name, ui, config, onlogin, parents);
    this.default_domain = config.default_domain;

    const self = this;
    $('form', this.$ui).submit((e) => {
      self.onsubmit();
      e.preventDefault();
      return false;
    });
  }
}

export class ExplicitAuthManager extends AuthManager {
  constructor(name, ui, config, onlogin, parents) {
    super(name, ui, config, onlogin, parents);
    this.default_domain = config.default_domain;

    const self = this;
    $('form', this.$ui).submit((e) => {
      self.onsubmit();
      e.preventDefault();
      return false;
    });
  }

  manageLogin(providerName) {
    if (!providerName) {
      providerName = this.parseUsername()[0] || this.default_domain;
    }

    if (providerName) {
      const expected = providerName.toLowerCase();
      providerName = null;
      for (const name in this.providers) {
        if (name.toLowerCase() == expected) {
          providerName = name;
          break;
        }
      }
    }

    if (!providerName) {
      //
      // No provider has been found
      // 
      // Check if metaexplicit manager exists
      // Check if metadirectory provider exixts 
      //
      const metaexplicit_manager = this.parents['metaexplicit'];
      if (!metaexplicit_manager || !metaexplicit_manager.getProvider('metadirectory') )
	        launcher.showLoginError({ message: 'Invalid domain' });
    } 

    const provider = this.getProvider(providerName);
    if (this.onlogin) this.onlogin(this, provider);
    return this.login(provider);
  }

  getDomain() {
    return $('#domain', this.$ui).val();
  }

  getUsername() {
    return $('#cuid', this.$ui).val() || '';
  }

  getPassword() {
    return $('#ADpassword', this.$ui).val();
  }

  getLoginSessionid() {
    return $('#loginsessionid', this.$ui).val();
  }

  parseUsername() {
    const parts = this.getUsername().split('\\');
    return (parts.length >= 2) ? [parts[0], parts[1]] : [null, parts[0]];
  }

  login(provider) {
    const providername = (provider) ? provider.name : null;
    const user = this.parseUsername();
    const pswd = this.getPassword();
    const loginsessionid = this.getLoginSessionid();

    if (user[1] && pswd) {
      this.$ui.hide();
      launcher.explicitLogin(providername, user[1], pswd, loginsessionid );
    } else {
      launcher.showLoginError({ message: 'Invalid credentials' });
    }
  }

  onsubmit() {
    this.manageLogin(this.getDomain());
  }
}

export class LoginButtonAuthManager extends AuthManager {
  createProvider(config) {
    let $provider = $(`#login-${config.name}`, this.$ui);
    if (!$provider.length) {
      $provider = $('<li></li>').append($('<a></a>').text(`Connect with ${config.displayname || config.name}`));
      $('ul', this.$ui).first().append($provider);
    }

    const self = this;

    $('a', $provider)
      .data('auth-manager', this.name)
      .data('auth-provider', config.name)
      .click(function () {
        self.manageLogin($(this).data('auth-provider'));
      });

    $provider.closest('li').show();

    return super.createProvider(config);
  }
}

export class ImplicitAuthManager extends LoginButtonAuthManager {
  login(provider) {
    launcher.implicitLogin(provider.name);
  }
}

export class ExternalAuthManager extends LoginButtonAuthManager {
  login(provider) {
    const current = window.Cookies.get('auth_provider');
    if (current && current !== provider.name) {
      windowMessage.open(
        provider.displayname,
        `You have already created your workspace with ${current} connect, if you change the connection, a new workspace will be created.`, 'yn', provider.name,
        function () { this.openDialog(provider.dialog_url); },
      );
    } else if (this.isCredential()) {
      launcher.launchDesktop();
    } else {
      this.openDialog(provider.dialog_url);
    }

    return true;
  }

  openDialog(url) {
    document.location = url;
  }

  isCredential() {
    return (window.Cookies.get('type') && window.Cookies.get('token'));
  }
}

export class SharingAuthManager extends AuthManager {
  constructor(name, ui, config, onlogin, parents) {
    super(name, ui, config, onlogin, parents);

    const self = this;
    $('form', this.$ui).submit((e) => {
      self.onsubmit();
      e.preventDefault();
      return false;
    });
  }

  login(provider) {
    const email_rex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
    const email = $('#loginScreen #connectShare #sharemail').val().toLowerCase();

    if (email_rex.test(email)) {
      const token = document.location.search.replace('?sharedtoken=', '');
      launcher.share_login(email, token);
    } else {
      launcher.showLoginError({ message: 'Invalid email' });
    }
  }

  open() {
    if (window.od.isShared === true) super.open();
  }

  onsubmit() {
    this.login('any');
  }
}
