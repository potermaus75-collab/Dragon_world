import { RAW_MAP, COST_RATIO } from './constants.js';
import UI from './UI.js';

export default class Game {
    constructor(board) {
        this.board = board;
        this.players = [
            { id:0, name:"나", money:500, pos:0, prison:0 },
            { id:1, name:"AI", money:500, pos:0, prison:0 }
        ];
        this.mapState = new Array(40).fill(null).map(()=>({owner:-1, level:0}));
        this.turn = 0;
        this.isProcessing = false;
        
        document.getElementById('btn-roll').onclick = () => this.playTurn();
    }

    async playTurn() {
        if(this.isProcessing) return;
        this.isProcessing = true;
        document.getElementById('btn-roll').disabled = true;

        const p = this.players[this.turn];

        if(p.prison > 0) {
            UI.toast(`${p.name}: 무인도 (${p.prison}턴)`);
            const [d1, d2] = await this.rollDice();
            if(d1===d2) { UI.toast("탈출 성공!"); p.prison=0; }
            else { p.prison--; this.endTurn(); return; }
        }

        const [d1, d2] = await this.rollDice();
        await this.movePlayer(this.turn, d1+d2);
        await this.handleTile(this.turn);

        this.endTurn();
    }

    async movePlayer(pid, steps) {
        const p = this.players[pid];
        for(let i=0; i<steps; i++) {
            p.pos = (p.pos+1)%40;
            this.board.moveToken(pid, p.pos);
            if(p.pos===0) { p.money+=30; UI.toast("월급 +30만"); UI.updateMoney(this.players[0].money, this.players[1].money); }
            await new Promise(r=>setTimeout(r, 150));
        }
    }

    async handleTile(pid) {
        const pos = this.players[pid].pos;
        const d = RAW_MAP[pos];
        const s = this.mapState[pos];

        if(d.type === 'travel') {
            UI.toast("세계여행! 서울로 이동합니다.");
            await this.board.animPlane(pid, 39);
            this.players[pid].pos = 39;
            await this.handleTile(pid); 
            return;
        }

        if(d.type === 'chance') {
            const cards = [
                {t:"보너스 50만", act:p=>p.money+=50},
                {t:"기부 30만", act:p=>p.money-=30},
                {t:"뒤로 3칸", act:async p=>{
                    p.pos = (p.pos-3+40)%40; 
                    this.board.moveToken(pid, p.pos);
                }}
            ];
            const pick = cards[Math.floor(Math.random()*cards.length)];
            await UI.animChanceCard(pick.t);
            await pick.act(this.players[pid]);
            UI.updateMoney(this.players[0].money, this.players[1].money);
            return;
        }

        if(d.type === 'city') {
            const prices = [1, 0.5, 1, 2, 4].map(r => Math.floor(d.cost * r));
            const tolls = [0.5, 1.5, 3, 6, 15].map(r => Math.floor(d.cost * r));
            
            if(s.owner !== -1 && s.owner !== pid) {
                let toll = tolls[s.level];
                if(s.level===4) toll *= 2;
                this.players[pid].money -= toll;
                this.players[s.owner].money += toll;
                UI.toast(`통행료 ${toll}만 지불`);
                UI.updateMoney(this.players[0].money, this.players[1].money);
            }

            if(pid === 0) {
                const actions = {
                    canBuild: (s.owner===-1 || s.owner===0) && s.level < 4,
                    buildLabel: s.owner===-1 ? "구매" : "증축",
                    canAcquire: s.owner!==0 && s.owner!==-1 && s.level<4,
                    acquireCost: prices[s.level] * 2
                };

                const res = await UI.showPropertyModal(d, s, prices, tolls, actions);
                
                if(res === 'build') {
                    const cost = s.owner===-1 ? prices[0] : prices[s.level+1];
                    if(this.players[0].money >= cost) {
                        this.players[0].money -= cost;
                        this.board.build(0, pos, s.owner===-1 ? 1 : s.level+1);
                        this.mapState[pos].owner = 0;
                        this.mapState[pos].level = (s.owner===-1 ? 1 : s.level+1);
                    }
                } else if(res === 'acquire') {
                    const cost = actions.acquireCost;
                    if(this.players[0].money >= cost) {
                        this.players[0].money -= cost;
                        this.players[s.owner].money += cost;
                        this.mapState[pos].owner = 0;
                        this.board.build(0, pos, s.level);
                    }
                }
            } else {
                if(s.owner === -1 && this.players[1].money > prices[0]) {
                    this.players[1].money -= prices[0];
                    this.board.build(1, pos, 1);
                    this.mapState[pos].owner = 1;
                    this.mapState[pos].level = 1;
                }
            }
            UI.updateMoney(this.players[0].money, this.players[1].money);
        }
    }

    rollDice() {
        return new Promise(resolve => {
            const wrapper = document.getElementById('dice-wrapper');
            // Flexbox로 2개 나란히 표시
            wrapper.style.display = 'flex'; 
            const d1 = document.getElementById('d1'), d2 = document.getElementById('d2');
            const r1 = Math.floor(Math.random()*6)+1, r2 = Math.floor(Math.random()*6)+1;
            
            d1.style.transition = 'none'; d2.style.transition = 'none';
            d1.style.transform = 'rotateX(0) rotateY(0)';
            d2.style.transform = 'rotateX(0) rotateY(0)';
            
            setTimeout(() => {
                d1.style.transition = 'transform 1s cubic-bezier(0.2,0.8,0.2,1)';
                d2.style.transition = 'transform 1s cubic-bezier(0.2,0.8,0.2,1)';
                const rm = {1:[0,0],2:[0,-90],3:[0,-180],4:[0,90],5:[-90,0],6:[90,0]};
                
                // 두 주사위가 서로 다른 방향으로 구르게
                d1.style.transform = `rotateX(${720+rm[r1][0]}deg) rotateY(${720+rm[r1][1]}deg)`;
                d2.style.transform = `rotateX(${720+rm[r2][0]}deg) rotateY(${1080+rm[r2][1]}deg)`;
            }, 50);

            setTimeout(() => {
                wrapper.style.display = 'none';
                resolve([r1, r2]);
            }, 1200);
        });
    }

    endTurn() {
        this.isProcessing = false;
        this.turn = 1 - this.turn;
        if(this.turn === 1) setTimeout(() => this.playTurn(), 1000);
        else {
            document.getElementById('btn-roll').disabled = false;
            UI.toast("당신의 차례");
        }
    }
}
