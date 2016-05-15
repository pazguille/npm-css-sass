/**
 * Module dependencies
 */
var fs = require('fs');
var path = require('path');
var resolve = require('resolve');
var sass = require('node-sass');

function flatten(file, modules, out) {
  var src = fs.readFileSync(file, 'utf8');
  var base = path.dirname(file);

  src.split(/\n/).forEach(function (line) {
    var self = this;

    if (line.trim().indexOf('@import') === 0) {
      var name = line.replace('@import', '').replace(/["';]/g, '').trim();
      var url = name.indexOf('url(');

      if (url !== -1) {
        out.push(line);
        return;
      }

      if (name[0] !== '.') {
        var pkg_name = name.split('/', 1)[0];

        // lookup the entry css file
        var filepath = resolve.sync(name, {
          basedir: base,
          extensions: ['.css', '.scss'],
          packageFilter: function (pkg) {
            pkg_name = pkg.name;
            return pkg;
          }
        });

        if (modules.indexOf(name) !== -1) {
          return;
        }

        modules.push(name);

        return flatten(filepath, modules, out);

      } else {
        var filepath = path.join(base, name);

        if (modules.indexOf(name) !== -1) {
          return;
        }

        modules.push(name);

        if (fs.statSync(filepath).isFile()) {
          return flatten(filepath, modules, out);
        }
      }

    } else {
      out.push(line);
    }
  });
}

module.exports = function(file, outFile) {
  var start = process.hrtime();
  var out = [];
  flatten(file, [], out);
  sass.render({
    data: out.join('')
  }, function (err, result) {
    if (err) {
      console.log('Error status: ' + err.status);
      console.log('Error line: ' + err.line);
      console.log('Error message: ' + err.message);
      return err.status;
    }
    var file = fs.createWriteStream(outFile);
    file.write(result.css);
    file.end();
    start = process.hrtime(start);
    console.log('Done - %d ms', (start[1]/1000000).toFixed(2));
    return 0;
  });
};
