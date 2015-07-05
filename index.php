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

    <title>Early AP Score Access</title>

    <!-- Bootstrap core CSS -->
    <link href="css/bootstrap.min.css" rel="stylesheet">

    <!-- Custom styles for this template -->
    <link href="css/site.css" rel="stylesheet">
</head>

<body>
<div class="container body-content">
    <h1>Early AP Scores</h1>

    <p class="lead">Get access to your AP scores on June 6th no matter where you are located. Enter your College Board
        username and password below and you will be redirected to your score report page. Don't worry though - your
        login information is never stored and we have no reason to want it anyways. Want more proof? View this project
        on GitHub: <a href="https://github.com/jbman223/EarlyAP">https://github.com/jbman223/EarlyAP</a>, you could even
        host your own if you still don't feel comfortable using the public version.</p>

    <div class="center-block text-center">
        <? if (isset($_SESSION['alert'])) { echo $_SESSION['alert']; unset($_SESSION['alert']); } ?>
        <form class="form-inline" action="viewScores.php" method="post">
            <div class="form-group">
                <input type="text" class="form-control" placeholder="Username" name="username" required />
            </div>
            <div class="form-group">
                <input type="password" class="form-control" placeholder="Password" name="password" required />
            </div>
            <div class="form-group">
                <button class="btn btn-success">
                    View My Scores <i class="glyphicon glyphicon-play-circle"></i>
                </button>
            </div>
        </form>
    </div>
</div>
<!-- /.container -->


<!-- Bootstrap core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
<script src="js/bootstrap.min.js"></script>
</body>
</html>
