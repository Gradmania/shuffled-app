import { useState, useEffect } from 'react';

const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_COLORS = { '♠': '#1a1a2e', '♥': '#be3455', '♦': '#be3455', '♣': '#1a1a2e' };
const SUIT_ACCENTS = { '♠': '#a78bfa', '♥': '#fb7185', '♦': '#fbbf24', '♣': '#34d399' };
const SUIT_GLOW = { '♠': 'rgba(167, 139, 250, 1)', '♥': 'rgba(251, 113, 133, 1)', '♦': 'rgba(251, 191, 36, 1)', '♣': 'rgba(52, 211, 153, 1)' };
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

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

// Card component with flip animation
const Card = ({ card, index, isRevealed, isShuffling }) => {
  const delay = index * 0.06;
  const flipDuration = 0.6;
  const suitDelay = delay + flipDuration + 0.15;
  const glowDelay = delay + flipDuration;
  const pulseDelay = (index % 7) * 0.4;
  const rotationOffset = (index % 5) * 0.8;
  
  return (
    <div style={{ width: '54px', height: '76px', perspective: '1000px', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '70px',
          height: '88px',
          transform: 'translate(-50%, -50%)',
          borderRadius: '12px',
          background: card ? SUIT_GLOW[card.suit] : 'transparent',
          opacity: isRevealed ? 0.25 : 0,
          transition: `opacity 0.5s ease ${glowDelay}s`,
          animation: isRevealed ? `haloGlow 3s ease-in-out ${glowDelay + pulseDelay}s infinite` : 'none',
          filter: 'blur(10px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '20px' }}>🃏</span>
      <span style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: '18px',
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: '2px',
      }}>
        DAILY SHUFFLE
      </span>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* How We Shuffle link */}
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
        <span style={{ fontSize: '12px' }}>🔐</span>
        How We Shuffle
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

// How We Shuffle / Provenance Panel
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
              <span>🔐</span> How We Shuffle
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
  <div style={{
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
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
      fontWeight: '700',
      color: accentColor,
      marginBottom: '4px',
      textShadow: `0 0 30px ${accentColor}40`,
    }}>
      {value}
    </div>
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>{label}</div>
    {subtext && <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{subtext}</div>}
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
      <span style={{ fontSize: '12px' }}>🔐</span>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Verification:</span>
      <span style={{ fontSize: '11px', color: '#fbbf24', fontFamily: 'monospace' }}>
        {hash.substring(0, 8)}...{hash.substring(hash.length - 8)}
      </span>
    </div>
  </div>
);

// ============ FIRST TIME VISITOR VIEW ============
const FirstTimeView = ({ onShuffle, isShuffling, shuffleHash }) => (
  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '540px', padding: '0 20px' }}>
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '32px',
      fontSize: '36px',
    }}>
      {SUITS.map((suit, i) => (
        <span key={suit} style={{ color: SUIT_ACCENTS[suit], filter: `drop-shadow(0 0 12px ${SUIT_GLOW[suit]})`, animation: `float 3s ease-in-out ${i * 0.2}s infinite` }}>{suit}</span>
      ))}
    </div>
    
    <h1 style={{
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      fontSize: '56px',
      fontWeight: '300',
      color: '#ffffff',
      margin: '0 0 24px 0',
      letterSpacing: '4px',
      textTransform: 'uppercase',
    }}>
      Daily Shuffle
    </h1>
    
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '32px',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <p style={{
        fontSize: '18px',
        color: 'rgba(255,255,255,0.7)',
        margin: '0 0 16px 0',
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontStyle: 'italic',
        lineHeight: 1.6,
      }}>
        "There are more ways to arrange a deck of cards than there are atoms in our solar system."
      </p>
      
      <p style={{
        fontSize: '14px',
        color: 'rgba(255,255,255,0.4)',
        margin: 0,
        lineHeight: 1.7,
      }}>
        This is a collective experiment. Every day, people around the world receive one cryptographically 
        verified shuffle. We track them all, searching for the impossible: two shuffles that match.
      </p>
    </div>

    <VerificationHash hash={shuffleHash} isVisible={isShuffling} />

    <button
      onClick={onShuffle}
      disabled={isShuffling}
      style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: '20px',
        fontWeight: '600',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        padding: '22px 64px',
        background: 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(251,113,133,0.3))',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '50px',
        color: '#fff',
        cursor: 'pointer',
        transition: 'all 0.4s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ShimmerBar isActive={isShuffling} />
      {isShuffling ? 'Generating verified shuffle...' : 'Join the Experiment'}
    </button>
    
    <div style={{
      marginTop: '32px',
      display: 'flex',
      justifyContent: 'center',
      gap: '24px',
      fontSize: '12px',
      color: 'rgba(255,255,255,0.3)',
    }}>
      <span>🌍 847,293 verified shuffles</span>
      <span>•</span>
      <span>🏆 Record: 9 positions matched</span>
    </div>
  </div>
);

