import { useState, useEffect, useMemo, useRef } from 'react';

const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_COLORS = { '♠': '#1a1a2e', '♥': '#be3455', '♦': '#be3455', '♣': '#1a1a2e' };
const SUIT_ACCENTS = { '♠': '#a78bfa', '♥': '#fb7185', '♦': '#fbbf24', '♣': '#34d399' };
const SUIT_GLOW = { '♠': 'rgba(167, 139, 250, 1)', '♥': 'rgba(251, 113, 133, 1)', '♦': 'rgba(251, 191, 36, 1)', '♣': 'rgba(52, 211, 153, 1)' };
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Match tier system — 13 named tiers + ???
// Each match count gets its own tier. Names describe the phenomenon, not rarity.
// Colours progress cool → warm → white-hot.
const RARITY_TIERS = {
  ghost:        { name: 'Ghost',        color: '#c4e0f9', glow: 'rgba(196, 224, 249, 0.4)' },
  trace:        { name: 'Trace',        color: '#6b7280', glow: 'rgba(107, 114, 128, 0.4)' },
  glimmer:      { name: 'Glimmer',      color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.4)' },
  echo:         { name: 'Echo',         color: '#6ee7b7', glow: 'rgba(110, 231, 183, 0.4)' },
  signal:       { name: 'Signal',       color: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.4)' },
  resonance:    { name: 'Resonance',    color: '#a78bfa', glow: 'rgba(167, 139, 250, 0.4)' },
  nova:         { name: 'Nova',         color: '#c084fc', glow: 'rgba(192, 132, 252, 0.4)' },
  anomaly:      { name: 'Anomaly',      color: '#fb7185', glow: 'rgba(251, 113, 133, 0.4)' },
  convergence:  { name: 'Convergence',  color: '#f9a8d4', glow: 'rgba(249, 168, 212, 0.4)' },
  singularity:  { name: 'Singularity',  color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.5)' },
  contact:      { name: 'Contact',      color: '#fde68a', glow: 'rgba(253, 230, 138, 0.5)' },
  entanglement: { name: 'Entanglement', color: '#fef3c7', glow: 'rgba(254, 243, 199, 0.5)' },
  impossible:   { name: 'Impossible',   color: '#ffffff', glow: 'rgba(255, 255, 255, 0.5)', isGradient: true },
  unknown:      { name: '???',          color: '#ffffff', glow: 'rgba(255, 255, 255, 0.6)', isGradient: true },
};

const getTierForMatch = (count) => {
  const tiers = [
    'ghost', 'trace', 'glimmer', 'echo', 'signal',
    'resonance', 'nova', 'anomaly', 'convergence',
    'singularity', 'contact', 'entanglement', 'impossible',
  ];
  if (count >= 13) return 'unknown';
  return tiers[count] || 'ghost';
};

const getOddsForMatch = (count) => {
  const odds = {
    0: '1 in 3', 1: '1 in 3', 2: '1 in 5',
    3: '1 in 16', 4: '1 in 65', 5: '1 in 326',
    6: '1 in 1,960', 7: '1 in 13,700', 8: '1 in 110,000',
    9: '1 in 1,000,000', 10: '1 in 10,000,000',
    11: '1 in 100,000,000', 12: '1 in 1,000,000,000',
  };
  return odds[count] || 'Beyond comprehension';
};

const generateMatchPositions = (matchCount) => {
  const positions = new Set();
  while (positions.size < matchCount) {
    positions.add(Math.floor(Math.random() * 52));
  }
  return positions;
};

// Finds are now detected server-side by finds-engine.js and returned in the API response.

// Factory position labels — names for how many cards landed in their factory-order position
const FACTORY_LABELS = {
  0: { name: 'Blank Slate', desc: 'No cards remember home' },
  1: { name: null, desc: null },
  2: { name: 'Déjà Vu', desc: 'Two cards found their way back' },
  3: { name: 'Homing', desc: 'Three cards returned' },
  4: { name: 'Memory', desc: 'Four cards remember' },
  5: { name: 'Recall', desc: 'Five cards home' },
  6: { name: 'Factory Ghost', desc: 'The deck remembers' },
};

// Achievement definitions - now including poker hands
const ACHIEVEMENTS = [
  // Streak achievements
  { id: 'first-step', name: 'First Step', icon: '👣', description: 'Complete your first shuffle', category: 'streak', unlocked: true },
  { id: 'week-walker', name: 'Week Walker', icon: '🚶', description: '7 day streak', category: 'streak', unlocked: true },
  { id: 'month-maven', name: 'Month Maven', icon: '📅', description: '30 day streak', category: 'streak', unlocked: false },
  { id: 'quarter-quest', name: 'Quarter Quest', icon: '🗓️', description: '90 day streak', category: 'streak', unlocked: false },
  { id: 'the-long-walk', name: 'The Long Walk', icon: '🏔️', description: '365 day streak - a full year of the experiment', category: 'streak', unlocked: false },
  
  // Match achievements
  { id: 'close-call', name: 'Close Call', icon: '🎯', description: 'Match 5+ positions', category: 'match', unlocked: true },
  { id: 'lucky-seven', name: 'Lucky Seven', icon: '🍀', description: 'Match 7+ positions', category: 'match', unlocked: false },
  { id: 'near-miss', name: 'Near Miss', icon: '💫', description: 'Match 8+ positions', category: 'match', unlocked: false },
  { id: 'the-impossible', name: 'The Impossible', icon: '⚡', description: 'Match 9+ positions', category: 'match', unlocked: false },
  
  // Poker hand achievements
  { id: 'pair-up', name: 'Pair Up', icon: '🃏', description: 'A pair appeared consecutively in your shuffle', category: 'poker', unlocked: true },
  { id: 'triple-threat', name: 'Triple Threat', icon: '🎲', description: 'Three of a kind appeared consecutively', category: 'poker', unlocked: false },
  { id: 'double-double', name: 'Double Double', icon: '✌️', description: 'Two pairs appeared consecutively (AA BB pattern)', category: 'poker', unlocked: false },
  { id: 'straight-path', name: 'The Straight Path', icon: '📈', description: '5 cards in rank order appeared consecutively', category: 'poker', unlocked: false },
  { id: 'flush-fortune', name: 'Flush of Fortune', icon: '💎', description: '5 cards of the same suit appeared consecutively', category: 'poker', unlocked: false },
  { id: 'lightning-strike', name: 'Lightning Strike', icon: '⚡', description: 'Four of a kind appeared consecutively', category: 'poker', unlocked: false },
  { id: 'straight-flush', name: 'Straight Flush', icon: '🌟', description: '5 consecutive cards of the same suit in rank order', category: 'poker', unlocked: false },
  { id: 'royal-witness', name: 'Royal Witness', icon: '👑', description: 'A royal flush appeared in your shuffle - the rarest of all hands', category: 'poker', unlocked: false, legendary: true },
  
  // Milestone achievements
  { id: 'early-adopter', name: 'Early Adopter', icon: '🌱', description: 'Joined in the first month of the experiment', category: 'milestone', unlocked: true },
  { id: 'century-club', name: 'Century Club', icon: '💯', description: 'Complete 100 shuffles', category: 'milestone', unlocked: false },
  { id: 'the-millionth', name: 'The Millionth', icon: '🎰', description: 'Your shuffle was a milestone number', category: 'milestone', unlocked: false },
  
  // Special moment achievements
  { id: 'witness', name: 'Witness', icon: '👁️', description: 'You were present when a new all-time record was set', category: 'special', unlocked: false },
  { id: 'global-citizen', name: 'Global Citizen', icon: '🌍', description: 'Matched with someone from a different continent', category: 'special', unlocked: true },
  { id: 'night-owl', name: 'Night Owl', icon: '🦉', description: 'Shuffled between midnight and 4am', category: 'special', unlocked: false },
  { id: 'early-bird', name: 'Early Bird', icon: '🐦', description: 'Shuffled at the crack of dawn', category: 'special', unlocked: false },
  { id: 'todays-leader', name: "Today's Leader", icon: '🏅', description: 'Had the closest match of the day', category: 'special', unlocked: false },
];

const generateDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}${suit}` });
    }
  }
  return deck;
};
const parseCard = (cardString) => {
  const suit = cardString.slice(-1);
  const rank = cardString.slice(0, -1);
  return { suit, rank, id: cardString };
};
const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate a fake verification hash for demo
const generateHash = () => {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

// ============ STAR FIELD BACKGROUND ============
// Generates a static star field to create depth in the background
const StarField = () => {
  const stars = useMemo(() => {
    const result = [];
    const count = 22;
    
    // Simple hash: takes a seed, returns 0–1 with no visible pattern
    const hash = (n) => {
      let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    
    for (let i = 0; i < count; i++) {
      result.push({
        x: hash(i * 2) * 96 + 2,       // 2–98% (avoid edges)
        y: hash(i * 2 + 1) * 96 + 2,
        size: 1 + hash(i * 3) * 1.2,    // 1–2.2px
        duration: 5 + hash(i * 7) * 7,  // 5–12s per cycle
        delay: hash(i * 11) * 10,       // 0–10s stagger
      });
    }
    return result;
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0,
    }}>
      {stars.map((star, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
};

// ============ LOGO COMPONENT ============
// Swap the text wordmark for an <img> when you have a designed logo.
// Just replace the inner <span> with: <img src="/logo.svg" alt="Shuffled" style={{ height: s.logoHeight }} />
const Logo = ({ size = 'large' }) => {
  const sizes = {
    header: { logoSize: '18px', letterSpacing: '3px', weight: '600', shadow: 'none' },
    compact: { logoSize: '16px', letterSpacing: '3px', weight: '600', shadow: '0 2px 12px rgba(0,0,0,0.5)' },
    medium: { logoSize: '42px', letterSpacing: '4px', weight: '300', shadow: '0 6px 40px rgba(0,0,0,0.7), 0 0 80px rgba(167, 139, 250, 0.12)' },
    large: { logoSize: '56px', letterSpacing: '4px', weight: '300', shadow: '0 8px 50px rgba(0,0,0,0.8), 0 0 100px rgba(167, 139, 250, 0.15)' },
  };
  const s = sizes[size];
  
  return (
    <span style={{
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      fontSize: s.logoSize,
      fontWeight: s.weight,
      color: '#ffffff',
      letterSpacing: s.letterSpacing,
      textTransform: 'uppercase',
      lineHeight: 1,
      textShadow: s.shadow,
    }}>
      Shuffled
    </span>
  );
};

// Floating suit icons — atmospheric element, used on pre-shuffle screens
const FloatingSuits = ({ size = 'large' }) => {
  const sizeMap = { large: '36px', medium: '24px' };
  const gapMap = { large: '12px', medium: '8px' };
  const glowSize = size === 'large' ? '12px' : '10px';
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: gapMap[size],
      fontSize: sizeMap[size],
      position: 'relative',
    }}>
      {/* Elevation shadow beneath the floating suits */}
      <div style={{
        position: 'absolute',
        bottom: size === 'large' ? '-18px' : '-12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: size === 'large' ? '160px' : '100px',
        height: size === 'large' ? '20px' : '14px',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%)',
        filter: 'blur(6px)',
        pointerEvents: 'none',
      }} />
      {SUITS.map((suit, i) => (
        <span 
          key={suit} 
          style={{ 
            color: SUIT_ACCENTS[suit], 
            filter: `drop-shadow(0 0 ${glowSize} ${SUIT_GLOW[suit]})`, 
            animation: `float 3s ease-in-out ${i * 0.2}s infinite`,
          }}
        >
          {suit}
        </span>
      ))}
    </div>
  );
};

// Card component with flip animation + highlight support for Finds
const Card = ({ card, index, isRevealed, isShuffling, isHighlighted = false, isDimmed = false, isMatched = false, matchTier = null, matchGlowDelay = 0 }) => {
  const delay = index * 0.06;
  const flipDuration = 0.6;
  const suitDelay = delay + flipDuration + 0.15;
  const glowDelay = delay + flipDuration;
  const rotationOffset = (index % 5) * 0.8;
  
  // Match glow uses tier color, distinct from find highlight
  const matchColor = matchTier ? RARITY_TIERS[matchTier]?.color || '#60a5fa' : '#60a5fa';
  const matchGlow = matchTier ? RARITY_TIERS[matchTier]?.glow || 'rgba(96, 165, 250, 0.4)' : 'rgba(96, 165, 250, 0.4)';
  
  return (
    <div style={{ 
      width: '54px', 
      height: '76px', 
      perspective: '1000px', 
      position: 'relative',
      transition: 'transform 0.3s ease, opacity 0.3s ease',
      transform: isHighlighted ? 'translateY(-8px) scale(1.08)' : 'translateY(0) scale(1)',
      opacity: isDimmed ? 0.2 : 1,
      zIndex: isHighlighted ? 10 : isMatched ? 5 : 1,
    }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: isShuffling ? 'transform 0.1s ease' : `transform ${flipDuration}s cubic-bezier(0.4, 0.0, 0.2, 1) ${delay}s`,
          transform: isRevealed ? 'rotateY(180deg)' : isShuffling ? `rotateY(${Math.sin(index * 0.7) * 15}deg) rotateX(${Math.cos(index * 0.5) * 10}deg)` : 'rotateY(0deg)',
          zIndex: 1,
        }}
      >
        {/* Card Back */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '8px',
            backgroundColor: '#1a1a2e',
            border: '2px solid #3d3d5c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{
            width: '40px',
            height: '56px',
            border: '1px solid #4d4d6d',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #252542 0%, #1a1a2e 100%)',
          }}>
            <span style={{ fontSize: '18px', color: '#6d6d8f', animation: isShuffling ? 'shimmerStar 0.4s ease infinite' : 'none' }}>✦</span>
          </div>
        </div>
        
        {/* Card Front */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: '8px',
            padding: '2px',
            background: 'transparent',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-50%',
              background: card ? `conic-gradient(from 0deg, transparent 0%, ${SUIT_ACCENTS[card.suit]} 8%, ${SUIT_ACCENTS[card.suit]} 40%, transparent 50%, transparent 100%)` : 'transparent',
              opacity: isRevealed ? 0.8 : 0,
              transition: `opacity 0.5s ease ${glowDelay}s`,
              animation: isRevealed ? `borderChase 3s linear ${glowDelay + rotationOffset}s infinite` : 'none',
              zIndex: 0,
            }}
          />
          
          {/* Highlight ring for finds */}
          {isHighlighted && (
            <div
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '12px',
                border: '2px solid #fff',
                boxShadow: '0 0 20px rgba(255,255,255,0.6), 0 8px 32px rgba(0,0,0,0.4)',
                zIndex: 2,
                pointerEvents: 'none',
              }}
            />
          )}
          
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '6px',
              backgroundColor: '#faf9f6',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: '700',
              color: card ? SUIT_COLORS[card.suit] : '#1a1a2e',
              boxShadow: isHighlighted 
                ? '0 8px 32px rgba(255,255,255,0.2)' 
                : '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1,
            }}
          >
            {card && (
              <>
                <span style={{ position: 'absolute', top: '4px', left: '5px', fontSize: '14px', lineHeight: 1, opacity: 0, animation: isRevealed ? `fadeIn 0.3s ease ${suitDelay}s forwards` : 'none' }}>{card.rank}</span>
                <span style={{ fontSize: '28px', marginTop: '2px', opacity: 0, animation: isRevealed ? `suitPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${suitDelay}s forwards` : 'none' }}>{card.suit}</span>
                <span style={{ position: 'absolute', bottom: '4px', right: '5px', fontSize: '14px', transform: 'rotate(180deg)', lineHeight: 1, opacity: 0, animation: isRevealed ? `fadeIn 0.3s ease ${suitDelay}s forwards` : 'none' }}>{card.rank}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Match glow — on outer wrapper, outside overflow:hidden */}
      {isMatched && !isHighlighted && (
        <div
          style={{
            position: 'absolute',
            inset: '-3px',
            borderRadius: '11px',
            border: `2px solid ${matchColor}`,
            boxShadow: `0 0 12px ${matchGlow}, 0 0 24px ${matchGlow}`,
            zIndex: 2,
            pointerEvents: 'none',
            opacity: 0,
            animation: `fadeIn 0.6s ease ${matchGlowDelay}s forwards`,
          }}
        />
      )}
    </div>
  );
};

// Persistent Header with Streak
const Header = ({ isFirstTime, streak, showFull = true, onOpenProvenance }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(180deg, rgba(13,13,26,0.95) 0%, rgba(13,13,26,0) 100%)',
    zIndex: 50,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
      <Logo size="header" />
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* How it works link */}
      <button
        onClick={onOpenProvenance}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '12px',
          cursor: 'pointer',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        How it works
      </button>
      
      {!isFirstTime && showFull && (
        <>
          {/* Live experiment counter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            borderRadius: '20px',
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#34d399',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '500' }}>2,847 today</span>
          </div>
          
          {/* Streak indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'rgba(251, 113, 133, 0.1)',
            border: '1px solid rgba(251, 113, 133, 0.2)',
            borderRadius: '20px',
          }}>
            <span style={{ fontSize: '14px' }}>🔥</span>
            <span style={{ fontSize: '13px', color: '#fb7185', fontWeight: '600' }}>{streak}</span>
          </div>
        </>
      )}
    </div>
  </div>
);

// How It Works / Provenance Panel
const ProvenancePanel = ({ isOpen, onClose, shuffleHash, dailySeed }) => {
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #151528 0%, #0d0d1a 100%)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '85vh',
        overflow: 'auto',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'linear-gradient(180deg, #151528 0%, #151528 100%)',
          zIndex: 10,
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '28px',
              fontWeight: '400',
              color: '#fff',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span>🔍</span> How It Works
            </h2>
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.4)',
              margin: '4px 0 0',
            }}>
              Transparency and verification
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ padding: '24px' }}>
          {/* Trust statement */}
          <div style={{
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.7)',
              margin: 0,
              lineHeight: 1.7,
            }}>
              Every shuffle in this experiment is <strong style={{ color: '#34d399' }}>cryptographically verified</strong> and 
              publicly auditable. We can't manipulate results, and neither can you. Here's exactly how it works.
            </p>
          </div>
          
          {/* How it works sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Step 1: Entropy */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(167, 139, 250, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: '#a78bfa',
                  fontWeight: '600',
                }}>1</div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>True Random Entropy</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                We source randomness from <strong>atmospheric noise</strong> via random.org—actual 
                radio static from the physical world. This is combined with the precise millisecond 
                you pressed the button, making your shuffle uniquely yours.
              </p>
              
              {dailySeed && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                    TODAY'S PUBLIC SEED (from random.org)
                  </div>
                  <div style={{ fontSize: '11px', color: '#a78bfa', wordBreak: 'break-all' }}>
                    {dailySeed}
                  </div>
                </div>
              )}
            </div>
            
            {/* Step 2: Algorithm */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(251, 113, 133, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: '#fb7185',
                  fontWeight: '600',
                }}>2</div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Fisher-Yates Shuffle</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                We use the <strong>Fisher-Yates algorithm</strong>—mathematically proven to give every 
                possible arrangement exactly equal probability. This is the gold standard for unbiased 
                shuffling, used in cryptography and scientific research.
              </p>
              <div style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Algorithm is</span>
                <a 
                  href="#" 
                  style={{ 
                    fontSize: '12px', 
                    color: '#fb7185',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  open source on GitHub →
                </a>
              </div>
            </div>
            
            {/* Step 3: Commit-Reveal */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(251, 191, 36, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: '#fbbf24',
                  fontWeight: '600',
                }}>3</div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Commit-Reveal Verification</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                Before your cards flip, we publish a <strong>cryptographic hash</strong> of the result. 
                After the reveal, you can verify the hash matches. This proves we didn't change anything 
                after the fact—the shuffle was locked in before you saw it.
              </p>
              
              {shuffleHash && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                    YOUR SHUFFLE'S VERIFICATION HASH (SHA-256)
                  </div>
                  <div style={{ fontSize: '11px', color: '#fbbf24', wordBreak: 'break-all' }}>
                    {shuffleHash}
                  </div>
                  <button style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: 'rgba(251, 191, 36, 0.2)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '6px',
                    color: '#fbbf24',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}>
                    Verify This Shuffle →
                  </button>
                </div>
              )}
            </div>
            
            {/* Step 4: Public Audit */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(52, 211, 153, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: '#34d399',
                  fontWeight: '600',
                }}>4</div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Public Audit Log</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                Every shuffle is logged with its seed, timestamp, and hash. Anyone can audit any shuffle 
                in the experiment's history. The complete log is publicly accessible.
              </p>
              <div style={{
                marginTop: '12px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(52, 211, 153, 0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#34d399',
                }}>
                  847,293 shuffles verified
                </div>
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(52, 211, 153, 0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#34d399',
                }}>
                  0 anomalies detected
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom note */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(167, 139, 250, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(167, 139, 250, 0.2)',
          }}>
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.6)',
              margin: 0,
              lineHeight: 1.6,
              textAlign: 'center',
            }}>
              <strong style={{ color: '#a78bfa' }}>Fun fact:</strong> A properly implemented digital shuffle 
              is actually <em>more</em> random than a human shuffle. Studies show you need 7+ riffle shuffles 
              to truly randomize a physical deck.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Achievement Badge Component
const AchievementBadge = ({ achievement, size = 'medium' }) => {
  const sizes = {
    small: { badge: 40, icon: 16, ring: 44 },
    medium: { badge: 56, icon: 24, ring: 62 },
    large: { badge: 72, icon: 32, ring: 80 },
  };
  const s = sizes[size];
  
  return (
    <div style={{
      position: 'relative',
      width: s.ring,
      height: s.ring,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {achievement.unlocked && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: achievement.legendary 
            ? 'conic-gradient(from 0deg, #fbbf24, #fb7185, #a78bfa, #fbbf24)'
            : 'conic-gradient(from 0deg, #a78bfa, #fb7185, #fbbf24, #34d399, #a78bfa)',
          animation: 'badgeRotate 4s linear infinite',
          opacity: achievement.legendary ? 0.9 : 0.6,
        }} />
      )}
      
      <div style={{
        width: s.badge,
        height: s.badge,
        borderRadius: '50%',
        background: achievement.unlocked 
          ? achievement.legendary 
            ? 'linear-gradient(135deg, #2d2a1a, #1a1a2e)'
            : 'linear-gradient(135deg, #1a1a2e, #252542)' 
          : 'linear-gradient(135deg, #0d0d1a, #151528)',
        border: achievement.unlocked 
          ? 'none' 
          : '2px dashed rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: s.icon,
        filter: achievement.unlocked ? 'none' : 'grayscale(100%)',
        opacity: achievement.unlocked ? 1 : 0.4,
        position: 'relative',
        zIndex: 1,
      }}>
        {achievement.unlocked ? achievement.icon : '🔒'}
      </div>
    </div>
  );
};

// Achievement Card Component
const AchievementCard = ({ achievement }) => (
  <div style={{
    background: achievement.unlocked 
      ? achievement.legendary
        ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 113, 133, 0.05))'
        : 'rgba(255, 255, 255, 0.03)' 
      : 'rgba(0, 0, 0, 0.2)',
    border: achievement.unlocked 
      ? achievement.legendary
        ? '1px solid rgba(251, 191, 36, 0.3)'
        : '1px solid rgba(255, 255, 255, 0.08)' 
      : '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    opacity: achievement.unlocked ? 1 : 0.6,
    transition: 'all 0.3s ease',
  }}>
    <AchievementBadge achievement={achievement} size="medium" />
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: achievement.unlocked 
          ? achievement.legendary ? '#fbbf24' : '#fff' 
          : 'rgba(255,255,255,0.4)',
        marginBottom: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {achievement.name}
        {achievement.legendary && <span style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(251,191,36,0.2)', padding: '2px 6px', borderRadius: '4px' }}>LEGENDARY</span>}
      </div>
      <div style={{
        fontSize: '12px',
        color: achievement.unlocked ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
        lineHeight: 1.4,
      }}>
        {achievement.description}
      </div>
    </div>
    {achievement.unlocked && (
      <div style={{
        fontSize: '10px',
        color: '#34d399',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: '600',
      }}>
        Earned
      </div>
    )}
  </div>
);

// Achievements Panel
const AchievementsPanel = ({ isOpen, onClose }) => {
  const categories = [
    { id: 'streak', name: 'Dedication', icon: '🔥' },
    { id: 'match', name: 'Precision', icon: '🎯' },
    { id: 'poker', name: 'Poker Hands', icon: '🃏' },
    { id: 'milestone', name: 'Milestones', icon: '🏆' },
    { id: 'special', name: 'Special', icon: '✨' },
  ];
  
  const [activeCategory, setActiveCategory] = useState('streak');
  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #151528 0%, #0d0d1a 100%)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '28px',
              fontWeight: '400',
              color: '#fff',
              margin: 0,
            }}>
              Achievements
            </h2>
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.4)',
              margin: '4px 0 0',
            }}>
              {unlockedCount} of {ACHIEVEMENTS.length} unlocked
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
        
        {/* Progress bar */}
        <div style={{ padding: '0 24px', marginTop: '16px' }}>
          <div style={{
            height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%`,
              background: 'linear-gradient(90deg, #a78bfa, #fb7185, #fbbf24, #34d399)',
              borderRadius: '2px',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
        
        {/* Category tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '20px 24px',
          overflowX: 'auto',
        }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                border: 'none',
                background: activeCategory === cat.id 
                  ? 'rgba(167, 139, 250, 0.2)' 
                  : 'rgba(255,255,255,0.03)',
                color: activeCategory === cat.id 
                  ? '#a78bfa' 
                  : 'rgba(255,255,255,0.5)',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
        
        {/* Achievement list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {ACHIEVEMENTS
            .filter(a => a.category === activeCategory)
            .map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, subtext, accentColor, icon }) => (
  <div style={{ position: 'relative' }}>
    {/* Shadow pool beneath card */}
    <div style={{
      position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)',
      width: '80%', height: '16px',
      background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
      filter: 'blur(8px)', pointerEvents: 'none',
    }} />
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderTop: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '16px',
      padding: '20px 24px',
      textAlign: 'center',
      minWidth: '150px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
      {icon && <div style={{ fontSize: '20px', marginBottom: '8px' }}>{icon}</div>}
      <div style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: '32px',
        fontWeight: '600',
        color: accentColor,
        marginBottom: '4px',
        textShadow: `0 0 30px ${accentColor}40`,
      }}>
        {value}
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>{label}</div>
      {subtext && <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{subtext}</div>}
    </div>
  </div>
);

