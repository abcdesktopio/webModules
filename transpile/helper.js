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

/* eslint-disable consistent-return */
/* eslint-disable prefer-rest-params */
// writes helpers require for vnc.html (they should output app.js)

import { createRequire } from 'module';
import fs from 'fs/promises';
import util from 'util';
import path from 'path';
import browserify from 'browserify';
import { Worker } from 'worker_threads';

// const transpileNative = createRequire(import.meta.url)('node-gyp-build')(process.cwd());

const dirname = path.resolve();
const pathWorker = path.join(dirname, 'replaceWorker.js');

/**
 * 
 * @param {string} scriptBasePath 
 * @param {string} outPath 
 * @returns {Promise<void>}
 * @desc Combine all js es5 js files to one app.js
 */
export async function writeAppJSFile(scriptBasePath, outPath) {
  const pathScriptEntryPoint = path.join(scriptBasePath, 'js/scripts.js');
  const b = browserify(pathScriptEntryPoint);
  const bufferAppJSFile = await util.promisify(b.bundle).call(b);
  return fs.writeFile(outPath, bufferAppJSFile);
}


/**
 *
 * @param {string} str
 * @param {string} searchValue
 * @param {string} replaceValue
 * @returns {Promise<void>}
 * @desc Allow to create a worker which will replace a provided searched value by an other provided replace value in a given file
 */
export function callReplaceWorker(filename, searchValue, replaceValue) {
  return new Promise((resolve, reject) => {
    try {
      const workerData = {
        filename,
        searchValue,
        replaceValue,
      };

      const worker = new Worker(pathWorker, { workerData });

      worker.on('exit', () => {
        resolve();
      });

      worker.on('error', (err) => {
        console.error(err);
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * 
 * @param {string} filePath 
 * @param {string} from 
 * @param {string} to
 * @desc Allow to replace all occurrence of a string by an other string in a given file
 */
export function replaceInFileAsync(filePath, from, to) {
  if (typeof filePath !== 'string') {
    throw new TypeError('filePath must be a string');
  }

  if (typeof from !== 'string') {
    throw new TypeError('from must be a string');
  }

  if (typeof to !== 'string') {
    throw new TypeError('to must be a string');
  }
  console.log( 'replaceInFileAsync ', filePath, from, to ); 
  return transpileNative.replaceInFileAsync(filePath, from, to);
}
