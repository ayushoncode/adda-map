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
        onToast("Your browser blocked the Google sign-in popup. Allow popups and try again.", "error");
        return;
      }

      if (code === "auth/unauthorized-domain") {
        onToast("localhost is not added to Firebase authorized domains.", "error");
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
    <main className="auth-screen">
      <div className="brand-mark">📍</div>
      <h1 className="logo">Adda <span>Map</span></h1>
      <p className="muted">Your city's best kept food secrets</p>
      <p className="muted">Real spots. Real people. No paid rankings.</p>
      <button type="button" className="google-button" onClick={signIn}>
        <span>G</span>
        Continue with Google
      </button>
    </main>
  );
}
