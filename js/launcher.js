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

import welcomeSystem from './welcomesystem.js';
import * as systemMenu from './systemmenu.js';
import * as notificationSystem from './notificationsystem.js';
import * as system from './system.js';
import odApiClient from './odapiclient.js';
import { broadcastEvent } from './broadcastevent.js';

const refreshTokenfactor = 750; // timeout before Toekn must be refreshed max value 1000 in ms

/**
 * @function getWindowsWidth
 * @global
 * @return {integer}
 * @desc Get windows width
 */
export function getWindowsWidth() {
  return document.documentElement.clientWidth;
}

/**
 * @function getWindowsHeight
 * @global
 * @return {integer}
 * @desc Get windows height
 */
export function getWindowsHeight() {
  return document.documentElement.clientHeight - getTopAndDockHeight();
}

/**
 * @function getScreenWidth
 * @global
 * @return {integer}
 * @desc Get screen width
 */
export function getScreenWidth() {
  return screen.width;
}

/**
 * @function getScreenHeight
 * @global
 * @return {integer}
 * @desc Get screen height
 */
export function getScreenHeight() {
  return screen.height - getTopAndDockHeight();
}

/**
 * @function getTopAndDockHeight
 * @global
 * @return {integer}
 * @desc Get hight of top bar and dock
 */
export function getTopAndDockHeight() {
  let height = 0;

  const topElement = document.getElementById('top');
  if (topElement && topElement.clientHeight) height += topElement.clientHeight;

  const dockElement = document.getElementById('dock');
  if (dockElement && dockElement.clientHeight) { height += dockElement.clientHeight; }

  return height;
}

/**
 * @function getkeyinfo
 * @global
 * @params {string} provider
 * @params {callback} callback
 * @return {void}
 * @desc Get provider's keys.
 */
export function getkeyinfo(provider) {
  return odApiClient.core.getKeyInfo(provider);
}

/**
 * @function logout
 * @global
 * @params {callback} onsuccess
 * @params {callback} onerror
 * @return {void}
 * @desc Disconnects the user and removes cookies.
 */
export function logout(data_dict) {
  return odApiClient.auth.logout(data_dict);
}

/**
 * @function ocrun
 * @global
 * data_dict { image: image, args: args, pod_name: pod_name }
 *   string image image name OR a mime type
 *   string args  arg is the file name to execute
 *   string pod_name pod_name is the name of the pod
 * @return {void}
 * @desc Launch an application container
 */
export function ocrun(data_dict, element) {
  // Play Icon animation
  // Add code here
  getSecrets();

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  data_dict.timezone = timezone;
  return odApiClient.composer
    .runApp(data_dict)
    .done((result) => {
      if (typeof result === 'undefined') {
        notificationSystem.displayNotification(
          'Application',
          result.error,
          'error',
        );
        return;
      }

      if (!window.od.isTactile) {
        systemMenu.mouselistener();
      }
      document.getElementById('noVNC_canvas').focus();
      if (element && result.result) {
        element.setAttribute('state', 'running');
        element.setAttribute('container_id', result.result.container_id);
      }
    })
    .fail((status, error, result) => {
      let error_message;
      if (result && result.error ) {
	      error_message=result.error;
      }
      else {
	      if (result.status === 401)
		      error_message = 'call API has been denied';
	      else
		      error_message = error; 
      }

      if (status === 200) {
        notificationSystem.displayNotification(
          'Application',
          error_message,
          'error',
        );
      } else {
        notificationSystem.displayNotification('Application', error_message, 'error');
      }
      if (element instanceof HTMLLIElement) {
        element.setAttribute('state', 'down');
        element.setAttribute('container_id', '');
      }
    })
    .always(() => {
      if (element) {
        setTimeout(() => {
          system.removeAppLoader(element);
        }, 500);
      }
    });
}
/**
 * @function getUserInfo
 * @global
 * @params {callback} onsuccess
 * @params {callback} onerror
 * @return {void}
 * @desc Get user's information (name,containerid, userid,sessionid,provider...).
 */
export function getUserInfo() {
  return odApiClient.user.whoami();
}

