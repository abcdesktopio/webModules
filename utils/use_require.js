#!/usr/bin/env node

const path = require('path');
const program = require('commander');
const fs = require('fs');
const fse = require('fs-extra');
const babel = require('babel-core');
const helpers = require('./use_require_helpers');

const SUPPORTED_FORMATS = new Set(['amd', 'commonjs', 'systemjs', 'umd']);

program
  .option('--as [format]', `output files using various import formats instead of ES6 import and export.  Supports ${Array.from(SUPPORTED_FORMATS)}.`)
  .option('-m, --with-source-maps [type]', 'output source maps when not generating a bundled app (type may be empty for external source maps, inline for inline source maps, or both) ')
  .option('--with-app', 'process app files as well as core files')
  .option('--clean', 'clear the lib folder before building')
  .parse(process.argv);

// the various important paths
const paths = {
  main: path.resolve(__dirname, '..'),
  core: path.resolve(__dirname, '..', 'core'),
  app: path.resolve(__dirname, '..', 'app'),
  js: path.resolve(__dirname, '..', 'js'),
  vendor: path.resolve(__dirname, '..', 'vendor'),
  outDirBase: path.resolve(__dirname, '..', 'build'),
  lib_dir_base: path.resolve(__dirname, '..', 'lib'),
};

const noCopyFiles = new Set([
  // skip these -- they don't belong in the processed application
  path.join(paths.vendor, 'sinon.min.js'),
  path.join(paths.vendor, 'browser-es-module-loader'),
  path.join(paths.vendor, 'promise.min.js'),
]);

const noTransformFiles = new Set([
  // don't transform this -- we want it imported as-is to properly catch loading errors
  path.join(paths.app, 'error-handler.js'),
]);

noCopyFiles.forEach((file) => noTransformFiles.add(file));

// walkDir *recursively* walks directories trees,
// calling the callback for all normal files found.
const walkDir = function (basePath, cb, filter) {
  fs.readdir(basePath, (err, files) => {
    if (err) throw err;

    files.map((filename) => path.join(basePath, filename)).forEach((filepath) => {
      fs.lstat(filepath, (err, stats) => {
        if (err) throw err;

        if (filter !== undefined && !filter(filepath, stats)) return;

        if (stats.isSymbolicLink()) return;
        if (stats.isFile()) cb(filepath);
        if (stats.isDirectory()) walkDir(filepath, cb, filter);
      });
    });
  });
};

const transformHtml = function (newScript, htmlfilename) {
  // write out the modified vnc.html file that works with the bundle
  const srcHtmlPath = path.resolve(__dirname, '..', htmlfilename);
  const outHtmlPath = path.resolve(paths.outDirBase, htmlfilename);
  fs.readFile(srcHtmlPath, (err, contentsRaw) => {
    if (err) { throw err; }

    console.log(`Modifying scripts markup in ${outHtmlPath}`);
    let contents = contentsRaw.toString();

    const startMarker = '<!-- begin scripts -->';
    const endMarker = '<!-- end scripts -->';

    let startInd = contents.indexOf(startMarker);
    if (startInd < 0) {
      console.log('WARNING: Start marker not found');
      return;
    }
    let endInd = contents.indexOf(endMarker, startInd);
    if (endInd < 0) {
      console.log('ERROR: End marker not found');
      return;
    }

    startInd += startMarker.length;
    endInd += endMarker.length;

    console.log(`Removing from ${startInd} to ${endInd}`);
    contents = `${contents.slice(0, startInd)}${newScript}\n${contents.slice(endInd)}`;

    console.log(`Saving ${outHtmlPath}`);
    fs.writeFile(outHtmlPath, contents, (err) => {
      if (err) { throw err; }
    });
  });
};

