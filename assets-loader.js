// Enhanced Tileset and GUI Assets Loader
// This file handles loading and rendering of dungeon tilesets, objects and GUI elements

// Tileset configuration
const TILESET = {
    tiles: {},
    tileSize: 16, // Standard pixel art tile size
    scale: 3, // Scale up tiles for better visibility
    loaded: false,
    loadedCount: 0,
    totalToLoad: 0
};

// Dungeon objects configuration
const DUNGEON_OBJECTS = {
    static: {},
    animated: {},
    loaded: false,
    loadedCount: 0,
    totalToLoad: 0
};

// GUI Assets configuration
const GUI_ASSETS = {
    bars: {},
    icons: {},
    panels: {},
    buttons: {},
    loaded: false,
    loadedCount: 0,
    totalToLoad: 0
};

// Tile pattern for procedural generation
const TILE_PATTERN = [];

// Dungeon decorations spawned in the world
const DUNGEON_DECORATIONS = [];

// Animated objects (torches, fires)
const ANIMATED_OBJECTS = [];

// Helper function to check if an image is safely drawable
function isImageSafeToRender(img) {
    if (!img) return false;
    if (!img.complete) return false;
    // Check if image has valid dimensions (broken images have naturalWidth/Height of 0)
    if (img.naturalWidth === 0 || img.naturalHeight === 0) return false;
    return true;
}

// Initialize tileset - using ONLY 2 floor tiles for uniformity
function initTileset() {
    // Use only 2 similar floor tiles for a much more uniform look
    const floorTiles = [
        'Tile_03', 'Tile_04' // Only 2 tiles for maximum uniformity
    ];

    TILESET.totalToLoad = floorTiles.length;

    floorTiles.forEach((tileName, index) => {
        const img = new Image();
        img.onload = () => {
            TILESET.loadedCount++;
            if (TILESET.loadedCount === TILESET.totalToLoad) {
                TILESET.loaded = true;
                generateUniformTilePattern();
                console.log('✓ Uniform tileset loaded successfully');
            }
        };
        img.onerror = () => {
            console.error(`Failed to load tile: ${tileName}`);
            TILESET.loadedCount++;
        };
        img.src = `assets/2 Dungeon Tileset/1 Tiles/${tileName}.png`;
        TILESET.tiles[tileName] = img;
    });
}

// Generate a UNIFORM tile pattern with minimal variation
function generateUniformTilePattern() {
    // Calculate how many tiles we need
    const tilesX = Math.ceil(WORLD.width / (TILESET.tileSize * TILESET.scale));
    const tilesY = Math.ceil(WORLD.height / (TILESET.tileSize * TILESET.scale));

    const tileNames = Object.keys(TILESET.tiles);

    // Generate mostly uniform pattern with only occasional variation
    for (let y = 0; y < tilesY; y++) {
        TILE_PATTERN[y] = [];
        for (let x = 0; x < tilesX; x++) {
            // 90% use first tile, 10% use second tile for subtle variation
            const useVariation = Math.random() < 0.1;
            TILE_PATTERN[y][x] = useVariation && tileNames[1] ? tileNames[1] : tileNames[0];
        }
    }

    // Generate dungeon decorations after tiles are ready
    generateDungeonDecorations();
}

// Generate dungeon decorations (chests, barrels, torches, etc.)
function generateDungeonDecorations() {
    // Place decorations sparsely throughout the world
    const decorationDensity = 0.0008; // Very sparse
    const numDecorations = Math.floor(WORLD.width * WORLD.height * decorationDensity);

    for (let i = 0; i < numDecorations; i++) {
        const x = Math.random() * WORLD.width;
        const y = Math.random() * WORLD.height;

        // Randomly choose decoration type
        const rand = Math.random();
        let decorationType;

        if (rand < 0.4) {
            decorationType = 'torch'; // 40% torches
        } else if (rand < 0.6) {
            decorationType = 'chest'; // 20% chests
        } else if (rand < 0.75) {
            decorationType = 'barrel'; // 15% barrels
        } else {
            decorationType = 'skeleton'; // 25% skulls/bones
        }

        DUNGEON_DECORATIONS.push({
            x: x,
            y: y,
            type: decorationType,
            scale: 2.5
        });
    }

    console.log(`✓ Generated ${DUNGEON_DECORATIONS.length} dungeon decorations`);
}

