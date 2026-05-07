console.log("🃏 Modul UNO 3D Dimuat...");

// =====================================================================
// 1. INISIALISASI THREE.JS (GLOBAL UNTUK SEMUA GAME)
// =====================================================================
window.scene = new THREE.Scene();
window.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

window.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
window.renderer.setSize(window.innerWidth, window.innerHeight);
window.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
window.renderer.shadowMap.enabled = true;
window.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(window.renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x0ea5e9, 0.9); 
window.scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.4); 
dirLight.position.set(5, 10, 5); dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024; dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near = 0.5; dirLight.shadow.camera.far = 25;
window.scene.add(dirLight);

window.addEventListener('resize', () => {
    window.camera.aspect = window.innerWidth / window.innerHeight; 
    window.camera.updateProjectionMatrix();
    window.renderer.setSize(window.innerWidth, window.innerHeight);
});

// =====================================================================
// 2. SETUP LINGKUNGAN & DEKORASI MEJA UNO
// =====================================================================
window.unoGroup = new THREE.Group(); 
window.scene.add(window.unoGroup);
window.unoGroup.visible = false; 

window.decorationsGroup = new THREE.Group(); 
window.unoGroup.add(window.decorationsGroup);

const tableGeometry = new THREE.CylinderGeometry(6, 6, 0.5, 64);
const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.3 });
const tableMesh = new THREE.Mesh(tableGeometry, tableMaterial);
tableMesh.position.set(0, -0.25, 0); tableMesh.receiveShadow = true; 
window.unoGroup.add(tableMesh);

const wallGeo = new THREE.CylinderGeometry(14, 14, 20, 32, 1, true, -Math.PI/2.5, Math.PI/1.25);
const wallMat = new THREE.MeshStandardMaterial({ color: 0x082f49, side: THREE.BackSide, roughness: 0.9 });
const wallMesh = new THREE.Mesh(wallGeo, wallMat); 
window.decorationsGroup.add(wallMesh);

const frameGeo = new THREE.BoxGeometry(5, 3.5, 0.2);
const frameMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.5 });
const frameMesh = new THREE.Mesh(frameGeo, frameMat); frameMesh.position.set(0, 6, -13.8);
const artGeo = new THREE.PlaneGeometry(4.6, 3.1);
const artMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.8 }); 
const artMesh = new THREE.Mesh(artGeo, artMat); artMesh.position.set(0, 6, -13.68);
window.decorationsGroup.add(frameMesh, artMesh);

const lampGroup = new THREE.Group();
const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.2, 32), new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.2 }));
lampBase.position.y = 0.1;
const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5), new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.2 }));
pole.position.y = 1.35; pole.rotation.z = Math.PI / 12;
const shade = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x064e3b, metalness: 0.3, roughness: 0.6, side: THREE.DoubleSide }));
shade.position.set(-0.3, 2.5, 0); shade.rotation.z = Math.PI / 6;
const lampLight = new THREE.PointLight(0xff8c00, 2.5, 12);
lampLight.position.set(-0.3, 2.2, 0); lampLight.castShadow = true;
lampGroup.add(lampBase, pole, shade, lampLight);
lampGroup.position.set(-2.6, 0, -3.5); 
window.decorationsGroup.add(lampGroup);

const bottleGroup = new THREE.Group();
const glassMat = new THREE.MeshStandardMaterial({ color: 0x10b981, transparent: true, opacity: 0.7, roughness: 0.1, metalness: 0.6 });
const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 32), glassMat); body.position.y = 0.6;
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.6, 32), glassMat); neck.position.y = 1.5;
const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.4, 0.4, 32), glassMat); shoulder.position.y = 1.2;
bottleGroup.add(body, neck, shoulder); 
bottleGroup.position.set(2.2, 0, -3); 
window.decorationsGroup.add(bottleGroup);

const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.6, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, roughness: 0.1, metalness: 0.4 }));
cup.position.set(1.7, 0.3, -2.5); 
window.decorationsGroup.add(cup);

const ashGroup = new THREE.Group();
const ashMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.15, 32), new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.5, roughness: 0.5 }));
ashMesh.position.y = 0.075;
const cigMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3), new THREE.MeshStandardMaterial({ color: 0xffffff }));
cigMesh.position.set(0.2, 0.2, 0); cigMesh.rotation.set(0, Math.PI / 4, Math.PI / 2.5);
ashGroup.add(ashMesh, cigMesh); 
ashGroup.position.set(2.4, 0, 1); 
window.decorationsGroup.add(ashGroup);

const chipGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16);
const chipMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444 });
const chipMatBlue = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
for(let i=0; i<5; i++){
    let c = new THREE.Mesh(chipGeo, i%2===0 ? chipMatRed : chipMatBlue);
    c.position.set(-2.5, 0.02 + i*0.04, 1.5); 
    window.decorationsGroup.add(c);
}

// =====================================================================
// 3. LOGIKA KARTU & GAMEPLAY UNO
// =====================================================================
const textureLoader = new THREE.TextureLoader();
const textureCache = {}; 
const tableCards = []; 
let handCards = [];  
const handGroup = new THREE.Group(); 
window.unoGroup.add(handGroup);

const dummyPileGroup = new THREE.Group();
window.unoGroup.add(dummyPileGroup);

const dummyGeo = new THREE.BoxGeometry(1.6, 2.4, 0.02);
const dummyMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });

for(let i = 0; i < 4; i++) {
    let dummyMesh = new THREE.Mesh(dummyGeo, dummyMat);
    dummyMesh.position.set((Math.random() - 0.5) * 0.1, 0.01 + (i * 0.015), (Math.random() - 0.5) * 0.1);
    dummyMesh.rotation.set(-Math.PI / 2, 0, (Math.random() - 0.5) * 0.6);
    dummyMesh.castShadow = true;
    dummyMesh.receiveShadow = true;
    dummyPileGroup.add(dummyMesh);
}

let currentHandData = [];
let pendingWildCard = null;
let targetSwipeOffset = 0; 

const colorPickerUI = document.createElement('div');
colorPickerUI.className = 'glass-panel';
colorPickerUI.style.position = 'absolute'; colorPickerUI.style.top = '50%'; colorPickerUI.style.left = '50%';
colorPickerUI.style.transform = 'translate(-50%, -50%)'; colorPickerUI.style.padding = '20px';
colorPickerUI.style.display = 'none'; colorPickerUI.style.gridTemplateColumns = '1fr 1fr';
colorPickerUI.style.gap = '15px'; colorPickerUI.style.zIndex = '1000';
document.body.appendChild(colorPickerUI);

const colors = ['Red', 'Blue', 'Green', 'Yellow'];
colors.forEach(color => {
    const btn = document.createElement('button');
    btn.innerText = color.toUpperCase(); btn.style.background = color.toLowerCase();
    btn.style.color = (color === 'Yellow') ? 'black' : 'white';
    btn.style.padding = '20px'; btn.style.fontWeight = 'bold'; btn.style.border = '2px solid rgba(255,255,255,0.5)';
    btn.style.borderRadius = '12px'; btn.style.cursor = 'pointer'; btn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    btn.onclick = () => selectWildColor(color);
    colorPickerUI.appendChild(btn);
});

function disposeCard(cardMesh) {
    if (!cardMesh) return;
    if (cardMesh.geometry) cardMesh.geometry.dispose();
    if (cardMesh.material) cardMesh.material.dispose();
}

function handleCardClick(cardName) {
    if (cardName.includes('Wild')) { 
        pendingWildCard = cardName; 
        colorPickerUI.style.display = 'grid'; 
    } else { 
        window.sendGameMessage({ type: 'play_card', card_name: cardName, declared_color: null }); 
    }
}

function selectWildColor(color) { 
    colorPickerUI.style.display = 'none'; 
    if (pendingWildCard) { 
        window.sendGameMessage({ type: 'play_card', card_name: pendingWildCard, declared_color: color }); 
        pendingWildCard = null; 
    } 
}

function spawnCardOnTable(cardName) {
    let texture = textureCache[cardName];
    if (!texture) {
        // PERBAIKAN: Hapus assets_kartu/
        texture = textureLoader.load(`${cardName}.jpg`);
        textureCache[cardName] = texture;
    }

    const geometry = new THREE.BoxGeometry(1.6, 2.4, 0.02); 
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 1.0, metalness: 0.0, color: 0x888888 });
    const cardMesh = new THREE.Mesh(geometry, material);
    cardMesh.castShadow = true; cardMesh.receiveShadow = true;
    
    while(tableCards.length > 0) {
        const oldCard = tableCards.shift();
        disposeCard(oldCard);
        window.unoGroup.remove(oldCard);
    }
    
    cardMesh.position.set(0, 3, 0); 
    cardMesh.rotation.set(-Math.PI / 2, 0, (Math.random() - 0.5) * 0.1); 
    
    window.unoGroup.add(cardMesh);
    gsap.to(cardMesh.position, { y: 0.08, duration: 0.5, ease: "bounce.out" });
    
    tableCards.push(cardMesh);
}

