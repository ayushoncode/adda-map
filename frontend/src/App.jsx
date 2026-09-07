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
import LeaderboardPage from "./pages/LeaderboardPage";

const getGuestProfile = () => ({
  id: "guest_scout",
  name: "Guest Scout",
  area: "Bangalore",
  avatarColor: "#10B981",
  scoutPoints: 50,
  spotsCount: 0,
  reviewsCount: 0,
  level: "Food Explorer",
  isGuest: true,
});

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [tab, setTab] = useState("map");
  const [toasts, setToasts] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
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
        const profile = response.data?.user;
        if (!profile || !profile.onboardingComplete) {
          setNeedsOnboarding(true);
        } else {
          setUserProfile(profile);
          setNeedsOnboarding(false);
        }
      } catch (err) {
        // User document does not exist in Firestore (e.g. fresh start / wiped database)
        setNeedsOnboarding(true);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setAuthUser(null);
    setUserProfile(null);
    setGuestMode(false);
    setNeedsOnboarding(false);
    showToast("You have been logged out.", "info");
  };

  const handleOnboardingComplete = (savedProfile) => {
    setUserProfile(savedProfile);
    setNeedsOnboarding(false);
    showToast(`Welcome ${savedProfile.name}! Start exploring spots.`, "success");
  };

  if (authLoading) {
    return (
      <main className="auth-fullscreen">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div className="button-spinner" style={{ width: 32, height: 32 }} />
          <span style={{ color: "#9CA3AF", fontSize: "0.95rem", fontWeight: 600 }}>
            Loading Adda Map...
          </span>
        </div>
      </main>
    );
  }

  // If not logged in and not in guest preview mode, show the Login page
  if (!authUser && !guestMode) {
    return (
      <>
        <Login
          onToast={showToast}
          onContinueAsGuest={() => {
            setGuestMode(true);
            setUserProfile(getGuestProfile());
          }}
        />
        <Toast toasts={toasts} />
      </>
    );
  }

  // If logged in but user profile does not exist in Firestore yet, complete Onboarding
  if (authUser && needsOnboarding) {
    return (
      <>
        <Onboarding
          authUser={authUser}
          onToast={showToast}
          onComplete={handleOnboardingComplete}
        />
        <Toast toasts={toasts} />
      </>
    );
  }

  const effectiveProfile = userProfile || getGuestProfile();

  return (
    <div className="app-root">
      {/* Top Header Bar */}
      <Header
        userProfile={effectiveProfile}
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
            userProfile={effectiveProfile}
            onOpenSpot={(spot) => setSelectedSpot(spot)}
            onOpenProfile={() => setTab("profile")}
            onOpenAdd={() => setTab("add")}
            refreshKey={refreshKey}
            userLocation={userLocation}
            setUserLocation={setUserLocation}
          />
        )}
        {tab === "leaderboard" && (
          <LeaderboardPage
            currentUserId={effectiveProfile?.id}
            onOpenAdd={() => setTab("add")}
            onToast={showToast}
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
              setTab("map");
            }}
          />
        )}
        {tab === "profile" && (
          <Profile
            user={authUser}
            userProfile={effectiveProfile}
            onToast={showToast}
            onOpenSpot={(spot) => setSelectedSpot(spot)}
            onOpenAuth={handleLogout}
            onNavigateLeaderboard={() => setTab("leaderboard")}
            onProfileUpdated={(updated) => setUserProfile(updated)}
          />
        )}
      </main>

      {/* Mobile Floating Bottom Dock (Includes Leaderboard, Explore, Add, Feed, Account) */}
      {tab !== "add" && <BottomNav current={tab} onChange={setTab} />}

      {/* Spot Detail Modal / Bottom Sheet */}
      {selectedSpot && (
        <SpotDetail
          spot={selectedSpot}
          user={effectiveProfile}
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
