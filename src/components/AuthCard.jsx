import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase";

function AuthCard() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-brand">
        <span className="brand-icon">🎬</span>
        <h1>Movie Watchlist</h1>
        <p>Discover films and build your watchlist.</p>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => switchMode("login")}
          >
            Log In
          </button>
          <button
            className={mode === "signup" ? "auth-tab active" : "auth-tab"}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="field"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="field"
            placeholder={mode === "signup" ? "Password (min 6 characters)" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Log In"}
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}

        <p className="auth-switch">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <span onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Create an account" : "Log in instead"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default AuthCard;