const ShimmerBar = ({ isActive }) => (
  <div style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, #a78bfa, #fb7185, #fbbf24, #34d399, #a78bfa)',
    backgroundSize: '200% 100%',
    animation: isActive ? 'shimmer 1.5s linear infinite' : 'none',
    opacity: isActive ? 1 : 0,
    transition: 'opacity 0.3s ease',
    borderRadius: '0 0 50px 50px',
  }} />
);

// Verification Hash Display (shows during/after shuffle)
const VerificationHash = ({ hash, isVisible }) => (
  <div style={{
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
    transition: 'all 0.3s ease',
    marginBottom: '16px',
  }}>
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: 'rgba(251, 191, 36, 0.1)',
      border: '1px solid rgba(251, 191, 36, 0.2)',
      borderRadius: '20px',
    }}>
      <span style={{ fontSize: '12px' }}>🔒</span>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Verification:</span>
      <span style={{ fontSize: '11px', color: '#fbbf24', fontFamily: 'monospace' }}>
        {hash.substring(0, 8)}...{hash.substring(hash.length - 8)}
      </span>
    </div>
  </div>
);

// ============ MATCH GRID (52-position visualization) ============
const MatchGrid = ({ matchCount, matchPositions }) => {
  const tierKey = getTierForMatch(matchCount);
  const tier = RARITY_TIERS[tierKey];
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(13, 1fr)',
      gridTemplateRows: 'repeat(4, 1fr)',
      gap: '4px',
      padding: '16px 14px',
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '14px',
      width: '100%',
      maxWidth: '340px',
      margin: '0 auto',
    }}>
      {Array.from({ length: 52 }, (_, i) => {
        const isMatch = matchPositions.has(i);
        return (
          <div
            key={i}
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: '3px',
              background: isMatch 
                ? tier.isGradient 
                  ? 'linear-gradient(135deg, #a78bfa, #fb7185, #fbbf24)'
                  : tier.color
                : 'rgba(255,255,255,0.08)',
              boxShadow: isMatch ? `0 0 8px ${tier.glow}` : 'none',
            }}
          />
        );
      })}
    </div>
  );
};

// ============ FIND BADGE (individual find in the finds bar) ============
const FindBadge = ({ find, isActive, onHover, onLeave }) => (
  <div
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
    style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 14px',
      background: isActive 
        ? `linear-gradient(135deg, ${find.color}30, ${find.color}15)`
        : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isActive ? find.color : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
      boxShadow: isActive ? `0 4px 16px ${find.color}30` : 'none',
    }}
  >
    {find.isNew && (
      <div style={{
        position: 'absolute',
        top: '-6px',
        right: '-6px',
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        color: '#000',
        fontSize: '8px',
        fontWeight: '700',
        padding: '2px 6px',
        borderRadius: '6px',
        letterSpacing: '0.5px',
        boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
      }}>
        NEW
      </div>
    )}
    {!find.isNew && (
      <div style={{
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        width: '16px',
        height: '16px',
        background: 'rgba(52, 211, 153, 0.2)',
        border: '1px solid rgba(52, 211, 153, 0.4)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        color: '#34d399',
      }}>
        ✓
      </div>
    )}
    <span style={{ fontSize: '18px' }}>{find.icon}</span>
    <div>
      <div style={{ fontSize: '13px', fontWeight: '600', color: isActive ? '#fff' : 'rgba(255,255,255,0.8)', lineHeight: 1.2 }}>
        {find.name}
      </div>
      <div style={{ fontSize: '10px', color: isActive ? find.color : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {find.rarity}
      </div>
    </div>
  </div>
);

// ============ FINDS BAR (horizontal row of find badges) ============
// ============ FACTORY POSITION INDICATOR ============
const FactoryIndicator = ({ count }) => {
  if (count === null || count === undefined) return null;
  const label = FACTORY_LABELS[count] || FACTORY_LABELS[6];
  const isNotable = count >= 3;
  const isSpecial = count >= 4;
  const hasLabel = count >= 2 && label?.name;
  const isBlankSlate = count === 0;

  const textColor = isSpecial
    ? '#c4e0f9'
    : isNotable
      ? 'rgba(196, 224, 249, 0.75)'
      : count >= 2
        ? 'rgba(196, 224, 249, 0.55)'
        : 'rgba(255,255,255,0.3)';

  const bgOpacity = isSpecial ? 0.12 : isNotable ? 0.07 : 0.03;
  const borderOpacity = isSpecial ? 0.25 : isNotable ? 0.15 : 0.06;
  const glowAmount = isSpecial ? '0 0 16px rgba(196, 224, 249, 0.15)' : 'none';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: isNotable ? '8px 14px' : '8px 12px',
      background: `rgba(196, 224, 249, ${bgOpacity})`,
      border: `1px solid rgba(196, 224, 249, ${borderOpacity})`,
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      boxShadow: glowAmount,
      position: 'relative',
    }}>
      {/* Frost shimmer for 4+ */}
      {isSpecial && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(196,224,249,0.08) 0%, transparent 40%, rgba(196,224,249,0.05) 60%, transparent 100%)',
          backgroundSize: '200% 200%',
          animation: 'frostShimmer 4s ease infinite',
          pointerEvents: 'none',
        }} />
      )}

      <span style={{
        fontSize: '14px',
        opacity: count >= 2 ? 1 : 0.5,
        filter: isSpecial ? 'drop-shadow(0 0 4px rgba(196, 224, 249, 0.5))' : 'none',
      }}>
        🏠
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: isNotable ? '16px' : '14px',
            fontWeight: '600',
            color: textColor,
            transition: 'all 0.3s ease',
            textShadow: isSpecial ? '0 0 10px rgba(196, 224, 249, 0.3)' : 'none',
          }}>
            {count}
          </span>
          <span style={{
            fontSize: '11px',
            color: count >= 2 ? 'rgba(196, 224, 249, 0.35)' : 'rgba(255,255,255,0.2)',
          }}>
            {count === 1 ? 'card home' : 'cards home'}
          </span>
        </div>
        {(hasLabel || isBlankSlate) && (
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '10px',
            fontStyle: 'italic',
            color: isSpecial
              ? 'rgba(196, 224, 249, 0.6)'
              : isNotable
                ? 'rgba(196, 224, 249, 0.4)'
                : 'rgba(196, 224, 249, 0.3)',
            letterSpacing: '0.3px',
          }}>
            {isBlankSlate ? 'Blank Slate' : label.name}
          </span>
        )}
      </div>
    </div>
  );
};

