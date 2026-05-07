// --- KONFIGURASI PENTING ---
const WS_URL = 'wss://version-limb-willpower.ngrok-free.dev'; 
const BOT_LINK = 'https://t.me/UnoYukbot'; 
const OWNER_ID = 7019297628; 

const tg = window.Telegram.WebApp;
tg.expand();

// --- KEAMANAN ---
if (!tg.initData) {
    document.getElementById('platform-blocker').style.display = 'flex';
    document.getElementById('loader').style.display = 'none';
    throw new Error("Akses ditolak: Hanya bisa dimainkan lewat Aplikasi Telegram.");
} else {
    document.getElementById('ui-container').style.display = 'block';
}

// --- VARIABEL GLOBAL ---
window.playerName = (tg.initDataUnsafe?.user?.first_name || "USER_" + Math.floor(Math.random() * 1000)).substring(0, 25);
window.userId = tg.initDataUnsafe?.user?.id || Math.floor(Math.random() * 1000000);
window.currentRoom = null;
window.currentGameType = 'UNO';
window.isMyTurn = false;
window.ws = null;

window.sendGameMessage = function(payload) {
    if (window.ws && window.currentRoom && window.ws.readyState === WebSocket.OPEN) {
        payload.room_code = window.currentRoom;
        window.ws.send(JSON.stringify(payload));
    }
};

window.showEpicPopup = function(mainText, subText, color) {
    const popup = document.getElementById('epic-popup');
    const textEl = document.getElementById('epic-popup-text');
    const subEl = document.getElementById('epic-popup-sub');

    textEl.innerText = mainText;
    textEl.style.color = color;
    subEl.innerText = subText;
    
    popup.style.display = 'block';
    
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(popup, 
            { scale: 0.2, opacity: 0, rotation: -15 },
            { scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" }
        );
        setTimeout(() => {
            gsap.to(popup, { scale: 0, opacity: 0, duration: 0.3, onComplete: () => {
                popup.style.display = 'none';
            }});
        }, 2000);
    } else {
        setTimeout(() => { popup.style.display = 'none'; }, 2000);
    }
};


/* =======================================================
   SISTEM CAROUSEL 3D (COVER-FLOW EFFECT)
======================================================= */
function updateCarousel3D() {
    document.querySelectorAll('.carousel-container').forEach(container => {
        const containerCenter = container.getBoundingClientRect().left + container.offsetWidth / 2;
        
        container.querySelectorAll('.carousel-card').forEach(card => {
            const cardCenter = card.getBoundingClientRect().left + card.offsetWidth / 2;
            const distance = Math.abs(containerCenter - cardCenter);
            const maxDistance = container.offsetWidth / 2;
            
            let scale = 1 - (distance / maxDistance) * 0.25; 
            if (scale < 0.8) scale = 0.8;
            
            let opacity = 1 - (distance / maxDistance) * 0.4;
            if (opacity < 0.5) opacity = 0.5;
            
            card.style.transform = `scale(${scale})`;
            card.style.opacity = opacity;
            card.style.zIndex = Math.round(scale * 100);
        });
    });
}

document.querySelectorAll('.carousel-container').forEach(container => {
    container.addEventListener('scroll', updateCarousel3D);
});

setTimeout(() => {
    document.querySelectorAll('.carousel-container').forEach(c => c.scrollLeft = 0);
    updateCarousel3D();
}, 100);


/* =======================================================
   DATA & LOGIKA LEADERBOARD DINAMIS (DARI DATABASE)
======================================================= */
let lbData = {}; // Akan diisi dari database PostgreSQL

function renderMiniLeaderboards() {
    ['UNO', 'CATUR', 'LUDO', 'SNAKE'].forEach(gameKey => {
        const container = document.getElementById(`mini-lb-${gameKey}`);
        if (!container) return;
        container.innerHTML = '';
        
        const data = lbData[gameKey] || [];
        const top5 = data.slice(0, 5); 
        
        if (top5.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:20px; font-size:0.75rem; color:#64748b;">Belum ada data...</div>`;
            return;
        }

        top5.forEach((p, idx) => {
            let rankClass = 'rank';
            if(idx === 0) rankClass += ' gold';
            else if(idx === 1) rankClass += ' silver';
            else if(idx === 2) rankClass += ' bronze';
            
            const eloStr = p.elo ? `<span style="color: #fcd34d; font-size:0.75rem;">⭐ Elo ${p.elo}</span>` : '';
            
            container.innerHTML += `
                <div class="lb-mini-item" style="display: flex; flex-direction: column; align-items: flex-start; padding: 6px 8px; margin-bottom: 4px;">
                    <div style="display: flex; width: 100%; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center;">
                            <span class="${rankClass}" style="margin-right: 6px;">${idx + 1}</span>
                            <span class="name" style="font-weight: 700; color: #f8fafc; max-width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</span>
                        </div>
                        ${eloStr}
                    </div>
                    <div style="font-size: 0.65rem; color: #94a3b8; margin-left: 23px; font-weight: 600; margin-top: 2px;">
                        W: <span style="color:#10b981;">${p.win}</span> &nbsp;|&nbsp; L: <span style="color:#ef4444;">${p.lose}</span> &nbsp;|&nbsp; <span style="color: #38bdf8;">${p.wr}%</span>
                    </div>
                </div>
            `;
        });
    });
}
renderMiniLeaderboards(); 

