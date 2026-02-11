/* =========================================
   game.js - 게임 코어 (자연 감소 로직 추가됨)
   ========================================= */

let gameState = {
    myMonsters: [],
    inventory: {
        gold: 1000,
        fire_stone: 0, water_stone: 0, grass_stone: 0,
        light_stone: 0, dark_stone: 0
    },
    collection: [],
    mainMonIndex: 0,
    lastSaveTime: Date.now()
};

const MAX_STAMINA = 50;
const RECOVERY_TIME = 60000; // 1분
const DECAY_RATE = 5; // 1분당 감소량 (배고픔/청결)

/* =========================================
   1. 초기화 및 시스템
   ========================================= */
window.onload = function() {
    loadGame();
    
    // [신규] 오프라인 시간 보상 및 패널티 계산
    const now = Date.now();
    const diff = now - gameState.lastSaveTime;
    
    // 최소 1분 이상 지났을 때만 계산
    if (diff > RECOVERY_TIME) {
        const ticks = Math.floor(diff / RECOVERY_TIME);
        
        gameState.myMonsters.forEach(mon => {
            // 스태미나 회복
            mon.stamina = Math.min(MAX_STAMINA, mon.stamina + ticks);
            
            // 배고픔 & 청결도 자연 감소 (접속 안 한 만큼 깎임)
            mon.care.hunger = Math.max(0, mon.care.hunger - (ticks * DECAY_RATE));
            mon.care.clean = Math.max(0, mon.care.clean - (ticks * DECAY_RATE));
            
            // 배고픔이 0이면 체력도 감소 (굶어 죽기 방지용으로 1까지만)
            if (mon.care.hunger === 0) {
                mon.currentHp = Math.max(1, mon.currentHp - (ticks * 2));
            }
        });
        console.log(`오프라인 ${ticks}분 경과 적용됨.`);
    }

    if (gameState.myMonsters.length === 0) {
        const starterEgg = createMonster("c_01", "egg");
        gameState.myMonsters.push(starterEgg);
        alert("모험의 시작입니다! 신비한 알을 얻었습니다.");
    }
    
    updateUI();
    renderMapList();
    
    // [핵심 수정] 1분마다 상태 변화 타이머
    setInterval(() => {
        gameState.myMonsters.forEach(mon => {
            // 1. 스태미나 회복
            if (mon.stamina < MAX_STAMINA) mon.stamina++;
            
            // 2. 배고픔 & 청결도 자연 감소
            // 알 단계에서는 배고픔/청결이 줄지 않음 (부화 전이니까)
            if (mon.stage !== 'egg') {
                mon.care.hunger = Math.max(0, mon.care.hunger - DECAY_RATE);
                mon.care.clean = Math.max(0, mon.care.clean - DECAY_RATE);
                
                // 배고픔 0일 때 체력 감소 패널티
                if (mon.care.hunger === 0) {
                     mon.currentHp = Math.max(1, mon.currentHp - 5);
                }
            }
        });
        updateUI();
    }, RECOVERY_TIME);

    // 자동 저장 타이머 (10초)
    setInterval(() => game.save(), 10000);
};

function createMonster(speciesId, stage) {
    const species = getSpecies(speciesId);
    const baseStats = generateMonsterData(speciesId, stage, "neutral").stats;

    return {
        uid: Date.now() + Math.random(),
        id: speciesId,
        stage: stage,
        element: "neutral",
        nick: species.name,
        care: { hunger: 50, clean: 50 }, // 처음엔 반만 채워서 줌 (바로 밥 줄 수 있게)
        exp: 0,
        stamina: 50,
        stats: baseStats,
        currentHp: baseStats.hp,
        rank: species.rank,
        growthRate: "B"
    };
}

function recalculateStats(mon) {
    const data = generateMonsterData(mon.id, mon.stage, mon.element);
    mon.nick = data.name; 
    const gradeMult = getGradeMultiplier(mon.growthRate);
    mon.stats.hp  = Math.floor(data.stats.hp * gradeMult);
    mon.stats.atk = Math.floor(data.stats.atk * gradeMult);
    mon.stats.def = Math.floor(data.stats.def * gradeMult);
    mon.stats.spd = Math.floor(data.stats.spd * gradeMult);
    mon.currentHp = mon.stats.hp;
}

function getGradeMultiplier(grade) {
    const table = { "F": 0.8, "D": 0.9, "C": 0.95, "B": 1.0, "A": 1.05, "A+": 1.1, "S": 1.2 };
    return table[grade] || 1.0;
}

/* =========================================
   2. 메인 게임 컨트롤러
   ========================================= */
