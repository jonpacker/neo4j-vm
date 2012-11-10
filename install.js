var spawn = require('child_process').spawn;
var async = require('async');
var path = require('path');

var neo4jDir = 'neo4j';

var steps = [{ 
    name: 'clone neo4j',
    fn: function(cb) {
      var git = spawn('git', [
        'clone', 'git://github.com/neo4j/community.git', neo4jDir
      ], {
        cwd: __dirname
      });
      git.stdout.pipe(process.stdout);
      git.stderr.pipe(process.stderr);
      git.on('exit', cb);
    }
  }, {
    name: 'build neo4j',
    fn: function(cb) {
      var mvn = spawn('mvn', [
        'clean', 'install', '-Dmaven.test.skip=true'
      ], {
        cwd: path.join(__dirname, neo4jDir),
        env: { 'JAVA_OPTS': '-Xms384M -Xmx512M -XX:MaxPermSize=256M' }
      });
      mvn.stdout.pipe(process.stdout);
      mvn.stderr.pipe(process.stderr);
      mvn.on('exit', cb);
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