const FindsBar = ({ finds, activeFind, setActiveFind, isVisible, onReplay, showReplayBtn, factoryCount }) => {
  if (!finds || finds.length === 0) return null;
  const newCount = finds.filter(f => f.isNew).length;
  
  return (
    <div style={{ position: 'relative', marginBottom: '28px' }}>
      {/* Shadow beneath */}
      <div style={{
        position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)',
        width: '70%', height: '16px',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
        filter: 'blur(8px)', pointerEvents: 'none',
      }} />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.5s ease',
        flexWrap: 'wrap',
        position: 'relative',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingRight: '12px',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          marginRight: '4px',
        }}>
          <span style={{ fontSize: '16px' }}>✨</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', lineHeight: 1.2 }}>
              {finds.length} Find{finds.length !== 1 ? 's' : ''}
            </div>
            {newCount > 0 && (
              <div style={{ fontSize: '10px', color: '#fbbf24' }}>{newCount} new!</div>
            )}
          </div>
        </div>
        {finds.map((find) => (
          <FindBadge
            key={find.id}
            find={find}
            isActive={activeFind === find.id}
            onHover={() => setActiveFind(find.id)}
            onLeave={() => setActiveFind(null)}
          />
        ))}
        
        {/* Divider before factory stat */}
        {factoryCount !== null && factoryCount !== undefined && (
          <>
            <div style={{
              width: '1px', height: '24px',
              background: 'rgba(196, 224, 249, 0.12)',
              marginLeft: '4px',
            }} />
            <FactoryIndicator count={factoryCount} />
          </>
        )}
        
        {/* Watch again button — fades in after a beat */}
        {onReplay && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            opacity: showReplayBtn ? 1 : 0,
            transform: showReplayBtn ? 'translateX(0)' : 'translateX(6px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            pointerEvents: showReplayBtn ? 'auto' : 'none',
          }}>
            <div style={{
              width: '1px',
              height: '24px',
              background: 'rgba(255,255,255,0.1)',
              marginLeft: '4px',
            }} />
            <button
              onClick={onReplay}
              style={{
                background: 'rgba(167, 139, 250, 0.08)',
                border: '1px solid rgba(167, 139, 250, 0.2)',
                borderRadius: '50px',
                padding: '6px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.background = 'rgba(167, 139, 250, 0.15)'; 
                e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.35)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(167, 139, 250, 0.2)';
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.background = 'rgba(167, 139, 250, 0.08)'; 
                e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ 
                fontSize: '13px', 
                color: '#a78bfa',
                display: 'inline-block',
              }}>↻</span>
              <span style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '12px',
                fontStyle: 'italic',
                color: '#a78bfa',
                opacity: 0.8,
              }}>
                Watch again
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============ FIRST TIME VISITOR VIEW ============
const FirstTimeView = ({ onShuffle, isShuffling, shuffleHash }) => (
  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '520px', padding: '0 20px' }}>
    <div style={{ marginBottom: '32px' }}>
      <FloatingSuits size="large" />
    </div>
    
    <h1 style={{ margin: '0 0 64px 0' }}>
      <Logo size="large" />
    </h1>
    
    {/* ---- BLOCK 1: The scale + the certainty ---- */}
    <div style={{
      position: 'relative',
      marginBottom: '44px',
      padding: '0 8px',
    }}>
      {/* Depth glow behind text block */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        height: '160%',
        background: 'radial-gradient(ellipse, rgba(167, 139, 250, 0.06) 0%, transparent 65%)',
        pointerEvents: 'none',
        filter: 'blur(30px)',
      }} />
      {/* Shadow beneath — implies elevation */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '70%',
        height: '24px',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
        filter: 'blur(10px)',
        pointerEvents: 'none',
      }} />
      
      <p style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: '21px',
        fontWeight: '300',
        fontStyle: 'italic',
        color: 'rgba(255,255,255,0.55)',
        margin: 0,
        lineHeight: 1.8,
        position: 'relative',
        textShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>
        There are more ways to arrange a deck of cards than atoms in our solar system. No two true shuffles have ever been the same — and none ever will be.
      </p>
    </div>
    
    {/* ---- BLOCK 2: The hook + the mechanism ---- */}
    <div style={{
      marginBottom: '52px',
      padding: '0 8px',
    }}>
      <p style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: '24px',
        fontWeight: '400',
        fontStyle: 'italic',
        color: 'rgba(255,255,255,0.8)',
        margin: '0 0 16px 0',
        lineHeight: 1.5,
        textShadow: '0 2px 16px rgba(0,0,0,0.4)',
      }}>
        But how close can they get?
      </p>
      <p style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: '16px',
        fontWeight: '300',
        color: 'rgba(255,255,255,0.35)',
        margin: 0,
        lineHeight: 1.6,
      }}>
        One shuffle per day. Compared against every shuffle before it.
      </p>
    </div>

    <VerificationHash hash={shuffleHash} isVisible={isShuffling} />

    {/* Premium CTA button with elevation */}
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Soft shadow pool beneath button */}
      <div style={{
        position: 'absolute',
        bottom: '-12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        height: '24px',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%)',
        filter: 'blur(10px)',
        pointerEvents: 'none',
        transition: 'all 0.5s ease',
      }} />
      <button
        onClick={onShuffle}
        disabled={isShuffling}
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '18px',
          fontWeight: '400',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          padding: '20px 56px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderTop: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '50px',
          color: 'rgba(255,255,255,0.85)',
          cursor: isShuffling ? 'default' : 'pointer',
          transition: 'all 0.5s ease',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 1px 0 0 rgba(255,255,255,0.1) inset, 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={(e) => { if (!isShuffling) { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.borderTopColor = 'rgba(255,255,255,0.5)'; e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = '0 1px 0 0 rgba(255,255,255,0.15) inset, 0 12px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.4)'; }}}
        onMouseLeave={(e) => { if (!isShuffling) { e.target.style.borderColor = 'rgba(255,255,255,0.18)'; e.target.style.borderTopColor = 'rgba(255,255,255,0.25)'; e.target.style.color = 'rgba(255,255,255,0.85)'; e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.boxShadow = '0 1px 0 0 rgba(255,255,255,0.1) inset, 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)'; }}}
      >
        {/* Light sweep on hover */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '50%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
          animation: 'none',
          pointerEvents: 'none',
        }} className="btn-sweep" />
        <ShimmerBar isActive={isShuffling} />
        {isShuffling ? 'Shuffling...' : 'Begin'}
      </button>
    </div>
    
    {/* Quiet footer context */}
    <div style={{
      marginTop: '48px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <span style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: '12px',
        fontWeight: '300',
        color: 'rgba(255,255,255,0.18)',
        letterSpacing: '1.5px',
      }}>
        847,293 shuffles and counting
      </span>
    </div>
  </div>
);

