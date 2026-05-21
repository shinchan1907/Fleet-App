<?php
$msg = '';
$msgType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_service') {
    $vehicle_id = $_POST['vehicle_id'];
    $service_date = $_POST['service_date'];
    $service_type = $_POST['service_type'];
    $amount = $_POST['amount'];
    $km = $_POST['km'];

    $user_id = $_SESSION['user_id'] ?? null;

    $stmt = $mysqli->prepare("INSERT INTO services (vehicle_id, service_date, service_type, amount, km, created_by) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issddi", $vehicle_id, $service_date, $service_type, $amount, $km, $user_id);
    
    if ($stmt->execute()) {
        $msg = "Service record added successfully.";
        $msgType = "success";
    } else {
        $msg = "Failed to add service record: " . $stmt->error;
        $msgType = "error";
    }
    $stmt->close();
}

$vehicles = get_vehicles($mysqli);

// Filtering Logic
$filter = isset($_GET['filter']) ? $_GET['filter'] : 'all';
$start_date = null;
$end_date = null;

if ($filter === 'today') {
    $start_date = date('Y-m-d');
    $end_date = date('Y-m-d');
} elseif ($filter === 'yesterday') {
    $start_date = date('Y-m-d', strtotime('-1 day'));
    $end_date = date('Y-m-d', strtotime('-1 day'));
} elseif ($filter === 'this_week') {
    $start_date = date('Y-m-d', strtotime('monday this week'));
    $end_date = date('Y-m-d', strtotime('sunday this week'));
} elseif ($filter === 'this_month') {
    $start_date = date('Y-m-01');
    $end_date = date('Y-m-t');
} elseif ($filter === 'custom') {
    $start_date = isset($_GET['start']) ? $_GET['start'] : date('Y-m-d');
    $end_date = isset($_GET['end']) ? $_GET['end'] : date('Y-m-d');
}

$recent_services = get_services($mysqli, $start_date, $end_date);

$service_types = [
    'break pads' => 'Break Pads',
    'oil change' => 'Oil Change',
    'tyre change' => 'Tyre Change',
    'wash' => 'Wash',
    'vaccume' => 'Vacuum',
    'miscleanous' => 'Miscellaneous'
];
?>

<?php if ($msg): ?>
<div class="alert alert-<?= $msgType ?>"><?= htmlspecialchars($msg) ?></div>
<?php endif; ?>

<?php 
$alerts = get_service_alerts($mysqli);
if (!empty($alerts)): 
?>
<div class="card" style="border-left: 4px solid var(--danger); margin-bottom: 24px;">
    <h3 class="card-title" style="color: var(--danger); margin-bottom: 15px;">
        <i class="fa-solid fa-triangle-exclamation"></i> Action Required: Service Alerts
    </h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
        <?php foreach($alerts as $alert): 
            $img = 'assets/img/oil.png';
            if ($alert['service_type'] == 'break pads') $img = 'assets/img/break.png';
            if ($alert['service_type'] == 'tyre change') $img = 'assets/img/tyre.png';
        ?>
            <div style="background: white; border: 1px solid <?= $alert['status'] === 'overdue' ? '#fca5a5' : '#fcd34d' ?>; padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative; overflow: hidden;">
                <!-- Decorative side border -->
                <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: <?= $alert['status'] === 'overdue' ? '#ef4444' : '#f59e0b' ?>;"></div>
                
                <img src="<?= $img ?>" alt="<?= $alert['service_type'] ?>" style="width: 56px; height: 56px; object-fit: contain; background: <?= $alert['status'] === 'overdue' ? '#fee2e2' : '#fef3c7' ?>; padding: 10px; border-radius: 12px;">
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                        <h4 style="margin: 0; font-size: 16px; color: #111827; text-transform: capitalize; font-weight: 600;"><?= htmlspecialchars($alert['service_type']) ?></h4>
                        <div style="font-weight: 600; font-size: 12px; color: <?= $alert['status'] === 'overdue' ? '#b91c1c' : '#b45309' ?>; background: <?= $alert['status'] === 'overdue' ? '#fee2e2' : '#fef3c7' ?>; padding: 4px 8px; border-radius: 20px;">
                            <?= $alert['message'] ?>
                        </div>
                    </div>
                    <div style="font-size: 14px; color: #4b5563; margin-bottom: 4px;">
                        <span style="font-weight: 600; color: #374151;">
                            <?= htmlspecialchars($alert['vehicle']['make'] . ' ' . $alert['vehicle']['model']) ?>
                        </span>
                        <span class="badge badge-<?= $alert['status'] === 'overdue' ? 'danger' : 'warning' ?>" style="font-size: 11px; margin-left: 6px;">
                            <?= htmlspecialchars($alert['vehicle']['plate_number']) ?>
                        </span>
                    </div>
                    <div style="font-size: 12px; color: #9ca3af;">
                        <i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Last: <?= $alert['last_date'] ?>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</div>