window.openLeaderboard = function(title, gameKey) {
    tg.HapticFeedback.impactOccurred('light');
    document.getElementById('lb-modal-title').innerText = `TOP 10 ${title}`;
    const listContainer = document.getElementById('lb-modal-list');
    listContainer.innerHTML = '';
    
    const data = lbData[gameKey] || [];
    if (data.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color:#94a3b8;">Belum ada data di klasemen ini.</div>`;
    }

    data.forEach((p, idx) => {
        let rankClass = 'lb-rank';
        if(idx === 0) rankClass += ' gold';
        else if(idx === 1) rankClass += ' silver';
        else if(idx === 2) rankClass += ' bronze';
        
        const eloStr = p.elo ? `<span style="color: #fcd34d; font-size:1rem;">⭐ Elo ${p.elo}</span>` : '';

        listContainer.innerHTML += `
            <div class="lb-modal-item" style="display: flex; flex-direction: column; align-items: flex-start; padding: 12px 15px; margin-bottom: 6px;">
                <div style="display: flex; width: 100%; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center;">
                        <span class="${rankClass}" style="margin-right: 12px;">#${idx + 1}</span>
                        <span class="lb-name" style="font-weight: 800; color: white; font-size: 1.05rem; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</span>
                    </div>
                    ${eloStr}
                </div>
                <div style="font-size: 0.8rem; color: #94a3b8; margin-left: 45px; font-weight: 600; margin-top: 6px; display:flex; gap: 8px;">
                    <span style="background: rgba(16,185,129,0.2); color:#34d399; padding: 2px 6px; border-radius: 4px;">Menang: ${p.win}</span> 
                    <span style="background: rgba(239,68,68,0.2); color:#f87171; padding: 2px 6px; border-radius: 4px;">Kalah: ${p.lose}</span> 
                    <span style="background: rgba(14,165,233,0.2); color:#38bdf8; padding: 2px 6px; border-radius: 4px;">WR: ${p.wr}%</span>
                </div>
            </div>
        `;
    });
    document.getElementById('leaderboard-modal').style.display = 'flex';
};


// --- ELEMEN UI UTAMA ---
const uiLoader = document.getElementById('loader');
const animatedBg = document.getElementById('animated-bg'); 
const gameHubMenu = document.getElementById('game-hub-menu');
const lobbyMenu = document.getElementById('lobby-menu');
const gameInfo = document.getElementById('game-info');
const gameControls = document.getElementById('game-controls'); 
const roomDisplay = document.getElementById('room-display');
window.messageBox = document.getElementById('message-box'); 

const btnPlayUno = document.getElementById('btn-play-uno');
const btnPlayChess = document.getElementById('btn-play-chess');
const btnPlayLudo = document.getElementById('btn-play-ludo'); 
const btnPlaySnake = document.getElementById('btn-play-snake'); 
const backToHubBtn = document.getElementById('back-to-hub-btn');
const copyLinkBtn = document.getElementById('copy-link-btn');
const roomCodeInput = document.getElementById('room-code-input');
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');

const gameOverMenu = document.getElementById('game-over-menu');
const winnerNameDisplay = document.getElementById('winner-name');
const playAgainBtn = document.getElementById('play-again-btn');
const exitGameBtn = document.getElementById('exit-game-btn');

const chatPanel = document.getElementById('chat-panel');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatToggleBtn = document.getElementById('chat-toggle-btn');
const chatBadge = document.getElementById('chat-badge');

let isChatOpen = true;
let unreadChats = 0;

