<?php
/**
 * Created by PhpStorm.
 * User: jacob
 * Date: 7/2/17
 * Time: 4:51 PM
 */

$db = new PDO('mysql:host=localhost;dbname=db;charset=utf8', 'username', 'password');

$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);