export function getLogs(callback) {
  return odApiClient.composer
    .getLogs()
    .done((result) => {
      if (typeof result === 'undefined') {
        console.error('No response data from odApiClient.composer.getLogs');
      }
      callback(result);
    })
    .fail(() => {
      console.error('No response data from odApiClient.composer.getLogs');
    });
}

export function getlyncconnectionkey() {
  return odApiClient.user.getLyncConnectionKey();
}

export function getzimbraurl() {
  return odApiClient.user.getZimbraUrl();
}

/**
 * @function listenableprinter
 * @global
 * @params {callback} onsuccess
 * @params {callback} onerror
 * @return location
 * @desc listenableprinter from AD.
 */
export function listenableprinter() {
  return odApiClient.printer.listEnable();
}

/**
 * @function removeprinter
 * @global
 * @params {callback} onsuccess
 * @params {callback} onerror
 * @return location
 * @desc removeprinter from AD.
 */
export function removeprinter(printerName) {
  return odApiClient.printer.remove(printerName);
}

/**
 * @function listprinter
 * @global
 * @params {callback} onsuccess
 * @params {callback} onerror
 * @return location
 * @desc listprinter from AD.
 */
export function listprinter() {
  return odApiClient.printer.list();
}

/**
 * @function addprinter
 * @global
 * @params {callback} onsuccess
 * @params {callback} onerror
 * @return location
 * @desc addprinter from AD.
 */
export function addprinter(cn) {
  return odApiClient.printer.add(cn);
}

/**
 * @function get
 * @global
 * @params {string} key
 * @params {callback} onsuccess
 * @params {callback} onerror
 * @return {void}
 * @desc Get key's value from MongoDB.
 */
export function get(key) {
  return odApiClient.store.get(key);
}

/**
 * @function set
 * @global
 * @params {string} key
 * @params {object} value
 * @params {callback} onsuccess
 * @params {callback} onerror
 * @return {void}
 * @desc Insert value in MongoDB.
 */
export function set(key, value) {
  return odApiClient.store.set(key, value);
}

/**
 * @function setCollection
 * @global
 * @params {string} key
 * @params {object} value
 * @params {callback} onsuccess
 * @params {callback} onerror
 * @return {void}
 * @desc Insert value inside collection in MongoDB.
 */
export function setCollection(key, value) {
  return odApiClient.store.setCollection({ key, value });
}

/**
 * @function getCollection
 * @global
 * @params {string} key
 * @params {callback} onsuccess
 * @params {callback} onerror
 * @return {void}
 * @desc Insert value inside MongoDB.
 */
export function getCollection(key) {
  return odApiClient.store.getCollection(key);
}

export function getLocation() {
  return odApiClient.user.getLocation();
}

/**
 * @function initApplist
 * @global
 * @params {callback} callback
 * @return {void}
 * @desc Init applist from pyos.
 */
export function initApplist() {
  return odApiClient.composer
    .getAppList()
    .done((result) => {
      if (typeof result === 'undefined') {
        notificationSystem.displayNotification(
          'applist',
          'list app failed',
          'error',
        );
        return;
      }

      if (window.od.isShared) {
        for (let i = 0; i < result.length; i++) {
          if (result[i].launch === 'frontendjs.skype') {
            result.splice(i, 1);
          }
        }
      }

      window.od.applist = result;
    })
    .fail(() => {
      notificationSystem.displayNotification(
        'applist',
        'launcher:applist request call error',
        'error',
      );
      window.od.connectLoader.showError(
        'Service unavailable. Applications list failed. Please try to reload',
      );
    });
}

/**
 * @function initUserApplist
 * @global
 * @params {callback} callback
 * @return {void}
 * @desc Init applist from pyos.
 */
export function initUserApplist() {
  return odApiClient.composer
    .getUserAppList()
    .done((result) => {
      if (typeof result === 'undefined') {
        notificationSystem.displayNotification(
          'applist',
          'list app failed',
          'error',
        );
        return;
      }
      window.od.applist = result.result;
    })
    .fail(() => {
      notificationSystem.displayNotification(
        'applist',
        'launcher:applist request call error',
        'error',
      );
      window.od.connectLoader.showError(
        'Service unavailable. Applications list failed. Please try to reload',
      );
    });
}

/**
 * @function share_login
 * @global
 * @params {string} email
 * @params {string} token
 * @return {void}
 * @desc Login for users using sharing.
 */
