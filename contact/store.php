<?php
require "db.php";
header("Access-Control-Allow-Origin: *");

if (!isset($_POST['report'])) {
    die();
}

$email = $_POST['email'];
$ua = $_SERVER['HTTP_USER_AGENT'];
$ip = $_SERVER['REMOTE_ADDR'];
$bodyMD5 = md5($_POST["report"]);

$state = $db->prepare("select * from contactrequest where body_md5 = ?");
$state->execute(array($bodyMD5));
$res = $state->fetchAll(PDO::FETCH_ASSOC);

if (count($res) != 0) {
    die();
}

$state =  $db->prepare("insert into contactrequest (email, body, user_agent, ip, body_md5) values (?, ?, ?, ?, ?)");
$state->execute(array($email, $_POST['report'], $ua, $ip, $bodyMD5));
