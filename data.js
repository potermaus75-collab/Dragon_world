/* =========================================
   data.js - 게임 데이터 (스킬 추가됨)
   ========================================= */

const GAME_DATA = {
    // 1. 등급 설정
    RANKS: {
        "common":     { name: "일반", color: "#b2bec3", statMult: 1.0, reward: 1 },
        "uncommon":   { name: "고급", color: "#00b894", statMult: 1.2, reward: 2 },
        "rare":       { name: "희귀", color: "#0984e3", statMult: 1.5, reward: 4 },
        "precious":   { name: "진귀", color: "#6c5ce7", statMult: 1.8, reward: 7 },
        "heroic":     { name: "영웅", color: "#d63031", statMult: 2.2, reward: 12 },
        "legendary":  { name: "전설", color: "#f1c40f", statMult: 3.0, reward: 20 },
        "mythic":     { name: "신화", color: "#2d3436", statMult: 5.0, reward: 50 }
    },

    // 2. 속성 상성
    ELEMENTS: {
        "fire":  { name: "불",  icon: "🔥", weak: "water", strong: "grass" },
        "water": { name: "물",  icon: "💧", weak: "grass", strong: "fire" },
        "grass": { name: "풀",  icon: "🌿", weak: "fire",  strong: "water" },
        "light": { name: "빛",  icon: "☀️", weak: "dark",  strong: "dark" },
        "dark":  { name: "어둠", icon: "🌑", weak: "light", strong: "light" },
        "neutral": { name: "무", icon: "⚪", weak: null, strong: null }
    },

    // 3. 성장 단계
    STAGES: {
        "egg":         { name: "알",     mult: 0.1, battle: false },
        "infant":      { name: "유아기", mult: 0.3, battle: false },
        "growing":     { name: "성장기", mult: 0.6, battle: true },
        "adult":       { name: "성체",   mult: 1.0, battle: true },
        "transcendent":{ name: "초월체", mult: 1.5, battle: true }
    },

    // 4. 스킬 데이터 (신규 추가)
    SKILLS: {
        "tackle": { name: "몸통박치기", type: "neutral", power: 1.0, acc: 0.95, desc: "기본적인 공격." },
        "scratch": { name: "할퀴기", type: "neutral", power: 1.1, acc: 0.9, desc: "날카로운 손톱으로 공격." },
        "ember": { name: "불꽃세례", type: "fire", power: 1.2, acc: 0.85, desc: "작은 불꽃을 발사한다." },
        "watergun": { name: "물대포", type: "water", power: 1.2, acc: 0.85, desc: "물을 뿜어 공격한다." },
        "vine": { name: "덩굴채찍", type: "grass", power: 1.2, acc: 0.85, desc: "덩굴로 적을 내리친다." },
        "flash": { name: "빛의심판", type: "light", power: 1.3, acc: 0.8, desc: "성스러운 빛으로 공격." },
        "bite": { name: "물어뜯기", type: "dark", power: 1.3, acc: 0.8, desc: "어둠의 힘으로 문다." }
    },

    // 5. 몬스터 DB (기존 유지)
    SPECIES: [
        /* [일반] */
        { id: "c_01", rank: "common", name: "포링",    hasTrans: true,  desc: "말랑말랑한 점액질.", stats: { hp: 50, atk: 10, def: 5, spd: 8 } },
        { id: "c_02", rank: "common", name: "버즐",    hasTrans: false, desc: "작은 날개로 윙윙.", stats: { hp: 40, atk: 12, def: 3, spd: 12 } },
        { id: "c_03", rank: "common", name: "모스",    hasTrans: false, desc: "이끼 덩어리.", stats: { hp: 60, atk: 8, def: 8, spd: 5 } },
        { id: "c_04", rank: "common", name: "찍찍이",  hasTrans: false, desc: "치즈를 좋아하는 쥐.", stats: { hp: 45, atk: 11, def: 4, spd: 11 } },
        { id: "c_05", rank: "common", name: "페블",    hasTrans: false, desc: "굴러다니는 돌멩이.", stats: { hp: 70, atk: 9, def: 10, spd: 3 } },
        { id: "c_06", rank: "common", name: "위습",    hasTrans: false, desc: "희미한 도깨비불.", stats: { hp: 35, atk: 15, def: 2, spd: 10 } },
        { id: "c_07", rank: "common", name: "쿠",      hasTrans: false, desc: "멍한 표정의 새.", stats: { hp: 50, atk: 10, def: 5, spd: 9 } },
        { id: "c_08", rank: "common", name: "머슈",    hasTrans: false, desc: "독버섯.", stats: { hp: 55, atk: 9, def: 6, spd: 7 } },
        { id: "c_09", rank: "common", name: "셸리",    hasTrans: false, desc: "조개껍데기.", stats: { hp: 65, atk: 8, def: 12, spd: 4 } },
        { id: "c_10", rank: "common", name: "루트",    hasTrans: false, desc: "땅속 뿌리.", stats: { hp: 60, atk: 10, def: 7, spd: 6 } },
        
        /* [고급] */
        { id: "u_01", rank: "uncommon", name: "가루",  hasTrans: true,  desc: "늑대.", stats: { hp: 80, atk: 20, def: 10, spd: 15 } },
        { id: "u_02", rank: "uncommon", name: "호피",  hasTrans: false, desc: "토끼 전사.", stats: { hp: 70, atk: 18, def: 8, spd: 20 } },
        { id: "u_03", rank: "uncommon", name: "스팅",  hasTrans: false, desc: "독침.", stats: { hp: 60, atk: 25, def: 5, spd: 18 } },
        { id: "u_04", rank: "uncommon", name: "록커",  hasTrans: false, desc: "바위 피부.", stats: { hp: 100, atk: 15, def: 20, spd: 5 } },
        { id: "u_05", rank: "uncommon", name: "플로라",hasTrans: false, desc: "꽃향기.", stats: { hp: 85, atk: 15, def: 12, spd: 10 } },
        { id: "u_06", rank: "uncommon", name: "배트",  hasTrans: false, desc: "박쥐.", stats: { hp: 75, atk: 19, def: 7, spd: 16 } },
        { id: "u_07", rank: "uncommon", name: "크랩",  hasTrans: false, desc: "집게발.", stats: { hp: 90, atk: 22, def: 15, spd: 8 } },
        { id: "u_08", rank: "uncommon", name: "스파키",hasTrans: false, desc: "정전기.", stats: { hp: 70, atk: 24, def: 6, spd: 19 } },

        /* [희귀] */
        { id: "r_01", rank: "rare", name: "이그니스", hasTrans: true,  desc: "불꽃 정령.", stats: { hp: 120, atk: 35, def: 15, spd: 20 } },
        { id: "r_02", rank: "rare", name: "아쿠아",   hasTrans: true,  desc: "물 정령.", stats: { hp: 130, atk: 25, def: 25, spd: 15 } },
        { id: "r_03", rank: "rare", name: "테라",     hasTrans: false, desc: "대지 정령.", stats: { hp: 150, atk: 30, def: 30, spd: 10 } },
        { id: "r_04", rank: "rare", name: "게일",     hasTrans: false, desc: "바람 정령.", stats: { hp: 110, atk: 32, def: 10, spd: 30 } },
        { id: "r_05", rank: "rare", name: "루미",     hasTrans: false, desc: "빛 정령.", stats: { hp: 120, atk: 28, def: 18, spd: 22 } },
        { id: "r_06", rank: "rare", name: "녹스",     hasTrans: false, desc: "어둠 정령.", stats: { hp: 120, atk: 38, def: 12, spd: 22 } },

        /* [진귀] */
        { id: "p_01", rank: "precious", name: "듀라한", hasTrans: true, desc: "무두 기사.", stats: { hp: 160, atk: 45, def: 30, spd: 18 } },
        { id: "p_02", rank: "precious", name: "발키리", hasTrans: true, desc: "여전사.", stats: { hp: 150, atk: 42, def: 25, spd: 25 } },
        { id: "p_03", rank: "precious", name: "골렘",   hasTrans: false, desc: "거인.", stats: { hp: 200, atk: 50, def: 40, spd: 5 } },
        { id: "p_04", rank: "precious", name: "세이렌", hasTrans: false, desc: "노랫소리.", stats: { hp: 140, atk: 35, def: 20, spd: 20 } },
        { id: "p_05", rank: "precious", name: "가고일", hasTrans: false, desc: "석상.", stats: { hp: 180, atk: 38, def: 35, spd: 12 } },
        { id: "p_06", rank: "precious", name: "예티",   hasTrans: false, desc: "설산 주인.", stats: { hp: 190, atk: 45, def: 28, spd: 15 } },

        /* [영웅] */
        { id: "h_01", rank: "heroic", name: "아크엔젤", hasTrans: true, desc: "고위 천사.", stats: { hp: 250, atk: 60, def: 40, spd: 30 } },
        { id: "h_02", rank: "heroic", name: "데몬로드", hasTrans: true, desc: "지옥 군주.", stats: { hp: 260, atk: 70, def: 35, spd: 28 } },
        { id: "h_03", rank: "heroic", name: "피닉스",   hasTrans: false, desc: "불사조.", stats: { hp: 220, atk: 65, def: 30, spd: 35 } },
        { id: "h_04", rank: "heroic", name: "크라켄",   hasTrans: false, desc: "심해 괴수.", stats: { hp: 300, atk: 55, def: 50, spd: 10 } },
        { id: "h_05", rank: "heroic", name: "베헤모스", hasTrans: false, desc: "대지 짐승.", stats: { hp: 350, atk: 60, def: 60, spd: 8 } },

        /* [전설] */
        { id: "l_01", rank: "legendary", name: "드라칸",   hasTrans: true, desc: "고대 용.", stats: { hp: 400, atk: 100, def: 80, spd: 50 } },
        { id: "l_02", rank: "legendary", name: "레비아탄", hasTrans: true, desc: "바다 괴수.", stats: { hp: 450, atk: 90, def: 90, spd: 40 } },
        { id: "l_03", rank: "legendary", name: "지즈",     hasTrans: true, desc: "하늘 괴수.", stats: { hp: 380, atk: 110, def: 60, spd: 70 } },
        { id: "l_04", rank: "legendary", name: "타이탄",   hasTrans: true, desc: "거인.", stats: { hp: 500, atk: 120, def: 100, spd: 20 } },

        /* [신화] */
        { id: "m_01", rank: "mythic", name: "아페이론", hasTrans: true, desc: "시공간 지배자.", stats: { hp: 800, atk: 200, def: 150, spd: 100 } },
        { id: "m_02", rank: "mythic", name: "니힐",     hasTrans: true, desc: "공허.", stats: { hp: 750, atk: 220, def: 120, spd: 110 } }
    ]
};

