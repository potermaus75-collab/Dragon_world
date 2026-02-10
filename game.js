/* =========================================
   game.js - 게임의 핵심 로직 (육성, 전투, 진화, 시스템)
   ========================================= */

// 전역 게임 상태 객체
let gameState = {
    myMonsters: [],   // 보유 몬스터 배열
    inventory: {
        gold: 1000,
        fire_stone: 0,
        water_stone: 0,
        grass_stone: 0,
        light_stone: 0,
        dark_stone: 0
    },
    collection: [],   // 도감 (ID 기록)
    mainMonIndex: 0,  // 현재 메인(파트너) 몬스터 인덱스
    lastSaveTime: 0
};

// 상수 설정
const MAX_STAMINA = 50;
const RECOVERY_TIME = 60000; // 1분마다 스태미나 회복 (실제 구현은 행동 시 차감만)

/* =========================================
   1. 초기화 및 유틸리티
   ========================================= */
window.onload = function() {
    loadGame(); // 로컬 스토리지 자동 로드 시도
    if (gameState.myMonsters.length === 0) {
        // 첫 시작 시 알 지급
        const starterEgg = createMonster("c_01", "egg"); // 포링 알
        gameState.myMonsters.push(starterEgg);
        alert("모험의 시작입니다! 신비한 알을 얻었습니다.");
    }
    updateUI();
    renderMapList();
};

function createMonster(speciesId, stage) {
    const species = getSpecies(speciesId); // data.js 함수
    const baseStats = generateMonsterData(speciesId, stage, "neutral").stats;

    return {
        uid: Date.now() + Math.random(), // 고유 ID
        id: speciesId,
        stage: stage, // egg, infant, growing, adult, transcendent
        element: "neutral", // 초기 속성
        nick: species.name, // 닉네임 (변경 가능)
        
        // 육성 상태
        care: { hunger: 100, clean: 100 },
        exp: 0,      // 진화 게이지 역할
        stamina: 50, // 개별 행동력
        
        // 전투 스탯
        stats: baseStats,
        rank: species.rank, // common, rare ...
        growthRate: "B" // 육성 등급 (F~S) - 초기엔 랜덤 or B
    };
}

// 몬스터 스탯 재계산 (진화/등급변동 시 호출)
function recalculateStats(mon) {
    // 1. 기본 데이터 가져오기
    const data = generateMonsterData(mon.id, mon.stage, mon.element);
    mon.nick = data.name; // 이름 업데이트 (ex: 불타는 늑대)

    // 2. 육성 등급 보정 (F=0.8 ~ S=1.2)
    const gradeMult = getGradeMultiplier(mon.growthRate);
    
    // 3. 최종 스탯 적용
    mon.stats.hp  = Math.floor(data.stats.hp * gradeMult);
    mon.stats.atk = Math.floor(data.stats.atk * gradeMult);
    mon.stats.def = Math.floor(data.stats.def * gradeMult);
    mon.stats.spd = Math.floor(data.stats.spd * gradeMult);

    // HP 풀회복
    mon.currentHp = mon.stats.hp;
}

function getGradeMultiplier(grade) {
    const table = { "F": 0.8, "D": 0.9, "C": 0.95, "B": 1.0, "A": 1.05, "A+": 1.1, "S": 1.2 };
    return table[grade] || 1.0;
}

/* =========================================
   2. 메인 게임 컨트롤러 (UI & 육성)
   ========================================= */
