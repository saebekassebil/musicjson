# Subito MusicJSON

Subito MusicJSON is a part of the Subito project.
MusicJSON is simply an MusicXML document transformed to a JSON document. 
This saves some bytes and is generally easier to manipulate for a JavaScript application.

Subito MusicJSON will probably be re-wrote into a NPM package, 
but right now it only consists of a file called `musicjson.js`. 
This is a Node.js commandline application which takes in either MusicJSON or MusicXML documents and transform
them into the counterpart.

`node musicjson` yields:
    Subito MusicJSON Converter
    
    Usage:
            --json [filename] Converts the source from MusicXML to MusicJSON
            --xml  [filename] Converts the source from MusicJSON to MusicXML
            --help            Prints out this help text
