<?php
session_start();

// Check if config exists, if not redirect to installer
if (!file_exists(__DIR__ . '/config.php')) {
    header("Location: install.php");
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';

// Authentication Check
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: login.php");
    exit;
}

$user_role = $_SESSION['role'] ?? 'user';
$username = $_SESSION['username'] ?? 'User';

// Simple Router
$page = isset($_GET['page']) ? $_GET['page'] : 'dashboard';
$allowed_pages = ['dashboard', 'enter_trip', 'service_entries', 'settings'];

// Enforce role access for settings
if ($page === 'settings' && $user_role !== 'admin') {
    $page = 'dashboard';
}

if (!in_array($page, $allowed_pages)) {
    $page = 'dashboard';
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fleet Master SaaS</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <i class="fa-solid fa-truck-fast"></i>
                    <span>Fleet Master</span>
                </div>
                <button class="toggle-btn" id="toggle-btn"><i class="fa-solid fa-bars"></i></button>
            </div>
            
            <nav class="sidebar-nav">
                <a href="?page=dashboard" class="<?= $page === 'dashboard' ? 'active' : '' ?>">
                    <i class="fa-solid fa-chart-pie"></i>
                    <span class="nav-text">Dashboard</span>
                </a>
                <a href="?page=enter_trip" class="<?= $page === 'enter_trip' ? 'active' : '' ?>">
                    <i class="fa-solid fa-route"></i>
                    <span class="nav-text">Enter Trip</span>
                </a>
                <a href="?page=service_entries" class="<?= $page === 'service_entries' ? 'active' : '' ?>">
                    <i class="fa-solid fa-wrench"></i>
                    <span class="nav-text">Service Entries</span>
                </a>
                
                <?php if ($user_role === 'admin'): ?>
                <a href="?page=settings" class="<?= $page === 'settings' ? 'active' : '' ?>">
                    <i class="fa-solid fa-gear"></i>
                    <span class="nav-text">Settings (Admin)</span>
                </a>
                <?php endif; ?>
                
                <a href="?logout=1" style="color: #ef4444; margin-top: auto;">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    <span class="nav-text">Logout</span>
                </a>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="top-header">
                <h2><?= ucwords(str_replace('_', ' ', $page)) ?></h2>
                <div class="user-profile">
                    <div class="avatar" style="background: <?= $user_role === 'admin' ? 'var(--primary)' : 'var(--warning)' ?>;">
                        <?= strtoupper(substr($username, 0, 1)) ?>
                    </div>
                    <span><?= htmlspecialchars(ucfirst($username)) ?></span>
                </div>
            </header>
            
            <div class="page-content">
                <?php include __DIR__ . "/views/{$page}.php"; ?>
            </div>
        </main>
    </div>

    <script src="assets/js/script.js"></script>
</body>
</html>