<?php endif; ?>

<div class="grid-4" style="grid-template-columns: 1fr 2fr;">
    <div class="card">
        <h3 class="card-title">Add Service Record</h3>
        
        <form method="POST">
            <input type="hidden" name="action" value="add_service">
            
            <div class="form-group">
                <label>Date</label>
                <input type="date" name="service_date" class="form-control" value="<?= date('Y-m-d') ?>" required>
            </div>
            
            <div class="form-group">
                <label>Vehicle</label>
                <select name="vehicle_id" class="form-control" required>
                    <option value="">Select Vehicle...</option>
                    <?php foreach($vehicles as $v): ?>
                        <option value="<?= $v['id'] ?>"><?= htmlspecialchars($v['plate_number'] . ' - ' . $v['make']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="form-group">
                <label>Service Type</label>
                <select name="service_type" class="form-control" required>
                    <option value="">Select Type...</option>
                    <?php foreach($service_types as $val => $label): ?>
                        <option value="<?= $val ?>"><?= $label ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="form-group">
                <label>Amount ($)</label>
                <input type="number" step="0.01" name="amount" class="form-control" placeholder="0.00" required>
            </div>
            
            <div class="form-group">
                <label>Kilometer (Odometer Reading)</label>
                <input type="number" step="0.1" name="km" class="form-control" placeholder="0.0" required>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
                <i class="fa-solid fa-plus"></i> Save Service Record
            </button>
        </form>
    </div>

    <div class="card">
        <div class="flex justify-between items-center" style="margin-bottom: 20px; flex-wrap: wrap; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
            <h3 class="card-title" style="margin-bottom: 0;">
                <i class="fa-solid fa-list" style="color: var(--text-muted); margin-right: 8px;"></i>
                Service History
            </h3>
            
            <form method="GET" class="filter-form">
                <input type="hidden" name="page" value="service_entries">
                <select name="filter" class="form-control" onchange="this.form.submit()">
                    <option value="all" <?= $filter === 'all' ? 'selected' : '' ?>>All Time</option>
                    <option value="today" <?= $filter === 'today' ? 'selected' : '' ?>>Today</option>
                    <option value="yesterday" <?= $filter === 'yesterday' ? 'selected' : '' ?>>Yesterday</option>
                    <option value="this_week" <?= $filter === 'this_week' ? 'selected' : '' ?>>This Week</option>
                    <option value="this_month" <?= $filter === 'this_month' ? 'selected' : '' ?>>This Month</option>
                    <option value="custom" <?= $filter === 'custom' ? 'selected' : '' ?>>Custom</option>
                </select>
                
                <?php if ($filter === 'custom'): ?>
                    <input type="date" name="start" class="form-control" value="<?= htmlspecialchars($start_date) ?>" required>
                    <span style="color: var(--text-muted); font-weight: 500;">to</span>
                    <input type="date" name="end" class="form-control" value="<?= htmlspecialchars($end_date) ?>" required>
                    <button type="submit" class="btn btn-primary" style="padding: 10px 16px;">Go</button>
                <?php endif; ?>
            </form>
        </div>

        <div class="table-responsive" style="max-height: 600px; overflow-y: auto;">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Vehicle</th>
                        <th>Service Type</th>
                        <th>Km</th>
                        <th>Cost</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if(empty($recent_services)): ?>
                    <tr><td colspan="5" style="text-align: center;">No service data available</td></tr>
                    <?php endif; ?>
                    <?php foreach($recent_services as $srv): ?>
                    <tr>
                        <td>
                            <?= date('d M y', strtotime($srv['service_date'])) ?>
                            <?php if ($srv['created_by_name']): ?>
                                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">by <?= htmlspecialchars($srv['created_by_name']) ?></div>
                            <?php endif; ?>
                        </td>
                        <td>
                            <div class="badge badge-warning"><?= htmlspecialchars($srv['plate_number']) ?></div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;"><?= htmlspecialchars($srv['make']) ?></div>
                        </td>
                        <td style="text-transform: capitalize;"><?= htmlspecialchars($srv['service_type']) ?></td>
                        <td><?= number_format($srv['km'], 1) ?></td>
                        <td style="font-weight: 600;">$<?= number_format($srv['amount'], 2) ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
