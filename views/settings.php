<?php
$msg = '';
$msgType = '';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    die("Access Denied.");
}

// Handle actions
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'add_user') {
        $username = trim($_POST['username']);
        $password = $_POST['password'];
        $role = $_POST['role'];
        
        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $mysqli->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $username, $hashed, $role);
        if ($stmt->execute()) { $msg = "User added successfully."; $msgType = "success"; }
        else { $msg = "Error adding user: " . $stmt->error; $msgType = "error"; }
        $stmt->close();
    }
    elseif ($_POST['action'] === 'toggle_user') {
        $id = $_POST['id'];
        $new_status = $_POST['status'];
        if ($id != $_SESSION['user_id']) { // prevent self-deactivation
            $stmt = $mysqli->prepare("UPDATE users SET status = ? WHERE id = ?");
            $stmt->bind_param("si", $new_status, $id);
            if ($stmt->execute()) { $msg = "User status updated."; $msgType = "success"; }
            $stmt->close();
        } else {
            $msg = "You cannot deactivate your own account."; $msgType = "error";
        }
    }
    elseif ($_POST['action'] === 'add_driver') {
        $name = $_POST['name'];
        $stmt = $mysqli->prepare("INSERT INTO drivers (name) VALUES (?)");
        $stmt->bind_param("s", $name);
        if ($stmt->execute()) { $msg = "Driver added."; $msgType = "success"; }
        else { $msg = "Error adding driver."; $msgType = "error"; }
        $stmt->close();
    }
    elseif ($_POST['action'] === 'delete_driver') {
        $id = $_POST['id'];
        $stmt = $mysqli->prepare("UPDATE drivers SET status = 'inactive', deleted_at = NOW() WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) { $msg = "Driver removed."; $msgType = "success"; }
        $stmt->close();
    }
    elseif ($_POST['action'] === 'add_vehicle') {
        $plate = $_POST['plate_number'];
        $make = $_POST['make'];
        $model = $_POST['model'];
        $stmt = $mysqli->prepare("INSERT INTO vehicles (plate_number, make, model) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $plate, $make, $model);
        if ($stmt->execute()) { $msg = "Vehicle added."; $msgType = "success"; }
        else { $msg = "Error adding vehicle."; $msgType = "error"; }
        $stmt->close();
    }
    elseif ($_POST['action'] === 'delete_vehicle') {
        $id = $_POST['id'];
        $stmt = $mysqli->prepare("UPDATE vehicles SET status = 'inactive', deleted_at = NOW() WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) { $msg = "Vehicle removed."; $msgType = "success"; }
        $stmt->close();
    }
    elseif ($_POST['action'] === 'update_intervals') {
        $oil = (int)$_POST['interval_oil_change'];
        $break = (int)$_POST['interval_break_pads'];
        $tyre = (int)$_POST['interval_tyre_change'];
        
        $mysqli->query("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(50) PRIMARY KEY, setting_value VARCHAR(255))");
        
        $stmt = $mysqli->prepare("REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)");
        $updates = [
            'interval_oil_change' => $oil,
            'interval_break_pads' => $break,
            'interval_tyre_change' => $tyre
        ];
        foreach ($updates as $k => $v) {
            $stmt->bind_param("ss", $k, $v);
            $stmt->execute();
        }
        $stmt->close();
        
        $msg = "Maintenance intervals updated successfully."; $msgType = "success";
    }
}

$drivers = get_drivers($mysqli);
$vehicles = get_vehicles($mysqli);

// Get users
$users = [];
$res = $mysqli->query("SELECT id, username, role, status FROM users ORDER BY id");
while ($row = $res->fetch_assoc()) {
    $users[] = $row;
}
?>

<?php if ($msg): ?>
<div class="alert alert-<?= $msgType ?>"><?= htmlspecialchars($msg) ?></div>
<?php endif; ?>

<div class="card" style="margin-bottom: 24px;">
    <h3 class="card-title">User Management (Admin Only)</h3>
    <form method="POST" class="grid-4" style="grid-template-columns: 1fr 1fr 1fr auto; align-items: end; gap: 16px; margin-bottom: 24px;">
        <input type="hidden" name="action" value="add_user">
        <div class="form-group" style="margin: 0;">
            <label>Username</label>
            <input type="text" name="username" class="form-control" required>
        </div>
        <div class="form-group" style="margin: 0;">
            <label>Password</label>
            <input type="password" name="password" class="form-control" required>
        </div>
        <div class="form-group" style="margin: 0;">
            <label>Role</label>
            <select name="role" class="form-control" required>
                <option value="user">Agent (Add entries only)</option>
                <option value="admin">Administrator (Full access)</option>
            </select>
        </div>
        <button type="submit" class="btn btn-primary" style="height: 44px;">Add User</button>
    </form>

    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($users as $u): ?>
                <tr>
                    <td style="font-weight: 500;"><?= htmlspecialchars($u['username']) ?></td>
                    <td style="text-transform: capitalize;"><?= htmlspecialchars($u['role']) ?></td>
                    <td>
                        <?php if($u['status'] === 'active'): ?>
                            <span class="badge badge-success">Active</span>
                        <?php else: ?>
                            <span class="badge badge-warning">Inactive</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if($u['id'] != $_SESSION['user_id']): ?>
                        <form method="POST">
                            <input type="hidden" name="action" value="toggle_user">
                            <input type="hidden" name="id" value="<?= $u['id'] ?>">
                            <?php if($u['status'] === 'active'): ?>
                                <input type="hidden" name="status" value="inactive">
                                <button type="submit" class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;">Deactivate</button>
                            <?php else: ?>
                                <input type="hidden" name="status" value="active">
                                <button type="submit" class="btn" style="padding: 6px 12px; font-size: 12px; background: #10b981; color: white;">Activate</button>
                            <?php endif; ?>
                        </form>
                        <?php else: ?>
                            <span style="color: var(--text-muted); font-size: 12px;">Current User</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<div class="grid-4" style="grid-template-columns: 1fr 1fr;">
    <!-- Drivers Management -->
    <div class="card">
        <h3 class="card-title">Manage Drivers</h3>
        <form method="POST" class="flex gap-4 mb-4" style="margin-bottom: 20px;">
            <input type="hidden" name="action" value="add_driver">
            <input type="text" name="name" class="form-control" placeholder="Driver Full Name" required>
            <button type="submit" class="btn btn-primary" style="white-space: nowrap;">Add Driver</button>
        </form>

        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th style="width: 80px;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if(empty($drivers)): ?>
                        <tr><td colspan="2">No active drivers</td></tr>
                    <?php endif; ?>
                    <?php foreach($drivers as $d): ?>
                    <tr>
                        <td><?= htmlspecialchars($d['name']) ?></td>
                        <td>
                            <form method="POST" onsubmit="return confirm('Remove this driver?');">
                                <input type="hidden" name="action" value="delete_driver">
                                <input type="hidden" name="id" value="<?= $d['id'] ?>">
                                <button type="submit" class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;">Remove</button>
                            </form>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Vehicles Management -->
    <div class="card">
        <h3 class="card-title">Manage Vehicles</h3>
        <form method="POST" style="margin-bottom: 20px;">
            <input type="hidden" name="action" value="add_vehicle">
            <div class="grid-4" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <input type="text" name="plate_number" class="form-control" placeholder="Plate Number (e.g. ABC-123)" required>
                <input type="text" name="make" class="form-control" placeholder="Make (e.g. Toyota)" required>
            </div>
            <div class="flex gap-4">
                <input type="text" name="model" class="form-control" placeholder="Model (e.g. Hilux)" required>
                <button type="submit" class="btn btn-primary" style="white-space: nowrap;">Add Vehicle</button>
            </div>
        </form>

        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Plate Number</th>
                        <th>Make & Model</th>
                        <th style="width: 80px;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if(empty($vehicles)): ?>
                        <tr><td colspan="3">No active vehicles</td></tr>
                    <?php endif; ?>
                    <?php foreach($vehicles as $v): ?>
                    <tr>
                        <td style="font-weight: 500;"><?= htmlspecialchars($v['plate_number']) ?></td>
                        <td><?= htmlspecialchars($v['make'] . ' ' . $v['model']) ?></td>
                        <td>
                            <form method="POST" onsubmit="return confirm('Remove this vehicle?');">
                                <input type="hidden" name="action" value="delete_vehicle">
                                <input type="hidden" name="id" value="<?= $v['id'] ?>">
                                <button type="submit" class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;">Remove</button>
                            </form>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<div class="card" style="margin-top: 24px;">
    <h3 class="card-title">Maintenance Intervals Configuration</h3>
    <?php $intervals = get_service_intervals($mysqli); ?>
    <form method="POST" class="grid-4" style="grid-template-columns: 1fr 1fr 1fr auto; align-items: end; gap: 16px;">
        <input type="hidden" name="action" value="update_intervals">
        <div class="form-group" style="margin: 0;">
            <label>Oil Change (km)</label>
            <input type="number" name="interval_oil_change" class="form-control" value="<?= htmlspecialchars($intervals['oil change']) ?>" required>
        </div>
        <div class="form-group" style="margin: 0;">
            <label>Break Pads (km)</label>
            <input type="number" name="interval_break_pads" class="form-control" value="<?= htmlspecialchars($intervals['break pads']) ?>" required>
        </div>
        <div class="form-group" style="margin: 0;">
            <label>Tyre Change (km)</label>
            <input type="number" name="interval_tyre_change" class="form-control" value="<?= htmlspecialchars($intervals['tyre change']) ?>" required>
        </div>
        <button type="submit" class="btn btn-primary" style="height: 44px;">Save Intervals</button>
    </form>
</div>
