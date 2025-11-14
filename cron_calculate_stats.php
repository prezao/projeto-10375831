<?php
// Este script NÃO é para usuários, é só para o servidor rodar.
date_default_timezone_set('America/Sao_Paulo'); 
include 'db.php'; // Só para pegar $conn

$today_start = (new DateTime('today'))->format('Y-m-d H:i:s');

// A mesma SQL de antes
$sql = "SELECT
    (SELECT COUNT(id) FROM users WHERE deleted_at IS NULL) as total_users,
    (SELECT SUM(spin_points) FROM users WHERE deleted_at IS NULL) as total_coins,
    (SELECT COUNT(id) FROM checkins WHERE checkin_time >= ?) as checkins_today,
    (SELECT COUNT(id) FROM users WHERE created_at >= ? AND deleted_at IS NULL) as new_users_today";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $today_start, $today_start);
$stmt->execute();
$stats = $stmt->get_result()->fetch_assoc();
$stmt->close();

// Salva o "resumo" do dia
$today_date = (new DateTime('today'))->format('Y-m-d');
$sql_save = "INSERT INTO daily_stats (date, total_users, total_coins, checkins_today, new_users_today) 
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             total_users=VALUES(total_users), total_coins=VALUES(total_coins), 
             checkins_today=VALUES(checkins_today), new_users_today=VALUES(new_users_today)";

$stmt_save = $conn->prepare($sql_save);
$stmt_save->bind_param("siiiii", 
    $today_date, 
    $stats['total_users'], 
    $stats['total_coins'], 
    $stats['checkins_today'], 
    $stats['new_users_today']
);
$stmt_save->execute();
$stmt_save->close();
$conn->close();
echo "Estatísticas de " . $today_date . " calculadas e salvas!";
?>