// ============ RETURNING USER VIEW ============
const ReturningUserView = ({ onShuffle, isShuffling, streak, onOpenAchievements, shuffleHash, globalHighest, todayHighest, todayShuffles, userData }) => (
  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '700px', padding: '0 20px' }}>
    <div style={{ marginBottom: '16px' }}>
      <FloatingSuits size="medium" />
    </div>
    
    <h1 style={{ margin: '0 0 12px 0' }}>
      <Logo size="medium" />
    </h1>
    
    {/* Tagline — Cormorant, with subtle glow */}
    <div style={{ position: 'relative', marginBottom: '36px' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '80%', height: '200%',
        background: 'radial-gradient(ellipse, rgba(167, 139, 250, 0.04) 0%, transparent 65%)',
        pointerEvents: 'none', filter: 'blur(20px)',
      }} />
      <p style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: '17px',
        fontWeight: '300',
        fontStyle: 'italic',
        color: 'rgba(255,255,255,0.4)',
        margin: 0,
        lineHeight: 1.5,
        position: 'relative',
        textShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }}>
        Never twice. Surely. Your shuffle awaits.
      </p>
    </div>

    {/* Stats Row — with glow behind cluster */}
    <div style={{ position: 'relative', marginBottom: '28px' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '100%', height: '180%',
        background: 'radial-gradient(ellipse, rgba(167, 139, 250, 0.04) 0%, transparent 60%)',
        pointerEvents: 'none', filter: 'blur(30px)',
      }} />
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <StatCard 
          icon="🏆"
          label="Global Highest" 
          value={globalHighest != null ? String(globalHighest) : '—'} 
          subtext="positions matched"
          accentColor="#fbbf24" 
        />
        <StatCard 
          icon="✨"
          label="Today's Highest" 
          value={todayHighest != null ? String(todayHighest) : '—'} 
          subtext={todayShuffles != null ? `${todayShuffles.toLocaleString()} shuffles today` : '—'}
          accentColor="#34d399" 
        />
        <StatCard 
          icon="🎯"
          label="Your Highest" 
          value={userData ? String(userData.yourHighest) : '—'} 
          subtext="positions matched"
          accentColor="#a78bfa" 
        />
      </div>
    </div>
    
    {/* Achievements preview — with shadow and brighter top border */}
    <div style={{ position: 'relative', marginBottom: '28px' }}>
      <div style={{
        position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)',
        width: '70%', height: '16px',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
        filter: 'blur(8px)', pointerEvents: 'none',
      }} />
      <div 
        onClick={onOpenAchievements}
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '16px 24px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex' }}>
            {ACHIEVEMENTS.filter(a => a.unlocked).slice(0, 5).map((a, i) => (
              <div key={a.id} style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: 5 - i }}>
                <AchievementBadge achievement={a} size="small" />
              </div>
            ))}
          </div>
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '13px',
            color: 'rgba(255,255,255,0.5)',
          }}>
            {ACHIEVEMENTS.filter(a => a.unlocked).length} of {ACHIEVEMENTS.length} achievements
          </span>
        </div>
        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '12px',
          color: 'rgba(255,255,255,0.3)',
        }}>View all →</span>
      </div>
    </div>

    <VerificationHash hash={shuffleHash} isVisible={isShuffling} />

    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Soft shadow pool beneath button */}
      <div style={{
        position: 'absolute',
        bottom: '-12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        height: '24px',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%)',
        filter: 'blur(10px)',
        pointerEvents: 'none',
      }} />
      <button
        onClick={onShuffle}
        disabled={isShuffling}
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '18px',
          fontWeight: '400',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          padding: '18px 52px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderTop: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '50px',
          color: 'rgba(255,255,255,0.85)',
          cursor: isShuffling ? 'default' : 'pointer',
          transition: 'all 0.5s ease',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 1px 0 0 rgba(255,255,255,0.1) inset, 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={(e) => { if (!isShuffling) { e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.borderTopColor = 'rgba(255,255,255,0.5)'; e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = '0 1px 0 0 rgba(255,255,255,0.15) inset, 0 12px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.4)'; }}}
        onMouseLeave={(e) => { if (!isShuffling) { e.target.style.borderColor = 'rgba(255,255,255,0.18)'; e.target.style.borderTopColor = 'rgba(255,255,255,0.25)'; e.target.style.color = 'rgba(255,255,255,0.85)'; e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.boxShadow = '0 1px 0 0 rgba(255,255,255,0.1) inset, 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)'; }}}
      >
        <ShimmerBar isActive={isShuffling} />
        {isShuffling ? 'Shuffling...' : "Today's Shuffle"}
      </button>
    </div>
  </div>
);

// ============ SHARE CARD (REDESIGNED) ============
// The image card users share on social media.
// Self-contained visual — designed for screenshots and downloads.

// --- Share card starfield (static, for screenshot capture) ---
const generateShareCardStars = () => {
  const stars = [];
  const seeds = [0.12,0.87,0.34,0.56,0.91,0.23,0.67,0.45,0.78,0.03,0.95,0.41,0.62,0.18,0.73,0.29,0.84,0.51,0.07,0.96,0.38,0.69,0.14,0.82,0.47,0.58,0.21,0.76,0.33,0.89,0.05,0.64,0.42,0.71,0.16,0.93,0.27,0.55,0.81,0.09,0.48,0.74,0.36,0.61,0.19,0.86,0.52,0.08,0.97,0.31];
  for (let i = 0; i < 50; i++) {
    const s1 = seeds[i % seeds.length];
    const s2 = seeds[(i * 7 + 3) % seeds.length];
    const s3 = seeds[(i * 13 + 7) % seeds.length];
    stars.push({ left: `${s1*100}%`, top: `${s2*100}%`, size: 1+s3*1.5, opacity: 0.08+s3*0.35, isTinted: i < 10 });
  }
  return stars;
};
const SHARE_CARD_STARS = generateShareCardStars();

const ShareCardStarfield = ({ tierGlow }) => (
  <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, pointerEvents:'none', borderRadius:'20px', overflow:'hidden' }}>
    {SHARE_CARD_STARS.map((star, i) => (
      <div key={i} style={{
        position:'absolute', left:star.left, top:star.top,
        width:`${star.size}px`, height:`${star.size}px`, borderRadius:'50%',
        background: star.isTinted ? tierGlow.replace(/[\d.]+\)$/, `${star.opacity*1.3})`) : `rgba(255,255,255,${star.opacity})`,
        boxShadow: star.opacity > 0.25 ? `0 0 ${star.size*2}px ${star.isTinted ? tierGlow.replace(/[\d.]+\)$/,`${star.opacity*0.5})`) : `rgba(255,255,255,${star.opacity*0.3})`}` : 'none',
      }} />
    ))}
  </div>
);

// --- Share card suit icons: whisper-level brand accents ---
const ShareCardSuitIcons = () => {
  const suits = [
    { char: '♠', color: 'rgba(167, 139, 250, 0.12)',  glow: 'rgba(167, 139, 250, 0.06)', size: '44px' },
    { char: '♥', color: 'rgba(251, 113, 133, 0.12)',  glow: 'rgba(251, 113, 133, 0.06)', size: '48px' },
    { char: '♦', color: 'rgba(251, 191, 36, 0.12)',   glow: 'rgba(251, 191, 36, 0.06)',  size: '44px' },
    { char: '♣', color: 'rgba(52, 211, 153, 0.12)',   glow: 'rgba(52, 211, 153, 0.06)',  size: '46px' },
  ];
  return (
    <div style={{
      position:'absolute', bottom:'4px', left:0, right:0, height:'80px',
      pointerEvents:'none', overflow:'hidden', borderRadius:'0 0 20px 20px',
      display:'flex', justifyContent:'center', alignItems:'flex-end', gap:'24px',
    }}>
      {suits.map((suit, i) => (
        <div key={i} style={{
          fontSize:suit.size, color:suit.color,
          filter: 'blur(3px)',
          textShadow: `0 0 28px ${suit.glow}, 0 0 56px ${suit.glow}, 0 0 95px ${suit.glow}`,
          lineHeight:1, userSelect:'none',
        }}>
          {suit.char}
        </div>
      ))}
    </div>
  );
};

const ShareCardMatchGrid = ({ matchCount, matchedPositions }) => {
  const tierKey = getTierForMatch(matchCount);
  const tier = RARITY_TIERS[tierKey];
  const positionSet = new Set(matchedPositions || []);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(13, 1fr)', gridTemplateRows:'repeat(4, 1fr)', gap:'4px', padding:'14px 10px', background:'rgba(0,0,0,0.3)', borderRadius:'10px' }}>
      {Array.from({ length: 52 }, (_, i) => {
        const isMatch = positionSet.has(i);
        return (<div key={i} style={{
          width:'100%', aspectRatio:'1', borderRadius:'2.5px',
          background: isMatch ? (tier.isGradient ? 'linear-gradient(135deg, #a78bfa, #fb7185, #fbbf24)' : tier.color) : 'rgba(255,255,255,0.07)',
          boxShadow: isMatch ? `0 0 8px ${tier.glow}` : 'none',
        }} />);
      })}
    </div>
  );
};

