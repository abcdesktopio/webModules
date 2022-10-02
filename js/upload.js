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
 * @name Upload
 * @module
 */

import * as script from './scripts.js';
import * as notificationSystem from './notificationsystem.js';
import * as launcher from './launcher.js';

/**
 * @function init
 * @returns {void}
 * @desc Init a dropzone on document.documentElement with Dropzone lib
 * @see {@link http://www.dropzonejs.com| DropzoneJs}
 */
export const init = function () {
  const upload = document.getElementById('upload');
  if (upload) {
    // read env.ABCDESKTOP_SERVICE_filer
    launcher.getenv().then( (data) => {
      if (data.env) {
        // check if filer service is enabled
        const filterservice = (data.env.ABCDESKTOP_SERVICE_filer === 'enabled');
        if ( filterservice ) {
          initDropZone();
        } 
      }
    });
  }
};

/**
 * @function initDropZone
 * @returns {void}
 * @desc Init a dropzone on with Dropzone lib
 * @see {@link http://www.dropzonejs.com| DropzoneJs}
 */
function initDropZone() {
  const myDropzone = new window.Dropzone(document.body, {
    url: '/filer',
    clickable: false,
    previewsContainer: '#upload .drop-down',
    maxFilesize: null,
    headers: { 'ABCAuthorization': `Bearer ${window.od.currentUser.authorization}` },
  });

  myDropzone.on('queuecomplete', () => {
    console.log('Queue complete');
    upload.style.display = 'none';
    $('.dz-complete').remove();
    script.closeTopRightDropDowns();
  });

  myDropzone.on('addedfile', function (file) {
    upload.style.display = 'block';
    console.log(file);
    // update the headers Authorization
    this.options.headers.ABCAuthorization = `Bearer ${window.od.currentUser.authorization}`;
    file.previewElement.querySelector('.dz-error-mark').addEventListener('click', () => {
      myDropzone.cancelUpload(file);
    });
  });

  myDropzone.on('error', (file, response, e) => {
    if (e) {
      notificationSystem.displayNotification('Upload', `${e.status} ${e.statusText}`, 'error');
    } else {
      notificationSystem.displayNotification('Upload', response, 'error');
    }
    myDropzone.removeAllFiles();
  });

  myDropzone.on('sending', (file, xhr, data) => {
    if (file.fullPath) {
      data.append('fullPath', file.fullPath);
    }
  });
}