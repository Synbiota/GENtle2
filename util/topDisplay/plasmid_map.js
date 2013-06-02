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
		$('#plasmid_map_canvas').mouseover ( function(e){ return self.mouseEvent(self, e)} ) ;
		$('#plasmid_map_canvas').mouseout ( function(e){ return self.mouseEvent(self, e)} ) ;
		$('#plasmid_map_canvas').bind ('mousewheel',  function(e, d, dX, dY){ var ev = e; ev.delta = d; ev.deltaX = dX; ev.deltaY = dY; return self.mouseEvent(self, ev)} ) ;
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

	self.canvasOffset = { x: self.context.canvas.width / 2, y:self.context.canvas.height /2};

	// This is silly, but only way I can keep track of 
	// the context's transform, like these guys...
	// http://stackoverflow.com/questions/7395813/html5-canvas-get-transform-matrix
	self.ctm = {
		t:new simple2d.Transform()
	} ;

	self.ctm.translate = function(x, y){
		self.ctm.t = self.ctm.t.mult(simple2d.translate(x, y));
        self.context.translate(x, y);
	}
	self.ctm.rotate = function(t){
		self.ctm.t = self.ctm.t.mult(simple2d.rotate(t));
        self.context.rotate(t);
	}
    self.ctm.setTransform = function(newt){
        self.ctm.t = newt.clone();
        self.context.setTransform(  newt.m[0], 
                                    newt.m[1], 
                                    newt.m[2], 
                                    newt.m[3], 
                                    newt.m[4], 
                                    newt.m[5]
        )
    }


	//centre the context, makes life easier!
    //self.ctm.translate(self.canvasOffset.x, self.canvasOffset.y) ;
   // self.ctm.rotate(Math.PI);
	

	self.radii = {
					currentSelection: {r:10, R:200},
					plasmidCircle: {r:150},
					annotations: {r1:125, r2:140, r3:160, r4:175 },
					linegraph: {r:100},
					lineNumbering: {r:180, R:240}
	};



	//testing rotation
	//self.context.rotate(Math.PI/4);

	var len = sc.sequence.seq.length ;
	self.seqLength = len;

	//init Annotations
	self.updateAnnotations();

	//init gcat angular graph
	self.somePlasmid = new PlasmidMap(sc.sequence.seq,300);
	self.linegraph = new RadialLineGraph(0,0,self.radii.linegraph.r,50,self.somePlasmid.gcat_ratio,'blue');

	// display current selection
	var from = sc.start_base * Math.PI * 2 / len;
	var to = sc.end_base * Math.PI * 2 / len;
	self.currentSelection = new WasherSegment(0,0,self.radii.currentSelection.r,self.radii.currentSelection.R,from,to,'#FFFFC8', 'rgba(0,0,0,0)',false);

	self.zoom(50);
	self.drawMap();
}

PlasmidMapDialog.prototype.updateMap = function () {
	var self = this ;
	var sc = gentle.main_sequence_canvas ;

	var len = sc.sequence.seq.length ;
	self.seqLength = len;

	//re-init annotation
	self.updateAnnotations();

	//re-init gcat angular graph
	self.somePlasmid = new PlasmidMap(sc.sequence.seq,300);
	self.linegraph = new RadialLineGraph(0,0,self.radii.linegraph.r,50,self.somePlasmid.gcat_ratio,'blue');

	//update selection marker
	this.currentSelection.startAngle = sc.start_base * Math.PI * 2 / len;
	this.currentSelection.endAngle = sc.end_base * Math.PI * 2 / len;
	this.currentSelection.innerRadius = self.radii.currentSelection.r
	this.currentSelection.outerRadius = self.radii.currentSelection.R

	self.drawMap();
}

