# neo4j-vm

is a neo4j version manager for nodejs. it will download and extract whichever
version of neo4j you ask for.

## install

```
npm install neo4j-vm
```

## example 

```javascript
var nvm = require('neo4j-vm');
nvm('1.9.M01', 'community', function(err, neodir) {
  //assuming nothing went wrong, neodir is now an absolute path to the neo4j
  //directory of the version you requested.
});
```

## usage

`function neo4jvm(version, edition, noclean, callback)`

* *version* - the version of neo4j - for example '1.9.M01'
* *edition* - the edition of neo4j - for example 'community'
* *noclean* (optional, default=true) - in the event that this version has
  already be downloaded, if this is set to true, callback is immediately called
  with the path of that install
* *callback* - function(err, absolutePathToNeo4jInstall)

## note about speed

Neo4j is about 50mb. The first time you download a version, it takes a little
while (dependant on your connection and location, of course).

## note about portability

neo4jvm uses curl and some native binaries like rm to function. Consequently, it
will not work on windows.
