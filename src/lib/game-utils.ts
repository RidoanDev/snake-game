
// Utility functions for the snake game

/**
 * Generates a random position on the game board that doesn't collide with existing elements
 */
export const generateRandomPosition = (
  gridSize: number,
  snake: { x: number; y: number }[],
  obstacles: { x: number; y: number }[],
  otherItems: { x: number; y: number }[] = []
) => {
  // Create a list of all occupied positions
  const occupiedPositions = [
    ...snake.map(s => `${s.x},${s.y}`),
    ...obstacles.map(o => `${o.x},${o.y}`),
    ...otherItems.map(i => `${i.x},${i.y}`)
  ];
  
  // Generate random positions until we find an unoccupied one
  let x, y;
  let positionKey;
  
  do {
    x = Math.floor(Math.random() * gridSize);
    y = Math.floor(Math.random() * gridSize);
    positionKey = `${x},${y}`;
  } while (occupiedPositions.includes(positionKey));
  
  return { x, y };
};

/**
 * Checks if there's a collision between two positions
 */
export const checkCollision = (
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
) => {
  return pos1.x === pos2.x && pos1.y === pos2.y;
};

/**
 * Checks if an array of positions contains a specific position
 */
export const containsPosition = (
  positions: { x: number; y: number }[],
  position: { x: number; y: number }
) => {
  return positions.some(pos => pos.x === position.x && pos.y === position.y);
};
