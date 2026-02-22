import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ProfileCard } from "./ProfileCard";
import { MatchMaker } from "./MatchMaker";
import { RecentMatches } from "./RecentMatches";

// Contract ABI - only the functions we need
const CONTRACT_ABI = [
  {
    inputs: [],
    name: "dailyFortune",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getProfile",
    outputs: [
      { internalType: "uint8", name: "element", type: "uint8" },
      { internalType: "uint256", name: "level", type: "uint256" },
      { internalType: "uint256", name: "xp", type: "uint256" },
      { internalType: "uint256", name: "energy", type: "uint256" },
      { internalType: "uint256", name: "luckyNumber", type: "uint256" },
      { internalType: "uint256", name: "winStreak", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "canClaimDailyFortune",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "other", type: "address" }],
    name: "checkCompatibility",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const CONTRACT_ADDRESS = "0x374531294780aB871568Ebc8a3606c80D62cdc5e";
const BASE_CHAIN_ID = 8453;
const BASE_RPC = "https://mainnet.base.org";

const ELEMENTS = ["Fire", "Water", "Air", "Earth"];
const ELEMENT_ICONS: Record<string, string> = {
  Fire: "🔥",
  Water: "💧",
  Air: "🌬️",
  Earth: "🌍",
};
const ELEMENT_COLORS: Record<string, string> = {
  Fire: "#ff6b6b",
  Water: "#4ecdc4",
  Air: "#a29bfe",
  Earth: "#6ab04c",
};

interface AstrologyProfile {
  element: string;
  level: number;
  xp: number;
  energy: number;
  luckyNumber: number;
  winStreak: number;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export function AstrologyDApp() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [profile, setProfile] = useState<AstrologyProfile | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "match" | "social">("profile");

  const userProfile = useQuery(api.profiles.getProfile);
  const updateWallet = useMutation(api.profiles.updateWallet);
  const recordFortune = useMutation(api.profiles.recordFortune);

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask or another Web3 wallet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Request account access
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Check and switch to Base network
      const chainId = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;

      if (parseInt(chainId, 16) !== BASE_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          // Chain not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
                  chainName: "Base",
                  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                  rpcUrls: [BASE_RPC],
                  blockExplorerUrls: ["https://basescan.org"],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      setWalletAddress(accounts[0]);
      await updateWallet({ walletAddress: accounts[0] });
      await fetchProfile(accounts[0]);
    } catch (err: any) {
      setError(err?.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  // Encode function call data
  const encodeFunctionCall = (functionName: string, params: string[] = []): string => {
    const func = CONTRACT_ABI.find((f) => f.name === functionName);
    if (!func) throw new Error(`Function ${functionName} not found`);

    // Simple ABI encoding for our use cases
    const signature = `${functionName}(${func.inputs.map((i) => i.type).join(",")})`;
    const hash = keccak256(signature).slice(0, 10);

    if (params.length === 0) return hash;

    // Encode address parameter (pad to 32 bytes)
    const encodedParams = params
      .map((p) => p.toLowerCase().replace("0x", "").padStart(64, "0"))
      .join("");

    return hash + encodedParams;
  };

  // Simple keccak256 for function signatures
  const keccak256 = (str: string): string => {
    // Use ethers-style function selector
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    // For function selectors, we'll use a simpler approach
    // This is a lookup table for our specific functions
    const selectors: Record<string, string> = {
      "dailyFortune()": "0x3a5d380f",
      "getProfile(address)": "0x30e6ae31",
      "canClaimDailyFortune(address)": "0x7c3a00fd",
      "checkCompatibility(address)": "0x6c0360eb",
    };

    return selectors[str] || "0x00000000";
  };

  // Fetch profile from contract
  const fetchProfile = async (address: string) => {
    try {
      const data = encodeFunctionCall("getProfile", [address]);

      const result = (await window.ethereum?.request({
        method: "eth_call",
        params: [{ to: CONTRACT_ADDRESS, data }, "latest"],
      })) as string;

      if (result && result !== "0x") {
        // Decode the result (6 uint256 values)
        const decoded = decodeUint256Array(result, 6);
        setProfile({
          element: ELEMENTS[decoded[0]] || "Unknown",
          level: decoded[1],
          xp: decoded[2],
          energy: decoded[3],
          luckyNumber: decoded[4],
          winStreak: decoded[5],
        });
      }

      // Check if can claim daily fortune
      const canClaimData = encodeFunctionCall("canClaimDailyFortune", [address]);
      const canClaimResult = (await window.ethereum?.request({
        method: "eth_call",
        params: [{ to: CONTRACT_ADDRESS, data: canClaimData }, "latest"],
      })) as string;

      setCanClaim(canClaimResult !== "0x" && BigInt(canClaimResult) === BigInt(1));
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  // Decode array of uint256 from hex
  const decodeUint256Array = (hex: string, count: number): number[] => {
    const clean = hex.replace("0x", "");
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      const slice = clean.slice(i * 64, (i + 1) * 64);
      result.push(Number(BigInt("0x" + (slice || "0"))));
    }
    return result;
  };

  // Claim daily fortune
  const claimDailyFortune = async () => {
    if (!walletAddress || !window.ethereum) return;

    setLoading(true);
    setError(null);

    try {
      const data = encodeFunctionCall("dailyFortune");

      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: walletAddress,
            to: CONTRACT_ADDRESS,
            value: "0x0",
            data,
          },
        ],
      });

      await recordFortune({});

      // Wait a bit for the transaction to be mined
      setTimeout(() => {
        fetchProfile(walletAddress);
      }, 3000);
    } catch (err: any) {
      setError(err?.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  // Listen for account changes
  useEffect(() => {
    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        setWalletAddress(null);
        setProfile(null);
      } else if (accs[0] !== walletAddress) {
        setWalletAddress(accs[0]);
        fetchProfile(accs[0]);
      }
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, [walletAddress]);

  // Auto-connect if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = (await window.ethereum.request({
          method: "eth_accounts",
        })) as string[];
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          await fetchProfile(accounts[0]);
        }
      }
    };
    checkConnection();
  }, []);

  if (!walletAddress) {
    return (
      <div className="connect-section">
        <div className="cosmic-orb">
          <div className="orb-glow"></div>
          <span className="orb-icon">🔮</span>
        </div>
        <h2 className="connect-title">Connect Your Wallet</h2>
        <p className="connect-desc">
          Link your wallet to reveal your cosmic profile and claim your daily fortune
        </p>
        <button
          onClick={connectWallet}
          disabled={loading}
          className="connect-btn"
        >
          {loading ? (
            <span className="spinner">✦</span>
          ) : (
            <>
              <span className="btn-icon">⛓️</span>
              Connect on Base
            </>
          )}
        </button>
        {error && <p className="error-message">{error}</p>}
      </div>
    );
  }

  return (
    <div className="dapp-container">
      {/* Navigation Tabs */}
      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <span className="tab-icon">✦</span>
          <span className="tab-label">Profile</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "match" ? "active" : ""}`}
          onClick={() => setActiveTab("match")}
        >
          <span className="tab-icon">💫</span>
          <span className="tab-label">Match</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "social" ? "active" : ""}`}
          onClick={() => setActiveTab("social")}
        >
          <span className="tab-icon">🌐</span>
          <span className="tab-label">Social</span>
        </button>
      </nav>

      {/* Content */}
      <div className="tab-content">
        {activeTab === "profile" && (
          <ProfileCard
            profile={profile}
            walletAddress={walletAddress}
            canClaim={canClaim}
            loading={loading}
            onClaimFortune={claimDailyFortune}
            elementIcons={ELEMENT_ICONS}
            elementColors={ELEMENT_COLORS}
          />
        )}

        {activeTab === "match" && (
          <MatchMaker
            walletAddress={walletAddress}
            profile={profile}
            elementIcons={ELEMENT_ICONS}
            elementColors={ELEMENT_COLORS}
            elements={ELEMENTS}
          />
        )}

        {activeTab === "social" && (
          <RecentMatches
            elementIcons={ELEMENT_ICONS}
            elementColors={ELEMENT_COLORS}
          />
        )}
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
