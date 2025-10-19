import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        console.log('✅ UIScene: UI Scene started');

        // Get reference to MainScene
        this.mainScene = this.scene.get('MainScene');

        // Create UI elements
        this.createHealthBar();
        this.createResourceDisplay();
        this.createWaveDisplay();
        this.createAbilityCooldowns();

        // FPS display
        this.fpsText = this.add.text(10, 10, 'FPS: 60', {
            font: '16px monospace',
            fill: '#00ff00'
        }).setScrollFactor(0).setDepth(1000);
    }

    createHealthBar() {
        const x = 20;
        const y = 50;
        const width = 200;
        const height = 20;

        // Background
        this.healthBarBg = this.add.rectangle(x, y, width, height, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1000);

        // Health fill
        this.healthBarFill = this.add.rectangle(x + 2, y + 2, width - 4, height - 4, 0xff0000)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(1000);

        // Health text
        this.healthText = this.add.text(x + width / 2, y + height / 2, '100 / 100', {
            font: '14px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1001);
    }

    createResourceDisplay() {
        const x = 20;
        const y = 90;

        this.resourcesText = this.add.text(x, y, '', {
            font: '16px monospace',
            fill: '#ffffff'
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(1000);
    }

    createWaveDisplay() {
        const x = this.cameras.main.width - 20;
        const y = 20;

        this.waveText = this.add.text(x, y, 'Wave: 1', {
            font: '24px monospace',
            fill: '#ffff00'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);

        this.scoreText = this.add.text(x, y + 30, 'Score: 0', {
            font: '18px monospace',
            fill: '#ffffff'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);
    }

    createAbilityCooldowns() {
        // Placeholder for ability cooldown UI
        // Will implement with ability icons and cooldown overlays
        this.abilitiesText = this.add.text(20, 130, 'Q: Dash | E: Burst | R: Shield | X: Lightning', {
            font: '14px monospace',
            fill: '#00ffff'
        }).setScrollFactor(0).setDepth(1000);
    }

    update() {
        // Update FPS
        this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);

        // Update health bar
        if (this.mainScene && this.mainScene.player) {
            const healthPercent = this.mainScene.player.health / this.mainScene.player.maxHealth;
            this.healthBarFill.width = (198 * healthPercent); // 200 - 4 for padding
            this.healthText.setText(`${Math.ceil(this.mainScene.player.health)} / ${this.mainScene.player.maxHealth}`);
        }

        // Update resources
        if (this.mainScene && this.mainScene.gameState) {
            const res = this.mainScene.gameState.resources;
            this.resourcesText.setText(
                `🪵 Wood: ${res.wood}  💰 Gold: ${res.gold}  🌱 Seeds: ${res.bambooSeeds}`
            );
        }

        // Update wave/score
        if (this.mainScene && this.mainScene.gameState) {
            this.waveText.setText(`Wave: ${this.mainScene.gameState.wave}`);
            this.scoreText.setText(`Score: ${this.mainScene.gameState.score}`);
        }
    }
}
