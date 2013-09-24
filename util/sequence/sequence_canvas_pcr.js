//________________________________________________________________________________________
// SC PCR
SequenceCanvasPCR.prototype = new SequenceCanvas() ;
SequenceCanvasPCR.prototype.constructor = SequenceCanvasPCR ;

SequenceCanvasPCR.prototype.onClose = function () {
	//console.log('onclose pcr');
	this.selectionCursor.setVisible(false);
	$('#pcr_main_dialog_container').modal('hide');
	$('#pcr_main_dialog_container').remove() ;
}

SequenceCanvasPCR.prototype.select = function ( from , to , col ) {
	if ( col === undefined ) col = '#CCCCCC' ;
	this.selections = [ { from : from , to : to , fcol : col , tcol : 'black' } ] ;
	this.show() ;
}

SequenceCanvasPCR.prototype.deselect = function () {
	if ( this.selections.length == 0 ) return ;
	this.selections = [] ;
	$('#selection_context_marker').remove() ;
	this.show() ;
}

SequenceCanvasPCR.prototype.cut_copy = function ( do_cut ) {
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
	sc.sequence.undo.addAction ( 'editRemove' , { label : 'cut (-' + len + ')'  , editing : true , action : 'removeText' , base : from , len : len , seq : s } ) ;
	sc.deselect () ;
	sc.sequence.remove ( from , len ) ;
	sc.show () ;
	top_display.init() ;
	if (gentle.main_sequence_canvas.plasmid_map){	gentle.main_sequence_canvas.plasmid_map.updateMap() ; }
	return s ;
}

SequenceCanvasPCR.prototype.fix_touch_event = function ( e ) {
	
	if(e.originalEvent.touches && e.originalEvent.touches.length) {
		e = e.originalEvent.touches[0];
	} else if(e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
		e = e.originalEvent.changedTouches[0];
	}
	return e ;
}

SequenceCanvasPCR.prototype.absorb_event = function (event) { 
	if ( !gentle.is_mobile ) return false ;
	var e = event || window.event;
	e.preventDefault && e.preventDefault();
	e.stopPropagation && e.stopPropagation();
	e.cancelBubble = true;
	e.returnValue = false;
	return false;
}

