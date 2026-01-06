import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import forestBg from '@/assets/forest.png';

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
  const [newBadges, setNewBadges] = useState([]);
  const [canCatch, setCanCatch] = useState(true);
  const [displayPokemon, setDisplayPokemon] = useState(null);

  
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const pokemonMoveInterval = useRef(null);
  const lastCatchTimeRef = useRef(null);
  const catchLockRef = useRef(false); 

  useEffect(() => {
    if (!dailyPokemon) return;

    if (dailyPokemon.lastCatch && !lastCatchTimeRef.current) {
      lastCatchTimeRef.current = new Date(dailyPokemon.lastCatch).getTime();
    }

    const updateCountdown = () => {
      if (dailyPokemon.canCatch) {
        setTimeUntilNext('Ready to catch!');
        setCanCatch(true);
        return;
      }

      if (lastCatchTimeRef.current) {
        const oneHour = 60 * 60 * 1000;
        const now = Date.now();
        const timeSinceLastCatch = now - lastCatchTimeRef.current;
        const remaining = oneHour - timeSinceLastCatch;
        
        if (remaining <= 0) {
          setTimeUntilNext('Ready to catch!');
          setCanCatch(true);
          return;
        }

        const minutes = Math.floor(remaining / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        setTimeUntilNext(`${minutes}m ${seconds}s`);
        setCanCatch(false);
      } else {
        setTimeUntilNext('Ready to catch!');
        setCanCatch(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [dailyPokemon?.canCatch, dailyPokemon?.lastCatch]);

  useEffect(() => {
    if (user) {
      fetchDailyPokemon();
    }
  }, [user?.wallet_address, user?.walletAddress]); 

  useEffect(() => {
    if (dailyPokemon && !caught && !isThrown && canCatch) {
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
  }, [dailyPokemon, caught, isThrown, canCatch]);

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

          const distance = Math.sqrt(
            Math.pow(newX - pokemonPosition.x, 2) + 
            Math.pow(newY - pokemonPosition.y, 2)
          );

          if (distance < 12 && !catching) {
            handleCatch();
            cancelAnimationFrame(animationRef.current);
            return prev;
          }

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
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [caught, caughtPokemonData, navigate]);

   useEffect(() => {
    if (!dailyPokemon) return;

    const saved = localStorage.getItem('lastCaughtPokemon');
    const lastCaught = saved ? JSON.parse(saved) : null;

    if (canCatch) {
        // Cooldown expired — allow catching new Pokémon
        setDisplayPokemon(dailyPokemon);
    } else if (lastCaught) {
        // Cooldown active — show last caught Pokémon instead
        setDisplayPokemon(lastCaught);
    } else {
        // Fallback in case nothing saved yet
        setDisplayPokemon(dailyPokemon);
    }
    }, [dailyPokemon, canCatch]);




  const fetchDailyPokemon = async () => {
    try {
        const walletAddress = user?.wallet_address || user?.walletAddress;
        const response = await fetch(`/api/daily-catch/today?wallet_address=${walletAddress}`);

        if (response.ok) {
        const data = await response.json();
        console.log('Daily Pokemon loaded:', data);
        setDailyPokemon(data);
        setCanCatch(data.canCatch);

        // Store the lastCatch time in ref
        if (data.lastCatch) {
            lastCatchTimeRef.current = new Date(data.lastCatch).getTime();
        } else {
            lastCatchTimeRef.current = null;
        }

        if (!data.canCatch) {
            // Cooldown active — show the last caught Pokémon from localStorage
            setAlreadyCaught(true);
            const saved = localStorage.getItem('lastCaughtPokemon');
            if (saved) {
            const lastCaught = JSON.parse(saved);
            setCaughtPokemonData(lastCaught);
            setDisplayPokemon(lastCaught);
            console.log("Cooldown active — showing last caught Pokémon:", lastCaught.name);
            } else {
            console.log("Cooldown active — but no last caught Pokémon found in storage.");
            }
        } else {
            // Cooldown expired — clear any old saved Pokémon
            localStorage.removeItem('lastCaughtPokemon');
        }
        } else {
        console.error('Failed to fetch daily Pokemon:', response.status);
        setMessage('Failed to load Pokemon');
        }
    } catch (error) {
        console.error('Error fetching daily Pokemon:', error);
        setMessage('Failed to load Pokemon');
    } finally {
        setLoading(false);
    }
    };


  const handlePokeballMouseDown = (e) => {
    if (caught || !canCatch || isThrown || !user) return;
    e.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setIsDragging(true);
    setDragStart({ x, y });
    setDragCurrent({ x, y });
  };

  const handlePokeballTouchStart = (e) => {
    if (caught || !canCatch || isThrown || !user) return;
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
    if (!user || catching || catchLockRef.current) return;

    // Lock to prevent duplicate calls
    catchLockRef.current = true;
    setCatching(true);
    setIsThrown(false);

    try {
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
        setNewBadges(data.newBadges || []);
        localStorage.setItem('lastCaughtPokemon', JSON.stringify(data.pokemon));
        setMessage(data.message);
        setCanCatch(false);
        // Update the lastCatch time
        lastCatchTimeRef.current = Date.now();
        // Keep lock engaged after successful catch
      } else if (data.alreadyCaught) {
        setAlreadyCaught(true);
        setCanCatch(false);
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
      // Only unlock if catch failed (not if successful)
      if (!caught) {
        setTimeout(() => {
          catchLockRef.current = false;
        }, 1000); // 1 second cooldown between attempts
      }
    }
  };

  const handleReset = () => {
    setCaught(false);
    setAlreadyCaught(false);
    setMessage('');
    setPokeballPosition({ x: 50, y: 70 });
    setCaughtPokemonData(null);
    lastCatchTimeRef.current = null; // Reset the ref
    catchLockRef.current = false; // Reset catch lock
    fetchDailyPokemon();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Pokemon...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl">Connect Your Wallet</CardTitle>
            <CardDescription className="text-base md:text-lg mt-4">
              You need to connect your wallet to catch Pokemon and build your Pokedex!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <p className="text-gray-600 dark:text-gray-400">
              Click the "Connect Wallet" button in the header to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 pokemon-font">
          Hourly Catch
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Catch a new Pokemon every hour!
        </p>
      </div>

      {displayPokemon && (
        <div className="mb-4 flex flex-col md:flex-row gap-4 items-stretch">
            <Card className="flex-1 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700 h-25">
            <CardContent className="p-4 flex items-center gap-4 h-full">
                <img
                src={displayPokemon.sprite}
                alt={displayPokemon.pokemonName}
                className="w-20 h-20 object-contain"
                style={{ imageRendering: 'pixelated' }}
                />
                <div className="flex-1">
                <h3 className="text-xl font-bold capitalize text-gray-900 dark:text-gray-100 mb-1">
                    {displayPokemon.pokemonName}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                    #{displayPokemon.pokemonId}
                    </Badge>
                    {displayPokemon.types?.map(type => (
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

            <Card
            className={`md:w-auto ${canCatch
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700'
                : 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700'
            } h-25`}
            >
            <CardContent className="p-4 flex items-center gap-3 h-full">
                <Clock className={`w-8 h-8 ${canCatch ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} />
                <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {canCatch ? 'Status' : 'Next Pokemon'}
                </p>
                <p className={`text-lg font-bold font-mono ${canCatch ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {timeUntilNext}
                </p>
                </div>
            </CardContent>
            </Card>

            <div className="md:w-auto flex items-stretch h-25">
            <Button
                onClick={() => navigate('/pokedex')}
                size="lg"
                className="w-full md:w-auto h-full pokemon-font 
                bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 
                hover:from-blue-600 hover:via-purple-600 hover:to-pink-600
                dark:from-blue-800 dark:via-purple-800 dark:to-pink-800 
                text-white border border-blue-400 dark:border-blue-700 
                shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
            >
                <div className="text-left">
                <div className="font-bold">View Pokedex</div>
                </div>
            </Button>
            </div>
        </div>
        )}


      {/* Game Area */}
      <Card className="mb-6 overflow-hidden p-0 border-gray-700 dark:border-blue-900 border-2 rounded-4 shadow-none">
        <CardContent className="p-0 m-0">
          <div
            ref={containerRef}
            className="relative w-full h-[600px] overflow-hidden select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                touchAction: 'none',
                backgroundImage: `url(${forestBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
            >
            <div className="absolute top-10 left-10 w-20 h-12 bg-white/40 rounded-full blur-sm"></div>
            <div className="absolute top-20 right-20 w-32 h-16 bg-white/30 rounded-full blur-sm"></div>
            
            {dailyPokemon && !caught && canCatch && (
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

            {!caught && canCatch && (
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
                  {newBadges.length > 0 && (
                    <div className="mb-4 animate-pulse">
                      <p className="text-yellow-400 font-bold text-lg mb-2">New Badges Unlocked!</p>
                      <div className="flex justify-center gap-2 flex-wrap">
                        {newBadges.map(badge => (
                          <div key={badge.badgeId} className="bg-yellow-400/20 border border-yellow-400 px-3 py-1 rounded-full">
                            <span className="text-yellow-400 text-xs font-bold uppercase">{badge.badgeId.replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-200 animate-pulse">
                    Taking you to your Pokedex...
                  </p>
                </div>
              </div>
            )}

            {!canCatch && !caught && (
                <div
                className="absolute inset-0 flex items-center justify-center z-40"
                style={{
                    backgroundImage: `url(${forestBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: 'brightness(0.7)', // slightly darkens for readability
                }}
                >                <div className="text-center max-w-md px-4">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Come Back Soon!
                  </h2>
                  <p className="text-lg text-gray-200 mb-4">
                    Next Pokemon in {timeUntilNext}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => navigate('/pokedex')}
                      size="lg"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      View Your Pokedex
                    </Button>
                    <Button
                      onClick={handleReset}
                      size="lg"
                      variant="secondary"
                    >
                      Check Again
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!caught && canCatch && !isDragging && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-lg z-20">
                <p className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-200">
                  Drag the Pokeball and release to throw!
                </p>
              </div>
            )}

            {isDragging && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-20">
                <p className="text-sm md:text-base font-semibold">
                  Release to throw! 🎯
                </p>
              </div>
            )}

            {message && !caught && canCatch && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg max-w-md text-center z-20">
                <p className="font-semibold">{message}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyCatch;