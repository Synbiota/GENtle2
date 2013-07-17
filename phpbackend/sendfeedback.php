<?php
if(isset($_GET['p2'])  && isset($_POST['p1']))
{
$text=$_GET['p2'];
$imageData=$_POST['p1'];

}

    $parts = explode(',', $imageData);
    $encodedData = str_replace(' ','+',$parts[1]); 
    $data = base64_decode($encodedData);  
    $fp = fopen('screenshot.png', 'w');  
    fwrite($fp, $data);  
    fclose($fp); 




if($text==NULL)
{
$text = "The user has not entered any message.";
}

require("PHPMailer_5.2.0/class.phpmailer.php");

$mail= new PHPMailer();

//$mail->IsHTML(true);
//trying https://forums.aws.amazon.com/thread.jspa?messageID=302819
$mail->IsSMTP();                     // tell the class to use SMTP
$mail->SMTPAuth   = true;            // enable SMTP authentication
$mail->Port       = 443;             // set the SMTP server port
$mail->Host       = "ssl://email-smtp.us-east-1.amazonaws.com"; // SMTP server
$mail->Username   = "SMTP-User";     // SMTP server username
$mail->Password   = "SMTP-PW";


$mail->FromName= "Synbiota.ca";

$mail->AddAddress("a.n.grant@gmail.com", "Support Team");

$mail->From= "no-reply@synbiota.ca";

$mail->AddAttachment('screenshot.png');

$mail->Body ="Issue:".'<br/><br/>'.$text.'<br/><br/>' ;

$mail->Subject= "GENtle2 Feedback";

$mail->Send();

?>
