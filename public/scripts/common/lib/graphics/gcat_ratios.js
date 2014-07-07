define(function(require) {

var GCATRatios;

    GCATRatios = function(sequence,res){
	//determine quantities of G,C,A,T in chunks, given resolution
	this.gcat_chunks = [] ;
	this.sequence = sequence;
	this.sequence_length = this.sequence.length();
	this.res = res;
	var chunk_size = Math.ceil(this.sequence_length/this.res);
	var chunk_res = Math.ceil(this.sequence_length/chunk_size),
					chunk, gs, cs, as, ts, g, c, a, t;

	for (var i = 0; i < chunk_res; i++){
	    chunk;
		if(i!=chunk_res-1){
			chunk = this.sequence.getSubSeq(i*chunk_size, (i+1)*chunk_size);
		}else{
			chunk = this.sequence.getSubSeq(i*chunk_size);
		}
		gs = chunk.match(/G/g);
		cs = chunk.match(/C/g);
		as = chunk.match(/A/g);
		ts = chunk.match(/T/g);
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

return GCATRatios;

});

