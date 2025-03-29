
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import GameBoard from "./GameBoard";
import ScoreBoard from "./ScoreBoard";
import { PowerUpType, CellType, Direction, GameStatus } from "@/lib/game-types";
import { generateRandomPosition, checkCollision } from "@/lib/game-utils";
import { playSound, soundManager } from "@/lib/sound-utils";

const GAME_SPEED_MS = 150;
const INITIAL_SNAKE_LENGTH = 3;
const GRID_SIZE = 20;

const SnakeGame: React.FC = () => {
  const { toast } = useToast();
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([]);
  const [food, setFood] = useState<{ x: number; y: number; type: CellType }>({
    x: 0,
    y: 0,
    type: "food",
  });
  const [powerUp, setPowerUp] = useState<{
    x: number;
    y: number;
    type: PowerUpType;
    active: boolean;
  } | null>(null);
  const [direction, setDirection] = useState<Direction>("right");
  const [nextDirection, setNextDirection] = useState<Direction>("right");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(GAME_SPEED_MS);
  const [obstacles, setObstacles] = useState<{ x: number; y: number }[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const tickRef = useRef<number>(0);
  const lastMoveTimeRef = useRef<number>(0);

  // Load high score on initial render
  useEffect(() => {
    const savedHighScore = localStorage.getItem("snakeHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Handle game over - defined before it's used
  const handleGameOver = useCallback(() => {
    setGameStatus("game-over");
    
    // Play game over sound
    playSound('gameOver');
    
    // Update high score
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("snakeHighScore", score.toString());
    }
    
    toast({
      title: "Game Over!",
      description: `Your score: ${score}. ${score > highScore ? "New high score!" : ""}`,
      variant: "destructive",
    });
    
    // Clear game loop
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, [highScore, score, toast]);

  // Initialize the game
  const initializeGame = useCallback(() => {
    // Create initial snake in the middle of the board
    const initialSnake = [];
    const middleY = Math.floor(GRID_SIZE / 2);
    const startX = Math.floor(GRID_SIZE / 3);
    
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      initialSnake.push({ x: startX - i, y: middleY });
    }
    
    setSnake(initialSnake);
    setDirection("right");
    setNextDirection("right");
    setScore(0);
    setSpeed(GAME_SPEED_MS);
    setObstacles([]);
    setPowerUp(null);
    
    // Place initial food
    placeFood(initialSnake, []);
    
    setGameStatus("playing");
    
    // Play button click sound
    playSound('buttonClick');
    
    // Show start toast
    toast({
      title: "Game Started!",
      description: "Use arrow keys to navigate the snake.",
    });
  }, [toast]);

  // Place food at random position
  const placeFood = useCallback((currentSnake: {x: number, y: number}[], currentObstacles: {x: number, y: number}[]) => {
    const newFood = generateRandomPosition(GRID_SIZE, currentSnake, currentObstacles, powerUp ? [powerUp] : []);
    
    // 20% chance to generate special food
    const foodType: CellType = Math.random() < 0.2 ? "special-food" : "food";
    
    setFood({ ...newFood, type: foodType });
  }, [powerUp]);

  // Place power-up
  const placePowerUp = useCallback((currentSnake: {x: number, y: number}[], currentObstacles: {x: number, y: number}[], currentFood: {x: number, y: number}) => {
    // 15% chance to spawn a power-up when score is at least 5
    if (score >= 5 && Math.random() < 0.15 && !powerUp?.active) {
      const powerUpTypes: PowerUpType[] = ["speed-boost", "score-multiplier", "shield"];
      const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      
      const newPowerUpPosition = generateRandomPosition(
        GRID_SIZE, 
        currentSnake, 
        currentObstacles, 
        [currentFood]
      );
      
      setPowerUp({
        ...newPowerUpPosition,
        type: randomType,
        active: true
      });
    }
  }, [score, powerUp]);

  // Handle power-up effects
  const activatePowerUp = useCallback((type: PowerUpType) => {
    // Play power-up sound
    playSound('powerUp');
    
    switch (type) {
      case "speed-boost":
        setSpeed(GAME_SPEED_MS / 1.5);
        toast({
          title: "Speed Boost!",
          description: "Snake is moving faster temporarily.",
        });
        
        // Reset speed after 5 seconds
        setTimeout(() => {
          setSpeed(GAME_SPEED_MS);
          setPowerUp(prev => prev ? { ...prev, active: false } : null);
        }, 5000);
        break;
        
      case "score-multiplier":
        // Handled directly in the score calculation
        toast({
          title: "Score Multiplier!",
          description: "Next 3 foods give double points!",
        });
        break;
        
      case "shield":
        toast({
          title: "Shield Activated!",
          description: "You're protected from one collision!",
        });
        break;
    }
  }, [toast]);

  // Add obstacles as game progresses
  const addObstacle = useCallback(() => {
    if (score > 0 && score % 5 === 0 && obstacles.length < 5) {
      const newObstacle = generateRandomPosition(
        GRID_SIZE, 
        snake, 
        obstacles, 
        [food, ...(powerUp ? [powerUp] : [])]
      );
      
      setObstacles(prev => [...prev, newObstacle]);
      
      // Play collision sound
      playSound('collision');
      
      toast({
        title: "New Obstacle!",
        description: "Be careful, the path gets more challenging.",
      });
    }
  }, [food, obstacles, powerUp, score, snake, toast]);

  // Game loop
  const gameLoop = useCallback(() => {
    tickRef.current++;
    
    if (gameStatus !== "playing") return;
    
    // Only play move sound occasionally to avoid sound overload
    if (tickRef.current % 5 === 0) {
      playSound('move');
    }
    
    setSnake(prevSnake => {
      // Set current direction to next direction
      setDirection(nextDirection);
      
      const head = { ...prevSnake[0] };
      
      // Move head according to direction
      switch (nextDirection) {
        case "up":
          head.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case "down":
          head.y = (head.y + 1) % GRID_SIZE;
          break;
        case "left":
          head.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case "right":
          head.x = (head.x + 1) % GRID_SIZE;
          break;
      }
      
      // Check if snake eats food
      const eatsFood = head.x === food.x && head.y === food.y;
      
      // Check if snake eats power-up
      const eatsPowerUp = powerUp && head.x === powerUp.x && head.y === powerUp.y;
      
      // Check for collision with obstacles
      const hitsObstacle = obstacles.some(o => o.x === head.x && o.y === head.y);
      
      // Check for collision with self
      const hitsSelf = prevSnake.some((segment, index) => {
        // Skip the tail segment if the snake is going to grow
        if (eatsFood && index === prevSnake.length - 1) return false;
        return segment.x === head.x && segment.y === head.y;
      });
      
      // Handle collision
      if (hitsObstacle || hitsSelf) {
        // Check if shield is active
        if (powerUp?.type === "shield" && powerUp.active) {
          setPowerUp(null);
          // Play shield sound
          playSound('collision');
          
          toast({
            title: "Shield Used!",
            description: "Your shield protected you from a collision.",
          });
          
          // Continue the game
          const newSnake = [head, ...prevSnake.slice(0, prevSnake.length - 1)];
          return newSnake;
        } else {
          // Game over
          handleGameOver();
          return prevSnake;
        }
      }
      
      // Create new snake
      const newSnake = [head, ...prevSnake];
      
      // Remove tail if not eating
      if (!eatsFood) {
        newSnake.pop();
      }
      
      // Handle eating food
      if (eatsFood) {
        // Play eat sound
        playSound('eat');
        
        // Calculate score increase based on food type and power-ups
        let scoreIncrease = food.type === "special-food" ? 3 : 1;
        
        // Apply score multiplier if active
        if (powerUp?.type === "score-multiplier" && powerUp.active) {
          scoreIncrease *= 2;
          
          // Decrease multiplier counter
          const remainingMultiplier = tickRef.current % 3;
          if (remainingMultiplier === 0) {
            setPowerUp(prev => prev ? { ...prev, active: false } : null);
          }
        }
        
        setScore(prev => {
          const newScore = prev + scoreIncrease;
          // Play level up sound every 10 points
          if (newScore % 10 === 0 && newScore > 0) {
            playSound('levelUp');
          }
          return newScore;
        });
        
        // Place new food
        placeFood(newSnake, obstacles);
        
        // Add obstacle every 5 points
        addObstacle();
        
        // Check for power-up placement
        placePowerUp(newSnake, obstacles, food);
      }
      
      // Handle eating power-up
      if (eatsPowerUp && powerUp) {
        activatePowerUp(powerUp.type);
        setPowerUp(prev => prev ? { ...prev, active: true } : null);
      }
      
      return newSnake;
    });
  }, [activatePowerUp, addObstacle, direction, food, gameStatus, handleGameOver, nextDirection, obstacles, placeFood, placePowerUp, powerUp]);

  // Start game loop
  useEffect(() => {
    if (gameStatus === "playing") {
      gameLoopRef.current = window.setInterval(gameLoop, speed);
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameLoop, gameStatus, speed]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (gameStatus !== "playing") return;
      
      switch (e.key) {
        case "ArrowUp":
          if (direction !== "down") setNextDirection("up");
          break;
        case "ArrowDown":
          if (direction !== "up") setNextDirection("down");
          break;
        case "ArrowLeft":
          if (direction !== "right") setNextDirection("left");
          break;
        case "ArrowRight":
          if (direction !== "left") setNextDirection("right");
          break;
        case " ": // Spacebar
          pauseGame();
          break;
        case "m": // M key for mute/unmute
          toggleMute();
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [direction, gameStatus]);

  // Start game
  const startGame = () => {
    if (gameStatus === "playing") return;
    initializeGame();
  };

  // Pause game
  const pauseGame = () => {
    if (gameStatus !== "playing") return;
    
    // Play button click sound
    playSound('buttonClick');
    
    setGameStatus("paused");
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    toast({
      title: "Game Paused",
      description: "Press Play to continue your game.",
    });
  };

  // Resume game
  const resumeGame = () => {
    if (gameStatus !== "paused") return;
    
    // Play button click sound
    playSound('buttonClick');
    
    setGameStatus("playing");
    gameLoopRef.current = window.setInterval(gameLoop, speed);
    
    toast({
      title: "Game Resumed",
      description: "Snake is on the move again!",
    });
  };

  // Toggle sound
  const toggleMute = () => {
    const newMuteState = soundManager.toggleMute();
    setIsMuted(newMuteState);
    
    toast({
      title: newMuteState ? "Sound Muted" : "Sound Enabled",
      description: newMuteState ? "Game sounds are now off." : "Game sounds are now on.",
    });
  };

  // Handle direction change (for mobile/touch controls)
  const handleDirectionChange = (newDirection: Direction) => {
    if (gameStatus !== "playing") return;
    
    // Prevent 180-degree turns
    if (
      (newDirection === "up" && direction !== "down") ||
      (newDirection === "down" && direction !== "up") ||
      (newDirection === "left" && direction !== "right") ||
      (newDirection === "right" && direction !== "left")
    ) {
      setNextDirection(newDirection);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-2 text-primary animate-fade-in">
        Snake Venture
      </h1>
      
      <ScoreBoard score={score} highScore={highScore} />
      
      <div className="relative mt-4 mb-6">
        <GameBoard
          gridSize={GRID_SIZE}
          snake={snake}
          food={food}
          powerUp={powerUp}
          obstacles={obstacles}
          gameStatus={gameStatus}
        />
        
        {gameStatus === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg animate-fade-in">
            <Button 
              onClick={startGame} 
              className="px-8 py-6 text-xl bg-primary hover:bg-primary/90"
            >
              Start Game
            </Button>
          </div>
        )}
        
        {gameStatus === "game-over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 rounded-lg animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Game Over!</h2>
            <p className="text-xl mb-2">Score: {score}</p>
            {score === highScore && score > 0 && (
              <p className="text-yellow-300 text-lg mb-4">New High Score!</p>
            )}
            <Button 
              onClick={startGame} 
              className="px-6 py-2 text-lg bg-primary hover:bg-primary/90"
            >
              Play Again
            </Button>
          </div>
        )}
        
        {gameStatus === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg animate-fade-in">
            <Button 
              onClick={resumeGame} 
              className="px-8 py-6 text-xl bg-primary hover:bg-primary/90"
            >
              Resume Game
            </Button>
          </div>
        )}
      </div>

      {/* Game controls */}
      <div className="flex flex-col items-center mt-4 mb-8">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div></div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDirectionChange("up")}
            disabled={gameStatus !== "playing"}
            className="bg-secondary/40 hover:bg-secondary/60"
          >
            <ArrowUp className="h-6 w-6" />
          </Button>
          <div></div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDirectionChange("left")}
            disabled={gameStatus !== "playing"}
            className="bg-secondary/40 hover:bg-secondary/60"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDirectionChange("down")}
            disabled={gameStatus !== "playing"}
            className="bg-secondary/40 hover:bg-secondary/60"
          >
            <ArrowDown className="h-6 w-6" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDirectionChange("right")}
            disabled={gameStatus !== "playing"}
            className="bg-secondary/40 hover:bg-secondary/60"
          >
            <ArrowRight className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="flex gap-2 mt-4">
          {gameStatus === "playing" ? (
            <Button onClick={pauseGame} className="bg-secondary hover:bg-secondary/80 px-6">
              <Pause className="mr-2 h-4 w-4" /> Pause
            </Button>
          ) : gameStatus === "paused" ? (
            <Button onClick={resumeGame} className="bg-primary hover:bg-primary/90 px-6">
              <Play className="mr-2 h-4 w-4" /> Resume
            </Button>
          ) : (
            <Button onClick={startGame} className="bg-primary hover:bg-primary/90 px-6">
              <Play className="mr-2 h-4 w-4" /> Play
            </Button>
          )}
          
          <Button 
            onClick={initializeGame} 
            className="bg-secondary hover:bg-secondary/80"
            disabled={gameStatus === "idle"}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Restart
          </Button>
          
          <Button 
            onClick={toggleMute} 
            className="bg-secondary hover:bg-secondary/80"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Game instructions */}
      <div className="max-w-md text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Instructions</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Use arrow keys or buttons to control the snake. Collect food to grow and earn points. Press 'M' to mute sounds.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-xs">
          <div className="px-2 py-1 bg-primary/20 rounded-md">
            <span className="font-bold text-primary">Red Apple</span>: +1 point
          </div>
          <div className="px-2 py-1 bg-purple-500/20 rounded-md">
            <span className="font-bold text-purple-400">Special Food</span>: +3 points
          </div>
          <div className="px-2 py-1 bg-yellow-500/20 rounded-md">
            <span className="font-bold text-yellow-400">Power-ups</span>: Special abilities
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
