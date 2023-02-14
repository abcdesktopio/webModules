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
            console.debug( 'abcdesktop_jwt_user_token has been stored by auth request' )
            return res;
          });
      }

      logout(data_dict) {
        return client.sendRequest('auth/logout', data_dict)
          .then((res) => {
            localStorage.removeItem('abcdesktop_jwt_user_token');
            return res;
          });
      }

      disconnect() {
        return client.sendRequest('auth/disconnect')
          .then((res) => {
            localStorage.removeItem('abcdesktop_jwt_user_token');
            return res;
          });
      }

      refreshtoken(data) {
        return client.sendRequest('auth/refreshtoken',data)
          .then((res) => {
            const { jwt_user_token } = res.result;
            localStorage.setItem('abcdesktop_jwt_user_token', jwt_user_token);
            console.debug( 'abcdesktop_jwt_user_token has been stored by refreshtoken request' );
            return res;
          });
      }

      getLabels() {
        return client.sendRequest('auth/labels');
      }

      buildsecret(password) {
        return client.sendRequest('auth/buildsecret', { password })
          .then((res) => {
            const {
              userid, name, provider, jwt_user_token,
            } = res.result;
            window.od.currentUser.userid = userid;
            window.od.currentUser.name = name;
            window.od.currentUser.provider = provider;
            localStorage.setItem('abcdesktop_jwt_user_token', jwt_user_token);
            console.debug( 'abcdesktop_jwt_user_token has been stored by a buildsecret request' )
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
          width, height, hostname, timezone, args
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

      stopcontainer(podname, containerid) {
        return client.sendRequest('composer/stopcontainer', { podname, containerid });
      }

      logcontainer(podname, containerid) {
        return client.sendRequest('composer/logcontainer', { podname, containerid });
      }

      envcontainer(podname, containerid) {
        return client.sendRequest('composer/envcontainer', { podname, containerid });
      }

      removecontainer(podname, containerid) {
        return client.sendRequest('composer/removecontainer', { podname, containerid });
      }

      listcontainer() {
        return client.sendRequest('composer/listcontainer');
      }

      listsecrets() {
        return client.sendRequest('composer/listsecrets');
      }
      getdesktopdescription() {
        return client.sendRequest('composer/getdesktopdescription');
      }
    })();
  }

  sendRequest(method, args) {
    function getErrorResponse(result, status, xhr) {
      let response_message = "unknow error";
      let response_status = 500;
      if (result) {
	  if (result.status) {
	  	if (result.error)
	      		return result;
		if (!result.message) {
            		result.error = result.message;
			return result;
		}
	  }
      }
	    
      if (xhr) {
        // prevent reverse proxy reponse
        // could return a html data
        // read by default xhr status if exist 
        if (xhr.statusText) { response_message = xhr.statusText; }
        if (xhr.status)     { response_status  = xhr.status;  }

        // read xhr.responseJSON 
        // should get more detail than xhr
        if (xhr.responseJSON) {
          if (xhr.responseJSON.error) { response_message = xhr.responseJSON.message; }
          if (xhr.responseJSON.status){ response_status  = xhr.responseJSON.status;  }
        }
      }
  
      return { 'status': response_status, 'error': response_message };
    }

    const options = {
      type: 'POST',
      url: `${this.baseURL}/${method}`,
      data: JSON.stringify(args || {}),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
    };

    const abcdesktop_jwt_user_token = localStorage.getItem('abcdesktop_jwt_user_token');
    if (abcdesktop_jwt_user_token) {
      options.headers = {
        ABCAuthorization: `Bearer ${abcdesktop_jwt_user_token}`,
      };
    }

    return $.ajax(options)
      .then((result, status, xhr) => {
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
      });
  }
})();
export default odApiClient;
