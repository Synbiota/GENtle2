//________________________________________________________________________________________
// SequenceCanvas base class
function SequenceCanvas () {
	this.canvas_id = '' ;
	this.yoff = 0 ;
	this.sequence = {} ;
	this.edit = { editing : false } ;
	this.type = undefined ;
	this.metakeys = 0 ;
	this.selection_context_menu = [] ;
}

SequenceCanvas.prototype.init = function () {}
SequenceCanvas.prototype.recalc = function () {}
SequenceCanvas.prototype.show = function () {}
SequenceCanvas.prototype.select = function ( from , to ) {}
SequenceCanvas.prototype.deselect = function () {}
SequenceCanvas.prototype.applySettings = function ( settings ) {}

/*
data = {
	id : 'some_id' , // MANDATORY
	items : [ { html : "my item 1" , callback : function(SequenceCanvas){} } , ... ] , // Static items, or
	getItems : function ( SequeneCanvas ) // Dynamic items (same format as above)
}
*/
SequenceCanvas.prototype.setContextMenuItem = function ( data ) {
	var me = this ;
	var found = false ;
	$.each ( me.selection_context_menu , function ( k , v ) {
		if ( found || v.id != data.id ) return ;
		found = true ;
		me.selection_context_menu[k] = data ;
		return false ;
	} ) ;
	if ( found ) return ;
	if ( undefined === me.selection_context_menu ) me.selection_context_menu = [  ] ;
	me.selection_context_menu.push ( data ) ;
}



SequenceCanvas.prototype.addSelectionMarker = function ( x , y ) {
	var me = this ;
	var h = '' ;
	h += "<div id='selection_context_marker' style='left:"+x+"px;top:"+y+"px'>" ;
	h += '<div class="btn-group"><a class="btn dropdown-toggle" data-toggle="dropdown" href="#"><span class="caret"></span></a><ul class="dropdown-menu">' ; // style="font-size:8pt"
	h += '</ul></div>' ;
	h += "</div>" ;
	
	var context_menu = $(h) ;
	$.each ( me.selection_context_menu , function ( k , v ) {
		var o = ( undefined !== v.items ) ? v.items : v.getItems ( me ) ;
		$.each ( o , function ( k2 , v2 ) {
			var li = $("<li><a href='#'></a></li>") ;
			li.find('a').click(function(){v2.callback(me);return false}) ;
			li.find('a').html(v2.html) ;
			if ( undefined !== v2.title ) li.find('a').attr('title',v2.title) ;
			context_menu.find('ul').append(li) ;
		} ) ;
	} ) ;
	
	$('#selection_context_marker').remove() ;
	$('#canvas_wrapper').prepend ( context_menu ) ;
}


SequenceCanvas.prototype.resizeCanvas = function () {
	var w = $('#canvas_wrapper').width()-20 ; // A guess to scrollbar width
	var h = $('#canvas_wrapper').height() ;
	$('#sequence_canvas').css ( { width:w+'px' , height:h } ) ;
	$('#canvas_wrapper').css ( { 'max-height' : h } ) ;
	$('#canvas_wrapper').height ( $('#main').height() - 20 ) ;
	$('#sequence_canvas_title_bar').css ( { width:w+'px' } ) ;
	this.show() ;
}