const game = {
    // 육성 행동 (밥, 청소, 훈련)
    action: function(type) {
        const mon = gameState.myMonsters[gameState.mainMonIndex];
        
        if (mon.stage === 'egg') {
            if (type === 'train') return alert("알은 훈련할 수 없습니다.");
        }

        if (mon.stamina < 5) {
            return alert("몬스터가 지쳤습니다. 휴식이 필요합니다. (시간 경과 필요)");
        }

        let msg = "";
        
        if (type === 'feed') {
            if (mon.care.hunger >= 100) return alert("배가 부릅니다.");
            mon.care.hunger = Math.min(100, mon.care.hunger + 30);
            mon.stamina -= 5;
            msg = "냠냠! 맛있게 먹었습니다.";
        } 
        else if (type === 'clean') {
            if (mon.care.clean >= 100) return alert("이미 깨끗합니다.");
            mon.care.clean = Math.min(100, mon.care.clean + 40);
            mon.stamina -= 5;
            msg = "반짝반짝! 기분이 좋아보입니다.";
        }
        else if (type === 'train') {
            mon.exp += 10;
            mon.care.hunger -= 10;
            mon.care.clean -= 10;
            mon.stamina -= 10;
            msg = "훈련 완료! 경험치가 올랐습니다.";
            
            // 육성 등급 상승 확률 (단순화)
            if (Math.random() < 0.1 && mon.growthRate !== 'S' && mon.growthRate !== 'A+') {
                 upgradeGrowthRate(mon);
                 msg += " (육성 등급 상승!)";
            }
        }

        game.save();
        updateUI();
        alert(msg);
    },

    // 진화 체크 및 실행
    evolveCheck: function() {
        const mon = gameState.myMonsters[gameState.mainMonIndex];
        const speciesData = getSpecies(mon.id);

        // 1. 알 -> 유아기 (EXP 20 필요)
        if (mon.stage === 'egg') {
            if (mon.exp >= 20) {
                mon.stage = 'infant';
                mon.exp = 0;
                recalculateStats(mon);
                alert(`알이 부화했습니다! ${mon.nick} 태어남!`);
            } else {
                alert(`부화까지 경험치가 ${20 - mon.exp} 남았습니다. (밥/청소 해주세요)`);
            }
        }
        // 2. 유아기 -> 성장기 (EXP 50 필요)
        else if (mon.stage === 'infant') {
            if (mon.exp >= 50) {
                mon.stage = 'growing';
                mon.exp = 0;
                recalculateStats(mon);
                alert(`${mon.nick}가 성장기로 진화했습니다! 이제 전투가 가능합니다.`);
            } else {
                alert(`성장기까지 경험치가 ${50 - mon.exp} 남았습니다.`);
            }
        }
        // 3. 성장기 -> 성체 (분기 진화)
        else if (mon.stage === 'growing') {
            openEvolutionModal(mon); // 영혼석 선택창 띄우기
        }
        // 4. 성체 -> 초월체 (조건부)
        else if (mon.stage === 'adult') {
            if (!speciesData.hasTrans) return alert("이 몬스터는 초월할 수 없습니다.");
            if (mon.exp < 100) return alert("경험치가 부족합니다 (100 필요).");
            
            // 영혼석 10개 필요 (자신의 현재 속성)
            const costKey = mon.element + "_stone";
            if (gameState.inventory[costKey] >= 10) {
                if(confirm(`${costKey} 10개를 사용하여 초월하시겠습니까?`)) {
                    gameState.inventory[costKey] -= 10;
                    mon.stage = 'transcendent';
                    recalculateStats(mon);
                    alert("축하합니다! 전설적인 초월체로 진화했습니다!");
                }
            } else {
                alert(`${costKey}가 10개 필요합니다.`);
            }
        }
    },

    // 파트너 변경
    setMainMonster: function() {
        const selectedIndex = parseInt(document.querySelector('.inven-slot.selected').dataset.index);
        gameState.mainMonIndex = selectedIndex;
        alert("파트너 몬스터가 변경되었습니다.");
        ui.showScreen('home');
        updateUI();
    },

    // 방생 (Release)
    releaseMonster: function() {
        // [안전장치] 마지막 1마리는 방생 불가
        if (gameState.myMonsters.length <= 1) {
            return alert("떠나보낼 수 없습니다. 최소 1마리의 몬스터는 있어야 합니다!");
        }

        const idx = parseInt(document.querySelector('.inven-slot.selected').dataset.index);
        const target = gameState.myMonsters[idx];

        if (idx === gameState.mainMonIndex) {
            return alert("현재 파트너로 지정된 몬스터는 방생할 수 없습니다.");
        }

        // 보상 계산 (등급별)
        const rankInfo = GAME_DATA.RANKS[target.rank];
        const rewardCount = rankInfo.reward;
        
        // 속성 결정 (무속성이면 랜덤)
        let stoneType = target.element + "_stone";
        if (target.element === 'neutral') {
            const types = ['fire_stone', 'water_stone', 'grass_stone', 'light_stone', 'dark_stone'];
            stoneType = types[Math.floor(Math.random() * types.length)];
        }

        if (confirm(`정말 ${target.nick}을(를) 자연으로 돌려보내시겠습니까?\n보상: ${rankInfo.name} 영혼석 ${rewardCount}개`)) {
            gameState.inventory[stoneType] += rewardCount;
            gameState.myMonsters.splice(idx, 1);
            
            // 인덱스 조정
            if (gameState.mainMonIndex > idx) gameState.mainMonIndex--;
            
            alert(`작별 인사를 했습니다. ${stoneType} ${rewardCount}개를 얻었습니다.`);
            ui.showScreen('inventory'); // 인벤토리 새로고침
        }
    },

    save: function() {
        localStorage.setItem('pocketEvoSave', JSON.stringify(gameState));
    }
};