function getSpecies(id) {
    return GAME_DATA.SPECIES.find(s => s.id === id);
}

function generateMonsterData(speciesId, stage, element = "neutral") {
    const species = getSpecies(speciesId);
    if (!species) return null;

    const rankData = GAME_DATA.RANKS[species.rank];
    const stageData = GAME_DATA.STAGES[stage];
    
    // 이름 생성
    let finalName = species.name;
    if (stage === "egg") finalName = "알";
    else if (stage === "infant") finalName = "아기 " + species.name;
    else if (stage === "growing") finalName = "성장 중인 " + species.name;
    else if (stage === "adult") {
        const prefix = {
            "fire": "불타는", "water": "냉기의", "grass": "숲의",
            "light": "성스러운", "dark": "타락한", "neutral": "평범한"
        };
        finalName = `${prefix[element]} ${species.name}`;
    }
    else if (stage === "transcendent") {
        finalName = `[초월] ${species.name}`;
    }

    // 스탯 계산
    const multiplier = rankData.statMult * stageData.mult;
    const stats = {
        hp: Math.floor(species.stats.hp * multiplier),
        atk: Math.floor(species.stats.atk * multiplier),
        def: Math.floor(species.stats.def * multiplier),
        spd: Math.floor(species.stats.spd * multiplier)
    };

    return {
        name: finalName,
        stats: stats,
        desc: species.desc
    };
}
