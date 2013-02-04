/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. 

Plugin code originally by Shahryar Khalid <shahryar.khalid@gmail.com> & Jimmy Qiu <jqvroom@gmail.com>

*/

String.prototype.replaceAt = function(index, c) {
	return this.substr(0, index) + c + this.substr(index + (c.length === 0 ? 1 : c.length));
};

// Helper class for Alignment
function AlignLine() {
	this.s = ""; // default sequence
	this.v = []; // sequence object
	this.isIdentity = false;
	//this.phylip_id = ;

	this.features = [];
}

AlignLine.prototype.resetSequence = function () {
	//if (this.v.length > 0) this.s = this.v.seq;
	//else this.s = "";	
};

AlignLine.prototype.showFeatures = function () {
	this.features = this.v.features;

};

AlignLine.prototype.hideFeatures = function () {
	this.features = [];
};

AlignLine.prototype.getFeatures = function () {
	return this.features;
};

AlignLine.prototype.hasFeatures = function () {
	return (this.features.length > 0);
};

/**
	@extends Plugin
*/
PluginAlignments.prototype = new Plugin() ;

PluginAlignments.prototype.constructor = PluginAlignments ;

/**
	Opens the find dialog.
	@deprecated in favor of toolbar query box
*/
PluginAlignments.prototype.startDialog = function () {
	// Init
	this.sc = this.getCurrentSequenceCanvas() ;
	if ( this.sc === undefined ) return ; // Paranoia
	this.dna_forward = this.sc.sequence.seq ;
	this.dna_rc = rcSequence ( this.dna_forward ) ;

	// Create dialog
	var h = "<div id='" + this.dialog_id + "'>" ;
	h += "<div><textarea cols='40' rows='5' height='50' id='" + this.query_id + "'></textarea></div>";
	h += "<div><input type='radio' name='algorithms' value='sw' selected='true' CHECKED/>Smith-Waterman<br /></div>";
	h += "<div><input type='radio' name='algorithms' value='nw' selected='true' />Needleman-Wunsch</div>";
	h += "<div><button value='align' size='40' id='" + this.query_id + "_button'>Align</button></div>";
	h += "<div id='"+this.result_id+"' style='max-height:300px;height:300px;overflow:auto'></div>" ;
	h += "</div>" ;

	$('#'+this.dialog_id).remove() ;
	$('#all').append ( h ) ;
	$('#'+this.dialog_id).dialog ( { title : 'Alignments' , width:"auto" } );
	$('#'+this.dialog_id).css ( { 'font-size' : '10pt' } ) ;
	
	var me = this ;
//	sc.unbindKeyboard() ;
	document.querySelector('#'+this.query_id+ "_button").addEventListener("click", function(){me.runAlignment();}) ;
};

PluginAlignments.prototype.runAlignment = function () {
    var sc = gentle.main_sequence_canvas;

    if ($("input:radio[name='algorithms']:checked").val() === 'sw')
        this.alg = this.alg_sw;
    else if ($("input:radio[name='algorithms']:checked").val() === 'nw')
        this.alg = this.alg_nw;
    this.lines = [];
    var sequence1 = sc.sequence.seq;
    var sequence2 = $("#alignment_dialog_query").val();

    var line1 = new AlignLine();
    var line2 = new AlignLine();

    line1.s = sequence1;
    line2.s = sequence2;

    this.lines.push(line1);
    this.lines.push(line2);

    this.recalcAlignments();

    console.log(this.lines[0].s, this.lines[1].s);
    console.log(this.consensusSequence);

    console.log(this.s1_aligned);
    console.log(this.s2_aligned);

    //make a new sequence
    gentle.createNewSequenceForAlignment(this.consensusSequence);


    //Alignment
    sc = gentle.main_sequence_canvas;


    sc.lines.push(new SequenceCanvasRowAlign(sc, false, this.s1_aligned));
    sc.lines.push(new SequenceCanvasRowAlign(sc, false, this.s2_aligned));
    sc.show();

};

