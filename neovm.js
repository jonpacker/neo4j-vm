var spawn = require('child_process').spawn;
var async = require('async');
var path = require('path');
var fs = require('fs');
var url = require('url');
var fmt = require('util').format;

var neo4jRoot = 'neo4j';
var cd = {cwd: __dirname};

// Downloads and extracts the given version of neo4j. Callback = (err, path),
// where path is the absolute pathname for version of neo4j that was downloaded.
// If the optional argument `noclean` is truthy, no cleaning will be performed,
// so if an installation is found it will be returned immediately.
module.exports = function installNeoVersion(version, edition, noclean, cb) {
  if (typeof noclean == 'function') {
    cb = noclean;
    noclean = true;
  }

  var targetFolder = fmt('neo4j-%s-%s', edition, version);
  var absoluteTarget = path.join(__dirname, neo4jRoot, targetFolder);
  var tarfile = path.join(neo4jRoot, fmt('%s.tar', targetFolder));

  async.series([
    // Make sure the folder for neo installations exists
    function setup(cb) {
      fs.exists(path.join(__dirname, neo4jRoot), function(exists) {
        if (exists) return cb();
        fs.mkdir(path.join(__dirname, neo4jRoot), cb);
      });
    },

    // Remove existing folder
    function clean(cb) {
      fs.exists(absoluteTarget, function(exists) {
        if (!exists) return cb();
        else if (exists && noclean) return cb('already installed');
        spawn('rm', ['-rf', absoluteTarget], cd).on('exit', function() {
          cb();
        });
      })
    },

    // Download folder
    function download(cb) {
      fs.exists(tarfile, function(exists) { 
        if (exists) return cb();

        var query = { version: version, edition: edition };
        query.distribution = 'tarball';

        var neourl = url.format({
          protocol: 'http',
          host: 'download.neo4j.org',
          pathname: '/artifact',
          query: query
        });

        var curl = spawn('curl', [neourl, '-o', tarfile], cd);
        curl.on('exit', function(ec) { if (ec) return cb(ec); cb(); });
      });
    },

    function extract(cb) {
      var tar = spawn('tar', ['-xvf', tarfile, '-C', neo4jRoot], cd);
      tar.stdout.pipe(process.stdout);
      tar.on('exit', function(ec) { if (ec) return cb(ec); cb(); });
    }
  ], function(err) {
    if (!err || err == 'already installed') cb(null, absoluteTarget);
    else cb(err);
  });
};