chatToggleBtn.addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('light');
    isChatOpen = !isChatOpen;
    chatPanel.style.display = isChatOpen ? 'flex' : 'none';
    if (isChatOpen) {
        unreadChats = 0;
        chatBadge.style.display = 'none';
        chatBadge.innerText = '0';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

const globalBannerContainer = document.getElementById('global-banner-container');
const bannerTextEl = document.getElementById('banner-text');
const ownerPanelBtn = document.getElementById('owner-panel-btn');
let isClientBannerEnabled = true;

const startBtn = document.createElement('button');
startBtn.className = 'modern-btn primary';
startBtn.style.width = '100%';
startBtn.style.marginTop = '15px';
startBtn.style.display = 'none';
startBtn.innerText = 'MULAI PERMAINAN 🚀';
document.querySelector('#lobby-menu .menu-box').appendChild(startBtn);


document.getElementById('player-timer').addEventListener('click', () => {
    if (window.userId === OWNER_ID || window.userId === "7019297628") {
        if (window.currentGameType === 'CHESS' && window.isMyTurn) {
            tg.HapticFeedback.impactOccurred('medium');
            window.sendGameMessage({ type: 'request_chess_hint' });
        }
    }
});


window.showCustomAlert = function(message, title = "INFO") {
    document.getElementById('popup-title').innerText = title;
    document.getElementById('popup-message').innerHTML = message;
    document.getElementById('popup-cancel-btn').style.display = 'none';
    document.getElementById('custom-popup').style.display = 'flex';
    document.getElementById('popup-ok-btn').onclick = () => {
        tg.HapticFeedback.impactOccurred('light');
        document.getElementById('custom-popup').style.display = 'none';
    };
};

window.showCustomConfirm = function(message, callback, title = "KONFIRMASI") {
    document.getElementById('popup-title').innerText = title;
    document.getElementById('popup-message').innerHTML = message;
    document.getElementById('popup-cancel-btn').style.display = 'block';
    document.getElementById('custom-popup').style.display = 'flex';
    
    document.getElementById('popup-ok-btn').onclick = () => {
        tg.HapticFeedback.impactOccurred('light');
        document.getElementById('custom-popup').style.display = 'none';
        callback(true);
    };
    document.getElementById('popup-cancel-btn').onclick = () => {
        tg.HapticFeedback.impactOccurred('light');
        document.getElementById('custom-popup').style.display = 'none';
        callback(false);
    };
};


function updateScoreboard(scores) {
    const scoreContainer = document.getElementById('score-board-container');
    const scoreDisplay = document.getElementById('score-display');

    if (!scores || Object.keys(scores).length === 0) return; 

    const players = Object.keys(scores);
    
    if (players.length === 2) {
        const p1 = players[0].length > 8 ? players[0].substring(0, 8) : players[0];
        const p2 = players[1].length > 8 ? players[1].substring(0, 8) : players[1];
        const s1 = scores[players[0]];
        const s2 = scores[players[1]];
        scoreDisplay.innerHTML = `${p1} <span style="color:#fcd34d; margin:0 10px; font-size:0.9rem;">${s1} - ${s2}</span> ${p2}`;
    } else {
        let scoreArr = [];
        for (const [name, score] of Object.entries(scores)) {
            let shortName = name.length > 6 ? name.substring(0, 6) + '..' : name;
            scoreArr.push(`${shortName}: <span style="color:#fcd34d;">${score}</span>`);
        }
        scoreDisplay.innerHTML = scoreArr.join(' <span style="color:#6b7280; margin:0 5px;">|</span> ');
    }
}


function setLobbyState(inRoom, players = []) {
    if (inRoom) {
        roomCodeInput.style.display = 'none';
        joinRoomBtn.style.display = 'none';
        createRoomBtn.style.display = 'none';
        rulesBtn.style.display = 'none';
        backToHubBtn.style.display = 'none';
        copyLinkBtn.style.display = 'block'; 

        chatToggleBtn.style.display = 'flex';
        chatPanel.style.display = isChatOpen ? 'flex' : 'none'; 

        const div = lobbyMenu.querySelector('.divider');
        if(div) div.style.display = 'none';

        lobbyMenu.querySelector('h3').innerText = `ROOM: ${window.currentRoom}`;
        
        if (window.currentGameType === 'CHESS') {
            startBtn.style.display = players.length === 2 ? 'block' : 'none';
        } else {
            startBtn.style.display = players.length >= 2 ? 'block' : 'none';
        }

        let playerListDiv = document.getElementById('lobby-player-list');
        if (!playerListDiv) {
            playerListDiv = document.createElement('div');
            playerListDiv.id = 'lobby-player-list';
            playerListDiv.style.marginBottom = '20px';
            playerListDiv.style.fontSize = '0.9rem';
            playerListDiv.style.color = '#38bdf8';
            startBtn.parentNode.insertBefore(playerListDiv, startBtn);
        }
        playerListDiv.style.display = 'block';
        playerListDiv.innerHTML = `<span style="color:white; font-weight:bold;">Pemain (${players.length}):</span><br>${players.join('<br>')}`;

        let leaveLobbyBtn = document.getElementById('leave-lobby-btn');
        if (!leaveLobbyBtn) {
            leaveLobbyBtn = document.createElement('button');
            leaveLobbyBtn.id = 'leave-lobby-btn';
            leaveLobbyBtn.className = 'modern-btn danger';
            leaveLobbyBtn.style.width = '100%';
            leaveLobbyBtn.style.marginTop = '10px';
            leaveLobbyBtn.innerText = 'KELUAR ROOM';
            leaveLobbyBtn.onclick = () => {
                if (window.ws && window.currentRoom && window.ws.readyState === WebSocket.OPEN) {
                    window.ws.send(JSON.stringify({ type: 'leave_room', room_code: window.currentRoom }));
                }
                resetToLobby();
            };
            startBtn.parentNode.appendChild(leaveLobbyBtn);
        }
        leaveLobbyBtn.style.display = 'block';
    } else {
        roomCodeInput.style.display = 'block';
        joinRoomBtn.style.display = 'block';
        createRoomBtn.style.display = 'block';
        rulesBtn.style.display = 'block';
        backToHubBtn.style.display = 'block';
        copyLinkBtn.style.display = 'none'; 
        
        chatToggleBtn.style.display = 'none';
        chatPanel.style.display = 'none';
        
        const div = lobbyMenu.querySelector('.divider');
        if(div) div.style.display = 'flex';

        lobbyMenu.querySelector('h3').innerText = `${window.currentGameType} MULTIPLAYER`;
        startBtn.style.display = 'none';

        const playerListDiv = document.getElementById('lobby-player-list');
        if (playerListDiv) playerListDiv.style.display = 'none';

        const leaveLobbyBtn = document.getElementById('leave-lobby-btn');
        if (leaveLobbyBtn) leaveLobbyBtn.style.display = 'none';
    }
}

function resetToLobby() {
    window.currentRoom = null; 
    window.isMyTurn = false;
    
    document.getElementById('score-board-container').style.display = 'none';
    
    if (window.userId === OWNER_ID || window.userId === "7019297628" || window.userId === 7019297628) {
        document.getElementById('owner-panel-btn').style.display = 'flex';
    }
    
    if (window.resetUno) window.resetUno();
    if (window.resetChess) window.resetChess();
    if (window.resetLudo) window.resetLudo(); 
    if (window.resetSnake) window.resetSnake(); 

    chatMessages.innerHTML = '';
    unreadChats = 0;
    chatBadge.style.display = 'none';
    chatBadge.innerText = '0';
    
    gameInfo.style.display = 'none';
    gameControls.style.display = 'none';
    gameOverMenu.style.display = 'none';
    lobbyMenu.style.display = 'flex';
    
    playAgainBtn.innerText = "MAIN LAGI";
    playAgainBtn.disabled = false;
    
    setLobbyState(false);
    roomCodeInput.value = '';
}


let isReconnecting = false;
let autoJoinRoomCode = null;

const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam && roomParam.startsWith('ROOM-')) autoJoinRoomCode = roomParam.toUpperCase();
else if (tg.initDataUnsafe?.start_param && tg.initDataUnsafe.start_param.startsWith('ROOM-')) autoJoinRoomCode = tg.initDataUnsafe.start_param.toUpperCase();

function connectWebSocket() {
    try {
        window.ws = new WebSocket(WS_URL);
        
        window.ws.onopen = () => {
            isReconnecting = false;
            // Meminta Data Banner & Link
            window.ws.send(JSON.stringify({ type: 'get_initial_data' }));
            
            // MEMINTA DATA KLASMEN DARI POSTGRESQL SAAT STARTUP
            window.ws.send(JSON.stringify({ type: 'get_leaderboard' }));

            setInterval(() => {
                if (window.ws && window.ws.readyState === WebSocket.OPEN) window.ws.send(JSON.stringify({ type: 'ping' }));
            }, 30000); 

            if (autoJoinRoomCode) {
                uiLoader.style.opacity = '0';
                setTimeout(() => { 
                    uiLoader.style.display = 'none'; 
                    window.currentRoom = autoJoinRoomCode;
                    window.ws.send(JSON.stringify({ type: 'join_room', player_name: window.playerName, room_code: autoJoinRoomCode, user_id: window.userId, init_data: tg.initData }));
                    autoJoinRoomCode = null; 
                    window.history.replaceState({}, document.title, window.location.pathname);
                    lobbyMenu.style.display = 'flex'; 
                }, 500);
            } else if (uiLoader.style.display === 'flex') {
                uiLoader.style.opacity = '0';
                setTimeout(() => {
                    uiLoader.style.display = 'none';
                    lobbyMenu.style.display = 'flex';
                    uiLoader.style.opacity = '1';
                }, 500);
            }
        };

        window.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.scores) updateScoreboard(data.scores);
            
            // --- TERIMA DATA LEADERBOARD BARU ---
            if (data.type === 'leaderboard_data') {
                lbData = data.data;
                renderMiniLeaderboards(); // Langsung render begitu dapat balasan dari DB
            }
            
            // --- PENANGANAN DATA AWAL & BANNER ---
            else if (data.type === 'initial_data') {
                if (data.banner_text && data.banner_text.trim() !== '') {
                    bannerTextEl.innerText = data.banner_text;
                    if (isClientBannerEnabled) globalBannerContainer.style.display = 'flex';
                } else {
                    globalBannerContainer.style.display = 'none';
                }
                document.getElementById('app-download-btn').innerText = `📥 ${data.app_link_text}`;
                document.getElementById('app-download-btn').href = data.app_link_url;
                document.getElementById('app-download-container').style.display = data.app_link_enabled ? 'block' : 'none';
            }
            
            else if (data.type === 'global_banner') {
                if (data.text && data.text.trim() !== '') {
                    bannerTextEl.innerText = data.text;
                    if (isClientBannerEnabled) globalBannerContainer.style.display = 'flex';
                } else {
                    globalBannerContainer.style.display = 'none';
                }
            }
            
            else if (data.type === 'app_link_data') {
                document.getElementById('app-download-btn').innerText = `📥 ${data.text}`;
                document.getElementById('app-download-btn').href = data.url;
                document.getElementById('app-download-container').style.display = data.enabled ? 'block' : 'none';
            }

            else if (data.type === 'room_created') {
                window.currentRoom = data.room_code;
                setLobbyState(true, [window.playerName]);
            } 
            else if (data.type === 'player_joined') {
                window.currentRoom = data.room_code || window.currentRoom;
                setLobbyState(true, data.players_list);
                tg.HapticFeedback.notificationOccurred('success');
            } 
            else if (data.type === 'player_left') {
                if (lobbyMenu.style.display !== 'none' && data.players_list) {
                    setLobbyState(true, data.players_list);
                } else {
                    window.showCustomAlert(`🚪 <b>Lawan mu keluar room.</b>`, "INFO");
                    resetToLobby();
                }
            } 
            else if (data.type === 'error') {
                window.showCustomAlert(data.message, "PERINGATAN");
                if (!window.currentRoom) { uiLoader.style.display = 'none'; lobbyMenu.style.display = 'flex'; }
            }
            else if (data.type === 'chat_message') {
                appendChatMessage(data.player_name, data.text, data.player_name === window.playerName);
                if (!isChatOpen) {
                    unreadChats++;
                    chatBadge.innerText = unreadChats > 9 ? '9+' : unreadChats;
                    chatBadge.style.display = 'flex';
                    tg.HapticFeedback.notificationOccurred('success');
                }
            }
            else if (data.type === 'play_again_request') {
                if (data.player_name !== window.playerName) {
                    tg.HapticFeedback.notificationOccurred('success');
                    if (gameOverMenu.style.display === 'flex') {
                        winnerNameDisplay.innerHTML += `
                            <div style="margin-top:15px; padding: 10px; background: rgba(245, 158, 11, 0.2); border: 1px solid #fcd34d; border-radius: 8px; font-size:0.9rem; color:#fcd34d; font-weight:bold; letter-spacing:1px; text-align:center; animation: popIn 0.3s;">
                                🔄 Lawan mu ngajak main lagi!
                            </div>`;
                    } else {
                        window.showCustomAlert(`🔄 Lawan mu ngajak main lagi!`, "INFO");
                    }
                }
            }
            
            else if (data.type === 'game_started') {
                lobbyMenu.style.display = 'none'; gameOverMenu.style.display = 'none';
                
                document.getElementById('owner-panel-btn').style.display = 'none';
                
                gameInfo.style.display = 'flex'; 
                document.getElementById('score-board-container').style.display = 'flex';
                chatToggleBtn.style.display = 'flex';
                
                tg.HapticFeedback.notificationOccurred('success');
                roomDisplay.innerText = window.currentRoom; 
                
                playAgainBtn.innerText = "MAIN LAGI";
                playAgainBtn.disabled = false;
                
                window.currentGameType = data.game_type || window.currentGameType;
                
                if (window.currentGameType === 'UNO') {
                    gameControls.style.display = 'flex'; 
                    if(window.startUnoGame) window.startUnoGame(data);
                } else if (window.currentGameType === 'CHESS') {
                    gameControls.style.display = 'none'; 
                    if(window.startChessGame) window.startChessGame(data);
                } else if (window.currentGameType === 'LUDO') {
                    gameControls.style.display = 'none'; 
                    if(window.startLudoGame) window.startLudoGame(data);
                } else if (window.currentGameType === 'SNAKE') {
                    gameControls.style.display = 'none'; 
                    if(window.startSnakeGame) window.startSnakeGame(data);
                }
            }
            else if (data.type === 'game_over') {
                if (data.reason === "Lawan keluar.") {
                    window.showCustomAlert(`🚪 <b>Lawan mu keluar room.</b>`, "INFO");
                    resetToLobby();
                    return; 
                }

                tg.HapticFeedback.notificationOccurred('success');
                let htmlText = data.winner;
                
                if (data.reason) {
                    htmlText += ` <br><span style="font-size:0.8rem; color:#ef4444; font-weight:bold;">(${data.reason})</span>`;
                }

                if (data.scores) {
                    htmlText += `
                        <div style="margin-top:15px; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.3); font-size:0.9rem; text-align:left; color:#e2e8f0; text-transform:none; text-shadow:none;">
                            <div style="color:#38bdf8; font-weight:800; margin-bottom:8px; text-transform:uppercase; text-align:center;">🏆 SKOR SESI INI</div>
                    `;
                    const sortedScores = Object.entries(data.scores).sort((a, b) => b[1] - a[1]);
                    sortedScores.forEach((item, index) => {
                        htmlText += `
                            <div style="margin-bottom:4px; padding:4px 8px; background:rgba(0,0,0,0.3); border-radius:6px; display:flex; justify-content:space-between;">
                                <span>${index + 1}. ${item[0]}</span> 
                                <span style="color:#fcd34d; font-weight:bold;">${item[1]} Menang</span>
                            </div>`;
                    });
                    htmlText += `</div>`;
                }
                
                winnerNameDisplay.innerHTML = htmlText;
                playAgainBtn.innerText = "MAIN LAGI";
                playAgainBtn.disabled = false;
                
                if (window.currentGameType === 'UNO' && window.resetUno) window.resetUno(true);
                if (window.currentGameType === 'LUDO' && window.resetLudo) window.resetLudo(true);
                if (window.currentGameType === 'SNAKE' && window.resetSnake) window.resetSnake(true);
                
                gameOverMenu.style.display = 'flex'; gameControls.style.display = 'none';
                const navLeftBtn = document.getElementById('nav-left-btn');
                if (navLeftBtn) { navLeftBtn.style.display = 'none'; document.getElementById('nav-right-btn').style.display = 'none'; }
            }
            
            else {
                if (['game_state', 'card_played', 'draw_result', 'uno_shout', 'uno_penalty'].includes(data.type)) {
                    if (window.handleUnoMessage) window.handleUnoMessage(data);
                }
                else if (['chess_state', 'chess_move', 'chess_cheat_hint'].includes(data.type)) {
                    if (window.handleChessMessage) window.handleChessMessage(data);
                }
                else if (['ludo_state', 'dice_rolled'].includes(data.type)) {
                    if (window.handleLudoMessage) window.handleLudoMessage(data);
                }
                else if (['snake_state', 'snake_dice_rolled'].includes(data.type)) {
                    if (window.handleSnakeMessage) window.handleSnakeMessage(data);
                }
            }
        };

        window.ws.onclose = () => {
            window.ws = null;
            if (window.currentRoom) {
                window.showCustomAlert("Koneksi terputus! Mengembalikan Anda ke lobi utama...", "KONEKSI HILANG");
                resetToLobby(); 
            }
            if (!isReconnecting) {
                isReconnecting = true;
                setTimeout(() => { 
                    isReconnecting = false; 
                    connectWebSocket(); 
                }, 3000); 
            }
        };
    } catch (e) { console.error("WebSocket Error:", e); }
}