export function share_login(email, token) {
  console.debug('function share_login');
  /*
    return odApiClient.user.shareLogin(email, token)
        .done(function (result) {
            if (typeof result === 'undefined') {
                notificationSystem.displayNotification('Share access', 'access failed', 'error');
                return;
            }
            var message = (result.result.share == 'rw') ? "full access" : "view only";
            welcomeSystem.close();
            notificationSystem.displayNotification('Shared access', 'Shared access mode is ' + message, 'info');
            window.od.currentUser = {...window.od.currentUser, ...result.result};
            window.od.connectLoader.connect();
            console.debug(result);
            // window.od.setup();
            window.od.broadway.setview_only((result.result.share == 'ro'));
            window.od.broadway.connect();
        })
        .fail(function (status, error, result) {
            if (status == 200)
                window.od.connectLoader.showError(result.error);
            else
                notificationSystem.displayNotification('Share', 'launcher:share_login request call error', 'error');
        });
    */
}

/**
 * @function share
 * @global
 * @params {string} email
 * @params {string} shared
 * @params {callback} callback
 * @return {void}
 * @desc Login for users using sharing.
 */
export function share(email, shared, callback) {
  console.debug('function share');
  /*
    var apicall = odApiClient.user.share(email, shared, window.location.protocol + '//' + window.location.hostname + "/?sharedtoken=");
    if (callback) {
        apicall
            .done(function (result) {
                if (typeof result === 'undefined') {
                    callback('error', 'Email can not be send');
                }
                else {
                    callback('success', result.result.message);
                }
            })
            .fail(function (_, error) {
                callback('error', 'Email can not be send - error: ' + error);
            });
    }
    return apicall;
    */
}

export function support(callback) {
  /*
    var apicall = odApiClient.user.support(window.redirectwindow.location.protocol + '//' + window.location.hostname + "/?sharedtoken=");
    if (callback) {
        apicall
            .done(function (result) {
                if (typeof result === 'undefined') {
                    callback('error', 'Email can not be send');
                }
                else {
                    callback('success', result.result.message);
                }
            })
            .fail(function (_, error) {
                callback('error', 'Email can not be send - error: ' + error);
            });
    }
    return apicall;
    */
}

export function explicitLogin(provider, userid, password) {
  return login(provider, { userid, password });
}

export function implicitLogin(provider) {
  return login(provider);
}

export function auth_sessionexpired() {
  console.debug('function auth_sessionexpired');
  console.info('Your session has expired');
  window.od.connectLoader.hide();
  if (system.show(document.getElementById('overScreen'))) { window.od.connectLoader.hide(); } else window.location.reload();
}

export function refresh_usertoken() {
  // Refresh the current Auth token
  odApiClient.auth
    .refreshtoken()
    .fail((_, _a, result) => {
      showError(
        result.error
        || result.message
        || 'General failure, no response from refresh token',
      );
      auth_sessionexpired();
    })
    .then((result, xhr) => {
      const deferred = $.Deferred();
      if (
        result
        && result.status == 200
        && result.result
        && Number.isInteger(result.result.expire_in)
      ) {
        const expire_refresh_token = result.result.expire_in * 750; // retry before 3/4 of expire time
        console.info(
          `User Token updated successful, next call in ${expire_refresh_token
          } ms`,
        );
        setTimeout(ctrlRefresh_user_token, expire_refresh_token);
        return deferred.promise();
      }
      deferred.reject(xhr.status, 'API call Refresh token failed', result);
    });
}

export function refresh_desktoptoken(app) {
  // Refresh the current Auth token
  odApiClient.composer
    .refreshdesktoptoken(app)
    .fail((_, _a, result) => {
      showError(
        result.error
        || result.message
        || 'General failure, no response from refresh token',
      );
      auth_sessionexpired();
    })
    .then((result, xhr) => {
      const deferred = $.Deferred();
      if (
        result
        && result.status == 200
        && result.result
        && result.result.authorization
        && result.result.expire_in
        && Number.isInteger(result.result.expire_in)
      ) {
        window.od.currentUser.authorization = result.result.authorization;
        const expire_refresh_token = result.result.expire_in * 750; // retry before 3/4 of expire time
        console.info(
          `Desktop Token updated successful, next call in ${expire_refresh_token
          } ms`,
        );
        setTimeout(ctrlRefresh_desktop_token, expire_refresh_token, app);
        return deferred.promise();
      }
      deferred.reject(xhr.status, 'API call Refresh token failed', result);
    });
}

