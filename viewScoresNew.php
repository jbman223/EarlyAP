<?php
session_start();

require 'vendor/autoload.php';
require_once "simple_html_dom.php";

use GuzzleHttp\Client;
use GuzzleHttp\Cookie\SessionCookieJar;

$client = new Client([
    'timeout'  => 5.0
]);

$jar = new SessionCookieJar('SESSION_STORAGE', true);

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

$logOut = $client->get('https://apscore.collegeboard.org/scores/logout.action', [
    'cookies' => $jar
]);

if (!strstr($stringBody, "Congratulations!")) {
    header("location: index.php");
    echo htmlspecialchars($scores);
    $_SESSION['alert'] = "<div class=\"alert alert-danger\">You may have entered an incorrect login. Also, there could be an error with the site. Try logging in one more time.</div>";
    die();
}


//echo $stringBody;

$html = str_get_html($stringBody);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <meta name="description" content="">
    <meta name="author" content="">
    <link rel="icon" href="../../favicon.ico">

    <title>Your AP Scores</title>

    <!-- Bootstrap core CSS -->
    <link href="css/bootstrap.min.css" rel="stylesheet">

    <!-- Custom styles for this template -->
    <link href="css/site.css" rel="stylesheet">

    <script>
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

        ga('create', 'UA-56057288-1', 'auto');
        ga('send', 'pageview');

    </script>
</head>

<body>
<div class="container body-content">
    <h1>Your AP Scores</h1>

    <?php foreach ($html->find("div.year-scores") as $scoreBlock) {
        echo str_replace("row-fluid", "row", str_replace('"span5"', '"col-md-6 col-sm-6 col-xs-6"', $scoreBlock->innertext));
    } ?>
</div>
<!-- /.container -->


<!-- Bootstrap core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
<script src="js/bootstrap.min.js"></script>
</body>
</html>
