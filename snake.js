console.log("🐍 Modul Ular Tangga HD (SVG & Avatar) Dimuat...");

let currentSnakeState = null;
let snakePawnsElements = {};
let isSnakeInitialized = false;

const SNAKES_MAP = [
    { start: 17, end: 7, color: '#ef4444' },
    { start: 54, end: 34, color: '#eab308' },
    { start: 62, end: 19, color: '#f59e0b' },
    { start: 64, end: 60, color: '#10b981' },
    { start: 87, end: 24, color: '#3b82f6' },
    { start: 93, end: 73, color: '#8b5cf6' },
    { start: 95, end: 75, color: '#ec4899' },
    { start: 98, end: 79, color: '#14b8a6' }
];

// TANGGA 80 -> 100 TELAH DIHAPUS
const LADDERS_MAP = [
    { start: 1, end: 38 },
    { start: 4, end: 14 },
    { start: 9, end: 31 },
    { start: 21, end: 42 },
    { start: 28, end: 84 },
    { start: 51, end: 67 },
    { start: 71, end: 91 }
];

// --- FUNGSI KOORDINAT PRESISI ---
function getSnakeCellCoords(pos) {
    let isStart = false;
    if (pos < 1) { pos = 1; isStart = true; } 
    if (pos > 100) pos = 100;
    
    let zeroIndex = pos - 1;
    let row = Math.floor(zeroIndex / 10);
    let col = zeroIndex % 10;
    
    if (row % 2 !== 0) col = 9 - col;
    
    let left = (col * 10) + 1.5;
    let top = ((9 - row) * 10) + 1.5;
    
    if (isStart) { left -= 5; top += 5; } 
    return { left: left + '%', top: top + '%' };
}

function getCellCenterPoint(pos) {
    if (pos < 1) pos = 1;
    if (pos > 100) pos = 100;
    let zeroIndex = pos - 1;
    let row = Math.floor(zeroIndex / 10);
    let col = zeroIndex % 10;
    if (row % 2 !== 0) col = 9 - col;
    return { x: (col * 10) + 5, y: ((9 - row) * 10) + 5 };
}

// --- FUNGSI MENGGAMBAR SVG HD ---
function drawLadder(svg, startPos, endPos) {
    let p1 = getCellCenterPoint(startPos);
    let p2 = getCellCenterPoint(endPos);
    
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    let len = Math.sqrt(dx*dx + dy*dy);
    
    let nx = dx / len; let ny = dy / len;
    let wx = -ny * 1.5; let wy = nx * 1.5; 
    
    let line1 = `<line x1="${p1.x + wx}" y1="${p1.y + wy}" x2="${p2.x + wx}" y2="${p2.y + wy}" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>`;
    let line2 = `<line x1="${p1.x - wx}" y1="${p1.y - wy}" x2="${p2.x - wx}" y2="${p2.y - wy}" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>`;
    
    let rungs = "";
    let numRungs = Math.floor(len / 4); 
    for(let i = 1; i <= numRungs; i++) {
        let t = i / (numRungs + 1);
        let cx = p1.x + dx * t;
        let cy = p1.y + dy * t;
        rungs += `<line x1="${cx + wx}" y1="${cy + wy}" x2="${cx - wx}" y2="${cy - wy}" stroke="#92400e" stroke-width="1"/>`;
    }
    svg.insertAdjacentHTML('beforeend', line1 + line2 + rungs);
}

