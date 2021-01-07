// writes helpers require for vnc.html (they should output app.js)
const fs = require('fs');
const path = require('path');
const browserify = require('browserify');

module.exports = {
  amd: {
    appWriter: (baseOutPath, outPath) => {
      // setup for requirejs
      fs.writeFile(outPath, 'requirejs(["app/ui"], function (ui) {});', (err) => { if (err) throw err; });
      console.log(`Please place RequireJS in ${path.join(baseOutPath, 'require.js')}`);
      return `<script src="require.js" data-main="${path.relative(baseOutPath, outPath)}"></script>`;
    },
    noCopyOverride: () => {},
  },
  commonjs: {
    optionsOverride: (opts) => {
      // CommonJS supports properly shifting the default export to work as normal
      opts.plugins.unshift('add-module-exports');
    },
    appWriter: (baseOutPath, outPath) => {
      const b = browserify(path.join(baseOutPath, 'js/scripts.js'), {});
      b.bundle().pipe(fs.createWriteStream(outPath));
      return `<script src="${path.relative(baseOutPath, outPath)}"></script>`;
    },
    noCopyOverride: () => {},
  },
  systemjs: {
    appWriter: (baseOutPath, outPath) => {
      fs.writeFile(outPath, 'SystemJS.import("./app/ui.js");', (err) => { if (err) throw err; });
      console.log(`Please place SystemJS in ${path.join(baseOutPath, 'system-production.js')}`);
      return `<script src="vendor/promise.js"></script>
<script src="system-production.js"></script>\n<script src="${path.relative(baseOutPath, outPath)}"></script>`;
    },
    noCopyOverride: (paths, noCopyFiles) => {
      noCopyFiles.delete(path.join(paths.vendor, 'promise.js'));
    },
  },
  umd: {
    optionsOverride: (opts) => {
      // umd supports properly shifting the default export to work as normal
      opts.plugins.unshift('add-module-exports');
    },
  },
};
