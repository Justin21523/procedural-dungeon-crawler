import { usePlayerStore } from '../stores/playerStore';

export function GameOverOverlay() {
  const gameOver = usePlayerStore((s) => s.gameOver);
  const resetPlayer = usePlayerStore((s) => s.resetPlayer);

  if (!gameOver) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
      <h1 className="text-6xl font-extrabold text-red-600 mb-4">YOU DIED</h1>
      <button
        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xl hover:bg-blue-500 transition"
        onClick={() => {
          resetPlayer();
          // Reload dungeon? We can just set floor to 1 and regenerate
          window.location.reload(); // quick reset for MVP
        }}
      >
        Try Again
      </button>
    </div>
  );
}
