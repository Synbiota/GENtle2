function PlasmidMapDialog () {
	var self = this ;
	
	$("#plasmid_map_dialog").remove() ;
	$('#main').append ( '<div id="plasmid_map_dialog" title="Plasmid map">' ) ;
	$('#plasmid_map_dialog').load ( "public/templates/plasmid_map.html" , function () {
		$('#plasmid_map_dialog').dialog ( {
			create: function( event, ui ) { self.initMap() ; } ,
			position: { my: "right center", at: "right center", of: $('#main') } ,
			close: function( event, ui ) {
				gentle.main_sequence_canvas.show_plasmid_map = false ; // Someone clicked on 'close'
				gentle.plasmidMap ( false ) ;
			} ,
			width:700 ,
			height:550
		} ) ;
		$('#plasmid_map_canvas').mousedown ( function(e){ return self.mouseEvent(self, e)} ) ;
		$('#plasmid_map_canvas').mouseup ( function(e){ return self.mouseEvent(self, e)} ) ;
		$('#plasmid_map_canvas').mousemove ( function(e){ return self.mouseEvent(self, e)} ) ;
	} ) ;

}

PlasmidMapDialog.prototype.initMap = function () {
	var self = this ;
	var sc = gentle.main_sequence_canvas ;

	self.mouseTool = {};
	self.mouseTool.drag = false;

	var canvas = $('#plasmid_map_canvas').get(0) ;
	self.context = canvas.getContext('2d');
	self.context.canvas.width = parseInt ( $('#plasmid_map').width() ) ;
	self.context.canvas.height = parseInt ( $('#plasmid_map').height() ) ;
	//centre the context, makes life easier!
	self.context.translate(canvas.width/2, canvas.height/2);
	
	var len = sc.sequence.seq.length ;
	self.seqLength = len;
	self.annotations = [] ;
	$.each ( sc.sequence.features , function ( k , v ) {
		if ( v['_type'] == 'source' ) return ;
		var min = 125 ;
		var max = 175 ;
		var col = '#CCCCCC' ;
		if ( v['_type'] == 'promoter' ) { col='black' ; }
		if ( v['_type'] == 'CDS' ) { col='red' ; min=160; }
		if ( v['_type'] == 'gene' ) { col='blue' ; max=140; }
		$.each( v['_range'] , function ( k2 , v2 ) {
			var f = v2.from * Math.PI * 2 / len ;
			var t = v2.to * Math.PI * 2 / len ;
			self.annotations.push ( { start:f , end:t , colour:col , min:min , max:max } ) ;
		} ) ;
	} ) ;

	//init segments for annotation
	for (var i = 0; i < self.annotations.length; i++){
		var ann = self.annotations[i];
		self.annotations[i].canvasShape = new WasherSegment(0,0,ann.min,ann.max,ann.start,ann.end, ann.colour, 'black',false);
	}

	//init gcat angular graph
	self.somePlasmid = new PlasmidMap(sc.sequence.seq,300);
	self.linegraph = new RadialLineGraph(0,0,100,50,self.somePlasmid.gcat_ratio,'blue');

	// display current selection
	var from = sc.start_base * Math.PI * 2 / len;
	var to = sc.end_base * Math.PI * 2 / len;
	self.currentSelection = new WasherSegment(0,0,10,200,from,to,'#FFFFC8', 'rgba(0,0,0,0)',false);

	self.drawMap();
}

