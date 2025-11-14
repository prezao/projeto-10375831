<?php
// ARQUIVO: api.php (CORRIGIDO COM SEGURANÇA CENTRALIZADA)

// Habilite para depuração, se necessário
// ini_set('display_errors', 1);
// error_reporting(E_ALL);

date_default_timezone_set('America/Sao_Paulo'); 

// 1. Inclui o DB (que inicia a sessão e carrega $settings)
include 'db.php'; 

// 2. Pega a ação
$action = $_GET['action'] ?? '';

if (empty($action)) {
    echo json_encode(['success' => false, 'message' => 'Nenhuma ação especificada.']);
    exit;
}

// 3. === SEGURANÇA CENTRALIZADA ===
// Ações que NÃO precisam de login (são públicas)
// *** A CORREÇÃO ESTÁ AQUI: 'status' e 'get_todays_birthdays' foram adicionados ***
$public_actions = ['login', 'register', 'forgot_password', 'reset_password', 'get_config', 'status', 'get_todays_birthdays'];

// Se a ação NÃO for pública, verifica a sessão
if (!in_array($action, $public_actions)) {
    
    // 3a. Verifica se o usuário está logado
    if (!isset($_SESSION['user_db_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Sessão expirada. Faça login novamente.']);
        exit;
    }
    
    // 3b. Verifica se a sessão é válida (contra roubo de sessão)
    if (!isset($_SESSION['user_agent']) || $_SESSION['user_agent'] !== $_SERVER['HTTP_USER_AGENT']) {
        session_destroy(); // Destrói a sessão comprometida
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Sessão inválida (User Agent). Faça login novamente.']);
        exit;
    }

    // 3c. Verifica se é uma rota ADMIN
    if (str_starts_with($action, 'admin_')) {
        if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] != 1) {
            http_response_code(401); // 401 Unauthorized
            echo json_encode(['success' => false, 'message' => 'Acesso negado. Você não é um administrador.']);
            exit;
        }
        // Se for admin, define a variável que os scripts de admin usam
        $admin_db_id = $_SESSION['user_db_id'];
    }
}
// === FIM DA SEGURANÇA ===


// 4. Define o caminho para o arquivo de lógica
$api_file = __DIR__ . '/api/' . $action . '.php';

if (file_exists($api_file)) {
    try {
        // 5. Executa o arquivo de lógica
        include $api_file;
        
    } catch (Exception $e) {
        error_log("Erro fatal na ação '$action': " . $e->getMessage());
        if ($conn && $conn->in_transaction) {
            $conn->rollback(); 
        }
        echo json_encode(['success' => false, 'message' => 'Ocorreu um erro interno no servidor.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => "Ação '$action' desconhecida."]);
}

// 6. Fecha a conexão
if ($conn) {
    $conn->close();
}
?>