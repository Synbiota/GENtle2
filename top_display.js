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

TopDisplayDNA.prototype.do_zoom_top= function ( how ) {
	var zoom = gentle.sequences[gentle.current_sequence_entry].top_zoom ;
	if ( zoom === undefined ) zoom = 1 ;
	
	if ( how == '1:1' ) zoom = 500 ;
	else if ( how == 'full' ) zoom = 1 ;
	else if ( how == 'in' ) zoom *= 10 ;
	else if ( how == 'out' ) zoom = Math.floor ( zoom / 10 ) ;
	
	// Paranoia
	if ( zoom < 1 ) zoom = 1 ;
	if ( zoom > 1000 ) zoom = 1000 ;
	
	gentle.sequences[gentle.current_sequence_entry].top_zoom = zoom ;
	var tz = this.is_vertical ? $('#top_zone').height() : $('#top_zone').width() ;
	var sc = this.is_vertical ? $('#top_zone').scrollTop() : $('#top_zone').scrollLeft() ;
	var oldpos = sc * gentle.sequences[gentle.current_sequence_entry].seq.length / tz ;
	$('#top_zone').html ( this.get_top_zone() ) ;
	
	tz = this.is_vertical ? $('#top_zone').height() : $('#top_zone').width() ;
	var newpos = Math.floor ( oldpos * tz / gentle.sequences[gentle.current_sequence_entry].seq.length ) ;
	if ( this.is_vertical ) $('#top_zone').scrollTop(newpos) ;
	else $('#top_zone').scrollLeft(newpos) ;
	this.update_marker() ;
	this.make_draggable() ;
}


