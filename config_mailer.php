<?php
// Arquivo: config_mailer.php
// ATENÇÃO: PREENCHA COM SUAS PRÓPRIAS CREDENCIAIS DE E-MAIL (SMTP)
//
// Se você usa o GMAIL, talvez precise criar uma "Senha de App":
// https://support.google.com/accounts/answer/185833
//
// Se usa sua hospedagem (cPanel), procure por "Contas de E-mail" -> "Connect Devices"
// para ver as configurações de SMTP.

define('SMTP_HOST', 'smtp.hostinger.com');      // Ex: smtp.gmail.com ou mail.seusite.com
define('SMTP_USERNAME', 'suporte@painel.agency'); // Ex: seu.email@gmail.com
define('SMTP_PASSWORD', 'Su19172230*'); // Sua senha de e-mail ou "App Password"
define('SMTP_PORT', 465);                    // 587 (TLS) ou 465 (SSL)
define('SMTP_SECURE', 'ssl');                // 'tls' ou 'ssl'

// E-mail que aparecerá como remetente
define('MAIL_FROM_EMAIL', 'suporte@painel.agency');
define('MAIL_FROM_NAME', 'Suporte Painel Agency'); // Ex: "CRM - Agência de live"
?>