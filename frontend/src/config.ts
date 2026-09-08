// frontend/src/config.ts
// Configuration for LANDGUARD AI Frontend

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const RISK_CATEGORIES = {
  LOW: { label: "LOW", range: "0–24.99", color: "#2ecc71" },
  MODERATE: { label: "MODERATE", range: "25–49.99", color: "#f1c40f" },
  HIGH: { label: "HIGH", range: "50–74.99", color: "#e67e22" },
  VERY_HIGH: { label: "VERY_HIGH", range: "75–100", color: "#e74c3c" },
};
