//________________________________________________________________________________________
// SequenceCanvas base class
function SequenceCanvas () {
	this.canvas_id = '' ;
	this.yoff = 0 ;
	this.sequence = {} ;
	this.edit = { editing : false } ;
	this.type = undefined ;
}

SequenceCanvas.prototype.init = function () {}
SequenceCanvas.prototype.recalc = function () {}
SequenceCanvas.prototype.show = function () {}
SequenceCanvas.prototype.select = function ( from , to ) {}
SequenceCanvas.prototype.deselect = function () {}
SequenceCanvas.prototype.applySettings = function ( settings ) {}

SequenceCanvas.prototype.resizeCanvas = function () {
	var w = $('#canvas_wrapper').width()-20 ; // A guess to scrollbar width
	var h = $('#canvas_wrapper').height() ;
	$('#sequence_canvas').css ( { width:w+'px' , height:h } ) ;
	$('#canvas_wrapper').css ( { 'max-height' : h } ) ;
	$('#canvas_wrapper').height ( $('#main').height() - 20 ) ;
	this.show() ;
}

SequenceCanvas.prototype.initSidebar = function () {
	if ( this.type === undefined ) return ;
	var me = this ;
	var h = '' ;
	$('#toolbar_ul .toolbar_plugin').remove() ;
	h = '' ;
	$.each ( plugins.tools[me.type] , function ( k , v ) {
		h += "<li class='dropdown toolbar_plugin' id='toolbar_plugins_"+k+"' style='display:none'>" ;
		h += '<a href="#" class="dropdown-toggle" data-toggle="dropdown">'+ucFirst(k)+'<b class="caret"></b></a>' ;
		h += '<ul class="dropdown-menu"></ul></li>' ;
	} ) ;
	$('#toolbar_ul').append ( h ) ;
	
	$.each ( plugins.tools[me.type] , function ( section , v1 ) {
		$.each ( v1 , function ( tool , v2 ) {
			me.registerTool ( v2 ) 
		} ) ;
	} ) ;
	$.each ( plugins.search[me.type] , function ( section , v1 ) {
		$.each ( v1 , function ( tool , v2 ) {
			me.registerSearch ( v2 ) 
		} ) ;
	} ) ;
}

SequenceCanvas.prototype.removePlugin = function ( name ) {
	
	// Remove tools
	$('#right div[name="tool_'+name+'"]').remove();
	
}

SequenceCanvas.prototype.registerSearch = function ( o ) {
	var me = this ;
	var x = new window[o.className]();
	this.search = x ;
	$('#search_form').remove() ;

	var h = '' ;
	h += '<form class="navbar-search" id="search_form">' ;
	h += '<input id="toolbar_search_box" type="text" class="search-query" placeholder="' + o.linkTitle + '"' ;
	h += " onkeyup='gentle.main_sequence_canvas.search." + o.call + "();return true' />" ;
	h += '</form>' ;
	$('#toolbar-right').prepend ( h ) ;
}

SequenceCanvas.prototype.registerTool = function ( o ) {
	var x = new window[o.className]();
	this.tools[o.name] = x ;
	
	if ( true ) {
		var id = 'toolbar_plugins_' + o.section ;
		var h = "<li class='canvas_tool'><a href='#' onclick='gentle.main_sequence_canvas.tools[\"" + o.name + "\"]." + o.call + "();return false'>" + o.linkTitle + "</a></li>" ;
		$('#'+id+' ul').append(h) ;
		$('#'+id).show() ;
	}
	
	if ( false ) {
		var id = 'tools_' + o.section ;
		var h = "<div class='tool' name='tool_" + x.name + "'>" ;
		h += "<a href='#' onclick='gentle.main_sequence_canvas.tools[\"" + o.name + "\"]." + o.call + "();return false'>" + o.linkTitle + "</a>" ;
		h += "</div>" ;
		$('#'+id).append ( h ) ;
	}
}


SequenceCanvas.prototype.getSettings = function () {
	return {} ;
}

SequenceCanvas.prototype.isCharAllowed = function ( c ) {
	if ( undefined === this.sequence.edit_allowed ) return true ; // Anything goes
	var allowed = false ;
	c = ucFirst ( c ) ;
	$.each ( this.sequence.edit_allowed , function ( k , v ) {
		if ( v == c ) allowed = true ;
	} ) ;
	return allowed ;
}