/**
 * @function ctrlRefresh_token
 * @global
 * @params {function} callback
 * @params {callback_arg} callback_arg
 * @return {void}
 * @desc Resfresh desktop token or user token
 */
function ctrlRefresh_token(callback, callback_arg) {
  if (window.od.broadway.isConnected()) {
    callback(callback_arg);
  } else {
    auth_sessionexpired();
  }
}

function ctrlRefresh_user_token() {
  if (window.od.broadway.isConnected()) {
    refresh_usertoken();
  } else {
    auth_sessionexpired();
  }
}

function ctrlRefresh_desktop_token(app) {
  if (window.od.broadway.isConnected()) {
    refresh_desktoptoken(app);
  } else {
    auth_sessionexpired();
  }
}

/**
 * @function login
 * @global
 * @params {provider} provider
 * @params {args} args
 * @return {void}
 * @desc login call odApiClient.auth.auth
 */
export function login(provider, args) {
  window.od.connectLoader.connect();
  return odApiClient.auth
    .auth(null, provider, args)
    .fail((status, error, result) => {
      showLoginError(result);
    })
    .then((result) => {
      if (
        result.status == 200
        && result.result
        && Number.isInteger(result.result.expire_in)
      ) {
        window.od.currentUser = result.result;
        const expire_refresh_token = result.result.expire_in * 750;
        setTimeout(ctrlRefresh_user_token, expire_refresh_token);
        getUserInfo().then(
          (userinfo) => {
            if (userinfo && userinfo.name && userinfo.provider) {
              console.debug('login:getUserInfo userinfo is valid object ');
              window.od.currentUser = {
                ...window.od.currentUser,
                ...userinfo,
              };
            } else {
              console.error('login:getUserInfo failed');
            }
          },
          () => {
            console.error('login:getUserInfo failed');
          },
        );
        runAppsOrDesktop();
      } else showLoginError(result);
    });
}

/**
 * @function runAppsOrDesktop
 * @global
 * @return promise
 * @desc run Apps Or Desktop
 */
export function runAppsOrDesktop() {
  const url = new URL(window.location.href);
  const app = url.searchParams
    ? url.searchParams.get('app')
    : url.getParameter('app');
  const args = url.searchParams
    ? url.searchParams.get('args')
    : url.getParameter('args');
  // abcdesktopinstancetypecallback is launchMetappli or launchDesktop
  let abcdesktopinstancetypecallback;
  if (app !== undefined && app !== '') {
    abcdesktopinstancetypecallback = odApiClient.composer.launchMetappli;
  } else {
    abcdesktopinstancetypecallback = odApiClient.composer.launchDesktop;
  }
  return launchnewDesktopInstance(abcdesktopinstancetypecallback, app, args);
}

export function auth(provider, args) {
  window.od.connectLoader.connect();

  return odApiClient.auth
    .auth(null, provider, args || {})
    .fail((status, error, result) => {
      showLoginError(result);
    });
}

export function launchnewDesktopInstance(
  abcdesktopinstancetypecallback,
  app,
  args,
) {
  // app is undefined for Desktop
  try {
    window.od.connectLoader.connect();
    var progress = new LoginProgress();
    progress.start('Instancing AbcDesktop');

    return abcdesktopinstancetypecallback(
      getScreenWidth(),
      getScreenHeight(),
      location.hostname,
      app,
      args,
    )
      .done((result) => {
        progress.stop();
        if (
          result
          && result.status == 200
          && result.result
          && result.result.target_ip
          && result.result.authorization
          && result.result.vncpassword
          && Number.isInteger(result.result.expire_in)
        ) {
          const expire_refresh_token = result.result.expire_in * 750;
          window.od.currentUser.target_ip = result.result.target_ip;
          window.od.currentUser.vncpassword = result.result.vncpassword;
          window.od.currentUser.authorization = result.result.authorization;
	  window.od.currentUser.websocketrouting = result.result.websocketrouting;
          window.od.currentUser.websockettcpport = result.result.websockettcpport;
          window.od.currentUser.pulseaudiotcpport = 4714;
	  setTimeout(ctrlRefresh_desktop_token, expire_refresh_token, app);
          connectReady();
        } else {
          showLoginError(result);
        }
      })
      .fail((status, error, result) => {
        progress.stop();
        showLoginError(result);
      });
  } catch (e) {
    progress.stop();
    showError(e);
  }
}

