// --- JAVASCRIPT (MODIFICADO) ---
        
let currentUserName = null;
let currentUserPhotoUrl = null;
let currentUserId = null; 
let currentUserIsAdmin = false;
let lastGeneratedShareImageUrl = null;
let countdownInterval = null; 
let globalAppName = 'Sorteio'; 
let globalSettings = {}; 
let globalLogoUrl = 'images/sua-logo.png'; 
let deferredInstallPrompt = null; 
let adminChartInstance = null; 

const loadImage = (src) => {
    return new Promise((resolve) => {
        if (!src) {
            resolve(null);
            return;
        }
        const img = new Image();
        img.crossOrigin = "Anonymous"; 
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn(`Erro ao carregar imagem: ${src}. Usando logo padrão.`);
            const defaultLogo = new Image();
            defaultLogo.src = 'images/sua-logo.png';
            defaultLogo.onload = () => resolve(defaultLogo);
            defaultLogo.onerror = () => resolve(null);
        }; 
        
        if (src && (src.includes('uploads') || src.startsWith('blob:') || src.includes('images'))) {
            img.src = src + '?' + new Date().getTime();
        } else {
            img.src = src;
        }
    });
};

// ======================================================
// === FUNÇÃO APIREQUEST (CORREÇÃO FINAL) ===
// ======================================================
async function apiRequest(action, body) {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Lista de ações que rodam silenciosamente (sem o spinner de loading)
    const silentLoads = [
        'status', 
        'get_config', 
        'get_todays_birthdays', 
        'admin_get_chart_data', 
        'mark_withdrawals_viewed', 
        'mark_payments_viewed',
        'admin_get_audit_logs',
        'admin_get_users',
        'admin_get_settings'
    ]; 
    
    if(!silentLoads.includes(action)) {
        loadingOverlay.classList.remove('hidden'); 
    }

    try {
        // A "action" (nome do script) vai na URL
        const url = `api.php?action=${action}`;
        
        // Os "dados" (body) decidem o método (GET ou POST)
        const options = { headers: {} };
        
        if (body instanceof FormData) {
            // Se for FormData (upload de logo/foto), usa POST
            options.method = 'POST';
            options.body = body;
        } else if (body !== undefined) {
            // Se for um objeto JSON (login, busca, etc.), usa POST
            options.method = 'POST';
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        } else {
            // Se NENHUM body for enviado (status, get_config), usa GET
            options.method = 'GET'; 
        }
        
        const response = await fetch(url, options);
        
        if (response.status === 401) {
            if (action !== 'status') { 
                const data = await response.json();
                showCustomAlert(data.message || 'Sessão expirada. Faça login novamente.', false);
                setTimeout(() => window.location.reload(), 2000); 
            }
            return { success: false, message: 'Unauthorized' };
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            return { success: false, message: errorData?.message || 'Erro de rede ou servidor.' };
        }
        return await response.json();
    } catch (error) {
        console.error('Erro na API:', error);
        return { success: false, message: 'Erro de conexão.' };
    } finally {
        if(!silentLoads.includes(action)) {
            loadingOverlay.classList.add('hidden'); 
        }
    }
}
// ======================================================
// === FIM DA FUNÇÃO APIREQUEST ATUALIZADA ===
// ======================================================

// ======================================================
// === FUNÇÕES MOVIDAS PARA O ESCOPO GLOBAL ===
// ======================================================
function showCustomAlert(message, isSuccess = true) {
    const alertModal = document.getElementById('alert-modal');
    const alertModalTitle = document.getElementById('alert-modal-title');
    const alertModalMessage = document.getElementById('alert-modal-message');
    
    if (!alertModal || !alertModalTitle || !alertModalMessage) {
        alert(message);
        return;
    }

    alertModalTitle.textContent = isSuccess ? 'Sucesso!' : 'Aviso';
    alertModalTitle.style.color = isSuccess ? 'var(--theme-success)' : 'var(--theme-danger)';
    alertModalMessage.textContent = message;
    alertModal.classList.remove('hidden');
}

function showCustomConfirm(message) {
    const alertModal = document.getElementById('alert-modal');
    const alertModalTitle = document.getElementById('alert-modal-title');
    const alertModalMessage = document.getElementById('alert-modal-message');

    return new Promise((resolve) => {
        alertModalTitle.textContent = 'Confirmação';
        alertModalTitle.style.color = 'var(--theme-primary)';
        alertModalMessage.textContent = message;
        
        const oldModalButtons = alertModal.querySelector('.modal-buttons');
        const newModalButtons = oldModalButtons.cloneNode(true); 
        
        newModalButtons.innerHTML = `
            <button id="confirm-yes" class="button-danger">Sim</button>
            <button id="confirm-no" class="button-outline">Não</button>
        `;
        
        oldModalButtons.parentNode.replaceChild(newModalButtons, oldModalButtons);
        
        document.getElementById('confirm-yes').onclick = () => {
            alertModal.classList.add('hidden');
            restoreAlertButtons(newModalButtons);
            resolve(true);
        };
        document.getElementById('confirm-no').onclick = () => {
            alertModal.classList.add('hidden');
            restoreAlertButtons(newModalButtons);
            resolve(false);
        };

        alertModal.classList.remove('hidden');
    });
}

function restoreAlertButtons(modalButtonsContainer) {
     modalButtonsContainer.innerHTML = '<button id="alert-modal-close-button">OK</button>';
     const newCloseButton = document.getElementById('alert-modal-close-button');
     if(newCloseButton) {
         newCloseButton.onclick = () => {
            document.getElementById('alert-modal').classList.add('hidden');
         };
     }
}
// ======================================================
// === FIM DAS FUNÇÕES MOVIDAS ===
// ======================================================


function triggerConfetti() {
    const confettiCount = 100;
    const colors = ['#ffeb3b', '#ffd700', '#ffffff', '#e1bee7', '#ce93d8'];
    for (let i = 0; i < confettiCount; i++) {
        const confetto = document.createElement('div');
        confetto.classList.add('confetti');
        confetto.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetto.style.width = `${Math.random() * 10 + 5}px`;
        confetto.style.height = `${Math.random() * 10 + 5}px`;
        confetto.style.transform = 'translate(0, 0) rotate(0deg)';
        document.body.appendChild(confetto);
        setTimeout(() => {
            const randomX = (Math.random() - 0.5) * 2 * window.innerWidth / 1.5;
            const randomY = (Math.random() - 0.5) * 2 * window.innerHeight / 1.5;
            const randomRot = Math.random() * 720;
            confetto.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRot}deg)`;
            confetto.style.opacity = 0;
        }, 10);
        setTimeout(() => {
            confetto.remove();
        }, 2100);
    }
}

async function generateCollectionCanvas(amount, userName, userPhotoUrl) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 600;

    const [bgImg, logoImg, profileImg] = await Promise.all([
        loadImage('images/fundo-share.jpg'), 
        loadImage(globalLogoUrl), 
        loadImage(userPhotoUrl)            
    ]);

    if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, 600, 600);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#0c001f');
        gradient.addColorStop(1, '#19003a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 600, 600);
    }
    
    if (logoImg) {
        ctx.drawImage(logoImg, 225, 20, 150, 150); 
    }

    if (profileImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 250, 60, 0, Math.PI * 2, true); 
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(profileImg, 40, 190, 120, 120); 
        ctx.restore();
        ctx.beginPath();
        ctx.arc(100, 250, 62, 0, Math.PI * 2, true);
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    const textX = profileImg ? 370 : 300;
    const textY = profileImg ? 230 : 250;
    ctx.fillText(`Parabéns,`, textX, textY);
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ffeb3b';
    ctx.fillText(userName, textX, textY + 50);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 34px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Você solicitou um saque de`, 300, 450); 
    
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffeb3b';
    ctx.fillText(`${amount.toLocaleString('pt-BR')} Coins!`, 300, 520);

    return canvas.toDataURL('image/jpeg', 0.9);
}

