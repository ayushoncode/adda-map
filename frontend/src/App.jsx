import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import api from "./api";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import AddPin from "./components/AddPin";
import Feed from "./components/Feed";
import Profile from "./components/Profile";
import SpotDetail from "./components/SpotDetail";
import Toast from "./components/Toast";
import { auth } from "./firebase";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("map");
  const [toasts, setToasts] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userLocation, setUserLocation] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setAuthUser(nextUser);
      if (!nextUser) {
        setUserProfile(null);
        setNeedsOnboarding(false);
        setAuthLoading(false);
        return;
      }

      try {
        const response = await api.get(`/users/${nextUser.uid}`);
        const profile = response.data.user;
        if (!profile?.onboardingComplete) {
          setNeedsOnboarding(true);
        } else {
          setUserProfile(profile);
          setNeedsOnboarding(false);
        }
      } catch {
        setNeedsOnboarding(true);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    showToast("You have been signed out.", "info");
  };

  if (authLoading) {
    return (
      <main className="auth-fullscreen">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div className="button-spinner" style={{ width: 28, height: 28 }} />
          <span style={{ color: "#9CA3AF", fontSize: "0.9rem" }}>
            Loading Adda Map...
          </span>
        </div>
      </main>
    );
  }

  if (!authUser) {
    return (
      <>
        <Login onToast={showToast} />
        <Toast toasts={toasts} />
      </>
    );
  }

  if (needsOnboarding || !userProfile) {
    return (
      <>
        <Onboarding
          authUser={authUser}
          onToast={showToast}
          onComplete={(profile) => {
            setUserProfile(profile);
            setNeedsOnboarding(false);
            showToast("Welcome to Adda Map! Start discovering spots.", "success");
          }}
        />
        <Toast toasts={toasts} />
      </>
    );
  }

  return (
    <div className="app-root">
      {/* CMHub Top Header Bar */}
      <Header
        userProfile={userProfile}
        currentTab={tab}
        onTabChange={setTab}
        onOpenProfile={() => setTab("profile")}
        onOpenAdd={() => setTab("add")}
        onLogout={handleLogout}
      />

      {/* Main Screen Content */}
      <main className="main-content-shell">
        {tab === "map" && (
          <Home
            userProfile={userProfile}
            onOpenSpot={(spot) => setSelectedSpot(spot)}
            onOpenProfile={() => setTab("profile")}
            onOpenAdd={() => setTab("add")}
            refreshKey={refreshKey}
            userLocation={userLocation}
            setUserLocation={setUserLocation}
          />
        )}
        {tab === "feed" && (
          <Feed
            onOpenSpot={(spot) => setSelectedSpot(spot)}
            onToast={showToast}
            userLocation={userLocation}
          />
        )}
        {tab === "add" && (
          <AddPin
            userLocation={userLocation}
            setUserLocation={setUserLocation}
            onBack={() => setTab("map")}
            onToast={showToast}
            onCreated={() => {
              setRefreshKey((value) => value + 1);
            }}
          />
        )}
        {tab === "profile" && (
          <Profile
            user={authUser}
            onToast={showToast}
            onOpenSpot={(spot) => setSelectedSpot(spot)}
          />
        )}
      </main>

      {/* Mobile Floating Bottom Dock */}
      {tab !== "add" && <BottomNav current={tab} onChange={setTab} />}

      {/* Spot Detail Modal / Bottom Sheet */}
      {selectedSpot && (
        <SpotDetail
          spot={selectedSpot}
          user={userProfile}
          userLocation={userLocation}
          onClose={() => setSelectedSpot(null)}
          onToast={showToast}
          onUpdated={() => setRefreshKey((value) => value + 1)}
          onOpenSpot={(spot) => setSelectedSpot(spot)}
        />
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} />
    </div>
  );
}
