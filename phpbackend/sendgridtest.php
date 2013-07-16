<?php

include '~/htdocs/sendgrid-php/SendGrid_loader.php';
$sendgrid = new SendGrid('nmbgesos', 'app3909180@heroku.com');

$mail = new SendGrid\Mail();
$mail->
  addTo('al@synbiota.ca')->
  setFrom('a.n.grant@gmail.com')->
  setSubject('Subject goes here')->
  setText('Hello World!')->
  setHtml('<strong>Hello World!</strong>');

$sendgrid->
smtp->
  send($mail);
?>