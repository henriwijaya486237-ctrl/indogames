console.log("♟️ Modul Catur 2D Swipe & AI Cheat Dimuat...");

// =====================================================================
// 1. STATE & PERSIAPAN LINGKUNGAN CATUR
// =====================================================================
const chessGame = new Chess(); 
let myChessColor = null;
let selectedSquare = null;
let validMoves = [];
let lastMoveSquares = [];
let pendingPromotionMove = null; 

// State Fitur AI Cheat Owner
let cheatHintSquares = [];

// State Khusus Fitur Swipe (Drag and Drop)
let isDragging = false;
let dragSourceSquare = null;
let ghostPieceClone = null;

// State Sistem Waktu (Disinkronkan dengan Server)
let myTimer = 600; 
let oppTimer = 600;
let timerInterval = null;

const pieceAssets = {
    'wK': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    'wQ': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    'wR': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    'wB': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    'wN': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    'wP': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    'bK': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    'bQ': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    'bR': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    'bB': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    'bN': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    'bP': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg'
};

const boardElement = document.getElementById('chess-board-2d');

// =====================================================================
// 2. FUNGSI RENDER PAPAN 2D
// =====================================================================
function renderBoard() {
    boardElement.innerHTML = ''; 
    
    const boardState = chessGame.board();
    const isFlipped = myChessColor === 'b';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const rankIndex = isFlipped ? 7 - r : r;
            const fileIndex = isFlipped ? 7 - c : c;
            
            const file = ['a','b','c','d','e','f','g','h'][fileIndex];
            const rank = 8 - rankIndex; 
            const squareName = file + rank;
            
            const isLightSquare = (rankIndex + fileIndex) % 2 !== 0;
            const pieceInfo = boardState[rankIndex][fileIndex];

            const squareDiv = document.createElement('div');
            squareDiv.className = `chess-square ${isLightSquare ? 'light' : 'dark'}`;
            squareDiv.dataset.square = squareName; 
            
            if (lastMoveSquares.includes(squareName)) squareDiv.classList.add('last-move');
            if (selectedSquare === squareName) squareDiv.classList.add('highlight');

            if (cheatHintSquares.length === 2) {
                if (squareName === cheatHintSquares[0]) squareDiv.classList.add('cheat-hint-from');
                if (squareName === cheatHintSquares[1]) squareDiv.classList.add('cheat-hint-to');
            }

            if (pieceInfo) {
                const pieceKey = pieceInfo.color + pieceInfo.type.toUpperCase();
                const pieceDiv = document.createElement('div');
                pieceDiv.className = 'chess-piece';
                pieceDiv.style.backgroundImage = `url(${pieceAssets[pieceKey]})`;
                
                if (pieceInfo.color === myChessColor && window.isMyTurn) {
                    pieceDiv.addEventListener('touchstart', (e) => handleTouchStart(e, squareName, pieceDiv), {passive: false});
                }
                squareDiv.appendChild(pieceDiv);
            }

            squareDiv.addEventListener('click', () => handleSquareClick(squareName));
            boardElement.appendChild(squareDiv);
        }
    }
}

// =====================================================================
// 3. LOGIKA SWIPE & MANIPULASI DOM LANGSUNG
// =====================================================================
function showSwipeHighlights(squareName) {
    clearSwipeHighlights(); 
    validMoves = chessGame.moves({ square: squareName, verbose: true });

    const sourceSquareEl = document.querySelector(`[data-square="${squareName}"]`);
    if (sourceSquareEl) sourceSquareEl.classList.add('highlight');

    validMoves.forEach(m => {
        const targetSquareEl = document.querySelector(`[data-square="${m.to}"]`);
        if (targetSquareEl) {
            const hintDiv = document.createElement('div');
            const hasPiece = chessGame.get(m.to);
            hintDiv.className = hasPiece ? 'valid-move-capture' : 'valid-move-dot';
            targetSquareEl.appendChild(hintDiv);
        }
    });
}

function clearSwipeHighlights() {
    document.querySelectorAll('.valid-move-dot, .valid-move-capture').forEach(el => el.remove());
    document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
    validMoves = [];
}

function handleTouchStart(e, squareName, pieceElement) {
    if (!window.isMyTurn) return;
    e.preventDefault(); 
    
    const touch = e.touches[0];
    dragSourceSquare = squareName;
    
    showSwipeHighlights(squareName);
    
    ghostPieceClone = pieceElement.cloneNode(true);
    ghostPieceClone.className = 'chess-piece ghost-piece';
    ghostPieceClone.style.left = touch.clientX + 'px';
    ghostPieceClone.style.top = touch.clientY + 'px';
    document.body.appendChild(ghostPieceClone);
    
    pieceElement.style.opacity = '0';
    isDragging = true;
}