if (autoJoinRoomCode) {
    gameHubMenu.style.display = 'none'; uiLoader.style.display = 'flex';
} else {
    uiLoader.style.display = 'none'; gameHubMenu.style.display = 'flex';
}
connectWebSocket();

// --- INTERAKSI HUB & LOBBY MENU ---
btnPlayUno.addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('light');
    window.currentGameType = 'UNO';
    lobbyMenu.querySelector('h1').innerText = 'UNO 3D';
    gameHubMenu.style.display = 'none'; lobbyMenu.style.display = 'flex';
});

btnPlayChess.addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('light');
    window.currentGameType = 'CHESS';
    lobbyMenu.querySelector('h1').innerText = 'CATUR VIP';
    gameHubMenu.style.display = 'none'; lobbyMenu.style.display = 'flex';
});

if (btnPlayLudo) {
    btnPlayLudo.addEventListener('click', () => {
        tg.HapticFeedback.impactOccurred('light');
        window.currentGameType = 'LUDO';
        lobbyMenu.querySelector('h1').innerText = 'LUDO 2D VIP';
        gameHubMenu.style.display = 'none'; lobbyMenu.style.display = 'flex';
    });
}

if (btnPlaySnake) {
    btnPlaySnake.addEventListener('click', () => {
        tg.HapticFeedback.impactOccurred('light');
        window.currentGameType = 'SNAKE';
        lobbyMenu.querySelector('h1').innerText = 'ULAR TANGGA VIP';
        gameHubMenu.style.display = 'none'; lobbyMenu.style.display = 'flex';
    });
}

