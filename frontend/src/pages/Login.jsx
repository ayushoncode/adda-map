import { loginWithGoogle } from "../firebase";

export default function Login({ onToast }) {
  const signIn = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Google sign-in failed:", error);

      const code = error?.code;
      if (code === "auth/popup-closed-by-user") {
        onToast("Google sign-in popup was closed before it finished.", "error");
        return;
      }

      if (code === "auth/popup-blocked") {
        onToast(
          "Your browser blocked the Google sign-in popup. Allow popups and try again.",
          "error"
        );
        return;
      }

      if (code === "auth/unauthorized-domain") {
        onToast(
          "localhost is not added to Firebase authorized domains.",
          "error"
        );
        return;
      }

      if (code === "auth/operation-not-allowed") {
        onToast("Google sign-in is not enabled in Firebase Auth.", "error");
        return;
      }

      onToast(`Google sign-in failed: ${code || "unknown error"}`, "error");
    }
  };

  return (
    <main className="auth-fullscreen">
      <div className="auth-glass-card">
        <div className="auth-logo-badge">
          <span style={{ color: "#10B981" }}>●</span>
          <span style={{ fontWeight: 900, fontStyle: "italic" }}>cmhub</span>
          <span style={{ color: "#71717A" }}>/</span>
          <span style={{ color: "#FFFFFF", fontWeight: 700 }}>Adda Map</span>
        </div>

        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: "0 0 8px 0",
              color: "#FFFFFF",
            }}
          >
            Night Cravings & Food Addas
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: "0.95rem", margin: 0 }}>
            Real spots. Real reviews. Verified by campus students and locals.
          </p>
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            background: "#161619",
            border: "1px solid #222226",
            borderRadius: "14px",
            padding: "16px",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", color: "#E4E4E7" }}>
            <span>☕</span>
            <span>Discover secret Chai tapris & hangout spots</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", color: "#E4E4E7" }}>
            <span>🌙</span>
            <span>Find late-night food open after 11 PM</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", color: "#E4E4E7" }}>
            <span>📍</span>
            <span>GPS-verified recommendations with honest prices</span>
          </div>
        </div>

        <button type="button" className="google-auth-btn" onClick={signIn}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>
      </div>
    </main>
  );
}
