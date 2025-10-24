import { useEffect, useState } from 'react'

const Footer = () => {
  const [pikachus, setPikachus] = useState([])

  useEffect(() => {
    const createPikachus = () => {
      const count = 1 // Just 1 Pikachu
      const newPikachus = []
      
      for (let i = 0; i < count; i++) {
        newPikachus.push({
          id: i,
          duration: 15,
          delay: 0,
          size: 80, // Smaller size for footer
        })
      }
      
      setPikachus(newPikachus)
    }

    createPikachus()
  }, [])

  return (
    <footer className="relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: '100px' }}>
      {/* Footer Content */}
      <div className="container mx-auto px-4 h-full flex items-center justify-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 z-10 relative">
          © {new Date().getFullYear()} PokéPort Market. All rights reserved.
        </p>
      </div>

      {/* Pikachu Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {pikachus.map((pikachu) => (
          <div
            key={pikachu.id}
            className="absolute pikachu-container"
            style={{
              bottom: '10px',
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
    </footer>
  )
}

export default Footer