function syncHandCards(serverHandArray) {
    if (JSON.stringify(currentHandData) === JSON.stringify(serverHandArray)) return;
    currentHandData = serverHandArray;
    handCards.forEach(card => { disposeCard(card); handGroup.remove(card); }); handCards = [];
    
    serverHandArray.forEach(cardName => {
        let texture = textureCache[cardName];
        if (!texture) {
            // PERBAIKAN: Hapus assets_kartu/
            texture = textureLoader.load(`${cardName}.jpg`);
            textureCache[cardName] = texture;
        }

        const geometry = new THREE.BoxGeometry(1.3, 1.95, 0.02); 
        const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 1.0, metalness: 0.0, color: 0x888888 });
        
        const cardMesh = new THREE.Mesh(geometry, material);
        cardMesh.userData = { name: cardName }; cardMesh.castShadow = true;
        cardMesh.position.set(0, -5, 0); 
        handGroup.add(cardMesh); handCards.push(cardMesh);
    });
    updateNavButtons(); updateHandPositions();
}

function updateHandPositions() {
    const total = handCards.length; if (total === 0) return;
    const spacing = 1.0; const startX = -((total - 1) * spacing) / 2;
    handCards.forEach((card, index) => {
        gsap.to(card.position, { x: startX + (index * spacing), y: 1.5, z: 6 + (index * 0.01), duration: 0.4, ease: "power2.out" });
        gsap.to(card.rotation, { x: -Math.PI / 8, y: 0, z: 0, duration: 0.4 });
    });
}

function clampSwipe() {
    const maxScroll = Math.max(0, ((handCards.length - 1) * 1.0) / 2);
    if (targetSwipeOffset > maxScroll) targetSwipeOffset = maxScroll;
    if (targetSwipeOffset < -maxScroll) targetSwipeOffset = -maxScroll;
}

function updateNavButtons() {
    const navLeftBtn = document.getElementById('nav-left-btn');
    const navRightBtn = document.getElementById('nav-right-btn');
    if (!navLeftBtn || !navRightBtn) return;
    if (handCards.length > 3) { navLeftBtn.style.display = 'flex'; navRightBtn.style.display = 'flex'; } 
    else { navLeftBtn.style.display = 'none'; navRightBtn.style.display = 'none'; }
}

const navLeftBtn = document.getElementById('nav-left-btn');
const navRightBtn = document.getElementById('nav-right-btn');
if (navLeftBtn) navLeftBtn.addEventListener('click', () => { window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); targetSwipeOffset += 2; clampSwipe(); });
if (navRightBtn) navRightBtn.addEventListener('click', () => { window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); targetSwipeOffset -= 2; clampSwipe(); });

// =====================================================================
// 4. INTERAKSI TOUCH / RAYCASTER (KHUSUS UNO)
// =====================================================================
window.raycaster = new THREE.Raycaster(); 
window.mouse = new THREE.Vector2();
let isTouching = false; let isSwiping = false; let startTouchX = 0; let startTouchY = 0;

window.addEventListener('pointerdown', (event) => {
    if (event.target.tagName === 'BUTTON' || event.target.tagName === 'INPUT') return; 
    if (window.currentGameType !== 'UNO' || !window.isMyTurn || colorPickerUI.style.display === 'grid') return;
    isTouching = true; isSwiping = false; 
    startTouchX = event.clientX; startTouchY = event.clientY;
});

window.addEventListener('pointermove', (event) => {
    if (!isTouching || window.currentGameType !== 'UNO') return;
    const deltaX = event.clientX - startTouchX;
    const deltaY = event.clientY - startTouchY;
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) isSwiping = true;
    if (isSwiping) { targetSwipeOffset += deltaX * 0.02; startTouchX = event.clientX; startTouchY = event.clientY; clampSwipe(); }
});

window.addEventListener('pointerup', (event) => {
    if (!isTouching || window.currentGameType !== 'UNO') return;
    if (!isSwiping) {
        window.mouse.x = (event.clientX / window.innerWidth) * 2 - 1; 
        window.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        window.raycaster.setFromCamera(window.mouse, window.camera);
        const intersects = window.raycaster.intersectObjects(handCards);
        if (intersects.length > 0) handleCardClick(intersects[0].object.userData.name);
    }
    isTouching = false; isSwiping = false;
});
window.addEventListener('pointerleave', () => { isTouching = false; isSwiping = false; });

// =====================================================================
// 5. API UNTUK APP.JS (KONEKSI ANTAR MODUL)
// =====================================================================

