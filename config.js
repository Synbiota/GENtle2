var gentle_config = {

	default_plugins : [
		'plugins/find_in_sequence.js' ,
		'plugins/prepend_append_sequence.js' ,
		'plugins/export_as_file.js' ,
		'plugins/dna.js'
//		, 'plugins/alignments.js'
		, 'plugins/IDToligoanalyzer.js'
//		, 'plugins/alignments.js'
	] ,
	
	deactivated_plugins : [
	] ,
	
	colors : {
		numbering : '#6094DB',
		DRuMS : { 	A: '#5050ff',
					C: '#e00000', 
					G: '#00c000', 
					T: '#e6e600', 
					U: '#cc9900', 
					N: '#ff0000' 
		}
	} ,
	
	synbiota : {
		show_designer : true ,
		use_proxy : 1 ,
		api_version : 1 ,
		api_url : ''
	} ,

	use_pcr_module : true ,
	
	proxy : './data/proxy.php'
	
} ;
