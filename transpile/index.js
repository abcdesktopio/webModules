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
import minify from '@node-minify/core';
import htmlMinifier from '@node-minify/html-minifier';
import Mustache from 'mustache';

const require = createRequire(import.meta.url);

const { program } = require('commander');

const exec = promisify(childProcess.exec);

program.version('2.0');

program
  .option('-s --svg', 'Replace the current tertiary color in svg files by the tertiary color in conf.json')
  .option('-c, --css', 'Transpile less code to css')
  .option('-o, --oneCss', 'Use one file css minified')
  .option('-ui, --user-interface', 'Apply user interface\'s configuration')
  .option('-mhtml, --minify-html', 'Use minify html');

program.parse(process.argv);

const cssPath = path.resolve(path.join('..', 'css'));
const cssDistPath = path.resolve(path.join(cssPath, 'css-dist'));
const pathCache = path.resolve('.cache.json');
const pathUIConf = path.resolve('ui.json');
const pathModules = path.resolve('modules.json');
const pathIndexHtmlFile = path.resolve(path.join('..', 'index.html'));
const pathAppHtmlFile = path.resolve(path.join('..', 'app.html'));
const pathAppMustacheHtmlFile = path.resolve(path.join('..', 'app.mustache.html'));
const pathIndexMustacheHtmlFile = path.resolve(path.join('..', 'index.mustache.html'));
const pathImg = path.resolve(path.join('..', 'img'));

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
 * @param {string[]} colors
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

  for await (const svgImage of getSvgImages(pathImg)) {
    try {
      const svgContent = await fs.promises.readFile(svgImage, 'utf8');
      if (svgContent.includes(currentSvgColor)) {
        const newContent = svgContent.replace(new RegExp(currentSvgColor, 'g'), newSvgColor);
        await fs.promises.writeFile(svgImage, newContent);
      }
    } catch (e) {
      console.error(e);
    }
  }

  await fs.promises.writeFile(pathCache, JSON.stringify(newCache, null, '\n\t'));
  console.timeEnd('Build svg');
}
// #endregion svg

// #region css
/**
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

// #region html
async function minifyHtml() {
  const content = await fs.promises.readFile(pathMustacheHtmlFile, 'utf8');
  const newContentHtml = await minify({ compressor: htmlMinifier, content });
  await fs.promises.writeFile(pathMustacheHtmlFile, newContentHtml);
}
// #endregion html

// #region userInterface
async function userInterface() {
  console.time('Apply userInterface conf');
  await Promise.all([
    applyConfToMustacheFile(pathAppMustacheHtmlFile, pathAppHtmlFile),
    applyConfToMustacheFile(pathIndexMustacheHtmlFile, pathIndexHtmlFile),
  ]);
  console.timeEnd('Apply userInterface conf');
}

/**
 * @param {string} pathMustacheFile
 * @param {string} pathHtmlFile
 */
async function applyConfToMustacheFile(pathMustacheFile, pathHtmlFile) {
  const awaitingUIConf = fs.promises.readFile(pathUIConf, 'utf8').then((jsonFile) => JSON.parse(jsonFile));
  const awaitingModulesConf = fs.promises.readFile(pathModules, 'utf8').then((jsonFile) => {
    const json = JSON.parse(jsonFile);
    const mapper = (item) => ({
      ...item,
      defer: item.defer ? 'defer' : '',
    });

    return {
      ...json,
      scripts: json.scripts.map(mapper),
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

  if (program.minifyHtml) {
    await minifyHtml(); // Prevent of access index.html at the same time
  }

  await Promise.all(promises);
  console.timeEnd('Total duration');
}

run()
  .catch(console.error);
// #endregion run
