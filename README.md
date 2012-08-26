# musicjson

MusicXML to MusicJSON bi-directional converter
Translates MusicXML to MusicJSON format and back again!

## Getting Started
Install the module with: `npm install musicjson`

## Examples
```javascript
var converter = require('musicjson');

converter.musicJSON(musicXMLSource, function(err, data) {
  // Do something with the MusicJSON data
});

converter.musicXML(musicJSONSource, function(err, data) {
  // Do something with the MusicXML data
});
```

## Command line tool

```
$ musicjson --help

  Usage: musicjson.js <file> [options]

  Options:

  -h, --help              output usage information
  -V, --version           output the version number
  -j, --json [output]     Converts the file to MusicJSON
  -x, --xml [output]      Converts the file to MusicXML
  -i, --indent [level=2]  Indents the converted source nicely

```

## Contributing
Feel free to submit any issues regarding this library's bugs and please feel
also free to submit any feature requests!

## License
Copyright (c) 2012 Saebekassebil  
Licensed under the MIT license.