SequenceCanvas.prototype.pasteHandler = function ( e ) {
	var sc = gentle.main_sequence_canvas ;
	if ( !sc.edit.editing ) return ; // Edit mode only

	// CROSS-BROWSER MADNESS!!!
	var pastedText = undefined;
	if (window.clipboardData && window.clipboardData.getData) { // IE
		pastedText = window.clipboardData.getData('Text');
	} else if (e.originalEvent.clipboardData && e.originalEvent.clipboardData.getData) {
		pastedText = e.originalEvent.clipboardData.getData('text/plain');
	}
	
	if ( undefined === pastedText ) {
		$('#tmp1').remove() ;
		var h = "<textarea style='position:fixed;left:-500px;bottom:5px;width:1px;height:0px' id='tmp1'></textarea>" ;
		$('#all').append ( h ) ;
		$('#tmp1').focus() ;
		setTimeout ( function () {
			var s = $('#tmp1').val() ;
			$('#tmp1').remove() ;
			sc.doCheckedPaste ( sc , s ) ;
		} , 1 ) ; // TTGAGTCCAACCC
	} else {
		sc.doCheckedPaste ( sc , pastedText ) ;
	}
}

SequenceCanvas.prototype.doCheckedPaste = function ( sc , pastedText ) {
	pastedText = pastedText.replace ( /\s/g , '' ) ;
	var parts = pastedText.split ( '' ) ;
	var ok = true ;
	$.each ( parts , function ( k , c ) {
		if ( !sc.isCharAllowed ( c ) ) ok = false ;
	} ) ;
	if ( !ok ) {
		alert ( "Text contains illegal characters, and was therefore not pasted" ) ;
		return false ;
	}
	
	sc.doPaste ( sc , pastedText ) ;
}

SequenceCanvas.prototype.doPaste = function ( sc , pastedText ) {
	sc.sequence.insert ( sc.edit.base , pastedText.toUpperCase() ) ;
	sc.edit.base += pastedText.length ;
	sc.recalc() ;
	top_display.init() ;
	sc.ensureBaseIsVisible ( sc.edit.base ) ;
	
	return false; // Prevent the default handler from running.
}

SequenceCanvas.prototype.deleteSelection = function () {
	var sc = gentle.main_sequence_canvas ;
	if ( sc.selections.length != 1 ) return ;
	var sel = sc.selections[0] ;
	sc.sequence.remove ( sel.from , sel.to - sel.from + 1 ) ;
	sc.recalc() ;
	top_display.init() ;
	sc.ensureBaseIsVisible ( sel.from ) ;
	sc.deselect() ;
}

