var spawn = require('child_process').spawn;
var async = require('async');
var path = require('path');
var fs = require('fs');
var url = require('url');
var fmt = require('util').format;

var neo4jRoot = 'neo4j';
var cd = {cwd: __dirname};

function addCbOnExit(process, cb) {
  function streamEater(stream) {
    var output = "";
    stream.on('data', function(chunk) { output += chunk; });
    return function() { return output; };
  };
  var out = streamEater(process.stdout);
  var err = streamEater(process.stderr);
  process.on('exit', function(ec) {
    if (ec) {
      var error = new Error(ec);
      error.stdout = out();
      error.stderr = err();
      return cb(error);
    }
    cb();
  });
};

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
  var targetFolderWithPfm = targetFolder + '-unix';
  var absoluteTarget = path.join(__dirname, neo4jRoot, targetFolder);
  var tarfilename = fmt('%s.tar.gz', targetFolderWithPfm);
  var tarfile = path.join(neo4jRoot, tarfilename);

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
        var rm = spawn('rm', ['-rf', absoluteTarget], cd);
        addCbOnExit(rm, cb);
      })
    },

    // Download folder
    function download(cb) {
      fs.exists(path.join(__dirname, tarfile), function(exists) { 
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
        addCbOnExit(curl, cb);
      });
    },

    function extract(cb) {
      var tar = spawn('tar', ['-xvf', tarfile, '-C', neo4jRoot], cd);
      addCbOnExit(tar, cb);
    }
  ], function(err) {
    if (!err || err == 'already installed') cb(null, absoluteTarget);
    else cb(err);
  });
};
