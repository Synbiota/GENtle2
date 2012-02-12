PluginFindInSequence.prototype = new Plugin() ;
PluginFindInSequence.prototype.constructor = PluginFindInSequence ;

PluginFindInSequence.prototype.startDialog = function () {
	// Init
	this.sc = this.getCurrentSequenceCanvas() ;
	if ( this.sc === undefined ) return ; // Paranoia
	this.dna_forward = this.sc.sequence.seq ;
	this.dna_rc = rcSequence ( this.dna_forward ) ;

	// Create dialog
	var h = "<div id='" + this.dialog_id + "'>" ;
	h += "<div><input type='text' size='40' id='"+this.query_id+"' /></div>" ;
	h += "<div id='"+this.result_id+"' style='max-height:300px;height:300px;overflow:auto'></div>" ;
	h += "<div><small><i>Note :</i> This will not update with sequence changes!</small></div>" ;
	h += "</div>" ;

	$('#'+this.dialog_id).remove() ;
	$('#all').append ( h ) ;
	$('#'+this.dialog_id).dialog ( { title : 'Find in sequence' , width:"auto" } );
	$('#'+this.dialog_id).css ( { 'font-size' : '10pt' } ) ;
	
	var me = this ;
	$('#'+this.query_id).keyup(function(){me.queryChanged()}) ;
}

PluginFindInSequence.prototype.queryChanged = function () {
	var me = this ;

	var query = $('#'+this.query_id).val() ;
	if ( query.length < 3 ) { // Minimum length
		$('#'+this.result_id).html ( '<i>query empty or too short</i>' ) ;
		return ;
	}
	
	var results = [] ;
	
	if ( 1 ) { // DNA sequence
		var r = me.findInSequence ( me.dna_forward , query , true ) ;
		if ( r.toomany ) {
			var v = { type : 'dna' , message : 'Too many hits in DNA' } ;
			results.push ( v ) ;
		} else if ( r.ok ) {
			$.each ( r.results , function ( k , v ) {
				v.type = 'dna' ;
				results.push ( v ) ;
			} ) ;
		}
	}

	if ( 1 ) { // DNA sequence, reverse-complement
		var r = me.findInSequence ( me.dna_rc , query , true ) ;
		if ( r.toomany ) {
			var v = { type : 'dna_rc' , message : 'Too many hits in DNA-RC' } ;
			results.push ( v ) ;
		} else if ( r.ok ) {
			$.each ( r.results , function ( k , v ) {
				v.type = 'dna rc' ;
				var f = me.dna_rc.length - v.to - 1 ;
				v.to = me.dna_rc.length - v.from - 1 ;
				v.from = f ;
				results.push ( v ) ;
			} ) ;
		}
	}

	var h = '' ;
	$.each ( results , function ( k , v ) {
		h += "<div class='search_result'>" ;
		h += v.type.toUpperCase() + ' ' ;
		if ( v.message === undefined ) {
			h += "<a href='#' from='"+v.from+"' to='"+v.to+"'>" + (v.from+1) + "-" + (v.to+1) + "</a>" ;
		} else {
			h += '<i>' + v.message + '</i>' ;
		}
		h += "</div>" ;
	} ) ;
	
	$('#'+this.result_id).html ( h ) ;
	$('#'+this.result_id+' a').click ( function () { me.clickHandler($(this)); return false; } ) ;
	if ( results.length == 1 ) $('#'+this.result_id+' a').click() ;
}

PluginFindInSequence.prototype.clickHandler = function ( o ) {
	var from = o.attr('from') ;
	var to = o.attr('to') ;
	this.sc.select ( from , to , 'yellow' ) ;
	this.sc.ensureBaseIsVisible ( to ) ;
	this.sc.ensureBaseIsVisible ( from ) ;
}


PluginFindInSequence.prototype.findInSequence = function ( sequence , query , is_dna ) {
	var ret = { results : [] , toomany : false , ok : false } ;
	var pattern = '' ;
	if ( is_dna ) {
		for ( var i = 0 ; i < query.length ; i++ ) {
			var r = cd.iupac2bases[query[i].toUpperCase()] ;
			if ( undefined === r ) pattern += query[i] ;
			else if ( r.length == 1 ) pattern += query[i] ;
			else pattern += '['+r+']' ;
		}
	} else {
		pattern = query ;
	}
	var rx = new RegExp('('+pattern+')','gi') ;
	ret.ok = true ;
	
	var result ;
	while ((result=rx.exec(sequence)) !== null ) {
		var p = rx.lastIndex - query.length ;
		ret.results.push ( { from : p , to : p+result[0].length-1 } ) ;
		if ( ret.results.length > 5000 ) {
			ret.toomany = true ;
			break ;
		}
	}
	
	
	return ret ;
}

function PluginFindInSequence () {
	this.name = 'find_in_sequence' ;
	this.dialog_id = 'find_in_sequence_dialog' ;
	this.query_id = this.dialog_id + "_query" ;
	this.result_id = this.dialog_id + "_result" ;
}

// Register plugin
plugins.registerPlugin ( { className : 'PluginFindInSequence' , url : 'plugins/find_in_sequence.js' } ) ;
plugins.registerAsTool ( { className : 'PluginFindInSequence' , module : 'dna' , section : 'sequence' , call : 'startDialog' , linkTitle : 'Find in sequence' } ) ;