PlasmidMapDialog.prototype.updateMap = function () {
	var self = this ;
	var sc = gentle.main_sequence_canvas ;

	var len = sc.sequence.seq.length ;
	self.seqLength = len;
	self.annotations = [] ;
	$.each ( sc.sequence.features , function ( k , v ) {
		if ( v['_type'] == 'source' ) return ;
		var min = 125 ;
		var max = 175 ;
		var col = '#CCCCCC' ;
		if ( v['_type'] == 'promoter' ) { col='black' ; }
		if ( v['_type'] == 'CDS' ) { col='red' ; min=160; }
		if ( v['_type'] == 'gene' ) { col='blue' ; max=140; }
		$.each( v['_range'] , function ( k2 , v2 ) {
			var f = v2.from * Math.PI * 2 / len ;
			var t = v2.to * Math.PI * 2 / len ;
			self.annotations.push ( { start:f , end:t , colour:col , min:min , max:max } ) ;
		} ) ;
	} ) ;	

	//re-init segments for annotation
	for (var i = 0; i < self.annotations.length; i++){
		var ann = self.annotations[i];
		self.annotations[i].canvasShape = new WasherSegment(0,0,ann.min,ann.max,ann.start,ann.end, ann.colour, 'black',false);
	}

	//re-init gcat angular graph
	self.somePlasmid = new PlasmidMap(sc.sequence.seq,300);
	self.linegraph = new RadialLineGraph(0,0,100,50,self.somePlasmid.gcat_ratio,'blue');

	//update selection marker
	this.currentSelection.startAngle = sc.start_base * Math.PI * 2 / len;
	this.currentSelection.endAngle = sc.end_base * Math.PI * 2 / len;

	self.drawMap();
}

PlasmidMapDialog.prototype.updateSelection = function () {
	if (! this.mouseTool.dragSelector){
		var sc = gentle.main_sequence_canvas ;
		var len = sc.sequence.seq.length ;
		// display current selection
		this.currentSelection.startAngle = sc.start_base * Math.PI * 2 / len;
		this.currentSelection.endAngle = sc.end_base * Math.PI * 2 / len;

		this.drawMap();
	}
}

PlasmidMapDialog.prototype.drawMap = function () {
	var self = this;
	var sc = gentle.main_sequence_canvas ;
	var len = sc.sequence.seq.length ;

	//clear canvas set bg colour to white
	self.context.fillStyle = 'white' ;
	self.context.fillRect (-250, -250, 500, 500);

	//draw line numbers
	var lineNumberIncrement = 1000 ; 
	var angleIncrement = Math.PI*2 / ( len/lineNumberIncrement) ;
	var r = 175;
	var R = 250;
	var textX = 220;
	var textY = 10;

	self.context.save() ;
	self.strokeStyle = '#000' ; 
	self.context.fillStyle = "#000";
	self.context.lineWidth = 1 ;
	self.context.font = "10px Arial";

	for ( var i = 0; i < len/lineNumberIncrement; i++){
		self.context.beginPath()
		self.context.moveTo(r,0);
		self.context.lineTo(R,0);
		self.context.stroke();
		self.context.fillText(i*lineNumberIncrement, textX, textY);
		self.context.rotate(angleIncrement);
	}
	self.context.restore() ;

	//draw the current selection marker first
	self.currentSelection.draw(self.context);

	//draw a circle to represent our plasmid...
	self.context.beginPath();
	self.context.arc(0,0,150,0,Math.PI*2, true);
	self.context.strokeStyle = 'grey';
	self.context.lineWidth = 15;
	self.context.stroke();

	self.context.lineWidth = 5;

	//draw annotations
	for (var i = 0; i < self.annotations.length; i++){
		self.annotations[i].canvasShape.draw( self.context );
	}

	self.linegraph.draw(self.context);

}

PlasmidMapDialog.prototype.exportToPNG = function(){
	var canvas = document.getElementById("plasmid_map_canvas") ;
	var d = canvas.toDataURL("image/png") ;
	window.open('about:blank','image from canvas').document.write("<img src='"+d+"'alt='Plasmid Map'  download='plasmid.png' />");
}

PlasmidMapDialog.prototype.angleToBase = function (angle) {
	var sc = gentle.main_sequence_canvas ;
	var len = sc.sequence.seq.length ;

	return Math.floor(angle * len / ( Math.PI * 2 )); 
}