backToHubBtn.addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('light');
    resetToLobby();
    lobbyMenu.style.display = 'none'; gameHubMenu.style.display = 'flex';
});

createRoomBtn.addEventListener('click', () => { 
    tg.HapticFeedback.impactOccurred('light'); 
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        window.ws.send(JSON.stringify({ type: 'create_room', player_name: window.playerName, user_id: window.userId, game_type: window.currentGameType, init_data: tg.initData })); 
    }
});

joinRoomBtn.addEventListener('click', () => {
    const code = roomCodeInput.value.trim().toUpperCase();
    if (code) {
        window.currentRoom = code; tg.HapticFeedback.impactOccurred('light');
        if (window.ws && window.ws.readyState === WebSocket.OPEN) window.ws.send(JSON.stringify({ type: 'join_room', player_name: window.playerName, room_code: code, user_id: window.userId, init_data: tg.initData }));
    } else { window.showCustomAlert("Masukkan kode room terlebih dahulu!"); }
});

startBtn.addEventListener('click', () => { 
    tg.HapticFeedback.impactOccurred('heavy'); 
    window.sendGameMessage({ type: 'start_game' }); 
});

const rulesBtn = document.getElementById('rules-btn');
document.getElementById('back-btn').addEventListener('click', () => {
    window.showCustomConfirm("Yakin ingin keluar dari room ini?", (agreed) => {
        if (agreed) { 
            window.sendGameMessage({ type: 'leave_room' }); 
            resetToLobby(); 
        }
    });
});

