import Enemy from '../entities/Enemy';
import { WORLD } from '../config/PhaserConfig';

/**
 * EnemySpawnSystem
 * Handles spawning of enemies around the player
 */
export default class EnemySpawnSystem {
    constructor(scene) {
        this.scene = scene;
        this.lastSpawnTime = 0;
        this.spawnRate = 1000; // ms between spawns
        this.spawnDistance = 600; // pixels away from player
        this.maxEnemies = 10; // max concurrent enemies
        this.enabled = true;
        this.enemyTypes = ['goblin', 'lancer']; // Multiple enemy types
    }

    update(time) {
        if (!this.enabled) return;

        // Check if at max capacity
        const aliveEnemies = this.getAliveEnemyCount();
        if (aliveEnemies >= this.maxEnemies) return;

        // Check spawn cooldown
        if (time - this.lastSpawnTime < this.spawnRate) return;

        this.lastSpawnTime = time;
        this.spawnEnemy();
    }

    spawnEnemy() {
        const position = this.getSpawnPosition();
        const enemyType = this.getRandomEnemyType();

        const enemy = new Enemy(this.scene, position.x, position.y, enemyType);
        this.scene.enemies.add(enemy);
    }

    getSpawnPosition() {
        const player = this.scene.player;

        // Random angle around player
        const angle = Math.random() * Math.PI * 2;

        // Position at spawn distance
        const spawnX = player.x + Math.cos(angle) * this.spawnDistance;
        const spawnY = player.y + Math.sin(angle) * this.spawnDistance;

        // Clamp to world bounds with padding
        const x = Phaser.Math.Clamp(spawnX, 50, WORLD.width - 50);
        const y = Phaser.Math.Clamp(spawnY, 50, WORLD.height - 50);

        return { x, y };
    }

    getRandomEnemyType() {
        return this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
    }

    getAliveEnemyCount() {
        return this.scene.enemies.getChildren()
            .filter(e => !e.isDying && e.active)
            .length;
    }

    setSpawnRate(rate) {
        this.spawnRate = rate;
    }

    setMaxEnemies(max) {
        this.maxEnemies = max;
    }

    setSpawnDistance(distance) {
        this.spawnDistance = distance;
    }

    addEnemyType(type) {
        if (!this.enemyTypes.includes(type)) {
            this.enemyTypes.push(type);
        }
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}
