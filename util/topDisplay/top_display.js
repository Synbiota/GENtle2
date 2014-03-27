//________________________________________________________________________________________
// TopDisplay base class
function TopDisplay () {
}

TopDisplay.prototype.do_zoom_top = function ( how ) {
	console.log ( "TopDisplay.prototype.do_zoom_top should never be called!" ) ;
}

//________________________________________________________________________________________
// TopDisplay DNA
TopDisplayDNA.prototype = new TopDisplay () ;
TopDisplayDNA.prototype.constructor = TopDisplayDNA ;

TopDisplayDNA.prototype.make_draggable = function () {
	var me = this ;
	var sc = gentle.sequences[gentle.current_sequence_entry] ;

	$('#top_zone_marker').draggable({
		axis: 'y' ,
		containment: 'parent',
		drag: function(event, ui) {
			var start = me.y2pos ( ui.position.top ) ;
			
			if ( start < 0 ) start = 0 ;
			var stop = start + ( gentle.main_sequence_canvas.end_base - gentle.main_sequence_canvas.start_base ) ;
			while ( stop >= sc.seq.length ) {
				start-- ;
				stop-- ;
			}
			gentle.main_sequence_canvas.ensureBaseIsVisible ( start ) ;
			gentle.main_sequence_canvas.ensureBaseIsVisible ( stop ) ;
//			console.log ( start + " - " + stop ) ;
		} ,
		stop: function(event, ui) {
			me.update_marker() ;
		}
	});
}

TopDisplayDNA.prototype.pos2y = function ( pos ) {
	var h = parseInt ( $('#top_zone').css('max-height') ) ;
	var y = Math.floor ( pos * h / this.zoom_equivalent ) ;
	return y ;
}

TopDisplayDNA.prototype.y2pos = function ( y ) {
	var h = parseInt ( $('#top_zone').css('max-height') ) ;
	var pos = Math.floor ( this.zoom_equivalent * y / h ) ;
	//console.log(h,y,pos);
	return pos ;
}

TopDisplayDNA.prototype.get_feature_div = function ( v ) {
	var html = '' ;
	if ( v['_type'].match(/^source$/i) ) return html ;
	if ( undefined === v['_range'] ) return html ;
	if ( 0 == v['_range'].length ) return html ;
	
	// Positions
	var base_start = v['_range'][0].from ;
	var base_end = v['_range'][v['_range'].length-1].to ;

	// Type
	var cl = 'other' ;
	if ( v['_type'].match(/^promoter$/i) ) cl = 'promoter' ;
	else if ( v['_type'].match(/^gene$/i) ) cl = 'gene' ;
	else if ( v['_type'].match(/^CDS$/i) ) cl = 'cds' ;
	else if ( v['_type'].match(/^note$/i) ) cl = 'note' ;
	else if ( v['_type'].match(/^genomikon/i) ) cl = 'genomikon_part' ;
	
	// Name
	var name = '' ;
	if ( v['gene'] !== undefined ) name = v['gene'] ;
	else if ( v['product'] !== undefined ) name = v['product'] ;
	else if ( v['name'] !== undefined ) name = v['name'] ;
	name = name.replace(/^"/,'').replace(/"$/,'') ;
	
	// Description
	var desc = '' ;
	if ( v['note'] !== undefined ) desc = v['note'] ;
	else if ( v['protein'] !== undefined ) desc = v['protein'] ;
	else if ( v['product'] !== undefined ) desc = v['product'] ;
	else if ( v['bound_moiety'] !== undefined ) desc = v['bound_moiety'] ;
	desc = desc.replace(/^"/,'').replace(/"$/,'') ;
	if ( desc != '' ) desc = "\n" + ucFirst ( desc ) ;
	desc = ucFirst ( v['_type'].toLowerCase() ) + desc ;
	desc += "\n(" + (base_start+1) + "-" + (base_end+1) + ")" ;
	
	
	var top = this.pos2y ( base_start ) ;
	var bottom = this.pos2y ( base_end ) ;
	
	if ( top > bottom ) {
		var len = gentle.sequences[gentle.current_sequence_entry].seq.length ;
		var max = this.pos2y ( len ) ;
		html += this.get_top_zone_feature_div ( cl , 0 , top , desc , name ) ;
		html += this.get_top_zone_feature_div ( cl , bottom , max , desc , name ) ;
	} else {
		var height = bottom - top + 1 ;
		html += this.get_top_zone_feature_div ( cl , top , height , desc , name ) ;
	}
	
	return html ;
}

TopDisplayDNA.prototype.get_top_zone_feature_div = function ( cl , top , height , desc , name ) {
	var sdesc = desc.replace("'","&quot;") ;
	var sname = "<div style='height:"+height+"px;margin-top:"+Math.floor(height/2)+"px;'><div class='vtext' style='position:relative'>" + name + "</div></div>" ;
	var html = '' ;
	html += "" ;
	html += "<div class='feature feat_"+cl+"' style='top:"+top+"px;height:"+height+"px' title='"+sdesc+"'>" + sname + "</div>" ;
	return html ;
}

