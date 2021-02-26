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

import { createRequire } from 'module';
import childProcess from 'child_process';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import Mustache from 'mustache';

import {
  clean,
  makeLibFiles,
} from './production-transformer.js';

import { callReplaceWorker } from './helper.js';

const { program } = createRequire(import.meta.url)('commander');

const exec = promisify(childProcess.exec);

program.version('2.0');

program
  .option('-s --svg', 'Replace the current tertiary color in svg files by the tertiary color in conf.json')
  .option('-c, --css', 'Transpile less code to css')
  .option('-o, --oneCss', 'Use one file css minified')
  .option('-ui, --user-interface', 'Apply user interface\'s configuration')
  .option('--prod', 'Use for indicate to build app.js production file')
  .option('--clean', 'clear the lib folder before building');

program.parse(process.argv);

const configPath = path.resolve('config');

const cssPath = path.resolve(path.join('..', 'css'));
const cssDistPath = path.resolve(path.join(cssPath, 'css-dist'));

const pathCache = path.join(configPath, '.cache.json');
const pathUIConf = path.join(configPath, 'ui.json');
const pathModules = path.join(configPath, 'modules.json');

const pathIndexHtmlFile = path.resolve(path.join('..', 'index.html'));
const pathAppHtmlFile = path.resolve(path.join('..', 'app.html'));
const pathIndexMustacheHtmlFile = path.resolve(path.join('..', 'index.mustache.html'));
const pathImg = path.resolve(path.join('..', 'img'));

// #region svg

/**
 *
 * @param {string} root
 * @desc Walk through a given directory and provide an AsyncIterator.
 * Each item is the path of a svg file
 */
async function* walkSvgImages(root = '') {
  const dirents = await fs.promises.readdir(root, { withFileTypes: true });
  const files = [];
  const directories = [];

  for (const dirent of dirents) {
    if (dirent.isSymbolicLink()) {
      continue;
    }

    const filename = `${root}/${dirent.name}`;

    if (dirent.isDirectory()) {
      directories.push(filename);
    } else if (dirent.isFile()
      && path.extname(filename) === '.svg') {
      files.push(filename);
    }
  }

  yield* files;

  for (const directory of directories) {
    yield* walkSvgImages(directory);
  }
}

/**
 *
 * @param {string[]} colors
 * @returns {Promise<void>}
 * @desc Replace colors in all svg files
 */
async function buildSvg(colors = []) {
  console.time('Build svg');
  const cache = JSON.parse(await fs.promises.readFile(pathCache, 'utf8'));
  const { currentSvgColor } = cache;

  const color = colors.find((c) => c.name === '@svgColor');
  if (!color) {
    throw new Error('Color @svgColor doesn\'t exist, make sure this color exists in your conf.json');
  }

  const { value: newSvgColor } = color;
  const newCache = {
    ...cache,
    currentSvgColor: newSvgColor,
  };

  const awaitingUpdateSvgs = [];
  for await (const svgImage of walkSvgImages(pathImg)) {
    const awaiting = callReplaceWorker(svgImage, currentSvgColor, newSvgColor);
    awaitingUpdateSvgs.push(awaiting);
  }
  await Promise.all(awaitingUpdateSvgs);

  await fs.promises.writeFile(pathCache, JSON.stringify(newCache, null, '\n\t'));
  console.timeEnd('Build svg');
}
// #endregion svg

// #region css
/**
 * @param {string[]} colors
 * @returns {Promise<void>}
 * @desc Transpile less files to css and if prod flag specified create .min.css
 */
async function buildCss(colors = []) {
  console.time('Build css');
  try {
    await fs.promises.access(cssDistPath, fs.constants.F_OK);
  } catch (e) {
    await fs.promises.mkdir(cssDistPath);
  }

  const colorsParams = colors.reduce((acc, { name, value }) => `${acc} --modify-var="${name.substring(1)}=${value}"`, '');
  const files = await fs.promises.readdir(cssPath);
  const promisesCompileAndMinify = [];
  for (const file of files) {
    if (file.includes('.less')) {
      const racine = file.split('.less')[0];
      const cmd = `lessc ${cssPath}/${file} --global-var="global='globale.less'" ${colorsParams} > '${cssDistPath}/${racine}.css'`;
      promisesCompileAndMinify.push(
        exec(cmd)
          .catch(console.error),
      );
    }
  }
  await Promise.all(promisesCompileAndMinify);
  console.timeEnd('Build css');
}
// #endregion css

// #region userInterface
async function userInterface() {
  console.time('Apply userInterface conf');
  await Promise.all([
    applyConfToMustacheFile(pathIndexMustacheHtmlFile, pathAppHtmlFile, false),
    applyConfToMustacheFile(pathIndexMustacheHtmlFile, pathIndexHtmlFile, true),
  ]);
  console.timeEnd('Apply userInterface conf');
}

/**
 * @param {string} pathMustacheFile
 * @param {string} pathHtmlFile
 * @param {boolean} isIndexPage
 */
async function applyConfToMustacheFile(pathMustacheFile, pathHtmlFile, isIndexPage) {
  const awaitingUIConf = fs.promises.readFile(pathUIConf, 'utf8').then((jsonFile) => JSON.parse(jsonFile));
  const awaitingModulesConf = fs.promises.readFile(pathModules, 'utf8').then((jsonFile) => {
    const json = JSON.parse(jsonFile);
    const mapper = (item) => ({
      ...item,
      defer: item.defer ? 'defer' : '',
    });

    return {
      ...json,
      scripts: json.scripts.filter(
        (script) => (script.indexPageOnly ? isIndexPage : true),
      ).map(mapper),
    };
  });
  const awaitingMustacheFile = fs.promises.readFile(pathMustacheFile, 'utf8');

  const [
    uiConf,
    modulesConf,
    mustacheFile,
  ] = await Promise.all([awaitingUIConf, awaitingModulesConf, awaitingMustacheFile]);

  const view = {
    modules: modulesConf.modules,
    scripts: modulesConf.scripts,
    projectName: uiConf.name,
    urlcannotopensession: uiConf.urlcannotopensession,
    isIndexPage,
  };

  await fs.promises.writeFile(pathHtmlFile, Mustache.render(mustacheFile, view));
}

// #endregion userInterface

// #region run
async function run() {
  console.time('Total duration');

  try {
    await fs.promises.access(pathUIConf, fs.constants.F_OK);
  } catch (e) {
    console.error(`Please provide a configuration file [${pathUIConf}]`);
    process.exit(1);
  }

  const { colors } = JSON.parse(await fs.promises.readFile(pathUIConf, 'utf8'));

  const promises = [];

  if (program.svg) {
    promises.push(buildSvg(colors));
  }

  if (program.css) {
    promises.push(buildCss(colors));
  }

  if (program.userInterface) {
    await userInterface(); // Prevent of access index.html at the same time
  }

  if (program.prod) {
    console.time('Build app.js file');
    const awaitingMakeLibrary = makeLibFiles()
      .catch((err) => {
        console.error(`Failure converting modules: ${err}`);
      })
      .finally(() => {
        console.timeEnd('Build app.js file');
        return clean();
      });

    promises.push(awaitingMakeLibrary);
  }

  await Promise.all(promises);
  console.timeEnd('Total duration');
}

run()
  .catch(console.error);
// #endregion run
