import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Match {
  _id: string;
  initiatorUserId: string;
  initiatorAddress: string;
  targetAddress: string;
  compatibility: number;
  element1: string;
  element2: string;
  timestamp: number;
}

interface RecentMatchesProps {
  elementIcons: Record<string, string>;
  elementColors: Record<string, string>;
}

export function RecentMatches({ elementIcons, elementColors }: RecentMatchesProps) {
  const matches = useQuery(api.profiles.getRecentMatches);

  const truncateAddress = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Unknown";

  const timeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getCompatibilityColor = (score: number): string => {
    if (score >= 75) return "#6bcb77";
    if (score >= 50) return "#ffd93d";
    return "#ff6b6b";
  };

  if (matches === undefined) {
    return (
      <div className="social-section">
        <div className="social-header">
          <h2 className="social-title">🌐 Cosmic Community</h2>
          <p className="social-desc">Real-time matches from across the cosmos</p>
        </div>
        <div className="loading-matches">
          <span className="spinner">✦</span>
          <span>Scanning the stars...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="social-section">
      <div className="social-header">
        <h2 className="social-title">🌐 Cosmic Community</h2>
        <p className="social-desc">Real-time matches from across the cosmos</p>
      </div>

      {matches.length === 0 ? (
        <div className="no-matches">
          <div className="no-matches-icon">🌌</div>
          <h3>No matches yet</h3>
          <p>Be the first to discover cosmic connections!</p>
        </div>
      ) : (
        <div className="matches-list">
          {matches.map((match: Match) => (
            <div key={match._id} className="match-item">
              <div className="match-item-visual">
                <span
                  className="match-item-element"
                  style={{ color: elementColors[match.element1] }}
                >
                  {elementIcons[match.element1]}
                </span>
                <span className="match-item-connector">⟷</span>
                <span
                  className="match-item-element"
                  style={{ color: elementColors[match.element2] }}
                >
                  {elementIcons[match.element2]}
                </span>
              </div>
              <div className="match-item-info">
                <div className="match-item-addresses">
                  <span className="address">{truncateAddress(match.initiatorAddress)}</span>
                  <span className="arrow">→</span>
                  <span className="address">{truncateAddress(match.targetAddress)}</span>
                </div>
                <div className="match-item-meta">
                  <span
                    className="match-score"
                    style={{ color: getCompatibilityColor(match.compatibility) }}
                  >
                    {match.compatibility}%
                  </span>
                  <span className="match-time">{timeAgo(match.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
