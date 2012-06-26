/**
 	@extends Plugin
*/
PluginFindInSequence.prototype = new Plugin() ;

PluginFindInSequence.prototype.constructor = PluginFindInSequence ;

/**
	Opens the find dialog.
	@deprecated in favor of toolbar query box
*/
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
//	sc.unbindKeyboard() ;
	$('#'+this.query_id).keyup(function(){me.queryChanged();}) ;
}

/**
	Event handler : query string has changed, search and update results
	@param {object} e Event object. Not used.
*/
PluginFindInSequence.prototype.queryChanged = function (e) {
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
	$('#'+this.result_id+' a').click ( function () {
		me.clickHandler($(this));
		return false;
	} ) ;
	if ( results.length == 1 ) $('#'+this.result_id+' a').click() ;
}

/**
	Event handler : A search result was clicked, highlight corresponding text in sequence.
	@param {object} o Clicked object. Contains start and end positions as HTML attributes.
*/
PluginFindInSequence.prototype.clickHandler = function ( o ) {
	var from = o.attr('from') ;
	var to = o.attr('to') ;
	this.sc.select ( from , to , 'yellow' ) ;
	this.sc.ensureBaseIsVisible ( to ) ;
	this.sc.ensureBaseIsVisible ( from ) ;
	this.dropdown_focusout_cancel = true ;
}

/**
	Performs DNA sequence search.
	@param {string} sequence The sequence to search
	@param {string} query The query string to find. May contain IUPAC bases.
	@param {bool} is_dna If DNA sequence, true, otherwise false.
	@return {object} Object member array "results" contains up to the first 5000 results. Object member "toomany" indicates there may be more.
*/
PluginFindInSequence.prototype.findInSequence = function ( sequence , query , is_dna ) {
	var ret = { results : [] , toomany : false , ok : false } ;

	var pattern_array = [] ;
	var pattern = '' ;
	if ( is_dna ) {
		for ( var i = 0 ; i < query.length ; i++ ) {
			var r = cd.iupac2bases[query[i].toUpperCase()] ;
			if ( undefined === r ) pattern_array.push ( query[i] ) ;
			else if ( r.length == 1 ) pattern_array.push ( query[i] ) ;
			else pattern_array.push ( '['+r+']' ) ;
		}
		pattern = pattern_array.shift() ;
		if ( pattern_array.length > 0 ) {
			pattern += '(?=(' ;
			$.each ( pattern_array , function ( k , v ) {
				pattern += v ;
			} ) ;
			pattern += '))' ;
		}
	} else {
		pattern = query ;
	}

	var rx = new RegExp('('+pattern+')','gi') ;
	ret.ok = true ;
	
	var result ;
	while ((result=rx.exec(sequence)) !== null ) {
		var p = result.index ;//rx.lastIndex - query.length ;
		ret.results.push ( { from : p , to : p+result[1].length+result[2].length-1 } ) ;
		if ( ret.results.length > 5000 ) {
			ret.toomany = true ;
			break ;
		}
	}
	
	
	return ret ;
}

/**
	Updates the "floating" search result box beneath the query entry box in the toolbar.
*/
PluginFindInSequence.prototype.updateResultsBox = function () {
	var query = $('#toolbar_search_box').val() ;
	
	var me = this ;
	me.uses_dialog = false ;
	var id = me.result_id + '_container' ;
	if ( $('#'+id).length == 0 ) {
		$('#'+id).remove() ;
		var h = '' ;
		h += "<div style='z-index:200;position:absolute;width:200px;height:400px;overflow:auto;border:1px solid black;background-color:white;' id='"+id+"'>" ;
		h += "<div style='float:right;z-index:201'><a href='#' id='"+id+"_close'><i class='icon-remove'></i></a></div>" ;
		h += "<div id='" + me.result_id + "'></div>" ;
		h += "</div>" ;
		$('#all').append ( h ) ;
		
		var p = $('#toolbar_search_box').offset() ;
		$('#'+id).css ( { left : p.left + 10 , top : p.top+30 , width : $('#toolbar_search_box').width() , opacity : 0.9 } ) ;
		
		$('#'+id).mouseenter ( function () { me.dropdown_focusout_cancel = true ; } ) ;
		$('#'+id).mouseleave ( function () { me.dropdown_focusout_cancel = false ; } ) ;
		
        $('#'+id+'_close').click ( function () { $('#'+id).remove(); } ) ;

		$('#toolbar_search_box').focusout ( function () {
			if ( me.dropdown_focusout_cancel ) $('#toolbar_search_box').focus() ;
			else $('#'+id+'_close').click() ;
		} ) ;

		me.sc = me.getCurrentSequenceCanvas() ;
		if ( me.sc === undefined ) return ; // Paranoia
		me.dna_forward = me.sc.sequence.seq ;
		me.dna_rc = rcSequence ( me.dna_forward ) ;
	}
	
	this.query_id = 'toolbar_search_box' ;
	this.queryChanged() ;
}

/**
	A plugin to search in the current (DNA) sequence. Supports IUPAC base search.
	@constructor
*/
function PluginFindInSequence () {
	this.name = 'find_in_sequence' ;
	this.dialog_id = 'find_in_sequence_dialog' ;
	this.query_id = this.dialog_id + "_query" ;
	this.result_id = this.dialog_id + "_result" ;
	this.uses_dialog = true ;
	this.dropdown_focusout_cancel = false ;
}

// Register plugin
if ( plugins.registerPlugin ( { className : 'PluginFindInSequence' , url : 'plugins/find_in_sequence.js' , name : 'find_in_sequence' } ) ) {

// This would register the plugin as a menu item. Deprecated in favor of toolbar query box.
//	plugins.registerAsTool ( { className : 'PluginFindInSequence' , module : 'dna' , section : 'sequence' , call : 'startDialog' , linkTitle : 'Find in sequence' } ) ;

// Registers plugin as toolbar query box handler. There should only be one at any time.
	plugins.registerAsSearch ( { className : 'PluginFindInSequence' , module : 'dna' , section : 'sequence' , call : 'updateResultsBox' , linkTitle : 'Search' } ) ;
}