function upgradeGrowthRate(mon) {
    const grades = ["F", "D", "C", "B", "A", "A+", "S"];
    const currIdx = grades.indexOf(mon.growthRate);
    if (currIdx < 5) { // A+까지만 일반 상승
        mon.growthRate = grades[currIdx + 1];
    }
}

// 분기 진화 모달 로직
function openEvolutionModal(mon) {
    // 성장기 -> 성체는 속성석을 사용하여 진화함
    let msg = "어떤 영혼석을 사용하여 진화하시겠습니까?\n";
    const stones = ['fire', 'water', 'grass', 'light', 'dark'];
    
    // 단순하게 프롬프트로 처리 (실제 UI 구현 시 모달 버튼으로 대체 가능)
    // 여기서는 간단한 예시로 가장 많이 가진 돌을 자동 추천하거나 프롬프트 입력
    const input = prompt("사용할 영혼석을 입력하세요 (fire, water, grass, light, dark):");
    
    if (!stones.includes(input)) return alert("존재하지 않는 속성입니다.");
    
    const stoneKey = input + "_stone";
    if (gameState.inventory[stoneKey] < 1) return alert(`${input} 영혼석이 없습니다.`);

    gameState.inventory[stoneKey]--;
    mon.element = input; // 속성 부여
    mon.stage = 'adult';
    recalculateStats(mon);
    alert(`신비한 힘이 깃듭니다... ${mon.nick}(으)로 진화했습니다!`);
    updateUI();
}

/* =========================================
   3. 전투 시스템 (Battle System)
   ========================================= */
