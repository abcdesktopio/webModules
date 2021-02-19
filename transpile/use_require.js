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
import helpers from './use_require_helpers.js';

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

const srcHtmlPath = path.resolve(dirname, '..', 'index.html');
const outHtmlPath = path.resolve(paths.outDirBase, 'index.html');

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

async function transformHtml(legacyScripts, onlyLegacy) {
  // write out the modified vnc.html file that works with the bundle
  const contents = await fs.promises.readFile(srcHtmlPath, 'utf-8');
  const startMarker = '<!-- begin scripts -->\n';
  const endMarker = '<!-- end scripts -->';
  const startInd = contents.indexOf(startMarker) + startMarker.length;
  const endInd = contents.indexOf(endMarker, startInd);

  let newScript = '';
  newScript += '    <script src="js/runtime.js"></script>\n';

  if (onlyLegacy) {
    // Only legacy version, so include things directly
    for (const legacyScript of legacyScripts) {
      newScript += `    <script src="${legacyScript}"></script>\n`;
    }
  } else {
    // Otherwise include both modules and legacy fallbacks
    newScript += '    <script type="module" crossorigin="anonymous" src="legacy/app.js"></script>\n';
    for (const legacyScript of legacyScripts) {
      newScript += `    <script nomodule src="${legacyScript}"></script>\n`;
    }
  }

  const newContents = `${contents.slice(0, startInd)}${newScript}\n${contents.slice(endInd)}`;
  console.log(`Writing ${outHtmlPath}`);
  return fs.promises.writeFile(outHtmlPath, newContents);
}

export async function makeLibFiles(importFormat, sourceMaps, withAppDir, onlyLegacy) {
  if (!importFormat) {
    throw new Error('you must specify an import format to generate compiled noVNC libraries');
  } else if (!SUPPORTED_FORMATS.has(importFormat)) {
    throw new Error(`unsupported output format "${importFormat}" for import/export -- only ${Array.from(SUPPORTED_FORMATS)} are supported`);
  }

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
          modules: importFormat,
        },
      ],
    ],
    ast: false,
    sourceMaps,
  });

  // No point in duplicate files without the app, so force only converted files
  if (!withAppDir) {
    onlyLegacy = true;
  }

  let inPath;
  let outPathBase;
  if (withAppDir) {
    outPathBase = paths.outDirBase;
    inPath = paths.main;
  } else {
    outPathBase = paths.libDirBase;
  }
  const legacyPathBase = onlyLegacy ? outPathBase : path.join(outPathBase, 'legacy');

  fse.ensureDirSync(outPathBase);

  const helper = helpers[importFormat];

  const outFiles = [];
  const legacyFiles = [];

  const handleDir = (jsOnly, vendorRewrite, inPathBase, filename) => Promise.resolve()
    .then(() => {
      const outPath = path.join(outPathBase, path.relative(inPathBase, filename));
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
          if (onlyLegacy) {
            return;
          }
          return ensureDir(path.dirname(outPath))
            .then(() => {
              console.log(`Writing ${outPath}`);
              return copy(filename, outPath);
            });
        })
        .then(() => ensureDir(path.dirname(legacyPath)))
        .then(() => {
          const opts = babelOpts();
          if (helper && helpers.optionsOverride) {
            helper.optionsOverride(opts);
          }
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
              const { map } = res;
              let { code } = res;
              if (sourceMaps === true) {
                // append URL for external source map
                code += `\n//# sourceMappingURL=${path.basename(legacyPath)}.map\n`;
              }
              outFiles.push(`${legacyPath}`);
              return fs.promises.writeFile(legacyPath, code)
                .then(() => {
                  if (sourceMaps === true || sourceMaps === 'both') {
                    console.log(`  and ${legacyPath}.map`);
                    outFiles.push(`${legacyPath}.map`);
                    return fs.promises.writeFile(`${legacyPath}.map`, JSON.stringify(map));
                  }
                });
            });
        });
    });

  for await (const filename of walkDir(paths.js)) {
    handleDir(true, false, inPath || paths.js, filename);
  }

  if (withAppDir) {
    if (!helper || !helper.appWriter) {
      throw new Error(`Unable to generate app for the ${importFormat} format!`);
    }

    const outAppPath = path.join(legacyPathBase, 'app.js');
    console.log(`Writing ${outAppPath}`);
    const extraScripts = await helper.appWriter(outPathBase, legacyPathBase, outAppPath);
    let legacyScripts = [];

    legacyFiles.forEach((file) => {
      const relFilePath = path.relative(outPathBase, file);
      legacyScripts.push(relFilePath);
    });

    legacyScripts = legacyScripts.concat(extraScripts);

    const relAppPath = path.relative(outPathBase, outAppPath);
    legacyScripts.push(relAppPath);

    await transformHtml(legacyScripts, onlyLegacy);
    if (helper.removeModules) {
      console.log('Cleaning up temporary files...');
      await Promise.allSettled(
        outFiles.map((filepath) => fs.promises.unlink(filepath)
          .then(fs.promises.rmdir(path.dirname(filepath), { recursive: true }))),
      );
    }
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