document.addEventListener('touchmove', (e) => {
    if (isDragging && ghostPieceClone) {
        e.preventDefault(); 
        const touch = e.touches[0];
        ghostPieceClone.style.left = touch.clientX + 'px';
        ghostPieceClone.style.top = touch.clientY + 'px';
    }
}, {passive: false});

document.addEventListener('touchend', (e) => {
    if (isDragging && ghostPieceClone) {
        const touch = e.changedTouches[0];
        
        ghostPieceClone.remove();
        ghostPieceClone = null;
        isDragging = false;
        
        const originalPiece = document.querySelector(`[data-square="${dragSourceSquare}"] .chess-piece`);
        if (originalPiece) originalPiece.style.opacity = '1';
        
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        const dropSquareEl = targetElement ? targetElement.closest('.chess-square') : null;
        
        if (dropSquareEl) {
            const targetSquare = dropSquareEl.dataset.square;
            const isValid = validMoves.some(m => m.to === targetSquare);
            
            if (isValid) {
                selectedSquare = dragSourceSquare;
                
                const moveObj = validMoves.find(m => m.to === targetSquare);
                if (moveObj && moveObj.flags.includes('p')) {
                    pendingPromotionMove = { from: selectedSquare, to: targetSquare };
                    document.getElementById('promotion-modal').style.display = 'flex';
                    window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
                    return; 
                }
                
                executeChessMove(selectedSquare, targetSquare, null);
                return; 
            }
        }
        
        clearSwipeHighlights();
        selectedSquare = null;
    }
});

// =====================================================================
// 4. LOGIKA INTERAKSI KLIK MANUAL
// =====================================================================
function handleSquareClick(squareName) {
    if (!window.isMyTurn) return;

    const isTargetValid = validMoves.some(m => m.to === squareName);

    if (isTargetValid) {
        const moveObj = validMoves.find(m => m.to === squareName);
        if (moveObj && moveObj.flags.includes('p')) {
            pendingPromotionMove = { from: selectedSquare, to: squareName };
            document.getElementById('promotion-modal').style.display = 'flex';
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
            return; 
        }
        executeChessMove(selectedSquare, squareName, null);
    } 
    else {
        const pieceInfo = chessGame.get(squareName);
        if (pieceInfo && pieceInfo.color === myChessColor) {
            if (selectedSquare === squareName) {
                selectedSquare = null;
                clearSwipeHighlights();
            } else {
                selectedSquare = squareName;
                showSwipeHighlights(squareName);
                window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
            }
        } else {
            selectedSquare = null;
            clearSwipeHighlights();
        }
    }
}

function executeChessMove(fromSq, toSq, promotionChoice) {
    const moveInfo = { from: fromSq, to: toSq };
    if (promotionChoice) moveInfo.promotion = promotionChoice;

    const move = chessGame.move(moveInfo);
    
    if (move) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
        
        lastMoveSquares = [fromSq, toSq];
        selectedSquare = null;
        validMoves = [];
        cheatHintSquares = []; 
        
        renderBoard(); 
        
        let gameOverData = null;
        if (chessGame.in_checkmate()) gameOverData = { winner_name: window.playerName, reason: "SKAKMAT!" };
        else if (chessGame.in_draw() || chessGame.in_stalemate()) gameOverData = { winner_name: "Draw", reason: "Remis / Seri" };

        window.sendGameMessage({ type: 'chess_move', fen: chessGame.fen(), move: move.san });
        
        if (gameOverData) {
            window.sendGameMessage({ type: 'chess_game_over', ...gameOverData });
        }
    } else {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
}

window.selectChessPromotion = function(pieceCode) {
    document.getElementById('promotion-modal').style.display = 'none';
    if (pendingPromotionMove) {
        executeChessMove(pendingPromotionMove.from, pendingPromotionMove.to, pieceCode);
        pendingPromotionMove = null;
    }
};

// =====================================================================
// 5. SISTEM PEWAKTUAN (SINKRON DENGAN SERVER)
// =====================================================================
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateHUDTimer() {
    const playerTimerEl = document.getElementById('player-timer');
    const opponentTimerEl = document.getElementById('opponent-timer');

    if (window.isMyTurn) {
        playerTimerEl.classList.add('active');
        opponentTimerEl.classList.remove('active');
    } else {
        playerTimerEl.classList.remove('active');
        opponentTimerEl.classList.add('active');
    }
    
    playerTimerEl.innerText = `⏱️ ${formatTime(myTimer)}`;
    opponentTimerEl.innerText = `⏱️ ${formatTime(oppTimer)}`;
}

function startMatchTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (window.isMyTurn) {
            myTimer--;
            if (myTimer <= 0) {
                myTimer = 0;
                window.sendGameMessage({ type: 'chess_timeout' });
            }
            document.getElementById('player-timer').innerText = `⏱️ ${formatTime(myTimer)}`;
        } else {
            oppTimer--;
            if (oppTimer <= 0) {
                oppTimer = 0;
                window.sendGameMessage({ type: 'chess_timeout' });
            }
            document.getElementById('opponent-timer').innerText = `⏱️ ${formatTime(oppTimer)}`;
        }
    }, 1000);
}

function calculateLevel(elo) {
    return Math.max(1, Math.floor((elo - 1000) / 100) + 1);
}

// =====================================================================
// 6. API UNTUK APP.JS (KONEKSI ANTAR MODUL)
// =====================================================================
window.startChessGame = function(data) {
    if (window.unoGroup) window.unoGroup.visible = false; 
    document.getElementById('chess-wrapper').style.display = 'flex';
    
    myChessColor = data.white_player === window.playerName ? 'w' : 'b';
    const opponentName = myChessColor === 'w' ? data.black_player : data.white_player;
    
    document.getElementById('player-name').innerText = window.playerName.substring(0, 12);
    document.getElementById('opponent-name').innerText = (opponentName || "LAWAN").substring(0, 12);
    
    const myElo = data.players_data && data.players_data[window.playerName] ? data.players_data[window.playerName].elo : 1200;
    const oppElo = data.players_data && data.players_data[opponentName] ? data.players_data[opponentName].elo : 1200;
    
    document.getElementById('player-elo').innerText = `Elo ${myElo}`;
    document.getElementById('player-lvl').innerText = `Lvl ${calculateLevel(myElo)}`;
    document.getElementById('opponent-elo').innerText = `Elo ${oppElo}`;
    document.getElementById('opponent-lvl').innerText = `Lvl ${calculateLevel(oppElo)}`;
    
    const chessStatus = document.getElementById('chess-status');
    if (chessStatus) chessStatus.innerHTML = "MEMULAI PERMAINAN...";
    
    if (chessGame) chessGame.reset();
    selectedSquare = null;
    validMoves = [];
    lastMoveSquares = [];
    cheatHintSquares = [];
    isDragging = false;
    
    myTimer = 600; 
    oppTimer = 600;
    
    renderBoard();
    updateHUDTimer();
    startMatchTimer();
    
    window.showCustomAlert(`Bermain sebagai <b style="color: ${myChessColor === 'w' ? '#fcd34d' : '#9ca3af'};">${myChessColor === 'w' ? 'PUTIH' : 'HITAM'}</b>.<br><br>Anda bisa <b>SWIPE</b> bidak untuk memindahkannya!`, "CATUR DIMULAI");
};

window.handleChessMessage = function(data) {
    if (data.type === 'chess_state') {
        window.isMyTurn = data.is_your_turn;
        
        // --- SINKRONISASI WAKTU DARI SERVER ---
        if (myChessColor === 'w') {
            myTimer = data.white_timer;
            oppTimer = data.black_timer;
        } else {
            myTimer = data.black_timer;
            oppTimer = data.white_timer;
        }

        if (chessGame) chessGame.load(data.fen);
        
        if (data.last_move && typeof data.last_move === 'string') {
            const history = chessGame.history({ verbose: true });
            if (history.length > 0) {
                const lastMove = history[history.length - 1];
                lastMoveSquares = [lastMove.from, lastMove.to];
            }
        }
        
        const chessStatus = document.getElementById('chess-status');
        
        if (window.isMyTurn) { 
            if (chessGame.in_check()) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
                if (chessStatus) chessStatus.innerHTML = `⚠️ <span style="color:var(--danger-color)">SKAK!</span> Giliranmu!`;
            } else {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('medium'); 
                if (chessStatus) chessStatus.innerHTML = `🔥 <span style="color:#fcd34d">GILIRANMU JALAN!</span>`;
            }
        } else {
            if (chessGame.in_check()) {
                if (chessStatus) chessStatus.innerHTML = `😎 Lawan sedang SKAK!`;
            } else {
                if (chessStatus) chessStatus.innerHTML = `⏳ Menunggu lawan jalan...`;
            }
        }

        renderBoard(); 
        updateHUDTimer();
    }
    else if (data.type === 'chess_cheat_hint') {
        cheatHintSquares = [data.from, data.to];
        renderBoard(); 
    }
};

window.resetChess = function() {
    selectedSquare = null; myChessColor = null; validMoves = []; lastMoveSquares = []; isDragging = false;
    cheatHintSquares = [];
    if (timerInterval) clearInterval(timerInterval);
    document.getElementById('chess-wrapper').style.display = 'none';
};