const ShareCard = ({ matchCount, matchedWithShuffle, shuffleNumber, totalShuffles, streak, matchedPositions }) => {
  const tierKey = getTierForMatch(matchCount);
  const tier = RARITY_TIERS[tierKey];
  const odds = getOddsForMatch(matchCount);
  const dateStr = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  const positionSet = matchedPositions || [];

  return (
    <div style={{ width:'340px', background:'linear-gradient(165deg, #151528 0%, #0d0d1a 100%)', borderRadius:'20px', padding:'28px 24px 24px', fontFamily:"'Inter', system-ui, sans-serif", position:'relative', overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
      <ShareCardStarfield tierGlow={tier.glow} />
      <ShareCardSuitIcons />

      {/* Purple glow orb — upper-left of centre */}
      <div style={{ position:'absolute', top:'32%', left:'50%', marginLeft:'-87px', width:'145px', height:'145px', borderRadius:'50%', background:'radial-gradient(circle, rgba(167, 139, 250, 0.14) 0%, transparent 70%)', filter:'blur(20px)', pointerEvents:'none' }} />

      {/* Pink glow orb — lower-right of centre */}
      <div style={{ position:'absolute', bottom:'34%', left:'50%', marginLeft:'-50px', width:'128px', height:'128px', borderRadius:'50%', background:'radial-gradient(circle, rgba(251, 113, 133, 0.11) 0%, transparent 70%)', filter:'blur(20px)', pointerEvents:'none' }} />

      {/* Depth overlay */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'120px', background:'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)', pointerEvents:'none' }} />

      {/* Top accent line */}
      <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:'2px', background: tier.isGradient ? 'linear-gradient(90deg, #a78bfa, #fb7185, #fbbf24, #34d399)' : tier.color, borderRadius:'0 0 2px 2px', boxShadow:`0 0 20px ${tier.glow}` }} />

      {/* Wordmark */}
      <div style={{ textAlign:'center', marginBottom:'4px', position:'relative' }}>
        <span style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:'24px', fontWeight:'600', color:'#ffffff', letterSpacing:'5px', textTransform:'uppercase' }}>Shuffled</span>
      </div>

      {/* Tagline */}
      <div style={{ textAlign:'center', marginBottom:'20px', fontSize:'11px', color:'rgba(255,255,255,0.25)', fontStyle:'italic', letterSpacing:'0.3px', position:'relative' }}>
        A daily experiment in impossibility
      </div>

      {/* Match grid */}
      <div style={{ marginBottom:'24px', position:'relative' }}>
        <ShareCardMatchGrid matchCount={matchCount} matchedPositions={positionSet} />
      </div>

      {/* Big number */}
      <div style={{ textAlign:'center', marginBottom:'8px', position:'relative' }}>
        <span style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:'56px', fontWeight:'300', lineHeight:1, color: tier.isGradient ? '#fff' : tier.color, background: tier.isGradient ? 'linear-gradient(135deg, #a78bfa, #fb7185, #fbbf24)' : 'none', WebkitBackgroundClip: tier.isGradient ? 'text' : 'none', WebkitTextFillColor: tier.isGradient ? 'transparent' : 'inherit', textShadow: tier.isGradient ? 'none' : `0 0 40px ${tier.glow}` }}>
          {matchCount}
        </span>
        <span style={{ fontFamily:"'Cormorant Garamond', Georgia, serif", fontSize:'22px', fontWeight:'300', color:'rgba(255,255,255,0.35)', marginLeft:'4px' }}>
          of 52
        </span>
      </div>

      {/* Explanation */}
      <div style={{ textAlign:'center', fontSize:'13px', color:'rgba(255,255,255,0.7)', marginBottom:'20px', lineHeight:1.4, fontWeight:'500', position:'relative' }}>
        positions aligned with someone else's shuffle
      </div>

      {/* Tier + odds pill */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:'20px', position:'relative' }}>
        <div style={{ width:'260px', padding:'10px 16px', borderRadius:'10px', background: tier.isGradient ? 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(251,113,133,0.12), rgba(251,191,36,0.12))' : `${tier.color}10`, border:`1px solid ${tier.isGradient ? 'rgba(251,191,36,0.25)' : tier.color}25`, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
          <span style={{ fontSize:'11px', fontWeight:'600', color: tier.isGradient ? '#fbbf24' : tier.color, letterSpacing:'1.5px', textTransform:'uppercase' }}>{tier.name}</span>
          <span style={{ width:'3px', height:'3px', borderRadius:'50%', background:'rgba(255,255,255,0.2)' }} />
          <span style={{ color:'rgba(255,255,255,0.4)', fontWeight:'400', fontSize:'11px', letterSpacing:'0.5px' }}>{odds}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height:'1px', background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', marginBottom:'20px', position:'relative' }} />

      {/* Stacked pills */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', marginBottom:'16px', position:'relative' }}>
        <div style={{ width:'260px', padding:'10px 16px', borderRadius:'10px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:'12px', color: tier.isGradient ? '#fbbf24' : tier.color, fontWeight:'600' }}>Matched with #{matchedWithShuffle ? matchedWithShuffle.toLocaleString() : '—'}</span>
          <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>&nbsp;from {totalShuffles ? totalShuffles.toLocaleString() : '—'} shuffles</span>
        </div>
        {streak > 0 && (
          <div style={{ width:'260px', padding:'10px 16px', borderRadius:'10px', background:'rgba(251, 113, 133, 0.1)', border:'1px solid rgba(251, 113, 133, 0.2)', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
            <span style={{ fontSize:'13px' }}>🔥</span>
            <span style={{ fontSize:'12px', color:'#fb7185', fontWeight:'600' }}>{streak} day streak!</span>
          </div>
        )}
      </div>

      {/* Shuffle identity */}
      <div style={{ textAlign:'center', marginBottom:'14px', fontSize:'11px', color:'rgba(255,255,255,0.35)', letterSpacing:'0.5px', position:'relative' }}>
        Shuffle #{shuffleNumber ? shuffleNumber.toLocaleString() : '—'} · {dateStr}
      </div>

      {/* CTA */}
      <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', position:'relative' }}>
        <span style={{ fontSize:'12px', color:'#ffffff', fontWeight:'700', letterSpacing:'1.5px', textTransform:'uppercase' }}>Join the experiment</span>
        <span style={{ fontSize:'13px', letterSpacing:'0.3px', color: tier.isGradient ? '#fff' : tier.color, fontWeight:'600' }}>playshuffled.io</span>
      </div>
    </div>
  );
};

// ============ SHARE MODAL ============
// Overlay when you tap "Share Result."
// Contains the share card + action buttons (Share / Copy / Download).

const ShareModal = ({ isOpen, onClose, matchCount, matchedWithShuffle, shuffleNumber, totalShuffles, streak, matchedPositions }) => {
  const cardRef = useRef(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Embed Google Fonts as base64 so dom-to-image SVG can render them
  const embedFonts = async () => {
    const fontUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap';
    try {
      // Fetch the CSS (must include a browser-like user-agent to get woff2 URLs)
      const cssRes = await fetch(fontUrl);
      let cssText = await cssRes.text();
      
      // Find all font file URLs in the CSS
      const urlRegex = /url\(([^)]+)\)/g;
      let match;
      const fetches = [];
      
      while ((match = urlRegex.exec(cssText)) !== null) {
        const fileUrl = match[1].replace(/['"]/g, '');
        if (fileUrl.startsWith('http')) {
          fetches.push(
            fetch(fileUrl)
              .then(r => r.blob())
              .then(blob => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({ fileUrl, dataUri: reader.result });
                reader.readAsDataURL(blob);
              }))
          );
        }
      }
      
      const results = await Promise.all(fetches);
      
      // Replace each remote URL with its base64 data URI
      for (const { fileUrl, dataUri } of results) {
        cssText = cssText.split(fileUrl).join(dataUri);
      }
      
      return cssText;
    } catch (err) {
      console.warn('Font embedding failed, falling back:', err);
      return '';
    }
  };

  const generateBlob = async () => {
    if (!cardRef.current) return null;
    const domtoimage = (await import('dom-to-image-more')).default;
    
    // Embed fonts inline
    const fontCSS = await embedFonts();
    let fontStyle = null;
    if (fontCSS) {
      fontStyle = document.createElement('style');
      fontStyle.textContent = fontCSS;
      cardRef.current.prepend(fontStyle);
    }
    
    try {
      const blob = await domtoimage.toBlob(cardRef.current, {
        bgcolor: '#0d0d1a',
      });
      return blob;
    } finally {
      // Clean up injected style
      if (fontStyle) fontStyle.remove();
    }
  };

  const handleShare = async () => {
    try {
      const blob = await generateBlob();
      if (!blob) return;
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'shuffled-result.png', { type: 'image/png' });
        const shareData = { files: [file], title: 'My Shuffled Result' };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }
      await handleCopy();
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleCopy = async () => {
    try {
      setCopying(true);
      const blob = await generateBlob();
      if (!blob) return;
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopying(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      setCopying(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await generateBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'shuffled-result.png';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} ref={cardRef}>
        <ShareCard
          matchCount={matchCount}
          matchedWithShuffle={matchedWithShuffle}
          shuffleNumber={shuffleNumber}
          totalShuffles={totalShuffles}
          streak={streak}
          matchedPositions={matchedPositions}
        />
      </div>
      
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center',
        }}
      >
        <button onClick={handleShare} style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          padding: '14px 28px', width: '140px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50px',
          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(251, 113, 133, 0.2))',
          border: '1px solid rgba(167, 139, 250, 0.4)',
          color: '#fff', fontSize: '14px', fontWeight: '600',
          letterSpacing: '2px', textTransform: 'uppercase',
          cursor: 'pointer', transition: 'all 0.3s ease',
        }}>
          Share
        </button>
        
        <button onClick={handleCopy} style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          padding: '14px 28px', width: '180px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: '400',
          letterSpacing: '2px', textTransform: 'uppercase',
          cursor: 'pointer', transition: 'all 0.3s ease',
        }}>
          {copied ? 'Copied!' : copying ? 'Copying...' : 'Copy Image'}
        </button>
        
        <button onClick={handleDownload} style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          padding: '14px 28px', width: '140px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: '400',
          letterSpacing: '2px', textTransform: 'uppercase',
          cursor: 'pointer', transition: 'all 0.3s ease',
        }}>
          Download
        </button>
      </div>
      
      <div style={{
        marginTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.25)',
        fontStyle: 'italic',
      }}>
        Tap anywhere to close
      </div>
    </div>
  );
};