const battle = {
    enemy: null,
    turn: 0,

    start: function(mapId) {
        const mon = gameState.myMonsters[gameState.mainMonIndex];
        
        // 전투 불가 조건
        if (mon.stage === 'egg' || mon.stage === 'infant') {
            return alert("아직 너무 어려서 싸울 수 없습니다.");
        }
        if (mon.care.hunger < 10) return alert("배가 너무 고파서 싸울 힘이 없습니다.");
        if (mon.currentHp <= 0) {
            mon.currentHp = 1; // 최소한의 체력으로 부활
            return alert("체력이 없습니다. (회복 필요)");
        }

        // 적 생성 (맵 난이도에 따라 랜덤)
        // 맵 ID에 따라 등장 몬스터 풀이 다르지만 여기선 랜덤 처리
        const randomSpecies = GAME_DATA.SPECIES[Math.floor(Math.random() * GAME_DATA.SPECIES.length)];
        this.enemy = createMonster(randomSpecies.id, "adult"); // 야생은 기본 성체
        // 야생 몬스터 스펙 조정 (내 몬스터 수준에 맞춤 + 약간의 변동)
        this.enemy.stats.hp = Math.floor(mon.stats.hp * (0.8 + Math.random() * 0.4));
        this.enemy.currentHp = this.enemy.stats.hp;
        
        // 화면 전환
        ui.showScreen('battle');
        this.updateBattleUI();
        this.log(`${this.enemy.nick}가 나타났다!`);
    },

    // 공격 (Attack)
    attack: function() {
        const player = gameState.myMonsters[gameState.mainMonIndex];
        const enemy = this.enemy;

        // 스피드 비교
        if (player.stats.spd >= enemy.stats.spd) {
            this.executeTurn(player, enemy, true); // 플레이어 선공
            if (enemy.currentHp > 0) this.executeTurn(enemy, player, false);
        } else {
            this.executeTurn(enemy, player, false); // 적 선공
            if (player.currentHp > 0) this.executeTurn(player, enemy, true);
        }

        this.updateBattleUI();
        this.checkBattleEnd();
    },

    // 턴 실행 로직
    executeTurn: function(attacker, defender, isPlayer) {
        // 속성 상성 계산
        let multiplier = 1.0;
        const adv = GAME_DATA.ELEMENTS[attacker.element];
        if (adv) {
            if (adv.strong === defender.element) multiplier = 1.5;
            else if (adv.weak === defender.element) multiplier = 0.5;
        }

        // 데미지 공식: (공 - 방/2) * 상성 * 랜덤(0.9~1.1)
        let damage = (attacker.stats.atk - (defender.stats.def * 0.5)) * multiplier;
        damage = Math.floor(damage * (0.9 + Math.random() * 0.2));
        if (damage < 1) damage = 1;

        defender.currentHp -= damage;
        if (defender.currentHp < 0) defender.currentHp = 0;

        let logMsg = `${attacker.nick}의 공격! ${damage} 피해.`;
        if (multiplier > 1.0) logMsg += " (효과 발군!)";
        if (multiplier < 1.0) logMsg += " (효과가 별로다..)";
        
        this.log(logMsg);
    },

    // 스킬 (단순화: 강한 공격 + 명중률 낮음)
    skill: function() {
        const player = gameState.myMonsters[gameState.mainMonIndex];
        if (Math.random() < 0.7) { // 70% 성공
            this.log("스킬 사용!");
            // 공격력 1.5배로 계산하여 공격 로직 호출하려면 구조가 복잡하니, 
            // 여기서는 단순 체력 감소 처리
            const dmg = Math.floor(player.stats.atk * 1.5);
            this.enemy.currentHp -= dmg;
            this.log(`강력한 스킬 적중! ${dmg} 피해!`);
        } else {
            this.log("스킬이 빗나갔다!");
        }
        
        // 적의 반격
        if (this.enemy.currentHp > 0) this.executeTurn(this.enemy, player, false);
        this.updateBattleUI();
        this.checkBattleEnd();
    },

    // 포획 시도
    tryCatch: function() {
        const enemy = this.enemy;
        const hpPercent = enemy.currentHp / enemy.stats.hp;
        
        // 체력이 낮을수록 확률 증가 (10% ~ 90%)
        let chance = (1 - hpPercent); 
        
        this.log("몬스터볼을 던졌다!");
        
        if (Math.random() < chance) {
            // 포획 성공
            this.log(`신난다! ${enemy.nick}을(를) 잡았다!`);
            
            // 아군으로 편입
            enemy.care = { hunger: 50, clean: 50 }; // 야생이라 상태 안좋음
            enemy.growthRate = getRandomGrowthRate(); // 육성등급 랜덤 (F~S)
            // 야생 포획 보너스로 S급 잭팟 가능성 (1%)
            if (Math.random() < 0.01) enemy.growthRate = "S";
            
            recalculateStats(enemy); // 등급에 맞춰 스탯 재설정
            gameState.myMonsters.push(enemy);
            
            setTimeout(() => {
                alert("포획 성공!");
                ui.showScreen('home');
            }, 1000);
        } else {
            this.log("아까워! 몬스터가 튀어나왔다.");
            // 실패 시 적 반격
            this.executeTurn(enemy, gameState.myMonsters[gameState.mainMonIndex], false);
            this.updateBattleUI();
            this.checkBattleEnd();
        }
    },

    run: function() {
        this.log("무사히 도망쳤다.");
        setTimeout(() => ui.showScreen('map'), 500);
    },

    checkBattleEnd: function() {
        const player = gameState.myMonsters[gameState.mainMonIndex];
        
        if (player.currentHp <= 0) {
            alert("패배했습니다... 눈앞이 깜깜해집니다.");
            player.care.hunger -= 10;
            player.care.clean -= 10;
            ui.showScreen('home');
            return;
        }

        if (this.enemy.currentHp <= 0) {
            alert("승리했습니다! 경험치 획득!");
            player.exp += 20;
            gameState.inventory.gold += 100; // 골드 획득
            
            // [포획 버튼 활성화 로직]
            // 적이 쓰러지면 포획 불가? 아니면 '제압' 상태에서 포획?
            // 기획상: 제압 후 포획 기회 줌
            document.getElementById('btn-catch').disabled = false;
            this.log("적이 제압당했다! 포획할 수 있다!");
            
            // 여기서 바로 끝나지 않고, 포획 or 나가기 선택하게 해야 함.
            // 편의상 자동 종료 대신 버튼을 누르게 유도
        } else {
            // 적 체력이 30% 이하일 때 포획 버튼 활성화
            if (this.enemy.currentHp / this.enemy.stats.hp <= 0.3) {
                 document.getElementById('btn-catch').disabled = false;
            }
        }
    },

    updateBattleUI: function() {
        const p = gameState.myMonsters[gameState.mainMonIndex];
        const e = this.enemy;

        document.getElementById('battle-player-name').innerText = p.nick;
        document.getElementById('enemy-name').innerText = e.nick;

        // 체력바 % 계산
        const pPer = (p.currentHp / p.stats.hp) * 100;
        const ePer = (e.currentHp / e.stats.hp) * 100;

        document.getElementById('battle-player-hp-bar').style.width = `${Math.max(0, pPer)}%`;
        document.getElementById('enemy-hp-bar').style.width = `${Math.max(0, ePer)}%`;

        // 스프라이트 (이모지)
        // 몬스터 이미지 등급/종류에 따라 다르게 할 수 있으나 일단 고정
        // 실제로는 data.js에 icon 속성을 넣어서 여기서 호출해야 함
        document.getElementById('enemy-sprite').innerText = "👾"; 
        
        // 포획 버튼 상태
        // 기본 비활성화, 조건 만족 시 활성화는 checkBattleEnd 등에서 처리
    },

    log: function(text) {
        document.getElementById('battle-log').innerText = text;
    }
};