function drawSnake(svg, startPos, endPos, color) {
    let head = getCellCenterPoint(startPos);
    let tail = getCellCenterPoint(endPos);
    
    let dx = tail.x - head.x; 
    let dy = tail.y - head.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    let perpX = -dy/dist; 
    let perpY = dx/dist;
    let curveDir = (Math.random() > 0.5 ? 1 : -1) * (dist * 0.25);
    
    let midX = (head.x + tail.x)/2 + (perpX * curveDir);
    let midY = (head.y + tail.y)/2 + (perpY * curveDir);
    
    let str = `
        <path d="M ${head.x} ${head.y} Q ${midX} ${midY} ${tail.x} ${tail.y}" stroke="rgba(0,0,0,0.4)" stroke-width="3" fill="none" stroke-linecap="round" transform="translate(0.5, 0.8)"/>
        <path d="M ${head.x} ${head.y} Q ${midX} ${midY} ${tail.x} ${tail.y}" stroke="${color}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <circle cx="${head.x}" cy="${head.y}" r="2" fill="${color}" stroke="rgba(0,0,0,0.5)" stroke-width="0.3"/>
        <circle cx="${head.x - 0.7}" cy="${head.y - 0.7}" r="0.6" fill="white"/>
        <circle cx="${head.x + 0.7}" cy="${head.y - 0.7}" r="0.6" fill="white"/>
        <circle cx="${head.x - 0.7}" cy="${head.y - 0.7}" r="0.3" fill="black"/>
        <circle cx="${head.x + 0.7}" cy="${head.y - 0.7}" r="0.3" fill="black"/>
    `;
    svg.insertAdjacentHTML('beforeend', str);
}

function renderSnakeBoard() {
    const grid = document.getElementById('snake-grid');
    const svgLayer = document.getElementById('snake-svg');
    if (!grid || !svgLayer) return;
    
    grid.innerHTML = '';
    svgLayer.innerHTML = '';
    
    svgLayer.setAttribute('viewBox', '0 0 100 100');
    svgLayer.setAttribute('preserveAspectRatio', 'none');

    const boardColors = ['#fde68a', '#bbf7d0', '#fbcfe8', '#bfdbfe', '#fca5a5', '#e9d5ff'];
    
    for (let r = 9; r >= 0; r--) {
        for (let c = 0; c < 10; c++) {
            let num = r % 2 === 0 ? (r * 10) + c + 1 : (r * 10) + (9 - c) + 1;
            
            let cell = document.createElement('div');
            cell.style.border = '1px solid rgba(15, 23, 42, 0.2)';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.fontSize = '0.9rem';
            cell.style.fontWeight = '900';
            cell.style.color = 'rgba(0,0,0,0.35)';
            
            cell.style.backgroundColor = boardColors[(num - 1) % boardColors.length];
            cell.innerText = num;
            grid.appendChild(cell);
        }
    }

    LADDERS_MAP.forEach(ladder => drawLadder(svgLayer, ladder.start, ladder.end));
    SNAKES_MAP.forEach(snake => drawSnake(svgLayer, snake.start, snake.end, snake.color));
}

