/* eslint-disable consistent-return */
/* eslint-disable prefer-rest-params */
// writes helpers require for vnc.html (they should output app.js)

import fs from 'fs/promises';
import util from 'util';
import path from 'path';
import { Worker } from 'worker_threads';
import browserify from 'browserify';


const dirname = path.resolve();
const pathWorker = path.join(dirname, 'replaceWorker.js');

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
