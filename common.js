function getBlobBuilder () {
  try {
    if ( window.Blob ) return new window.Blob() ;
  } catch ( e ) {
    if ( window.BlobBuilder ) return new window.BlobBuilder() ;
    if ( window.MozBlobBuilder ) return new window.MozBlobBuilder() ;
    if ( window.WebKitBlobBuilder ) return new window.WebKitBlobBuilder() ;
    if ( window.MsBlobBuilder ) return new window.MsBlobBuilder() ;
  }
  
  return undefined ;
}

// "length" of object
function object_length ( obj ) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

// Just what it says...
String.prototype.reverse=function(){return this.split("").reverse().join("");}

// Just what it says...
function ucFirst ( string ) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Add thousands separator commas
function addCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

// Reverse-complement sequence
// TODO: find the five ways this function could run faster if you're bored!
function rcSequence ( s ) {
  var t = '' ;
  for ( var i = 0 ; i < s.length ; i++ ) {
    t = cd.rc[s.charAt(i)] + t ;
  }
  return t ;
}

// Post-process common data for easier access
function loadBaseData () {
  // IUPAC to bases
  cd.iupac2bases = {} ;
  $.each ( cd.bases2iupac , function ( k , v ) { cd.iupac2bases[v] = k ; } ) ;
  
  // Reverse-complement bases
  cd.rc = {} ;
  $.each ( cd.iupac2bases , function ( iupac , bases ) {
    var nb = '' ;
    if ( bases.match(/T/) ) nb += 'A' ;
    if ( bases.match(/G/) ) nb += 'C' ;
    if ( bases.match(/C/) ) nb += 'G' ;
    if ( bases.match(/A/) ) nb += 'T' ;
    if ( nb == '' ) cd.rc[iupac] = 'N' ; // N <=> N
    else cd.rc[iupac] = cd.bases2iupac[nb] ;
  } ) ;
  
  // Amino Acids  : short to long
  cd.aa_s2l = {} ;
  $.each ( cd.aa , function ( k , v ) { cd.aa_s2l[v.short] = v.long ; } ) ;

  // Amino Acids  : short to codons
  cd.aa_s2c = {} ;
  $.each ( cd.aa , function ( k , v ) { cd.aa_s2c[v.short] = v.codons ; } ) ;

  // Amino Acids  : codons to short
  cd.aa_c2s = {} ;
  $.each ( cd.aa , function ( k , v ) {
    $.each ( v.codons , function ( k2 , v2 ) {
      cd.aa_c2s[v2] = v.short ;
    } ) ;
  } ) ;
  
  // Restriction enzymes : Accessible by name
  cd.re = {} ;
  $.each ( cd.restriction_enzymes , function ( k , v ) {

    // Calculate regexp
    var seq = v.seq ;
    var pattern = '' ;
    for ( var i = 0 ; i < seq.length ; i++ ) {
      var r = cd.iupac2bases[seq[i]] ;
      if ( r.length == 1 ) pattern += seq[i] ;
      else pattern += '['+r+']' ;
    }
    
    cd.re[v.name] = {
      seq:v.seq , 
      cut:v.cut , 
      offset:v.offset , 
      is_palindromic : ( v.seq == rcSequence(v.seq) ) , // TODO check cut/offset for is_palindromic
      rx : new RegExp('('+pattern+')','gi')
    } ;
  } ) ;

  // Restriction enzymes : Group by recognition sequence and cut/offset
  cd.re_s2n = {} ; // Sequence-to-name; actually [sequence_length][seq/cut/offset] = [ list,of,names ]
  $.each ( cd.re , function ( k , v ) {
    var l = v.seq.length ;
    var s = v.seq + "/" + v.cut + "/" + v.offset ;
    if ( undefined === cd.re_s2n[l] ) cd.re_s2n[l] = {} ;
    if ( undefined === cd.re_s2n[l][s] ) cd.re_s2n[l][s] = [] ;
    cd.re_s2n[l][s].push ( k ) ;
  } ) ;
  
  // Type colors
  $.each ( cd.feature_types , function ( k , v ) {
    gentle.features[k] = v.name || ucFirst ( k ) ;
    if ( $('#dummy_feature_'+k).length == 0 ) $('body').append("<div id='dummy_feature_"+k+"' class='feat_"+k+"' style='display:none'></div>") ;

    if ($('#dummy_feature_'+k).css ( 'background-color' ) != 'rgba(0, 0, 0, 0)' ){
      cd.feature_types[k].col = $('#dummy_feature_'+k).css ( 'background-color' )
    } else { 
      cd.feature_types[k].col = '#888888' ;
    }
  } ) ;

}