// Initialize dungeon objects
function initDungeonObjects() {
    const objectsToLoad = [
        // Static objects
        { type: 'static', name: 'chest', path: 'assets/2 Dungeon Tileset/3 Animated objects/Chest1_D.png' },
        { type: 'static', name: 'barrel', path: 'assets/2 Dungeon Tileset/2 Objects/Boxes/Box1.png' },
        { type: 'static', name: 'skeleton', path: 'assets/2 Dungeon Tileset/2 Objects/Other/Bone1.png' },
        // Animated objects
        { type: 'animated', name: 'fire', path: 'assets/2 Dungeon Tileset/3 Animated objects/Fire1.png', frames: 6, fps: 12 }
    ];

    DUNGEON_OBJECTS.totalToLoad = objectsToLoad.length;

    objectsToLoad.forEach(obj => {
        const img = new Image();
        img.onload = () => {
            DUNGEON_OBJECTS.loadedCount++;
            if (DUNGEON_OBJECTS.loadedCount === DUNGEON_OBJECTS.totalToLoad) {
                DUNGEON_OBJECTS.loaded = true;
                console.log('✓ Dungeon objects loaded successfully');
            }
        };
        img.onerror = () => {
            console.error(`Failed to load dungeon object: ${obj.name}`);
            DUNGEON_OBJECTS.loadedCount++;
        };
        img.src = obj.path;

        if (obj.type === 'static') {
            DUNGEON_OBJECTS.static[obj.name] = img;
        } else {
            DUNGEON_OBJECTS.animated[obj.name] = {
                image: img,
                frames: obj.frames || 1,
                fps: obj.fps || 10,
                currentFrame: 0,
                frameTimer: 0
            };
        }
    });
}

// Initialize GUI assets
function initGUIAssets() {
    const guiToLoad = [
        // Health bars
        ...['BarTile_01', 'BarTile_02', 'BarTile_03', 'BarTile_04', 'BarTile_05'].map(name => ({
            type: 'bars',
            name: name,
            path: `assets/4 GUI/4 Bars/${name}.png`
        })),
        // Icons
        ...['Icon_01', 'Icon_02', 'Icon_03', 'Icon_04', 'Icon_05', 'Icon_06', 'Icon_07', 'Icon_08'].map(name => ({
            type: 'icons',
            name: name,
            path: `assets/4 GUI/3 Icons/${name}.png`
        })),
        // Buttons
        ...['Button1', 'Button2', 'Button3'].map(name => ({
            type: 'buttons',
            name: name,
            path: `assets/4 GUI/2 Buttons/${name}.png`
        }))
    ];

    GUI_ASSETS.totalToLoad = guiToLoad.length;

    guiToLoad.forEach(item => {
        const img = new Image();
        img.onload = () => {
            GUI_ASSETS.loadedCount++;
            if (GUI_ASSETS.loadedCount === GUI_ASSETS.totalToLoad) {
                GUI_ASSETS.loaded = true;
                console.log('✓ Enhanced GUI assets loaded successfully');
            }
        };
        img.onerror = () => {
            console.error(`Failed to load GUI asset: ${item.name}`);
            GUI_ASSETS.loadedCount++;
        };
        img.src = item.path;
        GUI_ASSETS[item.type][item.name] = img;
    });
}

// Update animated objects
function updateAnimatedObjects(deltaTime) {
    // Update fire animation
    const fire = DUNGEON_OBJECTS.animated['fire'];
    if (fire && isImageSafeToRender(fire.image)) {
        fire.frameTimer += deltaTime;
        const frameDelay = 1000 / fire.fps;

        if (fire.frameTimer >= frameDelay) {
            fire.currentFrame = (fire.currentFrame + 1) % fire.frames;
            fire.frameTimer = 0;
        }
    }
}

