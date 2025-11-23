import { useEffect } from "react";
import "@fontsource/inter";
import SnakeGame from "./components/SnakeGame";
import { useAudio } from "./lib/stores/useAudio";

function App() {
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  useEffect(() => {
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    setBackgroundMusic(bgMusic);

    const hit = new Audio("/sounds/hit.mp3");
    hit.volume = 0.5;
    setHitSound(hit);

    const success = new Audio("/sounds/success.mp3");
    success.volume = 0.4;
    setSuccessSound(success);
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  return <SnakeGame />;
}

export default App;
