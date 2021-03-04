<?php

$name = $_POST['name'];
$phone = $_POST['phone'];
$email = $_POST['email'];

// $to = 'sinitsyna@uprav.ru';
$to = 'killerdjek@gmail.com';
$subject = 'Получить видеозапись';
$message = "Имя: $name \n
            Телефон: $phone \n
            Email: $email";
$headers = ("From: $name <$email>" . "\r\n");

mail($to, $subject, $message, $headers);