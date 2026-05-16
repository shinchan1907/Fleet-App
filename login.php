<?php
session_start();

// Redirect to install if no config
if (!file_exists(__DIR__ . '/config.php')) {
    header("Location: install.php");
    exit;
}

require_once __DIR__ . '/config.php';

// Auto-migration for users table if it doesn't exist
$mysqli->query("CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

// Check if default admin exists, if not create it
$res = $mysqli->query("SELECT id FROM users WHERE username = 'admin'");
if ($res->num_rows === 0) {
    $hashed = password_hash('Account102@@', PASSWORD_DEFAULT);
    $mysqli->query("INSERT INTO users (username, password, role) VALUES ('admin', '$hashed', 'admin')");
}

// Ensure trips and services have created_by
$res = $mysqli->query("SHOW COLUMNS FROM trips LIKE 'created_by'");
if ($res->num_rows === 0) {
    $mysqli->query("ALTER TABLE trips ADD COLUMN created_by INT NULL");
}

$res = $mysqli->query("SHOW COLUMNS FROM services LIKE 'created_by'");
if ($res->num_rows === 0) {
    $mysqli->query("ALTER TABLE services ADD COLUMN created_by INT NULL");
}

if (isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    $stmt = $mysqli->prepare("SELECT id, username, password, role, status FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($user = $result->fetch_assoc()) {
        if ($user['status'] === 'inactive') {
            $error = "Account is deactivated.";
        } elseif (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            header("Location: index.php");
            exit;
        } else {
            $error = "Invalid password.";
        }
    } else {
        $error = "Invalid username.";
    }
    $stmt->close();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Fleet Master</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        body, html { margin: 0; padding: 0; height: 100%; font-family: 'Inter', sans-serif; background-color: #f9fafb; overflow-x: hidden; }
        .split-layout { display: flex; min-height: 100vh; }
        
        .image-section {
            flex: 1.3;
            background: linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(30, 58, 138, 0.7) 100%), url('https://images.pexels.com/photos/34875545/pexels-photo-34875545.jpeg') no-repeat center center;
            background-size: cover;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 80px;
            color: white;
            position: relative;
        }

        .content-wrapper { position: relative; z-index: 2; max-width: 600px; animation: fadeIn 1s ease-out; }
        
        .content-wrapper h1 { font-size: 56px; font-weight: 700; margin-bottom: 24px; line-height: 1.1; letter-spacing: -0.02em; }
        .content-wrapper h1 span { color: #818cf8; }
        .content-wrapper p { font-size: 18px; color: #e5e7eb; line-height: 1.7; margin-bottom: 48px; font-weight: 300; }
        
        .feature-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 20px; }
        .feature-list li { display: flex; align-items: center; gap: 16px; font-size: 16px; font-weight: 500; background: rgba(255, 255, 255, 0.1); padding: 16px 24px; border-radius: 12px; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); transition: transform 0.3s ease; }
        .feature-list li:hover { transform: translateX(10px); background: rgba(255, 255, 255, 0.15); }
        .feature-list i { color: #818cf8; font-size: 20px; }

        .form-section {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            background: white;
        }

        .login-container { width: 100%; max-width: 440px; padding: 0 20px; }
        
        .brand-logo { display: flex; align-items: center; gap: 12px; color: #4f46e5; font-size: 24px; font-weight: 700; margin-bottom: 48px; }
        .brand-logo i { font-size: 32px; }

        .login-container h2 { font-size: 32px; font-weight: 700; color: #111827; margin-bottom: 8px; letter-spacing: -0.01em; }
        .login-container .subtitle { color: #6b7280; margin-bottom: 40px; font-size: 16px; }

        .form-control { padding: 14px 16px; font-size: 15px; border-radius: 10px; border: 1px solid #e5e7eb; background: #f9fafb; transition: all 0.2s; }
        .form-control:focus { background: white; border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
        .form-group label { font-weight: 600; color: #374151; font-size: 14px; margin-bottom: 8px; }

        .btn-primary { background: #4f46e5; padding: 14px; font-size: 16px; border-radius: 10px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 8px -1px rgba(79, 70, 229, 0.3); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 1000px) {
            .image-section { display: none; }
            .form-section { background: #f3f4f6; }
            .login-container { background: white; padding: 48px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05); max-width: 480px; }
        }
    </style>
</head>
<body>
    <div class="split-layout">
        <div class="image-section">
            <div class="content-wrapper">
                <h1>Next-Gen <span>Fleet</span><br>Management.</h1>
                <p>Empower your logistics team with real-time tracking, seamless service scheduling, and comprehensive driver analytics. Manage your entire fleet ecosystem from one intuitive, high-performance dashboard.</p>
                
                <ul class="feature-list">
                    <li><i class="fa-solid fa-route"></i> Advanced Trip & Mileage Tracking</li>
                    <li><i class="fa-solid fa-wrench"></i> Proactive Maintenance & Service Logs</li>
                    <li><i class="fa-solid fa-shield-halved"></i> Enterprise-Grade Role Security</li>
                </ul>
            </div>
        </div>

        <div class="form-section">
            <div class="login-container">
                <div class="brand-logo">
                    <i class="fa-solid fa-truck-fast"></i>
                    <span>Fleet Master</span>
                </div>

                <h2>Welcome back</h2>
                <p class="subtitle">Please enter your credentials to access your account.</p>

                <?php if ($error): ?>
                    <div class="alert alert-error" style="border-radius: 10px; margin-bottom: 24px;">
                        <i class="fa-solid fa-circle-exclamation" style="margin-right: 8px;"></i> <?= htmlspecialchars($error) ?>
                    </div>
                <?php endif; ?>

                <form method="POST">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" name="username" class="form-control" placeholder="Enter your username" required autofocus>
                    </div>
                    <div class="form-group" style="margin-bottom: 32px;">
                        <label>Password</label>
                        <input type="password" name="password" class="form-control" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        Sign In <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>
                    </button>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
