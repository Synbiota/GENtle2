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
		var h = "<li><a href='#' onclick='gentle.main_sequence_canvas.tools[\"" + o.name + "\"]." + o.call + "();return false'>" + o.linkTitle + "</a></li>" ;
		$('#'+id+' ul').append(h) ;
		$('#'+id).show() ;
	}
	
	if ( true ) {
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

//________________________________________________________________________________________
// SC DNA
SequenceCanvasDNA.prototype = new SequenceCanvas() ;
SequenceCanvasDNA.prototype.constructor = SequenceCanvasDNA ;

SequenceCanvasDNA.prototype.select = function ( from , to , col ) {
	if ( col === undefined ) col = '#CCCCCC' ;
	this.selections = [ { from : from , to : to , fcol : col , tcol : 'black' } ] ;
	this.show() ;
}

SequenceCanvasDNA.prototype.deselect = function () {
	if ( this.selections.length == 0 ) return ;
	this.selections = [] ;
	this.show() ;
}

SequenceCanvasDNA.prototype.cut_copy = function ( do_cut ) {
	var sc = this ;
	if ( sc.selections.length == 0 ) return ;
	var from = sc.selections[0].from ;
	var to = sc.selections[0].to ;
	if ( from > to ) {
		var i = from ; 
		from = to ;
		to = i ;
	}
	var len = to - from + 1 ;
	var s = sc.sequence.seq.substr ( from , len ) ;
	copyToClipboard ( s ) ;
	if ( !do_cut ) return s ;
	sc.deselect () ;
	sc.sequence.remove ( from , len ) ;
	sc.show () ;
	top_display.init() ;
	return s ;
}

SequenceCanvasDNA.prototype.fix_touch_event = function ( e ) {
	
	if(e.originalEvent.touches && e.originalEvent.touches.length) {
		e = e.originalEvent.touches[0];
	} else if(e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
		e = e.originalEvent.changedTouches[0];
	}
	return e ;
}

SequenceCanvasDNA.prototype.absorb_event = function (event) { 
	if ( !gentle.is_mobile ) return false ;
	var e = event || window.event;
	e.preventDefault && e.preventDefault();
	e.stopPropagation && e.stopPropagation();
	e.cancelBubble = true;
	e.returnValue = false;
	return false;
}

SequenceCanvasDNA.prototype.on_mouse_up = function ( sc , e ) {
	if ( gentle.is_mobile ) { // DoubleTap
		var t = new Date().getTime();
		if ( sc.last_mouse_down !== undefined && t - sc.last_mouse_down < 500 ) { // 500ms since last touch = double-touch
			return sc.on_double_click ( sc , e ) ;
		}
		sc.last_mouse_down = t ;
	}

	if ( !sc.selecting ) {
		gentle.setMenuState ( 'edit_menu_cut' , false ) ;
		gentle.setMenuState ( 'edit_menu_copy' , false ) ;
		return ;
	}

	sc.selecting = false ;
	var x = e.pageX - parseInt($('#sequence_canvas').offset().left,10) ;
	var y = e.pageY - parseInt($('#sequence_canvas').offset().top,10) ;
	var target = sc.isOver ( x , y ) ;
	
	gentle.setMenuState ( 'edit_menu_cut' , true ) ;
	gentle.setMenuState ( 'edit_menu_copy' , true ) ;
	gentle.setMenuState ( 'edit_menu_paste' , false ) ;

	
	// Selection copy/paste hack for non-Chrome desktop browsers
	if ( !gentle.is_chrome && !gentle.is_mobile ) {
		var from = sc.selections[0].from ;
		var to = sc.selections[0].to ;
		if ( from > to ) {
			var i = from ; 
			from = to ;
			to = i ;
		}
		var len = to - from + 1 ;
		var s = sc.sequence.seq.substr ( from , len ) ;
		$('#tmp1').remove() ;
		$('#all').append ( "<textarea style='width:1px;height:1px;position:fixed;bottom:0px;left:-100px;z-index:-50' id='tmp1'>" + s + "</textarea>" ) ;
		$('#tmp1').focus();
		$('#tmp1').select();
	}
	
	return sc.absorb_event(e) ;
}

SequenceCanvasDNA.prototype.on_mouse_down = function ( sc , e ) {
	var x = e.pageX - parseInt($('#sequence_canvas').offset().left,10) ;
	var y = e.pageY - parseInt($('#sequence_canvas').offset().top,10) ;
	var target = sc.isOver ( x , y ) ;
	if ( target === null ) {
		sc.deselect() ;
		return true ;
	}

	sc.last_target = target ;
	sc.selecting = true ;
	sc.selections = [ { from : target.base , to : target.base , fcol : '#CCCCCC' , tcol : 'black' } ] ;
	sc.show() ;
	return sc.absorb_event(e) ;
}


SequenceCanvasDNA.prototype.on_mouse_move = function ( sc , e ) {
	var x = e.pageX - parseInt($('#sequence_canvas').offset().left,10) ;
	var y = e.pageY - parseInt($('#sequence_canvas').offset().top,10) ;
	var target = sc.isOver ( x , y ) ;
	if ( target === null ) {
		if ( !sc.position_is_blank ) gentle.set_hover ( '' ) ;
		sc.position_is_blank = true ;
		return ;
	}
	if ( undefined === target.text ) gentle.set_hover ( "Position : " + addCommas(target.base+1) ) ;
	else gentle.set_hover ( target.text ) ;
	sc.position_is_blank = false ;
	
	if ( !sc.selecting ) return ;

	if ( sc.selections[0].to == target.base ) return ;
	sc.selections[0].to = target.base ;
	sc.show() ;
	return sc.absorb_event(e) ;
}

SequenceCanvasDNA.prototype.on_double_click = function ( sc , e ) {
	sc.selecting = false ;
	sc.selections = [] ;
	var x = e.pageX - parseInt($('#sequence_canvas').offset().left,10) ;
	var y = e.pageY - parseInt($('#sequence_canvas').offset().top,10) ;
	var target = sc.isOver ( x , y ) ;
	sc.last_target = target ;
	if ( target === null ) { // Not clicked on a target
		if ( sc.edit.editing ) { // Turn off editing
			sc.setEditMode ( false ) ;
			sc.show() ;
		}
		$('#soft_keyboard').dialog ( 'close' ) ;
		return ;
	}
	sc.edit = { line : target.line , base : target.base } ;
	sc.setEditMode ( true ) ;
	gentle.setMenuState ( 'edit_menu_cut' , false ) ;
	gentle.setMenuState ( 'edit_menu_copy' , false ) ;
	sc.show() ;
	
	if ( gentle.is_mobile ) {
		var h = "<div id='soft_keyboard' title='Keyboard'>" ;

		h += "<div style='font-size:20pt'>" ;
		h += '<div class="btn-group">' ;
		h += "<button class='btn first-btn' id='skbd_a'>&nbsp;A&nbsp;</button>" ;
		h += "<button class='btn' id='skbd_c'>&nbsp;C&nbsp;</button>" ;
		h += "<button class='btn' id='skbd_g'>&nbsp;G&nbsp;</button>" ;
		h += "<button class='btn' id='skbd_t'>&nbsp;T&nbsp;</button>" ;

		h += "<button class='btn first-btn' id='skbd_left'>&larr;</button>" ;
		h += "<button class='btn' id='skbd_backspace'>⌫</button>" ;
		h += "<button class='btn' id='skbd_delete'>⌦</button>" ;
		h += "<button class='btn' id='skbd_right'>&rarr;</button>" ;
		h += "</div>" ;
		h += "</div>" ;

		h += "</div>" ;
		
		$('#soft_keyboard').remove() ;
		$('#all').append(h) ;
		$('#soft_keyboard').dialog ( { 
			modal : false , 
			autoOpen : true , 
			resizable : false ,
			position : ['center','bottom'] , 
			width : 'auto' ,
			height : 80 ,
			beforeClose: function(event, ui) {
				if ( sc.edit.editing ) { // Turn off editing
					sc.setEditMode ( false ) ;
					sc.show() ;
				}
			}
		} ) ;
		$('#skbd_a').click(function(e){sc.sim_key('A',false)});
		$('#skbd_c').click(function(e){sc.sim_key('C',false)});
		$('#skbd_g').click(function(e){sc.sim_key('G',false)});
		$('#skbd_t').click(function(e){sc.sim_key('T',false)});
		$('#skbd_backspace').click(function(e){sc.sim_key(String.fromCharCode(8),false)});
		$('#skbd_delete').click(function(e){sc.sim_key(String.fromCharCode(46),false)});
		$('#skbd_left').click(function(e){sc.sim_key(String.fromCharCode(37),false)});
		$('#skbd_right').click(function(e){sc.sim_key(String.fromCharCode(39),false)});
//		$('#soft_keyboard .ui-dialog-titlebar').hide();
		return false ;
	}
	
	
/*	if ( gentle.is_mobile ) { // An attempt to invoke the soft keyboard and redirect keystrokes from an input box to the canvas; failed for now
		var h = "<input type='text' id='tmp' style='position:fixed;right:0px;top:0px;' />" ;
		$('#tmp').remove();
		$('#all').append(h) ;
		$('#tmp').focus() ;
		$('#tmp').keydown ( sc.keyhandler ) ;
	}*/
	
	
	return sc.absorb_event(e) ;
}

SequenceCanvasDNA.prototype.sim_key = function ( s , mk ) {
	var e = {} ;
	e.keyCode = s.charCodeAt(0) ;
	e.metaKey = mk ;
	e.preventDefault = function () {} ; // Fake
	e.stopPropagation = function () {} ; // Fake
	this.keyhandler ( e ) ;
}

SequenceCanvasDNA.prototype.bindKeyboard = function () {
	var sc = this ;
	$(document).off ( 'copy keydown paste cut' ) ;
	$(document).keydown ( sc.keyhandler ) ;
	$(document).bind ( "paste" , sc.pasteHandler );
	$(document).live ( 'copy' , function () { sc.cut_copy ( false ) ; } ) ;
	$(document).live ( 'cut' , function () { sc.cut_copy ( true ) ; } ) ;
}

SequenceCanvasDNA.prototype.init = function () {
	var sc = this ;
	var cw = $('#canvas_wrapper').offset() ;
	var w = $('#canvas_wrapper').width()-20 ; // A guess to scrollbar width
	var h = $('#canvas_wrapper').height() ;
	$('#sequence_canvas').css ( { top:cw.top , left:cw.left , width:w , height:h } ) ;
	$('#canvas_wrapper').css ( { 'max-height' : h } ) ;
	
	// Select
	sc.selecting = false ;
	sc.selections = [] ;
	
	if ( gentle.is_mobile ) {
		$('#sequence_canvas').bind ( 'touchstart' , function(e){return sc.on_mouse_down(sc,sc.fix_touch_event(e))} ) ;
		$('#sequence_canvas').bind ( 'touchend' , function(e){return sc.on_mouse_up(sc,sc.fix_touch_event(e))} ) ;
		$('#sequence_canvas').bind ( 'touchmove' , function(e){return sc.on_mouse_move(sc,sc.fix_touch_event(e))} ) ;
		$('#sequence_canvas').bind ( 'touchcancel' , sc.absorb_event ) ;
	} else {
		$('#sequence_canvas').mousedown ( function(e){return sc.on_mouse_down(sc,e)} ) ;
		$('#sequence_canvas').mouseup ( function(e){return sc.on_mouse_up(sc,e)} ) ;
		$('#sequence_canvas').mousemove ( function(e){return sc.on_mouse_move(sc,e)} ) ;
	}
	
	// Double-click for editing
	$('#sequence_canvas').dblclick ( function(e){return sc.on_double_click(sc,e)} ) ;
	
	
	// Keys
	sc.bindKeyboard() ;
	
	// Sequence hover event
	$('#sequence_canvas').mousemove ( function ( e ) {
		var x = e.pageX - parseInt($('#sequence_canvas').offset().left,10) ;
		var y = e.pageY - parseInt($('#sequence_canvas').offset().top,10) ;
		var target = sc.isOver ( x , y ) ;
		sc.last_target = target ;
		if ( target === null ) return ;
//		console.log ( target.base + 1 ) ;
	} ) ;

	// Window resize event
	$(window).resize ( gentle.on_resize_event ) ;
	
	// Attach mouse wheel event to canvas
	$('#sequence_canvas').mousewheel(function(event, delta, deltaX, deltaY) {
		var cur = $('#canvas_wrapper').scrollTop() ;
		var max = $('#canvas_wrapper').height() ;
		$('#canvas_wrapper').scrollTop ( cur - max * deltaY ) ;
		var npos = $('#canvas_wrapper').scrollTop() ;
		if ( npos != cur ) $('#canvas_wrapper').scroll(); // Only update if the position actually changed
	});

	sc.recalc() ;

	$('#canvas_wrapper').scroll ( function ( o ) {
		if ( gentle.is_mobile && sc.selecting ) {
			sc.on_mouse_move ( sc , sc.fix_touch_event(o) ) ;
//			o.preventDefault();
			return true ;
		}
		var oy = $('#canvas_wrapper').scrollTop() ;
		sc.yoff = oy ;
		sc.show() ;
	} ) ;
}

SequenceCanvasDNA.prototype.recalc = function () {
	$.each ( this.lines , function ( k , v ) {
		v.init() ;
	} ) ;
}

SequenceCanvasDNA.prototype.isOver = function ( x , y ) {
	var ret = null ;
	$.each ( this.lines , function ( line_id , line ) {
		var r = line.isOver ( x , y ) ;
		if ( r === null ) return ;
		r.line = line ;
		ret = r ;
		return false ;
	} ) ;
	return ret ;
}

SequenceCanvasDNA.prototype.show = function () {
	if ( this.canvas_id == '' ) return ;
	
	var unixtime_ms = new Date().getTime();
	this.last_target = null ;
	
	// Init
	this.xoff = this.cw ;
	var i = 1 ;
	while ( i < this.sequence.seq.length ) {
		this.xoff += this.cw ;
		i *= 10 ;
	}

	// Get context
	var ctx = $('#'+this.canvas_id).get(0).getContext('2d');
	var w = $('#'+this.canvas_id).width() ;
	var h = $('#'+this.canvas_id).height() ;
	ctx.canvas.width = w ;
	ctx.canvas.height = h ;
	
    this.bases_per_row = 0 ;
	var sc = this ;
	
	// Block height in pixel
	var pixel_height = 0 ;
	$.each ( this.lines , function ( line_id , line ) {
		line.line_id = line_id ;
		line.line_off = pixel_height ;
		pixel_height += line.getHeight() ;
	} ) ;
	sc.block_height = pixel_height ;
	
	// Primary line
	$.each ( this.lines , function ( line_id , line ) {
		if ( !line.is_primary ) return ;
		sc.primary_line = line_id ;
		line.line_number = line_id ;
		line.show ( ctx ) ;
	} ) ;
	this.start_base = this.lines[this.primary_line].start_base ;
	this.end_base = this.lines[this.primary_line].end_base ;

	// Non-primary lines
	$.each ( this.lines , function ( line_id , line ) {
		if ( line_id == sc.primary_line ) return ;
		line.line_number = line_id ;
		line.show ( ctx ) ;
	} ) ;
	
	pixel_height = Math.floor ( ( this.sequence.seq.length + this.bases_per_row ) / this.bases_per_row ) * pixel_height ;
	if ( $('#main_slider').height() != pixel_height ) $('#main_slider').height ( pixel_height ) ;
	
	top_display.update_marker() ;

	var unixtime_ms2 = new Date().getTime();
//	console.log ( "Time : " + ( unixtime_ms2 - unixtime_ms ) + " ms" ) ;
}

SequenceCanvasDNA.prototype.getLineIndex = function ( type ) {
	var ret ;
	$.each ( this.lines , function ( k , v ) {
		if ( v.type == type ) ret = k ;
	} ) ;
	return ret ;
}

SequenceCanvasDNA.prototype.update_display = function () {
	var sc = gentle.main_sequence_canvas ;
	sc.update_display_aa() ;
	sc.update_display_res() ;
	var show_numbering = $('#cb_display_numbering').is(':checked');
	var show_annotation = $('#cb_display_annotation').is(':checked');
	var show_blank = $('#cb_display_blank').is(':checked');
	var show_rc = $('#cb_display_rc').is(':checked');
	var show_res = $('#show_res').is(':checked');
	var do_recalc = false ;
	
	// Numbering
	if ( show_numbering && sc.lines[0].type != 'position' ) {
		sc.lines.splice ( 0 , 0 , new SequenceCanvasRowPosition ( sc ) ) ;
	} else if ( !show_numbering && sc.lines[0].type == 'position' ) {
		sc.lines.splice ( 0 , 1 ) ;
	}
	
	// Annotation
	var ann = sc.getLineIndex('annotation') ;
	if ( show_annotation && undefined === ann ) {
		var b4 = sc.getLineIndex('dna') ;
		if ( b4 > 0 && sc.lines[b4-1].type == 'aa' ) b4-- ;
		sc.lines.splice ( b4 , 0 , new SequenceCanvasRowAnnotation ( sc ) ) ;
		do_recalc = true ;
	} else if ( !show_annotation && undefined !== ann ) {
		sc.lines.splice ( ann , 1 ) ;
	}

	// Restriction enzyme sites
	var res = sc.getLineIndex('res') ;
	if ( show_res && undefined === res ) {
		var x = new SequenceCanvasRowRES ( sc ) ;
		var idx = sc.getLineIndex('dna_rc') ;
		if ( idx === undefined ) idx = sc.getLineIndex('dna') ;
		sc.lines.splice ( idx+1 , 0 , x ) ;
		do_recalc = true ;
		if ( !show_rc ) {
			$('#cb_display_rc').attr('checked',true) ;
			show_rc = true ;
		}
	} else if ( !show_res && undefined !== res ) {
		sc.lines.splice ( res , 1 ) ;
	} else if ( res !== undefined ) { // Option change?
		var sitelen = [] ;
		$.each ( cd.re_s2n , function ( len , enzymes ) {
			if ( $('#re_len_'+len).is(':checked') ) sitelen.push ( len ) ;
		} ) ;
		if ( sitelen.join(',') != sc.lines[res].use_site_lengths.join(',') ) {
			sc.lines[res].use_site_lengths = sitelen ;
			do_recalc = true ;
		}
		if ( $('#re_maxcut').val() != sc.lines[res].maxcut ) {
			sc.lines[res].maxcut = $('#re_maxcut').val() ;
			do_recalc = true ;
		}
		var manual_enzymes = $('#re_manual').val().replace(/\W/g,' ').replace(/\s+/g,' ').split(' ') ;
		if ( manual_enzymes.join(',') != sc.lines[res].manual_enzymes.join(',') ) {
			sc.lines[res].manual_enzymes = manual_enzymes ;
			do_recalc = true ;
		}

	}


	// Reverse-complement strand
	var rc = sc.getLineIndex('dna_rc') ;
	if ( show_rc && undefined === rc ) {
		var x = new SequenceCanvasRowDNA ( sc ) ;
		x.type = 'dna_rc' ;
		sc.lines.splice ( sc.getLineIndex('dna')+1 , 0 , x ) ;
	} else if ( !show_rc && undefined !== rc ) {
		sc.lines.splice ( rc , 1 ) ;
	}

	// Separator line
	if ( show_blank && sc.lines[sc.lines.length-1].type != 'blank' ) {
		sc.lines.push ( new SequenceCanvasRowBlank ( sc ) ) ;
	} else if ( !show_blank && sc.lines[sc.lines.length-1].type == 'blank' ) {
		sc.lines.splice ( sc.lines.length-1 , 1 ) ;
	}

	// Amino acids
	var m1 = $('#sb_display_options input[name=aa_display]:checked').val() ;
	var m2 = $('#sb_display_options input[name=aa_rf]:checked').val() ;
	var rev = $('#aa_reverse').is(':checked') ;
	var aa = sc.getLineIndex('aa') ;
	if ( m1 != 'none' && undefined === aa ) { // Show line
		var naa = new SequenceCanvasRowAA ( sc ) ;
		naa.m1 = m1 ;
		naa.m2 = m2 ;
		naa.rev = rev ;
		sc.lines.splice ( sc.getLineIndex('dna') , 0 , naa ) ;
		do_recalc = true ;
	} else if ( m1 == 'none' && undefined !== aa ) { // Remove line
		sc.lines.splice ( aa , 1 ) ;
	} else if ( undefined !== aa ) {
		if ( sc.lines[aa].m1 != m1 || sc.lines[aa].m2 != m2 || sc.lines[aa].rev != rev ) {
			sc.lines[aa].m1 = m1 ;
			sc.lines[aa].m2 = m2 ;
			sc.lines[aa].rev = rev ;
			do_recalc = true ;
		}
	}
	
	if ( do_recalc ) sc.recalc() ;
	sc.show() ;
}

SequenceCanvasDNA.prototype.update_display_aa = function () {
	var m1 = $('#sb_display_options input[name=aa_display]:checked').val() ;
	var m2 = $('#sb_display_options input[name=aa_rf]:checked').val() ;
	
	if ( m1 == 'three' && m2 == 'all' ) {
		$('#sb_display_options input[name=aa_rf][value=1]').attr('checked',true) ;
		m2 = $('#sb_display_options input[name=aa_rf]:checked').val() ;
	}
	
	if ( m1 == 'none' ) {
		$('#sb_display_options input[name=aa_rf]').attr('disabled', 'disabled');
		$('#aa_reverse').attr('disabled', 'disabled');
	} else {
		$('#sb_display_options input[name=aa_rf]').removeAttr('disabled');
		$('#aa_reverse').removeAttr('disabled');
		
		if ( m1 == 'three' ) $('#aa_rf_all').attr('disabled', 'disabled');
		else $('#aa_rf_all').removeAttr('disabled');
	}
	
}

SequenceCanvasDNA.prototype.update_display_res = function () {
	var show_res = $('#show_res').is(':checked');
	if ( show_res ) {
		$('.re_options input').removeAttr('disabled');
		$('#re_manual').removeAttr('disabled');
	} else {
		$('.re_options input').attr('disabled','disabled');
		$('#re_manual').attr('disabled','disabled');
	}
}


SequenceCanvasDNA.prototype.getSettings = function () {
	var me = this ;
	var settings = {} ;
	
	// Main parameters
	$.each ( me.keySettings , function ( k , v ) {
		if ( undefined !== me[v] ) settings[v] = me[v] ;
	} ) ;
	
	// Per-line parameters
	settings.lines = [] ;
	$.each ( me.lines , function ( k , v ) {
		settings.lines[k] = v.getSettings() ;
	} ) ;
	
	return settings ;
}


SequenceCanvasDNA.prototype.applySettings = function ( settings ) {
	me = this ;

	// Main parameters
	$.each ( me.keySettings , function ( k , v ) {
		if ( undefined !== settings[v] ) me[v] = settings[v] ;
	} ) ;

    this.cw = 9 ;
    this.ch = 10 ;
    this.xoff = 50 ;
	this.lines = [] ;
	
	var aa_settings = { m1 : 'none' , m2 : '1' , reverse : false } ;
	$.each ( settings.lines , function ( k , v ) {
		var is_primary = k == me.primary_line ? true : false ;
		var l ;
		switch ( v.type ) {
			case 'blank' : me.lines[k] = new SequenceCanvasRowBlank ( me , is_primary , v ) ; break ;
			case 'dna' : me.lines[k] = new SequenceCanvasRowDNA ( me , is_primary , v ) ; break ;
			case 'dna_rc' : me.lines[k] = new SequenceCanvasRowDNA ( me , is_primary , v ) ; me.lines[k].type = 'dna_rc' ; break ;
			case 'annotation' : me.lines[k] = new SequenceCanvasRowAnnotation ( me , is_primary , v ) ; break ;
			case 'aa' : me.lines[k] = new SequenceCanvasRowAA ( me , is_primary , v ) ; aa_settings = v ; break ;
			case 'res' : me.lines[k] = new SequenceCanvasRowRES ( me , is_primary , v ) ; break ;
			case 'position' : me.lines[k] = new SequenceCanvasRowPosition ( me , is_primary , v ) ; break ;
		} ;
	} ) ;


	var h = "" ;
	
	h += "<table border=0 cellspacing=0 cellpadding=2 id='display_settings_table'>" ;
	
	h += "<tr><th>Rows</th><td colspan=2 nowrap>" ;
	h += '<div class="btn-group" data-toggle="buttons-checkbox">' ;
	h += "<input type='checkbox' id='cb_display_numbering' " + (this.getLineIndex('position')===undefined?'':'checked') + " /><label class='btn first-btn' for='cb_display_numbering'>Numbering</label>" ;
	h += "<input type='checkbox' id='cb_display_annotation' " + (this.getLineIndex('annotation')===undefined?'':'checked') + " /><label class='btn' for='cb_display_annotation'>Annotation</label>" ;
	h += "<input type='checkbox' id='cb_display_rc' " + (this.getLineIndex('dna_rc')===undefined?'':'checked') + " /><label class='btn' for='cb_display_rc'>Complement</label>" ;
	h += "<input type='checkbox' id='cb_display_blank' " + (this.getLineIndex('blank')===undefined?'':'checked') + " /><label class='btn' for='cb_display_blank'>Separators</label>" ;
	h += "</div>" ;
	h += "</td></tr>" ;

	h += "<tr><th rowspan=2>Amino acids</th><td>Letters</td><td>" ;
	h += '<div class="btn-group" data-toggle="buttons-checkbox">' ;
	h += "<input type='radio' name='aa_display' value='none' id='aa_display_none' /><label class='btn first-btn' for='aa_display_none'>Off</label> " ;
	h += "<input type='radio' name='aa_display' value='one' id='aa_display_one' /><label class='btn' for='aa_display_one'>1</label> " ;
	h += "<input type='radio' name='aa_display' value='three' id='aa_display_three' /><label class='btn' for='aa_display_three'>3</label>" ;
	h += "</div></td></tr>" ;
	h += "<tr><td>Reading frame</td><td>" ;
	h += '<div class="btn-group" data-toggle="buttons-checkbox">' ;
	h += "<input type='radio' name='aa_rf' value='all' id='aa_rf_all' /><label class='btn first-btn' for='aa_rf_all'>all</label> " ;
	h += "<input type='radio' name='aa_rf' value='1' id='aa_rf_1' /><label class='btn first-btn' for='aa_rf_1'>1</label> " ;
	h += "<input type='radio' name='aa_rf' value='2' id='aa_rf_2' /><label class='btn' for='aa_rf_2'>2</label> " ;
	h += "<input type='radio' name='aa_rf' value='3' id='aa_rf_3' /><label class='btn' for='aa_rf_3'>3</label> " ;
	h += "<input type='checkbox' id='aa_reverse' /><label class='btn first-btn' for='aa_reverse'>reverse</label>" ;
	h += "</div></td></tr>" ;


	h += "<tr><th rowspan=3>Restriction enzymes</th>" ;
	h += "<td>" ;
	h += '<div class="btn-group" data-toggle="buttons-checkbox">' ;
	h += "<input type='checkbox' id='show_res' " + (this.getLineIndex('res')===undefined?'':'checked') + " /><label class='btn first-btn' for='show_res'>Show sites</label>" ;
	h += "</div></td>" ;
	h += "<td class='re_options'><input type='number' value='3' id='re_maxcut' size='3' style='width:30px' /><label for='re_maxcut'> max cuts in sequence</label></td>" ;
	h += "</tr><tr>" ;

	h += "<td>Recognition sites</td><td class='re_options'>" ;
	h += '<div class="btn-group" data-toggle="buttons-checkbox">' ;
	var first = true ;
	$.each ( cd.re_s2n , function ( len , enzymes ) {
		h += "<input type='checkbox' id='re_len_" + len + "' /><label class='btn" ;
		if ( first ) {
			h += " first-btn" ;
			first = false ;
		}
		h += "' for='re_len_" + len + "'>" + len + "</label> " ;
	} ) ;
	h += "</div>" ;
	
	h += "</td></tr>" ;

	h += "<tr><td>Manual enzyme list</td><td class='re_options'>" ;
	h += "<textarea id='re_manual' rows='1'></textarea>" ;
	h += "</td></tr>" ;

	h += "</table>" ;

	
	$('#sb_display_options').html ( h ) ;
	$('#sb_display_options').attr ( { title : 'Display options' } ) ;
	
	$('#sb_display_options input:radio[name=aa_display][value='+aa_settings.m1+']').attr('checked',true);
	$('#sb_display_options input:radio[name=aa_rf][value='+aa_settings.m2+']').attr('checked',true);
	if ( aa_settings.reverse ) $('#aa_reverse').attr('checked',true);
	
	if ( this.getLineIndex('res') !== undefined ) this.lines[this.getLineIndex('res')].updateForm() ;

	$('#sb_display_options input').change ( this.update_display ) ;
	$('#re_maxcut').bind("input",this.update_display) ;
	$('#re_manual').keyup(this.update_display) ;
}


function SequenceCanvasDNA ( the_sequence , canvas_id ) {
	gentle.main_sequence_canvas = this ; // Ugly but necessary
	this.tools = {} ;
	this.type = 'dna' ;
	this.keySettings = [ 'primary_line' , 'start_base' , 'end_base' ] ;
	
	var settings = the_sequence.settings ;
	if ( settings === undefined ) settings = {
		auto : true ,
		primary_line : 2 , 
		lines:[
			{type:"position"},
			{type:"annotation"},
			{type:"dna"},
			{type:"blank"}
		]
	} ;
	this.applySettings ( settings ) ;
	
	this.initSidebar() ;

	this.update_display_aa() ;
	this.update_display_res() ;
	
	gentle.setMenuState ( 'edit_menu_cut' , false ) ;
	gentle.setMenuState ( 'edit_menu_copy' , false ) ;
	gentle.setMenuState ( 'edit_menu_paste' , false ) ;
	

	this.canvas_id = 'sequence_canvas' ;
	this.sequence = the_sequence ;
	this.yoff = 0 ;
	this.init () ;
	if ( this.end_base !== undefined ) this.ensureBaseIsVisible ( this.end_base ) ;
	else this.show() ;
	if ( the_sequence.features.length > 0 && settings.auto ) {
		$('#cb_display_annotation').attr('checked',true);
		this.update_display() ;
	}
	
}