// ============ RETURNING USER VIEW ============
const ReturningUserView = ({ onShuffle, isShuffling, streak, onOpenAchievements, shuffleHash }) => (
  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '700px' }}>
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      marginBottom: '12px',
      fontSize: '24px',
    }}>
      {SUITS.map((suit, i) => (
        <span key={suit} style={{ color: SUIT_ACCENTS[suit], filter: `drop-shadow(0 0 10px ${SUIT_GLOW[suit]})`, animation: `float 3s ease-in-out ${i * 0.2}s infinite` }}>{suit}</span>
      ))}
    </div>
    
    <h1 style={{
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      fontSize: '42px',
      fontWeight: '300',
      color: '#ffffff',
      margin: '0 0 8px 0',
      letterSpacing: '4px',
      textTransform: 'uppercase',
    }}>
      Daily Shuffle
    </h1>
    
    <p style={{
      fontSize: '14px',
      color: 'rgba(255,255,255,0.4)',
      margin: '0 0 28px 0',
      fontStyle: 'italic',
    }}>
      The experiment continues. Your verified shuffle awaits.
    </p>

    {/* Stats Row */}
    <div style={{
      display: 'flex',
      gap: '16px',
      marginBottom: '28px',
      flexWrap: 'wrap',
      justifyContent: 'center',
    }}>
      <StatCard 
        icon="🏆"
        label="All-Time Record" 
        value="9" 
        subtext="positions matched"
        accentColor="#fbbf24" 
      />
      <StatCard 
        icon="✨"
        label="Today's Closest" 
        value="6" 
        subtext="2,847 shuffles so far"
        accentColor="#34d399" 
      />
      <StatCard 
        icon="🎯"
        label="Your Best" 
        value="5" 
        subtext="positions matched"
        accentColor="#a78bfa" 
      />
    </div>
    
    {/* Achievements preview */}
    <div 
      onClick={onOpenAchievements}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '16px 24px',
        marginBottom: '28px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '-8px' }}>
          {ACHIEVEMENTS.filter(a => a.unlocked).slice(0, 5).map((a, i) => (
            <div key={a.id} style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: 5 - i }}>
              <AchievementBadge achievement={a} size="small" />
            </div>
          ))}
        </div>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
          {ACHIEVEMENTS.filter(a => a.unlocked).length} of {ACHIEVEMENTS.length} achievements
        </span>
      </div>
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>View all →</span>
    </div>

    <VerificationHash hash={shuffleHash} isVisible={isShuffling} />

    <div>
      <button
        onClick={onShuffle}
        disabled={isShuffling}
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '18px',
          fontWeight: '600',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          padding: '18px 56px',
          background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(251,113,133,0.2))',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50px',
          color: '#fff',
          cursor: 'pointer',
          transition: 'all 0.4s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <ShimmerBar isActive={isShuffling} />
        {isShuffling ? 'Generating verified shuffle...' : "Reveal Today's Shuffle"}
      </button>
    </div>
  </div>
);