const game = {
    action: function(type) {
        const mon = gameState.myMonsters[gameState.mainMonIndex];
        
        if (mon.stage === 'egg' && type === 'train') return alert("알은 훈련할 수 없습니다.");
        if (mon.stamina < 5) return alert("몬스터가 지쳤습니다. (1분당 1회복)");

        let msg = "";
        
        if (type === 'feed') {
            if (mon.care.hunger >= 100) return alert("배가 부릅니다.");
            mon.care.hunger = Math.min(100, mon.care.hunger + 30);
            mon.stamina -= 5;
            // 밥 먹으면 소량의 경험치 획득 (성장 도움)
            if(mon.stage !== 'adult' && mon.stage !== 'transcendent') mon.exp += 2;
            msg = "냠냠! 맛있게 먹었습니다.";
        } 
        else if (type === 'clean') {
            if (mon.care.clean >= 100) return alert("이미 깨끗합니다.");
            mon.care.clean = Math.min(100, mon.care.clean + 40);
            mon.stamina -= 5;
            if(mon.stage !== 'adult' && mon.stage !== 'transcendent') mon.exp += 2;
            msg = "반짝반짝! 기분이 좋아보입니다.";
        }
        else if (type === 'train') {
            mon.exp += 10;
            mon.care.hunger = Math.max(0, mon.care.hunger - 10); // 훈련하면 배고파짐
            mon.care.clean = Math.max(0, mon.care.clean - 10);   // 훈련하면 더러워짐
            mon.stamina -= 10;
            msg = "훈련 완료! 경험치가 올랐습니다.";
            if (Math.random() < 0.1) upgradeGrowthRate(mon);
        }

        game.save();
        updateUI();
        alert(msg);
    },

    evolveCheck: function() {
        const mon = gameState.myMonsters[gameState.mainMonIndex];
        const speciesData = getSpecies(mon.id);

        if (mon.stage === 'egg') {
            if (mon.exp >= 20) {
                mon.stage = 'infant'; mon.exp = 0; recalculateStats(mon);
                alert(`알이 부화했습니다!`);
            } else alert(`부화 경험치: ${mon.exp}/20`);
        }
        else if (mon.stage === 'infant') {
            if (mon.exp >= 50) {
                mon.stage = 'growing'; mon.exp = 0; recalculateStats(mon);
                alert(`${mon.nick}로 성장했습니다!`);
            } else alert(`성장 경험치: ${mon.exp}/50`);
        }
        else if (mon.stage === 'growing') {
            document.getElementById('evolution-modal').classList.remove('hidden');
        }
        else if (mon.stage === 'adult') {
            if (!speciesData.hasTrans) return alert("더 이상 진화할 수 없습니다.");
            if (mon.exp < 100) return alert("경험치가 부족합니다 (100 필요).");
            
            const costKey = mon.element + "_stone";
            if (gameState.inventory[costKey] >= 10) {
                if(confirm(`${costKey} 10개를 사용하여 초월하시겠습니까?`)) {
                    gameState.inventory[costKey] -= 10;
                    mon.stage = 'transcendent';
                    recalculateStats(mon);
                    alert("전설적인 초월체로 진화했습니다!");
                }
            } else alert(`${costKey}가 10개 필요합니다.`);
        }
        updateUI();
    },

    evolveTo: function(elementType) {
        const mon = gameState.myMonsters[gameState.mainMonIndex];
        const stoneKey = elementType + "_stone";
        
        if (gameState.inventory[stoneKey] < 1) {
            return alert(`${elementType} 영혼석이 부족합니다!`);
        }
        
        gameState.inventory[stoneKey]--;
        mon.element = elementType;
        mon.stage = 'adult';
        recalculateStats(mon);
        
        document.getElementById('evolution-modal').classList.add('hidden');
        alert(`${mon.nick}(으)로 진화했습니다!`);
        updateUI();
    },

    setMainMonster: function() {
        const selectedEl = document.querySelector('.inven-slot.selected');
        if(!selectedEl) return;
        gameState.mainMonIndex = parseInt(selectedEl.dataset.index);
        alert("파트너가 변경되었습니다.");
        ui.showScreen('home');
        updateUI();
    },

    releaseMonster: function() {
        if (gameState.myMonsters.length <= 1) return alert("최소 1마리는 있어야 합니다!");
        const idx = parseInt(document.querySelector('.inven-slot.selected').dataset.index);
        if (idx === gameState.mainMonIndex) return alert("파트너는 방생할 수 없습니다.");
        
        const target = gameState.myMonsters[idx];
        const stoneType = (target.element === 'neutral' ? 'fire' : target.element) + "_stone";
        const reward = GAME_DATA.RANKS[target.rank].reward;

        if (confirm(`${target.nick}을 보내주시겠습니까?\n보상: ${stoneType} ${reward}개`)) {
            gameState.inventory[stoneType] += reward;
            gameState.myMonsters.splice(idx, 1);
            if (gameState.mainMonIndex > idx) gameState.mainMonIndex--;
            ui.showScreen('inventory');
            updateUI();
        }
    },

    save: function() {
        gameState.lastSaveTime = Date.now();
        localStorage.setItem('pocketEvoSave', JSON.stringify(gameState));
    }
};

