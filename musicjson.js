var jsdom = require('jsdom'),
    fs    = require('fs'),
    path  = require('path');

function format_xml(str) {
  function spaces(len) {
    var s = '';
    var lIndent = len * 2;
    for (var x = 0; x < lIndent; x++) {
      s += ' ';
    }

    return s;
  }
  
  str = str.replace(/(>)(<)(\/*)/g, '$1\n$2$3');
  var xml = '', pad = 0, i, indent, node, strArr = str.split('\n');

  for(i = 0; i < strArr.length; i++) {
    indent = 0;
    node = strArr[i];

    if(node.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if(node.match(/^<\/\w/) && pad > 0) {
        pad -= 1;
    } else if(node.match(/^<\w[^>]*[^\/]>.*$/)) {
      indent = 1;
    } else {
      indent = 0;
    }

    xml += spaces(pad) + node + '\n';
    pad += indent;
  }

  return xml;
}

var MusicJSON = {
    toMusicJSON: function(musicXML, permanent) {
      if(!musicXML) return false;

      var musicJSON = {};

      var root = musicXML.getElementsByTagName('score-partwise').item(0);
      if(!root) throw new Exception('Invalid document, need "score-partwise" root tag');

      function parseElement(element) {
        var obj = {}, i, length, attribute, child, childNodeName, backup;
        if(element.attributes) {
          for(i = 0, length = element.attributes.length; i < length; i++) {
            attribute = element.attributes.item(i);
            obj[((!permanent) ? '$' : '') + attribute.name] = attribute.value;
          }
        }

        for(i = 0, length = element.childNodes.length; i < length; i++) {
          if(element.childNodes[i].nodeType == element.ELEMENT_NODE) {
            child = parseElement(element.childNodes[i]);
            childNodeName = element.childNodes[i].nodeName.toLowerCase();
            if(obj[childNodeName] && (Object.prototype.toString.call(obj[childNodeName]) !== '[object Array]')) {
              backup = obj[childNodeName];
              obj[childNodeName] = [backup, child];
            } else if(obj[childNodeName]) {
              obj[childNodeName].push(child);
            } else {
              obj[childNodeName] = child;
            }
          } else if(element.childNodes[i].nodeType == element.TEXT_NODE) {
            if(element.childNodes[i].textContent && element.childNodes[i].textContent.trim() !== '' && element.attributes.length < 1) {
              obj = element.childNodes[i].textContent;
            } else if(element.childNodes[i].textContent && element.childNodes[i].textContent.trim() !== '') {
              obj['content'] = element.childNodes[i].textContent;
            }
          }
        }

        return obj;
      }

      musicJSON['score-partwise'] = parseElement(root);

      this.json = musicJSON;
      return this.json;
    },

    toMusicXML: function(json, callback) {
      function toXML(document, element, nodeName) {
        var xmlElement = document.createElement(nodeName), x, length;

        if(typeof element === 'number' || typeof element === 'string') {
          xmlElement.appendChild(document.createTextNode(element));
          return xmlElement;
        }

        for(var i in element) {
          if(typeof i !== 'string' || i.length < 1) {
            continue;
          }
          if(i.charAt(0) === '$') { // Attribute
            xmlElement.setAttribute(i.substr(1), element[i]);
          } else { // Element
            if(element[i].constructor === Array) {
              for(x = 0, length = element[i].length; x < length; x++) {
                xmlElement.appendChild(toXML(document, element[i][x], i));
              }
            } else {
              xmlElement.appendChild(toXML(document, element[i], i));
            }

          }
        }
        return xmlElement;
      }
      
      jsdom.env("<?xml version='1.0' encoding='UTF-8' standalone='no'?>\n"+
     "<!DOCTYPE score-partwise PUBLIC"+
    "\"-//Recordare//DTD MusicXML 3.0 Partwise//EN\""+
    "\"http://www.musicxml.org/dtds/partwise.dtd\">", [], function(error, window) {
        if(error) {
          console.error("Error: ", error);
        } else {
          var musicXML = window.document.implementation.createDocument("", "", window.document.implementation.createDocumentType('score-partwise', '-//Recordare//DTD MusicXML 2.0 Partwise//EN', 'http://www.musicxml.org/dtds/partwise.dtd'));
          musicXML.appendChild(toXML(musicXML, json['score-partwise'], 'score-partwise'));
          typeof callback == 'function' && callback(musicXML);
        }
      });
    }
};

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

var Commands = {
    '--json': function(source) {
      jsdom.env(source, [], function(error, window) {
        if(error) {
          console.error("Error: ", error);
          process.exit(1);
        } else {
          console.log(JSON.stringify(MusicJSON.toMusicJSON(window.document, false), null, 2));
          process.exit(0);
        }
      });
    },

    '--xml': function(source) {
      try {
        source = JSON.parse(source);
      } catch(e) {
        console.error('Invalid MusicJSON source');
        process.exit(1);
      }
      MusicJSON.toMusicXML(source, function(document) {
        console.log('<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'+format_xml(document.innerHTML));
        process.exit(0);
      });
      
    },

    '--help': function() {
      return ["Subito MusicJSON Converter",
              ,
              "Usage:",
              "\t--json [filename] Converts the source from MusicXML to MusicJSON",
              "\t--xml  [filename] Converts the source from MusicJSON to MusicXML",
              "\t--help            Prints out this help text"
              ].join('\n');
    }
};

var arguments = process.argv.slice(2);
if(arguments.length < 1) {
  console.log(Commands['--help']());
  process.exit(0);
}

if(Commands[arguments[0]]) {
  if(arguments.length === 1) {
    console.log('Please specify a filename after the desired action');
    process.exit(0);
  } else if(arguments.length === 2) {
    if(path.existsSync(arguments[1])) {
      Commands[arguments[0]](fs.readFileSync(arguments[1], 'utf8'));
    } else {
      console.log("Invalid filename, check for existence");
      process.exit(0);
    }
  }
} else {
  console.log('Didn\'t recognize the command \''+arguments[0]+'\'. Try the --help command.');
  process.exit(0);
}