export function showLoginError(result) {
  let msg_info = 'General failure';
  if (result.message && result.status_message) { msg_info = `${result.status_message}: ${result.message}`; } else {
    msg_info = result.message
      || result.status_message
      || result.error
      || 'General failure, no response from login service';
  }
  showError(msg_info);
}

export function showError(message) {
  window.od.connectLoader.showError(message);
  welcomeSystem.open();
}


class LoginProgress {
  constructor(message) {
    this.enabled = true;
    this.message = message || '';
    this.id = null;
    this.bar = '';
  }

  getProgress() {
    if (!this.enabled) return;
    const self = this;
    odApiClient.core
      .getMessageInfo()
      .done((result) => {
        self.onDone(result);
      })
      .fail(() => {
        self.onFail();
      });
  }

  onDone(result) {
    if (result === 'stopinfo') {
      this.enabled = false;
    }
    if (this.enabled) {
      if (result.message) {
        this.message = result.message;
        this.bar = '';
      } else {
        this.bar += '.';
      }
      window.od.connectLoader.editStatus(`${this.message}${this.bar}`);
    }
    this.next();
  }

  onFail() {
    this.enabled = false;
  }

  start() {
    this.enabled = true;
    this.next();
  }

  stop() {
    this.enabled = false;
  }

  next() {
    const self = this;
    if (this.enabled) {
      setTimeout(() => {
        self.getProgress();
      }, 1000);
    }
  }
}

/**
 * @function docker_logoff
 * @global
 * @return {void}
 * @desc Call logout and remove auth_provider Cookie.
 * @see {@link logout}
 */
export function docker_logoff() {
  return logout().always(() => {
    window.Cookies.remove('abcdesktop_token', { path: '/API' });
    window.Cookies.remove('abcdesktop_host');
    // Do not reload the default page if manager and provider is defined
    // if manager is implicit and provider is anonymous it will
    // window.location.reload( true ); // true - Reloads the current page from the server
    // Do not reload the default page if dana pulse id set
    window.od.logoff(); // do redirect location or logout call for pulse
  });
}

export function disconnect() {
  return odApiClient.auth.disconnect()
    .always(() => {
      window.od.logoff();
    });
}

/**
 * @function getContainerLocation
 * @global
 * @params {string} uri
 * @params {boolean} ws
 * @return {string}
 * @desc Return container location.
 */
function getContainerLocation(uri, ws) {
  let protocol = window.location.protocol.toString();
  let hostname = '';
  if (ws) {
    protocol = protocol.replace('http:', 'ws:').replace('https:', 'wss:');
  }

  if (window.od.currentUser) {
    hostname = window.od.currentUser.target_ip;
  }

  let containerlocation = `${protocol}//${hostname}/`;
  if (uri) {
    // same as containerlocation += uri
    containerlocation = containerlocation.substr(0, containerlocation.lastIndexOf('/')) + uri;
  }
  return containerlocation;
}

/**
 * @function getContainerHTTPLocation
 * @global
 * @params {string} uri
 * @return {string}
 * @desc Return container HTTP location.
 * @see {@link getContainerLocation}
 */
export function getContainerHTTPLocation(uri) {
  return getContainerLocation(uri, false);
}

/**
 * @function getContainerWSLocation
 * @global
 * @params {string} uri
 * @return {string}
 * @desc Return container WebSocket location.
 * @see {@link getContainerLocation}
 */
export function getContainerWSLocation(uri) {
  return getContainerLocation(uri, true);
}

/**
 * @function getContainers
 * @global
 */
export function getContainers() {
  return odApiClient.composer.listcontainer();
}

/**
 * @function getContainers
 * @global
 */
export function getSecrets() {
  return odApiClient.composer.listsecrets();
}