playAgainBtn.addEventListener('click', () => {
    window.sendGameMessage({ type: 'play_again' });
    playAgainBtn.innerText = "MENUNGGU LAWAN...";
    playAgainBtn.disabled = true;
    winnerNameDisplay.innerHTML += `<div style="margin-top:10px; font-size:0.9rem; color:#9ca3af; text-align:center; text-transform:none; text-shadow:none;">⏳ Menunggu lawan menyetujui...</div>`;
});

exitGameBtn.addEventListener('click', () => {
    window.sendGameMessage({ type: 'leave_room' }); 
    resetToLobby();
});

// --- TOMBOL KONTROL UNO DENGAN ANIMASI INSTAN ---
document.getElementById('draw-btn').addEventListener('click', () => {
    if (window.isMyTurn) { tg.HapticFeedback.impactOccurred('light'); window.sendGameMessage({ type: 'draw_card' }); }
});
document.getElementById('uno-btn').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('light'); 
    window.sendGameMessage({ type: 'call_uno' });
    window.showEpicPopup("UNO!", window.playerName, "#fcd34d");
});
document.getElementById('catch-btn').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('heavy'); 
    window.sendGameMessage({ type: 'catch_uno' });
    window.showEpicPopup("MENCIDUK!", "Memeriksa Lawan...", "#ef4444");
});

document.getElementById('chess-surrender-btn').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('medium');
    window.showCustomConfirm("Yakin ingin menyerah? Poin Elo Anda akan dikurangi.", (agreed) => {
        if (agreed) {
            window.sendGameMessage({ type: 'chess_surrender' });
        }
    });
});

function fallbackCopyTextToClipboard(text) {
    const tempInput = document.createElement("textarea");
    tempInput.value = text;
    tempInput.style.position = "fixed"; tempInput.style.left = "-9999px"; tempInput.style.top = "0";
    document.body.appendChild(tempInput); tempInput.focus(); tempInput.select();
    try { document.execCommand("copy"); window.showCustomAlert(`Link Undangan berhasil disalin!<br><br><b>${window.currentRoom}</b>`, "BERHASIL"); } 
    catch (err) { window.showCustomAlert(`Gagal menyalin otomatis. Silakan salin manual kode: <b>${window.currentRoom}</b>`, "INFO"); }
    document.body.removeChild(tempInput);
}

copyLinkBtn.addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('light');
    if (!window.currentRoom) return;
    const shareLink = `${BOT_LINK}?start=${window.currentRoom}`;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareLink).then(() => {
            window.showCustomAlert(`Link Undangan berhasil disalin!<br><br><b>${window.currentRoom}</b>`, "BERHASIL");
        }).catch(err => fallbackCopyTextToClipboard(shareLink));
    } else { fallbackCopyTextToClipboard(shareLink); }
});

function sendChat() {
    const text = chatInput.value.trim();
    if (text) {
        window.sendGameMessage({ type: 'chat_message', player_name: window.playerName, text: text });
        chatInput.value = ''; 
    }
}
document.getElementById('chat-send-btn').addEventListener('click', sendChat);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChat(); });