function getRandomGrowthRate() {
    const r = Math.random();
    if (r < 0.3) return "F";
    if (r < 0.6) return "D";
    if (r < 0.8) return "C";
    if (r < 0.9) return "B";
    if (r < 0.98) return "A";
    return "A+"; // S는 야생에서 안나옴 (별도 로직)
}


/* =========================================
   4. UI 및 시스템 관리
   ========================================= */
const ui = {
    showScreen: function(screenId) {
        // 모든 섹션 숨김
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
        
        // 해당 섹션 표시
        document.getElementById(`screen-${screenId}`).classList.remove('hidden');
        
        // 인벤토리 진입 시 렌더링
        if (screenId === 'inventory') renderInventory();
        
        game.save();
    },
    
    closeModal: function() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }
};

const shop = {
    buy: function(itemKey) {
        const price = 500;
        if (gameState.inventory.gold >= price) {
            gameState.inventory.gold -= price;
            gameState.inventory[itemKey]++;
            alert("구매 완료!");
            updateUI();
        } else {
            alert("골드가 부족합니다.");
        }
    }
};

// 화면 갱신 함수
function updateUI() {
    const mon = gameState.myMonsters[gameState.mainMonIndex];
    
    // 상단바
    document.getElementById('player-gold').innerHTML = `<i class="fas fa-coins text-yellow"></i> ${gameState.inventory.gold}`;
    document.getElementById('player-stamina').innerHTML = `<i class="fas fa-bolt text-blue"></i> ${mon.stamina}/50`;

    // 홈 화면
    document.getElementById('home-mon-name').innerText = mon.nick;
    document.getElementById('home-mon-rank').innerText = `${mon.rank.toUpperCase()} | ${mon.growthRate}`;
    
    // 상태바 너비 및 색상
    setBar('bar-hp', (mon.currentHp / mon.stats.hp) * 100); // 현재 체력 필요 (없으면 stats.hp로 가정)
    setBar('bar-hunger', mon.care.hunger);
    setBar('bar-clean', mon.care.clean);

    // 이모지 (단계별)
    let icon = "🥚";
    if (mon.stage === 'infant') icon = "👶";
    else if (mon.stage === 'growing') icon = "🐲"; // 성장기
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

// 맵 목록 생성 (동적)
function renderMapList() {
    const container = document.getElementById('map-list-container');
    container.innerHTML = "";
    
    const maps = [
        { name: "초보자의 숲", level: 1, desc: "약한 몬스터들이 산다." },
        { name: "뜨거운 화산", level: 10, desc: "불 속성 몬스터 출몰." },
        { name: "깊은 심해", level: 20, desc: "물 속성 몬스터 출몰." },
        { name: "저주받은 땅", level: 30, desc: "강력한 몬스터 주의!" }
    ];

    maps.forEach((m, idx) => {
        const card = document.createElement('div');
        card.className = "map-card";
        card.innerHTML = `
            <div>
                <strong>${m.name}</strong> <span style="color:#888; font-size:0.8rem;">Lv.${m.level}</span><br>
                <small>${m.desc}</small>
            </div>
            <button class="action-btn" onclick="battle.start(${idx})">입장</button>
        `;
        container.appendChild(card);
    });
}

// 인벤토리 렌더링
function renderInventory() {
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
        
        // 내용물
        slot.innerText = mon.stage === 'egg' ? "🥚" : "🐉"; 
        
        // 등급 표시 점
        const dot = document.createElement('div');
        dot.className = "grade-dot";
        dot.style.backgroundColor = GAME_DATA.RANKS[mon.rank].color;
        slot.appendChild(dot);
        
        list.appendChild(slot);
    });

    // 첫 번째 몬스터 자동 선택
    showMonsterDetail(gameState.mainMonIndex);
}

