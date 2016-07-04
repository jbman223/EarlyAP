<?php
session_start();

require '../vendor/autoload.php';
require_once "../simple_html_dom.php";

use GuzzleHttp\Client;
use GuzzleHttp\Cookie\SessionCookieJar;

$client = new Client([
    'timeout'  => 5.0
]);

$jar = new SessionCookieJar('SESSION_STORAGE', true);

$scores = $client->get("https://apscore.collegeboard.org/scores/view-your-scores", [
    'cookies' => $jar
]);

$scores = $scores->getBody();

$stringBody = (string) $scores;
$html = str_get_html($stringBody);

//print_r($html->find("div.year-scores"));
?>


<?php foreach ($html->find("div.year-scores") as $scoreBlock) {
    //$scoreBlock
    //$scoreBlock->find("");
    echo str_replace("row-fluid", "row", str_replace('"span5"', '"col-md-6 col-sm-6 col-xs-6"', $scoreBlock->innertext));
} ?>
