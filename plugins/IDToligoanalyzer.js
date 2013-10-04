
// This should allow you to order the highlighted sequence from the IDT website.

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Author: Fitzgerald Steele, Jr.
// Copyright 2012. Integrated DNA Technologies.

// Make sure the Array reduce() method is available
if (!Array.prototype.reduce) {
  Array.prototype.reduce = function reduce(accumulator){
    if (this===null || this===undefined) throw new TypeError("Object is null or undefined");
    var i = 0, l = this.length >> 0, curr;
 
    if(typeof accumulator !== "function") // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
      throw new TypeError("First argument is not callable");
 
    if(arguments.length < 2) {
      if (l === 0) throw new TypeError("Array length is 0 and no second argument");
      curr = this[0];
      i = 1; // start accumulating at the second element
    }
    else
      curr = arguments[1];
 
    while (i < l) {
      if(i in this) curr = accumulator.call(undefined, curr, this[i], i, this);
      ++i;
    }
 
    return curr;
  };
}

PluginBuySequence.prototype = new Plugin() ;
PluginBuySequence.prototype.constructor = PluginBuySequence ;
PluginBuySequence.prototype.BuySequence = function () {
    
    
    //Find selected bases
    var me = this ;
    //console.log(me);
    me.sc = this.getCurrentSequenceCanvas() ;
    if ( me.sc === undefined ) return ; // Paranoia
	if ( me.sc.selections.length === 0){
		alert("Select some bases to view in OligoAnalyzer.");
		return;
	} 
    var sel_from = me.sc.selections[0].from;
    var sel_to = me.sc.selections[0].to;
    var oligo_string = me.sc.sequence.seq.slice(sel_from, sel_to + 1);
    var sequence_label = "Sequence";
    var oligo_complement = "";
    
	function analyze_sequence (seq) {
        // Reset UI to known state
        $('span[id*="idt"]').text('');
        $('#idt-messages').hide();
        $('#idt-oligoanalyzer .modal-footer').show();
        // Show the loading spinner
        $('#idt-ajax-throbber, #idt-self-dimer-ajax-throbber').show();
        //Remove any whitespace
        var v=escape(seq.replace(/\s+/g, ''));
	    // Call the webservice and populate the fields
	    var analyze_sequence_wsurl = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'http%3A%2F%2Fwww.idtdna.com%2FAnalyzerService%2FAnalyzerService.asmx%2FAnalyze%3FSequence%3D"+v+"%26TargetType%3DDNA%26OligoConc%3D0.25%26NaConc%3D50%26MgConc%3D0%26dNTPsConc%3D0'&format=json&diagnostics=true&callback=?"
        var self_dimer_wsurl = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D'http%3A%2F%2Fwww.idtdna.com%2FAnalyzerService%2FAnalyzerService.asmx%2FSelfDimer%3FSequence%3D"+v+"'&format=json&diagnostics=true&callback=?"
		var result = null;
        var jqxhr = $.getJSON(analyze_sequence_wsurl)
            // Populate the fields
            .success(function(data) {
                //console.log('2nd success');
                result = data.query.results.AnalyzerResult;
                if (result.Errors != null) {
                    var msg 
                    $('#idt-messages').show();
                    $("#idt-messages").html('<i class="icon icon-warning-sign" /> ' + result.Errors.AnalyzerError.ErrorText);
                    $('#idt-oligoanalyzer .modal-footer').hide();
                    return;
                }
    			$('#sequence-label').text(sequence_label);
    			$('#idt-sequence').text(result.Sequence);
    			$('#view-complement').attr("data-sequence",result.Complement);
                $('#idt-length').text(result.SequenceLength);
                $('#idt-gc').text(result.GCPctg);
                $('#idt-tm').text(result.MeltTemp);
                $('#idt-mol-weight').text(result.MolecularWeight);
                $('#idt-extinction-coefficient').text(result.ExtCoeff);
                $('#idt-nmole').text(result.nMolePerOD);
                $('#idt-microgram').text(result.uGramsPerOD);
    			
    			// Set the URLs for ordering and oligo analyzer
    		    $("#open-in-oligoanalyzer").attr({
    		        'href':"https://www.idtdna.com/analyzer/Applications/OligoAnalyzer/?seq="+oligo_string,
    		        'target':"_blank"
    		    });
    		    
    		    $("#order-from-idt").attr({
    		        'href':'https://www.idtdna.com/Order/OrderEntry.aspx?seq='+oligo_string,
    		        'target':"_blank"
    		    });
            })
            .complete(function() {
                // Hide the loading spinner
                $('#idt-ajax-throbber').hide();
                $('.modal-body').effect("highlight");
            });
			
			var dimer_jqxhr = $.getJSON(self_dimer_wsurl)
			.success(function(data) {
				var msg = "Setting the message";
				var num_strong_g = -1;
				var res = data.query.results;
				if (res == null) {
					msg='<i class="icon-warning-sign"/> Oops! There was a problem checking for self-dimers. You can try again, or View in OligoAnalyzer';
					$('#idt-self-dimer-msg').html(msg);
					return; 
				};
				// Count how many results have a DeltaG < -9.0
				num_strong_g = res.TDuplexResults.DimerInfo.TDuplexMatch.reduce(function(prev, curr, ind,arr){
					var is_too_strong = 0;
					var TOO_STRONG = -9.0;
					if(curr.DeltaG <= TOO_STRONG){
						is_too_strong = 1;
					}
					return prev + is_too_strong;
				},0);
				if (num_strong_g == 0) {
					msg = '<i class="icon-ok-circle"/> No self dimers with strong &Delta;G values.';
				} else	if (num_strong_g > 0) {
					msg = '<i class="icon-warning-sign"/> We found <strong>'+ num_strong_g+' self-dimers</strong> with very strong ΔG (&gt; -9 kcal/mol). You may want to redesign this oligo.';
				};
				$('#idt-self-dimer-msg').html(msg);
			})
			.complete(function() {
				$('#idt-self-dimer-ajax-throbber').hide();
			});
           
	} 
	
	// analyze the sequence
	analyze_sequence(oligo_string);
    // Set the Sequence
    // Show the dialog
    $("#idt-oligoanalyzer").modal('show');

    $("#view-complement").click(function(e) {
        e.preventDefault();
        sequence_label = (sequence_label === "Sequence") ? "Complement" : "Sequence";
        $(this).text((sequence_label === "Sequence") ? "Complement" : "Original");
        analyze_sequence($(this).attr("data-sequence"));
    });
    
} 


