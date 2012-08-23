#!/usr/bin/env/node

/*
 * MusicJSON
 *  - A bi-directional converter between MusicXML and MusicJSON
 * https://github.com/saebekassebil/musicjson
 *
 * Copyright (c) 2012 Saebekassebil
 * Licensed under the MIT license.
 */

var domino  = require('domino'),
    Node    = require('domino/lib/Node'),
    fs      = require('fs'),
    path    = require('path'),
    util    = require('util');

/*
 * Auxilliary Variables and Functions
 */
var kPartWise = {
  id: '-//Recordare//DTD MusicXML 2.0 Partwise//EN',
  url: 'http://www.musicxml.org/dtds/partwise.dtd',
  type: 'score-partwise'
};

// Parses a MusicXML tag
function parseElement(el) {
  var obj = {}, i, length, attribute, child, childNodeName, backup, node;

  // Save attributes with '$' prefix
  if (el.attributes) {
    for (i = 0, length = el.attributes.length; i < length; i++) {
      attribute = el.attributes.item(i);
      obj['$' + attribute.name] = attribute.value;
    }
  }

  for (i = 0, length = el.childNodes.length; i < length; i++) {
    node = el.childNodes[i];

    if (node.nodeType == Node.ELEMENT_NODE) {
      child = parseElement(node);
      childNodeName = node.nodeName.toLowerCase();

      if (childNodeName in obj && !util.isArray(obj[childNodeName])) {
        backup = obj[childNodeName];
        obj[childNodeName] = [backup, child];
      } else if (childNodeName in obj) {
        obj[childNodeName].push(child);
      } else {
        obj[childNodeName] = child;
      }
    } else if (node.nodeType == Node.TEXT_NODE) {
      if (node.textContent && node.textContent.trim() !== '') {
        if (!el.attributes.length || el.attributes.length < 1) {
          obj = node.textContent;
        } else {
          obj.content = node.textContent;
        }
      }
    }
  }

  return obj;
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
      if (i.charAt(0) === '$') { // Attribute
        xmlElement.setAttribute(i.substr(1), el[i]);
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

/*
 * Converts MusicXML to MusicJSON
 */
function musicJSON(root) {
  if (!root) {
    return false;
  }

  // Create the main MusicJSON root
  var musicJSON = {};

  // Start the recursive serializing of the MusicXML document
  musicJSON[root.tagName.toLowerCase()] = parseElement(root);

  return musicJSON;
}

/*
 * Converts MusicJSON to MusicXML
 */
function musicXML(source, callback) {
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

/*
 * Converts MusicXML to MusicJSON
 */
exports.musicJSON = function(source, callback) {
  // Ugly way of creating an XML document from string
  var win = domino.createWindow(source);

  // Fetch the "root" document from the html -> body -> firstChild
  var root = win.document.documentElement.childNodes[1].firstChild;

  // Parse and convert the document
  var music = musicJSON(root);

  callback(null, music);
};
exports.musicXML = musicXML;
