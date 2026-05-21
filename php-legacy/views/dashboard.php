<?php
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

$stats = get_dashboard_stats($mysqli, $start_date, $end_date);
$recent_trips = get_trips($mysqli, $start_date, $end_date);
?>

<div class="filter-bar">
    <div class="filter-label">
        <i class="fa-solid fa-filter" style="color: var(--text-muted);"></i>
        Filter Data:
    </div>
    <form method="GET" class="filter-form">
        <input type="hidden" name="page" value="dashboard">
        
        <select name="filter" class="form-control" onchange="this.form.submit()">
            <option value="all" <?= $filter === 'all' ? 'selected' : '' ?>>All Time</option>
            <option value="today" <?= $filter === 'today' ? 'selected' : '' ?>>Today</option>
            <option value="yesterday" <?= $filter === 'yesterday' ? 'selected' : '' ?>>Yesterday</option>
            <option value="this_week" <?= $filter === 'this_week' ? 'selected' : '' ?>>This Week</option>
            <option value="this_month" <?= $filter === 'this_month' ? 'selected' : '' ?>>This Month</option>
            <option value="custom" <?= $filter === 'custom' ? 'selected' : '' ?>>Custom Dates</option>
        </select>
        
        <?php if ($filter === 'custom'): ?>
            <input type="date" name="start" class="form-control" value="<?= htmlspecialchars($start_date) ?>" required>
            <span style="color: var(--text-muted); font-weight: 500;">to</span>
            <input type="date" name="end" class="form-control" value="<?= htmlspecialchars($end_date) ?>" required>
            <button type="submit" class="btn btn-primary" style="padding: 10px 16px;">Apply</button>
        <?php endif; ?>
    </form>
</div>

<div class="grid-4">
    <div class="card stat-card">
        <div class="stat-icon blue"><i class="fa-solid fa-route"></i></div>
        <div class="stat-details">
            <h3>Total Trips</h3>
            <p><?= number_format($stats['total_trips']) ?></p>
        </div>
    </div>
    <div class="card stat-card">
        <div class="stat-icon green"><i class="fa-solid fa-gauge-high"></i></div>
        <div class="stat-details">
            <h3>Total Kilometers</h3>
            <p><?= number_format($stats['total_kms'], 2) ?> km</p>
        </div>
    </div>
    <div class="card stat-card">
        <div class="stat-icon orange"><i class="fa-solid fa-wrench"></i></div>
        <div class="stat-details">
            <h3>Services Done</h3>
            <p><?= number_format($stats['total_services']) ?></p>
        </div>
    </div>
    <div class="card stat-card">
        <div class="stat-icon purple"><i class="fa-solid fa-money-bill-wave"></i></div>
        <div class="stat-details">
            <h3>Service Cost</h3>
            <p>$<?= number_format($stats['service_cost'], 2) ?></p>
        </div>
    </div>
</div>

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

<div class="card">
    <div class="flex items-center justify-between" style="margin-bottom: 20px;">
        <h3 class="card-title" style="margin-bottom: 0;">Recent Trips Overview</h3>
    </div>
    
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Driver</th>
                    <th>Vehicle</th>
                    <th>Destination</th>
                    <th>Distance (km)</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($recent_trips)): ?>
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">No trips found for this period.</td>
                </tr>
                <?php else: ?>
                    <?php foreach (array_slice($recent_trips, 0, 10) as $trip): ?>
                    <tr>
                        <td><?= date('M d, Y', strtotime($trip['trip_date'])) ?></td>
                        <td>
                            <div style="font-weight: 500; color: var(--text-main);"><?= htmlspecialchars($trip['driver_name']) ?></div>
                        </td>
                        <td>
                            <div class="badge badge-success"><?= htmlspecialchars($trip['plate_number']) ?></div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                                <?= htmlspecialchars($trip['make'] . ' ' . $trip['model']) ?>
                            </div>
                        </td>
                        <td><?= htmlspecialchars($trip['destination']) ?></td>
                        <td style="font-weight: 600;"><?= number_format($trip['km_ran'], 1) ?></td>
                    </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
