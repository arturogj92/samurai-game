import Phaser from 'phaser';
import BootScene from '../scenes/BootScene';
import MainScene from '../scenes/MainScene';
import UIScene from '../scenes/UIScene';

export const GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Top-down game, no gravity
            debug: false // Debug mode disabled
        }
    },
    scene: [BootScene, MainScene, UIScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        pixelArt: true, // For crisp pixel art
        antialias: false
    }
};

// World dimensions (much larger than viewport)
export const WORLD = {
    width: 3200,
    height: 2400
};

// Game Constants
export const CONSTANTS = {
    SHOOTING_RANGE: 350,
    MAX_SHURIKENS: 80,
    SHURIKEN_COOLDOWN: 500,
    ENEMY_SPAWN_RATE: 1000
};
