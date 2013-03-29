/*
 * MusicJSON
 *  - A bi-directional converter between MusicXML and MusicJSON
 * https://github.com/saebekassebil/musicjson
 *
 * Copyright (c) 2012 Saebekassebil
 * Licensed under the MIT license.
 */

var builder = require('xmlbuilder'),
    sax     = require('sax'),
    events  = require('events'),
    util    = require('util');

var partwise = {
  id: '-//Recordare//DTD MusicXML 2.0 Partwise//EN',
  url: 'http://www.musicxml.org/dtds/partwise.dtd',
  type: 'score-partwise'
};

var doctype = 'PUBLIC "' + partwise.id + '" "' + partwise.url + '"';

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
function toXML(root, el, nodeName) {
  var element, x, length, i;

  if (!root) {
    // Create <?xml, DOCTYPE and root element
    element = root = builder.create(
      nodeName,
      { version: '1.0', encoding: 'UTF-8' },
      { ext: doctype }
    );
  } else {
    element = root.element(nodeName);
  }

  if (typeof el === 'number' || typeof el === 'string') {
    element.text(el);
    return element;
  }

  for (i in el) {
    if (el.hasOwnProperty(i)) {
      if (i === '$') { // Attribute object
        for (var attr in el[i]) {
          if (el[i].hasOwnProperty(attr)) {
            element.attribute(attr, el[i][attr]);
          }
        }
      } else if (i === '_') { // Content
        element.text(el[i]);
      } else { // Element
        if(util.isArray(el[i])) {
          for(x = 0, length = el[i].length; x < length; x++) {
            toXML(element, el[i][x], i);
          }
        } else {
          toXML(element, el[i], i);
        }
      }
    }
  }

  return element;
}


exports.musicJSON = function(source, callback) {
  var parser = new Parser();
  parser.parse(source, callback);
};

exports.musicXML = function musicXML(source, callback) {
  var root = toXML(null, source[partwise.type], partwise.type);

  callback(null, root);
}

