//common header file for all pages
<?php 
include_once 'config.php'; 
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lost & Found</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <nav>
        <div class="logo">Lost & Found Hub</div>
        <div class="nav-links">
            <a href="index.php">Home</a>
            <a href="listings.php">Browse Items</a>
            <?php if(isset($_SESSION['user_id'])): ?>
                <a href="dashboard.php">My Account</a>
                <a href="logout.php">Logout</a>
            <?php else: ?>
                <a href="login.php">Login / Register</a>
            <?php endif; ?>
        </div>
    </nav>
