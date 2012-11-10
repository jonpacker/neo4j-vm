var spawn = require('child_process').spawn;
var async = require('async');

var steps = [
  { 
    name: 'clone neo4j',
    fn: function(cb) {
      var git = spawn('git', ['submodule', 'update', '--init']);
      git.stdout.pipe(process.stdout);
      git.stderr.pipe(process.stderr);
      git.on('exit', cb);
    }
  }
];

function doStep(step, cb) {
  console.log("Performing step:", step.name);
  return step.fn(cb);
};

async.map(steps, doStep, function(err) {
  if (err) {
    console.log("Installation failed with error code", err);
  } else {
    console.log("Installed OK.");
  }
})