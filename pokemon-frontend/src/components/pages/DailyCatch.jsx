// src/components/pages/DailyCatch.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

const DailyCatch = ({ user }) => {
  const navigate = useNavigate();
  const [dailyPokemon, setDailyPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [catching, setCatching] = useState(false);
  const [caught, setCaught] = useState(false);
  const [alreadyCaught, setAlreadyCaught] = useState(false);
  const [message, setMessage] = useState('');
  const [pokemonPosition, setPokemonPosition] = useState({ x: 50, y: 30 });
  const [pokeballPosition, setPokeballPosition] = useState({ x: 50, y: 70 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 50, y: 70 });
  const [dragCurrent, setDragCurrent] = useState({ x: 50, y: 70 });
  const [isThrown, setIsThrown] = useState(false);
  const [throwVelocity, setThrowVelocity] = useState({ x: 0, y: 0 });
  const [timeUntilNext, setTimeUntilNext] = useState('');
  const [caughtPokemonData, setCaughtPokemonData] = useState(null);
  
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const pokemonMoveInterval = useRef(null);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilNext(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch today's daily Pokemon
  useEffect(() => {
    fetchDailyPokemon();
  }, []);

  // Pokemon random movement
  useEffect(() => {
    if (dailyPokemon && !caught && !isThrown && !alreadyCaught) {
      pokemonMoveInterval.current = setInterval(() => {
        setPokemonPosition(prev => ({
          x: Math.max(15, Math.min(85, prev.x + (Math.random() - 0.5) * 20)),
          y: Math.max(15, Math.min(50, prev.y + (Math.random() - 0.5) * 15))
        }));
      }, 2500);
    }

    return () => {
      if (pokemonMoveInterval.current) {
        clearInterval(pokemonMoveInterval.current);
      }
    };
  }, [dailyPokemon, caught, isThrown, alreadyCaught]);

  // Pokeball physics animation
  useEffect(() => {
    if (isThrown) {
      let velocity = { ...throwVelocity };
      const gravity = 0.8;
      const friction = 0.98;

      const animate = () => {
        velocity.y += gravity;
        velocity.x *= friction;

        setPokeballPosition(prev => {
          const newX = prev.x + velocity.x;
          const newY = prev.y + velocity.y;

          // Check collision with Pokemon
          const distance = Math.sqrt(
            Math.pow(newX - pokemonPosition.x, 2) + 
            Math.pow(newY - pokemonPosition.y, 2)
          );

          if (distance < 12 && !catching) {
            handleCatch();
            cancelAnimationFrame(animationRef.current);
            return prev;
          }

          // Boundary check
          if (newY > 100 || newX < -5 || newX > 105 || newY < -5) {
            setIsThrown(false);
            setMessage('Missed! Try again!');
            setTimeout(() => {
              setPokeballPosition({ x: 50, y: 70 });
              setMessage('');
            }, 1500);
            cancelAnimationFrame(animationRef.current);
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

  // Auto-navigate to Pokedex after catching
  useEffect(() => {
    if (caught && caughtPokemonData) {
      const timer = setTimeout(() => {
        navigate('/pokedex', { state: { highlightPokemon: caughtPokemonData.pokemonId } });
      }, 3000); // Wait 3 seconds to show success animation
      
      return () => clearTimeout(timer);
    }
  }, [caught, caughtPokemonData, navigate]);

  const fetchDailyPokemon = async () => {
    try {
      const response = await fetch('/api/daily-catch/today');
      if (response.ok) {
        const data = await response.json();
        console.log('Daily Pokemon loaded:', data);
        setDailyPokemon(data);
      } else {
        console.error('Failed to fetch daily Pokemon:', response.status);
        setMessage('Failed to load daily Pokemon');
      }
    } catch (error) {
      console.error('Error fetching daily Pokemon:', error);
      setMessage('Failed to load daily Pokemon');
    } finally {
      setLoading(false);
    }
  };

  const handlePokeballMouseDown = (e) => {
    if (caught || alreadyCaught || isThrown || !user) return;
    e.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setIsDragging(true);
    setDragStart({ x, y });
    setDragCurrent({ x, y });
  };

  const handlePokeballTouchStart = (e) => {
    if (caught || alreadyCaught || isThrown || !user) return;
    e.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    
    setIsDragging(true);
    setDragStart({ x, y });
    setDragCurrent({ x, y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setDragCurrent({ x, y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;

    setDragCurrent({ x, y });
  };

  const handleMouseUp = (e) => {
    if (!isDragging || !user) return;
    e.preventDefault();

    const velocityX = (dragStart.x - dragCurrent.x) * 0.4;
    const velocityY = (dragStart.y - dragCurrent.y) * 0.4;

    // Minimum throw strength
    const strength = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    if (strength < 2) {
      setIsDragging(false);
      return;
    }

    setThrowVelocity({ x: velocityX, y: velocityY });
    setIsThrown(true);
    setIsDragging(false);
  };

  const handleTouchEnd = (e) => {
    if (!isDragging || !user) return;
    e.preventDefault();

    const velocityX = (dragStart.x - dragCurrent.x) * 0.4;
    const velocityY = (dragStart.y - dragCurrent.y) * 0.4;

    // Minimum throw strength
    const strength = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    if (strength < 2) {
      setIsDragging(false);
      return;
    }

    setThrowVelocity({ x: velocityX, y: velocityY });
    setIsThrown(true);
    setIsDragging(false);
  };

  const handleCatch = async () => {
    if (!user || catching) return;

    setCatching(true);
    setIsThrown(false);

    try {
      console.log('Attempting to catch Pokemon:', {
        wallet_address: user.wallet_address || user.walletAddress,
        pokemonId: dailyPokemon.pokemonId,
        pokemonName: dailyPokemon.pokemonName,
        sprite: dailyPokemon.sprite
      });

      const response = await fetch('/api/daily-catch/catch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: user.wallet_address || user.walletAddress,
          pokemonId: dailyPokemon.pokemonId,
          pokemonName: dailyPokemon.pokemonName,
          sprite: dailyPokemon.sprite
        })
      });

      const data = await response.json();
      console.log('Catch response:', data);

      if (response.ok) {
        setCaught(true);
        setCaughtPokemonData(data.pokemon);
        setMessage(data.message);
      } else if (data.alreadyCaught) {
        setAlreadyCaught(true);
        setMessage(data.error);
      } else {
        console.error('Catch failed:', data);
        setMessage(data.error || 'Failed to catch Pokemon');
        setTimeout(() => {
          setPokeballPosition({ x: 50, y: 70 });
        }, 1000);
      }
    } catch (error) {
      console.error('Error catching Pokemon:', error);
      setMessage('Failed to catch Pokemon');
      setTimeout(() => {
        setPokeballPosition({ x: 50, y: 70 });
      }, 1000);
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
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 pokemon-font">
          Daily Catch
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Catch today's Pokemon and add it to your Pokedex!
        </p>
      </div>

      {/* Pokemon Info and Pokedex Button - Above Game Screen */}
      {dailyPokemon && (
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-stretch">
          {/* Today's Pokemon Info */}
          <Card className="flex-1 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
            <CardContent className="p-4 flex items-center gap-4">
              <img
                src={dailyPokemon.sprite}
                alt={dailyPokemon.pokemonName}
                className="w-20 h-20 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold capitalize text-gray-900 dark:text-gray-100 mb-1">
                  {dailyPokemon.pokemonName}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    #{dailyPokemon.pokemonId}
                  </Badge>
                  {dailyPokemon.types.map(type => (
                    <Badge 
                      key={type} 
                      className="text-xs capitalize bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Countdown Timer */}
          <Card className="md:w-auto bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Next Pokemon</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400 font-mono">
                  {timeUntilNext}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pokedex Button */}
          <div className="md:w-auto flex items-stretch">
            <Button
              onClick={() => navigate('/pokedex')}
              size="lg"
              className="w-full md:w-auto h-full pokemon-font bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
            >
              <span className="text-2xl mr-2">📚</span>
              <div className="text-left">
                <div className="font-bold">View Pokedex</div>
                <div className="text-xs opacity-90">See your collection</div>
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Game Area */}
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="relative w-full h-[600px] bg-gradient-to-b from-sky-300 via-sky-200 to-green-200 dark:from-sky-700 dark:via-sky-800 dark:to-green-600 overflow-hidden select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            {/* Clouds for depth */}
            <div className="absolute top-10 left-10 w-20 h-12 bg-white/40 rounded-full blur-sm"></div>
            <div className="absolute top-20 right-20 w-32 h-16 bg-white/30 rounded-full blur-sm"></div>
            
            {/* Pokemon */}
            {dailyPokemon && !caught && !alreadyCaught && (
              <div
                className="absolute transition-all duration-[2500ms] ease-in-out z-10"
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
                  className="w-32 h-32 md:w-40 md:h-40"
                  style={{
                    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
                    imageRendering: 'pixelated'
                  }}
                  onError={(e) => {
                    console.error('Pokemon image failed to load:', dailyPokemon.sprite);
                    e.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';
                  }}
                />
              </div>
            )}

            {/* Trajectory Line */}
            {isDragging && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                <line
                  x1={`${dragCurrent.x}%`}
                  y1={`${dragCurrent.y}%`}
                  x2={`${dragStart.x}%`}
                  y2={`${dragStart.y}%`}
                  stroke="rgba(255, 255, 255, 0.6)"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
                <circle
                  cx={`${dragStart.x}%`}
                  cy={`${dragStart.y}%`}
                  r="8"
                  fill="rgba(255, 255, 255, 0.8)"
                />
              </svg>
            )}

            {/* Pokeball */}
            {!caught && !alreadyCaught && (
              <div
                className="absolute z-30 cursor-grab active:cursor-grabbing"
                style={{
                  left: `${isDragging ? dragCurrent.x : pokeballPosition.x}%`,
                  top: `${isDragging ? dragCurrent.y : pokeballPosition.y}%`,
                  transform: `translate(-50%, -50%) ${isThrown ? 'rotate(720deg)' : 'rotate(0deg)'}`,
                  transition: isThrown ? 'transform 0.6s ease-out' : 'none'
                }}
                onMouseDown={handlePokeballMouseDown}
                onTouchStart={handlePokeballTouchStart}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 relative hover:scale-110 transition-transform">
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
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40">
                <div className="text-center animate-bounce">
                  <img
                    src={dailyPokemon.sprite}
                    alt={dailyPokemon.pokemonName}
                    className="w-48 h-48 mx-auto mb-4"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <h2 className="text-4xl font-bold text-white mb-2 pokemon-font">
                    Gotcha!
                  </h2>
                  <p className="text-2xl text-yellow-300 capitalize mb-3">
                    {dailyPokemon.pokemonName}
                  </p>
                  <p className="text-sm text-gray-200 animate-pulse">
                    Taking you to your Pokedex...
                  </p>
                </div>
              </div>
            )}

            {/* Already Caught Message */}
            {alreadyCaught && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40">
                <div className="text-center">
                  <div className="text-6xl mb-4">⏰</div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Already Caught Today!
                  </h2>
                  <p className="text-lg text-gray-200 mb-4">
                    Come back in {timeUntilNext}
                  </p>
                  <Button
                    onClick={() => navigate('/pokedex')}
                    size="lg"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    View Your Pokedex
                  </Button>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!caught && !alreadyCaught && !isDragging && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-lg z-20">
                <p className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-200">
                  Drag the Pokeball and release to throw!
                </p>
              </div>
            )}

            {/* Dragging Instructions */}
            {isDragging && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-20">
                <p className="text-sm md:text-base font-semibold">
                  Release to throw! 🎯
                </p>
              </div>
            )}

            {/* Message Display */}
            {message && !caught && !alreadyCaught && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg max-w-md text-center z-20">
                <p className="font-semibold">{message}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {(caught || alreadyCaught) && !caught && (
        <div className="flex gap-4 justify-center flex-wrap">
          <Button
            onClick={() => window.location.reload()}
            size="lg"
            variant="secondary"
            className="pokemon-font"
          >
            🔄 Reset View
          </Button>
        </div>
      )}
    </div>
  );
};

export default DailyCatch;