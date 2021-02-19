/* eslint-disable consistent-return */
/* eslint-disable prefer-rest-params */
// writes helpers require for vnc.html (they should output app.js)

import fs from 'fs/promises';
import util from 'util';
import path from 'path';
import browserify from 'browserify';

export async function writeAppJSFile(scriptBasePath, outPath) {
  const pathScriptEntryPoint = path.join(scriptBasePath, 'js/scripts.js');
  const b = browserify(pathScriptEntryPoint);
  const bufferAppJSFile = await util.promisify(b.bundle).call(b);
  return fs.writeFile(outPath, bufferAppJSFile);
}
