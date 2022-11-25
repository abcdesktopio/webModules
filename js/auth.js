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
  constructor(name, ui, config, managers) {
    this.name = name;
    this.$ui = $(ui);
    this.providers = {};
    this.managers = managers;
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
    return this.login(provider);
  }

  login(provider) {
    this.closeManagers();
  }

  open() {
    this.$ui.show();
  }

  close() {
    this.$ui.hide();
  }

  closeManagers() {
    this.welcomeui.closeManagers();
  }

  openManagers() {
    this.welcomeui.openManagers();
  }

  showLoginError( result ) {
    this.welcomeui.showError(result);
  }

  thenlogin( result ) {
    this.welcomeui.thenlogin(result);
  }

}




export class MetaExplicitAuthManager extends AuthManager {
  constructor(name, ui, config ) {
    super(name, ui, config );
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
  constructor(name, ui, config ) {
    super(name, ui, config );
    this.default_domain = config.default_domain;
    this.controls = [ '#cuid', '#ADpassword' ]; // user input 

    const self = this;
    $('form', this.$ui).submit((e) => {
      self.onsubmit();
      e.preventDefault();
      return false;
    });
  }

  removeControlErrorClass() {
    this.controls.forEach( element => { $(element).removeClass( 'error' ) });
  }

  manageLogin(providerName) {
    // remove error class for each user input 
    // cuid and ADPassword
    this.removeControlErrorClass();

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
      // if metaexplicit manager exists, with metadirectory provider defined 
      // if not the auth request will failed
      //
      console.info('you are running an auth explicit with no provider define');
    } 

    const provider = this.getProvider(providerName);
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

    // do not hide now  
    // this.$ui.hide();
    // hide only in auth.then to reduce paint
    // this.welcomeui.clearstatusText();
    this.welcomeui.clearstatusText();
    this.welcomeui.clearLoginProjetNameTitle();
    this.welcomeui.showStatus('Starting authentification...');
    this.closeManagers();
    return launcher.explicitLogin(providername, user[1], pswd, loginsessionid )
    .then( (result) => { 
      // hide all managers ( and the providers )
      // this.closeManagers();
      // Call next createdesktop process
      this.thenlogin( result ); 
    })
    .fail( (e) => {
      this.welcomeui.showStatus('');
      this.openManagers();
      // if the error message is not catched
      if (!this.showLoginError(e))
        // call the default parent showLoginError
        super.showLoginError(e);
    });
  }

  onsubmit() {
    return this.manageLogin(this.getDomain());
  }


  showLoginError( result ) {
    let matcherror = false;
    // For old error format
    // The error message can be  'Invalid credentials' or  'InvalidCredentials'
    // different response string from kerberos, ldap bind execption class
    // message are always compare using lowercase
    // The new error format is is Exception class name
    let errorroutedict = {
      // old error format 
      'Unsafe login credentials': { controls: [ '#ADpassword' ], matcherror: true },
      'Unsafe password credentials': { controls: [ '#cuid' ], matcherror: true },
      'No authentication provider can be found': { controls: [ '#cuid' ], matcherror: true },
      'kerberos credentitials validation failed Major (851968): Unspecified GSS failure.  Minor code may provide more information, Minor (2529638936)': { controls: [ '#ADpassword' ], matcherror: true },
      'kerberos credentitials validation failed Major (851968): Unspecified GSS failure.  Minor code may provide more information, Minor (2529638918)': { controls: [ '#cuid' ], matcherror: true },
      'Invalid credentials':  { controls: [ '#cuid', '#ADpassword' ], matcherror: false },
      'invalidCredentials' :  { controls: [ '#cuid', '#ADpassword' ], matcherror: false },
      'Invalid domain':       { controls: [ '#cuid' ], matcherror: false },
      'Invalid dn':           { controls: [ '#cuid' ], matcherror: true },
      'Unsafe credentials':   { controls: [ '#cuid', '#ADpassword' ], matcherror: false },
      // new error format
      // next release 3.0 error format 
      'LDAPInvalidCredentialsResult': { controls: [ '#cuid','#ADpassword' ], matcherror: true },
      'LDAPInvalidDNSyntaxResult': { controls: [ '#cuid' ], matcherror: true }
    };

    if (result) {
      if (result.error && result.status == 401) {
        let message = result.error;
        console.error( message );
        for( var key in errorroutedict) {
          if (message.toLowerCase().startsWith( key.toLowerCase() )) {
            errorroutedict[key].controls.forEach( c => $(c).addClass( 'error' ) );
            matcherror = errorroutedict[key].matcherror;
            break;
          }
        }
      }
    }
    return matcherror;
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

  openDialog(url) {
    document.location = url;
  }

}

export class ImplicitAuthManager extends LoginButtonAuthManager {
  login(provider) {
    // ImplicitAuthManager can use a redirect 
    // for SSL Client certificat for example
    if (provider.dialog_url)
      this.openDialog(provider.dialog_url);
    else
      return launcher.implicitLogin(provider.name)
      .then( (result) => { 
        // hide all managers ( and the providers )
        this.closeManagers();
        // Call next createdesktop process
        this.thenlogin( result ); 
      })
      .fail( (e) => {
        this.showLoginError(e);
      });
  }
}

export class ExternalAuthManager extends LoginButtonAuthManager {
  login(provider) {
    if (provider.dialog_url)
      this.openDialog(provider.dialog_url);
    else {
      this.showLoginError({ status: 500, message: 'no dialog_url defined in external provider, configuration file error' });
    }
  }
}