SequenceCanvas.prototype.keyhandler = function ( e ) {
	var sc = gentle.main_sequence_canvas ;
	var code = (e.keyCode ? e.keyCode : e.which);
//	console.log ( code + "/" + e.metaKey ) ;

	var bpp = sc.end_base - sc.start_base + 1 ;

	if ( !sc.edit.editing ) { // Keys for view mode
		if ( code == 36 ) { // Start
			sc.ensureBaseIsVisible ( 0 ) ;
		} else if ( code == 35 ) { // End
			sc.ensureBaseIsVisible ( sc.sequence.seq.length-1 ) ;
		} else if ( code == 33 ) { // Page up
			sc.ensureBaseIsVisible ( sc.start_base - bpp ) ;
		} else if ( code == 34 ) { // Page down
			sc.ensureBaseIsVisible ( sc.end_base + bpp ) ;
		} else if ( code == 38 ) { // Cursor up
			sc.ensureBaseIsVisible ( sc.start_base - sc.bases_per_row ) ;
		} else if ( code == 40 ) { // Cursor down
			sc.ensureBaseIsVisible ( sc.end_base + sc.bases_per_row ) ;
		} else if ( code == 8 || code == 46 ) { // Backspace or delete
			e.preventDefault();
			e.stopPropagation();
			sc.deleteSelection();
		}
		return ;
	}
	

	if ( code >= 65 && code <= 90 && !e.metaKey ) { // A-Z
		var c = String.fromCharCode(code) ;
		if ( !sc.isCharAllowed ( c ) ) {
			alert ( c + " not allowed" ) ;
			return false ;
		}
		sc.sequence.insert ( sc.edit.base , c ) ;
		sc.edit.base++ ;
		sc.recalc() ;
		top_display.init() ;
	} else if ( code == 8 ) { // Backspace
		e.preventDefault();
		e.stopPropagation();
		if ( sc.edit.base == 0 ) return ;
		sc.edit.base-- ;
		sc.sequence.remove ( sc.edit.base , 1 ) ;
		sc.recalc() ;
		top_display.init() ;
	} else if ( code == 46 ) { // Delete
		e.preventDefault();
		e.stopPropagation();
		if ( sc.edit.base == sc.sequence.seq.length ) return ;
		sc.sequence.remove ( sc.edit.base , 1 ) ;
		sc.recalc() ;
		top_display.init() ;
	} else if ( code == 27 ) { // Escape
		sc.setEditMode ( false ) ;
		sc.show() ;
		e.preventDefault();
		return ;
	} else if ( code == 33 ) { // Page up
		if ( sc.edit.base < bpp ) {
			if ( sc.edit.base == 0 ) return ;
			sc.edit.base = 0 ;
		} else {
			sc.edit.base -= bpp ;
		}
	} else if ( code == 34 ) { // Page down
		if ( sc.edit.base + bpp >= sc.sequence.seq.length ) {
			if ( sc.edit.base == sc.sequence.seq.length-1 ) return ;
			sc.edit.base = sc.sequence.seq.length-1 ;
		} else {
			sc.edit.base += bpp ;
		}
	} else if ( code == 36 ) { // Start
		if ( sc.edit.base == 0 ) return ;
		sc.edit.base = 0 ;
	} else if ( code == 35 ) { // End
		if ( sc.edit.base == sc.sequence.seq.length-1 ) return ;
		sc.edit.base = sc.sequence.seq.length-1 ;
	} else if ( code == 37 ) { // Cursor left
		if ( sc.edit.base == 0 ) return ;
		sc.edit.base-- ;
	} else if ( code == 38 ) { // Cursor up
		if ( sc.edit.base < sc.bases_per_row ) {
			if ( sc.edit.base == 0 ) return ;
			sc.edit.base = 0 ;
		} else {
			sc.edit.base -= sc.bases_per_row ;
		}
	} else if ( code == 39 ) { // Cursor right
		if ( sc.edit.base > sc.sequence.seq.length ) return ;
		sc.edit.base++ ;
	} else if ( code == 40 ) { // Cursor down
		if ( sc.edit.base + sc.bases_per_row >= sc.sequence.seq.length ) {
			if ( sc.edit.base == sc.sequence.seq.length-1 ) return ;
			sc.edit.base = sc.sequence.seq.length-1 ;
		} else {
			sc.edit.base += sc.bases_per_row ;
		}
	} else return ;
	
	e.preventDefault();

	sc.ensureBaseIsVisible ( sc.edit.base ) ;
}

SequenceCanvas.prototype.setEditMode = function ( state ) {
	var sc = gentle.main_sequence_canvas ;
	sc.edit.editing = state ;
	gentle.setMenuState ( 'edit_menu_paste' , state ) ;
	$('#selection_context_marker').remove() ;
}


SequenceCanvas.prototype.ensureBaseIsVisible = function ( base ) { // Ensure new position is visible, or scroll appropriately
	var sc = gentle.main_sequence_canvas ;
	if ( base < 0 ) base = 0 ;
	if ( base >= sc.sequence.seq.length ) base = sc.sequence.seq.length-1 ;
	var again = true ;
	var last_try = -1000 ;
	while ( again ) {
		sc.show() ;
		again = false ;
//			console.log ( sc.end_base + " / " + sc.edit.base ) ;
		
		if ( sc.end_base < base ) {
			again = true ;
			var cur = $('#canvas_wrapper').scrollTop() ;
			var np = cur + sc.lines.length * sc.ch * ( 1 + Math.floor((base-sc.end_base-1)/sc.bases_per_row) ) - (sc.primary_line-1)*sc.ch ;
			np += sc.block_height - np % sc.block_height ;
			if ( np == last_try ) return ; // Prevent eternal attempt to scroll...
			last_try = np ;
//				console.log ( "Scrolling from " + cur + " to " + np ) ;
			$('#canvas_wrapper').scrollTop ( np ) ;
			$('#canvas_wrapper').scroll();
		} else if ( sc.start_base > base ) {
			again = true ;
			var cur = $('#canvas_wrapper').scrollTop() ;
			var np = cur - sc.lines.length * sc.ch * ( 1 + Math.floor((sc.start_base-base-1)/sc.bases_per_row) ) - (sc.primary_line+1)*sc.ch ;
			if ( np < 0 ) np = 0 ;
			np -= np % sc.block_height ;
			if ( np == last_try ) return ; // Prevent eternal attempt to scroll...
			last_try = np ;
//				console.log ( "Scrolling from " + cur + " to " + np ) ;
			$('#canvas_wrapper').scrollTop ( np ) ;
			$('#canvas_wrapper').scroll();
		}
		
	}

}