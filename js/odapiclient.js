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

const odApiClient = new (class ODApiClient {
  constructor() {
    this.baseURL = '/API';
    const client = this;

    this.auth = new (class authClient {
      getauthconfig() {
        return client.sendRequest('auth/getauthconfig');
      }

      login(manager, provider, data) {
        return client.sendRequest('auth/login', $.extend({ manager, provider }, data));
      }

      auth(manager, provider, data) {
        return client.sendRequest('auth/auth', $.extend({ manager, provider }, data))
          .then((res) => {
            const { jwt_user_token } = res.result;
            localStorage.setItem('abcdesktop_jwt_user_token', jwt_user_token);
            return res;
          });
      }

      logout(data_dict) {
        return client.sendRequest('auth/logout', data_dict)
          .then((res) => {
            localStorage.clear();
            return res;
          });
      }

      disconnect() {
        return client.sendRequest('auth/disconnect')
          .then((res) => {
            localStorage.clear();
            return res;
          });
      }

      refreshtoken() {
        return client.sendRequest('auth/refreshtoken')
          .then((res) => {
            const { jwt_user_token } = res.result;
            localStorage.setItem('abcdesktop_jwt_user_token', jwt_user_token);
            return res;
          });
      }

      getLabels() {
        return client.sendRequest('auth/labels');
      }

      buildsecret(password) {
        return client.sendRequest('auth/buildsecret', { password })
          .then((res) => {
            const { userid, name, provider, jwt_user_token } = res.result;
            window.od.currentUser.userid = userid;
            window.od.currentUser.name = name; 
            window.od.currentUser.provider = provider;
            localStorage.setItem('abcdesktop_jwt_user_token', jwt_user_token);
            return res;
          });
      }
    })();

    this.user = new (class userClient {
      whoami() {
        return client.sendRequest('user/whoami');
      }

      getInfo() {
        return client.sendRequest('user/getinfo');
      }

      getLyncConnectionKey() {
        return client.sendRequest('user/getlyncconnectionkey');
      }

      getZimbraUrl() {
        return client.sendRequest('user/getzimbraurl');
      }

      getLocation() {
        return client.sendRequest('user/getlocation');
      }

      shareLogin(email, token) {
        return client.sendRequest('user/sharelogin', { email, token });
      }

      share(email, shared) {
        return client.sendRequest('user/share', {
          email,
          shared,
          hostname: `${window.location.protocol}//${window.location.hostname}/?sharedtoken=`,
        });
      }

      support() {
        return client.sendRequest('user/support', { hostname: `${window.redirectwindow.location.protocol}//${window.location.hostname}/?sharedtoken=` });
      }
    })();

    this.store = new (class storeClient {
      get(key) {
        return client.sendRequest('store/get', { key });
      }

      set(key, value) {
        return client.sendRequest('store/set', { key, value });
      }

      setCollection(key, value) {
        return client.sendRequest('store/setcollection', { key, value });
      }

      getCollection(key) {
        return client.sendRequest('store/getcollection', { key });
      }
    })();

    this.core = new (class coreClient {
      getKeyInfo(provider) {
        return client.sendRequest('core/getkeyinfo', { provider });
      }

      getMessageInfo() {
        return client.sendRequest('core/getmessageinfo');
      }

      getVersion() {
        return client.sendRequest('version');
      }
    })();

    this.webrtc = new (class coreClient {
      get_stream() {
        return client.sendRequest('webrtc/get_stream', {});
      }

      destroy_stream() {
        return client.sendRequest('webrtc/destroy_stream', {});
      }
    })();

    this.printer = new (class printerClient {
      remove(printerName) {
        return client.sendRequest('printer/remove', { printerName });
      }

      list() {
        return client.sendRequest('printer/list');
      }

      add(cn) {
        return client.sendRequest('printer/add', { cn });
      }

      listEnable() {
        return client.sendRequest('printer/listenable');
      }
    })();

    this.composer = new (class composerClient {
      runApp(data_dict) {
        return client.sendRequest('composer/ocrun', data_dict);
      }

      launchDesktop(width, height, hostname, app, args) {
        // app is not used
        // only to be fully compatible with launchMetappli
        app = 'desktop';
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return client.sendRequest('composer/launchdesktop', {
          width, height, hostname, timezone,
        });
      }

      launchMetappli(width, height, hostname, app, args) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return client.sendRequest('composer/launchmetappli', {
          width, height, hostname, app, args, timezone, querystring: window.location.search,
        });
      }

      restart() {
        return client.sendRequest('composer/restart');
      }

      refreshdesktoptoken(app) {
        return client.sendRequest('composer/refreshdesktoptoken', { app });
      }

      getUserAppList() {
        return client.sendRequest('composer/getuserapplist');
      }

      getAppList() {
        return client.sendRequest('composer/getapplist');
      }

      getLogs() {
        return client.sendRequest('composer/getlogs');
      }

      stopcontainer(containerid) {
        return client.sendRequest('composer/stopcontainer', { containerid });
      }

      logcontainer(containerid) {
        return client.sendRequest('composer/logcontainer', { containerid });
      }

      envcontainer(containerid) {
        return client.sendRequest('composer/envcontainer', { containerid });
      }

      removecontainer(containerid) {
        return client.sendRequest('composer/removecontainer', { containerid });
      }

      listcontainer() {
        return client.sendRequest('composer/listcontainer');
      }

      listsecrets() {
        return client.sendRequest('composer/listsecrets');
      }

    })();
  }

  sendRequest(method, args) {
    function getErrorResponse(result, status, xhr) {
      const status_ex = (xhr && xhr.status) ? xhr.status : status;
      const status_dict = { status: xhr.status, error: result };
      if (xhr.responseJSON) {
        if (xhr.responseJSON.message) { status_dict.message = xhr.responseJSON.message; }
        if (xhr.responseJSON.status_message) { status_dict.status_message = xhr.responseJSON.status_message; }
      }

      return {
        status,
        status_ex,
        status_dict,
        error: result,
      }
    }

    return $.ajax({
      type: 'POST',
      url: `${this.baseURL}/${method}`,
      data: JSON.stringify(args || {}),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('abcdesktop_jwt_user_token')}`,
      },
    }).then(
      (result, status, xhr) => {
        const deferred = $.Deferred();

        if (!result) {
          deferred.resolve(result);
        } else if ((result.status && result.status === 500) || result.error) {
          if (!result.error) result.error = 'API call failed';
          if (!result.status) result.status = 500;
          deferred.reject(getErrorResponse(result, xhr.status, xhr));

        } else {
          if (!result.status) {
            result.status = 200;
          }
          deferred.resolve(result);
        }
        return deferred.promise();
      },

      (xhr, status, error) => {
        const deferred = $.Deferred();
        deferred.reject(getErrorResponse(error, status, xhr));
        return deferred.promise();
      },
    );
  }
})();
export default odApiClient;
