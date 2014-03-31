/**
Implements a plain text DNA file reader/writer.

Example: 
```javascript
file = new FT_plaintext();
file.text = 'ATCG';
file.file = {name: 'sequence.txt'}
```

@class FT_plaintext
@extends FT_base
**/

define(function(require) {
  //________________________________________________________________________________________
  // Plain text


  var FT_base = require('lib/files/base'),
      FT_plaintext;


  FT_plaintext = function() {
    this.typeName = 'plaintext' ;
  };


  FT_plaintext.prototype = new FT_base() ;

  FT_plaintext.prototype.constructor = FT_plaintext ;

  FT_plaintext.prototype.getFileExtension = function () {
    return 'txt' ;
  };

  /**
  @method getExportString
  @param {Sequence} sequence
  @returns {String} Sequence as plaintext (new line every 60 char)
  **/
  FT_plaintext.prototype.getExportString = function ( sequence ) {
    var ret = '' ;
    var s = sequence.get('sequence') ;
    while ( s !== '' ) {
      ret += s.substr ( 0 , 60 ) + "\n" ;
      s = s.substr ( 60 , s.length-60 ) ;
    }
    return ret ;
  };

  /**
  @method parseFile
  @returns {Array} Array containing the sequence as an object
  **/
  FT_plaintext.prototype.parseFile = function () {
    var seqtext = this.text.replace ( /[^a-z]/gi , '' ).toUpperCase() ;
    var name = 'Unnamed sequence' ;
    if ( this.file !== undefined ) name = _.ucFirst ( this.file.name ) ;

    return [{
      name: name,
      sequence: seqtext,
    }];
  };

  /**
  Checks if a given file matches the filetype.
  @method textHeuristic
  @returns {boolean} True if the file matches, false if not.
  **/
  FT_plaintext.prototype.textHeuristic = function () {
    if ( this.text.match ( /[^a-zA-Z0-0\s]/ ) ) return false ;
    return true ;
  };

  return FT_plaintext;
});