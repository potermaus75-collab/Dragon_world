class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.tileWidth = 128; // 타일 전체 너비
        this.tileHeight = 64; // 타일 전체 높이
        this.gridSize = 20;   // 맵 크기 (20x20)
    }

    preload() {
        // 이미지가 없을 때를 대비해, 코드로 '풀밭 타일'을 직접 만듭니다.
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // 마름모 그리기 (연한 초록색 윗면)
        graphics.fillStyle(0x76d13d); 
        graphics.beginPath();
        graphics.moveTo(64, 0);
        graphics.lineTo(128, 32);
        graphics.lineTo(64, 64);
        graphics.lineTo(0, 32);
        graphics.closePath();
        graphics.fillPath();

        // 타일 테두리 (구분선)
        graphics.lineStyle(2, 0x5ea834, 1);
        graphics.strokePath();

        // 'grass-tile'이라는 이름으로 텍스처 생성
        graphics.generateTexture('grass-tile', 128, 64);
    }

    create() {
        // 1. 맵 생성
        this.createMap();

        // 2. 카메라 초기 위치 설정 (맵의 정중앙을 바라보게 함)
        // 맵의 중앙 좌표 계산
        const centerX = (this.gridSize * this.tileWidth) / 2; 
        const centerY = (this.gridSize * this.tileHeight) / 2; 
        
        // 아이소메트릭 상의 중앙쯤으로 이동
        this.cameras.main.centerOn(0, centerY / 2);
        this.cameras.main.setZoom(1.0); 

        // 3. 줌 인/아웃 기능 (마우스 휠)
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (deltaY > 0) {
                this.cameras.main.zoom -= 0.1;
            } else {
                this.cameras.main.zoom += 0.1;
            }
            // 줌 제한
            this.cameras.main.zoom = Phaser.Math.Clamp(this.cameras.main.zoom, 0.5, 2.0);
        });
        
        // 중앙 기준점 (빨간점) - 개발용
        this.add.circle(0, 0, 10, 0xff0000).setDepth(10000);
    }

    createMap() {
        const halfWidth = this.tileWidth / 2;
        const halfHeight = this.tileHeight / 2;

        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                // 아이소메트릭 좌표 변환
                let isoX = (x - y) * halfWidth;
                let isoY = (x + y) * halfHeight;

                // 타일 배치
                let tile = this.add.image(isoX, isoY, 'grass-tile');
                
                // 깊이 정렬 (매우 중요)
                tile.setDepth(isoY);
                
                // 타일 클릭 이벤트
                tile.setInteractive();
                tile.on('pointerdown', () => {
                    console.log(`클릭한 타일 좌표: ${x}, ${y}`);
                    tile.setTint(0xff0000); // 클릭 시 빨간색 표시
                });
            }
        }
    }

    update() {
        // 4. 카메라 드래그 이동 (모바일 터치 & 마우스 드래그)
        if (this.input.activePointer.isDown) {
            if (this.origDragPoint) {
                // 드래그 중일 때 카메라 이동
                this.cameras.main.scrollX += (this.origDragPoint.x - this.input.activePointer.position.x) / this.cameras.main.zoom;
                this.cameras.main.scrollY += (this.origDragPoint.y - this.input.activePointer.position.y) / this.cameras.main.zoom;
            }
            // 현재 포인터 위치 저장
            this.origDragPoint = this.input.activePointer.position.clone();
        } else {
            // 손을 떼면 초기화
            this.origDragPoint = null;
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth, 
    height: window.innerHeight,
    backgroundColor: '#87CEEB', // 하늘색 배경
    scale: {
        mode: Phaser.Scale.RESIZE, 
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MainScene]
};

const game = new Phaser.Game(config);
