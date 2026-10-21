<?php
require_once 'config.php';
include_once 'header.php';
?>

<main class="listings-main">
    <h1>Active lost and found listings</h1>
    <p>Browse through the active listings of lost and found items. If you have lost or found an item, please register
        and log in to post your listing.</p>

    <div class="listings-container">
        <?php
        try {
            // 2. Prepare the SQL query to fetch all items, showing newest first
            $query = "SELECT title, description, location,status FROM items ORDER BY id DESC";
            $stmt = $pdo->prepare($query);
            $stmt->execute();

            // 3. Fetch all the results as an associative array
            $items = $stmt->fetchAll();

            // 4. Check if there are any items in the database
            if (count($items) > 0) {

                // 5. Loop through each item and generate the HTML dynamically
                foreach ($items as $item) {
                    // Turn "lost" or "found" into a neat CSS class name for styling
                    $statusClass = ($item['status'] == 'lost') ? 'status-lost' : 'status-found';

                    echo '<div class="item-card">';
                    echo '   <span class="status-badge ' . $statusClass . '">' . ucfirst($item['status']) . '</span>';
                    echo '   <h2>' . htmlspecialchars($item['title']) . '</h2>';
                    echo '   <p class="description">' . htmlspecialchars($item['description']) . '</p>';
                    echo '   <p class="date">Reported on: ' . htmlspecialchars($item['date_lost']) . '</p>';
                    echo '</div>';
                }

            } else {
                // What to show if the database table is completely empty
                echo '<p class="no-items">No items have been reported yet.</p>';
            }

        } catch (PDOException $e) {
            echo '<p class="error">Error loading listings: ' . $e->getMessage() . '</p>';
        }
        ?>
    </div>
</main>

</html>