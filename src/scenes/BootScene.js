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

        // Error handler for failed assets
        this.load.on('loaderror', (file) => {
            console.error('❌ Failed to load asset:', {
                key: file.key,
                url: file.url,
                type: file.type,
                src: file.src
            });
        });

        // Load all game assets
        this.loadPlayerAssets();
        this.loadEnemyAssets();
        // this.loadVendorAssets(); // Commented out - asset not used
        this.loadOtherAssets();
        this.loadSkillAssets();
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

        // Death skull sprite - Top row only (bouncing skull animation)
        // Spritesheet is 896x256 = 7 frames x 2 rows, each frame is 128x128
        console.log('🔵 Loading death-skull sprite sheet');
        this.load.spritesheet('death-skull', 'assets/Factions/Knights/Troops/Dead/Dead.png', {
            frameWidth: 128,
            frameHeight: 128
        });

        this.load.on('filecomplete-spritesheet-death-skull', () => {
            console.log('✅ death-skull sprite sheet loaded successfully');
        });

        // Goblin Hut - 7 damage states (full health to destroyed)
        for (let i = 1; i <= 7; i++) {
            this.load.image(`goblin-house-${i}`, `assets/Factions/Goblins/Buildings/Wood_House/Goblin_House_${i}.png`);
        }

        // Lancer (Enemy) - 256x256 frames
        // Idle: 1792x256 = 7 frames
        // Run: 1536x256 = 6 frames
        // Attack: 2048x256 = 8 frames
        console.log('🔵 Loading Lancer enemy spritesheets...');
        this.load.spritesheet('lancer-idle', 'assets/Enemy Pack/Lancer/Lancer_Idle.png', {
            frameWidth: 256,
            frameHeight: 256
        });
        this.load.spritesheet('lancer-run', 'assets/Enemy Pack/Lancer/Lancer_Run.png', {
            frameWidth: 256,
            frameHeight: 256
        });
        this.load.spritesheet('lancer-attack', 'assets/Enemy Pack/Lancer/Lancer_Attack.png', {
            frameWidth: 256,
            frameHeight: 256
        });

        this.load.on('filecomplete-spritesheet-lancer-idle', () => {
            console.log('✅ lancer-idle spritesheet loaded');
        });
        this.load.on('filecomplete-spritesheet-lancer-run', () => {
            console.log('✅ lancer-run spritesheet loaded');
        });
        this.load.on('filecomplete-spritesheet-lancer-attack', () => {
            console.log('✅ lancer-attack spritesheet loaded');
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

        // Terrain tilemap - Load as spritesheet with 64x64 tiles
        // Tileset is 640x256 = 10 columns x 4 rows of 64x64 tiles
        this.load.spritesheet('tilemap-flat', 'assets/Terrain/Ground/Tilemap_Flat.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        // Trees - animated terrain objects
        // Tree1: 1536x256, 8 frames of 120x200 with offset(40,45) and spacing(72,0)
        console.log('🌳 Loading tree spritesheets...');
        this.load.spritesheet('tree-1', 'assets/Terrain/Trees/Tree1.png', {
            frameWidth: 120,
            frameHeight: 200,
            startFrame: 0,
            endFrame: 7,
            margin: 40,     // Offset from edges (aproximado para X=40, Y=45)
            spacing: 72     // Space between frames horizontally
        });

        // Bushes - animated terrain decorations
        // All bushes: 1024x128 = 8 frames of 128x128 each (perfect squares)
        console.log('🌿 Loading bush spritesheets...');
        this.load.spritesheet('bush-1', 'assets/Terrain/Bushes/Bushe1.png', {
            frameWidth: 128,
            frameHeight: 128
        });
        this.load.spritesheet('bush-2', 'assets/Terrain/Bushes/Bushe2.png', {
            frameWidth: 128,
            frameHeight: 128
        });
        this.load.spritesheet('bush-3', 'assets/Terrain/Bushes/Bushe3.png', {
            frameWidth: 128,
            frameHeight: 128
        });
        this.load.spritesheet('bush-4', 'assets/Terrain/Bushes/Bushe4.png', {
            frameWidth: 128,
            frameHeight: 128
        });

        // Rocks - static terrain decorations (64x64 each)
        console.log('🪨 Loading rock images...');
        this.load.image('rock-1', 'assets/Terrain/Rocks/Rock1.png');
        this.load.image('rock-2', 'assets/Terrain/Rocks/Rock2.png');
        this.load.image('rock-3', 'assets/Terrain/Rocks/Rock3.png');
        this.load.image('rock-4', 'assets/Terrain/Rocks/Rock4.png');

        // Sheep - animated creatures
        // Sheep_Grass: 1536x128 = 12 frames (eating grass animation)
        // Sheep_Idle: 768x128 = 6 frames (standing idle)
        // Sheep_Move: 512x128 = 4 frames (walking)
        console.log('🐑 Loading sheep spritesheets...');
        this.load.spritesheet('sheep-grass', 'assets/Terrain/Sheep/Sheep_Grass.png', {
            frameWidth: 128,
            frameHeight: 128
        });
        this.load.spritesheet('sheep-idle', 'assets/Terrain/Sheep/Sheep_Idle.png', {
            frameWidth: 128,
            frameHeight: 128
        });
        this.load.spritesheet('sheep-move', 'assets/Terrain/Sheep/Sheep_Move.png', {
            frameWidth: 128,
            frameHeight: 128
        });

        // Verify tree loading
        this.load.on('filecomplete-spritesheet-tree-1', () => {
            console.log('✅ tree-1 spritesheet loaded');
        });
        this.load.on('filecomplete-spritesheet-tree-2', () => {
            console.log('✅ tree-2 spritesheet loaded');
        });
        this.load.on('filecomplete-spritesheet-tree-3', () => {
            console.log('✅ tree-3 spritesheet loaded');
        });
        this.load.on('filecomplete-spritesheet-tree-4', () => {
            console.log('✅ tree-4 spritesheet loaded');
        });

        // Bamboo (if you have a sprite)
        // this.load.image('bamboo', 'assets/bamboo.png');
    }

    loadSkillAssets() {
        // Ability icons
        this.load.image('skill-dash', 'assets/Skills/skill_dash.png');
        this.load.image('skill-burst', 'assets/Skills/skill_burst.png');
        this.load.image('skill-shield', 'assets/Skills/skill_shield.png');
        this.load.image('skill-lightning', 'assets/Skills/skill_lightning.png');
        this.load.image('skill-berserker', 'assets/Skills/skill_berserker.png');
        this.load.image('skill-summon-army', 'assets/Skills/skill_summon_army.png');

        // Gold coin sprites
        // G_Spawn: 896x128 = 7 frames of 128x128 (spawn animation)
        this.load.spritesheet('gold-spawn', 'assets/Resources/Resources/G_Spawn.png', {
            frameWidth: 128,
            frameHeight: 128
        });
        // G_Idle: 128x128 single frame (idle coin)
        this.load.image('gold-idle', 'assets/Resources/Resources/G_Idle.png');

        // UI Elements
        this.load.image('ui-button-blue', 'assets/UI/Buttons/Button_Blue.png');
        this.load.image('ui-ribbon-yellow', 'assets/UI/Ribbons/Ribbon_Yellow_3Slides.png');
    }

    create() {
        console.log('✅ BootScene: All assets loaded');
        // Start the main game scene
        this.scene.start('MainScene');
        // Start UI scene in parallel
        this.scene.launch('UIScene');
    }
}
