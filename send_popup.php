<?php

$name = $_POST['name'];
$secondName = $_POST['secondName'];
$phone = $_POST['phone'];
$email = $_POST['email'];

$to = 'killerdjek@gmail.ru';
$subject = 'Заявка с сайта Корпоративного Онлайн Университета на отправку модуля';
$message = "Имя: $name \n
            Фамилия: $secondName \n
            Телефон: $phone \n
            Email: $email";
$headers = ("From: $name <$email>" . "\r\n");

mail($to, $subject, $message, $headers);
//     header('Refresh: 0; URL=https://cyberhand.ru/');
//     echo 'OK';
// } else {
//     header('Refresh: 0; URL=https://cyberhand.ru/');
// }