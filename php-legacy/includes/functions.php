<?php
// Utility functions for Database and other common tasks

function get_drivers($mysqli) {
    $result = $mysqli->query("SELECT * FROM drivers WHERE status = 'active' AND deleted_at IS NULL");
    $drivers = [];
    while ($row = $result->fetch_assoc()) {
        $drivers[] = $row;
    }
    return $drivers;
}

function get_vehicles($mysqli) {
    $result = $mysqli->query("SELECT * FROM vehicles WHERE status = 'active' AND deleted_at IS NULL");
    $vehicles = [];
    while ($row = $result->fetch_assoc()) {
        $vehicles[] = $row;
    }
    return $vehicles;
}

function get_trips($mysqli, $start_date = null, $end_date = null) {
    $query = "SELECT t.*, d.name as driver_name, v.plate_number, v.make, v.model, u.username as created_by_name
              FROM trips t 
              LEFT JOIN drivers d ON t.driver_id = d.id 
              LEFT JOIN vehicles v ON t.vehicle_id = v.id
              LEFT JOIN users u ON t.created_by = u.id";
    
    if ($start_date && $end_date) {
        $query .= " WHERE t.trip_date BETWEEN ? AND ?";
    }
    
    $query .= " ORDER BY t.trip_date DESC LIMIT 100";
    
    $stmt = $mysqli->prepare($query);
    if ($start_date && $end_date) {
        $stmt->bind_param("ss", $start_date, $end_date);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trips = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $trips[] = $row;
        }
    }
    $stmt->close();
    return $trips;
}

function get_services($mysqli, $start_date = null, $end_date = null) {
    $query = "SELECT s.*, v.plate_number, v.make, v.model, u.username as created_by_name
              FROM services s 
              LEFT JOIN vehicles v ON s.vehicle_id = v.id
              LEFT JOIN users u ON s.created_by = u.id";
    
    if ($start_date && $end_date) {
        $query .= " WHERE s.service_date BETWEEN ? AND ?";
    }
    
    $query .= " ORDER BY s.service_date DESC LIMIT 100";
    
    $stmt = $mysqli->prepare($query);
    if ($start_date && $end_date) {
        $stmt->bind_param("ss", $start_date, $end_date);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $services = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $services[] = $row;
        }
    }
    $stmt->close();
    return $services;
}

function get_dashboard_stats($mysqli, $start_date = null, $end_date = null) {
    $stats = [
        'total_trips' => 0,
        'total_kms' => 0,
        'total_services' => 0,
        'service_cost' => 0
    ];
    
    $trip_query = "SELECT COUNT(*) as c, SUM(km_ran) as s FROM trips";
    $service_query = "SELECT COUNT(*) as c, SUM(amount) as s FROM services";
    
    if ($start_date && $end_date) {
        $trip_query .= " WHERE trip_date BETWEEN ? AND ?";
        $service_query .= " WHERE service_date BETWEEN ? AND ?";
    }
    
    // Trips
    $stmt1 = $mysqli->prepare($trip_query);
    if ($start_date && $end_date) {
        $stmt1->bind_param("ss", $start_date, $end_date);
    }
    $stmt1->execute();
    $res1 = $stmt1->get_result();
    if ($res1 && $row = $res1->fetch_assoc()) {
        $stats['total_trips'] = $row['c'] ?? 0;
        $stats['total_kms'] = $row['s'] ?? 0;
    }
    $stmt1->close();
    
    // Services
    $stmt2 = $mysqli->prepare($service_query);
    if ($start_date && $end_date) {
        $stmt2->bind_param("ss", $start_date, $end_date);
    }
    $stmt2->execute();
    $res2 = $stmt2->get_result();
    if ($res2 && $row = $res2->fetch_assoc()) {
        $stats['total_services'] = $row['c'] ?? 0;
        $stats['service_cost'] = $row['s'] ?? 0;
    }
    $stmt2->close();
    
    return $stats;
}

function get_service_intervals($mysqli) {
    $mysqli->query("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(50) PRIMARY KEY, setting_value VARCHAR(255))");
    
    $default_intervals = [
        'interval_oil_change' => 10000,
        'interval_break_pads' => 30000,
        'interval_tyre_change' => 40000
    ];
    
    $intervals = [];
    $res = $mysqli->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'interval_%'");
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $intervals[$row['setting_key']] = (int)$row['setting_value'];
        }
    }
    
    foreach ($default_intervals as $key => $val) {
        if (!isset($intervals[$key])) {
            $stmt = $mysqli->prepare("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)");
            $stmt->bind_param("ss", $key, $val);
            $stmt->execute();
            $stmt->close();
            $intervals[$key] = $val;
        }
    }
    
    return [
        'oil change' => $intervals['interval_oil_change'],
        'break pads' => $intervals['interval_break_pads'],
        'tyre change' => $intervals['interval_tyre_change']
    ];
}

function get_service_alerts($mysqli) {
    $intervals = get_service_intervals($mysqli);
    $alerts = [];
    
    $vehicles = get_vehicles($mysqli);
    foreach ($vehicles as $v) {
        $vid = $v['id'];
        
        $trip_sum_query = $mysqli->query("SELECT SUM(km_ran) as total FROM trips WHERE vehicle_id = $vid");
        $total_lifetime_km = $trip_sum_query->fetch_assoc()['total'] ?? 0;
        
        foreach ($intervals as $type => $interval) {
            $stmt = $mysqli->prepare("SELECT service_date, km FROM services WHERE vehicle_id = ? AND service_type = ? ORDER BY service_date DESC, id DESC LIMIT 1");
            $stmt->bind_param("is", $vid, $type);
            $stmt->execute();
            $res = $stmt->get_result();
            
            if ($row = $res->fetch_assoc()) {
                $last_km = $row['km'];
                $last_date = $row['service_date'];
                
                $t_stmt = $mysqli->prepare("SELECT SUM(km_ran) as run FROM trips WHERE vehicle_id = ? AND trip_date > ?");
                $t_stmt->bind_param("is", $vid, $last_date);
                $t_stmt->execute();
                $t_res = $t_stmt->get_result();
                $run_since = $t_res->fetch_assoc()['run'] ?? 0;
                
                $km_since_service = $run_since;
                
                if ($km_since_service >= $interval) {
                    $alerts[] = [
                        'vehicle' => $v,
                        'service_type' => $type,
                        'status' => 'overdue',
                        'last_date' => date('M d, Y', strtotime($last_date)),
                        'message' => "Overdue by " . number_format($km_since_service - $interval, 1) . " km"
                    ];
                } elseif ($interval - $km_since_service <= 1000) {
                    $alerts[] = [
                        'vehicle' => $v,
                        'service_type' => $type,
                        'status' => 'due_soon',
                        'last_date' => date('M d, Y', strtotime($last_date)),
                        'message' => "Due in " . number_format($interval - $km_since_service, 1) . " km"
                    ];
                }
                $t_stmt->close();
            } else {
                if ($total_lifetime_km >= $interval) {
                    $alerts[] = [
                        'vehicle' => $v,
                        'service_type' => $type,
                        'status' => 'overdue',
                        'last_date' => 'Never',
                        'message' => "Overdue by " . number_format($total_lifetime_km - $interval, 1) . " km"
                    ];
                }
            }
            $stmt->close();
        }
    }
    return $alerts;
}
