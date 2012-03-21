
/*
Create dialog to ask for NCBI input, 
attempt to validate ID code, alert on bad entry.
*/
function start_nbci_dialog () {
  $('#ncbi_dialog').remove() ;
   function submitTask () {
     var ncbiID = $('#ncbi_form input[name=ncbiID]').val();
     //TODO: better check for ncbi codes, better way to deal with user errors.
     if (ncbiID !== "") {
       $('#nbci_form').html("<i>Querying NCBI...</i>");
       load_ncbi(ncbiID);
     } else {
       alert("Bad ID provided");
     }
  }

  var dialogContainer = $("<div/>");
  dialogContainer.load("public/templates/ncbi_dialog.php", function(){
    dialogContainer.appendTo("#all");
    $('#ncbi_dialog').modal();
    $("#ncbi_form input[type=submit]").click(function(){submitTask();});
    $("#ncbi_form input[name=ncbiID]").keypress(function(e) {
       console.log("hrmm...")
      if(e.keyCode === 13) {
        submitTask();
      }
    });
  });
}


/*
Function queries NCBI database and 
runs text pareser to open the file.
*/
function load_ncbi (ncbiID) {

  $.ajax({
    url: gentle_config.proxy + '?callback=?',
    data: {
      'url' : 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id='+ncbiID+'&rettype=gb&retmode=text' 
    },
    dataType: 'json',
    success:  function ( NCBIResponse ) {
      var gb = new FT_genebank () ;
      $('#ncbi_dialog').modal('hide') ;
      $('#ncbi_dialog').remove() ;
      gb.parseText ( NCBIResponse ) ;
    }

  });
}
