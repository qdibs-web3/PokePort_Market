// src/components/pages/DailyCatch.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { useNavigate } from 'react-router-dom';

const DailyCatch = ({ user }) => {
  const navigate = useNavigate();
  const [dailyPokemon, setDailyPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [catching, setCatching] = useState(false);
  const [caught, setCaught] = useState(false);
  const [alreadyCaught, setAlreadyCaught] = useState(false);
  const [message, setMessage] = useState('');
  const [pokemonPosition, setPokemonPosition] = useState({ x: 50, y: 50 });
  const [pokeballPosition, setPokeballPosition] = useState({ x: 50, y: 85 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isThrown, setIsThrown] = useState(false);
  const [throwVelocity, setThrowVelocity] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const pokemonMoveInterval = useRef(null);

  // Fetch today's daily Pokemon
  useEffect(() => {
    fetchDailyPokemon();
  }, []);

  // Pokemon random movement
  useEffect(() => {
    if (dailyPokemon && !caught && !isThrown) {
      pokemonMoveInterval.current = setInterval(() => {
        setPokemonPosition(prev => ({
          x: Math.max(10, Math.min(90, prev.x + (Math.random() - 0.5) * 15)),
          y: Math.max(10, Math.min(60, prev.y + (Math.random() - 0.5) * 15))
        }));
      }, 2000);
    }

    return () => {
      if (pokemonMoveInterval.current) {
        clearInterval(pokemonMoveInterval.current);
      }
    };
  }, [dailyPokemon, caught, isThrown]);

  // Pokeball physics animation
  useEffect(() => {
    if (isThrown) {
      let velocity = { ...throwVelocity };
      const gravity = 0.5;
      const friction = 0.99;

      const animate = () => {
        velocity.y += gravity;
        velocity.x *= friction;
        velocity.y *= friction;

        setPokeballPosition(prev => {
          const newX = prev.x + velocity.x;
          const newY = prev.y + velocity.y;

          // Check collision with Pokemon
          const distance = Math.sqrt(
            Math.pow(newX - pokemonPosition.x, 2) + 
            Math.pow(newY - pokemonPosition.y, 2)
          );

          if (distance < 8 && !catching) {
            handleCatch();
            return prev;
          }

          // Boundary check
          if (newY > 95 || newX < 0 || newX > 100 || newY < 0) {
            setIsThrown(false);
            setMessage('Missed! Try again!');
            setTimeout(() => {
              setPokeballPosition({ x: 50, y: 85 });
              setMessage('');
            }, 1500);
            return prev;
          }

          return { x: newX, y: newY };
        });

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isThrown, throwVelocity, pokemonPosition, catching]);

  const fetchDailyPokemon = async () => {
    try {
      const response = await fetch('/api/daily-catch/today');
      if (response.ok) {
        const data = await response.json();
        setDailyPokemon(data);
      }
    } catch (error) {
      console.error('Error fetching daily Pokemon:', error);
      setMessage('Failed to load daily Pokemon');
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e) => {
    if (caught || alreadyCaught || isThrown || !user) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleTouchStart = (e) => {
    if (caught || alreadyCaught || isThrown || !user) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    
    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseUp = (e) => {
    if (!isDragging || !user) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const velocityX = (x - dragStart.x) * 0.3;
    const velocityY = (y - dragStart.y) * 0.3;

    setThrowVelocity({ x: velocityX, y: velocityY });
    setIsThrown(true);
    setIsDragging(false);
  };

  const handleTouchEnd = (e) => {
    if (!isDragging || !user) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;

    const velocityX = (x - dragStart.x) * 0.3;
    const velocityY = (y - dragStart.y) * 0.3;

    setThrowVelocity({ x: velocityX, y: velocityY });
    setIsThrown(true);
    setIsDragging(false);
  };

  const handleCatch = async () => {
    if (!user || catching) return;

    setCatching(true);
    setIsThrown(false);

    try {
      const response = await fetch('/api/daily-catch/catch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: user.wallet_address,
          pokemonId: dailyPokemon.pokemonId,
          pokemonName: dailyPokemon.pokemonName,
          sprite: dailyPokemon.sprite
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCaught(true);
        setMessage(data.message);
      } else if (data.alreadyCaught) {
        setAlreadyCaught(true);
        setMessage(data.error);
      } else {
        setMessage(data.error || 'Failed to catch Pokemon');
        setPokeballPosition({ x: 50, y: 85 });
      }
    } catch (error) {
      console.error('Error catching Pokemon:', error);
      setMessage('Failed to catch Pokemon');
      setPokeballPosition({ x: 50, y: 85 });
    } finally {
      setCatching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading today's Pokemon...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to catch Pokemon and build your Pokedex!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 pokemon-font">
          Daily Catch
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Catch today's Pokemon and add it to your Pokedex!
        </p>
      </div>

      {/* Game Area */}
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="relative w-full h-[500px] bg-gradient-to-b from-sky-300 to-green-200 dark:from-sky-700 dark:to-green-600 overflow-hidden cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            {/* Pokemon */}
            {dailyPokemon && !caught && (
              <div
                className="absolute transition-all duration-2000 ease-in-out"
                style={{
                  left: `${pokemonPosition.x}%`,
                  top: `${pokemonPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              >
                <img
                  src={dailyPokemon.sprite}
                  alt={dailyPokemon.pokemonName}
                  className="w-32 h-32 md:w-40 md:h-40 drop-shadow-lg"
                  style={{
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                  }}
                />
              </div>
            )}

            {/* Pokeball */}
            {!caught && !alreadyCaught && (
              <div
                className="absolute transition-all duration-100"
                style={{
                  left: `${pokeballPosition.x}%`,
                  top: `${pokeballPosition.y}%`,
                  transform: `translate(-50%, -50%) ${isThrown ? 'rotate(720deg)' : 'rotate(0deg)'}`,
                  pointerEvents: 'none'
                }}
              >
                <div className="w-12 h-12 md:w-16 md:h-16 relative">
                  {/* Pokeball SVG */}
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                    <circle cx="50" cy="50" r="48" fill="#f44336" />
                    <rect x="0" y="45" width="100" height="10" fill="#333" />
                    <circle cx="50" cy="50" r="15" fill="#fff" stroke="#333" strokeWidth="3" />
                    <circle cx="50" cy="50" r="8" fill="#fff" stroke="#333" strokeWidth="2" />
                    <path d="M 2 50 Q 2 75, 25 90 Q 50 100, 75 90 Q 98 75, 98 50" fill="#fff" />
                  </svg>
                </div>
              </div>
            )}

            {/* Success Animation */}
            {caught && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-center animate-bounce">
                  <img
                    src={dailyPokemon.sprite}
                    alt={dailyPokemon.pokemonName}
                    className="w-48 h-48 mx-auto mb-4"
                  />
                  <h2 className="text-4xl font-bold text-white mb-2 pokemon-font">
                    Gotcha!
                  </h2>
                  <p className="text-2xl text-yellow-300 capitalize">
                    {dailyPokemon.pokemonName}
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!caught && !alreadyCaught && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-lg">
                <p className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-200">
                  {isDragging ? 'Release to throw!' : 'Click and drag to throw the Pokeball!'}
                </p>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg max-w-md text-center">
                <p className="font-semibold">{message}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pokemon Info */}
      {dailyPokemon && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="capitalize">Today's Pokemon: {dailyPokemon.pokemonName}</CardTitle>
            <CardDescription>
              #{dailyPokemon.pokemonId} • Types: {dailyPokemon.types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button
          onClick={() => navigate('/pokedex')}
          variant="outline"
          size="lg"
          className="pokemon-font"
        >
          View My Pokedex
        </Button>
        
        {(caught || alreadyCaught) && (
          <Button
            onClick={() => window.location.reload()}
            size="lg"
            className="pokemon-font"
          >
            Try Another Throw
          </Button>
        )}
      </div>
    </div>
  );
};

export default DailyCatch;