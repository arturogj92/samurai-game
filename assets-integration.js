// Enhanced Assets Integration
// This file integrates the new tileset, dungeon objects and GUI assets with the game

// Override the drawBackground function to use tilesets + decorations
const originalDrawBackground = typeof drawBackground === 'function' ? drawBackground : null;

// New enhanced background drawing function
window.drawBackground = function() {
    // Try to draw tileset background first
    if (typeof drawTilesetBackground === 'function' && TILESET && TILESET.loaded) {
        drawTilesetBackground(ctx, camera);
    } else if (originalDrawBackground) {
        // Fallback to original grid if tilesets not loaded
        originalDrawBackground();
    } else {
        // Last resort: simple dark background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(camera.x, camera.y, camera.width, camera.height);
    }

    // Draw dungeon decorations (torches, chests, barrels, etc.) AFTER floor
    if (typeof drawDungeonDecorations === 'function' && DUNGEON_OBJECTS && DUNGEON_OBJECTS.loaded) {
        drawDungeonDecorations(ctx, camera);
    }

    // Always draw world border
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, WORLD.width, WORLD.height);
};

// Hook into game loop to update animated assets
if (typeof window.originalGameLoop === 'undefined') {
    // Store original gameLoop if it exists
    if (typeof gameLoop !== 'undefined') {
        window.originalGameLoop = gameLoop;
    }
}

// Enhanced ninja draw function to use GUI health bars
if (typeof Ninja !== 'undefined') {
    const originalNinjaDraw = Ninja.prototype.draw;

    Ninja.prototype.draw = function() {
        // Draw dash trail with sprite
        if (this.isDashing && this.dashTrail && this.dashTrail.length > 1) {
            for (let i = 0; i < this.dashTrail.length - 1; i++) {
                const trail = this.dashTrail[i];
                const alpha = (i / this.dashTrail.length) * 0.4;

                ctx.globalAlpha = alpha;
                const trailSprite = this.sprites.run;
                if (trailSprite && trailSprite.loaded) {
                    trailSprite.draw(ctx, trail.x, trail.y, this.spriteScale * 0.8, !this.facingRight);
                }
            }
            ctx.globalAlpha = 1.0;
        }

        // Shield is now only visible through the protect sprite animation and glow effect
        if (this.shielded) {
            const pulseSize = Math.sin(Date.now() / 100) * 5;
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 15 + pulseSize, 0, Math.PI * 2);
            ctx.stroke();

            // Inner shield circle
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 10 + pulseSize, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw samurai sprite using player's OWN sprites
        const currentSprite = this.sprites[this.animationState];
        if (currentSprite && currentSprite.loaded) {
            // Glow effect when shielded
            if (this.shielded) {
                ctx.save();
                ctx.shadowColor = 'rgba(0, 255, 255, 1)';
                ctx.shadowBlur = 20;
                currentSprite.draw(ctx, this.x, this.y, this.spriteScale, !this.facingRight);
                ctx.restore();
            }
            // Flashing effect when invulnerable
            else if (this.isInvulnerable) {
                const flashSpeed = 100; // Flash every 100ms
                const shouldShow = Math.floor(Date.now() / flashSpeed) % 2 === 0;
                if (shouldShow) {
                    ctx.globalAlpha = 0.5;
                    currentSprite.draw(ctx, this.x, this.y, this.spriteScale, !this.facingRight);
                    ctx.globalAlpha = 1.0;
                } else {
                    currentSprite.draw(ctx, this.x, this.y, this.spriteScale, !this.facingRight);
                }
            } else {
                currentSprite.draw(ctx, this.x, this.y, this.spriteScale, !this.facingRight);
            }
        } else {
            // Fallback: draw simple circle if sprite not loaded
            ctx.fillStyle = this.shielded ? '#0ff' : '#000';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw health bar above character using GUI sprites
        const barWidth = 60;
        const barHeight = 10;
        const barX = this.x - barWidth / 2;
        const barY = this.y - 70; // Position above the sprite

        // Try to use GUI health bar first
        const usedGUIBar = drawGUIHealthBar && drawGUIHealthBar(ctx, barX, barY, this.health, this.maxHealth, barWidth, barHeight);

        // Fallback to enhanced health bar if GUI not available
        if (!usedGUIBar) {
            const healthPercentage = this.health / this.maxHealth;
            const fillWidth = barWidth * healthPercentage;
            const cornerRadius = 4;

            ctx.save();

            // Outer glow effect
            ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
            ctx.shadowBlur = 8;

            // Background (dark with rounded corners)
            ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
            ctx.beginPath();
            ctx.roundRect(barX, barY, barWidth, barHeight, cornerRadius);
            ctx.fill();

            ctx.shadowBlur = 0; // Reset shadow for inner elements

            // Inner dark border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barWidth, barHeight, cornerRadius);
            ctx.stroke();

            // Health fill with gradient (red gradient from bright to dark)
            if (fillWidth > 0) {
                const gradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
                gradient.addColorStop(0, '#ff4444'); // Bright red top
                gradient.addColorStop(0.5, '#ff0000'); // Pure red middle
                gradient.addColorStop(1, '#cc0000'); // Dark red bottom

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(barX + 1, barY + 1, fillWidth - 2, barHeight - 2, cornerRadius - 1);
                ctx.fill();

                // Glossy highlight on top
                const highlightGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight / 2);
                highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.fillStyle = highlightGradient;
                ctx.beginPath();
                ctx.roundRect(barX + 1, barY + 1, fillWidth - 2, barHeight / 2, cornerRadius - 1);
                ctx.fill();
            }

            // Outer highlight border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(barX + 0.5, barY + 0.5, barWidth - 1, barHeight - 1, cornerRadius);
            ctx.stroke();

            ctx.restore();
        }

        // Debug: Draw hitbox (optional, can be removed)
        if (false) { // Set to true to see hitbox
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.stroke();
        }
    };
}

// Call updateDungeonAssets in the game loop if available
// This will be called by the game's update cycle
if (typeof window.addEventListener !== 'undefined') {
    let lastUpdateTime = 0;

    // Set up a periodic update for animated assets
    setInterval(() => {
        const now = performance.now();
        const deltaTime = now - lastUpdateTime;
        lastUpdateTime = now;

        if (typeof updateDungeonAssets === 'function') {
            updateDungeonAssets(deltaTime);
        }
    }, 16); // ~60 FPS
}

console.log('✓ Enhanced assets integration loaded');
console.log('  - Uniform tileset with 90% consistency');
console.log('  - Dungeon decorations (torches, chests, barrels, skeletons)');
console.log('  - Animated fire effects on torches');
console.log('  - Enhanced GUI sprites');
