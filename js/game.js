// 전역 변수: 현재 선택된 건물 타입 (UI에서 변경)
window.currentBuildingType = null;
window.selectBuilding = (type) => {
    window.currentBuildingType = type;
    const names = {
        'habitat_fire': '🔥 불 서식지 건설 모드',
        'habitat_plant': '🌿 식물 서식지 건설 모드',
        'hatchery': '🥚 부화장 건설 모드',
        'breeding': '❤️ 교배소 건설 모드'
    };
    document.getElementById('status-msg').innerText = names[type] || "건물을 선택하세요";
};

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.tileWidth = 128;
        this.tileHeight = 64;
        this.gridSize = 14; // 섬 크기
        
        // 그리드 데이터 (어떤 칸에 건물이 있는지 저장)
        // 2차원 배열 초기화
        this.gridData = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));
    }

    preload() {
        // 1. 에셋 생성 (이미지 파일 없이 코드로 그림 그리기)
        this.createAssetTexture('grass-tile', 0x76d13d, 0x5ea834); // 초록 땅
        
        // 건물 텍스처들 생성 (간단한 박스 형태)
        this.createBuildingTexture('habitat_fire', 0xff4d4d); // 빨간색 (불)
        this.createBuildingTexture('habitat_plant', 0x2ecc71); // 초록색 (식물)
        this.createBuildingTexture('hatchery', 0xf1c40f); // 노란색 (부화장)
        this.createBuildingTexture('breeding', 0x9b59b6); // 보라색 (교배소)
    }

    // 도우미 함수: 타일 텍스처 만들기
    createAssetTexture(name, color, strokeColor) {
        const graphics = this.make.graphics({ add: false });
        graphics.fillStyle(color);
        graphics.beginPath();
        graphics.moveTo(64, 0);
        graphics.lineTo(128, 32);
        graphics.lineTo(64, 64);
        graphics.lineTo(0, 32);
        graphics.closePath();
        graphics.fillPath();
        graphics.lineStyle(2, strokeColor);
        graphics.strokePath();
        graphics.generateTexture(name, 128, 64);
    }

    // 도우미 함수: 건물 텍스처 만들기 (입체적인 박스 느낌)
    createBuildingTexture(name, color) {
        const graphics = this.make.graphics({ add: false });
        
        // 건물의 바닥 (마름모)
        graphics.fillStyle(color); // 어두운 그림자
        graphics.beginPath();
        graphics.moveTo(64, 32); // 조금 띄워서
        graphics.lineTo(110, 55);
        graphics.lineTo(64, 78);
        graphics.lineTo(18, 55);
        graphics.closePath();
        graphics.fillPath();

        // 건물의 몸체 (위로 솟은 육면체 느낌)
        graphics.fillStyle(color);
        graphics.fillRect(34, 0, 60, 60); // 단순화된 표현
        
        // 테두리
        graphics.lineStyle(2, 0xffffff);
        graphics.strokeRect(34, 0, 60, 60);

        // 중심점 조정을 위해 텍스처 크기 설정
        graphics.generateTexture(name, 128, 128);
    }

    create() {
        this.createMap(); // 섬 만들기

        // 카메라 설정
        const centerX = 0; 
        const centerY = (this.gridSize * this.tileHeight) / 2;
        this.cameras.main.centerOn(centerX, centerY);
        this.cameras.main.setZoom(1.0);

        // 입력 설정
        this.input.addPointer(1); // 모바일 터치 지원
        
        // 줌 기능
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            this.cameras.main.zoom += deltaY > 0 ? -0.1 : 0.1;
            this.cameras.main.zoom = Phaser.Math.Clamp(this.cameras.main.zoom, 0.5, 2.0);
        });
    }

    createMap() {
        const halfWidth = this.tileWidth / 2;
        const halfHeight = this.tileHeight / 2;
        const centerIdx = this.gridSize / 2;

        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                // [핵심] 원형 섬 만들기 로직
                // 중심으로부터의 거리를 계산해서, 일정 거리 안쪽만 타일을 생성
                const dist = Phaser.Math.Distance.Between(x, y, centerIdx, centerIdx);
                if (dist > centerIdx - 1) continue; // 모서리 부분은 타일 생성 안 함 (둥근 모양)

                // 좌표 변환
                let isoX = (x - y) * halfWidth;
                let isoY = (x + y) * halfHeight;

                // 타일 생성
                let tile = this.add.image(isoX, isoY, 'grass-tile');
                tile.setDepth(isoY); // 깊이 정렬 (매우 중요)
                
                // 타일 상호작용
                tile.setInteractive();
                
                // [건설 로직] 타일 클릭 시
                tile.on('pointerdown', () => {
                    this.handleTileClick(x, y, isoX, isoY);
                });
            }
        }
    }

    handleTileClick(x, y, isoX, isoY) {
        // 드래그 중이었다면 클릭 무시 (드래그와 클릭 구분)
        if (this.isDragging) return;

        // 1. 건설 모드인지 확인
        if (window.currentBuildingType) {
            // 2. 이미 건물이 있는지 확인
            if (this.gridData[x][y] !== null) {
                alert("이미 건물이 있습니다!");
                return;
            }

            // 3. 건물 배치 (건설)
            this.placeBuilding(x, y, isoX, isoY, window.currentBuildingType);
            
            // 건설 후 초기화 (선택사항: 연속 건설을 원하면 이 줄 삭제)
            // window.currentBuildingType = null; 
            // document.getElementById('status-msg').innerText = "건설 완료!";
        } else {
            console.log(`타일 정보: ${x}, ${y}`);
        }
    }

    placeBuilding(x, y, isoX, isoY, type) {
        // 건물 이미지 추가
        // 건물은 타일보다 위에 그려져야 하므로 y좌표를 조금 뺍니다.
        let building = this.add.image(isoX, isoY - 32, type);
        
        // 깊이 정렬: 타일보다 확실히 앞에 와야 함 (isoY + 1)
        building.setDepth(isoY + 1);
        
        // 데이터 저장 (이 위치에 건물이 있음 표시)
        this.gridData[x][y] = { type: type, level: 1 };

        // 팝업 효과 (통통 튀는 애니메이션)
        this.tweens.add({
            targets: building,
            scaleY: { from: 0, to: 1 },
            scaleX: { from: 0, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });
    }

    update() {
        // 카메라 드래그 로직
        const pointer = this.input.activePointer;

        if (pointer.isDown) {
            if (this.wasDown) {
                const deltaX = (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
                const deltaY = (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;

                // 드래그 민감도 체크 (살짝 터치는 클릭으로 인정하기 위함)
                if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                    this.isDragging = true;
                }

                this.cameras.main.scrollX -= deltaX;
                this.cameras.main.scrollY -= deltaY;
            }
            this.wasDown = true;
        } else {
            this.wasDown = false;
            this.isDragging = false; // 손 떼면 드래그 상태 해제
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#87CEEB',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MainScene]
};

const game = new Phaser.Game(config);