SequenceCanvasPCR.prototype.on_mouse_up = function ( sc , e ) {
	if (e.button == 2) { e.preventDefault() ; return; } // no right clicks
	var x = e.pageX - parseInt($('#sequence_canvas').offset().left,10) ;
	var y = e.pageY - parseInt($('#sequence_canvas').offset().top,10) ;
	var target = sc.isOver ( x , y ) ;

	sc.selecting = false ;

	// Add selection marker
	if ( undefined !== sc.selectionCursor.x && sc.selections.length == 1) {
	//	console.log ( sc.selection_end_pos.x + " / " + sc.selection_end_pos.y ) ;
		sc.addSelectionMarker ( sc.selectionCursor.x , sc.selectionCursor.y + 14 + $('#canvas_wrapper').scrollTop() ) ;
	}
	sc.selection_end_pos = undefined ;
	
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
	if ( sc.selections.length == 1) {
		gentle.setMenuState ( 'edit_menu_cut' , true ) ;
		gentle.setMenuState ( 'edit_menu_copy' , true ) ;
		gentle.setMenuState ( 'edit_menu_annotate' , true ) ;
		gentle.setMenuState ( 'edit_menu_selection_info', true) ;
		gentle.setMenuState ( 'edit_menu_annotate' , true ) ;
		gentle.setMenuState ( 'edit_menu_remove_selection' , true ) ;
	} else {
		gentle.setMenuState ( 'edit_menu_cut' , false ) ;
		gentle.setMenuState ( 'edit_menu_copy' , false ) ;
		gentle.setMenuState ( 'edit_menu_annotate' , false ) ;	
		gentle.setMenuState ( 'edit_menu_selection_info', false) ;
		gentle.setMenuState ( 'edit_menu_annotate' , false ) ;
		gentle.setMenuState ( 'edit_menu_remove_selection' , false ) ;
	}
	return sc.absorb_event(e) ; 


	/*if ( gentle.is_mobile ) { // DoubleTap
		var t = new Date().getTime();
		if ( sc.last_mouse_down !== undefined && t - sc.last_mouse_down < 500 ) { // 500ms since last touch = double-touch
			return sc.on_double_click ( sc , e ) ;
		}
		sc.last_mouse_down = t ;
	}

	if ( !sc.selecting ) {
		gentle.setMenuState ( 'edit_menu_cut' , false ) ;
		gentle.setMenuState ( 'edit_menu_copy' , false ) ;
		gentle.setMenuState ( 'edit_menu_annotate' , false ) ;
		return ;
	}

	if ( sc.selections[0].from > sc.selections[0].to ) {
		var i = sc.selections[0].from ;
		sc.selections[0].from = sc.selections[0].to ;
		sc.selections[0].to = i ;
	}
	sc.selecting = false ;
	var x = e.pageX - parseInt($('#sequence_canvas').offset().left,10) ;
	var y = e.pageY - parseInt($('#sequence_canvas').offset().top,10) ;
	var target = sc.isOver ( x , y ) ;
	
	gentle.setMenuState ( 'edit_menu_cut' , true ) ;
	gentle.setMenuState ( 'edit_menu_copy' , true ) ;
	gentle.setMenuState ( 'edit_menu_annotate' , true ) ;
	gentle.setMenuState ( 'edit_menu_paste' , false ) ;
	
	// Add selection marker
	if ( undefined !== sc.selectionCursor.x && !sc.edit.editing ) {
	//	console.log ( sc.selection_end_pos.x + " / " + sc.selection_end_pos.y ) ;

		sc.addSelectionMarker ( sc.selectionCursor.x , sc.selectionCursor.y + $('#canvas_wrapper').scrollTop() ) ;
	}
	sc.selection_end_pos = undefined ;
	
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
	
	return sc.absorb_event(e) ;*/
}

SequenceCanvasPCR.prototype.on_mouse_down = function ( sc , e ) {
	if (e.button == 2) { e.preventDefault() ; return; }// no right clicks
	var x = e.pageX - parseInt($('#sequence_canvas').offset().left,10) ;
	var y = e.pageY - parseInt($('#sequence_canvas').offset().top,10) ;
	
	var target = sc.isOver ( x , y ) ;
	

	if (true){ //eventually an edit mode vs. view only mode, for now only edit.
		
		if ( target === null ) { //touched nothing.
			//sc.deselect() ;
			return true ;
		}
		//console.log(target);

		if ( target.line.is_secondary ) return ; // Do not edit secondary!

		//blinker is somewhere in editable region
		sc.selectionCursor.setEnd(target.base) ;
		sc.selectionCursor.line = target.line ;
		if ( ! (sc.metakeys & cd.metakeys.SHIFT)) sc.selectionCursor.start = sc.selectionCursor.end ;
		sc.selecting = true;
		sc.selections = sc.selectionCursor.getSelection();
		sc.edit.base = sc.selectionCursor.getBase() ;
		sc.setEditMode ( true ) ;
		sc.show() ;

		return true ; //sc.absorb_event(e) ;
	}









	/*if ( target === null ) {
		sc.deselect() ;
		return true ;
	}

	$('#selection_context_marker').remove() ;
	sc.last_target = target ;
	if ( sc.edit.editing ) return sc.absorb_event(e) ;
	sc.selecting = true ;
	sc.selections = [ { from : target.base , to : target.base , fcol : '#CCCCCC' , tcol : 'black' , line : target.line } ] ;
	sc.show() ;
	//	$('#sequence_canvas').click().focus();
	return sc.absorb_event(e) ;*/
}


