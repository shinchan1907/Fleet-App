# 🚚 Fleet Master - Advanced Fleet & Trip Management SaaS

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](#) 
[![PHP Version](https://img.shields.io/badge/PHP-7.4%2B-8A2BE2.svg)](#)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-orange.svg)](#)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](#)

**Fleet Master** is a comprehensive, self-hosted Fleet and Trip Management SaaS solution. Built with a lightweight, secure PHP and MySQL architecture, it is designed for logistics companies, transport businesses, and any organization managing a fleet of vehicles. 

With features like automated maintenance alerts, trip logging, real-time total cost of ownership (TCO) tracking, and an intuitive modern UI, Fleet Master is ready for production.

---

## ✨ Key Features
*   **Trip Management:** Log daily trips, track kilometers driven, assign drivers and vehicles effortlessly.
*   **Service & Maintenance:** Keep meticulous logs of maintenance costs. 
*   **Automated Service Alerts:** The intelligent engine automatically calculates when a vehicle is due for service (Oil Change, Brake Pads, Tyre Change) based on driven kilometers.
*   **Admin Dashboard:** See all fleet analytics, recent trips, and urgent service alerts at a glance.
*   **Role-Based Access Control (RBAC):** Built-in Administrator and Agent (User) roles.
*   **Dynamic Settings:** Configure maintenance thresholds directly from the Admin panel without touching the code.
*   **Modern UI:** Responsive, CSS-driven UI with beautifully illustrated service alert cards.

---

## 🛠️ System Requirements
*   **Web Server:** Apache or Nginx
*   **PHP:** Version 7.4 or newer (8.x recommended)
*   **Database:** MySQL 5.7+ or MariaDB 10.2+
*   **PHP Extensions:** `mysqli`, `pdo_mysql`, `mbstring`, `json`

---

## 🚀 Installation Guide

### Option A: Standard Hosting (cPanel / LAMP Stack)
This is the standard deployment method for shared hosting or VPS environments.

1.  **Upload Files:** Zip the project files and upload them to your server's `public_html` directory (or use an FTP client). Extract the files.
2.  **Create Database:** Go to your cPanel -> MySQL Databases. Create a new database and a user. Link the user to the database with **All Privileges**.
3.  **Run the Installer:** Navigate to your domain in the browser (e.g., `https://yourdomain.com`). 
4.  **Complete Setup:** You will be automatically redirected to the installation wizard (`install.php`). Enter your Database Host (usually `localhost`), Database User, Database Password, and Database Name.
5.  **Finish:** Click "Install System". The system will automatically build the database schema and redirect you to the login page.
    *   *Note: Upon first installation, you may need to register an admin account directly in the database or adapt the install script to prompt for an initial admin.*

### Option B: Docker Deployment (Local / Cloud)
Fleet Master is fully Dockerized for instant, zero-configuration deployment.

1.  Ensure you have [Docker](https://www.docker.com/) and Docker Compose installed.
2.  Open your terminal and navigate to the project directory.
3.  Run the following command:
    ```bash
    docker-compose up -d --build
    ```
4.  The application will be available at `http://localhost:8080`.
5.  When running the web installer, use `db` as the Database Host instead of `localhost`.

---

## 🧩 Modularity: How to Add New Modules

Fleet Master is designed with modularity in mind. To add a new feature (e.g., "Fuel Tracking"):

1.  **Create the View:** 
    Create a new file in the `views/` directory (e.g., `views/fuel_tracking.php`). This file will contain your HTML, PHP logic for processing forms, and UI components.
    
2.  **Add to Allowed Pages:** 
    Open `index.php` and locate the `$allowed_pages` array. Add your new page:
    ```php
    $allowed_pages = ['dashboard', 'enter_trip', 'service_entries', 'settings', 'fuel_tracking'];
    ```

3.  **Add to Sidebar Navigation:** 
    In `index.php`, locate the `<nav class="sidebar-nav">` section and add a new link:
    ```html
    <a href="?page=fuel_tracking" class="<?= $page === 'fuel_tracking' ? 'active' : '' ?>">
        <i class="fa-solid fa-gas-pump"></i>
        <span class="nav-text">Fuel Tracking</span>
    </a>
    ```

4.  **Update Database Schema (If needed):** 
    If your module requires a new database table, add the `CREATE TABLE` logic into `install.php` for future installations, and create the table manually in your current MySQL database or create a migration script.

5.  **Add Helper Functions:** 
    Place any reusable logic (like `get_fuel_records($mysqli)`) inside `includes/functions.php`.

---

## 🔐 Security Notes
*   **Installation Protection:** Once the installation is complete, `install.php` will refuse to run as long as `config.php` exists. For absolute security, you may delete `install.php` after deployment.
*   **Session Security:** The application relies on PHP sessions. Ensure your server is configured with secure session cookies.

---

## 📄 License & Support
This script is licensed for personal and commercial use under the terms defined at the time of purchase. 
For support, bug reports, or feature requests, please contact our support desk or open an issue in the provided repository. 

*Thank you for choosing Fleet Master!* 🚚