window.startUnoGame = function(data) {
    window.unoGroup.visible = true;
    if (window.chessGroup) window.chessGroup.visible = false;
    
    window.camera.position.set(0, 7, 10); window.camera.lookAt(0, 0, 0);

    tableCards.forEach(card => { disposeCard(card); window.unoGroup.remove(card); }); tableCards.length = 0;
    handCards.forEach(card => { disposeCard(card); handGroup.remove(card); }); handCards.length = 0;
    
    currentHandData = []; targetSwipeOffset = 0; pendingWildCard = null;
    colorPickerUI.style.display = 'none';
    updateNavButtons();
};

window.handleUnoMessage = function(data) {
    if (data.type === 'game_state') {
        window.isMyTurn = data.is_your_turn;
        const drawBtn = document.getElementById('draw-btn');
        
        if (window.isMyTurn) {
            if (data.pending_draw > 0) {
                window.messageBox.innerHTML = `⚠️ <span style="color:var(--danger-color)">KENA +${data.pending_draw}!</span> Balas atau Tarik!`;
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
            } else {
                window.messageBox.innerHTML = `🔥 <span style="color:#fcd34d">GILIRANMU!</span> (${data.current_color})`;
                window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
            }
            if(drawBtn) { drawBtn.style.opacity = '1'; drawBtn.style.pointerEvents = 'auto'; }
            
            if(typeof gsap !== 'undefined') {
                gsap.fromTo(window.messageBox, {scale: 1.15}, {scale: 1, duration: 0.4, ease: "bounce.out"});
            }
        } else {
            window.messageBox.innerHTML = `⏳ Menunggu ${data.turn}... (${data.current_color})`;
            if(drawBtn) { drawBtn.style.opacity = '0.5'; drawBtn.style.pointerEvents = 'none'; }
        }

        let someoneHasOneCard = false;
        if (data.hand_counts) {
            for (const [pName, count] of Object.entries(data.hand_counts)) {
                if (count === 1 && pName !== window.playerName) someoneHasOneCard = true;
            }
        }
        const catchWrapper = document.getElementById('catch-wrapper');
        if(catchWrapper) catchWrapper.style.display = someoneHasOneCard ? 'inline-block' : 'none';

        if (tableCards.length === 0 && data.top_card) spawnCardOnTable(data.top_card);
        syncHandCards(data.your_hand);
    }
    else if (data.type === 'card_played') {
        spawnCardOnTable(data.card_name);
        window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
    } 
    else if (data.type === 'draw_result') {
        if (data.can_play) {
            window.showCustomConfirm(`Kartu yang ditarik cocok. Mainkan langsung?`, (agreed) => {
                if (agreed) handleCardClick(data.card);
                else window.sendGameMessage({ type: 'pass_turn' });
            });
        }
    }
    else if (data.type === 'uno_shout') {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        // Jangan munculkan untuk diri sendiri karena sudah ditrigger secara lokal di app.js
        if (data.player_name !== window.playerName) {
            window.showEpicPopup("UNO!", data.player_name, "#fcd34d"); 
        }
    }
    else if (data.type === 'uno_penalty') {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        window.showEpicPopup("CIDUK!", `${data.player_name} +2 Kartu`, "#ef4444"); 
    }
};

window.resetUno = function(isGameOver = false) {
    targetSwipeOffset = 0; pendingWildCard = null; colorPickerUI.style.display = 'none';
    tableCards.forEach(card => { disposeCard(card); window.unoGroup.remove(card); }); tableCards.length = 0;
    handCards.forEach(card => { disposeCard(card); handGroup.remove(card); }); handCards.length = 0;
    if (!isGameOver) window.unoGroup.visible = false; 
    updateNavButtons();
};

window.toggleThreeJSSimpleMode = function(isSimpleMode) {
    if (window.decorationsGroup) window.decorationsGroup.visible = !isSimpleMode;
    if (window.renderer && dirLight) {
        window.renderer.shadowMap.enabled = !isSimpleMode;
        window.renderer.setPixelRatio(isSimpleMode ? 1 : Math.min(window.devicePixelRatio, 2));
        dirLight.castShadow = !isSimpleMode;
    }
};

// =====================================================================
// 6. RENDER LOOP UTAMA (Menggerakkan Frame UNO & Catur)
// =====================================================================
function animate() {
    requestAnimationFrame(animate);
    
    if (window.currentGameType === 'UNO' && handGroup) {
        handGroup.position.x += (targetSwipeOffset - handGroup.position.x) * 0.15;
    }
    
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}
animate();