SequenceCanvasPCR.prototype.on_mouse_move = function ( sc , e ) {
	var x = e.pageX - parseInt($('#sequence_canvas').offset().left,10) ;
	var y = e.pageY - parseInt($('#sequence_canvas').offset().top,10) ;
	var target = sc.isOver ( x , y ) ;

	if ( target === null ){ // && !sc.selecting ) {
		if ( !sc.position_is_blank ) gentle.set_hover ( '' ) ; // this.getHoverName()
		sc.position_is_blank = true ;
		$('.temporary_popover_source').popover('hide');
		return ;
	}
	
	if ( undefined === target.text ) gentle.set_hover ( "Position : " + addCommas(target.base+1) ) ;
	else gentle.set_hover ( target.text ) ;
	sc.position_is_blank = false ;

	if ( undefined !== target.onHover ) target.onHover ( target ) ;
	

	if ( !sc.selecting ) return ;

	if ( target.line == sc.selectionCursor.line){
		sc.selectionCursor.setEnd (target.base) ;
		sc.selections = sc.selectionCursor.getSelection() ;
		sc.edit.base = sc.selectionCursor.getBase() ;
	}
	sc.setEditMode ( true ) ;
	sc.show() ;
	return sc.absorb_event(e) ;

	/*if ( target === null ) {
		if ( !sc.position_is_blank ) gentle.set_hover ( '' ) ;
		sc.position_is_blank = true ;
		$('.temporary_popover_source').popover('hide');
		return ;
	}
	if ( undefined === target.text ) gentle.set_hover ( "Position : " + addCommas(target.base+1) ) ;
	else gentle.set_hover ( target.text ) ;
	sc.position_is_blank = false ;
	
	
	if ( undefined !== target.onHover ) target.onHover ( target ) ;
	
	if ( !sc.selecting ) return ;

	if ( sc.selections[0].to == target.base ) return ;
	sc.selections[0].to = target.base ;
	sc.show() ;
	return sc.absorb_event(e) ;*/
}

SequenceCanvasPCR.prototype.on_double_click = function ( sc , e ) {
	sc.selecting = false ;
	sc.selections = [] ;
	var x = e.pageX - parseInt($('#sequence_canvas').offset().left,10) ;
	var y = e.pageY - parseInt($('#sequence_canvas').offset().top,10) ;
	var target = sc.isOver ( x , y ) ;
	//sc.last_target = target ;
	
	/*if ( target === null ) { // Not clicked on a target
		if ( sc.edit.editing ) { // Turn off editing
			sc.setEditMode ( false ) ;
			sc.show() ;
		}
		$('#soft_keyboard').dialog ( 'close' ) ;
		return ;
	}
	if ( target.line.is_secondary ) return ; // Do not edit secondary!
	sc.edit = { line : target.line , base : target.base } ;
	sc.setEditMode ( true ) ;
	gentle.setMenuState ( 'edit_menu_cut' , false ) ;
	gentle.setMenuState ( 'edit_menu_copy' , false ) ;
	gentle.setMenuState ( 'edit_menu_annotate' , false ) ;
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
	
	
	
	return sc.absorb_event(e) ;*/
}

SequenceCanvasPCR.prototype.sim_key = function ( s , mk ) {
	var e = {} ;
	e.keyCode = s.charCodeAt(0) ;
	e.metaKey = mk ;
	e.preventDefault = function () {} ; // Fake
	e.stopPropagation = function () {} ; // Fake
	e.target = { localName : 'div' } ;
	this.keyhandler ( e ) ;
}

