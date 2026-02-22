import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AstrologyProfile {
  element: string;
  level: number;
  xp: number;
  energy: number;
  luckyNumber: number;
  winStreak: number;
}

interface MatchMakerProps {
  walletAddress: string;
  profile: AstrologyProfile | null;
  elementIcons: Record<string, string>;
  elementColors: Record<string, string>;
  elements: string[];
}

interface MatchResult {
  compatibility: number;
  element1: string;
  element2: string;
  targetAddress: string;
}

const CONTRACT_ADDRESS = "0x374531294780aB871568Ebc8a3606c80D62cdc5e";

export function MatchMaker({
  walletAddress,
  profile,
  elementIcons,
  elementColors,
  elements,
}: MatchMakerProps) {
  const [targetAddress, setTargetAddress] = useState("");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordMatch = useMutation(api.profiles.recordMatch);

  const checkCompatibility = async () => {
    if (!targetAddress || !window.ethereum) return;
    if (!/^0x[a-fA-F0-9]{40}$/.test(targetAddress)) {
      setError("Please enter a valid Ethereum address");
      return;
    }

    setLoading(true);
    setError(null);
    setMatchResult(null);

    try {
      // Get compatibility score
      const compatData = "0x6c0360eb" + targetAddress.toLowerCase().replace("0x", "").padStart(64, "0");

      const compatResult = (await window.ethereum.request({
        method: "eth_call",
        params: [{ to: CONTRACT_ADDRESS, data: compatData }, "latest"],
      })) as string;

      const compatibility = Number(BigInt(compatResult || "0"));

      // Get target profile element
      const profileData = "0x30e6ae31" + targetAddress.toLowerCase().replace("0x", "").padStart(64, "0");

      const profileResult = (await window.ethereum.request({
        method: "eth_call",
        params: [{ to: CONTRACT_ADDRESS, data: profileData }, "latest"],
      })) as string;

      const targetElement = Number(BigInt("0x" + (profileResult.slice(2, 66) || "0")));

      const result: MatchResult = {
        compatibility,
        element1: profile?.element || "Unknown",
        element2: elements[targetElement] || "Unknown",
        targetAddress,
      };

      setMatchResult(result);

      // Record the match
      await recordMatch({
        targetAddress,
        compatibility,
        element1: result.element1,
        element2: result.element2,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to check compatibility");
    } finally {
      setLoading(false);
    }
  };

  const getCompatibilityRating = (score: number): { label: string; emoji: string; color: string } => {
    if (score >= 90) return { label: "Cosmic Soulmates", emoji: "💕", color: "#ff6b9d" };
    if (score >= 75) return { label: "Stellar Match", emoji: "⭐", color: "#ffd93d" };
    if (score >= 60) return { label: "Good Vibes", emoji: "✨", color: "#6bcb77" };
    if (score >= 40) return { label: "Interesting Tension", emoji: "🌙", color: "#4d96ff" };
    if (score >= 20) return { label: "Challenging Path", emoji: "🌪️", color: "#9d4edd" };
    return { label: "Cosmic Opposites", emoji: "💫", color: "#ff6b6b" };
  };

  return (
    <div className="match-section">
      <div className="match-header">
        <h2 className="match-title">✨ Cosmic Match</h2>
        <p className="match-desc">
          Discover your compatibility with any wallet address
        </p>
      </div>

      <div className="match-input-container">
        <input
          type="text"
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value)}
          placeholder="0x... (Enter wallet address)"
          className="match-input"
        />
        <button
          onClick={checkCompatibility}
          disabled={loading || !targetAddress}
          className="match-btn"
        >
          {loading ? (
            <span className="spinner">✦</span>
          ) : (
            <>
              <span>💫</span>
              Match
            </>
          )}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {matchResult && (
        <div className="match-result">
          <div className="match-visual">
            <div
              className="match-element"
              style={{ "--element-color": elementColors[matchResult.element1] } as React.CSSProperties}
            >
              <span className="element-emoji">{elementIcons[matchResult.element1]}</span>
              <span className="element-text">{matchResult.element1}</span>
              <span className="element-label">You</span>
            </div>

            <div className="match-connector">
              <div className="connector-line"></div>
              <div className="connector-heart">
                {getCompatibilityRating(matchResult.compatibility).emoji}
              </div>
              <div className="connector-line"></div>
            </div>

            <div
              className="match-element"
              style={{ "--element-color": elementColors[matchResult.element2] } as React.CSSProperties}
            >
              <span className="element-emoji">{elementIcons[matchResult.element2]}</span>
              <span className="element-text">{matchResult.element2}</span>
              <span className="element-label">Them</span>
            </div>
          </div>

          <div
            className="compatibility-score"
            style={{ "--score-color": getCompatibilityRating(matchResult.compatibility).color } as React.CSSProperties}
          >
            <div className="score-circle">
              <svg viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={getCompatibilityRating(matchResult.compatibility).color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${matchResult.compatibility * 2.83} 283`}
                  transform="rotate(-90 50 50)"
                  className="score-progress"
                />
              </svg>
              <span className="score-value">{matchResult.compatibility}%</span>
            </div>
            <div className="score-label">
              {getCompatibilityRating(matchResult.compatibility).label}
            </div>
          </div>

          <div className="match-address">
            <span className="address-label">Matched with</span>
            <span className="address-value">
              {matchResult.targetAddress.slice(0, 8)}...{matchResult.targetAddress.slice(-6)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
