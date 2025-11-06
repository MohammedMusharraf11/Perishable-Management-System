import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface AlertData {
  counts: { expired: number; high: number; medium: number; low: number; total: number };
  topCritical: any[];
  timestamp: string;
}

const AlertWidget: React.FC = () => {
  const [data, setData] = useState<AlertData | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "Manager") return;

    const fetchAlerts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/alerts", {
          headers: { "x-user-role": user.role },
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [user]);

  if (!user || user.role !== "Manager" || !data) return null;

  const { expired, high, medium, low, total } = data.counts;

  return (
    <div
      className="p-4 bg-white shadow-md rounded-2xl w-full max-w-md cursor-pointer hover:shadow-lg transition"
      onClick={() => navigate("/inventory?filter=expiring")}
    >
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Expiry Alerts</h2>
        <span className="bg-red-600 text-white px-2 py-1 rounded-full text-sm font-bold">
          {total}
        </span>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <span className="bg-black text-white px-3 py-1 rounded-full text-sm">⚫ Expired: {expired}</span>
        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm animate-pulse">⚠️ High: {high}</span>
        <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm">⚠ Medium: {medium}</span>
        <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm">⏳ Low: {low}</span>
      </div>

      <ul className="text-sm space-y-1">
        {data.topCritical.map((item, i) => (
          <li key={i} className="flex justify-between border-b pb-1">
            <span>{item.product_name || item.name}</span>
            <span className="text-xs text-gray-500">
              {new Date(item.expiry_date).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AlertWidget;
