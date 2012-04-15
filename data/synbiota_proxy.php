<?PHP
ini_set('track_errors', 1); 
ini_set('display_errors', 'On');
error_reporting(E_ALL | E_STRICT);

function do_post_curl ( $url , $data ) {
	$ret = array () ;
	$ret['query_url'] = $url ;
	$ret['query_data'] = $data ;

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	curl_setopt($ch, CURLOPT_POST, true);
	
	curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	$output = curl_exec($ch);
	$info = curl_getinfo($ch);
	curl_close($ch);
	
	$ret['status'] = 'OK' ;
	$ret['echo'] = json_decode ( $output ) ;
	$ret['info'] = $info ;
	return $ret ;
}


$data = array() ;
if ( isset ( $_REQUEST['id'] ) ) $data['id'] = $_REQUEST['id'] ;
if ( isset ( $_REQUEST['token'] ) ) $data['token'] = $_REQUEST['token'] ;

if ( isset ( $_REQUEST['gentle_file'] ) ) {
	$gf = $_REQUEST['gentle_file'] ;
	foreach ( $gf AS $k => $v ) {
		$data['gentle_file['.$k.']'] = $v ;
	}
}

$url = $_REQUEST['url'] ; // TODO force URL to point to a synbiota server

$out = do_post_curl ( $url , $data ) ;

header('Content-type: application/json');
print json_encode ( $out ) ;

?>