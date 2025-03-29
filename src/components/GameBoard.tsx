
import React from "react";
import { cn } from "@/lib/utils";
import { PowerUpType, CellType, GameStatus } from "@/lib/game-types";

interface GameBoardProps {
  gridSize: number;
  snake: { x: number; y: number }[];
  food: { x: number; y: number; type: CellType };
  powerUp: { x: number; y: number; type: PowerUpType; active: boolean } | null;
  obstacles: { x: number; y: number }[];
  gameStatus: GameStatus;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gridSize,
  snake,
  food,
  powerUp,
  obstacles,
  gameStatus,
}) => {
  // Calculate the size of each cell based on screen size
  // Use a fixed size for consistency but could be made responsive
  const cellSize = 20;
  
  // Generate the grid cells
  const grid = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // Check what's in this cell
      const isSnakeHead = snake.length > 0 && snake[0].x === x && snake[0].y === y;
      const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
      const isFood = food.x === x && food.y === y;
      const isPowerUp = powerUp && powerUp.x === x && powerUp.y === y;
      const isObstacle = obstacles.some(obs => obs.x === x && obs.y === y);
      
      // Determine cell style
      let cellClassName = cn(
        "absolute rounded-sm transition-all duration-150",
        {
          // Snake head
          "bg-primary z-20 animate-snake-eat": isSnakeHead && isFood,
          "bg-primary z-20": isSnakeHead && !isFood,
          
          // Snake body - create gradient effect based on position in snake
          "bg-primary/90 z-10": isSnakeBody && snake.indexOf(snake.find(s => s.x === x && s.y === y)!) === 1,
          "bg-primary/80 z-10": isSnakeBody && snake.indexOf(snake.find(s => s.x === x && s.y === y)!) === 2,
          "bg-primary/70 z-10": isSnakeBody && snake.indexOf(snake.find(s => s.x === x && s.y === y)!) === 3,
          "bg-primary/60 z-10": isSnakeBody && snake.indexOf(snake.find(s => s.x === x && s.y === y)!) > 3,
          
          // Food
          "bg-red-500 z-20 animate-pulse-effect": isFood && food.type === "food",
          "bg-purple-500 z-20 animate-pulse-effect": isFood && food.type === "special-food",
          
          // Power-ups
          "bg-yellow-400 z-20 animate-pulse-effect": isPowerUp && powerUp.type === "speed-boost",
          "bg-blue-400 z-20 animate-pulse-effect": isPowerUp && powerUp.type === "score-multiplier",
          "bg-green-400 z-20 animate-pulse-effect": isPowerUp && powerUp.type === "shield",
          
          // Obstacles
          "bg-gray-700 z-10": isObstacle,
        }
      );
      
      // Add specific shapes or styles for different game elements
      if (isSnakeHead) {
        // Add eyes to snake head
        grid.push(
          <div
            key={`${x}-${y}`}
            className={cellClassName}
            style={{
              width: cellSize,
              height: cellSize,
              left: x * cellSize,
              top: y * cellSize,
              borderRadius: "6px",
            }}
          >
            <div className="relative w-full h-full">
              <div className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 left-1"></div>
              <div className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 right-1"></div>
            </div>
          </div>
        );
      } else if (isFood) {
        // Add a special style for food
        const foodIcon = food.type === "food" ? "🍎" : "🍇";
        grid.push(
          <div
            key={`${x}-${y}`}
            className={cellClassName}
            style={{
              width: cellSize,
              height: cellSize,
              left: x * cellSize,
              top: y * cellSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: `${cellSize - 4}px`,
              background: "transparent",
            }}
          >
            {foodIcon}
          </div>
        );
      } else if (isPowerUp) {
        // Add a special style for power-ups
        let powerUpIcon = "⚡"; // Default speed boost
        if (powerUp.type === "score-multiplier") powerUpIcon = "✨";
        if (powerUp.type === "shield") powerUpIcon = "🛡️";
        
        grid.push(
          <div
            key={`${x}-${y}`}
            className={cellClassName}
            style={{
              width: cellSize,
              height: cellSize,
              left: x * cellSize,
              top: y * cellSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: `${cellSize - 6}px`,
              background: "transparent",
            }}
          >
            {powerUpIcon}
          </div>
        );
      } else if (isObstacle) {
        // Special style for obstacles
        grid.push(
          <div
            key={`${x}-${y}`}
            className={cellClassName}
            style={{
              width: cellSize,
              height: cellSize,
              left: x * cellSize,
              top: y * cellSize,
              borderRadius: "4px",
            }}
          />
        );
      } else if (isSnakeBody) {
        // Normal cells
        grid.push(
          <div
            key={`${x}-${y}`}
            className={cellClassName}
            style={{
              width: cellSize,
              height: cellSize,
              left: x * cellSize,
              top: y * cellSize,
              borderRadius: "4px",
            }}
          />
        );
      }
    }
  }

  return (
    <div 
      className={cn(
        "relative bg-secondary border-2 border-secondary rounded-lg overflow-hidden shadow-xl",
        {"opacity-80": gameStatus === "paused" || gameStatus === "game-over"}
      )}
      style={{
        width: gridSize * cellSize,
        height: gridSize * cellSize,
      }}
    >
      {grid}
      
      {/* Grid background pattern */}
      <div 
        className="absolute inset-0 grid z-0 opacity-10"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {Array(gridSize * gridSize).fill(0).map((_, i) => (
          <div key={`grid-${i}`} className="border border-gray-700"></div>
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
