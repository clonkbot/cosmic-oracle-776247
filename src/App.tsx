import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { AstrologyDApp } from "./components/AstrologyDApp";
import { AuthForm } from "./components/AuthForm";
import "./styles.css";

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="cosmic-loader">
          <div className="orbit orbit-1"></div>
          <div className="orbit orbit-2"></div>
          <div className="orbit orbit-3"></div>
          <div className="planet"></div>
        </div>
        <p className="loading-text">Aligning the stars...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="stars-bg"></div>
        <div className="auth-card">
          <div className="celestial-icon">✦</div>
          <h1 className="auth-title">Cosmic Oracle</h1>
          <p className="auth-subtitle">Your destiny awaits on-chain</p>
          <AuthForm />
          <div className="divider">
            <span>or</span>
          </div>
          <button
            onClick={() => signIn("anonymous")}
            className="guest-btn"
          >
            Enter as Wandering Soul
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="stars-bg"></div>
      <header className="app-header">
        <div className="logo-section">
          <span className="logo-icon">✦</span>
          <h1 className="logo-text">Cosmic Oracle</h1>
        </div>
        <button onClick={() => signOut()} className="signout-btn">
          Disconnect
        </button>
      </header>
      <main className="main-content">
        <AstrologyDApp />
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="app-footer">
      <p>Requested by <a href="https://twitter.com/jianke2" target="_blank" rel="noopener noreferrer">@jianke2</a> · Built by <a href="https://twitter.com/clonkbot" target="_blank" rel="noopener noreferrer">@clonkbot</a></p>
    </footer>
  );
}

export default App;