function initializeSnakePawns(playersData) {
    const layer = document.getElementById('snake-pawns-layer');
    const topHud = document.getElementById('snake-hud-top');
    const bottomHud = document.getElementById('snake-hud-bottom');
    
    if (!layer || !topHud || !bottomHud) return;
    
    layer.innerHTML = ''; topHud.innerHTML = ''; bottomHud.innerHTML = '';
    snakePawnsElements = {}; window.snakePrevPos = {};

    const colors = ['red', 'green', 'blue', 'yellow'];
    let idx = 0;

    Object.keys(playersData).forEach((ws) => {
        const data = playersData[ws];
        const colorClass = colors[idx % 4];
        const avatarUrl = data.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; // FIXED AVATAR

        const hud = document.createElement('div');
        hud.id = `snake-hud-${ws}`;
        hud.className = `ludo-player-card ${colorClass}`;
        // OPACITY 100% (Solid) agar avatar jelas
        hud.style.opacity = '1';
        hud.style.transform = 'scale(0.95)';
        hud.style.filter = 'grayscale(0.6) brightness(0.8)'; // Redup saat bukan giliran
        hud.style.transition = 'all 0.3s ease';
        
        if (idx % 2 !== 0) {
            hud.style.flexDirection = 'row-reverse';
            hud.innerHTML = `
                <div class="ludo-avatar" style="background-image: url('${avatarUrl}')"></div>
                <div class="ludo-name" style="text-align: right;">${data.name}</div>
                <div class="ludo-inline-dice" id="snake-dice-${ws}">🎲</div>
            `;
        } else {
            hud.innerHTML = `
                <div class="ludo-avatar" style="background-image: url('${avatarUrl}')"></div>
                <div class="ludo-name">${data.name}</div>
                <div class="ludo-inline-dice" id="snake-dice-${ws}">🎲</div>
            `;
        }

        if (idx < 2) topHud.appendChild(hud);
        else bottomHud.appendChild(hud);

        const pawn = document.createElement('div');
        pawn.style.position = 'absolute';
        pawn.style.width = '7%'; 
        pawn.style.height = '7%';
        pawn.style.backgroundImage = `url('${avatarUrl}')`;
        pawn.style.backgroundSize = 'cover';
        pawn.style.backgroundPosition = 'center';
        pawn.style.borderRadius = '50%';
        
        const borderColors = { 'red': '#ef4444', 'green': '#10b981', 'blue': '#3b82f6', 'yellow': '#f59e0b' };
        pawn.style.border = `2.5px solid ${borderColors[colorClass]}`;
        pawn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.8)';
        pawn.style.transition = 'top 0.3s ease-in-out, left 0.3s ease-in-out, transform 0.2s';
        pawn.style.zIndex = '15';
        
        let pos = data.pos || 0;
        window.snakePrevPos[ws] = pos;
        const cssPos = getSnakeCellCoords(pos);
        pawn.style.left = cssPos.left;
        pawn.style.top = cssPos.top;

        layer.appendChild(pawn);
        snakePawnsElements[ws] = pawn;
        
        idx++;
    });
    refreshSnakePawnStacking();
}

async function moveSnakePawnStepByStep(pawnEl, fromPos, toPos, ws) {
    pawnEl.style.zIndex = '20'; 
    let direction = fromPos < toPos ? 1 : -1;
    
    for (let p = fromPos + direction; p !== toPos + direction; p += direction) {
        const cssPos = getSnakeCellCoords(p);
        pawnEl.style.left = cssPos.left;
        pawnEl.style.top = cssPos.top;
        pawnEl.style.transform = 'scale(1.25)';
        await new Promise(r => setTimeout(r, 250));
    }
    
    pawnEl.style.transform = 'scale(1)';
    pawnEl.style.zIndex = '15';
    refreshSnakePawnStacking();
}

function refreshSnakePawnStacking() {
    let spots = {};
    Object.keys(snakePawnsElements).forEach(ws => {
        let el = snakePawnsElements[ws];
        let key = el.style.left + '_' + el.style.top;
        if (!spots[key]) spots[key] = [];
        spots[key].push(el);
    });

    Object.values(spots).forEach(group => {
        group.forEach((pawn, idx) => {
            if (group.length > 1) {
                const tx = idx % 2 === 0 ? '-15%' : '15%';
                const ty = idx < 2 ? '-15%' : '15%';
                pawn.style.transform = `scale(0.8) translate(${tx}, ${ty})`;
            } else {
                pawn.style.transform = 'scale(1) translate(0,0)';
            }
        });
    });
}

// =====================================================================
// API PENGHUBUNG SERVER
// =====================================================================
window.startSnakeGame = function(data) {
    if (window.unoGroup) window.unoGroup.visible = false;
    if (document.getElementById('chess-wrapper')) document.getElementById('chess-wrapper').style.display = 'none';
    if (document.getElementById('ludo-wrapper')) document.getElementById('ludo-wrapper').style.display = 'none';
    
    const wrapper = document.getElementById('snake-wrapper');
    if (wrapper) wrapper.style.display = 'block';
    
    renderSnakeBoard();
};

