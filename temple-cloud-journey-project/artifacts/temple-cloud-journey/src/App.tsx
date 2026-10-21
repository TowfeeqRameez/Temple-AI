import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

type Stage = 'distance' | 'approach' | 'arrival' | 'door';

const JOURNEY_LENGTH = 5_000;
const CHAPTERS: { at: number; stage: Stage; title: string }[] = [
  { at: 0, stage: 'distance', title: 'A distant view' },
  { at: 650, stage: 'approach', title: 'Drawing near' },
  { at: 3_700, stage: 'arrival', title: 'At the temple' },
  { at: 4_200, stage: 'door', title: 'At the temple door' },
];

function stageAt(elapsed: number): Stage {
  return [...CHAPTERS].reverse().find((chapter) => elapsed >= chapter.at)?.stage ?? 'distance';
}

function App() {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [flashPortal, setFlashPortal] = useState(false);

  const stage = stageAt(elapsed);

  useEffect(() => {
    if (!playing || showMap) return;
    const startedAt = Date.now() - elapsed;
    const tick = window.setInterval(() => {
      const nextElapsed = Math.min(Date.now() - startedAt, JOURNEY_LENGTH);
      setElapsed(nextElapsed);
      if (nextElapsed >= JOURNEY_LENGTH) {
        setPlaying(false);
        // Automatically transition into the sacred India Map
        setTimeout(() => {
          enterMap();
        }, 1000);
      }
    }, 100);
    return () => window.clearInterval(tick);
  }, [playing, elapsed, showMap]);

  const enterMap = () => {
    setFlashPortal(true);
    setTimeout(() => {
      setShowMap(true);
      setTimeout(() => setFlashPortal(false), 600);
    }, 500);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* ── India Map View ── */}
      <iframe
        src="/map/index.html"
        title="India Sacred Temples Map"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
      />

      {/* ── Cinematic Temple Entrance Overlay ── */}
      {!showMap && (
        <main
          className="journey"
          data-stage={stage}
          data-paused={!playing ? 'true' : 'false'}
          aria-label="Temple Cloud Journey"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            transition: 'opacity 0.8s ease',
          }}
        >
          <div className="scene" aria-hidden="true">
            <div className="exterior-image" />
            <div className="cloud cloud-left" />
            <div className="cloud cloud-right" />
            <div className="cloud cloud-low" />
            <div className="atmosphere" />
            <div className="veil" />
            {flashPortal && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 20,
                  background: 'radial-gradient(circle, rgba(255,235,175,0.98), rgba(217,119,6,0.8), transparent 80%)',
                  transition: 'opacity 0.6s ease',
                }}
              />
            )}
          </div>

          <header className="masthead">
            <div className="wordmark">TempleVerse</div>
            <button
              onClick={enterMap}
              style={{
                background: 'rgba(47,36,29,0.7)',
                color: '#f7e9c9',
                border: '1px solid rgba(200,155,60,0.6)',
                borderRadius: '20px',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span>Skip to Map</span>
              <ArrowRight size={13} />
            </button>
          </header>
        </main>
      )}
    </div>
  );
}

export default App;
