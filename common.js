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
		t = cd.rc[s[i]] + t ;
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
		cd.feature_types[k].col = $('#dummy_feature_'+k).css ( 'background-color' ) || '#DDDDDD' ;
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
