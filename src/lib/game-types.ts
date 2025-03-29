
// Game types definitions

export type Direction = "up" | "down" | "left" | "right";

export type GameStatus = "idle" | "playing" | "paused" | "game-over";

export type CellType = "empty" | "snake" | "food" | "special-food" | "obstacle";

export type PowerUpType = "speed-boost" | "score-multiplier" | "shield";

export type SoundType = "eat" | "gameOver" | "powerUp" | "levelUp" | "collision" | "move" | "buttonClick" | "teleport";