function upgradeGrowthRate(mon) {
    const grades = ["F", "D", "C", "B", "A", "A+", "S"];
    const idx = grades.indexOf(mon.growthRate);
    if (idx < 5) mon.growthRate = grades[idx + 1];
}

/* =========================================
   3. 전투 시스템
   ========================================= */
const battle = {
    enemy: null,
    
    start: function(mapId) {
        const mon = gameState.myMonsters[gameState.mainMonIndex];
        if (mon.stage === 'egg' || mon.stage === 'infant') return alert("아직 싸울 수 없습니다.");
        if (mon.currentHp <= 0) return alert("체력이 없습니다.");

        let pool = GAME_DATA.SPECIES;
        
        if (mapId === 0) pool = pool.filter(s => s.rank === 'common' || s.rank === 'uncommon');
        else if (mapId === 1) pool = pool.filter(s => s.desc.includes('불') || s.desc.includes('열') || s.id.includes('u'));
        else if (mapId === 2) pool = pool.filter(s => s.desc.includes('물') || s.desc.includes('바다'));
        else if (mapId === 3) pool = pool.filter(s => s.rank === 'rare' || s.rank === 'precious' || s.desc.includes('어둠'));
        
        if (pool.length === 0) pool = GAME_DATA.SPECIES; 

        const randomSpecies = pool[Math.floor(Math.random() * pool.length)];
        this.enemy = createMonster(randomSpecies.id, "adult");
        
        const diff = 0.8 + (mapId * 0.1) + (Math.random() * 0.2);
        this.enemy.stats.hp = Math.floor(mon.stats.hp * diff);
        this.enemy.stats.atk = Math.floor(mon.stats.atk * diff);
        this.enemy.stats.def = Math.floor(mon.stats.def * diff);
        this.enemy.stats.spd = Math.floor(mon.stats.spd * diff);
        this.enemy.currentHp = this.enemy.stats.hp;

        if (mapId === 1) this.enemy.element = 'fire';
        else if (mapId === 2) this.enemy.element = 'water';
        else if (mapId === 3) this.enemy.element = 'dark';
        else this.enemy.element = ['grass', 'neutral'][Math.floor(Math.random()*2)];
        
        recalculateStats(this.enemy);

        ui.showScreen('battle');
        this.resetBattleBtns();
        this.updateBattleUI();
        this.log(`${this.enemy.nick} 야생 출현!`);
    },

    attack: function() {
        this.processTurn('attack');
    },

    skill: function() {
        this.processTurn('skill');
    },

    processTurn: function(actionType) {
        const player = gameState.myMonsters[gameState.mainMonIndex];
        const enemy = this.enemy;
        const playerFirst = player.stats.spd >= enemy.stats.spd;
        
        if (playerFirst) {
            if(this.executeMove(player, enemy, actionType)) return;
            if(this.executeMove(enemy, player, 'attack')) return;
        } else {
            if(this.executeMove(enemy, player, 'attack')) return;
            if(this.executeMove(player, enemy, actionType)) return;
        }
        
        this.updateBattleUI();
    },

    executeMove: function(attacker, defender, type) {
        if (attacker.currentHp <= 0) return false;

        let damage = 0;
        let msg = "";

        if (type === 'attack') {
            damage = Math.max(1, attacker.stats.atk - (defender.stats.def * 0.3));
            msg = `${attacker.nick}의 공격!`;
        } else if (type === 'skill') {
            const skillKey = this.getSkillKey(attacker.element);
            const skillData = GAME_DATA.SKILLS[skillKey];
            
            if (Math.random() > skillData.acc) {
                this.log(`${attacker.nick}의 ${skillData.name} 빗나감!`);
                return false;
            }

            let mult = 1.0;
            const adv = GAME_DATA.ELEMENTS[skillData.type];
            if (adv.strong === defender.element) mult = 1.5;
            else if (adv.weak === defender.element) mult = 0.5;

            damage = (attacker.stats.atk * skillData.power) - (defender.stats.def * 0.2);
            damage = Math.floor(damage * mult);
            msg = `${skillData.name}!`;
            if (mult > 1) msg += " (효과 발군!)";
            if (mult < 1) msg += " (효과 별로...)";
        }

        defender.currentHp -= Math.floor(damage);
        if (defender.currentHp < 0) defender.currentHp = 0;
        this.log(`${msg} ${Math.floor(damage)} 피해.`);

        return this.checkBattleEnd();
    },

    getSkillKey: function(element) {
        const map = { fire:'ember', water:'watergun', grass:'vine', light:'flash', dark:'bite' };
        return map[element] || 'tackle';
    },

    tryCatch: function() {
        if (gameState.myMonsters.length >= 30) return alert("보관함이 가득 찼습니다!");
        
        const chance = (1 - (this.enemy.currentHp / this.enemy.stats.hp)) * 0.8;
        if (Math.random() < chance) {
            this.log(`잡았다! ${this.enemy.nick}`);
            this.enemy.care = { hunger: 50, clean: 50 };
            gameState.myMonsters.push(this.enemy);
            
            document.getElementById('btn-catch').disabled = true;
            document.getElementById('btn-run').innerText = "돌아가기";
            alert("포획 성공!");
        } else {
            this.log("포획 실패! 적이 공격합니다.");
            this.executeMove(this.enemy, gameState.myMonsters[gameState.mainMonIndex], 'attack');
            this.updateBattleUI();
        }
    },

    run: function() {
        const btnText = document.getElementById('btn-run').innerText;
        if (btnText === "돌아가기") {
            ui.showScreen('map');
        } else {
            if (Math.random() < 0.5) {
                this.log("도망쳤습니다.");
                setTimeout(() => ui.showScreen('map'), 500);
            } else {
                this.log("도망 실패!");
                this.executeMove(this.enemy, gameState.myMonsters[gameState.mainMonIndex], 'attack');
                this.updateBattleUI();
            }
        }
    },

    checkBattleEnd: function() {
        if (gameState.myMonsters[gameState.mainMonIndex].currentHp <= 0) {
            alert("패배했습니다...");
            ui.showScreen('home');
            return true;
        }
        if (this.enemy.currentHp <= 0) {
            this.log("승리!");
            gameState.inventory.gold += 100;
            gameState.myMonsters[gameState.mainMonIndex].exp += 15;
            
            document.getElementById('btn-run').innerText = "돌아가기";
            document.getElementById('btn-run').classList.add('active'); 
            document.getElementById('btn-catch').disabled = true; 
            return true;
        }
        return false;
    },

    updateBattleUI: function() {
        const p = gameState.myMonsters[gameState.mainMonIndex];
        const e = this.enemy;

        document.getElementById('battle-player-name').innerText = p.nick;
        document.getElementById('enemy-name').innerText = e.nick;

        const pPer = (p.currentHp / p.stats.hp) * 100;
        const ePer = (e.currentHp / e.stats.hp) * 100;
        document.getElementById('battle-player-hp-bar').style.width = `${Math.max(0, pPer)}%`;
        document.getElementById('enemy-hp-bar').style.width = `${Math.max(0, ePer)}%`;
        
        if (e.currentHp > 0 && ePer < 40) document.getElementById('btn-catch').disabled = false;
        
        const skillName = GAME_DATA.SKILLS[this.getSkillKey(p.element)].name;
        document.getElementById('btn-skill').innerText = skillName;
    },

    resetBattleBtns: function() {
        document.getElementById('btn-catch').disabled = true;
        document.getElementById('btn-run').innerText = "도망";
        document.getElementById('btn-run').classList.remove('active');
        document.getElementById('battle-log').innerText = "전투 시작!";
    },

    log: function(msg) {
        document.getElementById('battle-log').innerText = msg;
    }
};

