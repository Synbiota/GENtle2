function PlasmidMapDialog () {
	var self = this ;
	
	$("#plasmid_map_dialog").remove() ;
	$('#main').append ( '<div id="plasmid_map_dialog" title="Plasmid map">' ) ;
	$('#plasmid_map_dialog').load ( "public/templates/plasmid_map.html" , function () {
		$('#plasmid_map_dialog').dialog ( {
			create: function( event, ui ) { self.updateMap() ; } ,
			position: { my: "right center", at: "right center", of: $('#main') } ,
			close: function( event, ui ) {
				gentle.main_sequence_canvas.show_plasmid_map = false ; // Someone clicked on 'close'
				gentle.plasmidMap ( false ) ;
			} ,
			width:700 ,
			height:550
		} ) ;
	} ) ;
	
	
}

PlasmidMapDialog.prototype.updateMap = function () {
	var self = this ;
	var sc = gentle.main_sequence_canvas ;
	self.somePlasmid = new PlasmidMap(sc.sequence.seq,300);
	var canvas = $('#plasmid_map_canvas').get(0) ;
	var context = canvas.getContext('2d');
	context.canvas.width = parseInt ( $('#plasmid_map').width() ) ;
	context.canvas.height = parseInt ( $('#plasmid_map').height() ) ;
	//centre the context, makes life easier!
	context.translate(canvas.width/2, canvas.height/2);
	//draw a circle to represent our plasmid...
	context.beginPath();
	context.arc(0,0,150,0,Math.PI*2, true);
	context.strokeStyle = 'grey';
	context.lineWidth = 15;
	context.stroke();
	context.lineWidth = 5;
	
	var len = sc.sequence.seq.length ;
	var annotations = [] ;
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
			annotations.push ( { start:f , end:t , colour:col , min:min , max:max } ) ;
		} ) ;
	} ) ;

	//draw segments for annotation
	for (var i = 0; i < annotations.length; i++){
		var ann = annotations[i];
		ann.canvasShape = new WasherSegment(0,0,ann.min,ann.max,ann.start,ann.end, ann.colour, 'black',false);
		ann.canvasShape.draw(context);
	}
	//draw angular graph
	var linegraph = new RadialLineGraph(0,0,100,50,self.somePlasmid.gcat_ratio,'blue');
	linegraph.draw(context);
}


function PlasmidMap(dna,res){
	this.dna = dna;
	//determine quantities of G,C,A,T in chunks, given resolution
	this.gcat_chunks = [];
	var chunk_res = res;
	var chunk_size = Math.ceil(dna.length/chunk_res);
	for (var i = 0; i < chunk_res; i++){
		var chunk;
		if(i!=chunk_res-1){
			chunk = dna.substring(i*chunk_size, (i+1)*chunk_size);
		}else{
			chunk = dna.substring(i*chunk_size);
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

function WasherSegment(centreX, centreY, innerRadius, outerRadius, startAngle, endAngle, fill, stroke, counterClockwise){
	this.centreX = centreX || 0;
	this.centreY = centreY || 0;
	this.innerRadius = innerRadius || 0;
	this.outerRadius = outerRadius || 100;
	this.startAngle = startAngle || 0;
	this.endAngle = endAngle || Math.PI;
	this.counterClockwise = counterClockwise != undefined? counterClockwise : true;
	this.fill = fill || '#FF0000';
	this.stroke = stroke || '#00FF00';
}

WasherSegment.prototype.draw = function(ctx){
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

