import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/lib/stores/useAudio';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Difficulty = 'slow' | 'medium' | 'fast';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const SPEED_MAP = {
  slow: 200,
  medium: 150,
  fast: 100
};

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? parseInt(saved) : 0;
  });
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [level, setLevel] = useState(1);

  const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Position>({ x: 15, y: 10 });
  const obstaclesRef = useRef<Position[]>([]);
  const gameLoopRef = useRef<number | null>(null);
  
  const isMobile = useIsMobile();
  const { playHit, playSuccess, backgroundMusic } = useAudio();

  const handleDirectionChange = useCallback((direction: Direction) => {
    if (gameState !== 'playing') return;
    
    const currentDirection = directionRef.current;
    
    if (direction === 'UP' && currentDirection !== 'DOWN') {
      nextDirectionRef.current = 'UP';
    } else if (direction === 'DOWN' && currentDirection !== 'UP') {
      nextDirectionRef.current = 'DOWN';
    } else if (direction === 'LEFT' && currentDirection !== 'RIGHT') {
      nextDirectionRef.current = 'LEFT';
    } else if (direction === 'RIGHT' && currentDirection !== 'LEFT') {
      nextDirectionRef.current = 'RIGHT';
    }
  }, [gameState]);

  const generateObstacles = useCallback((count: number): Position[] => {
    const obstacles: Position[] = [];
    let attempts = 0;
    const maxAttempts = 100;
    
    while (obstacles.length < count && attempts < maxAttempts) {
      const newObstacle = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      
      const isOnSnake = snakeRef.current.some(
        segment => segment.x === newObstacle.x && segment.y === newObstacle.y
      );
      const isOnFood = foodRef.current.x === newObstacle.x && foodRef.current.y === newObstacle.y;
      const isDuplicate = obstacles.some(
        obs => obs.x === newObstacle.x && obs.y === newObstacle.y
      );
      
      if (!isOnSnake && !isOnFood && !isDuplicate) {
        obstacles.push(newObstacle);
      }
      
      attempts++;
    }
    
    return obstacles;
  }, []);

  const generateFood = useCallback((): Position => {
    let newFood: Position;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      attempts++;
      
      const isOnSnake = snakeRef.current.some(
        segment => segment.x === newFood.x && segment.y === newFood.y
      );
      const isOnObstacle = obstaclesRef.current.some(
        obs => obs.x === newFood.x && obs.y === newFood.y
      );
      
      if (!isOnSnake && !isOnObstacle) {
        return newFood;
      }
    } while (attempts < maxAttempts);
    
    return newFood;
  }, []);

  const checkCollision = useCallback((head: Position): boolean => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    
    for (let i = 1; i < snakeRef.current.length; i++) {
      if (head.x === snakeRef.current[i].x && head.y === snakeRef.current[i].y) {
        return true;
      }
    }
    
    const hitObstacle = obstaclesRef.current.some(
      obs => obs.x === head.x && obs.y === head.y
    );
    if (hitObstacle) {
      return true;
    }
    
    return false;
  }, []);

  const moveSnake = useCallback(() => {
    directionRef.current = nextDirectionRef.current;
    
    const head = { ...snakeRef.current[0] };
    
    switch (directionRef.current) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
    }

    if (checkCollision(head)) {
      setGameState('gameover');
      playHit();
      return;
    }

    const newSnake = [head, ...snakeRef.current];

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      setScore(prev => {
        const newScore = prev + 10;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('snakeHighScore', newScore.toString());
        }
        return newScore;
      });
      foodRef.current = generateFood();
      playSuccess();
    } else {
      newSnake.pop();
    }

    snakeRef.current = newSnake;
  }, [checkCollision, generateFood, highScore, playHit, playSuccess]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    ctx.fillStyle = '#4ade80';
    snakeRef.current.forEach((segment, index) => {
      if (index === 0) {
        ctx.fillStyle = '#22c55e';
      } else {
        ctx.fillStyle = '#4ade80';
      }
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(
      foodRef.current.x * CELL_SIZE + 1,
      foodRef.current.y * CELL_SIZE + 1,
      CELL_SIZE - 2,
      CELL_SIZE - 2
    );

    ctx.fillStyle = '#6b7280';
    obstaclesRef.current.forEach(obstacle => {
      ctx.fillRect(
        obstacle.x * CELL_SIZE + 1,
        obstacle.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });
  }, []);

  const gameLoop = useCallback(() => {
    moveSnake();
    draw();
  }, [moveSnake, draw]);

  useEffect(() => {
    if (gameState === 'playing') {
      const speed = SPEED_MAP[difficulty];
      gameLoopRef.current = window.setInterval(gameLoop, speed);
      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }
  }, [gameState, gameLoop, difficulty]);

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key;

      if (key === 'Escape' || key === 'p' || key === 'P') {
        if (gameState === 'playing') {
          setGameState('paused');
          e.preventDefault();
        } else if (gameState === 'paused') {
          setGameState('playing');
          e.preventDefault();
        }
        return;
      }

      if (gameState !== 'playing') return;

      const currentDirection = directionRef.current;

      if ((key === 'ArrowUp' || key === 'w' || key === 'W') && currentDirection !== 'DOWN') {
        nextDirectionRef.current = 'UP';
        e.preventDefault();
      } else if ((key === 'ArrowDown' || key === 's' || key === 'S') && currentDirection !== 'UP') {
        nextDirectionRef.current = 'DOWN';
        e.preventDefault();
      } else if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && currentDirection !== 'RIGHT') {
        nextDirectionRef.current = 'LEFT';
        e.preventDefault();
      } else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && currentDirection !== 'LEFT') {
        nextDirectionRef.current = 'RIGHT';
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState]);

  const startGame = () => {
    snakeRef.current = [{ x: 10, y: 10 }];
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    foodRef.current = generateFood();
    
    const obstacleCount = Math.min(level * 2, 10);
    obstaclesRef.current = generateObstacles(obstacleCount);
    
    setScore(0);
    setGameState('playing');
    
    if (backgroundMusic && backgroundMusic.paused) {
      backgroundMusic.play().catch(error => {
        console.log("Background music play prevented:", error);
      });
    }
  };

  const restartGame = () => {
    setGameState('ready');
    setLevel(1);
    setTimeout(() => startGame(), 100);
  };

  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="mb-6 text-center">
        <h1 className="text-5xl font-bold text-green-400 mb-2 font-mono tracking-wider">
          SNAKE GAME
        </h1>
        <div className="flex gap-8 justify-center text-white">
          <div className="bg-gray-800/50 px-6 py-3 rounded-lg border border-green-500/30">
            <p className="text-sm text-gray-400 uppercase tracking-wide">Score</p>
            <p className="text-3xl font-bold text-green-400 font-mono">{score}</p>
          </div>
          <div className="bg-gray-800/50 px-6 py-3 rounded-lg border border-yellow-500/30">
            <p className="text-sm text-gray-400 uppercase tracking-wide">High Score</p>
            <p className="text-3xl font-bold text-yellow-400 font-mono">{highScore}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border-4 border-green-500 rounded-lg shadow-2xl shadow-green-500/20"
        />

        {gameState === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Play?</h2>
            <p className="text-gray-300 mb-4 text-center px-4">
              Use Arrow Keys or WASD to control the snake
            </p>
            
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2 text-center">Select Difficulty:</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setDifficulty('slow')}
                  variant={difficulty === 'slow' ? 'default' : 'outline'}
                  className={difficulty === 'slow' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                >
                  Slow
                </Button>
                <Button
                  onClick={() => setDifficulty('medium')}
                  variant={difficulty === 'medium' ? 'default' : 'outline'}
                  className={difficulty === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >
                  Medium
                </Button>
                <Button
                  onClick={() => setDifficulty('fast')}
                  variant={difficulty === 'fast' ? 'default' : 'outline'}
                  className={difficulty === 'fast' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  Fast
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2 text-center">Select Level (Obstacles):</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <Button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    variant={level === lvl ? 'default' : 'outline'}
                    size="sm"
                    className={level === lvl ? 'bg-purple-500 hover:bg-purple-600' : ''}
                  >
                    {lvl}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Level {level} = {level * 2} obstacles
              </p>
            </div>
            
            <Button
              onClick={startGame}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white font-bold text-xl px-8 py-6"
            >
              Start Game
            </Button>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm">
            <h2 className="text-5xl font-bold text-yellow-400 mb-4">PAUSED</h2>
            <p className="text-gray-300 mb-6">Press ESC or P to resume</p>
            <Button
              onClick={togglePause}
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xl px-8 py-6"
            >
              Resume
            </Button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-lg backdrop-blur-sm">
            <h2 className="text-5xl font-bold text-red-500 mb-4">Game Over!</h2>
            <p className="text-2xl text-white mb-2">Final Score: {score}</p>
            {score === highScore && score > 0 && (
              <p className="text-xl text-yellow-400 mb-6 animate-pulse">🎉 New High Score! 🎉</p>
            )}
            <Button
              onClick={restartGame}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white font-bold text-xl px-8 py-6 mt-4"
            >
              Play Again
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-gray-400 max-w-md space-y-2">
        <p className="text-sm">
          {isMobile ? '📱 Use buttons below to control' : '🎮 Controls: Arrow Keys or WASD • ESC/P to Pause'}
        </p>
        <p className="text-sm">
          🍎 Eat red food • 🧱 Avoid gray obstacles • ⚠️ Don't hit walls or yourself!
        </p>
      </div>

      {isMobile && (
        <div className="fixed bottom-4 left-0 right-0 flex items-center justify-center gap-8 px-4 z-10">
          <div className="relative w-32 h-32">
            <Button
              onClick={() => handleDirectionChange('UP')}
              disabled={gameState !== 'playing'}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 rounded-lg"
              size="icon"
            >
              <ArrowUp className="w-6 h-6" />
            </Button>
            <Button
              onClick={() => handleDirectionChange('LEFT')}
              disabled={gameState !== 'playing'}
              className="absolute top-1/2 -translate-y-1/2 left-0 w-12 h-12 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 rounded-lg"
              size="icon"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <Button
              onClick={() => handleDirectionChange('RIGHT')}
              disabled={gameState !== 'playing'}
              className="absolute top-1/2 -translate-y-1/2 right-0 w-12 h-12 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 rounded-lg"
              size="icon"
            >
              <ArrowRight className="w-6 h-6" />
            </Button>
            <Button
              onClick={() => handleDirectionChange('DOWN')}
              disabled={gameState !== 'playing'}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 rounded-lg"
              size="icon"
            >
              <ArrowDown className="w-6 h-6" />
            </Button>
          </div>

          <Button
            onClick={togglePause}
            disabled={gameState !== 'playing' && gameState !== 'paused'}
            className="w-16 h-16 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-800 disabled:opacity-50 rounded-full"
            size="icon"
          >
            {gameState === 'paused' ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
          </Button>
        </div>
      )}
    </div>
  );
}
