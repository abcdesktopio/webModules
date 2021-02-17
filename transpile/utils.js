import { Worker } from 'worker_threads';
import path from 'path';

const moduleURL = new URL(import.meta.url);
const __dirname = path.dirname(moduleURL.pathname);
const pathWorker = path.join(__dirname, 'replaceWorker.js');

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