// ============ POST-SHUFFLE RESULT VIEW ============
const PostShuffleResultView = ({ deck, matchCount, matchedWithShuffle, totalShuffles, isNewPersonalBest, isTodaysLeader, newAchievements, onOpenAchievements, shuffleHash, detectedHands }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, width: '100%', maxWidth: '800px' }}>
      {/* Compact Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '24px',
          fontWeight: '300',
          color: 'rgba(255,255,255,0.6)',
          margin: '0',
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }}>
          Shuffle #{totalShuffles}
        </h1>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: '8px 0 0' }}>
          Cryptographically verified • February 16, 2026
        </p>
        
        {/* Verification hash */}
        <div style={{
          marginTop: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'rgba(52, 211, 153, 0.1)',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          borderRadius: '20px',
        }}>
          <span style={{ fontSize: '10px', color: '#34d399' }}>✓ VERIFIED</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
            {shuffleHash.substring(0, 16)}...
          </span>
        </div>
      </div>

      {/* Card Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(13, 54px)',
        gap: '8px',
        marginBottom: '28px',
        justifyContent: 'center',
        padding: '16px',
        overflowX: 'auto',
      }}>
        {deck.map((card, index) => (
          <Card key={index} card={card} index={index} isRevealed={isRevealed} isShuffling={false} />
        ))}
      </div>

      {/* Detected Poker Hands */}
      {detectedHands && detectedHands.length > 0 && (
        <div style={{
          background: 'rgba(167, 139, 250, 0.1)',
          border: '1px solid rgba(167, 139, 250, 0.2)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          animation: 'fadeInUp 0.6s ease 3.8s both',
        }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            🃏 Poker Hands Detected
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {detectedHands.map((hand, i) => (
              <span key={i} style={{
                padding: '6px 12px',
                background: 'rgba(167, 139, 250, 0.2)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#a78bfa',
              }}>
                {hand}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* New Achievements Unlocked */}
      {newAchievements && newAchievements.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(251,113,133,0.15))',
          border: '1px solid rgba(167,139,250,0.3)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          animation: 'fadeInUp 0.6s ease 4s both',
        }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            🎉 New Achievement{newAchievements.length > 1 ? 's' : ''} Unlocked!
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {newAchievements.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AchievementBadge achievement={{...a, unlocked: true}} size="small" />
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result Panel */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '32px 48px',
        maxWidth: '500px',
        margin: '0 auto 24px',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeInUp 0.6s ease 4.5s both',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #a78bfa, #fb7185, #fbbf24, #34d399)' }} />
        
        {(isNewPersonalBest || isTodaysLeader) && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            {isNewPersonalBest && (
              <span style={{
                background: 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(167,139,250,0.1))',
                border: '1px solid rgba(167,139,250,0.4)',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '11px',
                color: '#a78bfa',
                fontWeight: '600',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                🎉 New Personal Best!
              </span>
            )}
            {isTodaysLeader && (
              <span style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(251,191,36,0.1))',
                border: '1px solid rgba(251,191,36,0.4)',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '11px',
                color: '#fbbf24',
                fontWeight: '600',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                👑 Today's Leader!
              </span>
            )}
          </div>
        )}

        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Closest Match in the Experiment
        </div>
        
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '72px',
          fontWeight: '300',
          background: 'linear-gradient(135deg, #a78bfa, #fb7185)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '4px',
          lineHeight: 1,
        }}>
          {matchCount}
        </div>
        
        <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', marginBottom: '20px', letterSpacing: '1px' }}>
          positions matched
        </div>
        
        <div style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.4)',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          Closest match: shuffle <span style={{ color: '#a78bfa' }}>#{matchedWithShuffle}</span>
        </div>
      </div>

      {/* Comparison Stats */}
      <div style={{
        display: 'flex',
        gap: '24px',
        justifyContent: 'center',
        marginBottom: '28px',
        flexWrap: 'wrap',
        animation: 'fadeInUp 0.6s ease 4.8s both',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Best</div>
          <div style={{ fontSize: '24px', fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#a78bfa' }}>{matchCount}</div>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Today's Best</div>
          <div style={{ fontSize: '24px', fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#34d399' }}>{matchCount}</div>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>All-Time Record</div>
          <div style={{ fontSize: '24px', fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#fbbf24' }}>9</div>
        </div>
      </div>

      {/* Streak & Actions */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        animation: 'fadeInUp 0.6s ease 5s both',
      }}>
        <div style={{
          background: 'rgba(251, 113, 133, 0.1)',
          border: '1px solid rgba(251, 113, 133, 0.2)',
          borderRadius: '12px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>🔥</span>
          <span style={{ fontSize: '14px', color: '#fb7185', fontWeight: '600' }}>13 day streak!</span>
        </div>
        
        <button
          onClick={onOpenAchievements}
          style={{
            background: 'rgba(167, 139, 250, 0.1)',
            border: '1px solid rgba(167, 139, 250, 0.2)',
            borderRadius: '12px',
            padding: '14px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#a78bfa',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          View Achievements →
        </button>
      </div>

      <p style={{
        marginTop: '24px',
        fontSize: '13px',
        color: 'rgba(255,255,255,0.3)',
        animation: 'fadeInUp 0.6s ease 5.2s both',
      }}>
        Return tomorrow to continue the experiment and keep your streak alive.
      </p>
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
    const response = await fetch('https://shuffled-production.up.railway.app/api/shuffle');
    const data = await response.json();

    // Parse the real cards from the API
    const realDeck = data.shuffle.cards.map(parseCard);

    // Wait for animation to finish, then show real cards
    setTimeout(() => {
      clearInterval(interval);
      setDeck(realDeck);
      setMatchData(data.match);
      setTotalShuffles(data.totalShuffles);
      setIsShuffling(false);
      setView('post-shuffle');
    }, 1800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d0d1a 0%, #151528 50%, #0d0d1a 100%)',
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
        streak={13} 
        showFull={view !== 'first-time'} 
        onOpenProvenance={() => setShowProvenance(true)}
      />
      <ViewToggle view={view} setView={setView} />
      <AchievementsPanel isOpen={showAchievements} onClose={() => setShowAchievements(false)} />
      <ProvenancePanel 
        isOpen={showProvenance} 
        onClose={() => setShowProvenance(false)} 
        shuffleHash={shuffleHash}
        dailySeed={dailySeed}
      />

      {/* Ambient glow effects */}
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '30%', right: '5%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(251, 113, 133, 0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {view === 'first-time' && <FirstTimeView onShuffle={handleShuffle} isShuffling={isShuffling} shuffleHash={shuffleHash} />}
      {view === 'returning' && <ReturningUserView onShuffle={handleShuffle} isShuffling={isShuffling} streak={13} onOpenAchievements={() => setShowAchievements(true)} shuffleHash={shuffleHash} />}
      {view === 'post-shuffle' && (
        <PostShuffleResultView 
          deck={deck} 
          matchCount={matchData ? matchData.positions : 0}
          matchedWithShuffle={matchData ? matchData.matchedWithShuffle : null}
          totalShuffles={totalShuffles}
          isNewPersonalBest={false}
          isTodaysLeader={false}
          newAchievements={[]}
          onOpenAchievements={() => setShowAchievements(true)}
          shuffleHash={shuffleHash}
          detectedHands={[]}
        />
      )}

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '48px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.15)', letterSpacing: '1px' }}>
          52! = 80,658,175,170,943,878,571,660,636,856,403,766,975,289,505,440,883,277,824,000,000,000,000
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap');
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes suitPop { 0% { opacity: 0; transform: scale(0) rotate(-30deg); } 60% { transform: scale(1.3) rotate(8deg); } 80% { transform: scale(0.9) rotate(-3deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
        @keyframes shimmerStar { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes haloGlow { 0%, 100% { opacity: 0.18; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.38; transform: translate(-50%, -50%) scale(1.02); } }
        @keyframes borderChase { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes badgeRotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        
        * { box-sizing: border-box; }
        button:hover:not(:disabled) { transform: scale(1.02); }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
    </div>
  );
}