function PluginBuySequence () {
    this.name = 'buy_sequence' ; // Plugin identifier needs to be set here, preferably all-lowercase, no spaces.
    //I think I can add something to the selection context menu...that's cool.
    //Well, not quite. The context menu appears to be redrawn every selection. so would just have to make this live
    // var a = $('<a></a>').attr({"href":"#", "onclick":'this.BuySequence;return false;'}).text("Buy Sequence from IDT");
    // var li = $('<li></li>').append(a);
    // console.log(li)
    // $('#selection_context_marker .btn-group').find('ul').append(li);
    
    //Open in dialog window
	var h = '<div class="modal hide" id="idt-oligoanalyzer">                            '
            + '     <div class="modal-header">                                               '
            + '       <button type="button" class="close" data-dismiss="modal">×</button>    '
            + '       <h3>OligoAnalyzer&trade; <img src="https://www.idtdna.com/pages/docs/plugins-and-apps/159.gif" id="idt-ajax-throbber" style="margin-bottom:-5px;"/></h3>  '
            + '     </div>                                                                   '
            + '     <div class="modal-body">                                                 '
            + ' <div id="idt-messages" class="alert alert-block alert-error"></div>'
            + '       <h4 id="sequence-label">Sequence</h4>'
            + '<div><p><span id="idt-sequence">ATC GTA GT GCTA GCTG ATC TAC ATC GT AGCT GAC TGA CTG ATC GAT CGT ACG TAG CTA GTA GT AG CTG CTA CGT AGC TAG CTA GC TGA CTG ACT GAC TCT AGC TAC TA GCT GCA TCT AGC ACGTAGTCATA ACGTACGTACGTACGTACGTGCACA</span> <small><a id="view-complement" href="#">Complement</a></small></p></div>'
		
            // + '       <h4>Complement</h4>'
            // + '<div><p><span id="idt-complement">ATCGTAGTGCTAGCTGATCTACGTACGTACGTACGTGCACA</span></p></div>'
        
            + '<div class="clearfix">'
            + '<div style="float:left;margin-right:3em;">'
            + '       <h4>Length</h4>'
            + '<p><span id="idt-length">36</span></p>'
            + '       <h4>GC Content</h4>'
            + '<p><span  id="idt-gc">52.3</span>%</p>'
            + '       <h4>Melting Temperature</h4>'
            + '<p><span id="idt-tm">67.1</span> &deg;C</p>'
            + '       <h4>Molecular Weight</h4>'
            + '<p><span id="idt-mol-weight">11389.4</span> g/mole</p>'
            + '</div>'
            + '<div style="float:left;">'
            + '       <h4>Extinction Coefficient</h4>'
            + '<p><span id="idt-extinction-coefficient">352500</span> L/(mole x cm)</p>'
            + '       <h4>nmole/OD<sub>260</sub></h4>'
            + '<p><span id="idt-nmole">2.84</span></p>'
            + '       <h4>&micro;g/OD<sub>260</sub></h4>'
            + '<p><span id="idt-microgram">32.31</span></p>'
            + '</div>'
            + '</div>'
			+ '<h4>Self Dimer Analysis</h4>  '
			+ '<p> <img src="https://www.idtdna.com/pages/docs/plugins-and-apps/159.gif" id="idt-self-dimer-ajax-throbber" style="margin-bottom:-5px;"/> <span  id="idt-self-dimer-msg"><i class="icon-warning-sign"></i>  We found <strong>3 self-dimers</strong> with very strong ΔG (&gt; -9 kcal/mol). You may want to redesign this oligo.</span> </p>'
			+ '<p><span class="label label-info">Note</span> Assumes 25 nm scale and 50mM Na<sup>+</sup>. View in OligoAnalyzer to customize parameters, view possible hairpins, and perform further analysis.</p> '
			+ '</div>   '
            + '     <div class="modal-footer" style="background:url(https://www.idtdna.com/pages/docs/plugins-and-apps/idtlogo.png) 15px 50% no-repeat;">  '
            + '       <a id="open-in-oligoanalyzer" href="#" class="btn">View in OligoAnalyzer <i class="icon-share-alt" /></a> '
            + '       <a href="#" id="order-from-idt" class="btn btn-primary">Order Oligo <i class="icon-share-alt" /></a>                   '
            + '     </div>                                                                   '
            + '   </div>';
                
    $('#main').append(h);
}

// Register your plugin (mandatory).
if ( plugins.registerPlugin ( { 
	className : 'PluginBuySequence' , // Your plugin class name from above
	url : 'plugins/IDToligoanalyzer.js' // The (relative or absolute) URL of the plugin
	} ) ) {

	// Register your plugin as a sequence-type-specific tool (optional). It will show up in the right side bar. You can register the same plugin for multiple sequence types.
	plugins.registerAsTool ( { 
		className : 'PluginBuySequence' , // Your plugin class name from above
		module : 'dna' , // Which sequence type this tool applies to
		section : 'sequence' ,  // The section of the menu (the menu bar)
		linkTitle : 'IDT OligoAnalyzer' , // The text of the menu item
		call : 'BuySequence' // Which method in your class to call when the user clicks the menu item
	} ) ;
}