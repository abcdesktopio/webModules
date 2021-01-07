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

const lyncClient = new (class LyncClient {
  constructor() {
    this.accountingrequestLync = {};
  }

  sendRequest(method, parameters, onsuccess, onerror, bwsclose) {
    const lyncurl = window.od.net.getwsurl('/lync');
    const wsslync = new WebSocket(lyncurl);

    if (!parameters) parameters = {};
    parameters.method = method;

    const data = JSON.stringify(parameters);

    bwsclose = !!bwsclose;

    if (!onsuccess) {
      onsuccess = function (msg) { console.log(msg); };
    }

    wsslync.onerror = onerror || function () {
      console.log(`${method}: Failed to connect to lync proxy`);
    };

    wsslync.onopen = function () {
      if (this.accountingrequestLync[method]) { this.accountingrequestLync[method] = this.accountingrequestLync[method] + 1; } else { this.accountingrequestLync[method] = 1; }

      console.log(this.accountingrequestLync);
      console.info(`requestLyncAPI socket send: ${data}`);

      if (!bwsclose) { console.log(`open ${method} will never closed `); }

      wsslync.send(data);
    };

    wsslync.onmessage = function (msgevent) {
      console.log(`message for method ${method}`);
      console.info(`wsslync.onmessage received ${msgevent}`);

      onsuccess(msgevent);

      if (bwsclose) {
        console.log(`onmessage  ${method} closing `);
        wsslync.close();
      } else {
        console.log(`onmessage ${method} not closed `);
      }
    };

    wsslync.onclose = function () {
      if (this.accountingrequestLync[method]) { this.accountingrequestLync[method] = this.accountingrequestLync[method] - 1; }

      console.info(`wsslync.onclose received method ${method}`);
      console.log(this.accountingrequestLync);
    };

    return wsslync;
  }

  lync_createApp(host, token, path, onsuccess, onerror) {
    return this.sendRequest('lync_createApp', { host, token, path }, onsuccess, onerror, true);
  }

  makeMeAvailable(host, token, path, onsuccess, onerror) {
    return this.sendRequest('makeMeAvailable', { host, token, path }, onsuccess, onerror, false);
  }

  getMyPresence(host, token, path, onsuccess, onerror) {
    return this.sendRequest('getMyPresence', { host, path, token }, onsuccess, onerror);
  }

  getPresence(host, token, path, onsuccess, onerror) {
    return this.sendRequest('getPresence', { host, token, path }, onsuccess, onerror, true);
  }

  setPresence(host, token, path, state, onsuccess, onerror) {
    return this.sendRequest('setPresence', {
      host, token, path, state,
    }, onsuccess, onerror, true);
  }

  suscribeLyncPresence(host, token, path, sips, onsuccess, onerror) {
    return this.sendRequest('suscribeLyncPresence', {
      host, token, path, sips,
    }, onsuccess, onerror);
  }

  getContacts(host, token, path, onsuccess, onerror) {
    return this.sendRequest('getContacts', { host, path, token }, onsuccess, onerror, true);
  }

  getLyncEvents(host, token, path, onsuccess, onerror) {
    return this.sendRequest('getEvents', { host, path, token }, onsuccess, onerror, true);
  }

  getConversations(host, token, path, onsuccess, onerror) {
    return this.sendRequest('getConversations', { host, path, token }, onsuccess, onerror);
  }

  getParticipants(host, token, path, onsuccess, onerror) {
    return this.sendRequest('getParticipants', { host, path, token }, onsuccess, onerror, true);
  }

  inviteIM(host, token, path, contact, uid, cuid, onsuccess, onerror) {
    return this.sendRequest('inviteIM',
      {
        to: contact,
        uid,
        cuid,
        host,
        path,
        token,
      },
      onsuccess,
      onerror,
      true);
  }

  sendIM(host, token, path, message, onsuccess, onerror) {
    return this.sendRequest('sendIM', {
      message, host, path, token,
    }, onsuccess, onerror, true);
  }

  acceptMessagingInvitation(host, token, path, onsuccess, onerror) {
    return this.sendRequest('acceptMessagingInvitation', { host, path, token }, onsuccess, onerror, true);
  }

  getUserByMail(mail, callback) {
    return this.sendRequest('getUserByMail', { mail }, callback, null, true);
  }

  getUserPicture(host, path, callback) {
    return this.sendRequest('getUserPicture', { host, path }, callback);
  }
})();
export default lyncClient;
