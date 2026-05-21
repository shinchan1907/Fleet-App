<?php
$msg = '';
$msgType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_trip') {
    $trip_date = $_POST['trip_date'];
    $driver_id = $_POST['driver_id'];
    $vehicle_id = $_POST['vehicle_id'];
    $destination = $_POST['destination'];
    $km_ran = $_POST['km_ran'];
    $remarks = $_POST['remarks'];

    $user_id = $_SESSION['user_id'] ?? null;

    $stmt = $mysqli->prepare("INSERT INTO trips (trip_date, driver_id, vehicle_id, destination, km_ran, remarks, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("siisdsi", $trip_date, $driver_id, $vehicle_id, $destination, $km_ran, $remarks, $user_id);
    
    if ($stmt->execute()) {
        $msg = "Trip added successfully.";
        $msgType = "success";
    } else {
        $msg = "Failed to add trip: " . $stmt->error;
        $msgType = "error";
    }
    $stmt->close();
}

$drivers = get_drivers($mysqli);
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

$recent_trips = get_trips($mysqli, $start_date, $end_date);
?>

<?php if ($msg): ?>
<div class="alert alert-<?= $msgType ?>"><?= htmlspecialchars($msg) ?></div>
<?php endif; ?>

<div class="grid-4" style="grid-template-columns: 1fr 2fr;">
    <div class="card">
        <h3 class="card-title">Record New Trip</h3>
        
        <form method="POST">
            <input type="hidden" name="action" value="add_trip">
            
            <div class="form-group">
                <label>Date</label>
                <input type="date" name="trip_date" class="form-control" value="<?= date('Y-m-d') ?>" required>
            </div>
            
            <div class="form-group">
                <label>Driver</label>
                <select name="driver_id" class="form-control" required>
                    <option value="">Select Driver...</option>
                    <?php foreach($drivers as $d): ?>
                        <option value="<?= $d['id'] ?>"><?= htmlspecialchars($d['name']) ?></option>
                    <?php endforeach; ?>
                </select>
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
                <label>Where (Destination)</label>
                <input type="text" name="destination" class="form-control" placeholder="e.g. Warehouse A to Client X" required>
            </div>
            
            <div class="form-group">
                <label>Kilometer ran</label>
                <input type="number" step="0.1" name="km_ran" class="form-control" placeholder="0.0" required>
            </div>
            
            <div class="form-group">
                <label>Remarks</label>
                <textarea name="remarks" class="form-control" placeholder="Optional notes..."></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
                <i class="fa-solid fa-plus"></i> Save Trip Record
            </button>
        </form>
    </div>

    <div class="card">
        <div class="flex justify-between items-center" style="margin-bottom: 20px; flex-wrap: wrap; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
            <h3 class="card-title" style="margin-bottom: 0;">
                <i class="fa-solid fa-list" style="color: var(--text-muted); margin-right: 8px;"></i>
                Trips History
            </h3>
            
            <form method="GET" class="filter-form">
                <input type="hidden" name="page" value="enter_trip">
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
                        <th>Driver/Vehicle</th>
                        <th>Destination</th>
                        <th>Km</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if(empty($recent_trips)): ?>
                    <tr><td colspan="4" style="text-align: center;">No data available</td></tr>
                    <?php endif; ?>
                    <?php foreach($recent_trips as $trip): ?>
                    <tr>
                        <td>
                            <?= date('d M y', strtotime($trip['trip_date'])) ?>
                            <?php if ($trip['created_by_name']): ?>
                                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">by <?= htmlspecialchars($trip['created_by_name']) ?></div>
                            <?php endif; ?>
                        </td>
                        <td>
                            <div style="font-weight: 500;"><?= htmlspecialchars($trip['driver_name']) ?></div>
                            <div style="font-size: 12px; color: var(--text-muted);"><?= htmlspecialchars($trip['plate_number']) ?></div>
                        </td>
                        <td><?= htmlspecialchars($trip['destination']) ?></td>
                        <td style="font-weight: 600;"><?= number_format($trip['km_ran'], 1) ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