/**
 * @function stopContainer
 * @param {string} container_id
 * @param {string} dislay_name
 * @desc Stop a docker container
 */
export function stopContainer(container_id, dislay_name) {
  return odApiClient.composer
    .stopcontainer(container_id)
    .done((result) => {
      if (
        typeof result === 'undefined'
        || !result.result
        || result.status !== 200
      ) {
        if (notificationSystem) {
          notificationSystem.displayNotification(
            'Kill',
            `Unexpected error can't stop docker container ${dislay_name}`,
            'error',
          );
        }
      } else if (notificationSystem) {
        notificationSystem.displayNotification(
          'Kill',
          `Docker container ${dislay_name} killed`,
          'info',
        );
      }
    })
    .fail((status, error, result) => {
      if (notificationSystem) {
        if (status == 200) {
          notificationSystem.displayNotification('Kill', result.error, 'error');
        } else {
          notificationSystem.displayNotification('Kill', error, 'error');
        }
      }
    });
}

/**
 * @function getContainerLogs
 * @param {string} container
 */
export function getContainerLogs(container_id) {
  return odApiClient.composer
    .logcontainer(container_id)
    .done((result) => {
      if (
        typeof result === 'undefined'
        || typeof result.result === 'undefined'
        || result.status !== 200
      ) {
        if (notificationSystem) {
          notificationSystem.displayNotification(
            'Logs',
            `Unexpected error can't get docker container logs [${container_id}]`,
            'error',
          );
        }
      } else {
        return result;
      }
    })
    .fail((status, error) => {
      if (notificationSystem) {
        if (status !== 200) {
          notificationSystem.displayNotification('Logs', error, 'error');
        }
      }
    });
}

/**
 * @function getContainerEnv
 * @param {string} container
 */
export function getContainerEnv(containerId) {
  return odApiClient.composer
    .envcontainer(containerId)
    .done((result) => {
      if (typeof result === 'undefined' || result.status !== 200) {
        if (notificationSystem) {
          notificationSystem.displayNotification(
            'Env',
            `Unexpected error can't get docker container Env [${containerId}]`,
            'error',
          );
        }
      } else {
        return result;
      }
    })
    .fail((status, error) => {
      if (notificationSystem) {
        if (status !== 200) {
          notificationSystem.displayNotification('Env', error, 'error');
        }
      }
    });
}

/**
 * @function removeContainer
 * @param {string} container
 * @param {string} displayName
 */

export function removeContainer(containerId, displayName) {
  return odApiClient.composer
    .removecontainer(containerId)
    .done((result) => {
      if (typeof result === 'undefined' || result.status !== 200) {
        if (notificationSystem) {
          notificationSystem.displayNotification(
            'Remove',
            `Unexpected error can't get docker container Remove [${displayName}]`,
            'error',
          );
        }
      } else {
        return result;
      }
    })
    .fail((status, error) => {
      if (notificationSystem) {
        if (status !== 200) {
          notificationSystem.displayNotification('Remove', error, 'error');
        }
      }
    });
}

export async function getPyosVersion() {
  if (window.od.currentUser.pyosVersion === undefined) {
    window.od.currentUser.pyosVersion = await odApiClient.core.getVersion();
  }
  return window.od.currentUser.pyosVersion;
}

export function getStream() {
  return odApiClient.webrtc
    .get_stream()
    .done((result) => {
      if (typeof result === 'undefined' || result.status !== 200) {
        if (notificationSystem) {
          notificationSystem.displayNotification(
            'Stream',
            'Unexpected error can not get RTP Stream',
            'error',
          );
        }
      } else {
        return result;
      }
    })
    .fail((status, error, result) => {
      console.error(result);
    });
}

export function destroyStream() {
  return odApiClient.webrtc
    .destroy_stream()
    .done((result) => {
      if (typeof result === 'undefined' || result.status !== 200) {
        if (notificationSystem) {
          notificationSystem.displayNotification(
            'Stream',
            'Unexpected error can not remove RTP Stream',
            'error',
          );
        }
      } else {
        return result;
      }
    })
    .fail((status, error, result) => {
      console.error(result);
    });
}

/**
 * @function connectReady
 * @global
 * @return {void}
 * @desc Call broadway connect
 * @see {@link broadway~connect}
 */
