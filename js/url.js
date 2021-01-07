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

const URL = (function () {
  function parseSearch(s) {
    const result = [];
    let k = 0;
    const parts = s.slice(1).split('&');
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const key = part.split('=', 1)[0];
      if (key) {
        const value = part.slice(key.length + 1);
        result[k++] = [key, value];
      }
    }
    return result;
  }

  function serializeParsed(array) {
    return array.map((pair) => (pair[1] !== '' ? pair.join('=') : pair[0])).join('&');
  }

  function URL(url, base) {
    if (!url) { throw new TypeError('Invalid argument'); }

    const doc = document.implementation.createHTMLDocument('');
    if (base) {
      const baseElement = doc.createElement('base');
      baseElement.href = base || window.lo;
      doc.head.appendChild(baseElement);
    }
    const anchorElement = doc.createElement('a');
    anchorElement.href = url;
    doc.body.appendChild(anchorElement);

    if (anchorElement.href === '') { throw new TypeError('Invalid URL'); }

    Object.defineProperty(this, '_anchorElement', { value: anchorElement });
  }

  URL.prototype = {
    toString() {
      return this.href;
    },
    get href() {
      return this._anchorElement.href;
    },
    set href(value) {
      this._anchorElement.href = value;
    },

    get protocol() {
      return this._anchorElement.protocol;
    },
    set protocol(value) {
      this._anchorElement.protocol = value;
    },

    // NOT IMPLEMENTED
    // get username() {
    //   return this._anchorElement.username;
    // },
    // set username(value) {
    //   this._anchorElement.username = value;
    // },

    // get password() {
    //   return this._anchorElement.password;
    // },
    // set password(value) {
    //   this._anchorElement.password = value;
    // },

    // get origin() {
    //   return this._anchorElement.origin;
    // },

    get host() {
      return this._anchorElement.host;
    },
    set host(value) {
      this._anchorElement.host = value;
    },

    get hostname() {
      return this._anchorElement.hostname;
    },
    set hostname(value) {
      this._anchorElement.hostname = value;
    },

    get port() {
      return this._anchorElement.port;
    },
    set port(value) {
      this._anchorElement.port = value;
    },

    get pathname() {
      return this._anchorElement.pathname;
    },
    set pathname(value) {
      this._anchorElement.pathname = value;
    },

    get search() {
      return this._anchorElement.search;
    },
    set search(value) {
      this._anchorElement.search = value;
    },

    get hash() {
      return this._anchorElement.hash;
    },
    set hash(value) {
      this._anchorElement.hash = value;
    },

    get filename() {
      let match;
      if ((match = this.pathname.match(/\/([^/]+)$/))) { return match[1]; }
      return '';
    },
    set filename(value) {
      let match; const
        { pathname } = this;
      if ((match = pathname.match(/\/([^/]+)$/))) { this.pathname = pathname.slice(0, -match[1].length) + value; } else { this.pathname = value; }
    },

    get parameterNames() {
      const seen = Object.create(null);
      return parseSearch(this.search).map((pair) => pair[0]).filter((key) => {
        if (key in seen) { return false; }
        seen[key] = true;
        return true;
      });
    },

    getParameter(name) {
      return this.getParameterAll(name).pop();
    },

    getParameterAll(name) {
      name = String(name);
      const result = [];
      let k = 0;
      parseSearch(this.search).forEach((pair) => {
        if (pair[0] === name) result[k++] = pair[1];
      });
      return result;
    },

    appendParameter(name, values) {
      if (!Array.isArray(values)) values = [values];
      const parsed = parseSearch(this.search);
      for (let i = 0; i < values.length; i++) {
        parsed.push([name, values[i]]);
      }
      this.search = serializeParsed(parsed);
    },

    clearParameter(name) {
      this.search = serializeParsed(
        parseSearch(this.search).filter((pair) => pair[0] !== name),
      );
    },
  };

  const oldURL = window.URL || window.webkitURL || window.mozURL;

  URL.createObjectURL = function () {
    return oldURL.createObjectURL.apply(oldURL, arguments);
  };

  URL.revokeObjectURL = function () {
    return oldURL.revokeObjectURL.apply(oldURL, arguments);
  };

  // Methods should not be enumerable.
  Object.defineProperty(URL.prototype, 'toString', { enumerable: false });
  Object.defineProperty(URL.prototype, 'getParameter', { enumerable: false });
  Object.defineProperty(URL.prototype, 'getParameterAll', { enumerable: false });
  Object.defineProperty(URL.prototype, 'appendParameter', { enumerable: false });
  Object.defineProperty(URL.prototype, 'clearParameter', { enumerable: false });
  Object.defineProperty(URL, 'createObjectURL', { enumerable: false });
  Object.defineProperty(URL, 'revokeObjectURL', { enumerable: false });

  return URL;
}());

window.URL = URL;