// ============ POST-SHUFFLE RESULT VIEW (v4 design) ============
const PostShuffleResultView = ({ deck, matchCount, matchedWithShuffle, matchedPositions: realMatchedPositions, totalShuffles, shuffleNumber, globalHighest, todayHighest, factoryCount, isNewPersonalBest, isTodaysLeader, newAchievements, onOpenAchievements, shuffleHash, onShare, detectedHands, finds, streak }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [activeFind, setActiveFind] = useState(null);
  const [showFinds, setShowFinds] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [showTicker, setShowTicker] = useState(false);
  const [showReplayBtn, setShowReplayBtn] = useState(false);
  const [liveCount, setLiveCount] = useState(4);
  const [tickerFlash, setTickerFlash] = useState(false);
  
  // Simulate live shuffle count updates (replace with real WebSocket/polling later)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount(c => {
        const delta = Math.random() > 0.5 ? 1 : (Math.random() > 0.5 ? 2 : 0);
        return Math.max(1, c + delta - 1); // Fluctuate naturally
      });
      setTickerFlash(true);
      setTimeout(() => setTickerFlash(false), 600);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);
  
  const tierKey = getTierForMatch(matchCount);
  const tier = RARITY_TIERS[tierKey];
  const odds = getOddsForMatch(matchCount);
  
  // Use real matched positions from the API, fall back to random if not available
  const matchPositions = useMemo(() => {
    if (realMatchedPositions && realMatchedPositions.length > 0) {
      return new Set(realMatchedPositions);
    }
    return generateMatchPositions(matchCount);
  }, [realMatchedPositions, matchCount]);
  
  // Get highlighted card positions based on active find
  const highlightedPositions = useMemo(() => {
    if (!activeFind) return new Set();
    const find = finds.find(f => f.id === activeFind);
    return find ? new Set(find.positions) : new Set();
  }, [activeFind, finds]);
  
  // Finds now come from the API via props — real pattern detection!
  
  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Staggered reveal timing
  const cardRevealEnd = 52 * 0.06 + 0.6 + 0.5;
  
  // Match glow appears after all cards finish flipping
  const matchGlowStart = cardRevealEnd + 0.5;
  
  useEffect(() => {
    const findsTimer = setTimeout(() => setShowFinds(true), (cardRevealEnd + 0.3) * 1000);
    const resultsTimer = setTimeout(() => setShowResults(true), (cardRevealEnd + 0.6) * 1000);
    const replayBtnTimer = setTimeout(() => setShowReplayBtn(true), (cardRevealEnd + 0.3) * 1000 + 1000);
    return () => {
      clearTimeout(findsTimer);
      clearTimeout(resultsTimer);
      clearTimeout(replayBtnTimer);
    };
  }, []);
  
  // Replay handler — resets everything in one atomic render, then flips after a beat
  const handleReplay = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // All five state changes batch into ONE React render:
    // New grid mounts with cards face-down, finds/results/replay button hidden
    setIsRevealed(false);
    setShowFinds(false);
    setShowResults(false);
    setShowReplayBtn(false);
    setReplayKey(k => k + 1);
    // Brief pause with face-down cards visible, then start the reveal
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsRevealed(true);
          setTimeout(() => setShowFinds(true), (cardRevealEnd + 0.3) * 1000);
          setTimeout(() => setShowResults(true), (cardRevealEnd + 0.6) * 1000);
          setTimeout(() => setShowReplayBtn(true), (cardRevealEnd + 0.3) * 1000 + 1000);
        });
      });
    }, 350);
  };
  
  // Simulated live ticker entries (hardcoded — real data comes from backend later)
  const tickerEntries = useMemo(() => [
    { city: 'Melbourne', matchCount: 4, timeAgo: '12s ago' },
    { city: 'London', matchCount: 2, timeAgo: '34s ago' },
    { city: 'São Paulo', matchCount: 5, timeAgo: '1m ago' },
    { city: 'Tokyo', matchCount: 3, timeAgo: '2m ago' },
    { city: 'New York', matchCount: 1, timeAgo: '3m ago' },
  ], []);
  
  return (
    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, width: '100%', maxWidth: '800px' }}>
      
      {/* Brand identity — compact on results screen */}
      <div style={{ marginBottom: '16px', opacity: 0, animation: 'fadeIn 0.5s ease 0.1s forwards' }}>
        <Logo size="compact" />
      </div>
      
      {/* Shuffle info header */}
      <div style={{ marginBottom: '20px', opacity: 0, animation: 'fadeIn 0.5s ease 0.2s forwards' }}>
        <div style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          Shuffle #{shuffleNumber ? shuffleNumber.toLocaleString() : '—'}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
          {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Card Grid — wrapped with key for clean replay */}
      <div key={replayKey}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(13, 54px)',
          gap: '8px',
          marginBottom: '24px',
          justifyContent: 'center',
          padding: '16px 24px',
          overflow: 'visible',
        }}>
          {deck.map((card, index) => (
            <Card 
              key={index} 
              card={card} 
              index={index} 
              isRevealed={isRevealed} 
              isShuffling={false}
              isHighlighted={highlightedPositions.has(index)}
              isDimmed={activeFind !== null && !highlightedPositions.has(index)}
              isMatched={matchPositions.has(index)}
              matchTier={tierKey}
              matchGlowDelay={matchGlowStart}
            />
          ))}
        </div>
      </div>

      {/* Finds Bar — includes replay button */}
      <FindsBar 
        finds={finds}
        activeFind={activeFind}
        setActiveFind={setActiveFind}
        isVisible={showFinds}
        onReplay={handleReplay}
        showReplayBtn={showReplayBtn}
        factoryCount={factoryCount}
      />

      {/* ============ MAIN RESULT PANEL ============ */}
      <div style={{
        opacity: showResults ? 1 : 0,
        transform: showResults ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease',
      }}>
        {/* Main panel with shadow pool and glow */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <div style={{
            position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)',
            width: '80%', height: '20px',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
            filter: 'blur(10px)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '90%', height: '110%',
            background: 'radial-gradient(ellipse, rgba(167,139,250,0.03) 0%, transparent 60%)',
            pointerEvents: 'none', filter: 'blur(30px)',
          }} />
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px',
            padding: '28px',
            position: 'relative',
          }}>
          
          {/* Mini Grid — hero element */}
          <div style={{ marginBottom: '24px' }}>
            <MatchGrid matchCount={matchCount} matchPositions={matchPositions} />
          </div>
          
          {/* Two-tile layout: Match Result + Comparison Stats */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'stretch',
          }}>
            
            {/* LEFT TILE: Your Match Result — with shadow pool and brighter top border */}
            <div style={{ position: 'relative', display: 'flex', flex: '1 1 280px', maxWidth: '320px' }}>
              <div style={{
                position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)',
                width: '80%', height: '12px',
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
                filter: 'blur(6px)', pointerEvents: 'none',
              }} />
              <div style={{
                flex: 1,
                padding: '24px',
                background: `linear-gradient(135deg, ${tier.isGradient ? 'rgba(167,139,250,0.1)' : `${tier.color}10`}, ${tier.isGradient ? 'rgba(251,191,36,0.05)' : `${tier.color}05`})`,
                border: `1px solid ${tier.isGradient ? 'rgba(251,191,36,0.2)' : `${tier.color}30`}`,
                borderTop: `1px solid ${tier.isGradient ? 'rgba(251,191,36,0.3)' : `${tier.color}40`}`,
                borderRadius: '20px',
                textAlign: 'center',
                position: 'relative',
              }}>
                {/* Badges for personal best / today's leader */}
                {(isNewPersonalBest || isTodaysLeader) && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {isNewPersonalBest && (
                      <span style={{
                        background: 'rgba(167,139,250,0.2)',
                        border: '1px solid rgba(167,139,250,0.4)',
                        borderRadius: '20px',
                        padding: '4px 10px',
                        fontSize: '10px',
                        color: '#a78bfa',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}>
                        🎉 New Personal Highest
                      </span>
                    )}
                    {isTodaysLeader && (
                      <span style={{
                        background: 'rgba(251,191,36,0.2)',
                        border: '1px solid rgba(251,191,36,0.4)',
                        borderRadius: '20px',
                        padding: '4px 10px',
                        fontSize: '10px',
                        color: '#fbbf24',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}>
                        👑 Today's Leader
                      </span>
                    )}
                  </div>
                )}
                
                {/* Large match count */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: '72px',
                      fontWeight: '300',
                      lineHeight: 1,
                      color: tier.isGradient ? '#fff' : tier.color,
                      background: tier.isGradient 
                        ? 'linear-gradient(135deg, #a78bfa, #fb7185, #fbbf24)' 
                        : 'none',
                      WebkitBackgroundClip: tier.isGradient ? 'text' : 'none',
                      WebkitTextFillColor: tier.isGradient ? 'transparent' : 'inherit',
                      textShadow: tier.isGradient ? 'none' : `0 0 40px ${tier.glow}`,
                    }}>
                      {matchCount}
                    </span>
                    <span style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: '28px',
                      fontWeight: '300',
                      color: 'rgba(255,255,255,0.4)',
                      marginLeft: '6px',
                    }}>
                      of 52
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                    positions aligned with someone else's shuffle
                  </div>
                </div>
                
                {/* Rarity Badge — tier name Cormorant */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: tier.isGradient 
                    ? 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(251,113,133,0.2), rgba(251,191,36,0.2))'
                    : `${tier.color}20`,
                  border: `1px solid ${tier.isGradient ? 'rgba(251,191,36,0.3)' : tier.color}50`,
                  boxShadow: `0 0 20px ${tier.glow}`,
                }}>
                  <span style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: '13px',
                    fontWeight: '600',
                    color: tier.isGradient ? '#fbbf24' : tier.color,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                  }}>
                    {tier.name}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                    {odds}
                  </span>
                </div>
              </div>
            </div>
            
            {/* RIGHT TILE: Comparison Stats — with shadow pool and brighter top border */}
            <div style={{ position: 'relative', display: 'flex', flex: '1 1 280px', maxWidth: '320px' }}>
              <div style={{
                position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)',
                width: '80%', height: '12px',
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
                filter: 'blur(6px)', pointerEvents: 'none',
              }} />
              <div style={{
                flex: 1,
                padding: '20px 24px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '16px',
                position: 'relative',
              }}>
                {/* Your Highest */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isNewPersonalBest && <span style={{ fontSize: '14px' }}>🎉</span>}
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Your Highest</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '24px', fontWeight: '400', color: '#a78bfa' }}>
                      {matchCount}
                    </span>
                    {isNewPersonalBest && <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: '600' }}>NEW</span>}
                  </div>
                </div>
                
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                
                {/* Today's Highest */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isTodaysLeader && <span style={{ fontSize: '14px' }}>👑</span>}
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Today's Highest</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '24px', fontWeight: '400', color: '#34d399' }}>
                      {todayHighest ? todayHighest.count : '—'}
                    </span>
                    {isTodaysLeader && <span style={{ fontSize: '10px', color: '#34d399', fontWeight: '600' }}>YOU</span>}
                  </div>
                </div>
                
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                
                {/* Global Highest */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Global Highest</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '24px', fontWeight: '400', color: '#fbbf24', flexShrink: 0 }}>
                    {globalHighest ? globalHighest.count : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Match Connection — with shadow and brighter top border */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '10px',
            }}>
              Closest match from {totalShuffles ? totalShuffles.toLocaleString() : '—'} shuffles worldwide
            </div>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{
                position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)',
                width: '80%', height: '10px',
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
                filter: 'blur(6px)', pointerEvents: 'none',
              }} />
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 20px',
                background: 'rgba(167, 139, 250, 0.1)',
                border: '1px solid rgba(167, 139, 250, 0.2)',
                borderTop: '1px solid rgba(167, 139, 250, 0.3)',
                borderRadius: '12px',
                position: 'relative',
              }}>
                <span style={{ fontSize: '14px', color: '#a78bfa', fontWeight: '500' }}>
                  #{matchedWithShuffle ? matchedWithShuffle.toLocaleString() : '—'}
                </span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '14px', fontWeight: '600', fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>
                  Somewhere out there 🌍
                </span>
              </div>
            </div>
          </div>
          
          {/* Live ticker — expandable, contextually tied to "shuffles worldwide" */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button
              onClick={() => setShowTicker(!showTicker)}
              style={{
                background: tickerFlash ? 'rgba(52, 211, 153, 0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${tickerFlash ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.06)'}`,
                borderTop: `1px solid ${tickerFlash ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: '28px',
                padding: '10px 22px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.4s ease',
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; 
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; 
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#34d399',
                boxShadow: tickerFlash 
                  ? '0 0 10px rgba(52, 211, 153, 0.8), 0 0 20px rgba(52, 211, 153, 0.4)' 
                  : '0 0 6px rgba(52, 211, 153, 0.5)',
                animation: 'pulse 2s ease infinite',
                transition: 'box-shadow 0.3s ease',
              }} />
              <span style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '16px',
                fontWeight: '600',
                fontStyle: 'italic',
                color: tickerFlash ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.5)',
                transition: 'color 0.4s ease',
              }}>
                {liveCount} {liveCount === 1 ? 'shuffle' : 'shuffles'} in the last minute
              </span>
              <span style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.2)',
                transform: showTicker ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                display: 'inline-block',
              }}>▼</span>
            </button>
            
            <div style={{
              width: '100%',
              maxHeight: showTicker ? '250px' : '0',
              opacity: showTicker ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.5s ease, opacity 0.4s ease, margin 0.5s ease',
              marginTop: showTicker ? '12px' : '0',
            }}>
              <div style={{
                background: 'rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '12px',
                padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tickerEntries.map((entry, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: showTicker ? 1 : 0,
                        transform: showTicker ? 'translateY(0)' : 'translateY(-4px)',
                        transition: `opacity 0.4s ease ${0.1 + i * 0.06}s, transform 0.4s ease ${0.1 + i * 0.06}s`,
                      }}
                    >
                      <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: '15px',
                        fontWeight: '600',
                        fontStyle: 'italic',
                        color: 'rgba(255,255,255,0.45)',
                      }}>
                        Someone in {entry.city} shuffled
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontFamily: "'Inter', system-ui, sans-serif",
                          fontSize: '13px',
                          color: entry.matchCount >= 2
                            ? RARITY_TIERS[getTierForMatch(entry.matchCount)].color 
                            : 'rgba(255,255,255,0.2)',
                          fontWeight: '500',
                        }}>
                          {entry.matchCount} of 52
                        </span>
                        <span style={{
                          fontFamily: "'Inter', system-ui, sans-serif",
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.25)',
                        }}>
                          {entry.timeAgo}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          </div>
        </div>
        
        {/* Streak + Share + Trophy Cabinet buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '32px',
          flexWrap: 'wrap',
          width: '100%',
          maxWidth: '660px',
          margin: '0 auto 32px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 20px',
            background: 'rgba(251, 113, 133, 0.1)',
            border: '1px solid rgba(251, 113, 133, 0.2)',
            borderTop: '1px solid rgba(251, 113, 133, 0.3)',
            borderRadius: '50px',
            flex: '1 1 0',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '18px' }}>🔥</span>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '15px', color: '#fb7185', fontWeight: '600' }}>{streak} day streak</span>
          </div>
          
          <button onClick={onShare} style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            padding: '16px 32px',
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(251, 113, 133, 0.15))',
            border: '1px solid rgba(167, 139, 250, 0.35)',
            borderTop: '1px solid rgba(167, 139, 250, 0.5)',
            borderRadius: '50px',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: '600',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.4s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flex: '1.3 1 0',
            boxShadow: '0 0 20px rgba(167, 139, 250, 0.15), 0 0 40px rgba(167, 139, 250, 0.08)',
          }}>
            Share Result
          </button>
          
          <button
            onClick={onOpenAchievements}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              padding: '14px 20px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '50px',
              color: 'rgba(255,255,255,0.45)',
              fontSize: '14px',
              fontWeight: '400',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.4s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              flex: '1 1 0',
            }}
          >
            🏆 Trophy Cabinet
          </button>
        </div>
        
        {/* Return prompt — Cormorant italic */}
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '600',
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.45)',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          Return tomorrow to continue the experiment
        </div>
      </div>
    </div>
  );
};

