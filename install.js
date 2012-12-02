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

var pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')));
var neo4jRoot = 'neo4j';
var neo4jDir = path.join(
  __dirname,
  neo4jRoot,
  pkg.neo4j.version,
  pkg.neo4j.edition
);

var steps = [
  {
    name: 'clean neo4j',
    fn: function(cb) {
      var rmExisting = function(cb) {
        fs.exists(neo4jDir, function(exists) {
          if (!exists) return cb();
          spawn('rm', ['-rf', neo4jDir]).on('exit', function() { cb(); });
        })
      };

      var mkdir = function(cb) {
        spawn('mkdir', ['-p', neo4jDir]).on('exit', function() { cb(); });
      }

      async.series([ rmExisting, mkdir ], cb);
    }
  },
  { 
    name: 'download/untar neo4j',
    fn: function(cb) {
      var query = pkg.neo4j;
      query.distribution = 'tarball';

      var neourl = url.format({
        protocol: 'http',
        host: 'download.neo4j.org',
        pathname: '/artifact',
        query: query
      });

      console.log(neourl)
      var curl = spawn('curl', [neourl, '-o', path.join(neo4jDir, 'neo4j.tar')]);
      curl.stdout.pipe(process.stdout);
      curl.on('exit', function(ec) { if (ec) return cb(ec); cb(); });
    }
  },
  {
    name: 'Untar neo4j',
    fn: function(cb) {
      var tar = spawn('tar', ['-xvf', path.join(neo4jDir, 'neo4j.tar')], {
        cwd: neo4jDir
      });
      tar.stdout.pipe(process.stdout);
      tar.on('exit', function(ec) { if (ec) return cb(ec); cb(); });
    }
  }
];

function doStep(step, cb) {
  console.log("Performing step:", step.name);
  return step.fn(cb);
};

async.mapSeries(steps, doStep, function(err) {
  if (err) {
    console.log("Installation failed with error code", err);
  } else {
    console.log("Installed OK.");
  }
})
