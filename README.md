# Lumina's Quest

A 2D side-scrolling stealth game where you play as Lumina, a brave firefly on a mission to rescue friends from the evil shadow lord.

## Game Concept

You are a firefly that emits light, navigating through dark levels filled with shadow enemies. The challenge: your light makes you visible to enemies, so you must strategically hide behind obstacles and toggle your light to avoid detection. There is no combat - stealth and strategy are your only tools!

## How to Play

### Controls
- **← → Arrow Keys**: Move left and right
- **Spacebar**: Toggle light (Hide/Show)

### Objective
Navigate through each level to reach the glowing green goal while avoiding detection by shadow enemies.

### Mechanics
- **Light Emission**: Your firefly emits light that can be seen by shadows
- **Stealth**: Press spacebar to turn off your light and become less visible
- **Hiding**: Use obstacles (gray blocks with X pattern) to block line of sight from enemies
- **Detection**: If a shadow sees your light, you'll be caught and must restart the level
- **Platforms**: Jump between platforms to navigate the level
- **Enemies**: Shadows patrol with red glowing eyes - they can detect your light within their range

### Game Features
- ✅ 2D side-scroller stealth gameplay
- ✅ Firefly player with dynamic light emission
- ✅ Spacebar toggle to hide/show light
- ✅ Shadow enemies with vision detection
- ✅ Obstacles that block line of sight
- ✅ Multiple levels with increasing difficulty
- ✅ Level progression system
- ✅ No HUD/UI (clean minimalist design)
- ✅ No combat mechanics (pure stealth)

## Running the Game

1. Clone this repository
2. Open `index.html` in a modern web browser, or
3. Run a local server:
   ```bash
   python3 -m http.server 8000
   ```
   Then navigate to `http://localhost:8000`

## Game Structure

### Files
- `index.html` - Main game page with canvas and UI screens
- `styles.css` - Game styling and screen layouts
- `game.js` - Complete game logic including:
  - Player mechanics (movement, light toggle, physics)
  - Shadow AI (patrol, detection, line-of-sight)
  - Obstacle system (hiding spots)
  - Level system (3 levels included)
  - Collision detection
  - Game state management

### Levels
1. **Tutorial - Learning to Hide**: Introduction to basic mechanics
2. **The Narrow Path**: More platforms and multiple shadows
3. **Shadow Maze**: Complex layout with multiple patrolling enemies

## Technical Details

- Built with HTML5 Canvas
- Vanilla JavaScript (no frameworks)
- Object-oriented game architecture
- Real-time collision detection
- Line-of-sight algorithm for enemy vision
- Radial gradient lighting effects

## Future Enhancements (Planned)

The following abilities and features can be added in future levels:
- Longer hide duration ability
- Faster movement speed
- Light intensity control
- Temporary invisiblity/dash ability
- More complex level designs
- Particle effects
- Sound effects and music
- Additional enemy types
- Save/load progress

## Development

This is a minimal, focused implementation of the core stealth mechanics. The codebase is designed to be easily extensible for adding new abilities, levels, and game elements.

## License

This project is open source and available for educational purposes.
