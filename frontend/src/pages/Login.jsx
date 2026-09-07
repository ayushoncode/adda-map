import { loginWithGoogle } from "../firebase";
import { IconCoffee, IconMoon, IconTrophy, IconChevronRight } from "../icons";

export default function Login({ onToast, onContinueAsGuest }) {
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
        <div className="auth-logo-badge" style={{ gap: "8px", padding: "8px 16px", display: "inline-flex", alignItems: "center" }}>
          <a
            href="https://cmhub.in"
            target="_blank"
            rel="noopener noreferrer"
            title="Go to cmhub.in"
            style={{ fontWeight: 900, fontStyle: "italic", fontSize: "1.3rem", color: "#FFFFFF", letterSpacing: "-0.03em", textDecoration: "none" }}
          >
            cmhub
          </a>
          <span style={{ color: "#71717A", fontWeight: 400, margin: "0 2px" }}>×</span>
          <img src="/adda-logo-white.png" alt="adda" className="adda-custom-logo-lg" style={{ height: 28 }} />
          <span className="uber-logo-badge">MAP</span>
        </div>

        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: "0 0 8px 0",
              color: "#FFFFFF",
              lineHeight: 1.15,
            }}
          >
            Night Addas & Food Spots
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: "0.92rem", margin: 0, lineHeight: 1.45 }}>
            Verified chai tapris, late night craving spots & secret street food in Bangalore.
          </p>
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            background: "rgba(22, 22, 26, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "16px",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.86rem", color: "#E4E4E7" }}>
            <span style={{ display: "inline-flex", alignItems: "center", color: "#FFFFFF" }}><IconCoffee size={16} /></span>
            <span>Discover secret Chai tapris & hangout spots</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.86rem", color: "#E4E4E7" }}>
            <span style={{ display: "inline-flex", alignItems: "center", color: "#06C167" }}><IconMoon size={16} /></span>
            <span>Find late-night food open after 11 PM</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.86rem", color: "#E4E4E7" }}>
            <span style={{ display: "inline-flex", alignItems: "center", color: "#F59E0B" }}><IconTrophy size={16} /></span>
            <span>Earn scout points & claim the #1 spot on Leaderboard</span>
          </div>
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
          <button type="button" className="google-auth-btn" onClick={signIn} style={{ width: "100%" }}>
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
            <span>Continue with Google</span>
          </button>

          {onContinueAsGuest && (
            <button
              type="button"
              className="uber-secondary-btn"
              style={{ width: "100%", justifyContent: "center", padding: "12px", gap: "8px" }}
              onClick={onContinueAsGuest}
            >
              <span>Explore without Login</span>
              <IconChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
