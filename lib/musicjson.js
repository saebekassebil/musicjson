/*
 * MusicJSON
 *  - A bi-directional converter between MusicXML and MusicJSON
 * https://github.com/saebekassebil/musicjson
 *
 * Copyright (c) 2013 Saebekassebil
 * Licensed under the MIT license.
 */

var builder = require('xmlbuilder')
  , sax     = require('sax')
  , events  = require('events')
  , util    = require('util');

var partwise = {
  id: '-//Recordare//DTD MusicXML 2.0 Partwise//EN',
  url: 'http://www.musicxml.org/dtds/partwise.dtd',
  type: 'score-partwise'
};

var doctype = 'PUBLIC "' + partwise.id + '" "' + partwise.url + '"';
var attrkey = '$', charkey = '_',
    orderkey = '%', orderNumberKey = '&', namekey = '#name',
    specialKeys = [attrkey, charkey, orderkey, orderNumberKey, namekey];

function assignOrderNumber(obj, name, parent) {
  if (name in parent) {
    if (!(orderNumberKey in parent)) {
      parent[orderNumberKey] = 0;

      for (var child in parent) {
        if (specialKeys.indexOf(child) !== -1) {
          continue;
        }

        parent[orderNumberKey]++;
        parent[child][orderkey] = parent[orderNumberKey];
      }
    }

    parent[orderNumberKey]++;
    obj[orderkey] = parent[orderNumberKey];
  } else {
    if (orderNumberKey in parent) {
      parent[orderNumberKey]++;
      obj[orderkey] = parent[orderNumberKey];
    }
  }
}

// XML Parser for parsing MusicXML documents
function Parser(settings) {
  events.EventEmitter.call(this);

  // Initialize sax parser
  this.sax = sax.parser(true, {
    trim: false,
    normalize: false,
    xmlns: false
  });

  // Stack to hold the tags when encountered
  this.stack = [];

  this.settings = settings || {};

  // Initialize listeners
  this.sax.onerror = this.error.bind(this);
  this.sax.onopentag = this.open.bind(this);
  this.sax.onclosetag = this.close.bind(this);
  this.sax.ontext = this.sax.oncdata = this.text.bind(this);
}
util.inherits(Parser, events.EventEmitter);

Parser.prototype.error = function(e) {
  this.emit('error', e);
};

Parser.prototype.open = function(node) {
  var key, obj = {};

  // Set the node name (deleted later)
  obj[namekey] = node.name.toLowerCase();
  obj[charkey] = '';

  // Iterate over all the attributes
  for (key in node.attributes) {
    if (!(attrkey in obj)) {
      obj[attrkey] = {};
    }

    obj[attrkey][key] = node.attributes[key];
  }

  this.stack.push(obj);
};

Parser.prototype.close = function(node) {
  var obj = this.stack.pop(), name = obj[namekey], parent;

  delete obj[namekey];
  if (orderNumberKey in obj) {
    delete obj[orderNumberKey];
  }

  parent = this.stack[this.stack.length - 1];

  if (!obj[charkey].trim().length) { // No text content
    delete obj[charkey];
  } else if (Object.keys(obj).length === 1) { // Text node
    obj = obj[charkey];
  }

  // If the object is empty, translate it to "true"
  if (obj && typeof obj === 'object' && !Object.keys(obj).length) {
    obj = true;
  }

  if (this.stack.length > 0) {
    // Assign order number, so that tag order is preserved
    if (this.settings.preserveOrder) {
      assignOrderNumber(obj, name, parent);
    }

    if (name in parent) {
      parent[name] = util.isArray(parent[name]) ? parent[name] : [parent[name]];
      parent[name].push(obj);
    } else {
      parent[name] = obj;
    }
  } else {
    var returnobj = {};
    returnobj[name] = obj;

    this.emit('end', returnobj);
  }
};

Parser.prototype.text = function(text) {
  var last = this.stack[this.stack.length - 1];
  if (last) {
    last[charkey] += text;
  }
};

Parser.prototype.parse = function(string, callback) {
  this.on('end', function(result) { callback(null, result); });
  this.on('error', callback);

  this.sax.write(string);
};

// Translates a MusicJSON element to MusicXML
function toXML(root, el, nodeName) {
  var element, i, attr, type = typeof el, children = [];

  if (!root) {
    // Create <?xml, DOCTYPE and root element
    element = root = builder.create(nodeName, {
        version: '1.0',
        encoding: 'UTF-8'
      }, { ext: doctype });
  } else {
    element = root.element(nodeName);
  }

  if (type === 'number' || type === 'string') {
    return element.text(el);
  }

  for (i in el) {
    switch (i) {
      // Set attributes of node
      case '$':
        for (attr in el[i]) {
          element.attribute(attr, el[i][attr]);
        }
      break;

      // Set textual content of node
      case '_':
        element.text(el[i]);
      break;

      case '%':
        // Do nothing
      break;

      // Append child
      default:
        if (util.isArray(el[i])) {
          children = children.concat(el[i].map(function(el) {
            return { el: el, name: i };
          }));
        } else {
          children.push({el: el[i], name: i});
        }
      break;
    }
  }

  // Find all children with no ordering
  var sorted = children.filter(function(child) {
    return !(typeof child.el === 'object' && orderkey in child.el);
  });

  // Find all children with ordering, and splice them into
  // the sorted array
  children.filter(function(child) {
    return typeof child.el === 'object' && orderkey in child.el;
  }).sort(function(a, b) {
    return +a.el[orderkey] - +b.el[orderkey];
  }).forEach(function(child, i) {
    var index = +child.el[orderkey] - 1;
    sorted.splice(index, 0, child);
  });

  sorted.forEach(function(child) {
    toXML(element, child.el, child.name);
  });

  return element;
}

exports.musicJSON = function(source, callback) {
  var settings = { preserveOrder: true };

  if (typeof source === 'object') {
    settings.preserveOrder = source.preserveOrder;
    source = source.source;
  }

  var parser = new Parser(settings);
  parser.parse(source, callback);
};

exports.musicXML = function musicXML(source, callback) {
  var root = toXML(null, source[partwise.type], partwise.type);
  callback(null, root);
};

