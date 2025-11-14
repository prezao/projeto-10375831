if (php_sapi_name() !== 'cli' && !isset($_SERVER['REMOTE_ADDR'])) {
    die('Acesso negado.');
}
<?php
/*
 * SCRIPT DE CRON JOB (TAREFA AGENDADA)
 * * OBJETIVO: Este script NÃO é para usuários. Ele deve ser executado
 * automaticamente pelo seu servidor (via "Cron Job") a cada 15 ou 60 minutos.
 * * O QUE FAZ: Ele executa as consultas LENTAS e salva o resultado na
 * tabela 'summary_stats' para que o painel de admin possa lê-las instantaneamente.
 */

// Define o fuso horário (necessário para scripts de cron)
date_default_timezone_set('America/Sao_Paulo'); 

// Inclui o db.php para ter acesso à variável $conn
// (Ajuste o caminho se o db.php não estiver no mesmo diretório)
include 'db.php'; 

if (!$conn) {
    error_log('Cron Job (update_stats): Falha ao conectar ao banco de dados.');
    exit;
}

try {
    $today_start = (new DateTime('today'))->format('Y-m-d H:i:s');
    
    // 1. A consulta LENTA (a mesma que estava em admin_get_stats.php)
    $sql = "
        SELECT
            (SELECT COUNT(id) FROM users WHERE deleted_at IS NULL) as total_users,
            (SELECT SUM(spin_points) FROM users WHERE deleted_at IS NULL) as total_coins,
            (SELECT COUNT(id) FROM checkins WHERE checkin_time >= ?) as checkins_today,
            (SELECT COUNT(id) FROM users WHERE created_at >= ? AND deleted_at IS NULL) as new_users_today
    ";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $today_start, $today_start);
    $stmt->execute();
    $stats = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    $total_coins = (int)($stats['total_coins'] ?? 0);
    
    // 2. A atualização RÁPIDA (na tabela de resumo)
    // Ele atualiza a única linha (stat_id = 1) com os novos dados.
    $sql_update = "UPDATE summary_stats 
                   SET total_users = ?, total_coins = ?, checkins_today = ?, new_users_today = ?, last_updated = NOW()
                   WHERE stat_id = 1";
                   
    $stmt_update = $conn->prepare($sql_update);
    $stmt_update->bind_param(
        "iiii",
        $stats['total_users'],
        $total_coins,
        $stats['checkins_today'],
        $stats['new_users_today']
    );
    $stmt_update->execute();
    $stmt_update->close();
    $conn->close();
    
    // Log de sucesso (você pode checar isso nos logs do seu servidor)
    echo "Estatísticas atualizadas com sucesso em " . date('Y-m-d H:i:s');

} catch (Exception $e) {
    error_log('Cron Job (update_stats): Erro ao executar - ' . $e->getMessage());
    if ($conn) {
        $conn->close();
    }
}
?>