// This function allows for arbitrary text to be copied/pasted to the clipboard,
// but only during actual cut/copy actions from menu or keyboard. It does this by
// showing a textarea with the selected text to be copied when the action is performed;
// the textarea then executes the event. The textarea is then hidden again.
function copyToClipboard ( text ) {
  $('#copytb').val(text);
  $('#copywrap').show();
  $('#copytb').focus();
  $('#copytb').select();
  setTimeout ( "$('#copywrap').hide();" , 100 ) ;
}


function clone(obj) {
  if ( undefined === obj ) return undefined ;
  return JSON.parse ( JSON.stringify(obj) );
/*    // A clone of an object is an empty object 
            // with a prototype reference to the original.

    // a private constructor, used only by this one clone.
            function Clone() { } 
    Clone.prototype = obj;
    var c = new Clone();
            c.constructor = Clone;
            return c;*/
}

String.prototype.replaceAt=function(index, character) { return this.substr(0, index) + character + this.substr(index+character.length); }
String.prototype.trunc =
     function(n,useWordBoundary){
         var tooLong = this.length>n,
             s_ = tooLong ? this.substr(0,n-1) : this;
         s_ = useWordBoundary && tooLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
         return  ""+(tooLong ? s_ + '...' : s_);
      }; // adapted from http://stackoverflow.com/questions/1199352/smart-way-to-shorten-long-strings-with-javascript

// if fullEscape option is set to true, escapes everything, otherwise escapes only < and >
String.prototype.escapeHTML = function(fullEscape) {
  return ""+ (fullEscape ? this.replace(/</i, '&lt;').replace(/>/i, '&gt;') : document.createTextNode(this).textContent);
}

/* Used to batch copy  a set of CSS properties from a DOM element to another */
$.fn.copyCSSProperties = function (source, properties_array) {
  for(var i in properties_array) {
    var property = properties_array[i];
    if(property == 'width')
      this.width(source.width());
    else if(property == 'height')
      this.height(source.height());
    else
      this.css(property, source.css(property));
  }
  return this;
}

/* Paul Irish Animation shim: 
   http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/ */
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

//
// Base64 utility methods (HTML5)
// (https://github.com/inexorabletash/polyfill)
//
(function (global) {
  var B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  global.atob = global.atob || function (input) {
    input = String(input);
    var position = 0,
        output = [],
        buffer = 0, bits = 0, n;

    input = input.replace(/\s/g, '');
    if ((input.length % 4) === 0) { input = input.replace(/=+$/, ''); }
    if ((input.length % 4) === 1) { throw Error("InvalidCharacterError"); }
    if (/[^+/0-9A-Za-z]/.test(input)) { throw Error("InvalidCharacterError"); }

    while (position < input.length) {
      n = B64_ALPHABET.indexOf(input.charAt(position));
      buffer = (buffer << 6) | n;
      bits += 6;

      if (bits === 24) {
        output.push(String.fromCharCode((buffer >> 16) & 0xFF));
        output.push(String.fromCharCode((buffer >>  8) & 0xFF));
        output.push(String.fromCharCode(buffer & 0xFF));
        bits = 0;
        buffer = 0;
      }
      position += 1;
    }

    if (bits === 12) {
      buffer = buffer >> 4;
      output.push(String.fromCharCode(buffer & 0xFF));
    } else if (bits === 18) {
      buffer = buffer >> 2;
      output.push(String.fromCharCode((buffer >> 8) & 0xFF));
      output.push(String.fromCharCode(buffer & 0xFF));
    }

    return output.join('');
  };

  global.btoa = global.btoa || function (input) {
    input = String(input);
    var position = 0,
        out = [],
        o1, o2, o3,
        e1, e2, e3, e4;

    if (/[^\x00-\xFF]/.test(input)) { throw Error("InvalidCharacterError"); }

    while (position < input.length) {
      o1 = input.charCodeAt(position++);
      o2 = input.charCodeAt(position++);
      o3 = input.charCodeAt(position++);

      // 111111 112222 222233 333333
      e1 = o1 >> 2;
      e2 = ((o1 & 0x3) << 4) | (o2 >> 4);
      e3 = ((o2 & 0xf) << 2) | (o3 >> 6);
      e4 = o3 & 0x3f;

      if (position === input.length + 2) {
        e3 = 64; e4 = 64;
      }
      else if (position === input.length + 1) {
        e4 = 64;
      }

      out.push(B64_ALPHABET.charAt(e1),
               B64_ALPHABET.charAt(e2),
               B64_ALPHABET.charAt(e3),
               B64_ALPHABET.charAt(e4));
    }

    return out.join('');
  };
}(this));