/**
  Performs DNA sequence search.
  @param {string} s1 The first sequence to align
  @param {string} s2 The second sequence to align
  @param {bool} is_dna If DNA sequence, true, otherwise false.
  @return {object} Object member array "results" contains up to the first 5000 results. Object member "toomany" indicates there may be more.
*/
PluginAlignments.prototype.needlemanWunsch = function ( seqObject ) {
	return this.matrixAlignment( seqObject, false );
};

PluginAlignments.prototype.smithWaterman = function ( seqObject ) {
	return this.matrixAlignment( seqObject, true);
};

PluginAlignments.prototype.matrixAlignment = function ( seqObject, local) {
	var s1 = seqObject.s1; // local copies
	var s2 = seqObject.s2;
	var a, b;
	var M = s1.length;
	var N = s2.length;

	// Initializing backlink matrix

	//var back = []; // array of arrays
	var blank_b = [];

	while (blank_b.length < N + 1) blank_b.push(0);
	//while (back.length < M + 1) back.pushArray(blank_b);

	// back should be M x N
	// set and allocate back
	// create array
	var back = new Array(M+1);
	for (var i = 0; i < back.length; i++) {
		back[i] = new Array(N+1);
	}

	for (var i = 0; i < M+1; i++) {
		for (var j = 0; j < N+1; j++ ){
			back[i][j] = 0;
		}
	}

	var matrix0 = new Array(N+1); // JQ: these are pointers in Alignment.cpp
	var matrix1 = new Array(N+1);
	var matrix2;

	// Initializing pseudo-matrix (simulated by two altering lines)
	for (a = 0 ; a < N+1 ; a++) matrix1[a] = 0;

	// Filling
	var max = -999999;

	var vi = [];
	var vj = [];

	var mi = M, mj = N;

	for (i = 0; i < M; i++) {
		matrix2 = matrix0;
		matrix0 = matrix1;
		matrix1 = matrix2;
		matrix1[0] = 0;
		for (j = 0; j < N; j++) {
			var x = i + 1;
			var y = j + 1;
			var s = (s1.charAt(i) == s2.charAt(j)) ? this.match : this.mismatch; // match / mismatch scores of class

			// Maxima
			var m1 = matrix0[j] + s;
			var m2 = matrix1[j] + this.gap_penalty;
			var m3 = matrix0[y] + this.gap_penalty;

			// Determining maximum
			var r = m1 > m2 ? m1 : m2;
			r = r > m3 ? r : m3;
			if (local) r = r > 0 ? r : 0;
			matrix1[y] = r;

			if (local && r >= max) {
				if (r > max) {
					max = r;
					mi = x;
					mj = y;
					vi = []; // Question
					vj = [];
				}
				vi.push(x);
				vj.push(y);
			}

			// The way back
			var n = 0;
			if (r == m1) n |= this.back_lu;
			if (r == m2) n |= this.back_up;
			if (r == m3) n |= this.back_left;
			back[x][y] = n;
		}
	}

	// Backtracking
	var o = {};
	o.t1 = "";
	o.t2 = "";
	o.s1 = "";
	o.s2 = "";

	seqObject.t1 = "";
	seqObject.t2 = "";
	seqObject.back = back;

	if (local) {
		for (a = b = 0 ; a < vi.length ; a++) {
			this.matrixBacktrack( back, seqObject, vi[a], vj[a] );
			//back = seqObject.back;
			if (seqObject.t1.length > b) {
				b = seqObject.t1.length;
				mi = vi[a];
				mj = vj[a];
			}
		}
	}
	else {
		mi = M;
		mj = N;
	}

	this.matrixBacktrack( back, seqObject, mi, mj);
	//back = seqObject.back;
	var k1 = "";
	var k2 = "";

	var gap0 = this.gap.charAt(0);
	for (a = b = 0; a < seqObject.t1.length; a++)
		if (seqObject.t1.charAt(a) != gap0) b++;

	k1 = s1.substr(0, mi - b); // Question check end

	for (a = b = 0 ; a < seqObject.t2.length; a++)
		if (seqObject.t2.charAt(a) != gap0) b++;

	k2 = s2.substr(0, mj - b); // Question check end

	while (k1.length < k2.length) k1 = "-" + k1;
	while (k2.length < k1.length) k2 = "-" + k2;
	seqObject.t1 = k1 + seqObject.t1;
	seqObject.t2 = k2 + seqObject.t2;

	// The end
	k1 = s1.substr(mi);
	k2 = s2.substr(mj);
	while (k1.length < k2.length) k1 += "-";
	while (k2.length < k1.length) k2 += "-";
	seqObject.t1 += k1;
	seqObject.t2 += k2;

	seqObject.s1 = seqObject.t1;
	seqObject.s2 = seqObject.t2;
	return max;

};

