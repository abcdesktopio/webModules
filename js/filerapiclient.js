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

const filerApiClient = new (class FilerApiClient {
  constructor() {
    this.baseURL = '/filer';
    this.timeout = 2000;
  }

  get(filename) { return this.sendRequest('GET', filename); }

  delete(filename) { return this.sendRequest('DELETE', filename); }

  sendRequest(method, filename) {
    const url = window.od.net.urlrewrite(this.baseURL + filename);

    return $.ajax({
      url,
      type: method.toUpperCase(),
      timeout: this.timeout,
    })
      .done(() => {
        console.log(`filerApiClient - success: method = ${method}`);
      })
      .fail((_, __, error) => {
        console.log(`filerApiClient - error: method = ${method}, url = ${url}, result = ${error}`);
      });
  }
})();
export default filerApiClient;
