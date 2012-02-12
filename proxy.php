<?PHP

// $url = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NM_001079817.1&rettype=gb&retmode=text" ;

$url = $_REQUEST['url'] ;
$callback = $_REQUEST['callback'] ;
header('Content-type: application/json');
print $callback . "(" . json_encode ( file_get_contents ( $url ) ) . ");" ;

?>