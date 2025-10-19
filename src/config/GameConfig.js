/**
 * Game Configuration
 * All global game state and constants
 */

// World dimensions (much larger than canvas)
export const WORLD = {
    width: 3200,
    height: 2400
};

// Game State - Central state management
export const GAME_STATE = {
    playing: true,
    score: 0,
    wave: 1,
    enemiesKilled: 0,
    isWaveBreak: false,
    waveBreakEndTime: 0,

    // Wave system
    enemiesThisWave: 0,      // Enemigos que quedan por matar en esta wave
    totalEnemiesThisWave: 10, // Total de enemigos para esta wave

    // Recursos persistentes
    resources: {
        bambooSeeds: 5,  // Semillas de bambú - Start with 5
        wood: 0,         // Madera
        gold: 0          // Oro - Only obtainable by selling wood to vendor
    },

    // Modos de herramienta
    axeMode: false,
    axeModeStartTime: 0,

    // Shop
    shopOpen: false,
    purchasesThisWave: 0
};

// Game Constants
export const SHOOTING_RANGE = 350; // pixels - character only shoots enemies within this distance
export const MAX_SHURIKENS = 80; // Maximum number of shurikens allowed to prevent lag
export const SHURIKEN_COOLDOWN = 500; // ms between shurikens
export const ENEMY_SPAWN_RATE = 1000; // ms between enemy spawns

// Camera configuration
export const camera = {
    x: 0,
    y: 0,
    follow(target) {
        const canvas = document.getElementById('gameCanvas');
        this.x = target.x - canvas.width / 2;
        this.y = target.y - canvas.height / 2;

        // Keep camera within world bounds
        this.x = Math.max(0, Math.min(WORLD.width - canvas.width, this.x));
        this.y = Math.max(0, Math.min(WORLD.height - canvas.height, this.y));
    }
};

// Distance helper function
export function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