PlasmidMapDialog.prototype.updateAnnotations = function(){
	var self = this ;
	var sc = gentle.main_sequence_canvas ;
	var len = sc.sequence.seq.length ;
	self.seqLength = len;

	self.annotations = [] ;
	$.each ( sc.sequence.features , function ( k , v ) {
		if ( v['_type'] == 'source' ) return ;
		var min = self.radii.annotations.r1 ;
		var max = self.radii.annotations.r4 ;
		var col = '#CCCCCC' ;
		if ( v['_type'] == 'promoter' ) { col='black' ; }
		if ( v['_type'] == 'CDS' ) { col='red' ; min=self.radii.annotations.r3; }
		if ( v['_type'] == 'gene' ) { col='blue' ; max=self.radii.annotations.r2; }

		// Name
		var name = '' ;
		if ( v['gene'] !== undefined ) name = v['gene'] ;
		else if ( v['product'] !== undefined ) name = v['product'] ;
		else if ( v['name'] !== undefined ) name = v['name'] ;
		name = name.replace(/^"/,'').replace(/"$/,'') ;

		$.each( v['_range'] , function ( k2 , v2 ) {
			var f = v2.from * Math.PI * 2 / len ;
			var t = v2.to * Math.PI * 2 / len ;
			self.annotations.push ( { start:f , end:t , colour:col , min:min , max:max, name:name } ) ;
		} ) ;
	} ) ;	

	//re-init segments for annotation
	for (var i = 0; i < self.annotations.length; i++){
		var ann = self.annotations[i];
		self.annotations[i].canvasShape = new WasherSegment(0,0,ann.min,ann.max,ann.start,ann.end, ann.colour, 'black',false);
	}	
}

PlasmidMapDialog.prototype.updateSelection = function () {
	if (! this.mouseTool.dragSelector){
		var sc = gentle.main_sequence_canvas ;
		var len = sc.sequence.seq.length ;
		// display current selection
		this.currentSelection.startAngle = sc.start_base * Math.PI * 2 / len;
		this.currentSelection.endAngle = sc.end_base * Math.PI * 2 / len;
		this.currentSelection.innerRadius = this.radii.currentSelection.r
		this.currentSelection.outerRadius = this.radii.currentSelection.R
		this.drawMap();
	}
}

PlasmidMapDialog.prototype.rotate = function (t) {
    this.ctm.rotate(t) ;
    this.drawMap();
}

