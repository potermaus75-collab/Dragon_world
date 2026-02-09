// === MainScene: 실제 게임이 진행되는 장면 ===
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        // 아이소메트릭 설정 값
        this.tileWidthHalf = 64;  // 타일 가로 절반 크기 (예: 타일 원본이 128x64일 경우)
        this.tileHeightHalf = 32; // 타일 세로 절반 크기
        this.gridSize = 10;       // 10x10 그리드
    }

    preload() {
        // 테스트용 타일 이미지 로드 (실제 프로젝트에선 assets 폴더의 이미지를 사용하세요)
        // 이 URL은 예시용 Placeholder 이미지입니다.
        this.load.image('tile', 'https://labs.phaser.io/assets/skies/sky2.png'); 
        // 실제로는 이런 마름모꼴 이미지가 필요합니다: assets/images/iso-tile.png
    }

    create() {
        console.log("MainScene 시작");
        
        // 카메라 중앙 정렬
        this.cameras.main.centerOn(0, 0);

        // 아이소메트릭 그리드 그리기
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                // 2D 그리드 좌표(x, y)를 아이소메트릭 화면 좌표(isoX, isoY)로 변환
                // 이것이 드래곤베일 스타일의 핵심 공식입니다.
                let isoX = (x - y) * this.tileWidthHalf;
                let isoY = (x + y) * this.tileHeightHalf;

                // 타일 배치 (임시로 placeholder 이미지 사용)
                let tile = this.add.image(isoX, isoY, 'tile');
                // 깊이 정렬 (뒤에 있는 타일이 먼저 그려지도록)
                tile.setDepth(isoY);
                
                // 테스트를 위해 이미지를 작게 줄이고 틴트 적용
                tile.setScale(0.1).setTint(0x00ff00); 
            }
        }

        // 중앙에 기준점 표시
        this.add.circle(0, 0, 10, 0xff0000).setDepth(9999);
    }

    update() {
        // 게임 루프 (프레임마다 실행)
        // 드래곤 이동, 돈 생산 로직 등이 여기에 들어갑니다.
    }
}

// === 게임 설정 객체 ===
const config = {
    type: Phaser.AUTO, // WebGL 또는 Canvas 자동 선택
    width: 1280,       // 기본 해상도 너비
    height: 720,       // 기본 해상도 높이
    parent: 'game-container', // 캔버스가 삽입될 HTML 요소 ID
    backgroundColor: '#2d2d2d',
    scale: {
        // 모바일 화면에 맞춰 자동으로 늘리고 비율 유지
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // 가로 모드 강제 설정 (브라우저 레벨)
        orientation: Phaser.Scale.Orientation.LANDSCAPE
    },
    // 사용할 장면(Scene) 목록
    scene: [MainScene]
};

// 게임 인스턴스 생성
const game = new Phaser.Game(config);
