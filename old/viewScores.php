<?php
session_start();
require_once "simple_html_dom.php";
error_reporting(E_ALL);
$cookieFile = "tmp/".uniqid("cookie").".txt";

$url = "https://account.collegeboard.org/login/authenticateUser";

$postData = "forgotPWUrl=forgotPassword%3FappId%3D287%26DURL%3Dhttps%25253A%25252F%25252Fapscore.collegeboard.org%25252Fscores%25252Fview-your-scores%26idp%3DECL&forgotUNUrl=forgotUsername%3FappId%3D287%26DURL%3Dhttps%25253A%25252F%25252Fapscore.collegeboard.org%25252Fscores%25252Fview-your-scores%26idp%3DECL&signUpUrl=signUp%3FappId%3D287%26idp%3DECL%26DURL%3Dhttps%25253A%25252F%25252Fapscore.collegeboard.org%25252Fscores%25252Fview-your-scores&DURL=https%3A%2F%2Fapscore.collegeboard.org%2Fscores%2Fview-your-scores&appId=287&LOGINURL=https%3A%2F%2Faccount.collegeboard.org%2Fscores%2Fview-your-scores&person.userName=".$_REQUEST['username']."&person.password=".$_REQUEST['password']."&__checkbox_rememberMe=false&get_login=";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_AUTOREFERER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows; U; Windows NT 5.1; rv:1.7.3) Gecko/20041001 Firefox/0.10.1");
curl_setopt( $ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    "Content-Type: application/x-www-form-urlencoded"
));
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_COOKIESESSION, true);
curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);

$a = curl_exec($ch);
curl_close($ch);

$logoutCH = curl_init();
curl_setopt($logoutCH, CURLOPT_URL, "https://apscore.collegeboard.org/scores/logout.action");
curl_setopt($logoutCH, CURLOPT_AUTOREFERER, true);
curl_setopt($logoutCH, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIESESSION, true);
curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
$b = curl_exec($logoutCH);
curl_close($logoutCH);



if (!strstr($a, "Congratulations!")) {
    //header("location: index.php");
    echo htmlspecialchars($a);
    $_SESSION['alert'] = "<div class=\"alert alert-danger\">You may have entered an incorrect login. Also, there could be an error with the site. Try logging in one more time.</div>";
    die();
}


unlink($cookieFile);


$html = str_get_html($a);
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

    <? foreach ($html->find("div.year-scores") as $scoreBlock) {
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