/* =========================================
   4. UI 및 유틸리티
   ========================================= */
const ui = {
    showScreen: function(screenId) {
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
        document.getElementById(`screen-${screenId}`).classList.remove('hidden');
        if (screenId === 'inventory') renderInventory();
    },
    closeModal: function() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }
};

const shop = {
    buy: function(itemKey) {
        const price = (itemKey.includes('light') || itemKey.includes('dark')) ? 1000 : 500;
        if (gameState.inventory.gold >= price) {
            gameState.inventory.gold -= price;
            gameState.inventory[itemKey]++;
            alert("구매 성공!");
            updateUI();
        } else alert("골드가 부족합니다.");
    }
};

function updateUI() {
    const mon = gameState.myMonsters[gameState.mainMonIndex];
    document.getElementById('player-gold').innerHTML = `<i class="fas fa-coins text-yellow"></i> ${gameState.inventory.gold}`;
    document.getElementById('player-stamina').innerHTML = `<i class="fas fa-bolt text-blue"></i> ${mon.stamina}/50`;

    document.getElementById('home-mon-name').innerText = mon.nick;
    document.getElementById('home-mon-rank').innerText = `${mon.rank.toUpperCase()} | ${mon.growthRate}`;
    
    setBar('bar-hp', (mon.currentHp / mon.stats.hp) * 100);
    setBar('bar-hunger', mon.care.hunger);
    setBar('bar-clean', mon.care.clean);

    let icon = "🥚";
    if (mon.stage === 'infant') icon = "👶";
    else if (mon.stage === 'growing') icon = "🐲";
    else if (mon.stage === 'adult') {
        const elemIcons = { fire:"🔥", water:"💧", grass:"🌿", light:"☀️", dark:"🌑", neutral:"🐾" };
        icon = elemIcons[mon.element] || "🐉";
    }
    document.getElementById('home-mon-img').innerText = icon;
}

