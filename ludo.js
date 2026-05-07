console.log("🎲 Modul Ludo 2D VIP (Step-by-Step Animation) Dimuat...");

let myLudoColor = null;
let currentLudoState = null;
let pawnsElements = { "Red": [], "Green": [], "Yellow": [], "Blue": [] };
let isLudoInitialized = false;

// Array Jalur Papan 0-51 (Format: [Kolom, Baris] -> 0-indexed untuk Grid 15x15)
const PATH_2D = [
    [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], // Merah Keluar
    [7, 0], [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], // Hijau Keluar
    [14, 7], [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], // Kuning Keluar
    [7, 14], [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], // Biru Keluar
    [0, 7], [0, 6]
];

window.ludoPrevPawns = {};

// Fungsi Menghitung Koordinat Persen (%) agar Responsif di Semua Layar HP
function getLudoPosPercent(color, logicalPos, pawnIndex) {
    const CELL_SIZE = 100 / 15;
    let col, row;

    if (logicalPos === -1) {
        // Posisi Dalam Markas (Base) - Ditata berbentuk kotak 2x2
        const BASES = {
            "Red": [[2, 2], [3, 2], [2, 3], [3, 3]],
            "Green": [[11, 2], [12, 2], [11, 3], [12, 3]],
            "Blue": [[2, 11], [3, 11], [2, 12], [3, 12]],
            "Yellow": [[11, 11], [12, 11], [11, 12], [12, 12]]
        };
        [col, row] = BASES[color][pawnIndex];
    } 
    else if (logicalPos >= 0 && logicalPos <= 51) {
        // Posisi di Jalur Utama Melingkar
        const offset = {"Red": 0, "Green": 13, "Yellow": 26, "Blue": 39}[color];
        const globalPos = (logicalPos + offset) % 52;
        [col, row] = PATH_2D[globalPos];
    } 
    else if (logicalPos >= 52 && logicalPos <= 56) {
        // Posisi Jalur Kemenangan (Menuju Tengah / Home Straight)
        const HOME_PATHS = {
            "Red": [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
            "Green": [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
            "Yellow": [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
            "Blue": [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]]
        };
        [col, row] = HOME_PATHS[color][logicalPos - 52];
    } 
    else {
        // Posisi Tengah (Goal/Menang)
        [col, row] = [7, 7]; 
    }
    
    return { left: (col * CELL_SIZE) + '%', top: (row * CELL_SIZE) + '%' };
}

function drawBoard2D() {
    console.log("Papan Ludo VIP menggunakan Grid CSS Statis.");
}

// --- FUNGSI ANIMASI JALAN LANGKAH DEMI LANGKAH ---
async function movePawnStepByStep(pawnEl, color, fromPos, toPos, pawnIndex) {
    if (fromPos === -1 || toPos === -1 || fromPos >= toPos) {
        const cssPos = getLudoPosPercent(color, toPos, pawnIndex);
        pawnEl.style.left = cssPos.left;
        pawnEl.style.top = cssPos.top;
        return;
    }
    for (let p = fromPos + 1; p <= toPos; p++) {
        const cssPos = getLudoPosPercent(color, p, pawnIndex);
        pawnEl.style.left = cssPos.left;
        pawnEl.style.top = cssPos.top;
        await new Promise(resolve => setTimeout(resolve, 300));
    }
}

// Inisialisasi Bidak/Pion dengan Foto Profil
function initializePawns2D(playersData) {
    const layer = document.getElementById('ludo-pawns-layer');
    if (!layer) return;
    layer.innerHTML = '';
    
    pawnsElements = { "Red": [], "Green": [], "Yellow": [], "Blue": [] };
    window.ludoPrevPawns = {};
    
    ['red', 'green', 'blue', 'yellow'].forEach(c => {
        const hud = document.getElementById(`ludo-hud-${c}`);
        if(hud) hud.style.opacity = '0.3';
    });
    
    Object.keys(playersData).forEach(ws => {
        const data = playersData[ws];
        const color = data.ludo_color;
        const avatarUrl = data.avatar_url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';
        
        const hudCard = document.getElementById(`ludo-hud-${color.toLowerCase()}`);
        if(hudCard) {
            hudCard.style.opacity = '1';
            document.getElementById(`ludo-name-${color.toLowerCase()}`).innerText = data.name;
            document.getElementById(`ludo-avatar-${color.toLowerCase()}`).style.backgroundImage = `url('${avatarUrl}')`;
        }

        window.ludoPrevPawns[ws] = [...data.pawns];

        for (let i = 0; i < 4; i++) {
            const pawn = document.createElement('div');
            pawn.className = `ludo-pawn-token ${color}`;
            pawn.style.backgroundImage = `url('${avatarUrl}')`;
            pawn.dataset.pawnIndex = i; 
            
            const pos = getLudoPosPercent(color, data.pawns[i], i);
            pawn.style.left = pos.left;
            pawn.style.top = pos.top;
            
            pawn.onclick = () => {
                if (window.isMyTurn && myLudoColor === color) {
                    if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
                    window.sendGameMessage({ type: 'move_pawn', pawn_index: i });
                }
            };
            
            layer.appendChild(pawn);
            pawnsElements[color].push(pawn);
        }
    });
}

// =====================================================================
// API PENGHUBUNG (DIPANGGIL DARI APP.JS / SERVER)
// =====================================================================
window.startLudoGame = function(data) {
    if (window.unoGroup) window.unoGroup.visible = false;
    if (document.getElementById('chess-wrapper')) document.getElementById('chess-wrapper').style.display = 'none';
    
    const ludoWrapper = document.getElementById('ludo-wrapper');
    if(ludoWrapper) ludoWrapper.style.display = 'block';
};

window.handleLudoMessage = function(data) {
    if (data.type === 'ludo_state') {
        currentLudoState = data;
        window.isMyTurn = data.is_your_turn;
        myLudoColor = data.your_color;

        document.querySelectorAll('.ludo-player-card').forEach(el => el.classList.remove('active-turn'));
        
        // Sembunyikan semua dadu & buang fungsi klik dulu
        ['red', 'green', 'yellow', 'blue'].forEach(c => {
            const diceEl = document.getElementById(`ludo-dice-${c}`);
            if (diceEl) {
                diceEl.style.display = 'none';
                diceEl.classList.remove('active-dice');
                diceEl.onclick = null;
            }
        });

        // Munculkan dadu HANYA pada pemain yang gilirannya aktif
        Object.keys(data.players).forEach(ws => {
            const pData = data.players[ws];
            
            // Tandai HUD yang aktif
            if (pData.name === data.turn) {
                const activeColor = pData.ludo_color.toLowerCase();
                const activeHud = document.getElementById(`ludo-hud-${activeColor}`);
                if (activeHud) activeHud.classList.add('active-turn');

                const activeDice = document.getElementById(`ludo-dice-${activeColor}`);
                if (activeDice) {
                    activeDice.style.display = 'flex';
                    
                    if (data.dice_rolled) {
                        activeDice.innerText = data.dice_value;
                        activeDice.classList.remove('active-dice');
                        activeDice.style.cursor = 'default';
                    } else {
                        activeDice.innerText = '🎲';
                        activeDice.classList.add('active-dice');
                        
                        if (window.isMyTurn) {
                            activeDice.onclick = () => {
                                if (!currentLudoState.dice_rolled) {
                                    if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
                                    window.sendGameMessage({ type: 'roll_dice' });
                                }
                            };
                        }
                    }
                }
            }
        });

        if (!isLudoInitialized) { 
            initializePawns2D(data.players); 
            isLudoInitialized = true; 
        }

        // --- SISTEM PERGERAKAN DENGAN ANIMASI ---
        Object.keys(data.players).forEach(ws => {
            const pData = data.players[ws];
            const oldPawns = window.ludoPrevPawns[ws] || [0, -1, -1, -1];
            
            pData.pawns.forEach((pos, index) => {
                const pawnEl = pawnsElements[pData.ludo_color][index];
                if(pawnEl) {
                    const oldPos = oldPawns[index];
                    
                    if (oldPos !== pos) {
                        movePawnStepByStep(pawnEl, pData.ludo_color, oldPos, pos, index);
                    } else if (oldPos === pos && document.getElementById('ludo-pawns-layer').childElementCount <= 4) {
                        const cssPos = getLudoPosPercent(pData.ludo_color, pos, index);
                        pawnEl.style.left = cssPos.left;
                        pawnEl.style.top = cssPos.top;
                    }
                }
            });
            window.ludoPrevPawns[ws] = [...pData.pawns];
        });
    }
    else if (data.type === 'dice_rolled') {
        if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        
        let activeColor = 'red';
        if (currentLudoState && currentLudoState.players) {
            Object.keys(currentLudoState.players).forEach(ws => {
                if (currentLudoState.players[ws].name === currentLudoState.turn) {
                    activeColor = currentLudoState.players[ws].ludo_color.toLowerCase();
                }
            });
        }

        const activeDice = document.getElementById(`ludo-dice-${activeColor}`);
        if (activeDice) {
            activeDice.classList.add('rolling-dice');
            let count = 0;
            const interval = setInterval(() => {
                activeDice.innerText = Math.floor(Math.random() * 6) + 1;
                count++;
                if (count > 10) {
                    clearInterval(interval);
                    activeDice.innerText = data.value;
                    activeDice.classList.remove('rolling-dice');
                }
            }, 50);
        }
    }
    // --- EVENT KHUSUS: POPUP ATURAN LUDO ---
    else if (data.type === 'ludo_event') {
        if (data.event === 'penalty_3x6') {
            if (window.showEpicPopup) window.showEpicPopup("HANGUS!", "3x Angka 6 Beruntun", "#ef4444");
            if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
        else if (data.event === 'goal_bonus') {
            // Popup ini akan delay 1.5 detik agar tidak bentrok dengan Popup "GOAL" bawaan di index.html
            setTimeout(() => {
                if (window.showEpicPopup) window.showEpicPopup("BONUS!", "Giliran Tambahan!", "#10b981");
                if (window.Telegram && window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }, 1500); 
        }
    }
};

window.resetLudo = function(isGameOver = false) {
    const ludoWrapper = document.getElementById('ludo-wrapper');
    if (ludoWrapper) ludoWrapper.style.display = 'none';
    
    isLudoInitialized = false; 
    window.ludoPrevPawns = {};
};
