import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        console.log('✅ UIScene: UI Scene started');

        // Get reference to MainScene
        this.mainScene = this.scene.get('MainScene');

        // FPS display
        this.fpsText = this.add.text(10, 10, 'FPS: 60', {
            font: '16px monospace',
            fill: '#00ff00'
        }).setScrollFactor(0).setDepth(1000);
    }

    update() {
        // Update FPS
        this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
    }
}