PluginAlignments.prototype.matrixBacktrack = function (back,
													  seqObject,
													  i, j) {
	seqObject.t1 = "";
	seqObject.t2 = "";
	while (i > 0 || j > 0) {
		if ((back[i][j] & this.back_lu) == this.back_lu) // upper left
		{
			seqObject.t1 = seqObject.s1.charAt(--i) + seqObject.t1;
			seqObject.t2 = seqObject.s2.charAt(--j) + seqObject.t2;
		}
		else if ((back[i][j] & this.back_left) > 0) // left
		{
			seqObject.t1 = seqObject.s1.charAt(--i) + seqObject.t1;
			seqObject.t2 = this.gap + seqObject.t2;
		}
		else if ((back[i][j] & this.back_up) > 0) // up
		{
			seqObject.t1 = this.gap + seqObject.t1;
			seqObject.t2 = seqObject.s2.charAt(--j) + seqObject.t2;
		}
		else break;
	}

};

// Repaint and (maybe) recalculate alignment
PluginAlignments.prototype.redoAlignments = function (doRecalc) {
	if (typeof doRecalc === 'undefined') {
		doRecalc = true;
	}
};

// Calculating alignments; all changes are lost
PluginAlignments.prototype.recalcAlignments = function () {
	// ADD sc functions
	if (!this.keepIdentity) {
		while (this.lines.length && this.lines[this.lines.length - 1].isIdentity)
			this.lines.pop();
	}

	if (this.lines.length === 0) return;

	// Align
	var a;
	line = new AlignLine();

	if (this.lines.length <= 1) // Just one sequence
	{
		this.lines[0].resetSequence();
	}
	else if (this.alg == this.alg_cw) // Clustal-W
	{
		this.generateConsensusSequence(false);
	}
	else {
		//myass ( this.lines.length > 0 , "Alignment::recalcAlignments:internal1" ) ;
		//
		var seqObject = {};        

		for (a = 0 ; a < this.lines.length ; a++) this.lines[a].resetSequence();

		for (a = 1 ; a < this.lines.length ; a++) {
			var s0 = this.lines[0].s;        
			
			// sequence object - pass by reference, s1 and s2 get modified
			seqObject.s1 = s0;
			seqObject.s2 = this.lines[a].s;

			if (this.alg == this.alg_nw)
				this.needlemanWunsch( seqObject );
			else if (this.alg == this.alg_sw)
				this.smithWaterman( seqObject );

			if (this.lines[0].s == seqObject.s1) continue; // No gaps were introduced into first sequence

			var b;
			for (b = 0 ; b <= a ; b++) // All lines get the same length
			{
				while (this.lines[b].s.length < seqObject.s1.length)
					this.lines[b].s += " ";
			}
			for (b = 0 ; b < seqObject.s1.length ; b++) // Insert gaps
			{
				if (this.lines[0].s.charAt(b) != seqObject.s1.charAt(b)) // New gap
				{
					for (var c = 0 ; c < a ; c++) {
						for (var d = seqObject.s1.length - 1 ; d > b && d >= 0 ; d--)
							this.lines[c].s = this.lines[c].s.replaceAt(d, this.lines[c].s.charAt(d - 1));
						//myass ( this.lines[c].s.length() > b , "Alignment::recalcAlignments:internal2" ) ;
						this.lines[c].s = this.lines[c].s.replaceAt(b, "-");
					}
				}
			}

			this.s1_aligned = seqObject.s1;
			this.s2_aligned = seqObject.s2;
		}

		this.generateConsensusSequence(true);
	}
	/*
	for (a = 0 ; a < 1 ; a++) {
		if (!this.lines[a].isIdentity && this.lines[a].v.features.length > 0) // Question in TVector this is annotation, features, etc.
			this.lines[a].showFeatures(); // need fix
	}*/
};


