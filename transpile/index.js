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
// import { replaceInFileAsync } from './helper.js';

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
const pathIndexSessionHtmlFile = path.resolve(path.join('..', 'index.session.mustache.html'));
const pathDemoHtmlFile = path.resolve(path.join('..', 'demo.html'));
const pathAppHtmlFile = path.resolve(path.join('..', 'app.html'));
const pathAppSessionHtmlFile = path.resolve(path.join('..', 'app.session.mustache.html'));
const pathDescriptionHtmlFile = path.resolve(path.join('..', 'description.html'));
const pathIndexMustacheHtmlFile = path.resolve(path.join('..', 'index.mustache.html'));
const pathDescriptionMustacheHtmlFile = path.resolve(path.join('..', 'description.mustache.html'));
const pathI18nDirectory = path.resolve(path.join('..', 'i18n'));
const pathImg = path.resolve(path.join('..', 'img'));

const patternNamei18nFiles = /\.mustache\.json$/i;

// #region svg

/**
 *
 * @param {string} root
 */
async function* getSvgImages(root = '') {
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
    yield* getSvgImages(directory);
  }
}


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
    // const awaiting = replaceInFileAsync(svgImage, currentSvgColor, newSvgColor);
    console.log( svgImage, currentSvgColor, newSvgColor);
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
  const awaitingUIConf = fs.promises.readFile(pathUIConf, 'utf8')
    .then((jsonFile) => JSON.parse(jsonFile));

  const awaitingModulesConf = fs.promises.readFile(pathModules, 'utf8')
    .then((jsonFile) => JSON.parse(jsonFile));

  const [uiConf, modulesConf] = await Promise.all([awaitingUIConf, awaitingModulesConf]);

  console.log( uiConf );
  // isIndexPage, isDemoPage, isLoginSessionPage)
  await Promise.all([

    // demo page is 
    applyConfToMustacheHtmlFile(uiConf, modulesConf, pathIndexMustacheHtmlFile, pathDemoHtmlFile, true, true, false),
    applyConfToMustacheHtmlFile(uiConf, modulesConf, pathIndexMustacheHtmlFile, pathIndexSessionHtmlFile, true, false, true),
    applyConfToMustacheHtmlFile(uiConf, modulesConf, pathIndexMustacheHtmlFile, pathAppHtmlFile, false, false, false),
    applyConfToMustacheHtmlFile(uiConf, modulesConf, pathIndexMustacheHtmlFile, pathAppSessionHtmlFile, false, false, true),
    applyConfToMustacheHtmlFile(uiConf, modulesConf, pathIndexMustacheHtmlFile, pathIndexHtmlFile, true, false, false),
    applyConfToMustacheHtmlFile(uiConf, modulesConf, pathDescriptionMustacheHtmlFile, pathDescriptionHtmlFile, false, false, false),
    applyConfToMustacheJsonFiles(uiConf),
  ]);
  console.timeEnd('Apply userInterface conf');
}

/**
 * @param {Object} uiConf
 * @param {Object} modulesConf
 * @param {string} pathMustacheFile
 * @param {string} pathHtmlFile
 * @param {boolean} isIndexPage
 */