// View Toggle for Demo
const ViewToggle = ({ view, setView }) => (
  <div style={{
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px',
    background: 'rgba(0,0,0,0.7)',
    padding: '8px',
    borderRadius: '30px',
    zIndex: 100,
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
  }}>
    {['first-time', 'returning', 'post-shuffle'].map((v) => (
      <button
        key={v}
        onClick={() => setView(v)}
        style={{
          padding: '8px 16px',
          borderRadius: '20px',
          border: 'none',
          background: view === v ? 'rgba(167, 139, 250, 0.3)' : 'transparent',
          color: view === v ? '#fff' : 'rgba(255,255,255,0.5)',
          fontSize: '12px',
          cursor: 'pointer',
          fontFamily: "'Inter', system-ui, sans-serif",
          transition: 'all 0.2s ease',
        }}
      >
        {v === 'first-time' ? '1. First Visit' : v === 'returning' ? '2. Returning' : '3. Results'}
      </button>
    ))}
  </div>
);

// ============ MAIN COMPONENT ============
export default function DailyShuffleFinal() {
  const [view, setView] = useState('first-time');
  const [deck, setDeck] = useState(shuffleDeck(generateDeck()));
  const [isShuffling, setIsShuffling] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const [shuffleHash] = useState(generateHash());
  const [dailySeed] = useState(generateHash());
  const [matchData, setMatchData] = useState(null);
  const [totalShuffles, setTotalShuffles] = useState(0);
  const [shuffleNumber, setShuffleNumber] = useState(null);
  const [globalHighest, setGlobalHighest] = useState(null);
  const [todayHighest, setTodayHighest] = useState(null);
  const [todayShuffles, setTodayShuffles] = useState(null);
  const [factoryCount, setFactoryCount] = useState(null);
  const [matchedPositions, setMatchedPositions] = useState(null);
  const [finds, setFinds] = useState([]);
  const [userData, setUserData] = useState(null);
  const [streak, setStreak] = useState(0);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);
  const [isTodaysLeader, setIsTodaysLeader] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  useEffect(() => {
    fetch('https://shuffled-production.up.railway.app/api/stats', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setGlobalHighest(data.globalHighest);
        setTodayHighest(data.todayHighest);
        setTodayShuffles(data.todayShuffles);
        if (data.user) {
          setUserData(data.user);
          setStreak(data.user.streak);
        }
      })
      .catch(err => console.error('Stats fetch error:', err));
  }, []);
  
  const handleShuffle = async () => {
    setIsShuffling(true);
    
    // Start the visual shuffle animation
    let count = 0;
    const interval = setInterval(() => {
      setDeck(shuffleDeck(generateDeck()));
      count++;
      if (count >= 18) clearInterval(interval);
    }, 90);

    // Call the real API
    const response = await fetch('https://shuffled-production.up.railway.app/api/shuffle', {
      credentials: 'include',
    });
    const data = await response.json();

    // Parse the real cards from the API
    const realDeck = data.shuffle.cards.map(parseCard);

    // Wait for animation to finish, then show real cards
    setTimeout(() => {
      clearInterval(interval);
      setDeck(realDeck);
      setMatchData(data.match);
      setTotalShuffles(data.totalShuffles);
      setShuffleNumber(data.shuffle.id);
      setGlobalHighest(data.globalHighest);
      setTodayHighest(data.todayHighest);
      setFactoryCount(data.factoryCount);
      setMatchedPositions(data.match ? data.match.matchedPositions : null);
      setFinds(data.finds || []);
      setUserData(data.user || null);
      setStreak(data.user ? data.user.streak : 0);
      setIsNewPersonalBest(data.user ? data.user.isNewPersonalBest : false);
      setIsTodaysLeader(data.user ? data.user.isTodaysLeader : false);
      setIsShuffling(false);
      setView('post-shuffle');
    }, 1800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 45%, #09090f 0%, #040407 50%, #020204 100%)',
      padding: '80px 20px 100px',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: view === 'post-shuffle' ? 'flex-start' : 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Header 
        isFirstTime={view === 'first-time'} 
        streak={streak} 
        showFull={view !== 'first-time'} 
        onOpenProvenance={() => setShowProvenance(true)}
      />
      <ViewToggle view={view} setView={setView} />
      <AchievementsPanel isOpen={showAchievements} onClose={() => setShowAchievements(false)} />
        <ShareModal
        isOpen={showShareCard}
        onClose={() => setShowShareCard(false)}
        matchCount={matchData ? matchData.positions : 0}
        matchedWithShuffle={matchData ? matchData.matchedWithShuffle : null}
        shuffleNumber={shuffleNumber}
        totalShuffles={totalShuffles}
        streak={streak}
        matchedPositions={matchedPositions}
      />
      <ProvenancePanel 
        isOpen={showProvenance} 
        onClose={() => setShowProvenance(false)} 
        shuffleHash={shuffleHash}
        dailySeed={dailySeed}
      />

      {/* Star field — creates depth in the background */}
      <StarField />

      {/* Ambient glow effects */}
      <div style={{ position: 'fixed', top: '15%', left: '50%', marginLeft: '-325px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.14) 0%, transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '20%', left: '50%', marginLeft: '-63px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(251, 113, 133, 0.11) 0%, transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Vignette — darkens edges, cinematic depth */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.5) 100%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Content — sits above the fixed background layers */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', minHeight: '100%', flexGrow: 1 }}>
        {view === 'first-time' && <FirstTimeView onShuffle={handleShuffle} isShuffling={isShuffling} shuffleHash={shuffleHash} />}
        {view === 'returning' && <ReturningUserView onShuffle={handleShuffle} isShuffling={isShuffling} streak={streak} onOpenAchievements={() => setShowAchievements(true)} shuffleHash={shuffleHash} globalHighest={globalHighest} todayHighest={todayHighest} todayShuffles={todayShuffles} userData={userData} />}
        {view === 'post-shuffle' && (
          <PostShuffleResultView 
            deck={deck} 
            matchCount={matchData ? matchData.positions : 0}
            matchedWithShuffle={matchData ? matchData.matchedWithShuffle : null}
            matchedPositions={matchedPositions}
            totalShuffles={totalShuffles}
            shuffleNumber={shuffleNumber}
            onShare={() => setShowShareCard(true)}
            globalHighest={globalHighest}
            todayHighest={todayHighest}
            factoryCount={factoryCount}
            isNewPersonalBest={isNewPersonalBest}
            streak={streak}
            isTodaysLeader={isTodaysLeader}
            newAchievements={[]}
            onOpenAchievements={() => setShowAchievements(true)}
            shuffleHash={shuffleHash}
            detectedHands={[]}
            finds={finds}
          />
        )}

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: '48px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '12px', fontStyle: 'italic', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>
            A daily experiment in impossibility
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '1px' }}>
            52! = 80,658,175,170,943,878,571,660,636,856,403,766,975,289,505,440,883,277,824,000,000,000,000
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap');
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes suitPop { 0% { opacity: 0; transform: scale(0) rotate(-30deg); } 60% { transform: scale(1.3) rotate(8deg); } 80% { transform: scale(0.9) rotate(-3deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
        @keyframes shimmerStar { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes twinkle { 0%, 100% { opacity: 0.22; } 30% { opacity: 0.03; } 70% { opacity: 0.03; } }
        @keyframes borderChase { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes badgeRotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes frostShimmer { 0% { background-position: 0% 0%; } 50% { background-position: 100% 100%; } 100% { background-position: 0% 0%; } }
        
        * { box-sizing: border-box; }
        
        button { transition: all 0.4s ease; }
        button:hover:not(:disabled) { transform: none; }
        
        /* Light sweep animation for premium buttons on hover */
        @keyframes btnSweep { 
          0% { left: -100%; } 
          100% { left: 200%; } 
        }
        button:hover .btn-sweep { animation: btnSweep 0.8s ease forwards; }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
    </div>
  );
}
