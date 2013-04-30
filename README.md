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

```
$ musicjson --help

  Usage: musicjson [options] <file>

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    -j, --json                   Converts the file to MusicJSON
    -x, --xml                    Converts the file to MusicXML
    -i, --indent [level=2]       Indents the converted source nicely
    -o, --order [preserve=true]  If set to false, tag order is not preserved
```

## Contributing
Feel free to submit any issues regarding this library's bugs and please feel
also free to submit any feature requests!

## License
Copyright (c) 2012 Saebekassebil  
Licensed under the MIT license.