TopDisplayDNA.prototype.make_draggable = function () {
	var me = this ;
	var sc = gentle.sequences[gentle.current_sequence_entry] ;
	var zoom = sc.top_zoom ;
	if ( zoom === undefined ) zoom = 1 ;
	var tw = ( ( me.is_vertical ? $('#topbox').height() : $('#topbox').width() ) - 30 ) * zoom ;
	var bw = this.horizontal_borders ;

	$('#top_zone_marker').draggable({
		axis: me.is_vertical ? 'y' : 'x' ,
		containment: 'parent',
		drag: function(event, ui) {
			var left = ( me.is_vertical ? ui.position.top : ui.position.left ) - bw ;
			var start = Math.floor ( left * sc.seq.length / ( tw - bw*2 ) ) ; // TODO : Check this works with zoom
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

TopDisplayDNA.prototype.get_top_zone = function () {
	var me = this ;
	var sequence = gentle.sequences[gentle.current_sequence_entry] ;
	var html = '' ;
	var zoom = sequence.top_zoom ;
	if ( zoom === undefined ) zoom = 1 ;

	if ( me.is_vertical ) {
		var p = $('#topbox').position() ;
		$('#topbox').height ( $(window).height() - p.top - 50 ) ; // HACKISH FIXME
	}

	var tw = ( $('#topbox').width() - 30 ) * zoom ;
	var th = $('#topbox').height() ;
	var bw = this.horizontal_borders ;
	var attr_left = 'left' ;
	var attr_width = 'width' ;
	var tbw = $('#topbox').width() ;
	var feat_size = 'height:15px;overflow:hidden' ;
	if ( me.is_vertical ) {
		var q = tw ; tw = th ; th = q ;
//		tw = $('#topbox').width() ;
//		th = ( $('#topbox').height() - 30 ) * zoom ;
		attr_left = 'top' ;
		attr_width = 'height' ;
		tbw = $('#topbox').height() ;
		feat_size = 'width:15px;overflow:show;color:black;' ;
	}
	
	sequence.top_virtual_width = tw ;
	sequence.top_virtual_borders = bw ;
	
	html += "<div id='top_zone_marker' title='Drag me!' style='" ;
	if ( me.is_vertical ) html += "left:0px;right:0px;" ;
	else html += "top:0px;bottom:0px;" ;
	html += "'></div>" ;
	
	// Position indicators
	var maxpos = sequence.seq.length * ( tbw - 30 ) / ( tw - bw*2 ) ;
	var every = 1000 ;
	while ( maxpos / ( every * 10 ) > 20 ) every *= 10 ;
	for ( var i = 1 ; i < sequence.seq.length ; i += every ) {
		var pos = i ;
		if ( pos != 1 ) pos-- ;
		var left = Math.floor ( ( tw - bw*2 ) * pos / sequence.seq.length ) + bw ;
		html += "<div class='pos_marker' style='"+attr_left+":"+left+"px;" ;
		html += me.is_vertical ? "border-top:1px solid black;" : "border-left:1px solid black;" ;
		html += "'>" + addCommas(pos) + "</div>" ;
	}
	
	// Features
	$.each ( sequence.features , function ( k , v ) {
		if ( v['_type'].match(/^source$/i) ) return ;
		if ( undefined === v['_range'] ) return ;
		if ( 0 == v['_range'].length ) return ;
		var base_left = v['_range'][0].from ;
		var base_right = v['_range'][v['_range'].length-1].to ;
		
		var left = Math.floor ( ( tw - bw*2 ) * base_left / sequence.seq.length ) + bw ;
		var right = Math.floor ( ( tw - bw*2 ) * base_right / sequence.seq.length ) + bw ;
		
		var cl = 'other' ;
		if ( v['_type'].match(/^promoter$/i) ) cl = 'promoter' ;
		if ( v['_type'].match(/^gene$/i) ) cl = 'gene' ;
		if ( v['_type'].match(/^CDS$/i) ) cl = 'cds' ;
		
		var name = '' ;
		if ( v['gene'] !== undefined ) name = v['gene'] ;
		else if ( v['product'] !== undefined ) name = v['product'] ;
		else if ( v['name'] !== undefined ) name = v['name'] ;
		name = name.replace(/^"/,'').replace(/"$/,'') ;
		
		var desc = '' ;
		if ( v['note'] !== undefined ) desc = v['note'] ;
		else if ( v['protein'] !== undefined ) desc = v['protein'] ;
		else if ( v['product'] !== undefined ) desc = v['product'] ;
		else if ( v['bound_moiety'] !== undefined ) desc = v['bound_moiety'] ;
		desc = desc.replace(/^"/,'').replace(/"$/,'') ;
		if ( desc != '' ) desc = "\n" + ucFirst ( desc ) ;
		desc = ucFirst ( v['_type'].toLowerCase() ) + desc ;
		desc += "\n(" + (base_left+1) + "-" + (base_right+1) + ")" ;
		
		var po = '' ;
		if ( me.is_vertical ) {
			if ( cl == 'other' ) po = 'left:10px;' ;
			if ( cl == 'gene' ) po = 'left:25px;' ;
			if ( cl == 'cds' ) po = 'left:45px;' ;
			if ( cl == 'promoter' ) po = 'left:45px;' ;
		} else {
			if ( cl == 'other' ) po = 'top:10px;' ;
			if ( cl == 'gene' ) po = 'top:25px;' ;
			if ( cl == 'cds' ) po = 'top:45px;' ;
			if ( cl == 'promoter' ) po = 'top:45px;' ;
		}
		po += feat_size ;
		
		if ( right < left ) {
			html += "<div class='feature feat_"+cl+"' style='"+attr_left+":"+bw+"px;"+attr_width+":"+(left-bw)+"px;"+po+"' title='"+desc.replace("'","&quot;")+"'>"+name+"</div>" ; 
			html += "<div class='feature feat_"+cl+"' style='"+attr_left+":"+right+"px;"+attr_width+":"+(tw-bw)+"px;"+po+"' title='"+desc.replace("'","&quot;")+"'>"+name+"</div>" ; 
		} else {
			html += "<div class='feature feat_"+cl+"' style='"+attr_left+":"+left+"px;"+attr_width+":"+(right-left)+"px;"+po+"' title='"+desc.replace("'","&quot;")+"'>"+name+"</div>" ; 
		}
	} ) ;
	return html ;
}

TopDisplayDNA.prototype.update_marker = function () {
	var from = gentle.main_sequence_canvas.start_base ;
	var to = gentle.main_sequence_canvas.end_base ;
	var zoom = gentle.sequences[gentle.current_sequence_entry].top_zoom ;
	if ( zoom === undefined ) zoom = 1 ;
	var tw = gentle.sequences[gentle.current_sequence_entry].top_virtual_width ;
	var bw = gentle.sequences[gentle.current_sequence_entry].top_virtual_borders ;
	if ( this.is_vertical ) {
		var top = Math.floor ( ( tw - bw*2 ) * from / gentle.sequences[gentle.current_sequence_entry].seq.length ) + bw ;
		var bottom = Math.floor ( ( tw - bw*2 ) * to / gentle.sequences[gentle.current_sequence_entry].seq.length ) + bw ;
		var height = bottom - top + 1 ;
		$('#top_zone_marker').css ( { top : top , height : height } ) ;
	} else {
		var left = Math.floor ( ( tw - bw*2 ) * from / gentle.sequences[gentle.current_sequence_entry].seq.length ) + bw ;
		var right = Math.floor ( ( tw - bw*2 ) * to / gentle.sequences[gentle.current_sequence_entry].seq.length ) + bw ;
		var width = right - left + 1 ;
		$('#top_zone_marker').css ( { left : left , width : width } ) ;
	}
}

TopDisplayDNA.prototype.init = function () {
	html = "" ;
	if ( this.is_vertical ) {
		html += "<div style='float:right'>" ;
		html += "<div style='' ><i class='icon-resize-full' onclick='top_display.do_zoom_top(\"full\")'></i></div>" ;
		html += "<div style='' ><i class='icon-minus' onclick='top_display.do_zoom_top(\"out\")'></i></div>" ;
		html += "<div style='' ><i class='icon-plus' onclick='top_display.do_zoom_top(\"in\")'></i></div>" ;
		html += "<div style='' ><i class='icon-resize-small' onclick='top_display.do_zoom_top(\"1:1\")'></i></div>" ;
		html += "</div>" ;
	} else {
		html += "<div style='position:absolute;right:2px;top:0px;' ><img title='Zoom full' width='24px' onclick='top_display.do_zoom_top(\"full\")' src='icons/full.png'/></div>" ;
		html += "<div style='position:absolute;right:2px;top:25px;'><img title='Zoom out' width='24px' onclick='top_display.do_zoom_top(\"out\")' src='icons/zoom_out.png'/></div>" ;
		html += "<div style='position:absolute;right:2px;top:50px;'><img title='Zoom in' width='24px' onclick='top_display.do_zoom_top(\"in\")' src='icons/zoom_in.png'/></div>" ;
		html += "<div style='position:absolute;right:2px;top:75px;'><img title='Zoom 1:1' width='24px' onclick='top_display.do_zoom_top(\"1:1\")' src='icons/1.png'/></div>" ;
	}

	html += "<div id='top_zone' style='" ;
	if ( this.is_vertical ) {
		html += 'left:0px;top:0px;right:0px;height:'+($(window).height()-100)+'px;' ; // HACK FIXME
	} else {
		html += 'left:0px;top:0px;right:30px;bottom:0px;' ;
	}
	html += "'>" ;
	
	html += this.get_top_zone() ;
	html += "</div>" ;
	$('#topbox').html ( html ) ;
	this.make_draggable() ;
}

function TopDisplayDNA ( is_vertical ) {
	this.is_vertical = is_vertical ;
	this.horizontal_borders = is_vertical ? 0 : 20 ;
}