function setBar(id, percent) {
    const bar = document.getElementById(id);
    bar.style.width = `${percent}%`;
    bar.classList.remove('low', 'mid');
    if (percent < 30) bar.classList.add('low');
    else if (percent < 70) bar.classList.add('mid');
}

function renderMapList() {
    const container = document.getElementById('map-list-container');
    container.innerHTML = "";
    const maps = [
        { name: "초보자의 숲", level: 1, desc: "풀 속성 위주" },
        { name: "뜨거운 화산", level: 10, desc: "불 속성 위주" },
        { name: "깊은 심해", level: 20, desc: "물 속성 위주" },
        { name: "저주받은 땅", level: 30, desc: "강력한 어둠" }
    ];

    maps.forEach((m, idx) => {
        const card = document.createElement('div');
        card.className = "map-card";
        card.innerHTML = `
            <div><strong>${m.name}</strong> <small>Lv.${m.level} (${m.desc})</small></div>
            <button class="action-btn" onclick="battle.start(${idx})">입장</button>
        `;
        container.appendChild(card);
    });
}

function renderInventory() {
    const inv = gameState.inventory;
    document.getElementById('res-fire').innerText = inv.fire_stone;
    document.getElementById('res-water').innerText = inv.water_stone;
    document.getElementById('res-grass').innerText = inv.grass_stone;
    document.getElementById('res-light').innerText = inv.light_stone;
    document.getElementById('res-dark').innerText = inv.dark_stone;
    document.getElementById('inven-count').innerText = gameState.myMonsters.length;

    const list = document.getElementById('monster-list');
    list.innerHTML = "";
    
    gameState.myMonsters.forEach((mon, idx) => {
        const slot = document.createElement('div');
        slot.className = `inven-slot ${idx === gameState.mainMonIndex ? 'selected' : ''}`;
        slot.dataset.index = idx;
        slot.onclick = function() {
            document.querySelectorAll('.inven-slot').forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
            showMonsterDetail(idx);
        };
        
        let icon = "🥚";
        if (mon.stage === 'adult') icon = GAME_DATA.ELEMENTS[mon.element].icon;
        
        slot.innerHTML = icon;
        
        const dot = document.createElement('div');
        dot.className = "grade-dot";
        dot.style.backgroundColor = GAME_DATA.RANKS[mon.rank].color;
        slot.appendChild(dot);
        
        list.appendChild(slot);
    });
    showMonsterDetail(gameState.mainMonIndex);
}

function showMonsterDetail(idx) {
    const mon = gameState.myMonsters[idx];
    document.getElementById('selected-mon-detail').classList.remove('hidden');
    document.getElementById('detail-name').innerText = mon.nick;
    document.getElementById('detail-stats').innerHTML = `
        체력: ${mon.currentHp}/${mon.stats.hp}<br>
        공: ${mon.stats.atk} | 방: ${mon.stats.def} | 속: ${mon.stats.spd}
    `;
}

const dataManager = {
    saveToFile: function() {
        const json = JSON.stringify(gameState);
        prompt("코드 복사:", btoa(encodeURIComponent(json)));
    },
    loadFromFile: function() {
        const code = prompt("코드 붙여넣기:");
        if (!code) return;
        try {
            gameState = JSON.parse(decodeURIComponent(atob(code)));
            updateUI(); alert("로드 완료!");
        } catch(e) { alert("코드 오류"); }
    }
};

function loadGame() {
    const saved = localStorage.getItem('pocketEvoSave');
    if (saved) gameState = JSON.parse(saved);
}