PlasmidMapDialog.prototype.drawMap = function () {
	var self = this;
	var sc = gentle.main_sequence_canvas ;
	var len = sc.sequence.seq.length ;

	//clear canvas set bg colour to white
    // using a box defined by our canvas, then pushed through our matrices!
    var p1 = self.ctm.t.invert().mult(new simple2d.Point(0, 0)),
        p2 = self.ctm.t.invert().mult(new simple2d.Point(self.context.canvas.width, 0)),
        p3 = self.ctm.t.invert().mult(new simple2d.Point(self.context.canvas.width, self.context.canvas.height)),
        p4 = self.ctm.t.invert().mult(new simple2d.Point(0, self.context.canvas.height));

	self.context.fillStyle = 'white' ;
    self.context.beginPath();
    self.context.moveTo(p1.x, p1.y);
    self.context.lineTo(p2.x, p2.y);
    self.context.lineTo(p3.x, p3.y);
    self.context.lineTo(p4.x, p4.y);
    self.context.lineTo(p1.x, p1.y);
	self.context.fill();

	//draw line numbers
	var lineNumberIncrement = bestLineNumbering(len, 200) ; 
	var angleIncrement = Math.PI*2 / ( len/lineNumberIncrement) ;
	var r =  - self.radii.lineNumbering.r;
	var R =    - self.radii.lineNumbering.R;
	var textX = - self.radii.lineNumbering.R;
	var textY = -10;

	self.context.save() ;
	self.strokeStyle = '#000' ; 
	self.context.fillStyle = "#000";
	self.context.lineWidth = 1 ;
	self.context.font = "10px Arial";
	self.context.textAlign = 'start';
	self.context.rotate(Math.PI);

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

	/*//draw a circle to represent our plasmid...
	self.context.beginPath();
	self.context.arc(0,0,self.radii.plasmidCircle.r,0,Math.PI*2, true);
	self.context.strokeStyle = 'grey';
	self.context.lineWidth = 15;
	//self.context.fillStyle = 'grey'; //();
	self.context.stroke();
	*/
	self.context.lineWidth = 5;

	//draw annotations
	for (var i = 0; i < self.annotations.length; i++){
		self.annotations[i].canvasShape.draw( self.context );
		self.context.save();
		self.context.fillStyle = "white";
		self.context.textAlign = 'center';
		self.context.font = "12px Arial";

		var midAngle = (self.annotations[i].start + self.annotations[i].end)/2;
		var midR = (self.annotations[i].min + self.annotations[i].max*4)/5;
		drawTextAlongArc(self.context, self.annotations[i].name, 0, 0, midR, midAngle)

		self.context.restore();
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
	var mousePoint = new simple2d.Point(ev.pageX - parseInt($('#plasmid_map_canvas').offset().left,10),
						ev.pageY - parseInt($('#plasmid_map_canvas').offset().top,10)) ;

	var untransposed = mousePoint.clone();
    mousePoint = pmd.ctm.t.invert().mult(mousePoint);



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
		} else if (pmd.mouseTool.rotatDrag == true ){
            var angleChanged = simple2d.angleBetween( pmd.mouseTool.rotatDragStartMouse, pmd.mouseTool.rotatDragTM.invert().mult(untransposed)) *5;
            pmd.ctm.setTransform(pmd.mouseTool.rotatDragTM);
            pmd.ctm.rotate(angleChanged);
            //pmd.mouseTool.rotatDragStartMouse = simple2d.rotate(angleChanged).mult(pmd.mouseTool.rotatDragStartMouse.clone()) ;
            pmd.drawMap();
        }
	} else if (ev.type == "mousedown"){
		if ( pmd.currentSelection.pointWithin(mousePoint) ) {
			pmd.currentSelection.setHighLight(true, 'rgba(255,255,50,.5)');
			pmd.drawMap();

			pmd.mouseTool.dragSelector = true;
			pmd.mouseTool.dragMouseStartAngle = Math.atan2(mousePoint.y,mousePoint.x);
			pmd.mouseTool.dragStartBaseStartAngle = pmd.currentSelection.startAngle;
			pmd.mouseTool.dragStartBaseEndAngle = pmd.currentSelection.endAngle;
		} else {
            //assuming it's background for the moment
            pmd.mouseTool.rotatDrag = true;
            pmd.mouseTool.rotatDragStartMouse = mousePoint.clone();
            pmd.mouseTool.rotatDragTM = pmd.ctm.t.clone() ;
        }
	} else if (ev.type == "mouseup"){

		if ( pmd.mouseTool.dragSelector ) {
				pmd.currentSelection.setHighLight(false);
				pmd.drawMap();

				pmd.mouseTool.dragSelector = false;
		} else if (pmd.mouseTool.rotatDrag){
            pmd.mouseTool.rotatDrag = false;
        }
	} else if (ev.type == "mouseover"){
	} else if (ev.type == "mouseout"){
		//kill whatever action we're doing when the mouse leaves...
		if ( pmd.mouseTool.dragSelector ) {
				pmd.currentSelection.setHighLight(false);
				pmd.drawMap();

				pmd.mouseTool.dragSelector = false;
		} else if (pmd.mouseTool.rotatDrag){
            pmd.mouseTool.rotatDrag = false;
        }
	} else if (ev.type == "mousewheel"){ 
		pmd.zoom(ev.delta);
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
PlasmidMapDialog.prototype.zoom = function(delta){

	//oh goodness this is odd...
	
	var canvas_vector = new simple2d.Point(delta,250);
	var centre_of_context_in_terms_of_canvas = new simple2d.Point(this.ctm.t.m[4], this.ctm.t.m[5]);

	if (canvas_vector.x + centre_of_context_in_terms_of_canvas.x < this.context.canvas.width/2){
		//trying to move further towards centre than we want to allow, thus move exactly to centre.
		this.ctm.setTransform(new simple2d.Transform(this.ctm.t.m[0],this.ctm.t.m[1],this.ctm.t.m[2],this.ctm.t.m[3],this.context.canvas.width/2,this.context.canvas.height/2));
	} else {
		// shift context by canvas_vector... 
		var translation_vector = this.ctm.t.invert().mult(canvas_vector).normalise().mult(-delta*15);
		this.ctm.translate(translation_vector.x, translation_vector.y);
	}

	centre_of_canvas_in_terms_of_context = this.ctm.t.invert().mult(new simple2d.Point( this.context.canvas.width/2 - 2, this.context.canvas.height/2)) ;

	var distance_to_centre = centre_of_canvas_in_terms_of_context.magnitude();
	var min_r = 30;
	var max_r = distance_to_centre + this.context.canvas.width/2 - min_r;

	if (distance_to_centre  > this.context.canvas.width/2 + min_r){
		//centre is off canvas
		min_r = distance_to_centre - this.context.canvas.width/2 + min_r;
	}

	var del_r = max_r - min_r;
	
	this.radii = {
					currentSelection: {r:min_r, R:min_r + del_r*0.87},
					plasmidCircle: {r:min_r + del_r*0.65},
					annotations: {r1:min_r + del_r*0.54, r2:min_r + del_r*0.60, r3:min_r + del_r*0.7, r4:min_r + del_r*0.76 },
					linegraph: {r:min_r + del_r*0.43},
					lineNumbering: {r:min_r + del_r*0.78, R:max_r}
	};

	this.updateMap();
	this.drawMap();
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

function drawTextAlongArc(context, str, centerX, centerY, radius, angle, font) {
	// modified from
	// http://www.html5canvastutorials.com/labs/html5-canvas-text-along-arc-path/
	// so that it works with varying fonts...

    var s;
    var len = str.length;
    var wh = stringWidthHeight(str, font); //gives a little breathing room
    var rad = radius-wh.height;

    var angularWidth = wh.width/rad;


    context.save();
    context.translate(centerX, centerY);
    context.rotate(angle - Math.PI/2);
    context.rotate(angularWidth / 2);
    for(var n = 0; n < len; n++) {
      context.rotate(-angularWidth/len);

      s = str[n];
      context.fillText(s, 0, radius);
    }
    context.restore();
}

var stringWidthHeight = function(str, font) {
	//copied from
	//http://stackoverflow.com/questions/118241/calculate-text-width-with-javascript
	  var f = font || '12px arial',
	      o = $('<div>' + str + '</div>')
	            .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': f})
	            .appendTo($('body')),
	      w = o.width();
	      h = o.height();

	  o.remove();

	  return {width:w,height:h};
}

function bestLineNumbering(bp,radius){

	var min_d = 25;
	var max_d = 100;

	var min_c = Math.floor(2*Math.PI*radius/max_d);
	var max_c = Math.floor(2*Math.PI*radius/min_d);
	var c = min_c;
	var q = [1,2,2.5,5];
	var i = 0;
	var n = Math.floor(Math.log(bp/(q[q.length-1]*(max_c+1)))/Math.log(10));
	var guess = (c+1)*q[i]*Math.pow(10,n);

	while (guess < bp){
		
		if (c < max_c){
			c = c+1;
		}else{
			c = min_c;
			if(i < q.length -1){
				i+=1;
			}else{
				i = 0;
				n += 1;
			}
		}
		guess = (c+1)*q[i]*Math.pow(10,n);
	}

	return q[i]*Math.pow(10,n);
}