SequenceCanvas.prototype.initSidebar = function () {
	if ( this.type === undefined ) return ;
	var me = this ;
	var h = '' ;
	$('#toolbar_ul .toolbar_plugin').remove() ;
	h = '' ;
	$.each ( plugins.tools[me.type]||{} , function ( k , v ) {
		h += "<li class='dropdown toolbar_plugin' id='toolbar_plugins_"+k+"' style='display:none'>" ;
		h += '<a href="#" class="dropdown-toggle" data-toggle="dropdown">'+ucFirst(k)+'<b class="caret"></b></a>' ;
		h += '<ul class="dropdown-menu"></ul></li>' ;
	} ) ;
	$('#toolbar_ul').append ( h ) ;
	
	$.each ( plugins.tools[me.type]||{} , function ( section , v1 ) {
		$.each ( v1 , function ( tool , v2 ) {
			me.registerTool ( v2 ) 
		} ) ;
	} ) ;
	$.each ( plugins.search[me.type]||{} , function ( section , v1 ) {
		$.each ( v1 , function ( tool , v2 ) {
			me.registerSearch ( v2 ) 
		} ) ;
	} ) ;
	$.each ( plugins.context_menu[me.type]||{} , function ( section , v1 ) {
		$.each ( v1 , function ( tool , v2 ) {
			me.setContextMenuItem ( v2 ) 
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

    $('#toolbar_search_box').focus(function() {
		var sc = gentle.main_sequence_canvas ;
		if ( sc.edit.editing ) {
			sc.setEditMode ( false ) ;
			sc.show() ;
		}
		return false ;
	} ) ;

    $('#toolbar_search_box').keydown(function(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 27) { // ESC
            $(this).val("");
        }
    });
}

SequenceCanvas.prototype.registerTool = function ( o ) {
	var x = new window[o.className]();
	this.tools[o.name] = x ;
	
//	console.log ( this.type + " / " + o.name + "." + o.call + " : " + o.linkTitle ) ;
	
	var id = 'toolbar_plugins_' + o.section ;
	var h = "<li class='canvas_tool'><a href='#' onclick='gentle.main_sequence_canvas.tools[\"" + o.name + "\"]." + o.call + "();return false'>" + o.linkTitle + "</a></li>" ;
	$('#'+id+' ul').append(h) ;
	$('#'+id).show() ;
	gentle.sortMenu ( id ) ;
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
	
	if ( true ) { // Cleanup
		pastedText = pastedText.replace ( /[^a-zA-Z]/g , '' ) ;
	}
	
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

SequenceCanvas.prototype.modifierCode = function (event) {
	switch (event.keyCode) {
	case 91:
	case 93:
		return cd.metakeys.CMD;
	case 16:
		return cd.metakeys.SHIFT;
	case 18:
		return cd.metakeys.ALT;
	case 17:
		return cd.metakeys.CTRL;
	default:
		return 0;
	}
}

SequenceCanvas.prototype.unbindKeyboard = function ( root ) {
	if ( undefined === root ) root = document ; //$('#main') ;
	$(root).unbind('keydown').unbind('keyup').unbind('paste').unbind('cut').unbind('copy') ;
}

SequenceCanvas.prototype.bindKeyboard = function ( root ) {
	var sc = this ;
	if ( undefined === root ) root = document ; //$('#main') ;
	sc.unbindKeyboard(root) ;
	$(root).off ( 'copy keydown paste cut' ) ;
	$(root).keydown ( sc.keyhandler ) ;
	$(root).keyup ( sc.keyhandler_up ) ;
	$(root).bind ( "paste" , sc.pasteHandler );
	$(root).live ( 'copy' , function () { sc.cut_copy ( false ) ; } ) ;
	$(root).live ( 'cut' , function () { sc.cut_copy ( true ) ; } ) ;
}

SequenceCanvas.prototype.keyhandler_up = function ( e ) {
	if ( gentle.is_in_dialog ) return false ;
	var sc = gentle.main_sequence_canvas ;
	sc.metakeys -= sc.modifierCode(e);
}

SequenceCanvas.prototype.keyhandler = function ( e ) {
	if ( e.target.localName == "input" || ( e.target.localName == "textarea" && 'tmp1' != $(e.target).attr('id') ) ) return true ; // Don't touch that
//    if ( e.target.localName != "body") return true; // if it's not the canvas, do default
    
	if ( gentle.is_in_dialog ) return false ;
	var sc = gentle.main_sequence_canvas ;
	var code = (e.keyCode ? e.keyCode : e.which);
//	console.log ( code + "/" + e.metaKey ) ;
	
	var metakey = sc.modifierCode ( e ) ;
	if ( metakey !== 0 ) {
		sc.metakeys = sc.metakeys | metakey;
		return ;
	}
	
	var bpp = sc.end_base - sc.start_base + 1 ;

	if ( code == 90 && e.metaKey ) { // Undo
		e.preventDefault();
		if ( sc.metakeys & cd.metakeys.SHIFT ) gentle.doRedo();
		else gentle.doUndo();
		return ;
	}

	if ( !sc.edit.editing ) { // Keys for view mode
		if ( code == 36 ) { // Start
			sc.ensureBaseIsVisible ( 0 ) ;
			sc.sequence.undo.cancelEditing() ;
		} else if ( code == 35 ) { // End
			sc.ensureBaseIsVisible ( sc.sequence.seq.length-1 ) ;
			sc.sequence.undo.cancelEditing() ;
		} else if ( code == 33 ) { // Page up
			sc.ensureBaseIsVisible ( sc.start_base - bpp ) ;
			sc.sequence.undo.cancelEditing() ;
		} else if ( code == 34 ) { // Page down
			sc.ensureBaseIsVisible ( sc.end_base + bpp ) ;
			sc.sequence.undo.cancelEditing() ;
		} else if ( code == 38 ) { // Cursor up
			sc.ensureBaseIsVisible ( sc.start_base - sc.bases_per_row ) ;
			sc.sequence.undo.cancelEditing() ;
		} else if ( code == 40 ) { // Cursor down
			sc.ensureBaseIsVisible ( sc.end_base + sc.bases_per_row ) ;
			sc.sequence.undo.cancelEditing() ;
		} else if ( code == 8 || code == 46 ) { // Backspace or delete
			sc.sequence.undo.cancelEditing() ;
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
		sc.sequence.undo.cancelEditing() ;
		sc.setEditMode ( false ) ;
		sc.show() ;
		e.preventDefault();
		return ;
	} else if ( code == 33 ) { // Page up
		sc.sequence.undo.cancelEditing() ;
		if ( sc.edit.base < bpp ) {
			if ( sc.edit.base == 0 ) return ;
			sc.edit.base = 0 ;
		} else {
			sc.edit.base -= bpp ;
		}
	} else if ( code == 34 ) { // Page down
		sc.sequence.undo.cancelEditing() ;
		if ( sc.edit.base + bpp >= sc.sequence.seq.length ) {
			if ( sc.edit.base == sc.sequence.seq.length-1 ) return ;
			sc.edit.base = sc.sequence.seq.length-1 ;
		} else {
			sc.edit.base += bpp ;
		}
	} else if ( code == 36 ) { // Start
		sc.sequence.undo.cancelEditing() ;
		if ( sc.edit.base == 0 ) return ;
		sc.edit.base = 0 ;
	} else if ( code == 35 ) { // End
		sc.sequence.undo.cancelEditing() ;
		if ( sc.edit.base == sc.sequence.seq.length-1 ) return ;
		sc.edit.base = sc.sequence.seq.length-1 ;
	} else if ( code == 37 ) { // Cursor left
		sc.sequence.undo.cancelEditing() ;
		if ( sc.edit.base == 0 ) return ;
		sc.edit.base-- ;
	} else if ( code == 38 ) { // Cursor up
		sc.sequence.undo.cancelEditing() ;
		if ( sc.edit.base < sc.bases_per_row ) {
			if ( sc.edit.base == 0 ) return ;
			sc.edit.base = 0 ;
		} else {
			sc.edit.base -= sc.bases_per_row ;
		}
	} else if ( code == 39 ) { // Cursor right
		sc.sequence.undo.cancelEditing() ;
		if ( sc.edit.base > sc.sequence.seq.length ) return ;
		sc.edit.base++ ;
	} else if ( code == 40 ) { // Cursor down
		sc.sequence.undo.cancelEditing() ;
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
	sc.sequence.undo.cancelEditing() ;
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

SequenceCanvas.prototype.editFeature = function ( fid ) {
	var me = this ;
	var sc = gentle.main_sequence_canvas ;
	$('#annot_hover').popover ( 'hide' ) ;
	$('#annot_hover').remove() ;
	$("#selection_context_marker").remove();
	gentle.annotation_editor_dialog = new AnnotationEditorDialogDNA ( sc , fid ) ; // FIXME hardcoded for DNA
}

SequenceCanvas.prototype.fixMenus = function () {
	$('.canvas_tool').remove() ; // Remove all menu entries from other canvases
	$('.toolbar_plugin').each ( function () {
		if ( 0 < $(this).find('li').length ) $(this).show() ;
		else $(this).hide() ;
//		console.log ( $(this).attr('id') + " : " + $(this).find('li').length ) ;
	} ) ;
}

SequenceCanvas.prototype.updateTitleBar = function () {
	var me = this ;
	var name = me.sequence.name ;
	var h = "" ;
	h += "<span class='label label-info'>" + name + "</span>&nbsp;" ;
	h += "<span class='label'>" + me.sequence.seq.length + " bp</span>" ;
	h += "<span class='pull-right'><a href='#' onclick='gentle.closeCurrentSequence();return false' title='Close sequence'><i style='background-color:red' class='icon-remove icon-white' /></a></span>" ;
	
	$('#sequence_canvas_title_bar').html ( h ) ;
}
