# musicjson

MusicXML to MusicJSON bi-directional converter
Translates MusicXML to MusicJSON format and back again!

## Getting Started
Install the module with: `npm install -g musicjson`

## Examples
```javascript
var music = require('musicjson');

music.musicJSON(xml, function(err, json) {
  // Do something with the MusicJSON data
});

music.musicXML(json, function(err, xml) {
  // Do something with the MusicXML data
});
```

## Command line tool
The `musicjson` tool can read files from filepaths, but defaults to `stdin`.
This makes it possible to compose commandline-chains with `musicjson` conversion
in the middle

```
$ musicjson --help

  Usage: musicjson [options] <file>
  If no <file> is given, default to stdin

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    -j, --json                   convert file to MusicJSON
    -x, --xml                    convert file to MusicXML
    -i, --indent [level=2]       indent the output nicely
    -o, --order [preserve=true]  should we preserve tag order?

$ cat autumn_in_new_york.xml | musicjson -j -i > autumn.json
$ musicjson -o false -j jade.xml > jade.json
$ musicjson -x jade.json > jade-unordered.xml
```

## Contributing
Feel free to submit any issues regarding this library's bugs and please feel
also free to submit any feature requests!

## License
Copyright (c) 2012 Saebekassebil  
Licensed under the MIT license.

