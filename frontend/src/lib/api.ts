// frontend/src/lib/api.ts
// Centralized API Client for LANDGUARD AI Frontend

import { API_BASE_URL } from "../config";

export interface RiskZoneProperties {
  zone_id: string;
  risk_score: number;
  risk_category: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
  predicted_at: string;
}

export interface VillageProperties {
  osm_id: number;
  name: string;
  population: number;
  fclass: string;
}

export interface RoadProperties {
  id: string;
  name: string | null;
  road_class: string;
  surface: string | null;
  bridge: string | null;
  tunnel: string | null;
}

export interface InfrastructureProperties {
  id: number;
  name: string | null;
  type: "hospital" | "school";
  geometry_source: "point" | "building_footprint";
}

export interface LandslideInventoryProperties {
  id: number;
  fatalities: number;
  injuries: number;
  size: string;
  verification_status: string;
  triggering_factor: string;
  classification: string;
  source: string;
}

export interface FieldReport {
  id: number;
  report_id: string;
  report_type: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  photo_url: string | null;
  zone_id: string;
  verified: boolean;
  created_at: string;
  status: string;
}

export interface Alert {
  id: number;
  alert_id: string;
  title: string;
  severity: string;
  zone: string;
  zone_id: string;
  score: number;
  message: string;
  time: string;
  status: string;
  trigger_reason?: string;
  affected_area?: string;
  recommended_action?: string;
}

export interface DashboardSummary {
  monitored_areas: number;
  district: string;
  crs: string;
  active_alerts: number;
  critical_zones: number;
  high_risk_zones: number;
  average_risk_score: number;
  overall_risk_level: string;
  population_exposed: number;
  total_population: number;
  villages_monitored: number;
  infrastructure: {
    total: number;
    hospitals: number;
    schools: number;
    road_segments: number;
  };
  stats: Array<{
    icon: string;
    value: string;
    label: string;
    description: string;
  }>;
}

export interface ZoneAnalysisResponse {
  success: boolean;
  zone_id: string;
  environmental_features: Record<string, any>;
  ai_prediction: {
    prediction: number;
    landslide_probability: number;
    risk_score: number;
    risk_category: string;
  };
  gis_exposure: Record<string, any>;
  operational_response: Record<string, any>;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(errorBody || `HTTP ${res.status} from ${path}`);
  }
  return res.json();
}

// 1. Health
export function getHealth(): Promise<{ status: string; timestamp: string }> {
  return request("/api/health");
}

// 2. Risk Current (GeoJSON)
export function getRiskCurrent(category?: string): Promise<any> {
  const q = category ? `?category=${encodeURIComponent(category)}` : "";
  return request(`/api/risk-current${q}`);
}

// 3. Villages (GeoJSON)
export function getVillages(): Promise<any> {
  return request("/api/villages");
}

// 4. Roads (GeoJSON)
export function getRoads(bbox?: string, bridge?: string): Promise<any> {
  const params = new URLSearchParams();
  if (bbox) params.append("bbox", bbox);
  if (bridge) params.append("bridge", bridge);
  const q = params.toString() ? `?${params.toString()}` : "";
  return request(`/api/roads${q}`);
}

// 5. Infrastructure (GeoJSON)
export function getInfrastructure(type?: string): Promise<any> {
  const q = type ? `?type=${encodeURIComponent(type)}` : "";
  return request(`/api/infrastructure${q}`);
}

// 6. Landslide Inventory (GeoJSON)
export function getLandslideInventory(): Promise<any> {
  return request("/api/landslide-inventory");
}

// 7. Field Reports (GET)
export function getFieldReports(format?: string): Promise<any> {
  const q = format ? `?format=${encodeURIComponent(format)}` : "";
  return request(`/api/field-reports${q}`);
}

// 8. Field Reports (POST multipart)
export async function submitFieldReport(formData: FormData): Promise<{
  success: boolean;
  message: string;
  id?: number;
  report_id?: string;
  report: FieldReport;
}> {
  return request("/api/field-reports", {
    method: "POST",
    body: formData,
  });
}

// 9. Alerts
export function getAlerts(): Promise<{ success: boolean; data: Alert[] }> {
  return request("/api/alerts");
}

// 10. Dashboard Summary
export function getDashboardSummary(): Promise<{ success: boolean; data: DashboardSummary }> {
  return request("/api/dashboard/summary");
}

// 11. Zone Analysis (deep dive + M6)
export function getZoneAnalysis(zoneId: string): Promise<ZoneAnalysisResponse> {
  return request(`/api/zones/${encodeURIComponent(zoneId)}/analysis`);
}

// 12. Analyze (AI + M6)
export function analyzeRisk(payload: {
  zone_id?: string;
  features?: Record<string, any>;
  rainfall_mm?: number;
  slope_deg?: number;
  elevation_m?: number;
}): Promise<any> {
  return request("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Early Warning
export function getEarlyWarning(): Promise<any> {
  return request("/api/warnings");
}
