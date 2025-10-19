import { WORLD } from '../config/PhaserConfig';

/**
 * TilemapManager - Manages the game's terrain tilemap system
 * Supports multiple terrain types, elevations, and obstacles
 */
export default class TilemapManager {
    constructor(scene) {
        this.scene = scene;
        this.tileSize = 64; // Each tile is 64x64 pixels

        // Calculate how many tiles we need to cover the world
        this.mapWidth = Math.ceil(WORLD.width / this.tileSize);
        this.mapHeight = Math.ceil(WORLD.height / this.tileSize);

        // Tile indices from the tileset (based on 640x256 = 10x4 grid of 64x64 tiles)
        // Frame 11 = TileX: 1, TileY: 1 - Pure green grass without borders
        this.TILES = {
            GRASS_GREEN: 11,     // Frame 11 - Pure green grass (no borders)
            // Border tiles (frame 0 has borders, etc.)
            // Future tiles can be added here:
            // GRASS_BORDER_TOP: 0,
            // GRASS_BORDER_LEFT: 1,
            // ELEVATION: 20,
            // etc.
        };

        this.tilemap = null;
        this.layer = null;
    }

    /**
     * Create the tilemap and fill it with green grass
     */
    create() {
        console.log(`🗺️  Creating tilemap: ${this.mapWidth}x${this.mapHeight} tiles (${this.tileSize}x${this.tileSize}px each)`);

        // Create blank tilemap
        this.tilemap = this.scene.make.tilemap({
            tileWidth: this.tileSize,
            tileHeight: this.tileSize,
            width: this.mapWidth,
            height: this.mapHeight
        });

        // Add the tileset image (loaded in BootScene as spritesheet)
        const tileset = this.tilemap.addTilesetImage('tilemap-flat', 'tilemap-flat', this.tileSize, this.tileSize, 0, 0);

        // Create the base terrain layer
        this.layer = this.tilemap.createBlankLayer('terrain', tileset, 0, 0);

        // Fill entire map with green grass tiles
        this.fillWithGrass();

        // Set layer depth to be behind everything else
        this.layer.setDepth(-1000);

        console.log('✅ Tilemap created successfully');
    }

    /**
     * Fill the entire map with green grass tiles
     */
    fillWithGrass() {
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                this.layer.putTileAt(this.TILES.GRASS_GREEN, x, y);
            }
        }
    }

    /**
     * Set a specific tile at world coordinates
     * @param {number} worldX - X coordinate in world space
     * @param {number} worldY - Y coordinate in world space
     * @param {number} tileIndex - The tile frame index to place
     */
    setTileAtWorldXY(worldX, worldY, tileIndex) {
        const tileX = Math.floor(worldX / this.tileSize);
        const tileY = Math.floor(worldY / this.tileSize);
        this.layer.putTileAt(tileIndex, tileX, tileY);
    }

    /**
     * Get tile at world coordinates
     * @param {number} worldX - X coordinate in world space
     * @param {number} worldY - Y coordinate in world space
     * @returns {Phaser.Tilemaps.Tile|null}
     */
    getTileAtWorldXY(worldX, worldY) {
        return this.layer.getTileAtWorldXY(worldX, worldY);
    }

    /**
     * Future: Add elevation/height variation
     * @param {number} x - Tile X
     * @param {number} y - Tile Y
     * @param {number} elevationTile - The elevated tile index
     */
    addElevation(x, y, elevationTile) {
        // TODO: Implement when you have elevation tiles in the tileset
        this.layer.putTileAt(elevationTile, x, y);
    }

    /**
     * Future: Add obstacles
     * @param {number} worldX - X in world space
     * @param {number} worldY - Y in world space
     * @param {number} obstacleTile - The obstacle tile index
     */
    addObstacle(worldX, worldY, obstacleTile) {
        // TODO: Implement obstacle placement
        this.setTileAtWorldXY(worldX, worldY, obstacleTile);
    }
}