PlasmidMapDialog.prototype.mouseEvent = function(pmd, ev){
	var mousePoint = { 	x:ev.pageX - parseInt($('#plasmid_map_canvas').offset().left,10) - 250 ,
						y:ev.pageY - parseInt($('#plasmid_map_canvas').offset().top,10) - 250} ;

	if (ev.type == "mousemove"){
		if (pmd.mouseTool.dragSelector){
				var angleChanged = normaliseAngle(Math.atan2(mousePoint.y,mousePoint.x)) - normaliseAngle(pmd.mouseTool.dragMouseStartAngle); 
				pmd.currentSelection.startAngle = pmd.mouseTool.dragStartBaseStartAngle + angleChanged;
				pmd.currentSelection.endAngle =  pmd.mouseTool.dragStartBaseEndAngle + angleChanged;
				if (pmd.currentSelection.startAngle < 0){
					pmd.currentSelection.endAngle = pmd.mouseTool.dragStartBaseEndAngle - pmd.mouseTool.dragStartBaseStartAngle;
					pmd.currentSelection.startAngle = 0;

				} else if (pmd.currentSelection.endAngle > 2*Math.PI){
					pmd.currentSelection.startAngle = 2*Math.PI + pmd.mouseTool.dragStartBaseStartAngle - pmd.mouseTool.dragStartBaseEndAngle;
					pmd.currentSelection.endAngle = 2*Math.PI;
				}
				pmd.drawMap();
				var start = pmd.angleToBase(pmd.currentSelection.startAngle);
				var stop = start + ( gentle.main_sequence_canvas.end_base - gentle.main_sequence_canvas.start_base ) ;
				gentle.main_sequence_canvas.ensureBaseIsVisible (  start) ;
				gentle.main_sequence_canvas.ensureBaseIsVisible (  stop) ;
		}
	} else if (ev.type == "mousedown"){
		if ( pmd.currentSelection.pointWithin(mousePoint) ) {
			pmd.currentSelection.setHighLight(true, 'rgba(255,255,50,.5)');
			pmd.drawMap();

			pmd.mouseTool.dragSelector = true;
			pmd.mouseTool.dragMouseStartAngle = Math.atan2(mousePoint.y,mousePoint.x);
			pmd.mouseTool.dragStartBaseStartAngle = pmd.currentSelection.startAngle;
			pmd.mouseTool.dragStartBaseEndAngle = pmd.currentSelection.endAngle;
		} 
	} else if (ev.type == "mouseup"){

		if ( pmd.mouseTool.dragSelector ) {
				pmd.currentSelection.setHighLight(false);
				pmd.drawMap();

				pmd.mouseTool.dragSelector = false;
		} 
	}


	return pmd.absorb_event(ev);
}

PlasmidMapDialog.prototype.absorb_event = function (event) { 
	if ( !gentle.is_mobile ) return false ;
	var e = event || window.event;
	e.preventDefault && e.preventDefault();
	e.stopPropagation && e.stopPropagation();
	e.cancelBubble = true;
	e.returnValue = false;
	return false;
}


function PlasmidMap(dna,res){
	this.dna = dna ;
	this.res = res ;
	this.updateGcatRatios(dna) ;
}
PlasmidMap.prototype.setDNA = function(dna){
	this.dna = dna ;
	this.updateGcatRatios() ;
}
PlasmidMap.prototype.setRes = function(res){
	this.res = res ;
	this.updateGcatRatios() ;
}
PlasmidMap.prototype.updateGcatRatios = function(){
	//determine quantities of G,C,A,T in chunks, given resolution
	this.gcat_chunks = [] ;
	var chunk_res = this.res ;
	var chunk_size = Math.ceil(this.dna.length/chunk_res);
	for (var i = 0; i < chunk_res; i++){
		var chunk;
		if(i!=chunk_res-1){
			chunk = this.dna.substring(i*chunk_size, (i+1)*chunk_size);
		}else{
			chunk = this.dna.substring(i*chunk_size);
		}
		var gs = chunk.match(/G/g);
		var cs = chunk.match(/C/g);
		var as = chunk.match(/A/g);
		var ts = chunk.match(/T/g);
		var g,c,a,t;
		if(gs){g = gs.length}else{ g = 0};
		if(as){a = as.length}else{ a = 0};
		if(cs){c = cs.length}else{ c = 0};
		if(ts){t = ts.length}else{ t = 0};
		this.gcat_chunks.push({	g:g,
		a:a,
		c:c,
		t:t,
		total:chunk.length});
	}
	this.gcat_ratio = [];
	for (var i =0; i < chunk_res; i++){
		this.gcat_ratio.push((this.gcat_chunks[i].g + this.gcat_chunks[i].c)/this.gcat_chunks[i].total);
	}
}

