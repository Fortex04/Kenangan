import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/lib/stores/useAudio';

interface Position {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? parseInt(saved) : 0;
  });

  const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Position>(generateFood());
  const gameLoopRef = useRef<number | null>(null);
  
  const { playHit, playSuccess } = useAudio();

  function generateFood(): Position {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  }

  const checkCollision = useCallback((head: Position): boolean => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    
    for (let i = 1; i < snakeRef.current.length; i++) {
      if (head.x === snakeRef.current[i].x && head.y === snakeRef.current[i].y) {
        return true;
      }
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
  }, [checkCollision, highScore, playHit, playSuccess]);

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
  }, []);

  const gameLoop = useCallback(() => {
    moveSnake();
    draw();
  }, [moveSnake, draw]);

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = window.setInterval(gameLoop, INITIAL_SPEED);
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
  }, [gameState, gameLoop]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      const key = e.key;
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
    setScore(0);
    setGameState('playing');
  };

  const restartGame = () => {
    setGameState('ready');
    setTimeout(() => startGame(), 100);
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
            <p className="text-gray-300 mb-6 text-center px-4">
              Use Arrow Keys or WASD to control the snake
            </p>
            <Button
              onClick={startGame}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white font-bold text-xl px-8 py-6"
            >
              Start Game
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

      <div className="mt-6 text-center text-gray-400 max-w-md">
        <p className="text-sm">
          🎮 Controls: Arrow Keys or WASD • Eat the red food • Avoid walls and yourself!
        </p>
      </div>
    </div>
  );
}
