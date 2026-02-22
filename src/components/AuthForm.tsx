import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export function AuthForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      await signIn("password", formData);
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="input-group">
        <input
          name="email"
          type="email"
          placeholder="cosmic.traveler@universe.io"
          required
          className="auth-input"
        />
        <span className="input-icon">✉</span>
      </div>
      <div className="input-group">
        <input
          name="password"
          type="password"
          placeholder="Secret starlight password"
          required
          className="auth-input"
        />
        <span className="input-icon">🔐</span>
      </div>
      <input name="flow" type="hidden" value={flow} />

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? (
          <span className="spinner">✦</span>
        ) : flow === "signIn" ? (
          "Enter the Cosmos"
        ) : (
          "Begin Your Journey"
        )}
      </button>

      <button
        type="button"
        onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
        className="auth-toggle"
      >
        {flow === "signIn" ? "New soul? Create account" : "Already aligned? Sign in"}
      </button>
    </form>
  );
}
