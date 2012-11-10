var spawn = require('child_process').spawn;

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
]