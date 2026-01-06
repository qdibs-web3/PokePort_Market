const POKEMON_TYPES = {
  bug: [10, 11, 12, 13, 14, 15, 46, 47, 48, 49, 123, 127],
  rock: [74, 75, 76, 95, 138, 139, 140, 141, 142],
  ground: [27, 28, 50, 51, 104, 105, 111, 112],
  water: [7, 8, 9, 54, 55, 60, 61, 62, 72, 73, 79, 80, 86, 87, 90, 91, 98, 99, 116, 117, 118, 119, 120, 121, 129, 130, 131, 134, 138, 139, 140, 141],
  flying: [6, 12, 15, 16, 17, 18, 21, 22, 41, 42, 49, 83, 84, 85, 123, 130, 142, 144, 145, 146, 149],
  electric: [25, 26, 81, 82, 100, 101, 125, 135, 145],
  psychic: [63, 64, 65, 79, 80, 96, 97, 102, 103, 121, 122, 124, 150, 151],
  evolved: [2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 22, 24, 26, 28, 30, 31, 33, 34, 36, 38, 40, 42, 44, 45, 47, 49, 51, 53, 55, 57, 59, 61, 62, 64, 65, 67, 68, 70, 71, 73, 75, 76, 78, 80, 82, 85, 87, 89, 91, 93, 94, 97, 99, 101, 103, 105, 107, 110, 112, 117, 119, 121, 130, 134, 135, 136, 139, 141, 148, 149]
};

const BADGE_RULES = [
  { id: 'first_catch', check: (user) => user.caughtPokemon.length >= 1 },
  { id: 'novice_collector', check: (user) => user.caughtPokemon.length >= 10 },
  { id: 'kanto_explorer', check: (user) => user.caughtPokemon.length >= 25 },
  { id: 'rising_star', check: (user) => user.caughtPokemon.length >= 50 },
  { id: 'century_club', check: (user) => user.caughtPokemon.length >= 100 },
  { id: 'kanto_master', check: (user) => user.caughtPokemon.length >= 151 },
  { id: 'starter_squad', check: (user) => {
    const ids = user.caughtPokemon.map(p => p.pokemonId);
    return [1, 4, 7].every(id => ids.includes(id));
  }},
  { id: 'evolution_expert', check: (user) => {
    const ids = user.caughtPokemon.map(p => p.pokemonId);
    return POKEMON_TYPES.evolved.filter(id => ids.includes(id)).length >= 10;
  }},
  { id: 'forest_dweller', check: (user) => {
    const ids = user.caughtPokemon.map(p => p.pokemonId);
    return POKEMON_TYPES.bug.filter(id => ids.includes(id)).length >= 5;
  }},
  { id: 'mountain_hiker', check: (user) => {
    const ids = user.caughtPokemon.map(p => p.pokemonId);
    const rockGround = [...new Set([...POKEMON_TYPES.rock, ...POKEMON_TYPES.ground])];
    return rockGround.filter(id => ids.includes(id)).length >= 5;
  }},
  { id: 'swimmer', check: (user) => {
    const ids = user.caughtPokemon.map(p => p.pokemonId);
    return POKEMON_TYPES.water.filter(id => ids.includes(id)).length >= 10;
  }},
  { id: 'bird_watcher', check: (user) => {
    const ids = user.caughtPokemon.map(p => p.pokemonId);
    return POKEMON_TYPES.flying.filter(id => ids.includes(id)).length >= 10;
  }},
  { id: 'electrician', check: (user) => {
    const ids = user.caughtPokemon.map(p => p.pokemonId);
    return POKEMON_TYPES.electric.filter(id => ids.includes(id)).length >= 5;
  }},
  { id: 'psychic_master', check: (user) => {
    const ids = user.caughtPokemon.map(p => p.pokemonId);
    return POKEMON_TYPES.psychic.filter(id => ids.includes(id)).length >= 5;
  }},
  { id: 'ghost_hunter', check: (user) => {
    const ids = user.caughtPokemon.map(p => p.pokemonId);
    return [92, 93, 94].every(id => ids.includes(id));
  }},
  { id: 'dragon_tamer', check: (user) => {
    const ids = user.caughtPokemon.map(p => p.pokemonId);
    return [147, 148, 149].every(id => ids.includes(id));
  }},
  { id: 'legendary_finder', check: (user) => {
    const ids = user.caughtPokemon.map(p => p.pokemonId);
    return [144, 145, 146].some(id => ids.includes(id));
  }},
  { id: 'the_chosen_one', check: (user) => {
    const ids = user.caughtPokemon.map(p => p.pokemonId);
    return ids.includes(150);
  }},
  { id: 'hidden_myth', check: (user) => {
    const ids = user.caughtPokemon.map(p => p.pokemonId);
    return ids.includes(151);
  }},
  { id: 'daily_dedicated', check: (user) => {
    if (!user.caughtPokemon || user.caughtPokemon.length === 0) return false;
    const dates = user.caughtPokemon.map(p => new Date(p.caughtAt).toDateString());
    const uniqueDays = new Set(dates);
    return uniqueDays.size >= 7;
  }},
];

async function checkAndUnlockBadges(user) {
  const currentBadgeIds = (user.badges || []).map(b => b.badgeId);
  const newBadges = [];
  const now = new Date();

  for (const rule of BADGE_RULES) {
    if (!currentBadgeIds.includes(rule.id)) {
      if (rule.check(user)) {
        newBadges.push({
          badgeId: rule.id,
          unlockedAt: now
        });
      }
    }
  }

  if (newBadges.length > 0) {
    // Use findOneAndUpdate to avoid VersionError
    const User = require('../_models/User');
    await User.findOneAndUpdate(
      { _id: user._id },
      { $push: { badges: { $each: newBadges } } }
    );
    return newBadges;
  }

  return [];
}

module.exports = {
  checkAndUnlockBadges,
  BADGE_RULES
};