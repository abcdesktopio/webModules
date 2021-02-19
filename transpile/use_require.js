#!/usr/bin/env node
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
export const SUPPORTED_FORMATS = new Set(['amd', 'commonjs', 'systemjs', 'umd']);

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
  /*{
    srcHtmlPath: path.resolve(dirname, '..', 'app.html'),
    outHtmlPath: path.resolve('..', 'app.html'),
  },*/
];

const ensureDir = util.promisify(fse.ensureDir);
const copy = util.promisify(fse.copy);
const babelTransformFile = util.promisify(babel.transformFile);

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

  const outFiles = [];

  const handleDir = (jsOnly, vendorRewrite, inPathBase, filename) => Promise.resolve()
    .then(() => {
      const outPath = path.join(paths.outDirBase, path.relative(inPathBase, filename));
      const legacyPath = path.join(legacyPathBase, path.relative(inPathBase, filename));

      if (path.extname(filename) !== '.js') {
        if (!jsOnly) {
          console.log(`Writing ${outPath}`);
          return copy(filename, outPath);
        }
        return; // skip non-javascript files
      }

      return Promise.resolve()
        .then(() => {
          return ensureDir(path.dirname(outPath))
            .then(() => {
              console.log(`Writing ${outPath}`);
              return copy(filename, outPath);
            });
        })
        .then(() => ensureDir(path.dirname(legacyPath)))
        .then(() => {
          const opts = babelOpts();
          // Adjust for the fact that we move the core files relative
          // to the vendor directory
          if (vendorRewrite) {
            opts.plugins.push(['import-redirect',
              {
                root: legacyPathBase,
                redirect: { 'vendor/(.+)': './vendor/$1' },
              }]);
          }

          return babelTransformFile(filename, opts)
            .then((res) => {
              console.log(`Writing ${legacyPath}`);
              const { code } = res;

              outFiles.push(`${legacyPath}`);
              return fs.promises.writeFile(legacyPath, code);
            });
        });
    });

  for await (const filename of walkDir(paths.js)) {
    handleDir(true, false, paths.main, filename);
  }

  const outAppPath = path.join(paths.main, 'app.js');
  console.log(`Writing ${outAppPath}`);
  await writeAppJSFile(legacyPathBase, outAppPath);

  // Create html files in build directories
  await Promise.all(
    htmlFilesSourceAndOut.map(
      (htmlFileSourceAndOut) => transformHtml(htmlFileSourceAndOut)
    )
  );

  if (false) {
    console.log('Cleaning up temporary files...');
    await Promise.allSettled(
      outFiles.map((filepath) => fs.promises.unlink(filepath)
        .then(fs.promises.rmdir(path.dirname(filepath), { recursive: true }))),
    );
  }
}
export async function clean() {
  const removeLibDirBase = `remove lib dir base ${paths.libDirBase}`;
  const removeOutDirBase = `remove out dir base ${paths.outDirBase}`;
  console.time(removeLibDirBase);
  console.time(removeOutDirBase);

  await Promise.all([
    fse.remove(paths.libDirBase)
      .then(() => {
        console.timeEnd(removeLibDirBase);
      }),
    fse.remove(paths.outDirBase)
      .then(() => {
        console.timeEnd(removeOutDirBase);
      }),
  ]);
}