async function generateBirthdayCanvas(amount, userName, userPhotoUrl) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 600;

    const [bgImg, logoImg, profileImg] = await Promise.all([
        loadImage('images/fundo-share.jpg'), 
        loadImage(globalLogoUrl), 
        loadImage(userPhotoUrl)            
    ]);

    if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, 600, 600);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#0c001f');
        gradient.addColorStop(1, '#19003a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 600, 600);
    }
    
    if (logoImg) {
        ctx.drawImage(logoImg, 225, 20, 150, 150); 
    }

    if (profileImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(100, 250, 60, 0, Math.PI * 2, true); 
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(profileImg, 40, 190, 120, 120); 
        ctx.restore();
        ctx.beginPath();
        ctx.arc(100, 250, 62, 0, Math.PI * 2, true);
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    const textX = profileImg ? 370 : 300;
    const textY = profileImg ? 230 : 250;
    ctx.fillText(`Feliz Aniversário,`, textX, textY);
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ffeb3b';
    ctx.fillText(userName, textX, textY + 50);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 34px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Você ganhou um presente de`, 300, 450);
    
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffeb3b';
    ctx.fillText(`${amount.toLocaleString('pt-BR')} Coins!`, 300, 520);

    return canvas.toDataURL('image/jpeg', 0.9);
}

document.addEventListener('DOMContentLoaded', () => {

    // === 1. REFERÊNCIAS DE ELEMENTOS (LOGIN) ===
    const loginContainer = document.getElementById('login-container');
    const loginIdInput = document.getElementById('login-id');
    const loginPasswordInput = document.getElementById('login-password');
    const loginButton = document.getElementById('login-button');
    const registerNameInput = document.getElementById('register-name');
    const registerEmailInput = document.getElementById('register-email');
    const registerPhotoInput = document.getElementById('register-photo');
    const registerPhotoLabel = document.querySelector('label[for="register-photo"]');
    const registerButton = document.getElementById('register-button');
    const toggleToRegister = document.getElementById('toggle-to-register');
    const toggleToLogin = document.getElementById('toggle-to-login');
    const formTitle = document.getElementById('form-title');
    const loginError = document.getElementById('login-error');
    const referralIdInput = document.getElementById('referral-id');
    const registerDobInput = document.getElementById('register-dob');
    const registerDobLabel = document.querySelector('label[for="register-dob"]');
    
    const toggleToForgot = document.getElementById('toggle-to-forgot');
    const loginEmailInput = document.getElementById('login-email');
    const forgotPasswordButton = document.getElementById('forgot-password-button');
    
    const resetPasswordContainer = document.getElementById('reset-password-container');
    const resetTokenInput = document.getElementById('reset-token');
    const resetNewPasswordInput = document.getElementById('reset-new-password');
    const resetConfirmPasswordInput = document.getElementById('reset-confirm-password');
    const resetPasswordButton = document.getElementById('reset-password-button');
    const resetError = document.getElementById('reset-error');
    const logoReset = document.getElementById('logo-reset');


    // === 3. REFERÊNCIAS RESTANTES (APP E OUTROS) ===
    const appContainer = document.getElementById('app-container');
    const logoutButton = document.getElementById('logout-button');
    const mainTitle = document.getElementById('main-title');
    const userGreeting = document.getElementById('user-greeting');
    const profilePic = document.getElementById('profile-pic');
    const checkinButton = document.getElementById('checkin-button');
    const resetButton = document.getElementById('reset-button');
    const resultContainer = document.getElementById('result-container');
    const resultMessage = document.getElementById('result-message');
    const generatedShareImage = document.getElementById('generated-share-image');
    const whatsappShareButton = document.getElementById('whatsapp-share-button');
    const resultActions = document.getElementById('result-actions');
    
    const pointHistoryContainer = document.getElementById('point-history-container');
    const pointHistoryList = document.getElementById('point-history-list');
    
    const editProfileContainer = document.getElementById('edit-profile-container');
    const closeProfileButton = document.getElementById('close-profile-button');
    const saveProfileButton = document.getElementById('save-profile-button');
    const editCurrentPassword = document.getElementById('edit-current-password');
    const editNewPassword = document.getElementById('edit-new-password');
    const editPhotoInput = document.getElementById('edit-photo');
    const editProfileError = document.getElementById('edit-profile-error');

    const streakContainer = document.getElementById('streak-container');
    const streakProgressBar = document.getElementById('streak-progress-bar');
    const countdownTimer = document.getElementById('countdown-timer');
    const streakMilestoneNotice = document.getElementById('streak-milestone-notice');
    const streakWeeklyNotice = document.getElementById('streak-weekly-notice');
    
    const walletContainer = document.getElementById('wallet-container');
    const walletBalance = document.getElementById('wallet-balance');
    const referralInfoContainer = document.getElementById('referral-info-container');
    const referralLinkDisplay = document.getElementById('referral-link-display');
    const referralLinkDisplayHelp = document.getElementById('referral-link-display-help');
    
    const collectBalanceButton = document.getElementById('collect-balance-button');
    const collectNotice = document.getElementById('collect-notice');
    const referralListContainer = document.getElementById('referral-list-container');
    const referralList = document.getElementById('referral-list');
    const referralListTitle = document.getElementById('referral-list-title');
    
    const birthdayCountdownContainer = document.getElementById('birthday-countdown-container');
    const birthdayCountdownText = document.getElementById('birthday-countdown-text');
    const birthdayModal = document.getElementById('birthday-modal');
    const birthdayClaimButton = document.getElementById('birthday-claim-button');
    const birthdayModalCloseButton = document.getElementById('birthday-modal-close-button');
    
    const mainTabButtons = document.querySelectorAll('.main-nav .tab-button');
    const mainTabPanels = document.querySelectorAll('.main-content > .tab-panel');
    const adminTabButtons = document.querySelectorAll('.admin-nav .tab-button');
    const adminTabPanels = document.querySelectorAll('.admin-content > .tab-panel');
    
    const adminSearchInput = document.getElementById('admin-search');
    const adminUserList = document.getElementById('admin-user-list');
    const editUserModal = document.getElementById('edit-user-modal');
    const editUserTitle = document.getElementById('edit-user-title');
    const editUserDbId = document.getElementById('edit-user-db-id');
    const editUserNameInput = document.getElementById('edit-user-name');
    const editUserDobInput = document.getElementById('edit-user-dob');
    const editUserNewPasswordInput = document.getElementById('edit-user-new-password');
    const editUserAdjustmentAmount = document.getElementById('edit-user-adjustment-amount');
    const editUserAdjustmentReason = document.getElementById('edit-user-adjustment-reason');
    const editUserError = document.getElementById('edit-user-error');
    const saveUserButton = document.getElementById('save-user-button');
    const closeModalButton = document.getElementById('close-modal-button');
    const deleteUserButton = document.getElementById('delete-user-button');
    
    const statTotalUsers = document.getElementById('stat-total-users');
    const statTotalCoins = document.getElementById('stat-total-coins');
    const statCheckinsToday = document.getElementById('stat-checkins-today');
    const statNewUsersToday = document.getElementById('stat-new-users-today');
    
    const saveSettingsButton = document.getElementById('save-settings-button');
    const saveSettingsStatus = document.getElementById('save-settings-status');
    
    const logoUploadInput = document.getElementById('setting-logo-upload');
    const logoPreview = document.getElementById('logo-preview');
    const uploadLogoStatus = document.getElementById('upload-logo-status');
    const loginLogo = document.getElementById('logo');
    
    const tickerWrap = document.getElementById('ticker-wrap');
    const tickerContent = document.getElementById('ticker-content');
    
    const installPwaButton = document.getElementById('install-pwa-button');
    
    const withdrawalHistoryContainer = document.getElementById('withdrawal-history-container');
    const withdrawalHistoryList = document.getElementById('withdrawal-history-list');
    const adminPaymentList = document.getElementById('admin-payment-list');
    const adminAuditLogList = document.getElementById('admin-audit-log-list');

    const leaderboardList = document.getElementById('leaderboard-list'); 
    const withdrawNotificationDot = document.getElementById('withdraw-notification-dot');
    const adminNotificationDot = document.getElementById('admin-notification-dot');
    const paymentsNotificationDot = document.getElementById('payments-notification-dot');
    
    const colorPickerPrimary = document.getElementById('setting-color-picker-primary');
    const colorTextPrimary = document.getElementById('setting-color-text-primary');
    const colorPickerSecondary = document.getElementById('setting-color-picker-secondary');
    const colorTextSecondary = document.getElementById('setting-color-text-secondary');
    const colorPickerAccent = document.getElementById('setting-color-picker-accent');
    const colorTextAccent = document.getElementById('setting-color-text-accent');
    const colorPickerSuccess = document.getElementById('setting-color-picker-success');
    const colorTextSuccess = document.getElementById('setting-color-text-success');
    
    const alertModal = document.getElementById('alert-modal');
    const alertModalTitle = document.getElementById('alert-modal-title');
    const alertModalMessage = document.getElementById('alert-modal-message');
    const alertModalCloseButton = document.getElementById('alert-modal-close-button');
    
    
    // NOVA FUNÇÃO (ETAPA 4)
    // Controla a visibilidade dos campos na tela de login
    function setLoginMode(mode) {
        loginError.textContent = '';
        
        // Oculta todos os campos e botões
        [loginIdInput, loginEmailInput, loginPasswordInput, registerNameInput, registerEmailInput, 
         registerPhotoInput, registerPhotoLabel, registerDobInput, registerDobLabel, 
         loginButton, registerButton, forgotPasswordButton, toggleToRegister, 
         toggleToLogin, toggleToForgot].forEach(el => el.classList.add('hidden'));

        if (mode === 'login') {
            formTitle.textContent = 'Acesso ao Sistema';
            [loginIdInput, loginPasswordInput, loginButton, toggleToRegister, toggleToForgot].forEach(el => el.classList.remove('hidden'));
        } else if (mode === 'register') {
            formTitle.textContent = 'Criar sua Conta';
            [loginIdInput, loginPasswordInput, registerNameInput, registerEmailInput, 
             registerPhotoInput, registerPhotoLabel, registerDobInput, registerDobLabel, 
             registerButton, toggleToLogin].forEach(el => el.classList.remove('hidden'));
        } else if (mode === 'forgot') {
            formTitle.textContent = 'Recuperar Senha';
            [loginEmailInput, forgotPasswordButton, toggleToLogin].forEach(el => el.classList.remove('hidden'));
        }
    }


    // === 2. LISTENERS DE LOGIN/CADASTRO (ATUALIZADOS) ===
    toggleToRegister.addEventListener('click', () => {
        setLoginMode('register');
    });

    toggleToLogin.addEventListener('click', () => {
        setLoginMode('login');
    });
    
    // NOVO LISTENER
    toggleToForgot.addEventListener('click', () => {
        setLoginMode('forgot');
    });
    
    loginButton.addEventListener('click', async () => {
        const user_id = loginIdInput.value;
        const password = loginPasswordInput.value;
        loginButton.disabled = true;
        loginButton.textContent = 'Entrando...';
        
        const response = await apiRequest('login', { user_id, password });
        
        if (response.success) {
            const statusResponse = await apiRequest('status');
            if (statusResponse.success) {
                currentUserName = statusResponse.name;
                currentUserPhotoUrl = statusResponse.photo_url;
                currentUserId = statusResponse.user_id;
                currentUserIsAdmin = statusResponse.is_admin === 1;
                globalSettings = statusResponse.settings; 
                showApp(statusResponse); 
            } else {
                showLoginError(statusResponse.message || 'Erro ao carregar dados.');
            }
        } else {
            showLoginError(response.message);
        }
        loginButton.disabled = false;
        loginButton.textContent = 'Entrar';
    });
    
    registerButton.addEventListener('click', async () => {
        const formData = new FormData();
        formData.append('user_id', loginIdInput.value);
        formData.append('password', loginPasswordInput.value);
        formData.append('name', registerNameInput.value);
        formData.append('email', registerEmailInput.value);
        formData.append('dob', registerDobInput.value);
        formData.append('referral_id', referralIdInput.value);
        
        if (registerPhotoInput.files[0]) {
            formData.append('photo', registerPhotoInput.files[0]);
        }
        registerButton.disabled = true;
        registerButton.textContent = 'Enviando...';
        
        const response = await apiRequest('register', formData);
        if (response.success) {
            showLoginError(response.message, true);
            setLoginMode('login'); // Volta para o login
        } else {
            showLoginError(response.message, false);
        }
        registerButton.disabled = false;
        registerButton.textContent = 'Finalizar Cadastro';
    });
    
    // NOVO LISTENER
    forgotPasswordButton.addEventListener('click', async () => {
        const email = loginEmailInput.value;
        if (!email) {
            showLoginError('Por favor, digite seu e-mail.');
            return;
        }
        
        forgotPasswordButton.disabled = true;
        forgotPasswordButton.textContent = 'Enviando...';
        
        const response = await apiRequest('forgot_password', { email });
        
        if (response.success) {
            showLoginError(response.message, true); // Mostra "Se o e-mail existir..."
        } else {
            showLoginError(response.message, false); // Mostra erro (ex: falha ao enviar)
        }
        
        forgotPasswordButton.disabled = false;
        forgotPasswordButton.textContent = 'Enviar Link';
    });
    
    // NOVO LISTENER
    resetPasswordButton.addEventListener('click', async () => {
        const token = resetTokenInput.value;
        const newPassword = resetNewPasswordInput.value;
        const confirmPassword = resetConfirmPasswordInput.value;
        
        if (!newPassword || !confirmPassword) {
            resetError.textContent = 'Por favor, preencha os dois campos.';
            return;
        }
        if (newPassword !== confirmPassword) {
            resetError.textContent = 'As senhas não coincidem.';
            return;
        }
        
        resetPasswordButton.disabled = true;
        resetPasswordButton.textContent = 'Salvando...';
        resetError.textContent = '';
        
        const response = await apiRequest('reset_password', {
            token: token,
            password: newPassword
        });
        
        if (response.success) {
            resetError.style.color = '#69F0AE';
            resetError.textContent = 'Senha redefinida! Redirecionando para o login...';
            setTimeout(() => {
                window.location.href = window.location.pathname; // Recarrega a página sem o token
            }, 3000);
        } else {
            resetError.textContent = response.message;
            resetPasswordButton.disabled = false;
            resetPasswordButton.textContent = 'Salvar Nova Senha';
        }
    });


    // === 4. LISTENERS RESTANTES (APP) ===
    
    mainTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            mainTabButtons.forEach(btn => btn.classList.remove('active'));
            mainTabPanels.forEach(panel => panel.classList.remove('active'));
            
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'tab-admin' && currentUserIsAdmin) {
                adminTabButtons.forEach(btn => btn.classList.remove('active'));
                adminTabPanels.forEach(panel => panel.classList.remove('active'));
                document.querySelector('.admin-nav .tab-button[data-tab="tab-admin-stats"]').classList.add('active');
                document.getElementById('tab-admin-stats').classList.add('active');
                loadAdminStats();
                loadAdminCharts(); 
            }
            if (tabId === 'tab-withdraw') {
                loadWithdrawalHistory();
                withdrawNotificationDot.classList.add('hidden'); 
                apiRequest('mark_withdrawals_viewed'); 
            }
            if (tabId === 'tab-ranking') { 
                loadLeaderboard();
            }
        });
    });
    
    adminTabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            adminTabButtons.forEach(btn => btn.classList.remove('active'));
            adminTabPanels.forEach(panel => panel.classList.remove('active'));
            
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'tab-admin-users') {
                loadAdminUsers();
            } else if (tabId === 'tab-admin-config') {
                loadSystemSettings();
            } else if (tabId === 'tab-admin-stats') { 
                loadAdminStats();
                loadAdminCharts(); 
            } 
            else if (tabId === 'tab-admin-payments') { 
                loadPendingWithdrawals();
                adminNotificationDot.classList.add('hidden'); 
                paymentsNotificationDot.classList.add('hidden'); 
                apiRequest('mark_payments_viewed'); 
            }
            else if (tabId === 'tab-admin-logs') {
                loadAuditLogs();
            }
        });
    });

    logoutButton.addEventListener('click', async () => {
        if (countdownInterval) { 
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        if (adminChartInstance) { 
            adminChartInstance.destroy();
            adminChartInstance = null;
        }
        window.history.pushState({}, document.title, window.location.pathname);
        
        await apiRequest('logout');
        currentUserName = null;
        currentUserPhotoUrl = null;
        currentUserId = null;
        currentUserIsAdmin = false;
        showLogin();
    });

    referralLinkDisplay.addEventListener('click', () => {
        const linkToCopy = referralLinkDisplay.textContent;
        if (!linkToCopy) return; 
        
        navigator.clipboard.writeText(linkToCopy).then(() => {
            referralLinkDisplay.textContent = 'Copiado!';
            referralLinkDisplayHelp.classList.add('hidden');
            setTimeout(() => {
                const currentUrl = window.location.href.split('?')[0];
                const referralLink = `${currentUrl}?ref=${currentUserId}`;
                referralLinkDisplay.textContent = referralLink;
                referralLinkDisplayHelp.classList.remove('hidden');
            }, 2000);
        }).catch(err => {
            console.error('Erro ao copiar: ', err);
            referralLinkDisplayHelp.textContent = 'Erro ao copiar.';
        });
    });

    collectBalanceButton.addEventListener('click', async () => {
        const threshold = globalSettings.collection_threshold || 20000;
        const confirmed = await showCustomConfirm(`Você confirma a solicitação de saque de ${threshold.toLocaleString('pt-BR')} coins?`);
        if (!confirmed) {
            return;
        }
        
        collectBalanceButton.disabled = true;
        collectBalanceButton.textContent = 'Solicitando...';
        
        const response = await apiRequest('collect_balance', {});
        
        if (response.success) {
            showCustomAlert('Solicitação de saque enviada! Você será redirecionado para notificar o admin.');
            
            const adminNumber = globalSettings.admin_whatsapp_number;
            if (adminNumber) {
                const message = `Olá! Sou ${currentUserName} (ID: ${currentUserId}). Acabei de solicitar um saque de ${threshold.toLocaleString('pt-BR')} coins. Por favor, processe meu pagamento.`;
                window.open(`https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`, '_blank');
            }
            
            const statusResponse = await apiRequest('status');
            if (statusResponse.success) {
                updateWalletUI(statusResponse.total_balance, statusResponse.has_pending_withdrawal);
            }
        } else {
            showCustomAlert(response.message || 'Erro ao solicitar saque.', false);
            collectBalanceButton.disabled = false; 
            updateWalletUI(parseInt(walletBalance.textContent.replace(/\./g,'')) || 0, false);
        }
    });

    birthdayClaimButton.addEventListener('click', async () => {
        birthdayClaimButton.disabled = true;
        birthdayClaimButton.textContent = 'Resgatando...';

        const response = await apiRequest('claim_birthday_bonus', {});

        if (response.success) {
            updateWalletUI(response.new_total_balance);
            loadPointHistory();
            birthdayModal.classList.add('hidden'); 

            hideMainAppUI();
            resultContainer.classList.remove('hidden');
            resultMessage.textContent = 'Gerando sua imagem de aniversário...';

            try {
                const dataUrl = await generateBirthdayCanvas(globalSettings.bonus_birthday, currentUserName, currentUserPhotoUrl);
                const saveResponse = await apiRequest('save_share_image', { imageData: dataUrl });

                if (saveResponse.success) {
                    lastGeneratedShareImageUrl = saveResponse.url;
                    generatedShareImage.src = lastGeneratedShareImageUrl;
                    generatedShareImage.classList.remove('hidden');
                    
                    const shareText = encodeURIComponent(`Ganhei ${globalSettings.bonus_birthday.toLocaleString('pt-BR')} coins de presente de aniversário no ${globalAppName}! 🥳`);
                    whatsappShareButton.href = `https://api.whatsapp.com/send?text=${shareText} ${encodeURIComponent(lastGeneratedShareImageUrl)}`;
                    
                    resultActions.classList.remove('hidden');
                    resultMessage.textContent = 'Parabéns pelo seu aniversário!';
                    triggerConfetti();
                } else {
                    throw new Error(saveResponse.error || 'Erro ao salvar imagem.');
                }
            } catch (err) {
                console.error('Erro ao gerar/salvar imagem de aniversário:', err);
                resultMessage.textContent = 'Erro ao gerar imagem. Tente novamente.';
                resultActions.classList.remove('hidden');
                whatsappShareButton.classList.add('hidden');
            }
            
        } else {
            showCustomAlert(response.message || 'Erro ao resgatar bônus.', false);
            birthdayClaimButton.disabled = false;
            birthdayClaimButton.textContent = `Resgatar ${globalSettings.bonus_birthday.toLocaleString('pt-BR')} Coins!`;
        }
    });
    
    birthdayModalCloseButton.addEventListener('click', () => {
        birthdayModal.classList.add('hidden');
    });

    checkinButton.addEventListener('click', async () => {
        checkinButton.disabled = true;
        checkinButton.textContent = 'Registrando...';
        
        const response = await apiRequest('checkin', {});
        
        if (response.success) {
            updateCheckinStatus(response); 
            loadPointHistory(); 
            
            if (response.milestoneBonusAwarded && response.milestoneBonusAwarded > 0) {
                 setTimeout(() => {
                    showCustomAlert(`🎉 Marco Atingido! 🎉\nVocê completou ${response.milestoneDays} check-ins e ganhou um bônus de ${response.milestoneBonusAwarded.toLocaleString('pt-BR')} coins!`);
                }, 500);
            }
            else if (response.bonusPointsAwarded && response.bonusPointsAwarded > 0) {
                setTimeout(() => {
                    showCustomAlert(`Parabéns! Você atingiu um marco de ${response.consecutiveDays} dias e ganhou um bônus de ${response.bonusPointsAwarded.toLocaleString('pt-BR')} coins!`);
                }, 200);
            } else {
                 setTimeout(() => {
                    showCustomAlert(`Check-in realizado! Você ganhou ${globalSettings.bonus_checkin.toLocaleString('pt-BR')} coins.`);
                }, 200);
            }
        } else {
            showCustomAlert(response.message || 'Erro no Check-in', false);
            checkinButton.textContent = 'Erro no Check-in';
            checkinButton.disabled = false;
        }
    });

    resetButton.addEventListener('click', async () => {
        const status = await apiRequest('status');
        if(status.success) {
            globalSettings = status.settings; 
            resetUI();
            updateCheckinStatus(status); 
            loadPointHistory(); 
            loadReferrals();
            loadLeaderboard(); 
            if(!currentUserIsAdmin) loadWithdrawalHistory();
            updateBirthdayCountdown(status.dob, status.last_birthday_bonus_year);
        }
    });

    profilePic.addEventListener('click', () => {
        appContainer.classList.add('hidden');
        editProfileContainer.classList.remove('hidden');
        editProfileError.textContent = '';
        editCurrentPassword.value = '';
        editNewPassword.value = '';
        editPhotoInput.value = '';
    });
    
    closeProfileButton.addEventListener('click', () => {
        editProfileContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
    });
    saveProfileButton.addEventListener('click', async () => {
        const currentPassword = editCurrentPassword.value;
        const newPassword = editNewPassword.value;
        const photoFile = editPhotoInput.files[0];

        if (newPassword && !currentPassword) {
            editProfileError.textContent = 'Digite sua senha ATUAL para definir uma nova.';
            return;
        }
        if (!newPassword && !photoFile && !currentPassword) {
            editProfileError.textContent = 'Nenhuma alteração detectada.';
            return;
        }
        saveProfileButton.disabled = true;
        saveProfileButton.textContent = 'Salvando...';
        editProfileError.textContent = '';

        const formData = new FormData();
        if (newPassword) {
            formData.append('current_password', currentPassword);
            formData.append('new_password', newPassword);
        }
        if (photoFile) {
            formData.append('photo', photoFile);
        }
        if (photoFile && !newPassword && currentPassword) {
             formData.append('current_password', currentPassword);
        }
        
        const response = await apiRequest('update_profile', formData);
        
        if (response.success) {
            editProfileError.style.color = '#b2dfdb';
            editProfileError.textContent = 'Perfil atualizado com sucesso!';
            
            if (response.newPhotoUrl) {
                currentUserPhotoUrl = response.newPhotoUrl;
                profilePic.src = currentUserPhotoUrl + '?' + new Date().getTime();
            }
            setTimeout(() => {
                closeProfileButton.click();
                saveProfileButton.disabled = false;
                saveProfileButton.textContent = 'Salvar Alterações';
            }, 2000);
        } else {
            editProfileError.style.color = '#ffcdd2';
            editProfileError.textContent = response.message;
            saveProfileButton.disabled = false;
            saveProfileButton.textContent = 'Salvar Alterações';
        }
    });
    
    closeModalButton.addEventListener('click', () => {
        editUserModal.classList.add('hidden');
    });
    
    saveUserButton.addEventListener('click', async () => {
        const db_id = editUserDbId.value;
        const adjustment_amount = parseInt(editUserAdjustmentAmount.value) || 0;
        const adjustment_reason = editUserAdjustmentReason.value;
        
        const name = editUserNameInput.value;
        const dob = editUserDobInput.value;
        const new_password = editUserNewPasswordInput.value;
        
        saveUserButton.disabled = true;
        saveUserButton.textContent = 'Salvando...';
        editUserError.textContent = '';
        
        const response = await apiRequest('admin_update_user', {
            db_id: parseInt(db_id),
            adjustment_amount: adjustment_amount,
            adjustment_reason: adjustment_reason,
            name: name,
            dob: dob,
            new_password: new_password
        });
        
        if (response.success) {
            editUserModal.classList.add('hidden');
            loadAdminUsers(adminSearchInput.value); 
        } else {
            editUserError.textContent = response.message || 'Erro ao salvar.';
        }
        
        saveUserButton.disabled = false;
        saveUserButton.textContent = 'Salvar';
    });
    
    deleteUserButton.addEventListener('click', async () => {
        const db_id = editUserDbId.value;
        const userName = editUserNameInput.value;
        
        const confirmed1 = await showCustomConfirm(`TEM CERTEZA que deseja DESATIVAR ${userName}?\n\nO usuário não poderá mais fazer login.`);
        if (!confirmed1) return;
        
        const confirmed2 = await showCustomConfirm(`SEGUNDA CONFIRMAÇÃO:\n\nTodos os dados serão mantidos, mas o acesso será bloqueado. Deseja continuar?`);
        if (!confirmed2) return;
        
        deleteUserButton.disabled = true;
        deleteUserButton.textContent = 'Desativando...';
        editUserError.textContent = '';
        
        const response = await apiRequest('admin_delete_user', {
            db_id: parseInt(db_id)
        });
        
        if (response.success) {
            editUserModal.classList.add('hidden');
            loadAdminUsers(adminSearchInput.value); 
        } else {
            editUserError.textContent = response.message || 'Erro ao desativar.';
        }
        
        deleteUserButton.disabled = false;
        deleteUserButton.textContent = 'Desativar Usuário';
    });
    
    adminSearchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' || adminSearchInput.value.length > 2 || adminSearchInput.value.length === 0) {
            loadAdminUsers(adminSearchInput.value);
        }
    });
    
    saveSettingsButton.addEventListener('click', async () => {
        saveSettingsButton.disabled = true;
        saveSettingsButton.textContent = 'Salvando...';
        saveSettingsStatus.textContent = '';
        
        const settings = {
            appName: document.getElementById('setting-appName').value,
            bonus_checkin: document.getElementById('setting-bonus_checkin').value,
            bonus_streak: document.getElementById('setting-bonus_streak').value,
            bonus_referral: document.getElementById('setting-bonus_referral').value,
            bonus_welcome: document.getElementById('setting-bonus_welcome').value,
            bonus_birthday: document.getElementById('setting-bonus_birthday').value,
            collection_threshold: document.getElementById('setting-collection_threshold').value,
            copyright_holder: document.getElementById('setting-copyright_holder').value,
            announcement_message: document.getElementById('setting-announcement_message').value,
            admin_whatsapp_number: document.getElementById('setting-admin_whatsapp_number').value,
            
            bonus_checkin_30: document.getElementById('setting-bonus_checkin_30').value,
            bonus_checkin_60: document.getElementById('setting-bonus_checkin_60').value,
            bonus_referral_5: document.getElementById('setting-bonus_referral_5').value,
            bonus_referral_10: document.getElementById('setting-bonus_referral_10').value,
            
            theme_color_primary: document.getElementById('setting-color-text-primary').value,
            theme_color_secondary: document.getElementById('setting-color-text-secondary').value,
            theme_color_accent: document.getElementById('setting-color-text-accent').value,
            theme_color_success: document.getElementById('setting-color-text-success').value
        };
        
        const response = await apiRequest('admin_save_settings', { settings });
        
        if (response.success) {
            saveSettingsStatus.style.color = '#69F0AE';
            saveSettingsStatus.textContent = 'Salvo! As mudanças serão aplicadas no próximo login.';
            globalSettings = settings; 
            updateAllUITexts();
            applyTheme(settings);
        } else {
            saveSettingsStatus.style.color = '#ffcdd2';
            saveSettingsStatus.textContent = response.message || 'Erro ao salvar.';
        }
        
        saveSettingsButton.disabled = false;
        saveSettingsButton.textContent = 'Salvar Configurações';
    });
    
    logoUploadInput.addEventListener('change', async () => {
        const file = logoUploadInput.files[0];
        if (!file) return;

        uploadLogoStatus.style.color = '#d1c4e9';
        uploadLogoStatus.textContent = 'Enviando...';

        const formData = new FormData();
        formData.append('logo', file);

        const response = await apiRequest('admin_upload_logo', formData);

        if (response.success) {
            uploadLogoStatus.style.color = '#69F0AE';
            uploadLogoStatus.textContent = 'Logo atualizada!';
            globalLogoUrl = response.new_path; 
            updateAllUILogos(globalLogoUrl);
            globalSettings.logo_url = response.new_path;
        } else {
            uploadLogoStatus.style.color = '#ffcdd2';
            uploadLogoStatus.textContent = response.message || 'Erro no upload.';
        }
    });
    
    installPwaButton.addEventListener('click', async () => {
        if (!deferredInstallPrompt) {
            return;
        }
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('Usuário aceitou a instalação');
        } else {
            console.log('Usuário recusou a instalação');
        }
        deferredInstallPrompt = null;
        installPwaButton.classList.add('hidden');
    });
    
    function setupColorPicker(pickerId, textId) {
        const picker = document.getElementById(pickerId);
        const text = document.getElementById(textId);
        picker.addEventListener('input', () => { text.value = picker.value; });
        text.addEventListener('input', () => { picker.value = text.value; });
    }
    setupColorPicker('setting-color-picker-primary', 'setting-color-text-primary');
    setupColorPicker('setting-color-picker-secondary', 'setting-color-text-secondary');
    setupColorPicker('setting-color-picker-accent', 'setting-color-text-accent');
    setupColorPicker('setting-color-picker-success', 'setting-color-text-success');
    
    alertModalCloseButton.addEventListener('click', () => {
        alertModal.classList.add('hidden');
    });


    // === 5. DEFINIÇÕES DE FUNÇÕES DE LÓGICA (MOVIDAS) ===
    
    function showLoginError(message, isSuccess = false) {
        loginError.textContent = message;
        loginError.style.color = isSuccess ? '#b2dfdb' : '#ffcdd2';
    }

    function showLogin() {
        loginContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        editProfileContainer.classList.add('hidden');
        birthdayModal.classList.add('hidden');
        resetPasswordContainer.classList.add('hidden');
        
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.user-only').forEach(el => el.classList.add('hidden'));

        loginIdInput.value = '';
        loginPasswordInput.value = '';
        registerNameInput.value = '';
        registerEmailInput.value = '';
        registerPhotoInput.value = '';
        referralIdInput.value = ''; 
        registerDobInput.value = '';
        loginError.textContent = '';
        
        setLoginMode('login');
    }

    function showApp(status) {
        loginContainer.classList.add('hidden');
        resetPasswordContainer.classList.add('hidden');
        editProfileContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');

        userGreeting.textContent = `Bem-vindo(a), ${status.name}!`;
        
        if (status.is_admin === 1) {
            currentUserIsAdmin = true;
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
            document.querySelectorAll('.user-only').forEach(el => el.classList.add('hidden'));
            
            if (status.has_unviewed_payments) {
                adminNotificationDot.classList.remove('hidden');
                paymentsNotificationDot.classList.remove('hidden');
            } else {
                adminNotificationDot.classList.add('hidden');
                paymentsNotificationDot.classList.add('hidden');
            }
            
            mainTabButtons.forEach(btn => btn.classList.remove('active'));
            mainTabPanels.forEach(panel => panel.classList.remove('active'));
            document.querySelector('.main-nav .tab-button[data-tab="tab-admin"]').classList.add('active');
            document.getElementById('tab-admin').classList.add('active');
            
            adminTabButtons.forEach(btn => btn.classList.remove('active'));
            adminTabPanels.forEach(panel => panel.classList.remove('active'));
            document.querySelector('.admin-nav .tab-button[data-tab="tab-admin-stats"]').classList.add('active');
            document.getElementById('tab-admin-stats').classList.add('active');
            
            loadAdminStats();
            loadAdminCharts(); 
        } else {
            currentUserIsAdmin = false;
            document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.user-only').forEach(el => el.classList.remove('hidden'));
            
            updateWalletUI(status.total_balance, status.has_pending_withdrawal);
            updateBirthdayCountdown(status.dob, status.last_birthday_bonus_year);
            
            if (status.has_unviewed_withdrawals) {
                withdrawNotificationDot.classList.remove('hidden');
            } else {
                withdrawNotificationDot.classList.add('hidden');
            }
            
            resetUI(); 
            updateCheckinStatus(status); 
            loadPointHistory();
            loadReferrals(); 
            loadWithdrawalHistory();
            loadLeaderboard();
        }
        
        updateAllUITexts(); 
        loadPublicTicker(globalSettings.announcement_message);
        
        const currentUrl = window.location.href.split('?')[0];
        const referralLink = `${currentUrl}?ref=${status.user_id}`;
        referralLinkDisplay.textContent = referralLink;

        if (status.photo_url) {
            currentUserPhotoUrl = status.photo_url;
            profilePic.src = status.photo_url + '?' + new Date().getTime();
            profilePic.classList.remove('hidden');
        } else {
            profilePic.classList.add('hidden');
        }
    }

    function updateWalletUI(balance, has_pending = false) {
        const numericBalance = balance || 0;
        const threshold = globalSettings.collection_threshold || 20000;
        walletBalance.textContent = numericBalance.toLocaleString('pt-BR');
        
        collectBalanceButton.classList.remove('hidden');
        collectBalanceButton.textContent = `Solicitar Saque (${threshold.toLocaleString('pt-BR')})`;
        
        if (has_pending) {
            collectBalanceButton.disabled = true;
            collectNotice.classList.remove('hidden'); 
            collectNotice.textContent = 'Você já tem um saque pendente.';
        } else if (numericBalance >= threshold) {
            collectBalanceButton.disabled = false;
            collectNotice.classList.add('hidden'); 
        } else {
            collectBalanceButton.disabled = true;
            collectNotice.classList.remove('hidden'); 
            collectNotice.textContent = `Você pode solicitar seu saldo ao atingir ${threshold.toLocaleString('pt-BR')} coins.`;
        }
    }

    function updateCheckinStatus(status) {
        if (!status || !status.success) {
            checkinButton.textContent = 'Erro ao carregar status.';
            checkinButton.disabled = true;
            return;
        }
        
        checkinButton.classList.remove('hidden');
        const checkinBonus = globalSettings.bonus_checkin || 1000;

        if (status.canCheckIn) {
            checkinButton.disabled = false;
            checkinButton.textContent = `Fazer Check-in (+${checkinBonus.toLocaleString('pt-BR')} coins)`;
        } else { 
            checkinButton.disabled = true;
            checkinButton.textContent = 'Check-in Concluído!';
        }
        
        updateWalletUI(status.total_balance, status.has_pending_withdrawal);

        updateStreakUI(
            status.consecutiveDays || 0, 
            status.nextCheckinTime, 
            status.canCheckIn
        );
    }

    function updateStreakUI(consecutiveDays, nextCheckinTime, canCheckIn) {
        const days = consecutiveDays || 0;
        const currentWeekProgress = (days === 0) ? 0 : ((days - 1) % 7) + 1;
        const streakBonus = globalSettings.bonus_streak || 5000;
        
        streakProgressBar.innerHTML = '';
        for (let i = 0; i < 7; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'streak-day';
            if (i < currentWeekProgress) {
                dayEl.classList.add('active');
            }
            streakProgressBar.appendChild(dayEl);
        }
        
        streakWeeklyNotice.textContent = `Dias seguidos: ${days} (Semana: ${currentWeekProgress}/7)`;

        const nextMilestone = (Math.floor(days / 7) + 1) * 7;
        let milestoneText = `Próximo marco (${nextMilestone} dias): +${streakBonus.toLocaleString('pt-BR')} Coins`;

        if (days > 0 && days % 7 === 0) {
            streakMilestoneNotice.textContent = `Marco Atingido! (+${streakBonus.toLocaleString('pt-BR')} Coins)`;
        } else {
            streakMilestoneNotice.textContent = milestoneText;
        }

        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }

        if (!canCheckIn && nextCheckinTime) {
            const targetTime = new Date(nextCheckinTime).getTime();
            
            function updateTimer() {
                const now = new Date().getTime();
                const distance = targetTime - now;

                if (distance <= 0) {
                    clearInterval(countdownInterval);
                    countdownTimer.classList.add('hidden');
                    apiRequest('status').then(status => {
                        if (status.success) {
                            globalSettings = status.settings; 
                            updateCheckinStatus(status);
                        }
                    }); 
                    return;
                }

                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                countdownTimer.textContent = `Próximo check-in em: ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
                countdownTimer.classList.remove('hidden');
            }
            
            updateTimer();
            countdownInterval = setInterval(updateTimer, 1000);

        } else {
            countdownTimer.classList.add('hidden');
        }
    }
    
    function updateBirthdayCountdown(dobString, lastBonusYear) {
        if (!dobString) {
            birthdayCountdownContainer.classList.add('hidden');
            birthdayModal.classList.add('hidden');
            return;
        }

        try {
            const now = new Date();
            const currentYear = now.getFullYear();
            now.setHours(0, 0, 0, 0); 

            const [year, month, day] = dobString.split('-').map(Number);
            
            let nextBirthday = new Date(currentYear, month - 1, day);
            nextBirthday.setHours(0, 0, 0, 0);
            
            if (now > nextBirthday) {
                nextBirthday.setFullYear(currentYear + 1);
            }

            const diffTime = nextBirthday.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const bonusPaid = (lastBonusYear >= currentYear);
            const birthdayBonus = globalSettings.bonus_birthday || 50000;

            if (diffDays === 0) {
                birthdayCountdownContainer.classList.add('hidden'); 
                
                if (bonusPaid) {
                    birthdayModal.classList.add('hidden'); 
                } else {
                    birthdayModal.classList.remove('hidden'); 
                    birthdayClaimButton.disabled = false;
                    birthdayClaimButton.textContent = `Resgatar ${birthdayBonus.toLocaleString('pt-BR')} Coins!`;
                }
            } else if (diffDays === 1) {
                birthdayCountdownText.innerHTML = `🎂 Falta <strong>1 dia</strong> para o seu aniversário!`;
                birthdayCountdownContainer.classList.remove('hidden');
                birthdayModal.classList.add('hidden');
            } else if (diffDays > 1) {
                birthdayCountdownText.innerHTML = `🎂 Faltam <strong>${diffDays} dias</strong> para o seu aniversário!`;
                birthdayCountdownContainer.classList.remove('hidden');
                birthdayModal.classList.add('hidden');
            } else {
                birthdayCountdownContainer.classList.add('hidden');
                birthdayModal.classList.add('hidden');
            }
        } catch (e) {
            console.error("Erro ao calcular aniversário: ", e);
            birthdayCountdownContainer.classList.add('hidden');
            birthdayModal.classList.add('hidden');
        }
    }
    
    function hideMainAppUI() {
        appContainer.classList.add('hidden');
    }
    
    function showMainAppUI() {
        appContainer.classList.remove('hidden');
    }

    function resetUI() {
        if (countdownInterval) { 
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        resultContainer.classList.add('hidden');
        
        showMainAppUI(); 
        
        mainTabButtons.forEach(btn => btn.classList.remove('active'));
        mainTabPanels.forEach(panel => panel.classList.remove('active'));
        
        if (currentUserIsAdmin) {
            document.querySelector('.main-nav .tab-button[data-tab="tab-admin"]').classList.add('active');
            document.getElementById('tab-admin').classList.add('active');
        } else {
            document.querySelector('.main-nav .tab-button[data-tab="tab-checkin"]').classList.add('active');
            document.getElementById('tab-checkin').classList.add('active');
        }

        resultActions.classList.add('hidden');
        generatedShareImage.classList.add('hidden');
        whatsappShareButton.classList.remove('hidden');
        generatedShareImage.src = '';
        lastGeneratedShareImageUrl = null;
    }
    
    async function loadPointHistory() {
        const response = await apiRequest('get_point_history');
        pointHistoryList.innerHTML = ''; 
        if (response.success && response.history.length > 0) {
            pointHistoryContainer.classList.remove('hidden');
            
            response.history.forEach(item => {
                const li = document.createElement('li');
                const date = new Date(item.timestamp); 
                
                const formattedDate = date.toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                });
                
                let reasonText = '';
                let amountClass = item.amount > 0 ? 'points-positive' : 'points-negative';
                let amountText = `${item.amount > 0 ? '+' : ''}${item.amount.toLocaleString('pt-BR')}`;
                
                switch(item.reason) {
                    case 'checkin':
                        reasonText = 'Check-in Diário';
                        break;
                    case 'streak_bonus':
                        reasonText = 'Bônus (7 dias)';
                        break;
                    case 'referral_bonus':
                        reasonText = `Bônus: ${item.related_user_name || 'Novo Host'}`;
                        break;
                    case 'referral_welcome_bonus':
                        reasonText = '🎁 Bônus de Boas-Vindas!';
                        break;
                    case 'collection':
                        reasonText = 'Saldo Coletado';
                        break;
                    case 'Saque Aprovado': 
                        reasonText = 'Saque Aprovado';
                        break;
                    case 'birthday_bonus':
                        reasonText = '🎉 Bônus de Aniversário 🎉';
                        break;
                    case 'milestone_checkin_30':
                        reasonText = '🏆 Bônus: 30 Check-ins';
                        break;
                    case 'milestone_checkin_60':
                        reasonText = '🏆 Bônus: 60 Check-ins';
                        break;
                    case 'milestone_referral_5':
                        reasonText = '🏆 Bônus: 5 Indicações';
                        break;
                    case 'milestone_referral_10':
                        reasonText = '🏆 Bônus: 10 Indicações';
                        break;
                    default:
                        reasonText = item.reason; 
                }

                li.innerHTML = `
                    <div class="history-details">
                        <strong>${reasonText}</strong>
                        <span>${formattedDate}</span>
                    </div>
                    <span class="points-value ${amountClass}">${amountText}</span>
                `;
                pointHistoryList.appendChild(li);
            });
        } else {
            pointHistoryContainer.classList.remove('hidden');
            pointHistoryList.innerHTML = `<li style="justify-content: center; color: #d1c4e9; font-size: 0.9em;">Nenhuma transação de coins.</li>`;
        }
    }
    
    async function loadWithdrawalHistory() {
        const response = await apiRequest('get_withdrawal_history');
        withdrawalHistoryList.innerHTML = '';
        if (response.success && response.history.length > 0) {
            withdrawalHistoryContainer.classList.remove('hidden');
            
            response.history.forEach(item => {
                const li = document.createElement('li');
                const reqDate = new Date(item.requested_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                
                let statusText = '';
                let statusClass = '';
                
                if(item.status === 'paid') {
                    const paidDate = new Date(item.paid_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    statusText = `Pago em ${paidDate}`;
                    statusClass = 'status-paid';
                } else {
                    statusText = 'Pendente';
                    statusClass = 'status-pending';
                }

                li.innerHTML = `
                    <div class="history-details">
                        <strong>${item.amount.toLocaleString('pt-BR')} Coins</strong>
                        <span>Solicitado em: ${reqDate}</span>
                    </div>
                    <span class="points-value ${statusClass}">${statusText}</span>
                `;
                withdrawalHistoryList.appendChild(li);
            });
        } else {
            withdrawalHistoryContainer.classList.remove('hidden');
            withdrawalHistoryList.innerHTML = `<li style="justify-content: center; color: #d1c4e9; font-size: 0.9em;">Nenhuma solicitação de saque.</li>`;
        }
    }

    async function loadReferrals() {
        const response = await apiRequest('get_referrals');
        
        const count = response.count || 0;
        referralListTitle.textContent = `Meus Indicados (${count})`; 

        referralList.innerHTML = ''; 
        if (response.success && response.referrals.length > 0) {
            referralListContainer.classList.remove('hidden');
            
            response.referrals.forEach(item => {
                const li = document.createElement('li');
                
                const date = new Date(item.created_at);
                const formattedDate = date.toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                });

                li.innerHTML = `
                    <img src="${item.photo_url}" alt="Foto de ${item.name}">
                    <div class="referral-details">
                        <strong>${item.name}</strong>
                        <span>ID: ${item.user_id}</span>
                        <span style="font-size: 0.75em;">Entrou em: ${formattedDate}</span>
                    </div>
                `;
                referralList.appendChild(li);
            });
        } else {
            referralListContainer.classList.remove('hidden');
            referralList.innerHTML = `<li style="justify-content: center; color: #d1c4e9; font-size: 0.9em;">Você ainda não indicou ninguém.</li>`;
        }
    }

    async function loadLeaderboard() {
        leaderboardList.innerHTML = `<li style="justify-content: center; color: #d1c4e9; font-size: 0.9em;">Carregando ranking...</li>`;
        
        const response = await apiRequest('get_leaderboard');
        
        leaderboardList.innerHTML = '';
        if (response.success && response.leaderboard.length > 0) {
            
            response.leaderboard.forEach((user, index) => {
                const li = document.createElement('li');
                
                let rankDisplay = index + 1;
                if (index === 0) rankDisplay = '🥇';
                if (index === 1) rankDisplay = '🥈';
                if (index === 2) rankDisplay = '🥉';
                
               
                
                li.innerHTML = `
                    <span class="rank-position">${rankDisplay}</span>
                    <img src="${user.photo_url}" alt="Foto de ${user.name}">
                    <div class="rank-details">
                        <strong>${user.name}</strong>
                        <span>ID: ${user.user_id}</span>
                    </div>
                    <span class="rank-points">${user.points.toLocaleString('pt-BR')}</span>
                `;
                leaderboardList.appendChild(li);
            });
            
        } else {
            leaderboardList.innerHTML = `<li style="justify-content: center; color: #d1c4e9; font-size: 0.9em;">Ninguém no ranking ainda.</li>`;
        }
    }
    
    async function loadAdminStats() {
        statTotalUsers.textContent = '...';
        statTotalCoins.textContent = '...';
        statCheckinsToday.textContent = '...';
        statNewUsersToday.textContent = '...';
        
        const response = await apiRequest('admin_get_stats');
        if (response.success) {
            statTotalUsers.textContent = response.stats.total_users;
            statTotalCoins.textContent = response.stats.total_coins.toLocaleString('pt-BR');
            statCheckinsToday.textContent = response.stats.checkins_today;
            statNewUsersToday.textContent = response.stats.new_users_today;
        }
    }
    
    async function loadAdminCharts() {
        if (adminChartInstance) {
            adminChartInstance.destroy();
            adminChartInstance = null;
        }

        const response = await apiRequest('admin_get_chart_data');
        if (response.success) {
            const ctx = document.getElementById('admin-chart-canvas').getContext('2d');
            adminChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: response.data.labels, 
                    datasets: [{
                        label: 'Novos Usuários',
                        data: response.data.newUsersData, 
                        backgroundColor: 'rgba(0, 188, 212, 0.2)',
                        borderColor: 'rgba(0, 188, 212, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }, {
                        label: 'Check-ins',
                        data: response.data.checkinsData, 
                        backgroundColor: 'rgba(255, 235, 59, 0.2)',
                        borderColor: 'rgba(255, 235, 59, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            labels: { color: '#d1c4e9' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { 
                                color: '#d1c4e9',
                                stepSize: 1 
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                            ticks: { color: '#d1c4e9' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                    }
                }
            });
        }
    }
    
    async function loadAdminUsers(searchTerm = '') {
        adminUserList.innerHTML = `<li style="justify-content: center; color: #d1c4e9; font-size: 0.9em;">Buscando...</li>`;
        
        // *** CHAMADA CORRIGIDA ***
        // Ação e body separados.
        const response = await apiRequest('admin_get_users', { search: searchTerm });
        
        adminUserList.innerHTML = '';
        if (response.success && response.users.length > 0) {
            response.users.forEach(user => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="user-info">
                        <strong>${user.name}</strong>
                        <span>ID: ${user.user_id} | Saldo: ${user.points.toLocaleString('pt-BR')}</span>
                    </div>
                    <button class="edit-user-btn button-outline" 
                        data-id="${user.db_id}" 
                        data-name="${user.name}" 
                        data-points="${user.points}" 
                        data-dob="${user.dob || ''}" 
                        style="font-size: 0.8em; padding: 5px 10px;">Editar</button>
                `;
                adminUserList.appendChild(li);
            });
            
            document.querySelectorAll('.edit-user-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const data = e.currentTarget.dataset;
                    openEditModal(
                        data.id,
                        data.name,
                        data.points,
                        data.dob
                    );
                });
            });
            
        } else if (searchTerm === '') {
             adminUserList.innerHTML = `<li style="justify-content: center; color: #d1c4e9; font-size: 0.9em;">Nenhum usuário cadastrado.</li>`;
        } else {
            adminUserList.innerHTML = `<li style="justify-content: center; color: #d1c4e9; font-size: 0.9em;">Nenhum usuário encontrado.</li>`;
        }
    }
    
    async function loadPendingWithdrawals() {
        adminPaymentList.innerHTML = `<li style="justify-content: center; color: #d1c4e9; font-size: 0.9em;">Buscando...</li>`;
        
        const response = await apiRequest('admin_get_withdrawals');
        
        adminPaymentList.innerHTML = '';
        if (response.success && response.withdrawals.length > 0) {
            response.withdrawals.forEach(item => {
                const li = document.createElement('li');
                const date = new Date(item.requested_at);
                const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

                li.innerHTML = `
                    <div class="user-info">
                        <strong>${item.name} (ID: ${item.user_id})</strong>
                        <span>Valor: ${item.amount.toLocaleString('pt-BR')} coins</span>
                        <span style="font-size: 0.75em;">Pedido em: ${formattedDate}</span>
                    </div>
                    <button class="approve-withdrawal-btn" data-id="${item.id}" style="font-size: 0.8em; padding: 5px 10px;">Confirmar</button>
                `;
                adminPaymentList.appendChild(li);
            });
            
            adminPaymentList.querySelectorAll('.approve-withdrawal-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const withdrawalId = btn.dataset.id;
                    const confirmed = await showCustomConfirm('Você confirma o pagamento desta solicitação? O saldo será debitado do usuário.');
                    if (!confirmed) return;
                    
                    btn.disabled = true;
                    btn.textContent = '...';
                    
                    const approveResponse = await apiRequest('admin_approve_withdrawal', { withdrawal_id: parseInt(withdrawalId) });
                    
                    if (approveResponse.success) {
                        loadPendingWithdrawals();
                    } else {
                        showCustomAlert(approveResponse.message || 'Erro ao aprovar.', false);
                        btn.disabled = false;
                        btn.textContent = 'Confirmar';
                    }
                });
            });
            
        } else {
            adminPaymentList.innerHTML = `<li style="justify-content: center; color: #d1c4e9; font-size: 0.9em;">Nenhum saque pendente.</li>`;
        }
    }
    
    async function loadAuditLogs() {
        adminAuditLogList.innerHTML = `<li style="background: transparent; justify-content: center; color: #d1c4e9; font-size: 0.9em;">Carregando logs...</li>`;
        
        const response = await apiRequest('admin_get_audit_logs');
        
        adminAuditLogList.innerHTML = ''; 
        
        if (response.success && response.logs.length > 0) {
            response.logs.forEach(log => {
                const li = document.createElement('li');
                
                const date = new Date(log.timestamp);
                const formattedDate = date.toLocaleDateString('pt-BR', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                });
                
                const amountClass = log.amount > 0 ? 'points-positive' : 'points-negative';
                const amountText = `${log.amount > 0 ? '+' : ''}${log.amount.toLocaleString('pt-BR')}`;
                
                const reason = log.reason.replace('Ajuste Admin: ', '');

                li.innerHTML = `
                    <div class="user-info">
                        <strong>${reason}</strong>
                        <span>Admin: ${log.admin_name}</span>
                        <span>Usuário: ${log.user_name}</span>
                        <span style="font-size: 0.75em;">Em: ${formattedDate}</span>
                    </div>
                    <span class="points-value ${amountClass}" style="font-size: 1.1em; flex-shrink: 0; padding-left: 10px;">
                        ${amountText}
                    </span>
                `;
                
                adminAuditLogList.appendChild(li);
            });
            
        } else {
            adminAuditLogList.innerHTML = `<li style="background: transparent; justify-content: center; color: #d1c4e9; font-size: 0.9em;">Nenhum log de ajuste encontrado.</li>`;
        }
    }
    
    
    function openEditModal(db_id, name, points, dob) {
        editUserTitle.textContent = `Editar: ${name}`;
        editUserDbId.value = db_id;
        editUserNameInput.value = name;
        editUserDobInput.value = dob;
        
        document.getElementById('edit-user-current-points-display').textContent = parseInt(points).toLocaleString('pt-BR');
        editUserAdjustmentAmount.value = '0';
        
        editUserNewPasswordInput.value = '';
        editUserAdjustmentReason.value = '';
        editUserError.textContent = '';
        editUserModal.classList.remove('hidden');
    }
    
    async function loadSystemSettings() {
        saveSettingsStatus.textContent = 'Carregando...';
        // *** CHAMADA CORRIGIDA ***
        const response = await apiRequest('admin_get_settings');
        if (response.success) {
            const settings = response.settings;
            // Atualiza os campos do formulário
            document.getElementById('setting-appName').value = settings.appName;
            document.getElementById('setting-announcement_message').value = settings.announcement_message;
            document.getElementById('setting-admin_whatsapp_number').value = settings.admin_whatsapp_number;
            document.getElementById('setting-bonus_checkin').value = settings.bonus_checkin;
            document.getElementById('setting-bonus_streak').value = settings.bonus_streak;
            document.getElementById('setting-bonus_referral').value = settings.bonus_referral;
            document.getElementById('setting-bonus_welcome').value = settings.bonus_welcome;
            document.getElementById('setting-bonus_birthday').value = settings.bonus_birthday;
            document.getElementById('setting-collection_threshold').value = settings.collection_threshold;
            document.getElementById('setting-copyright_holder').value = settings.copyright_holder;
            
            // Campos de bônus de gamificação
            document.getElementById('setting-bonus_checkin_30').value = settings.bonus_checkin_30 || '';
            document.getElementById('setting-bonus_checkin_60').value = settings.bonus_checkin_60 || '';
            document.getElementById('setting-bonus_referral_5').value = settings.bonus_referral_5 || '';
            document.getElementById('setting-bonus_referral_10').value = settings.bonus_referral_10 || '';
            
            // Campos de cor
            colorTextPrimary.value = settings.theme_color_primary;
            colorPickerPrimary.value = settings.theme_color_primary;
            colorTextSecondary.value = settings.theme_color_secondary;
            colorPickerSecondary.value = settings.theme_color_secondary;
            colorTextAccent.value = settings.theme_color_accent;
            colorPickerAccent.value = settings.theme_color_accent;
            colorTextSuccess.value = settings.theme_color_success;
            colorPickerSuccess.value = settings.theme_color_success;
            
            // Logo
            if(settings.logo_url) {
                logoPreview.src = settings.logo_url + '?' + new Date().getTime(); 
            }

            saveSettingsStatus.textContent = '';
        } else {
            saveSettingsStatus.style.color = '#ffcdd2';
            saveSettingsStatus.textContent = 'Erro ao carregar configurações.';
        }
    }
    
    function updateAllUILogos(logoUrl) {
        globalLogoUrl = logoUrl; 
        loginLogo.src = logoUrl;
        logoReset.src = logoUrl;
        logoPreview.src = logoUrl + '?' + new Date().getTime();
    }
    
    function updateAllUITexts() {
        const checkinBonus = globalSettings.bonus_checkin || 1000;
        const streakBonus = globalSettings.bonus_streak || 5000;
        const referralBonus = globalSettings.bonus_referral || 10000;
        const welcomeBonus = globalSettings.bonus_welcome || 5000;
        
        document.title = globalAppName;
        document.getElementById('main-title').textContent = globalAppName;
        
        const footer = document.getElementById('copyright-footer');
        footer.innerHTML = `&copy; ${new Date().getFullYear()} Copyright feito por <a href="https://painel.agency" target="_blank">${globalSettings.copyright_holder || 'painel.agency'}</a>`;
        
        checkinButton.textContent = `Fazer Check-in (+${checkinBonus.toLocaleString('pt-BR')} coins)`;
        streakMilestoneNotice.textContent = `Complete 7 dias para +${streakBonus.toLocaleString('pt-BR')} Coins`;
        
        document.getElementById('referral-bonus-text').innerHTML = `Convide e ganhe <strong>${referralBonus.toLocaleString('pt-BR')} coins!</strong>`;
        document.getElementById('referral-welcome-text').innerHTML = `Seu amigo se cadastra e ganha <strong>${welcomeBonus.toLocaleString('pt-BR')} coins!</strong>`;

        updateWalletUI(parseInt(walletBalance.textContent.replace(/\./g,'')) || 0);
    }
    
    async function loadPublicTicker(adminMessage) {
        let itemsHTML = '';
        
        if (adminMessage) {
            itemsHTML += `<span class="ticker-item admin-message">${adminMessage}</span>`;
        }
        
        const response = await apiRequest('get_todays_birthdays');
        if (response.success && response.birthdays.length > 0) {
            response.birthdays.forEach(name => {
                itemsHTML += `<span class="ticker-item">🎉 Parabéns, <strong>${name}</strong>! Hoje é seu aniversário! ⭐</span>`;
            });
        }
        
        tickerContent.innerHTML = '';
        tickerContent.classList.remove('animate-ticker');
        
        if (itemsHTML) {
            tickerWrap.classList.remove('hidden');
            tickerContent.innerHTML = itemsHTML + itemsHTML; 
            
            const itemCount = (response.birthdays ? response.birthdays.length : 0) + (adminMessage ? 1 : 0);
            const animationDuration = itemCount * 5; 
            tickerContent.style.animationDuration = `${Math.max(20, animationDuration)}s`;
            
            setTimeout(() => {
                tickerContent.classList.add('animate-ticker');
            }, 10);
        } else {
            tickerWrap.classList.add('hidden');
        }
    }
    
    function applyTheme(colors) {
        const styleSheet = document.getElementById('dynamic-theme-styles');
        if (!styleSheet) return;
        
        styleSheet.innerHTML = `
            :root {
                --theme-primary: ${colors.theme_color_primary || '#ffeb3b'};
                --theme-secondary: ${colors.theme_color_secondary || '#4a148c'};
                --theme-accent: ${colors.theme_color_accent || '#00bcd4'};
                --theme-success: ${colors.theme_color_success || '#69F0AE'};
                --theme-danger: #f44336;
            }
        `;
    }


    // === 6. PONTO DE PARTIDA (MODIFICADO) ===
    (async () => {
        
        if(alertModalCloseButton) {
            alertModalCloseButton.addEventListener('click', () => {
                alertModal.classList.add('hidden');
            });
        }

        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker registrado com sucesso:', registration);
            } catch (error) {
                console.error('Falha ao registrar Service Worker:', error);
            }
        }
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault(); 
            deferredInstallPrompt = e; 
            installPwaButton.classList.remove('hidden');
        });
        
        let announcementMessage = '';
        
        try {
            const configResponse = await apiRequest('get_config');
            if (configResponse.success) {
                globalAppName = configResponse.appName;
                globalLogoUrl = configResponse.logo_url;
                announcementMessage = configResponse.announcement_message;
                
                document.title = globalAppName; 
                updateAllUILogos(globalLogoUrl);
                applyTheme(configResponse); 
                
                const footer = document.getElementById('copyright-footer');
                footer.innerHTML = `&copy; ${new Date().getFullYear()} Copyright feito por <a href="https://painel.agency" target="_blank">${configResponse.copyright_holder || 'painel.agency'}</a>`;
                
                document.getElementById('main-title').textContent = globalAppName;
                document.querySelector('#login-container h2').textContent = "Acesso ao Sistema";
            }
        } catch (e) {
            console.error("Erro ao buscar config:", e);
        }

        loadPublicTicker(announcementMessage);

        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        const token = urlParams.get('token'); 
        
        if (token) {
            showLogin(); 
            loginContainer.classList.add('hidden'); 
            resetPasswordContainer.classList.remove('hidden'); 
            resetTokenInput.value = token; 
            return; 
        }
        
        
        const response = await apiRequest('status'); 
        
        if (response && response.success) {
            // Usuário ESTÁ logado
            currentUserName = response.name;
            currentUserPhotoUrl = response.photo_url;
            currentUserId = response.user_id;
            currentUserIsAdmin = response.is_admin === 1;
            globalSettings = response.settings; 
            globalLogoUrl = globalSettings.logo_url || 'images/sua-logo.png';
            updateAllUILogos(globalLogoUrl);
            applyTheme(globalSettings);
            showApp(response); 
            
            if (refCode) {
                 window.history.pushState({}, document.title, window.location.pathname);
            }
        } else {
            // Usuário NÃO está logado
            showLogin();
            
            if (refCode && refCode.length === 8) {
                referralIdInput.value = refCode; 
                setLoginMode('register');
                loginIdInput.focus();
            }
        }
    })();

}); // Fim do 'DOMContentLoaded'