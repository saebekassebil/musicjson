/*
 * MusicJSON
 *  - A bi-directional converter between MusicXML and MusicJSON
 * https://github.com/saebekassebil/musicjson
 *
 * Copyright (c) 2012 Saebekassebil
 * Licensed under the MIT license.
 */

var domino  = require('domino'),
    sax     = require('sax'),
    events  = require('events'),
    util    = require('util');

/*
 * Auxilliary Variables and Functions
 */
var kPartWise = {
  id: '-//Recordare//DTD MusicXML 2.0 Partwise//EN',
  url: 'http://www.musicxml.org/dtds/partwise.dtd',
  type: 'score-partwise'
};

// XML Parser for parsing MusicXML documents
function Parser() {
  events.EventEmitter.call(this);

  // Initialize sax parser
  this.sax = sax.parser(true, {
    trim: false,
    normalize: false,
    xmlns: false
  });

  // Stack to hold the tags when encountered
  this.stack = [];

  // Initialize listeners
  this.sax.onerror = this.saxError.bind(this);
  this.sax.onopentag = this.saxOpen.bind(this);
  this.sax.onclosetag = this.saxClose.bind(this);
  this.sax.ontext = this.sax.oncdata = this.saxText.bind(this);

  // Settings
  this.settings = {
    attrkey: '$',
    charkey: '_'
  };
}
util.inherits(Parser, events.EventEmitter);

Parser.prototype.saxError = function(e) {
  this.emit('error', e);
}

Parser.prototype.saxOpen = function(node) {
  var key, obj = {}, settings = this.settings;

  // Set the node name (deleted later)
  obj['#name'] = node.name.toLowerCase();
  obj[this.settings.charkey] = '';

  // Iterate over all the attributes
  for (key in node.attributes) {
    if (!node.attributes.hasOwnProperty(key)) continue;

    if (!(settings.attrkey in obj)) {
      obj[settings.attrkey] = {};
    }

    obj[settings.attrkey][key] = node.attributes[key];
  }

  return this.stack.push(obj);
}

Parser.prototype.saxClose = function(node) {
  var obj = this.stack.pop(), name = obj['#name'], last;
  delete obj['#name'];

  last = this.stack[this.stack.length - 1];

  if (obj[this.settings.charkey].trim().length === 0) {
    delete obj[this.settings.charkey];
  } else if (Object.keys(obj).length === 1) {
    obj = obj[this.settings.charkey];
  }

  // If the object is empty, translate it to "true"
  if (obj && typeof obj === 'object' && Object.keys(obj).length === 0) {
    obj = true;
  }

  if (this.stack.length > 0) {
    if (name in last && !util.isArray(last[name])) {
      last[name] = [last[name]];
      return last[name].push(obj);
    } else if (util.isArray(last[name])) {
      return last[name].push(obj);
    } else {
      return last[name] = obj;
    }
  } else {
    var returnobj = {};
    returnobj[name] = obj;
    return this.emit('end', returnobj);
  }
}

Parser.prototype.saxText = function(text) {
  var last = this.stack[this.stack.length - 1];
  if (last) {
    return last[this.settings.charkey] += text;
  }
}

Parser.prototype.parse = function(string, callback) {
  this.on('end', function(result) {
    return callback(null, result);
  });

  this.on('error', callback);

  return this.sax.write(string);
}

// Translates a MusicJSON element to MusicXML
function toXML(doc, el, nodeName) {
  var xmlElement = doc.createElement(nodeName), x, length, i;

  if (typeof el === 'number' || typeof el === 'string') {
    xmlElement.appendChild(doc.createTextNode(el));
    return xmlElement;
  }

  for (i in el) {
    if (el.hasOwnProperty(i)) {
      if (i === '$') { // Attribute object
        for (var attr in el[i]) {
          if (el[i].hasOwnProperty(attr)) {
            xmlElement.setAttribute(attr, el[i][attr]);
          }
        }
      } else { // Element
        if(util.isArray(el[i])) {
          for(x = 0, length = el[i].length; x < length; x++) {
            xmlElement.appendChild(toXML(doc, el[i][x], i));
          }
        } else {
          xmlElement.appendChild(toXML(doc, el[i], i));
        }
      }
    }
  }

  return xmlElement;
}


exports.musicJSON = function(source, callback) {
  var parser = new Parser();
  parser.parse(source, callback);
};

exports.musicXML = function musicXML(source, callback) {
  var part = kPartWise, musicXML, impl, type, xmlHeader;

  // Create the DOM implementation
  impl = domino.createDOMImplementation();

  // Create the DOCTYPE
  type = impl.createDocumentType(part.type, part.id, part.url);

  // Create the document itself
  musicXML = impl.createDocument('', '', null);

  // Create the <?xml ... ?> header
  xmlHeader = musicXML.createProcessingInstruction('xml',
      'version="1.0" encoding="UTF-8" standalone="no"');

  // Append both the header and the DOCTYPE
  musicXML.appendChild(xmlHeader);
  musicXML.appendChild(type);

  // Start serializing the MusicJSON document
  musicXML.appendChild(toXML(musicXML, source[part.type], part.type));

  callback(null, musicXML);
}