function connectReady() {
  window.od.setupafteruserloginin();
  window.od.broadway.connect();
}

/**
 * @function requestSpawnerAPI
 * @global
 * @params {object} jsonParameters
 * @params {callback} onerror
 * @return {void}
 * @desc Spawner asynchronous request.
 */
export function requestSpawnerAPI(
  endPoint = '',
  parameters = null,
  method = 'POST',
) {
  let url = `/spawner/${endPoint}`;
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append(
    'Authorization',
    `Bearer ${window.od.currentUser.authorization}`,
  );

  const options = {
    headers,
    method,
  };

  if (method === 'GET' && parameters) {
    url += `?${new URLSearchParams(parameters)}`;
  } else if (method !== 'GET' && parameters) {
    options.body = JSON.stringify(parameters);
  }

  return fetch(window.od.net.urlrewrite(url), options).then((res) => res.json());
}

export function setAudioQuality(sink) {
  return requestSpawnerAPI('setAudioQuality', { sink });
}

export function playAudioSample() {
  return requestSpawnerAPI('playAudioSample');
}

/**
 * @function launch
 * @params {string} app Application wmclass
 * @params {string} arg arguments for launching the app
 * @return {void}
 * @desc Launch built-in application.
 */
export function launch(app, arg, element) {
  console.log(`function launching ${app}`);

  // Be shure to get a connected broadway socket
  // broadway.autoreconnect();

  const options = { command: app };

  if (arg !== '') {
    options.args = arg;
  }

  return requestSpawnerAPI('launch', options).then((msgevent) => {
    if (element) {
      system.removeAppLoader(element);
    }

    if (msgevent && msgevent.code && msgevent.data) {
      console.debug('launch:indesktop:', msgevent);
      if (msgevent.code !== 200) {
        notificationSystem.displayNotification(
          'Start process failed',
          msgevent.data,
          'error',
        );
      }
      document.getElementById('noVNC_canvas').focus();
    }
  });
}

export async function about() {
  if (window.od.currentUser.about === undefined) {
    window.od.currentUser.about = await requestSpawnerAPI('about', null, 'GET');
  }
  return window.od.currentUser.about;
}

/**
 * @function closewindow
 * @params {Array<number>} windowsid
 * @return {void}
 * @desc Close windows using windows's ID.
 */
export function closewindows(windowsid) {
  return requestSpawnerAPI('closewindows', { windowsid });
}

/**
 * @function activatewindows
 * @params {Array<number>} windowsid
 * @return {void}
 * @desc Activate application window using window's ID.
 */
export function activatewindows(windowsid) {
  return requestSpawnerAPI('activatewindows', { windowsid });
}

/**
 * @function getwindowslist
 * @global
 * @return {void}
 * @desc Returns a list containing all the applications windows opened.
 */
export function getwindowslist() {
  return requestSpawnerAPI('getwindowslist', null, 'GET');
}

/**
 * @function broadcastwindowslist
 * @return {void}
 * @desc Broadcast to all users a list containing all the applications windows opened.
 */
export function broadcastwindowslist() {
  return requestSpawnerAPI('broadcastwindowslist');
}

/**
 * @function clipboardsync
 * @return {void}
 * @desc Sync data between the clipboard PRIMARY and clipboard CLIPBOARD
 */
export function clipboardsync() {
  return requestSpawnerAPI('clipboardsync');
}

/**
 * @function getlocation
 * @return location
 * @desc location user and server
 */
export function getlocation() {
  return odApiClient.user.getLocation().then((result) => {
    if (typeof result === 'undefined') {
      console.error('getlocation: empty response from API service');
      return;
    }
    if (result.error == null) return result;
  });
}

export function getLabels() {
  return odApiClient.auth.getLabels()
    .then((res) => res.result);
}

export function requestFileAPI(method, file) {
  let params = '';
  let body = null;
  const headers = new Headers();
  headers.append(
    'Authorization',
    `Bearer ${window.od.currentUser.authorization}`,
  );

  if (file !== '') {
    if (method === 'GET') {
      params += `?${new URLSearchParams({ file })}`;
    } else {
      body = JSON.stringify({ file });
      headers.append('Content-Type', 'application/json');
    }
  }

  const url = window.od.net.urlrewrite(`/filer${params}`);
  const options = {
    method,
    headers,
    body,
  };

  return fetch(url, options);
}

