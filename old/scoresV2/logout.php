<?php
session_start();

require '../vendor/autoload.php';
require_once "../simple_html_dom.php";

use GuzzleHttp\Client;
use GuzzleHttp\Cookie\SessionCookieJar;


$client = new Client([
    'timeout'  => 5.0
]);

$jar = new \GuzzleHttp\Cookie\CookieJar;

$logOut = $client->get('https://apscore.collegeboard.org/scores/logout.action', [
    'cookies' => $jar
]);

die(json_encode(array("result" => "success")));