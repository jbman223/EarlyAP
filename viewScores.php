<?php
session_start();
require_once "simple_html_dom.php";
error_reporting(E_ALL);
$url = "https://account.collegeboard.org/login/authenticateUser";

$postData = "forgotPWUrl=forgotPassword%3FappId%3D287%26DURL%3Dhttps%25253A%25252F%25252Fapscore.collegeboard.org%25252Fscores%25252Fview-your-scores%26idp%3DECL&forgotUNUrl=forgotUsername%3FappId%3D287%26DURL%3Dhttps%25253A%25252F%25252Fapscore.collegeboard.org%25252Fscores%25252Fview-your-scores%26idp%3DECL&signUpUrl=signUp%3FappId%3D287%26idp%3DECL%26DURL%3Dhttps%25253A%25252F%25252Fapscore.collegeboard.org%25252Fscores%25252Fview-your-scores&DURL=https%3A%2F%2Fapscore.collegeboard.org%2Fscores%2Fview-your-scores&appId=287&LOGINURL=https%3A%2F%2Faccount.collegeboard.org%2Fscores%2Fview-your-scores&person.userName=".$_REQUEST['username']."&person.password=".$_REQUEST['password']."&__checkbox_rememberMe=false&get_login=";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_AUTOREFERER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows; U; Windows NT 5.1; rv:1.7.3) Gecko/20041001 Firefox/0.10.1");
curl_setopt( $ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    "Content-Type: application/x-www-form-urlencoded"
));
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_COOKIEFILE, 'cookie.txt');
curl_setopt($ch, CURLOPT_COOKIEJAR, 'cookie.txt');

$a = curl_exec($ch);
curl_close($ch);

if (!strstr($a, "By taking challenging AP courses and exams, you're preparing yourself to succeed in college and beyond.")) {
    header("location: index.php");
    $_SESSION['alert'] = "<div class=\"alert alert-danger\">You entered an incorrect login.</div>";
    die();
}

$html = str_get_html($a);

?>

<?php
session_start();

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

    <title>Starter Template for Bootstrap</title>

    <!-- Bootstrap core CSS -->
    <link href="css/bootstrap.min.css" rel="stylesheet">

    <!-- Custom styles for this template -->
    <link href="css/site.css" rel="stylesheet">
</head>

<body>
<div class="container body-content">
    <h1>Your AP Scores</h1>

    <? foreach ($html->find("div.year-scores") as $scoreBlock) {
        echo str_replace("row-fluid", "row", str_replace('"span5"', '"col-md-6"', $scoreBlock->innertext));
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