SequenceCanvasPCR.prototype.init = function () {
	var sc = this ;
	var cw = $('#canvas_wrapper').offset() ;
	var w = $('#canvas_wrapper').width()-20 ; // A guess to scrollbar width
	var h = $('#canvas_wrapper').height() ;
	$('#sequence_canvas').css ( { top:cw.top , left:cw.left , width:w , height:h } ) ;
	$('#canvas_wrapper').css ( { 'max-height' : h } ) ;
	$('#sequence_canvas_title_bar').css ( { width:w } ) ;
	
	sc.updateTitleBar() ;
	
	// Select
	sc.selecting = false ;
	sc.selections = [] ;

	// Selection Cursor (not yet sure if this makes sense, but we'll leave it in for the moment)
	sc.selectionCursor = new SelectionCursor();
	sc.selectionCursor.toggleOverwrite();
	
	if ( gentle.is_mobile ) {
		$('#sequence_canvas_overlay').bind ( 'touchstart' , function(e){return sc.on_mouse_down(sc,sc.fix_touch_event(e))} ) ;
		$('#sequence_canvas_overlay').bind ( 'touchend' , function(e){return sc.on_mouse_up(sc,sc.fix_touch_event(e))} ) ;
		$('#sequence_canvas_overlay').bind ( 'touchmove' , function(e){return sc.on_mouse_move(sc,sc.fix_touch_event(e))} ) ;
		$('#sequence_canvas_overlay').bind ( 'touchcancel' , sc.absorb_event ) ;
	} else {
		$('#sequence_canvas_overlay').mousedown ( function(e){return sc.on_mouse_down(sc,e)} ) ;
		$('#sequence_canvas_overlay').mouseup ( function(e){return sc.on_mouse_up(sc,e)} ) ;
		$('#sequence_canvas_overlay').mousemove ( function(e){return sc.on_mouse_move(sc,e)} ) ;
	}
	
	// Double-click for editing
	$('#sequence_canvas_overlay').dblclick ( function(e){return sc.on_double_click(sc,e)} ) ;
	
	
	// Keys
	sc.bindKeyboard() ;
	
	// Sequence hover event
	$('#sequence_canvas_overlay').mousemove ( function ( e ) {
		var x = e.pageX - parseInt($('#sequence_canvas').offset().left,10) ;
		var y = e.pageY - parseInt($('#sequence_canvas').offset().top,10) ;
		var target = sc.isOver ( x , y ) ;
		sc.last_target = target ;
		if ( target === null ) return ;
		//	console.log ( target.base + 1 ) ;
	} ) ;

	// Window resize event
	$(window).resize ( gentle.on_resize_event ) ;
	
	// Attach mouse wheel event to canvas
	$('#sequence_canvas_overlay').mousewheel(function(event, delta, deltaX, deltaY) {
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
			//	o.preventDefault();
			return true ;
		}
		var oy = $('#canvas_wrapper').scrollTop() ;
		sc.yoff = oy ;
		sc.show() ;
	} ) ;
}

SequenceCanvasPCR.prototype.recalc = function () {
	$.each ( this.lines , function ( k , v ) {
		v.init() ;
	} ) ;
	this.sequence.updatePCRproduct() ;
}

