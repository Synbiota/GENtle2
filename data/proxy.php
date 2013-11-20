<?PHP

ini_set('track_errors', 1); 
ini_set('display_errors', 'On');
error_reporting(E_ALL | E_STRICT);

$url = $_REQUEST['url'] ;

header('Content-type: application/json');

if(isset($_REQUEST['callback']))
{
  $callback = $_REQUEST['callback'];
  print $callback . "(" . json_encode ( file_get_contents ( $url ) ) . ");" ;
}
else
{
  print json_encode(file_get_contents ($url));
}




?>