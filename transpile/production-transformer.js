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

/* eslint-disable prefer-rest-params */
/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
/* eslint-disable consistent-return */

import fs from 'fs';
import path from 'path';
import util from 'util';
import fse from 'fs-extra';
import babel from '@babel/core';
import { writeAppJSFile } from './helper.js';

const dirname = path.resolve();

// the various important paths
const paths = {
  main: path.resolve(dirname, '..'),
  app: path.resolve(dirname, '..', 'js/noVNC/app'),
  js: path.resolve(dirname, '..', 'js'),
  outDirBase: path.resolve(dirname, '..', 'build'),
  libDirBase: path.resolve(dirname, '..', 'lib'),
};

const htmlFilesSourceAndOut = [
  {
    srcHtmlPath: path.resolve(dirname, '..', 'index.html'),
    outHtmlPath: path.resolve('..', 'index.html'),
  },
  {
    srcHtmlPath: path.resolve(dirname, '..', 'app.html'),
    outHtmlPath: path.resolve('..', 'app.html'),
  },
  {
    srcHtmlPath: path.resolve(dirname, '..', 'index.session.mustache.html'),
    outHtmlPath: path.resolve('..', 'index.session.mustache.html'),
  },

];

const ensureDir = util.promisify(fse.ensureDir);
const babelTransformFile = util.promisify(babel.transformFile);

/**
 * @function walkDir
 * @param {string} basePath
 * @return {AsyncIterator<string>}
 * @desc Getting all files recurcivly of a given directory through an AsyncIterator  
 */
async function* walkDir(basePath) {
  const dirents = await fs.promises.readdir(basePath, { withFileTypes: true });
  const mapper = (dirent) => path.join(basePath, dirent.name);
  const files = dirents.filter((dirent) => dirent.isFile() && !dirent.isSymbolicLink())
    .map(mapper);

  const directories = dirents.filter((dirent) => dirent.isDirectory() && !dirent.isSymbolicLink())
    .map(mapper);

  yield* files;

  for (const directory of directories) {
    yield* walkDir(directory);
  }
}

/**
 * @function transformHtml
 * @param {Object} htmlFileSourceAndOut 
 * @returns {Promise<void>}
 * @desc Allow to replace modules by app.js in a provided html file
 */
async function transformHtml(htmlFileSourceAndOut) {
  const { srcHtmlPath, outHtmlPath } = htmlFileSourceAndOut;
  const contents = await fs.promises.readFile(srcHtmlPath, 'utf-8');
  const startMarker = '<!-- begin scripts -->\n';
  const endMarker = '<!-- end scripts -->';
  const startInd = contents.indexOf(startMarker) + startMarker.length;
  const endInd = contents.indexOf(endMarker, startInd);

  const newScript = `
    <script src="js/runtime.js"></script>
    <script crossorigin="anonymous" src="app.js"></script>
  `;

  const newContents = `${contents.slice(0, startInd)}${newScript}\n${contents.slice(endInd)}`;
  const timeId = `Writing ${outHtmlPath}`;
  console.time(timeId);
  await fs.promises.writeFile(outHtmlPath, newContents);
  console.timeEnd(timeId);
}

/**
 * 
 * @param {string} legacyPath 
 * @param {Object} opts 
 * @param {string} filename
 * @returns {Promise<void>}
 * @desc Allow to transform a module js file in a es5 compatible file, and then copy it in an other folder 
 */
async function transformAndCopyJSFile(legacyPath, opts, filename) {
  const timerLabel = `\t${legacyPath}`;
  console.time(timerLabel);
  await ensureDir(path.dirname(legacyPath));
  const { code } = await babelTransformFile(filename, opts);
  await fs.promises.writeFile(legacyPath, code);
  console.timeEnd(timerLabel);
}

/**
 * @returns {Promise<void>}
 * @desc Allow to build app.js file and then change the script imports in all html files 
 */
export async function makeLibFiles() {
  // NB: we need to make a copy of babelOpts, since babel sets some defaults on it
  const babelOpts = () => ({
    plugins: [
      '@babel/plugin-transform-regenerator',
    ],
    presets: [
      [
        '@babel/preset-env',
        {
          targets: 'ie >= 9',
          modules: 'commonjs',
        },
      ],
    ],
    ast: false,
    sourceMaps: false,
  });

  const legacyPathBase = path.join(paths.outDirBase, 'legacy');

  await fse.ensureDir(paths.outDirBase);

  const opts = babelOpts();
  const outFiles = [];
  const awaitings = [];
  const copyFilesLabel = 'Total duration copy and transform';

  console.log('Transform and copy js files:');
  console.time(copyFilesLabel);
  for await (const filename of walkDir(paths.js)) {
    if (path.extname(filename) !== '.js' || /\.min\.js$/.test(filename)) {
      continue;
      // skip non-javascript files
    }
    const legacyPath = path.join(legacyPathBase, path.relative(paths.main, filename));
    outFiles.push(`${legacyPath}`);
    awaitings.push(transformAndCopyJSFile(legacyPath, opts, filename));
  }
  await Promise.all(awaitings);
  console.timeEnd(copyFilesLabel);

  const outAppPath = path.join(paths.main, 'app.js');
  console.log(`Writing ${outAppPath}`);
  await writeAppJSFile(legacyPathBase, outAppPath);

  // Create html files in build directories
  await Promise.all(
    htmlFilesSourceAndOut.map(
      (htmlFileSourceAndOut) => transformHtml(htmlFileSourceAndOut)
    )
  );
}

/**
 * @returns {Promise<void>}
 * @desc Remove build directory
 */
export async function clean() {
  const removeOutDirBase = `remove out dir base ${paths.outDirBase}`;
  console.time(removeOutDirBase);

  await fse.remove(paths.outDirBase);
  console.timeEnd(removeOutDirBase);
}
