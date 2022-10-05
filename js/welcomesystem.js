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
import * as languages from './languages.js';
import * as logmein from './logmein.js';

const welcomeSystem = (function () {
  const managers = {};
  let $ui;
  let statusText;
  let projectName;
  let stages=[ 'a', 'b', 'c', 'd' ];

  return new (class exported {
    constructor() {
      this.broadcast = launcher.broadcastwindowslist;
    }

    init() {
      statusText = document.getElementById('statusText');
      $ui = $('#loginScreen');
      // read projectName from document
      projectName = document.getElementById('loginScreenProjectNameSplited');
      projectName = (projectName) ? projectName.innerText : 'abcdesktop';

      const self = this;
      return odApiClient.auth.getauthconfig()
        .done(
          (config) => {
            if (config) { 
		          self.applyConfig(config); 
	          } else { 
		          this.showError('API Service return undefined config. Please fix the od.config configuration file.'); 
	          }
          },
        )
        .fail(
          () => {
            this.showError('API Service is unreachable, bad gateway. Please try to reload.');
          },
        );
    }

    clearLoginProjetNameTitle() {
      stages.forEach(element => {
        let loginScreenProjectNameSplitedStage = document.getElementById('projectNameSplitedStage'+element);
        if (loginScreenProjectNameSplitedStage)
          loginScreenProjectNameSplitedStage.classList.remove('abccreatedesktopstatus');
      });
    }

    updateLoginProjetNameTitle( charStatus ) {
      if (charStatus) {
        if (charStatus==='e') {
          this.clearLoginProjetNameTitle();
        }
        else {
          stages.forEach(element => {
            if (element <= charStatus) {
              let loginScreenProjectNameSplitedStage = document.getElementById('projectNameSplitedStage'+element);
              // check if class already exist to reduve paint
              if (!loginScreenProjectNameSplitedStage.classList.contains('abccreatedesktopstatus'))
                // the class does not exist, add it
                loginScreenProjectNameSplitedStage.classList.add('abccreatedesktopstatus');
            } } );
        }
      }

    }

    applyConfig(config) {
      const self = this;
      
      for (const i in config.managers) {
        const cfg = config.managers[i];
        let manager = null;

        if (cfg.providers && cfg.providers.length) {
          switch (cfg.name) {
            case 'external':
              manager = new auth.ExternalAuthManager(cfg.name, '#connectGP', cfg, managers);
              break;
            case 'metaexplicit':
              manager = new auth.MetaExplicitAuthManager(cfg.name, '#metaactiveDirectory', cfg, managers);
              break;
            case 'explicit':
              manager = new auth.ExplicitAuthManager(cfg.name, '#activeDirectory', cfg, managers);
              break;
            case 'implicit':
              manager = new auth.ImplicitAuthManager(cfg.name, '#connectGP', cfg, managers);
              break;
          }

          if (manager) {
            manager.thenlogin = self.thenlogin;
            managers[manager.name] = manager;
          }
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
      statusText.classList.remove('error');

      if (message) {
        let spantextstatusText = document.getElementById('spantextstatusText');
        if (spantextstatusText) {
          // update message
          spantextstatusText.innerText = message;
        }
      } else {
        statusText.classList.remove();
        statusText.style.display='none';
      }
    }

    showStatus(message) {

      if (!message) {
        statusText.classList.remove();
        statusText.style.display='none';
        return;
      }

      if (message === 'Normal')
        this.updateLoginProjetNameTitle( 'd' );

      if (statusText) {
        let f;
        if (message.length > 2 && message.charAt(1) == '.') {
          f = message[0].toLowerCase();
          if ( 'abc'.includes(f) ) {
              // imgsrc = `img/${f}.svg`;
              this.updateLoginProjetNameTitle(f);
              message = message.substring(2);
              message = message.charAt(0).toUpperCase() + message.slice(1);
          }
        }

        // create if not exist
        let spantextstatusText = document.getElementById('spantextstatusText');
        if (!spantextstatusText) {
          spantextstatusText = document.createElement('span');
          spantextstatusText.id = 'spantextstatusText';
          statusText.appendChild(spantextstatusText);
        }
        spantextstatusText.innerText = message;

        

        let imgsrc='img/ring.svg';
        let ringstatusimg = document.getElementById('spantextstatusImg');
        if (!ringstatusimg) {
          ringstatusimg = document.createElement('img');
          ringstatusimg.src = window.od.net.urlrewrite(imgsrc);
          ringstatusimg.id = 'spantextstatusImg';
          statusText.prepend(ringstatusimg);
        }

        // test for futur usage
        if (!ringstatusimg.src)
            // repaint for futur usage
            ringstatusimg.setAttribute("src",  window.od.net.urlrewrite(imgsrc) );
      }

    }

    showError(message) {
      statusText.classList.add('error');
      statusText.innerText = message;
    }

    thenlogin() {
      logmein.restoreUserContext()
      .fail( (e) => {
          launcher.showLoginError( e );
        } 
      );
    }

    faillogin(e) {
      launcher.showLoginError( e );
    }

    open() {
      $ui.show();
      for (const name in managers) 
        managers[name].open();
    }

  })();
}());
export default welcomeSystem;