// Draw tileset background (uniform floor)
function drawTilesetBackground(ctx, camera) {
    if (!TILESET.loaded || TILE_PATTERN.length === 0) {
        return;
    }

    const scaledTileSize = TILESET.tileSize * TILESET.scale;

    // Calculate visible tile range
    const startTileX = Math.floor(camera.x / scaledTileSize);
    const startTileY = Math.floor(camera.y / scaledTileSize);
    const endTileX = Math.ceil((camera.x + camera.width) / scaledTileSize);
    const endTileY = Math.ceil((camera.y + camera.height) / scaledTileSize);

    // Draw only visible tiles
    for (let tileY = startTileY; tileY < endTileY; tileY++) {
        if (!TILE_PATTERN[tileY]) continue;

        for (let tileX = startTileX; tileX < endTileX; tileX++) {
            const tileName = TILE_PATTERN[tileY][tileX];
            if (!tileName) continue;

            const tile = TILESET.tiles[tileName];
            if (!isImageSafeToRender(tile)) continue;

            const drawX = tileX * scaledTileSize;
            const drawY = tileY * scaledTileSize;

            ctx.drawImage(
                tile,
                drawX,
                drawY,
                scaledTileSize,
                scaledTileSize
            );
        }
    }
}

// Draw dungeon decorations
function drawDungeonDecorations(ctx, camera) {
    if (!DUNGEON_OBJECTS.loaded) return;

    for (const decoration of DUNGEON_DECORATIONS) {
        // Check if decoration is visible in camera
        const margin = 100;
        if (decoration.x < camera.x - margin || decoration.x > camera.x + camera.width + margin ||
            decoration.y < camera.y - margin || decoration.y > camera.y + camera.height + margin) {
            continue;
        }

        if (decoration.type === 'torch') {
            // Draw torch with animated fire on top
            const fire = DUNGEON_OBJECTS.animated['fire'];
            if (fire && isImageSafeToRender(fire.image)) {
                const frameWidth = fire.image.width / fire.frames;
                const frameHeight = fire.image.height;
                const scale = decoration.scale;

                ctx.drawImage(
                    fire.image,
                    fire.currentFrame * frameWidth, 0, // Source x, y
                    frameWidth, frameHeight, // Source width, height
                    decoration.x - (frameWidth * scale) / 2,
                    decoration.y - (frameHeight * scale) / 2,
                    frameWidth * scale,
                    frameHeight * scale
                );

                // Add glow effect for torches
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#FFA500';
                ctx.beginPath();
                ctx.arc(decoration.x, decoration.y, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        } else {
            // Draw static objects
            const obj = DUNGEON_OBJECTS.static[decoration.type];
            if (isImageSafeToRender(obj)) {
                const scale = decoration.scale;
                ctx.drawImage(
                    obj,
                    decoration.x - (obj.width * scale) / 2,
                    decoration.y - (obj.height * scale) / 2,
                    obj.width * scale,
                    obj.height * scale
                );
            }
        }
    }
}

// Draw GUI health bar using sprites
function drawGUIHealthBar(ctx, x, y, currentHealth, maxHealth, width, height) {
    if (!GUI_ASSETS.loaded) {
        return false;
    }

    const healthPercentage = currentHealth / maxHealth;

    // Draw background bar
    const bgBar = GUI_ASSETS.bars['BarTile_01'];
    if (isImageSafeToRender(bgBar)) {
        ctx.drawImage(bgBar, x, y, width, height);
    }

    // Draw health fill
    const fillBar = GUI_ASSETS.bars['BarTile_03'];
    if (isImageSafeToRender(fillBar) && healthPercentage > 0) {
        const fillWidth = width * healthPercentage;
        const sourceWidth = fillBar.width * healthPercentage;
        ctx.drawImage(
            fillBar,
            0, 0,
            sourceWidth, fillBar.height,
            x, y,
            fillWidth, height
        );
    }

    return true;
}

// Initialize all assets
function initAllAssets() {
    console.log('🎨 Loading enhanced dungeon assets...');
    initTileset();
    initDungeonObjects();
    initGUIAssets();
}

// Call initialization when script loads
if (typeof WORLD !== 'undefined') {
    initAllAssets();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initAllAssets, 100);
    });
}

// Export update function for game loop
window.updateDungeonAssets = function(deltaTime) {
    updateAnimatedObjects(deltaTime);
};

window.drawDungeonDecorations = drawDungeonDecorations;