window.handleSnakeMessage = function(data) {
    if (data.type === 'snake_state') {
        currentSnakeState = data;
        window.isMyTurn = data.is_your_turn;

        if (!isSnakeInitialized) {
            initializeSnakePawns(data.players);
            isSnakeInitialized = true;
        }

        // Matikan efek bersinar pada semua HUD dan sembunyikan dadu
        document.querySelectorAll("[id^='snake-hud-']").forEach(el => { 
            el.style.opacity = '1'; 
            el.style.transform = 'scale(0.95)';
            el.style.filter = 'grayscale(0.6) brightness(0.8)';
            el.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)'; // Shadow normal
            el.classList.remove('active-turn'); 
        });
        document.querySelectorAll("[id^='snake-dice-']").forEach(el => { 
            el.style.display = 'none'; 
            el.classList.remove('active-dice'); 
            el.onclick = null; 
        });

        // Nyalakan penuh (Glow & Warna Jelas) untuk yang sedang mendapat giliran
        const activeWs = Object.keys(data.players).find(ws => data.players[ws].name === data.turn);
        if (activeWs) {
            const activeHud = document.getElementById(`snake-hud-${activeWs}`);
            const activeDice = document.getElementById(`snake-dice-${activeWs}`);
            
            if (activeHud) { 
                activeHud.style.opacity = '1'; 
                activeHud.style.transform = 'scale(1.05)';
                activeHud.style.filter = 'grayscale(0) brightness(1.1)'; // Warna penuh
                activeHud.style.boxShadow = '0 0 15px #34d399, inset 0 0 10px #34d399'; // Efek bersinar terang
                activeHud.classList.add('active-turn'); 
            }
            
            if (activeDice) {
                activeDice.style.display = 'flex';
                activeDice.style.opacity = '1';
                if (data.dice_rolled) {
                    activeDice.innerText = data.dice_value;
                    activeDice.style.cursor = 'default';
                } else {
                    activeDice.innerText = '🎲';
                    activeDice.classList.add('active-dice');
                    if (window.isMyTurn) {
                        activeDice.onclick = () => {
                            if (!currentSnakeState.dice_rolled) {
                                if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
                                window.sendGameMessage({ type: 'roll_dice_snake' });
                            }
                        };
                    }
                }
            }
        }

        Object.keys(data.players).forEach(ws => {
            const pData = data.players[ws];
            const oldPos = window.snakePrevPos[ws] || 0;
            const newPos = pData.pos;
            const pawnEl = snakePawnsElements[ws];

            if (pawnEl && oldPos !== newPos) {
                moveSnakePawnStepByStep(pawnEl, oldPos, newPos, ws).then(() => {
                    if (pData.special_move) {
                        setTimeout(() => {
                            if (pData.special_move === 'ladder' && window.showEpicPopup) {
                                window.showEpicPopup("TANGGA!", "Naik Ke Atas!", "#34d399");
                                if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                            } else if (pData.special_move === 'snake' && window.showEpicPopup) {
                                window.showEpicPopup("ULAR!", "Tergelincir Turun!", "#ef4444");
                                if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
                            }
                            
                            const finalCoords = getSnakeCellCoords(pData.final_pos);
                            pawnEl.style.left = finalCoords.left;
                            pawnEl.style.top = finalCoords.top;
                            window.snakePrevPos[ws] = pData.final_pos;
                            refreshSnakePawnStacking();
                            
                        }, 400); 
                    } else {
                        window.snakePrevPos[ws] = newPos;
                    }
                });
            } else if (pawnEl && oldPos === newPos) {
                 const cssPos = getSnakeCellCoords(newPos);
                 pawnEl.style.left = cssPos.left;
                 pawnEl.style.top = cssPos.top;
            }
        });
    }
    else if (data.type === 'snake_dice_rolled') {
        if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        const activeWs = Object.keys(currentSnakeState.players).find(ws => currentSnakeState.players[ws].name === currentSnakeState.turn);
        const activeDice = document.getElementById(`snake-dice-${activeWs}`);
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
};

window.resetSnake = function(isGameOver = false) {
    const wrapper = document.getElementById('snake-wrapper');
    if (wrapper) wrapper.style.display = 'none';
    isSnakeInitialized = false; window.snakePrevPos = {};
};
