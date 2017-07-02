<?php
session_start();

header("Access-Control-Allow-Origin: https://earlyscores.com");

require '../vendor/autoload.php';
require_once "../simple_html_dom.php";

use GuzzleHttp\Client;
use GuzzleHttp\Cookie\SessionCookieJar;



$client = new Client([
    'timeout'  => 5.0
]);

$jar = new \GuzzleHttp\Cookie\CookieJar;

$logIn = $client->request('POST', 'https://account.collegeboard.org/login/authenticateUser', [
    'form_params' => [
        'forgotPWUrl' => 'forgotPassword%3FappId%3D287%26DURL%3Dhttps%25253A%25252F%25252Fapscore.collegeboard.org%25252Fscores%25252Fview-your-scores%26idp%3DECL',
        'forgotUNUrl' => 'forgotUsername%3FappId%3D287%26DURL%3Dhttps%25253A%25252F%25252Fapscore.collegeboard.org%25252Fscores%25252Fview-your-scores%26idp%3DECL',
        'signUpUrl' => 'signUp%3FappId%3D287%26idp%3DECL%26DURL%3Dhttps%25253A%25252F%25252Fapscore.collegeboard.org%25252Fscores%25252Fview-your-scores',
        'DURL' => 'https%3A%2F%2Fapscore.collegeboard.org%2Fscores%2Fview-your-scores',
        'appId' => '287',
        'LOGINURL' => 'https%3A%2F%2Faccount.collegeboard.org%2Fscores%2Fview-your-scores',
        'person.userName' => $_REQUEST['username'],
        'person.password' => $_REQUEST['password'],
        '__checkbox_rememberMe' => 'false',
        'get_login' => ''
    ],
    'cookies' => $jar
]);

$logIn = $logIn->getBody();

$scores = $client->get("https://apscore.collegeboard.org/scores/view-your-scores", [
    'cookies' => $jar
]);

$scores = $scores->getBody();

$stringBody = (string) $scores;
$html = str_get_html($stringBody);

$logOut = $client->get('https://apscore.collegeboard.org/scores/logout.action', [
    'cookies' => $jar
]);

//print_r($html->find("div.year-scores"));
?>


<?php foreach ($html->find("div.year-scores") as $scoreBlock) {
    //$scoreBlock
    //$scoreBlock->find("");
    echo str_replace("row-fluid", "row", str_replace('"span5"', '"col-md-6 col-sm-6 col-xs-6"', $scoreBlock->innertext));
} ?>
