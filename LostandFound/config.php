<?php
session_start();

//DB connection can go here?
// Database Credentials
$host = 'localhost';
$db_name = 'lost_and_found';
$username = 'root';
$password = '';


$dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
$dbusername = "root";
$dbpassword = "";
try {
    $pdo = new PDO($dsn, $dbusername, $dbpassword);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
?>