TopDisplayDNA.prototype.get_top_zone = function () {
	var me = this ;
	var sequence = gentle.sequences[gentle.current_sequence_entry] ;
	var len = sequence.seq.length ;

	$('#top_zone').height ( me.pos2y ( len ) ) ;

	var html = '' ;
	
	// Top zone marker
	html += "<div id='top_zone_marker' title='Visible sequence' style='left:0px;right:0px'></div>" ;

	// Position indicators
	var maxpos = me.y2pos ( $('#topbox').height() ) ; //len * ( $('#topbox').height() - 30 ) / ( tw - bw*2 ) ;
	//console.log(maxpos);
	var every = 1000 ;
	while ( maxpos / ( every * 10 ) > 20 ) every *= 10 ;
	for ( var i = 1 ; i <= sequence.seq.length ; i += every ) {
		var pos = i ;
		if ( pos != 1 ) pos-- ;
		var y = me.pos2y ( pos ) ;
		if(!(y+30 > $('#topbox').height()))
			html += "<div class='pos_marker' style='top:"+y+"px'>" + addCommas(pos) + "</div>" ;
	}
		
	// Features
	$.each ( sequence.features , function ( k , v ) {
		html += me.get_feature_div ( v ) ;
	} ) ;
	
	var max = me.pos2y ( len ) ;
	html += "<div style='top:0px;left:1px;height:"+max+"px;width:1px;position:absolute'></div>" ;
	
	return html ;
}

TopDisplayDNA.prototype.update_marker = function () {
	var from = gentle.main_sequence_canvas.start_base ;
	var to = gentle.main_sequence_canvas.end_base ;
	var top = this.pos2y ( from ) ;
	var bottom = this.pos2y ( to ) ;
	var height = bottom - top + 1 ;
	$('#top_zone_marker').css ( { top : top , height : height } ) ;
}

TopDisplayDNA.prototype.do_zoom_top = function ( how ) {
	var sequence = gentle.sequences[gentle.current_sequence_entry] ;
	var len = sequence.seq.length ;
	
	var min = 500000 ;
	var max = 500 ;
	
	var nz = this.zoom_equivalent ;
	if ( how == 'full' ) {
		nz = len ;
	} else if ( how == 'in' ) {
		nz /= 2 ;
	} else if ( how == 'out' ) {
		nz *= 2 ;
	} else if ( how == '1:1' ) {
		nz = max ;
	}
	
	nz = Math.floor ( nz ) ;
	if ( nz < max ) nz = max ;
	if ( nz > min ) nz = min ;

	this.zoom_equivalent = nz ;
	var h = parseInt ( $('#top_zone').css('max-height') ) ;
	if(this.pos2y(len)+30 < h) {
		while ( this.pos2y(len)+30 < h ) this.zoom_equivalent-- ;
	} else if(this.pos2y(len)+30 > h) {
		while ( this.pos2y(len)+30 > h ) this.zoom_equivalent++ ;
	}
	$('#top_zone').html ( this.get_top_zone() ) ;

	this.update_marker() ;
	this.make_draggable() ;
}

TopDisplayDNA.prototype.init = function () {
	var html = "" ;
	
	// Zoom boxes
//	html += "<div id='zoombox' style='position:absolute;float:right;z-index:99'>" ;
	html += "<div class='top_display_icon'><i class='icon-resize-full' onclick='top_display.do_zoom_top(\"full\")'></i></div>" ;
	html += "<div class='top_display_icon'><i class='icon-minus' onclick='top_display.do_zoom_top(\"out\")'></i></div>" ;
	html += "<div class='top_display_icon'><i class='icon-plus' onclick='top_display.do_zoom_top(\"in\")'></i></div>" ;
	html += "<div class='top_display_icon'><i class='icon-resize-small' onclick='top_display.do_zoom_top(\"1:1\")'></i></div>" ;
//	html += "</div>" ;
	$('#zoombox').html(html);
	$('#zoombox').toggle ( $('#topbox').is(':visible') ) ;

	html = '' ;
	html += "<div id='top_zone' style='left:0px;top:0px;right:0px;max-height:"+($(window).height()-100)+"px;' >" ;
	html += "</div>" ;
	$('#topbox').html ( html ) ;
	$('#top_zone').html ( this.get_top_zone() ) ;
	this.make_draggable() ;
}

function TopDisplayDNA ( is_vertical ) {
	var sequence = gentle.sequences[gentle.current_sequence_entry] ;
	var len = sequence.seq.length ;
	this.zoom_equivalent = len > 50000 ? 50000 : len ;
}