function normaliseAngle(angle){
	while (angle < 0){
		angle += 2 * Math.PI ;
	}
	while (angle >= 2*Math.PI){
		angle -= 2 * Math.PI ;
	}
	return angle ;
}

function WasherSegment(centreX, centreY, innerRadius, outerRadius, startAngle, endAngle, fill, stroke, counterClockwise){
	this.centreX = centreX || 0;
	this.centreY = centreY || 0;
	this.innerRadius = innerRadius || 0;
	this.outerRadius = outerRadius || 100;
	this.startAngle = normaliseAngle(startAngle) || 0;
	this.endAngle = normaliseAngle(endAngle) || Math.PI;
	this.counterClockwise = counterClockwise != undefined? counterClockwise : true;
	this.fill = fill || '#FF0000';
	this.stroke = stroke || '#00FF00';
	this.highlight = false;
}

WasherSegment.prototype.draw = function(ctx){
	//draws the washer segment on the canvas context provided.
	ctx.beginPath();
	ctx.arc(this.centreX, this.centreY, this.innerRadius, this.startAngle, this.endAngle, this.counterClockwise);
	ctx.lineTo(this.outerRadius*Math.cos(this.endAngle), this.outerRadius*Math.sin(this.endAngle));
	var temp = !this.counterClockwise;
	ctx.arc(this.centreX, this.centreY, this.outerRadius, this.endAngle, this.startAngle, temp);
	ctx.closePath();
	ctx.strokeStyle = this.stroke;
	ctx.fillStyle = this.fill;
	ctx.stroke();
	ctx.fill();
}

WasherSegment.prototype.pointWithin = function(point){
	//returns true if the given point is within the Washer Segment.

	var rel_p = {x: point.x - this.centreX,
				 y: point.y - this.centreY} ;
	var rad_p = { r: Math.sqrt(rel_p.x*rel_p.x + rel_p.y*rel_p.y),
					 theta: normaliseAngle(Math.atan2(rel_p.y,rel_p.x))} ; 

	if ( rad_p.r > this.outerRadius || rad_p.r < this.innerRadius ) return false ;

	var s = this.startAngle ;
	var e =  this.endAngle ;
	var t = rad_p.theta ;

	var t_in_ccw = false;
	if ( s < e && (t < s || e < t) || (e < t && t < s)) t_in_ccw = true;
	if ( this.counterClockwise != t_in_ccw) return false;

	return true;
}

WasherSegment.prototype.setHighLight = function(highlight, fill, stroke){
	if ( highlight ) {
		if ( ! this.highlight ){ 
			this.highlight = true;
			if  ( fill ) {
				this.oldFill = this.fill;
				this.fill = fill;
			}
			if ( stroke ){
				this.oldStroke = this.stroke;
				this.stroke = stroke;
			}
		}
	}else{
		if ( this.highlight ){
			this.highlight = false;
			if ( this.oldFill ){
				this.fill = this.oldFill;
				this.oldFill = false;
			}
			if ( this.oldStroke ){
				this.stroke = this.oldStroke;
				this.oldStroke = false;
			}
		}
	}
}

function RadialLineGraph(centreX, centreY, radius, offset, lineData, fill){
	this.centreX = centreX || 0;
	this.centreY = centreY || 0;
	this.radius = radius || 100;
	this.offset = offset || 10;
	this.lineData = lineData;
	this.fill = fill || 'black';
}

RadialLineGraph.prototype.draw = function(ctx){
	ctx.beginPath();
	//draw arc going arround, ccw
	ctx.arc(this.centreX, this.centreY, this.radius, 0,2*Math.PI, true);
	//determine angle between data points
	var resAngle = 2*Math.PI/this.lineData.length;
	var p0x = this.radius + (this.lineData[0] - 0.5) * this.offset;
	ctx.lineTo(p0x,0);
	for (var i=1; i<this.lineData.length; i++){
		//given data between 0 and 1
		var ld = this.lineData[i]; 
		var rad = this.radius + (ld - 0.5) * this.offset;
		var angle = i*resAngle;
		var px = rad * Math.cos(angle);
		var py = rad * Math.sin(angle);
		ctx.lineTo(px,py);
	}
	ctx.lineTo(p0x,0);
	ctx.closePath();
	ctx.fillStyle = this.fill;
	ctx.fill();
}

