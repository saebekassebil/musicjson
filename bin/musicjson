#!/usr/bin/env node
/**
 * Command line tool
 * 
 * Subito MusicJSON Converter
 * 
 * Usage:
 *  --json [filename] Converts the source from MusicXML to MusicJSON
 *  --xml  [filename] Converts the source from MusicJSON to MusicXML
 *  --help            Prints out this help text
 */

var fs        = require('fs'),
    program   = require('commander'),
    pkg       = require('../package.json'),
    MusicJSON = require('../lib/musicjson.js'),
    source, output, converted, indent;

function times(string, times) {
  var s = '', x;

  for (x = 0; x < times; x++) {
    s += string;
  }

  return s;
}

function formatXML(str, indentlvl) {
  str = str.replace(/(>)(<)(\/*)/g, '$1\n$2$3');

  var xml = '', pad = 0, i, length, indent, node,
      lines = str.split('\n'), indentlvl = indentlvl || 2;

  for (i = 0, length = lines.length; i < length; i++) {
    indent = 0;
    node = lines[i];

    if(node.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if (node.match(/^<\/\w/) && pad > 0) {
      pad = pad - 1;
    } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
      indent = 1;
    } else {
      indent = 0;
    }

    xml = xml + times(' ', pad * indentlvl) + node + '\n';
    pad = pad + indent;
  }

  return xml;
}


// Command line interface
program
  .version(pkg.version)
  .usage('<file> [options]')
  .option('-j, --json [output]', 'Converts the file to MusicJSON')
  .option('-x, --xml [output]', 'Converts the file to MusicXML')
  .option('-i, --indent [level=2]', 'Indents the converted source nicely')
  .parse(process.argv);

if (program.args.length === 0) {
  // Print out the default help information
  console.log(program.helpInformation());
  process.exit(0);
}

source = program.args[0];

if (program.json) {
  source = fs.readFileSync(source, 'utf8');

  MusicJSON.musicJSON(source, function(err, output) {
    if (err) {
      console.error('An error occured:');
      console.error(err.message);
      process.exit(1);
    }

    if (program.indent) {
      indent = parseInt(program.indent);
      indent = (isNaN(indent)) ? 2 : indent;
      converted = JSON.stringify(output, null, times(' ', indent));
    } else {
      converted = JSON.stringify(output);
    }

    if (typeof program.json === 'string') {
      fs.writeFile(program.json, converted, function(err) {
        if (err) {
          console.error('Couldn\'t write to file');
          console.error(err.message);
          process.exit(1);
        }

        console.log('Wrote succesfully to file');
      });
    } else {
      console.log(converted);
    }
  });
} else if (program.xml) {
  source = fs.readFileSync(source, 'utf8');

  try {
   source  = JSON.parse(source);
  } catch(e) {
    console.error('Invalid MusicJSON source');
    console.error(e.message);
    process.exit(1);
  }

  MusicJSON.musicXML(source, function(err, output) {
    if (err) {
      console.error('Oh noes! An error occured:');
      console.error(err.message);
      process.exit(1);
    }

    if (program.indent) {
      indent = parseInt(program.indent);
      converted = formatXML(output.innerHTML, (!isNaN(indent)) ? indent : 2);
    } else {
      converted = output.innerHTML;
    }

    if (typeof program.xml === 'string') {
      fs.writeFile(program.xml, converted, function(err) {
        if (err) {
          console.error('Couldn\'t write to file');
          console.error(err.message);
          process.exit(1);
        }

        console.log('Wrote succesfully to file');
      });
    } else {
      console.log(converted);
    }
  });
} else {
  // Print out the default help information
  console.log(program.helpInformation());
}