function showMonsterDetail(idx) {
    const mon = gameState.myMonsters[idx];
    const panel = document.getElementById('selected-mon-detail');
    panel.classList.remove('hidden');
    
    document.getElementById('detail-name').innerText = mon.nick;
    document.getElementById('detail-stats').innerHTML = `
        공격: ${mon.stats.atk} | 방어: ${mon.stats.def}<br>
        스피드: ${mon.stats.spd} | 속성: ${mon.element}
    `;
}

/* =========================================
   5. 데이터 저장/로드 (코드 방식)
   ========================================= */
const dataManager = {
    saveToFile: function() {
        const json = JSON.stringify(gameState);
        const code = btoa(encodeURIComponent(json)); // Base64 인코딩
        prompt("아래 코드를 복사하여 보관하세요:", code);
    },
    
    loadFromFile: function() {
        const code = prompt("저장된 코드를 붙여넣으세요:");
        if (!code) return;
        try {
            const json = decodeURIComponent(atob(code));
            gameState = JSON.parse(json);
            
            // 로드 후 복구 작업 (함수는 저장이 안되므로 데이터만 복구됨)
            // 몬스터 체력 등 예외처리 필요할 수 있음
            updateUI();
            alert("로드 성공!");
        } catch(e) {
            alert("코드가 올바르지 않습니다.");
        }
    }
};

function loadGame() {
    const saved = localStorage.getItem('pocketEvoSave');
    if (saved) {
        gameState = JSON.parse(saved);
        // 불러온 데이터에 누락된 필드가 있을 경우를 대비한 마이그레이션 로직이 필요할 수 있음
    }
}
