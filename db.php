<?php
// ARQUIVO: db.php (CORRIGIDO E SIMPLIFICADO)

// --- 1. CONFIGURAÇÃO DE CONEXÃO ---
// (Mantenha suas credenciais originais do banco de dados)
$servername = "127.0.0.1";
$username = "u896885394_demo"; // Seu usuário do banco
$password = "191730Ju*"; // Sua senha do banco
$dbname = "u896885394_demo"; // O nome do seu banco

// --- 2. INÍCIO DE SESSÃO ---
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// --- 3. CONEXÃO COM O BANCO ---
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor (DB Connect).']);
    exit;
}
$conn->set_charset("utf8mb4");

// --- 4. LÓGICA DE CACHE DE CONFIGURAÇÕES ---
// Garante que $settings SEMPRE esteja carregado do banco 
// se não estiver na sessão.
if (!isset($_SESSION['settings'])) {
    $settings = [];
    $settings_result = $conn->query("SELECT setting_key, setting_value FROM system_settings");
    if ($settings_result) {
        while ($row = $settings_result->fetch_assoc()) {
            $settings[$row['setting_key']] = is_numeric($row['setting_value']) ? (float)$row['setting_value'] : $row['setting_value'];
        }
        $_SESSION['settings'] = $settings;
    }
}

// Disponibiliza as configurações para todos os scripts
$settings = $_SESSION['settings'] ?? [];
?>