SequenceCanvasPCR.prototype.isOver = function ( x , y ) {
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

SequenceCanvasPCR.prototype.show = function () {
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
	
	//Get overlay context
	var octx = $('#sequence_canvas_overlay').get(0).getContext('2d');
	octx.canvas.width = w ;
	octx.canvas.height = h ;

	ctx.overlay = octx ;


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

	//update the selectionCursor!
	this.selectionCursor.setContext ( octx );
	var is_editing_this = this.edit.editing;
	if (this.edit.editing && this.start_base <= this.selectionCursor.end && this.selectionCursor.end <= this.end_base+1 ){
		//calculate cursor location:
		this.selectionCursor.setVisible(true);

	}else {
		//hide the cursor
		this.selectionCursor.setVisible(false);
	}

	pixel_height = Math.floor ( ( this.sequence.seq.length + this.bases_per_row ) / this.bases_per_row ) * pixel_height ;
	if ( $('#main_slider').height() != pixel_height ) $('#main_slider').height ( pixel_height ) ;
	
	top_display.update_marker() ;
	if (gentle.main_sequence_canvas.plasmid_map){	gentle.main_sequence_canvas.plasmid_map.updateSelection() ; }

	var unixtime_ms2 = new Date().getTime();
	//	console.log ( "Time : " + ( unixtime_ms2 - unixtime_ms ) + " ms" ) ;
}

SequenceCanvasPCR.prototype.getLineIndex = function ( type ) {
	var ret ;
	$.each ( this.lines , function ( k , v ) {
		if ( v.type == type ) ret = k ;
	} ) ;
	return ret ;
}

SequenceCanvasPCR.prototype.update_display = function () {
	var sc = gentle.main_sequence_canvas ;
	sc.update_display_aa() ;
	sc.update_display_res() ;
	var show_numbering = $('#cb_display_numbering').is(':checked');
	var show_annotation = $('#cb_display_annotation').is(':checked');
	var show_blank = true;//$('#cb_display_blank').is(':checked');
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

	if ( sc.sequence.spectrum && sc.lines[sc.lines.length-1].type != 'spectrum' ) {
		sc.lines.push ( new SequenceCanvasRowSpectrum ( sc ) ) ;
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

SequenceCanvasPCR.prototype.update_display_aa = function () {
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

SequenceCanvasPCR.prototype.update_display_res = function () {
	var show_res = $('#show_res').is(':checked');
	if ( show_res ) {
		$('.re_options input').removeAttr('disabled');
		$('#re_manual').removeAttr('disabled');
	} else {
		$('.re_options input').attr('disabled','disabled');
		$('#re_manual').attr('disabled','disabled');
	}
}


SequenceCanvasPCR.prototype.getSettings = function () {
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


SequenceCanvasPCR.prototype.applySettings = function ( settings ) {
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
		var is_primary = v.type.substr(0,6)=='primer' ;
		switch ( v.type ) {
			case 'blank' : me.lines[k] = new SequenceCanvasRowBlank ( me , is_primary , v ) ; break ;
			//	case 'spectrum' : me.lines[k] = new SequenceCanvasRowSpectrum ( me , is_primary , v ) ; break ;
			case 'primer1' : me.lines[k] = new SequenceCanvasRowDNA ( me , is_primary , v ) ; me.lines[k].type = 'primer1' ; break ;
			case 'primer2' : me.lines[k] = new SequenceCanvasRowDNA ( me , is_primary , v ) ; me.lines[k].type = 'primer2' ; break ;
			case 'pcr_product' : me.lines[k] = new SequenceCanvasRowDNA ( me , is_primary , v ) ; me.lines[k].type = 'pcr_product' ; me.lines[k].is_secondary = true ; break ;
			case 'dna' : me.lines[k] = new SequenceCanvasRowDNA ( me , is_primary , v ) ; me.lines[k].is_secondary = true ; break ;
			case 'dna_rc' : me.lines[k] = new SequenceCanvasRowDNA ( me , is_primary , v ) ; me.lines[k].type = 'dna_rc' ; break ;
			//	case 'dna_align': me.lines[k] = new SequenceCanvasRowAlign(me, is_primary); break;
			case 'annotation' : me.lines[k] = new SequenceCanvasRowAnnotation ( me , is_primary , v ) ; break ;
			case 'aa' : me.lines[k] = new SequenceCanvasRowAA ( me , is_primary , v ) ; aa_settings = v ; break ;
			case 'res' : me.lines[k] = new SequenceCanvasRowRES ( me , is_primary , v ) ; break ;
			case 'position' : me.lines[k] = new SequenceCanvasRowPosition ( me , is_primary , v ) ; break ;
		} ;
	} ) ;

	var h = "PCR display settings TODO" ;

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

SequenceCanvasPCR.prototype.getHoverName = function () {
	return ( this.sequence.name || '' ) ;
}

SequenceCanvasPCR.prototype.specialKeyEvent = function ( eventName , base ) {
	var me = this ;
	
	if ( eventName == '.' ) {
		if ( me.selectionCursor.line.type == 'primer1' ) {
			me.sequence.primer_sequence_1 = me.sequence.primer_sequence_1.replaceAt ( base , me.sequence.seq[base] ) ;
		} else {
			me.sequence.primer_sequence_2 = me.sequence.primer_sequence_2.replaceAt ( base , rcSequence ( me.sequence.seq[base] ) ) ;
		}
	}
	
	$.each ( me.sequence.primers , function ( k , p ) {
		if ( p.from > base + 1 ) return ;
		if ( p.to < base - 1 ) return ;
		if ( me.selectionCursor.line.type == 'primer1' && p.is_rc ) return ;
		if ( me.selectionCursor.line.type == 'primer2' && !p.is_rc ) return ;
		var s = String ( p.is_rc ? me.sequence.primer_sequence_2 : me.sequence.primer_sequence_1 ) ;
		var middle = Math.floor ( ( p.to + p.from ) / 2 ) ;
		var pos ;
		for ( pos = middle ; pos > 0 && s[pos-1] != ' ' ; pos-- ) ;
		p.from = pos ;
		for ( pos = middle ; pos+1 < s.length && s[pos+1] != ' ' ; pos++ ) ;
		p.to = pos ;
		return false ;
	} ) ;
}

SequenceCanvasPCR.prototype.onPrimerSelect = function ( pid ) {
	var me = this ;
	me.selectedPrimer = pid ;
	me.updateMainDialog () ;

	var target = {
		from : me.sequence.primers[pid].from , 
		to : me.sequence.primers[pid].to ,
		line : me.sequence.primers[pid].is_rc ? me.lines[5] : me.lines[2]
	} ;
	$('#selection_context_marker').remove() ;
	//	me.last_target = target ;
	//if ( me.edit.editing ) return ;
	me.selectionCursor.start = target.from ;
	me.selectionCursor.end = target.to + 1;
	me.selectionCursor.line = target.line ;
	me.selections = me.selectionCursor.getSelection(); //[ { from : target.from , to : target.to , fcol : '#CCCCCC' , tcol : 'black' , line : target.line } ] ;
	me.show() ;
	me.ensureBaseIsVisible ( target.to ) ;
	me.ensureBaseIsVisible ( target.from  + 1) ;
	//	me.select ( me.sequence.primers[pid].from , me.sequence.primers[pid].to ) ;
}

SequenceCanvasPCR.prototype.updateMainDialog = function () {
	var me = this ;
	var h = '' ;
	
	h += "<table class='table cable-condensed'>" ;
	h += "<thead><tr><th/><th>Start</th><th>End</th><th>Length</th><th>Direction</th></tr></thead>" ;
	h += "<tbody>" ;
	$.each ( me.sequence.primers , function ( k , p ) {
		h += "<tr onclick='gentle.main_sequence_canvas.onPrimerSelect(" + k + ");return false'>" ;
		h += "<td>" + (k==me.selectedPrimer?"&Rarr;":"&nbsp;") + "</td>" ;
		h += "<td>" + p.from + "</td>" ;
		h += "<td>" + p.to + "</td>" ;
		h += "<td>" + (p.to-p.from+1) + "</td>" ;
		h += "<td style='text-align:center'>" + (p.is_rc?"&larr;":"&rarr;") + "</td>" ;
		h += "</tr>" ;
	} ) ;
	h += "</tbody>" ;
	h += "</table>" ;
	
	$('#pcr_main_dialog').html ( h ) ;
	$('#pcr_main_dialog').dialog ( { position : { my: "right", at: "right", of: window } } ) ;
}

SequenceCanvasPCR.prototype.showMainDialog = function () {
	//console.log("showMainPCRDialog");
	var me = this ;
	me.selectedPrimer = -1 ;
	$('#pcr_main_dialog_container').remove() ;
	var dialogContainer = $("<div id='pcr_main_dialog_container'></div>");
	$(dialogContainer).load('public/templates/pcr_main_dialog.html', function(){
		dialogContainer.appendTo("#all");
		$('#pcr_main_dialog').dialog ( {
			modal:false , 
			width:'auto' , 
			maxWidth:1200 , 
			closeOnEscape : false ,
			position : { my: "right", at: "right", of: window } ,
			height:'auto'
		});
		me.updateMainDialog() ;
	} ) ;
}

function SequenceCanvasPCR ( the_sequence , canvas_id ) {
	//console.log("new sequenceCanvasPCR") ;
	gentle.main_sequence_canvas = this ; // Ugly but necessary
	this.tools = {} ;
	this.type = 'pcr' ;
	this.keySettings = [ 'primary_line' , 'start_base' , 'end_base' ] ;
	
	
	this.fixMenus() ;
	
	var default_settings = {
		auto : true ,
		primary_line : 2 , 
		lines:[
			{type:"position"},
			{type:"annotation"},
			{type:"primer1"},
			{type:"dna"},
			{type:"dna_rc"},
			{type:"primer2"},
			{type:"pcr_product"},
			{type:"blank"}
		]
	} ;
	var settings = the_sequence.settings ;
	if ( settings === undefined ) settings = {} ;
	$.each ( default_settings , function ( k , v ) {
		if ( undefined === settings[k] ) settings[k] = default_settings[k] ;
	} ) ;
	this.applySettings ( settings ) ;
	the_sequence.updatePCRproduct() ;
	
	this.initSidebar() ;

	this.update_display_aa() ;
	this.update_display_res() ;
	
	the_sequence.undo.updateEditMenu() ;
	gentle.setMenuState ( 'edit_menu_cut' , false ) ;
	gentle.setMenuState ( 'edit_menu_copy' , false ) ;
	gentle.setMenuState ( 'edit_menu_annotate' , false ) ;
	gentle.setMenuState ( 'edit_menu_paste' , false ) ;
	
	//	this.setContextMenuItem ( { id:'cut' , items : [ { callback:function(sc){gentle.do_edit('cut')} , html:'Cut' } ] } ) ;
	//	this.setContextMenuItem ( { id:'copy' , items : [ { callback:function(sc){gentle.do_edit('copy')} , html:'Copy' } ] } ) ;
	//	this.setContextMenuItem ( { id:'delete' , items : [ { callback:function(sc){gentle.delete_selection()} , html:'Remove selected sequence' } ] } ) ;
	//	this.setContextMenuItem ( { id:'annotate' , items : [ { callback:function(sc){gentle.do_annotate()} , html:'Annotate selected sequence' } ] } ) ;
	//	this.setContextMenuItem ( { id:'selection_info' , items : [ { callback:function(sc){gentle.do_selection_info()} , html:'Selection info' } ] } ) ;

	//this.showMainDialog() ;
	this.resizeCanvas();
	
	this.setContextMenuItem ( { id:'edit_selection' , getItems : function ( sc ) {
		var ret = [] ;
		if ( sc !== undefined && sc.selections.length > 0 ) {
			var feats = sc.sequence.getFeaturesInRange ( sc.selections[0].from , sc.selections[0].to ) ;
			$.each ( feats , function ( k , v ) {
				if ( v['_type'] == 'source' ) return ;
				var col = cd.feature_types[gentle.getFeatureType(v['_type'])].col ;
				var name = sc.sequence.getAnnotationName ( v ) ;
				name += ' [<span style="color:' + col + '">' + v['_type'] + '</span>]' ;
				ret.push ( { html : '<i class="icon-edit"></i> ' + name , callback : function () { gentle.main_sequence_canvas.editFeature(k) } , title : 'Edit annotation' } ) ;
				//	h += '<li><a href="#" onclick="gentle.main_sequence_canvas.editFeature('+k+');return false" title="Edit annotation"><i class="icon-edit"></i> ' + name + '</a></li>' ;
			} ) ;
		}
		return ret ;
	} } ) ;
	
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
	
	gentle.set_hover ( '' ) ;
}
