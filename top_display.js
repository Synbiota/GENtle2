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
	var oldpos = $('#top_zone').scrollLeft() * gentle.sequences[gentle.current_sequence_entry].seq.length / $('#top_zone').width() ;
	$('#top_zone').html ( this.get_top_zone() ) ;
	var newpos = Math.floor ( oldpos * $('#top_zone').width() / gentle.sequences[gentle.current_sequence_entry].seq.length ) ;
	$('#top_zone').scrollLeft(newpos) ;
	this.update_marker() ;
	this.make_draggable() ;
}


TopDisplayDNA.prototype.make_draggable = function () {
	var me = this ;
	var sc = gentle.sequences[gentle.current_sequence_entry] ;
	var zoom = sc.top_zoom ;
	if ( zoom === undefined ) zoom = 1 ;
	var tw = ( $('#topbox').width() - 30 ) * zoom ;
	var bw = this.horizontal_borders ;

	$('#top_zone_marker').draggable({
		axis: 'x' ,
		containment: 'parent',
		drag: function(event, ui) {
			var left = ui.position.left - bw ;
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
	var sequence = gentle.sequences[gentle.current_sequence_entry] ;
	var html = '' ;
	var zoom = sequence.top_zoom ;
	if ( zoom === undefined ) zoom = 1 ;

	var tw = ( $('#topbox').width() - 30 ) * zoom ;
	var th = $('#topbox').height() ;
	var bw = this.horizontal_borders ;
	
	sequence.top_virtual_width = tw ;
	sequence.top_virtual_borders = bw ;
	
	html += "<div id='top_zone_marker' title='Drag me!'></div>" ;
	
	// Position indicators
	var maxpos = sequence.seq.length * ( $('#topbox').width() - 30 ) / ( tw - bw*2 ) ;
	var every = 1000 ;
	while ( maxpos / ( every * 10 ) > 20 ) every *= 10 ;
	for ( var i = 1 ; i < sequence.seq.length ; i += every ) {
		var pos = i ;
		if ( pos != 1 ) pos-- ;
		var left = Math.floor ( ( tw - bw*2 ) * pos / sequence.seq.length ) + bw ;
		html += "<div class='pos_marker' style='left:"+left+"px'>" + addCommas(pos) + "</div>" ;
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
		
		if ( right < left ) {
			html += "<div class='feature feat_"+cl+"' style='left:"+bw+"px;width:"+(left-bw)+"px;' title='"+desc.replace("'","&quot;")+"'>"+name+"</div>" ; 
			html += "<div class='feature feat_"+cl+"' style='left:"+right+"px;width:"+(tw-bw)+"px;' title='"+desc.replace("'","&quot;")+"'>"+name+"</div>" ; 
		} else {
			html += "<div class='feature feat_"+cl+"' style='left:"+left+"px;width:"+(right-left)+"px;' title='"+desc.replace("'","&quot;")+"'>"+name+"</div>" ; 
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
	var left = Math.floor ( ( tw - bw*2 ) * from / gentle.sequences[gentle.current_sequence_entry].seq.length ) + bw ;
	var right = Math.floor ( ( tw - bw*2 ) * to / gentle.sequences[gentle.current_sequence_entry].seq.length ) + bw ;
	var width = right - left + 1 ;
	$('#top_zone_marker').css ( { left : left , width : width } ) ;
}

TopDisplayDNA.prototype.init = function () {
	html = "" ;
	html += "<div style='position:absolute;right:2px;top:0px;' ><img title='Zoom full' width='24px' onclick='top_display.do_zoom_top(\"full\")' src='icons/full.png'/></div>" ;
	html += "<div style='position:absolute;right:2px;top:25px;'><img title='Zoom out' width='24px' onclick='top_display.do_zoom_top(\"out\")' src='icons/zoom_out.png'/></div>" ;
	html += "<div style='position:absolute;right:2px;top:50px;'><img title='Zoom in' width='24px' onclick='top_display.do_zoom_top(\"in\")' src='icons/zoom_in.png'/></div>" ;
	html += "<div style='position:absolute;right:2px;top:75px;'><img title='Zoom 1:1' width='24px' onclick='top_display.do_zoom_top(\"1:1\")' src='icons/1.png'/></div>" ;
	html += "<div id='top_zone'>" ;
	html += this.get_top_zone() ;
	html += "</div>" ;
	$('#topbox').html ( html ) ;
	this.make_draggable() ;
}

function TopDisplayDNA () {
	this.horizontal_borders = 20 ;
}