function appendChatMessage(sender, text, isMe) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${isMe ? 'me' : 'other'}`;
    if (!isMe) {
        const senderName = document.createElement('div');
        senderName.className = 'chat-sender'; senderName.innerText = sender;
        bubble.appendChild(senderName);
    }
    const messageText = document.createElement('span'); messageText.innerText = text;
    bubble.appendChild(messageText); chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight; 
}

rulesBtn.addEventListener('click', () => { tg.HapticFeedback.impactOccurred('light'); document.getElementById('rules-modal').style.display = 'flex'; });
document.getElementById('close-rules-btn').addEventListener('click', () => { tg.HapticFeedback.impactOccurred('light'); document.getElementById('rules-modal').style.display = 'none'; });
document.getElementById('settings-btn').addEventListener('click', () => { tg.HapticFeedback.impactOccurred('light'); document.getElementById('settings-modal').style.display = 'flex'; });
document.getElementById('close-settings-btn').addEventListener('click', () => { tg.HapticFeedback.impactOccurred('light'); document.getElementById('settings-modal').style.display = 'none'; });

let isAnimActive = true;
let isSimpleMode = false;

document.getElementById('toggle-anim-btn').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('light');
    isAnimActive = !isAnimActive;
    const animStatus = document.getElementById('anim-status');
    if (isAnimActive) {
        animatedBg.classList.remove('paused-animation'); animStatus.innerText = 'HIDUP'; animStatus.style.color = '#34d399';
    } else {
        animatedBg.classList.add('paused-animation'); animStatus.innerText = 'MATI'; animStatus.style.color = '#f43f5e';
    }
});

document.getElementById('toggle-simple-mode-btn').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('light');
    isSimpleMode = !isSimpleMode;
    const simpleModeStatus = document.getElementById('simple-mode-status');
    if (isSimpleMode) {
        simpleModeStatus.innerText = 'HIDUP'; simpleModeStatus.style.color = '#34d399';
        document.documentElement.style.setProperty('--glass-bg', 'rgba(2, 6, 23, 0.95)'); 
    } else {
        simpleModeStatus.innerText = 'MATI'; simpleModeStatus.style.color = '#f43f5e';
        document.documentElement.style.setProperty('--glass-bg', 'rgba(14, 165, 233, 0.05)');
    }
    if (window.toggleThreeJSSimpleMode) window.toggleThreeJSSimpleMode(isSimpleMode);
});


const themes = [
    { id: 'night', name: 'MALAM', gradient: 'linear-gradient(135deg, #0f172a 0%, #0369a1 50%, #1e293b 100%)', showBirds: true },
    { id: 'sunrise', name: 'SUNRISE', gradient: 'linear-gradient(135deg, #4c0519 0%, #be123c 50%, #f59e0b 100%)', showBirds: true },
    { id: 'morning', name: 'PAGI', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #bae6fd 100%)', showBirds: true },
    { id: 'afternoon', name: 'SIANG', gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #7dd3fc 100%)', showBirds: true },
    { id: 'sunset', name: 'SUNSET', gradient: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #fcd34d 100%)', showBirds: true }
];
let currentThemeIndex = 0; 
const toggleThemeBtn = document.getElementById('toggle-theme-btn');
if(toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', () => {
        tg.HapticFeedback.impactOccurred('light');
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        const selectedTheme = themes[currentThemeIndex];
        
        document.getElementById('theme-status').innerText = selectedTheme.name;
        document.documentElement.style.setProperty('--bg-gradient', selectedTheme.gradient);
        
        const birds = document.querySelectorAll('.bird');
        birds.forEach(bird => {
            bird.style.display = selectedTheme.showBirds ? 'block' : 'none';
        });
    });
}

if (window.userId === OWNER_ID || window.userId === "7019297628" || window.userId === 7019297628) {
    document.getElementById('owner-panel-btn').style.display = 'flex';
}
document.getElementById('owner-panel-btn').addEventListener('click', () => { document.getElementById('owner-modal').style.display = 'flex'; });
document.getElementById('close-owner-btn').addEventListener('click', () => { document.getElementById('owner-modal').style.display = 'none'; });

document.getElementById('toggle-banner-btn').addEventListener('click', () => {
    isClientBannerEnabled = !isClientBannerEnabled;
    const bannerStatus = document.getElementById('banner-status');
    if (isClientBannerEnabled) {
        bannerStatus.innerText = 'MENYALA'; bannerStatus.style.color = '#34d399';
        if (document.getElementById('banner-text').innerText.trim() !== '') document.getElementById('global-banner-container').style.display = 'flex';
    } else {
        bannerStatus.innerText = 'MATI'; bannerStatus.style.color = '#f43f5e'; document.getElementById('global-banner-container').style.display = 'none';
    }
});

document.getElementById('update-banner-btn').addEventListener('click', () => {
    const newText = document.getElementById('banner-input').value.trim(); 
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        window.ws.send(JSON.stringify({ type: 'update_banner', text: newText }));
        window.showCustomAlert("Banner berhasil diupdate!", "SUKSES");
        document.getElementById('banner-input').value = '';
    } else { connectWebSocket(); }
});
