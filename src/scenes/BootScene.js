import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load screen
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Load all game assets
        this.loadPlayerAssets();
        this.loadEnemyAssets();
        // this.loadVendorAssets(); // Commented out - asset not used
        this.loadOtherAssets();
    }

    loadPlayerAssets() {
        // Knights Archer (Player) - Full spritesheet 1536x1344, frame 192x192
        // Row 0: Idle, Row 1: Walk, Row 2: Attack, Row 3: Hurt, Row 4: Death
        this.load.spritesheet('player-archer', 'assets/Factions/Knights/Troops/Archer/Blue/Archer_Blue.png', {
            frameWidth: 192,
            frameHeight: 192
        });
    }

    loadEnemyAssets() {
        // Goblin Torch (Enemy) - Full spritesheet 1344x960, frame 192x192
        // Row 0: Idle, Row 1: Walk, Row 2: Attack, Row 3: Hurt, Row 4: Death
        this.load.spritesheet('goblin-torch', 'assets/Factions/Goblins/Troops/Torch/Red/Torch_Red.png', {
            frameWidth: 192,
            frameHeight: 192
        });
    }

    loadVendorAssets() {
        this.load.spritesheet('vendor-idle', 'assets/Samurai_Commander/Idle.png', {
            frameWidth: 128,
            frameHeight: 128
        });
    }

    loadOtherAssets() {
        // Custom arrow sprite - thin arrow optimized for hitbox precision
        // Dimensions: 63x14 pixels, arrow tip at pixel (63, 7)
        this.load.spritesheet('arrow', 'assets/Factions/Knights/Troops/Archer/Arrow/Arrow_shot.png', {
            frameWidth: 63,
            frameHeight: 14
        });

        // Arrow when stuck/hit
        this.load.image('arrow-hit', 'assets/Factions/Knights/Troops/Archer/Arrow/Arrow_hit.png');

        // Bamboo (if you have a sprite)
        // this.load.image('bamboo', 'assets/bamboo.png');
    }

    create() {
        console.log('✅ BootScene: All assets loaded');
        // Start the main game scene
        this.scene.start('MainScene');
        // Start UI scene in parallel
        this.scene.launch('UIScene');
    }
}