const makeLibFiles = function (importFormat, sourceMaps, withAppDir) {
  if (!importFormat) {
    throw new Error('you must specify an import format to generate compiled noVNC libraries');
  } else if (!SUPPORTED_FORMATS.has(importFormat)) {
    throw new Error(`unsupported output format "${importFormat}" for import/export -- only ${Array.from(SUPPORTED_FORMATS)} are supported`);
  }

  // NB: we need to make a copy of babelOpts, since babel sets some defaults on it
  const babelOpts = () => ({
    plugins: [`transform-es2015-modules-${importFormat}`, 'transform-es2015-classes'],
    ast: false,
    sourceMaps,
  });

  let inPath;
  let outPatBase;
  if (withAppDir) {
    outPatBase = paths.outDirBase;
    inPath = paths.main;
  } else {
    outPatBase = paths.lib_dir_base;
  }

  fse.ensureDirSync(outPatBase);

  const helper = helpers[importFormat];

  const handleDir = (jsOnly, vendorRewrite, inPathBase, filename) => {
    if (noCopyFiles.has(filename)) return;

    const outPath = path.join(outPatBase, path.relative(inPathBase, filename));
    if (path.extname(filename) !== '.js') {
      if (!jsOnly) {
        console.log(`Copying ${outPath}`);
        fse.copy(filename, outPath, (err) => { if (err) throw err; });
      }
      return; // skip non-javascript files
    }

    fse.ensureDir(path.dirname(outPath), () => {
      if (noTransformFiles.has(filename)) {
        console.log(`Copying ${outPath}`);
        fse.copy(filename, outPath, (err) => { if (err) throw err; });
        return;
      }

      const opts = babelOpts();
      if (helper && helpers.optionsOverride) {
        helper.optionsOverride(opts);
      }
      // Adjust for the fact that we move the core files relative
      // to the vendor directory
      if (vendorRewrite) {
        opts.plugins.push(['import-redirect', {
          root: outPatBase,
          redirect: { 'vendor/(.+)': './vendor/$1' },
        }]);
      }

      console.log(`Transpiling ${outPath}`);
      babel.transformFile(filename, opts, (err, res) => {
        if (err) throw err;
        let { code } = res;
        const { map } = res;
        if (sourceMaps === true) {
          // append URL for external source map
          code += `\n//# sourceMappingURL=${path.basename(outPath)}.map\n`;
        }
        console.log(`Saving ${outPath}`);
        fs.writeFile(outPath, code, (err) => { if (err) throw err; });
        if (sourceMaps === true || sourceMaps === 'both') {
          console.log(`  and ${outPath}.map`);
          fs.writeFile(`${outPath}.map`, JSON.stringify(map), (err) => { if (err) throw err; });
        }
      });
    });
  };

  if (withAppDir && helper && helper.noCopyOverride) {
    helper.noCopyOverride(paths, noCopyFiles);
  }

  walkDir(
    paths.vendor,
    handleDir.bind(null, true, false, inPath || paths.main),
    (filename) => !noCopyFiles.has(filename),
  );
  walkDir(
    paths.core,
    handleDir.bind(null, true, !inPath, inPath || paths.core),
    (filename) => !noCopyFiles.has(filename),
  );
  walkDir(
    paths.js,
    handleDir.bind(null, true, false, inPath || paths.main),
    (filename) => !noCopyFiles.has(filename),
  );

  if (withAppDir) {
    const outAppPath = path.join(outPatBase, 'app.js');
    if (helper && helper.appWriter) {
      console.log(`Writing ${outAppPath}`);
      const outScript = helper.appWriter(outPatBase, outAppPath);
      transformHtml(outScript, 'index.html');
      transformHtml(outScript, 'app.html');
    } else {
      console.error(`Unable to generate app for the ${importFormat} format!`);
    }
  }
};

if (program.clean) {
  console.log(`Removing ${paths.lib_dir_base}`);
  fse.removeSync(paths.lib_dir_base);

  console.log(`Removing ${paths.outDirBase}`);
  fse.removeSync(paths.outDirBase);
}

makeLibFiles(program.as, program.withSourceMaps, program.withApp);
