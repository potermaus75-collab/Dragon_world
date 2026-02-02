export const TILE_SIZE = 55;
export const RAW_MAP = [
    { name:"출발", type:"start", cost:0 },
    // ... 기존 40개 맵 데이터
];

export const COST_RATIO = { land:1, villa:0.5, building:1.0, hotel:2.0, landmark:4.0 };
export const TOLL_RATIO = { land:0.5, villa:1.5, building:3.0, hotel:6.0, landmark:15.0 };
