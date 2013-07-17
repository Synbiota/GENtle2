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

$mail->IsSendmail();


$mail->FromName= "Synbiota.ca";

$mail->AddAddress("a.n.grant@gmail.com", "Support Team");

$mail->From= "no-reply@synbiota.ca";

$mail->AddAttachment('screenshot.png');

$mail->Body ="Issue:".'<br/><br/>'.$text.'<br/><br/>' ;

$mail->Subject= "GENtle2 Feedback";

$mail->Send();

?>
