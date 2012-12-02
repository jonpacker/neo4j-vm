var spawn = require('child_process').spawn;
var async = require('async');
var path = require('path');
var http = require('http');
var qs = require('querystring');
var fs = require('fs');
var Untar = require('tar-async/untar');
var curry = require('naan').curry;
var streamcatcher = require('collect').collection;
var url = require('url');
var fmt = require('util').format;

var pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')));
var neo4jRoot = 'neo4j';
var targetFolder = fmt('neo4j-%s-%s', pkg.neo4j.edition, pkg.neo4j.version);
var tarfile = path.join(neo4jRoot, fmt('%s.tar', targetFolder));

var steps = [
  {
    name: 'Clean neo4j',
    fn: function(cb) {
      fs.exists(targetFolder, function(exists) {
        if (!exists) return cb();
        spawn('rm', ['-rf', targetFolder]).on('exit', function() { cb(); });
      })
    }
  },
  { 
    name: 'Download neo4j',
    fn: function(cb) {
      var query = pkg.neo4j;
      query.distribution = 'tarball';

      var neourl = url.format({
        protocol: 'http',
        host: 'download.neo4j.org',
        pathname: '/artifact',
        query: query
      });

      var curl = spawn('curl', [neourl, '-o', tarfile], {
        cwd: __dirname
      });
      curl.on('exit', function(ec) { if (ec) return cb(ec); cb(); });
    }
  },
  {
    name: 'Untar neo4j',
    fn: function(cb) {
      var tar = spawn('tar', ['-xvf', tarfile, '-C', neo4jRoot], {
        cwd: __dirname
      });
      tar.stdout.pipe(process.stdout);
      tar.on('exit', function(ec) { if (ec) return cb(ec); cb(); });
    }
  }
];

async.mapSeries(steps, doStep, function(err) {
  if (err) {
    console.log("Installation failed with error code", err);
  } else {
    console.log("Installed OK.");
  }
})