export function fileAPIListDirectory(directory = '') {
  const headers = new Headers();
  headers.append(
    'Authorization',
    `Bearer ${window.od.currentUser.authorization}`,
  );
  const url = `/filer/directory/list/?${new URLSearchParams({ directory })}`;

  const options = {
    method: 'GET',
    headers,
  };

  return fetch(window.od.net.urlrewrite(url), options);
}

window.fileAPIListDirectory = fileAPIListDirectory;

/**
 * @function filesearch
 * @params {string} keywords
 * @params {callback} callback_onsuccess
 * @params {callback} callback_onerror
 * @return {object} ws
 * @desc Search for files in user's storage, to cancel the request just close the ws.
 */
export function filesearch(keywords, abortController = new AbortController()) {
  const params = `${keywords !== '' ? `?${new URLSearchParams({ keywords })}` : ''
  }`;
  const url = window.od.net.urlrewrite(`/spawner/filesearch${params}`);

  const options = {
    method: 'GET',
    signal: abortController.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${window.od.currentUser.authorization}`,
    },
  };

  return fetch(window.od.net.urlrewrite(url), options)
    .then(async (res) => {
      if (res.status !== 200) {
        let error;
        try {
          error = await res.json();
        } catch (e) {
          error = await res.text();
        }
        throw error;
      }

      return res.json();
    });
}

/**
 * @function getmimeforfile
 * @params {string} filename
 * @return {void}
 * @desc Get mimetype for file.
 */
export function getmimeforfile(filename) {
  return requestSpawnerAPI(
    'getmimeforfile',
    { filename },
    null,
    'GET',
  );
}

/**
 * @function generateDesktopFiles
 * @params {object} applist
 * @return {void}
 * @desc Generate .desktop files.
 */
export function generateDesktopFiles(list) {
  return requestSpawnerAPI('generateDesktopFiles', { list });
}

/**
 * @function getappforfile
 * @params {string} filename
 * @return {void}
 * @desc Get default application for a given file.
 */
export function getappforfile(filename) {
  return requestSpawnerAPI('getappforfile', { filename }, 'GET');
}

export function setBackgroundCanvasColor(color) {
  return requestSpawnerAPI('setBackgroundColor', { color });
}

export function setDesktop(key, value) {
  return requestSpawnerAPI('setDesktop', { key, value });
}

export function setBackgroundImage(image) {
  return Promise.all([
    setDesktop('currentImg', image),
    requestSpawnerAPI('setBackgroundImage', { imgName: image }),
  ]).then((res) => res[1]);
}

export function setDefaultImage() {
  return requestSpawnerAPI('setDefaultImage');
}

export function getDesktop(key) {
  return requestSpawnerAPI('getDesktop', { key }, 'GET');
}

export function setTheme(theme) {
  return requestSpawnerAPI('setTheme', { theme });
}

export function placeAllWindows() {
  return requestSpawnerAPI('placeAllWindows');
}

export async function getSpawnerVersion() {
  if (window.od.currentUser.spawnerVersion === undefined) {
    const { data } = await requestSpawnerAPI('version', null, 'GET');
    window.od.currentUser.spawnerVersion = data;
  }

  return window.od.currentUser.spawnerVersion;
}

export function getSettings() {
  return requestSpawnerAPI('getSettings', null, 'GET');
}

export function configurePulse(destinationIp, port) {
  return requestSpawnerAPI('configurePulse', { destinationIp, port }, 'PUT');
}

export async function getWebModulesVersion() {
  if (window.od.currentUser.webModulesVersion === undefined) {
    const response = await fetch(window.od.net.urlrewrite('version.json'));
    window.od.currentUser.webModulesVersion = await response.json();
  }
  return window.od.currentUser.webModulesVersion;
}

export const containerNotificationInfo = function(data) {
  notificationSystem.displayNotification(data.name, data.message, 'error', '/img/app/' + data.icon, 10 );
};

broadcastEvent.addEventListener('container',	({ detail: { container   } }) => containerNotificationInfo(container));
broadcastEvent.addEventListener('ocrun', 	({ detail: { data_dict   } }) => ocrun(data_dict));