PluginAlignments.prototype.generateConsensusSequence = function (addit) {
	var a, b;
	var line = new AlignLine();

	line.isIdentity = true;
	line.name = 'identity';

	var s = '';
	for (a = 0 ; a < this.lines[0].s.length ; a++) {
		var c = "*";
		for (b = 1 ; b < this.lines.length && c == "*" ; b++) {
			if (this.lines[0].s.charAt(a) != this.lines[b].s.charAt(a)) c = " ";
		}
		s += c;
	}
	line.s = s;

	if (addit) this.lines.push(line);

	this.consensusSequence = this.lines[0].s;

	for (a = 0 ; a < this.consensusSequence.length ; a++) {
		c = [];
		for (b = 0 ; b < 256 ; b++) c[b] = 0;
		for (b = 0 ; b + 1 < this.lines.length ; b++){
			var code = this.lines[b].s.charCodeAt(a);
			c[code]++;	
		}
		this.consensusSequence = this.consensusSequence.replaceAt(a, " ");
		for (b = 0 ; b < 256 ; b++) {
			var f = 100 * c[b];
			f /= this.lines.length - 1;
			if (f >= 60) this.consensusSequence = this.consensusSequence.replaceAt(a, String.fromCharCode(b));
		}
	}
};

PluginAlignments.prototype.invokeOriginal = function (id, pos) {
	// NEED check findOrigin on AlignLine
	//if ()

};

PluginAlignments.prototype.moveUpDown = function (what, where) {
	while (what != where) {
		var a = 1;
		if (what > where) a = -1;
		var dummy = this.lines[what];
		this.lines[what] = this.lines[what + a];
		this.lines[what + a] = dummy;
		what += a;
	}
	this.redoAlignments(false);
};

PluginAlignments.prototype.isDNA = function () {
	var s = "";
	var a, b = 0;
	for (a = 0 ; a < this.lines.length ; a++) {
		if (!this.lines[a].isIdentity) s += this.lines[a].s;
	}

	for (a = 0 ; a < s.length ; a++) {
		var c = s.charAt(a);
		if (c == "N" || c == " " || c == "-") continue;
		if (c == "A" || c == "C" || c == "G" || c == "T") continue;
		b++;
	}

	// Guess : if more than 1/4 of the sequence are not ACTGN, it's an amino acid sequence
	if (b >= this.s.length / 4) return false;
	return true;
};

PluginAlignments.prototype.isAA = function () {
	return !this.isDNA();
};


/**
  A plugin to align two DNA sequences.
  @constructor
*/
function PluginAlignments () {
	this.name = 'alignments' ;
	this.dialog_id = 'alignments_dialog' ;
	this.query_id = this.dialog_id + "_query" ;
	this.result_id = this.dialog_id + "_result" ;
	this.uses_dialog = true ;
	this.dropdown_focusout_cancel = false;

	this.back_left = 1;
	this.back_up = 2;
	this.back_lu = 4;
	this.alg_cw = 0;
	this.alg_sw = 1;
	this.alg_nw = 2;

	this.match = 2; // Match value
	this.mismatch = -1; // Mismatch score
	this.gap_penalty = -2; // Gap penalty
	this.gap = "-";
	this.matrix = "BLOSUM";

	this.dialog_id = 'alignment_dialog';
	this.query_id = this.dialog_id + "_query";
	this.result_id = this.dialog_id + "_result";
	this.lines = [];

	//this.alg = this.alg_sw;
}

// Register plugin
if ( plugins.registerPlugin ( { className : 'PluginAlignments' , url : 'plugins/alignments.js' , name : 'alignments' } ) ) {

	plugins.registerAsTool ( { className : 'PluginAlignments' , module : 'dna' , section : 'sequence' , call : 'startDialog' , linkTitle : 'Alignments' } ) ;

}