async function applyConfToMustacheHtmlFile(uiConf, modulesConf, pathMustacheFile, pathHtmlFile, isIndexPage, isDemoPage, isLoginSessionPage) {
  const mapper = (item) => ({
    ...item,
    defer: item.defer ? 'defer' : '',
  });

  const scripts = modulesConf.scripts
    .filter((script) => (script.indexPageOnly ? isIndexPage : true))
    .map(mapper);

  //	
  // mapping formated like key: "{{ key }}", 
  // 
  // cuid: "{{ cuid }}",
  // loginsessionid: "{{ loginsessionid }}", 
  // permit to make another mustache file from the index.mustache.html
  //
  const mustacheFile = await fs.promises.readFile(pathMustacheFile, 'utf8');
  const view = {
    modules: modulesConf.modules,
    scripts,
    projectName: uiConf.name,
    projectNameSplitedHTML: uiConf.projectNameSplitedHTML,
    urlcannotopensession: uiConf.urlcannotopensession,
    urlusermanual: uiConf.urlusermanual,
    urlusersupport: uiConf.urlusersupport,
    urlopensourceproject: uiConf.urlopensourceproject,
    cuid: "{{ cuid }}",
    loginsessionid: "{{ loginsessionid }}",
    base_url: "{{ base_url }}",
    isIndexPage,
    isDemoPage,
    isLoginSessionPage
  };

  console.log( 'create html page ' + pathHtmlFile );
  await fs.promises.writeFile(pathHtmlFile, Mustache.render(mustacheFile, view));
}

/**
 * 
 * @param {Object} uiConf 
 */
async function applyConfToMustacheJsonFiles(uiConf) {
  const dirents = await fs.promises.readdir(pathI18nDirectory, { withFileTypes: true });
  const direntsI18nMustacheFiles = dirents.filter(
    (dirent) => dirent.isFile() && patternNamei18nFiles.test(dirent.name)
  );

  const i18MustacheFiles = await Promise.all(
    direntsI18nMustacheFiles
    .map((direntI18nMustacheFile) => {
      const pathToI18nMustacheFile = path.join(pathI18nDirectory, direntI18nMustacheFile.name);
      return fs.promises.readFile(pathToI18nMustacheFile, 'utf8');
    }),
  );

  await Promise.all(
    i18MustacheFiles
      .map((contentI18nMustacheFile, index) => {
        const i18nMustacheFile = direntsI18nMustacheFiles[index];
        const nameI18nJsonFile = i18nMustacheFile.name.replace(patternNamei18nFiles, '.json');
        const pathI18nJsonFile = path.join(pathI18nDirectory, nameI18nJsonFile);
        const view = {
          projectName: uiConf.name,
          urlcannotopensession: uiConf.urlcannotopensession,
          urlusermanual: uiConf.urlusermanual,
          urlusersupport: uiConf.urlusersupport,
        };

        return fs.promises.writeFile(pathI18nJsonFile, Mustache.render(contentI18nMustacheFile, view));
      }),
  );
}

// #endregion userInterface


// #region build js for production
async function buildJSProductionFiles() {
  console.time('Build app.js file');
  try {
    await makeLibFiles();
  } catch(error) {
    console.error(`Failure converting modules: ${error}`);
  } finally {
    console.timeEnd('Build app.js file');
    await clean();
  }
}
// #endregion build js for production


// #region run
async function run() {
  console.time('Total duration');
  console.log('Options: ', program.opts());

  try {
    await fs.promises.access(pathUIConf, fs.constants.F_OK);
  } catch (e) {
    console.error(`Please provide a configuration file [${pathUIConf}]`);
    process.exit(1);
  }

  const { colors } = JSON.parse(await fs.promises.readFile(pathUIConf, 'utf8'));

  const promises = [];

  if (program.opts().svg) {
    console.log( 'creating svg files' );
    promises.push(buildSvg(colors));
  }
  else {
    console.log( 'svg files are disabled' );
  }

  if (program.opts().css) {
    console.log( 'creating css files' );
    promises.push(buildCss(colors));
  }
  else {
    console.log( 'css files are disabled' );
  }

  if (program.opts().userInterface && program.opts().prod) { // Prevent of access index.html at the same time
    await userInterface();
    await buildJSProductionFiles();
  } else {
    if (program.opts().userInterface) {
      console.log( 'creating userInterface files' );
      promises.push(userInterface());
    }
    else if (program.opts().prod) {
      console.log( 'creating prod files' );
      promises.push(buildJSProductionFiles());
    }
  }

  await Promise.all(promises);
  console.timeEnd('Total duration');
}


run()
  .catch(console.error);
// #endregion run
