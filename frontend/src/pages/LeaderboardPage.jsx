import { useEffect, useState, useCallback } from "react";
import api from "../api";
import Leaderboard from "../components/Leaderboard";

export default function LeaderboardPage({ currentUserId, onOpenAdd, onToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("alltime");
  const [metric, setMetric] = useState("points");

  const fetchLeaderboard = useCallback(
    async (p, m) => {
      setLoading(true);
      try {
        const response = await api.get(`/leaderboard?period=${p}&sort=${m}`);
        setUsers(response.data?.users || []);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        onToast?.("Could not load latest standings", "error");
      } finally {
        setLoading(false);
      }
    },
    [onToast]
  );

  useEffect(() => {
    fetchLeaderboard(period, metric);
  }, [period, metric, fetchLeaderboard]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleSortChange = (newMetric) => {
    setMetric(newMetric);
  };

  return (
    <div className="leaderboard-page-wrapper">
      <Leaderboard
        users={users}
        currentUserId={currentUserId}
        loading={loading}
        onOpenAdd={onOpenAdd}
        period={period}
        onPeriodChange={handlePeriodChange}
        sortMetric={metric}
        onSortChange={handleSortChange}
      />
    </div>
  );
}
