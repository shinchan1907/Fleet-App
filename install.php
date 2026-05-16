<?php
if (file_exists(__DIR__ . '/config.php')) {
    die("Installation already completed. Delete config.php to reinstall.");
}

$error = '';
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db_host = $_POST['db_host'] ?? 'localhost';
    $db_user = $_POST['db_user'] ?? 'root';
    $db_pass = $_POST['db_pass'] ?? '';
    $db_name = $_POST['db_name'] ?? 'fleet_db';

    // Try connecting
    $mysqli = @new mysqli($db_host, $db_user, $db_pass);
    
    if ($mysqli->connect_error) {
        $error = "Connection failed: " . $mysqli->connect_error;
    } else {
        // Create DB
        $mysqli->query("CREATE DATABASE IF NOT EXISTS `$db_name`");
        $mysqli->select_db($db_name);

        // Run schema
        $schema = "
        CREATE TABLE IF NOT EXISTS drivers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            status ENUM('active', 'inactive') DEFAULT 'active',
            deleted_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vehicles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            plate_number VARCHAR(50) NOT NULL,
            make VARCHAR(50) NOT NULL,
            model VARCHAR(50) NOT NULL,
            status ENUM('active', 'inactive') DEFAULT 'active',
            deleted_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS trips (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trip_date DATE NOT NULL,
            driver_id INT NOT NULL,
            vehicle_id INT NOT NULL,
            destination VARCHAR(255) NOT NULL,
            km_ran DECIMAL(10,2) NOT NULL,
            remarks TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            vehicle_id INT NOT NULL,
            service_date DATE NOT NULL,
            service_type VARCHAR(50) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            km DECIMAL(10,2) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        ";

        if ($mysqli->multi_query($schema)) {
            do {
                if ($res = $mysqli->store_result()) {
                    $res->free();
                }
            } while ($mysqli->more_results() && $mysqli->next_result());

            // Write config.php
            $config_content = "<?php\n";
            $config_content .= "define('DB_HOST', '$db_host');\n";
            $config_content .= "define('DB_USER', '$db_user');\n";
            $config_content .= "define('DB_PASS', '$db_pass');\n";
            $config_content .= "define('DB_NAME', '$db_name');\n";
            $config_content .= "\n";
            $config_content .= "\$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);\n";
            $config_content .= "if (\$mysqli->connect_error) {\n";
            $config_content .= "    die('Database connection failed: ' . \$mysqli->connect_error);\n";
            $config_content .= "}\n";

            file_put_contents(__DIR__ . '/config.php', $config_content);
            $success = true;
        } else {
            $error = "Error creating tables: " . $mysqli->error;
        }
        $mysqli->close();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SaaS Installation - Fleet Master</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .install-box { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        h1 { margin-top: 0; font-size: 24px; color: #111827; }
        p { color: #6b7280; margin-bottom: 24px; }
        .form-group { margin-bottom: 16px; }
        label { display: block; margin-bottom: 6px; font-weight: 500; color: #374151; font-size: 14px; }
        input[type="text"], input[type="password"] { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-family: 'Inter'; }
        input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
        .btn { display: block; width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; text-align: center; text-decoration: none; }
        .btn:hover { background: #2563eb; }
        .error { background: #fee2e2; color: #b91c1c; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 14px; }
        .success { background: #d1fae5; color: #065f46; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="install-box">
        <h1>Fleet Master Setup</h1>
        <p>Configure your database to get started.</p>

        <?php if ($error): ?>
            <div class="error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <?php if ($success): ?>
            <div class="success">Installation successful! Database and tables created.</div>
            <a href="index.php" class="btn">Go to Dashboard</a>
        <?php else: ?>
            <form method="POST">
                <div class="form-group">
                    <label>Database Host</label>
                    <input type="text" name="db_host" value="db" required>
                    <small style="color: #9ca3af; font-size: 12px;">Use 'db' for Docker, 'localhost' for cPanel</small>
                </div>
                <div class="form-group">
                    <label>Database User</label>
                    <input type="text" name="db_user" value="root" required>
                </div>
                <div class="form-group">
                    <label>Database Password</label>
                    <input type="password" name="db_pass" value="root">
                </div>
                <div class="form-group">
                    <label>Database Name</label>
                    <input type="text" name="db_name" value="fleet_db" required>
                </div>
                <button type="submit" class="btn">Install System</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
