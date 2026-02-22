interface AstrologyProfile {
  element: string;
  level: number;
  xp: number;
  energy: number;
  luckyNumber: number;
  winStreak: number;
}

interface ProfileCardProps {
  profile: AstrologyProfile | null;
  walletAddress: string;
  canClaim: boolean;
  loading: boolean;
  onClaimFortune: () => void;
  elementIcons: Record<string, string>;
  elementColors: Record<string, string>;
}

export function ProfileCard({
  profile,
  walletAddress,
  canClaim,
  loading,
  onClaimFortune,
  elementIcons,
  elementColors,
}: ProfileCardProps) {
  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const elementColor = profile ? elementColors[profile.element] || "#ffffff" : "#ffffff";
  const elementIcon = profile ? elementIcons[profile.element] || "✦" : "✦";

  return (
    <div className="profile-section">
      {/* Wallet Info */}
      <div className="wallet-badge">
        <span className="wallet-dot"></span>
        <span className="wallet-address">{truncateAddress(walletAddress)}</span>
        <span className="network-badge">Base</span>
      </div>

      {profile ? (
        <>
          {/* Element Card */}
          <div
            className="element-card"
            style={{ "--element-color": elementColor } as React.CSSProperties}
          >
            <div className="element-glow"></div>
            <div className="element-icon-large">{elementIcon}</div>
            <h3 className="element-name">{profile.element}</h3>
            <p className="element-subtitle">Elemental Affinity</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-value">{profile.level}</div>
              <div className="stat-label">Level</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✨</div>
              <div className="stat-value">{profile.xp}</div>
              <div className="stat-label">XP</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-value">{profile.energy}</div>
              <div className="stat-label">Energy</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🍀</div>
              <div className="stat-value">{profile.luckyNumber}</div>
              <div className="stat-label">Lucky #</div>
            </div>
          </div>

          {/* Win Streak */}
          <div className="streak-card">
            <div className="streak-flames">
              {Array.from({ length: Math.min(profile.winStreak, 5) }).map((_, i) => (
                <span key={i} className="flame" style={{ animationDelay: `${i * 0.1}s` }}>
                  🔥
                </span>
              ))}
            </div>
            <div className="streak-info">
              <span className="streak-value">{profile.winStreak}</span>
              <span className="streak-label">Win Streak</span>
            </div>
          </div>

          {/* Daily Fortune Button */}
          <button
            onClick={onClaimFortune}
            disabled={!canClaim || loading}
            className={`fortune-btn ${canClaim ? "can-claim" : "cooldown"}`}
          >
            {loading ? (
              <span className="spinner">✦</span>
            ) : canClaim ? (
              <>
                <span className="fortune-icon">🌟</span>
                Claim Daily Fortune
              </>
            ) : (
              <>
                <span className="fortune-icon">⏳</span>
                Fortune Claimed (24h Cooldown)
              </>
            )}
          </button>
        </>
      ) : (
        <div className="no-profile">
          <div className="no-profile-icon">🌠</div>
          <h3>New Cosmic Traveler</h3>
          <p>Claim your first daily fortune to initialize your astrology profile!</p>
          <button
            onClick={onClaimFortune}
            disabled={loading}
            className="fortune-btn can-claim"
          >
            {loading ? (
              <span className="spinner">✦</span>
            ) : (
              <>
                <span className="fortune-icon">🌟</span>
                Begin Your Journey
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
