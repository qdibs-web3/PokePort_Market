import { useEffect, useState } from 'react';

const PikachuBackground = () => {
  const [pikachus, setPikachus] = useState([]);

  useEffect(() => {
    const createPikachus = () => {
        const count = 1; // Just 1 Pikachu
        const newPikachus = [];
        
        for (let i = 0; i < count; i++) {
            newPikachus.push({
            id: i,
            startY: 80, // Near the bottom
            duration: 15,
            delay: 0,
            size: 150,
            });
        }
        
        setPikachus(newPikachus);
        };

    createPikachus();
  }, []);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {pikachus.map((pikachu) => (
          <div
            key={pikachu.id}
            className="absolute pikachu-container"
            style={{
              top: `${pikachu.startY}%`,
              width: `${pikachu.size}px`,
              height: `${pikachu.size}px`,
              animation: `walkAcross ${pikachu.duration}s linear infinite`,
              animationDelay: `${pikachu.delay}s`,
            }}
          >
            <img 
              src="/assets/pikachu-run.gif"
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: 0.5,
                transition: 'opacity 0.3s, filter 0.3s',
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes walkAcross {
          0% {
            left: -200px;
          }
          100% {
            left: calc(100% + 200px);
          }
        }

        .pikachu-container:hover img {
          opacity: 0.9 !important;
          filter: drop-shadow(0 0 15px rgba(255, 220, 0, 1));
        }
      `}</style>
    </>
  );
};

export default PikachuBackground;