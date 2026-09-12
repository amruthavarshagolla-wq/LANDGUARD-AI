import { useState } from "react";

import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import RiskMap from "./components/RiskMap";
import RiskPrediction from "./components/RiskPrediction";
import EarlyWarning from "./components/EarlyWarning";
import Alerts from "./components/Alerts";
import FieldReport from "./components/FieldReport";
import ImpactAnalysis from "./components/ImpactAnalysis";
import Priority from "./components/Priority";
import RiskTimeline from "./components/RiskTimeLine";
import OfflineMode from "./components/OfflineMode";

function App() {
  // Stores the zone currently selected by the user
  const [selectedZone, setSelectedZone] = useState(null);

  return (
    <div className="app">
      <Navbar />

      <main>
        {/* ================= DASHBOARD ================= */}
        <section id="dashboard">
          <Dashboard selectedZone={selectedZone} />
        </section>

        {/* ================= RISK MAP ================= */}
        <section id="risk-map">
          <RiskMap
            selectedZone={selectedZone}
            onZoneSelect={setSelectedZone}
          />
        </section>

        {/* ================= AI RISK PREDICTION ================= */}
        <section id="risk-prediction">
          <RiskPrediction selectedZone={selectedZone} />
        </section>

        {/* ================= EARLY WARNING ================= */}
        <section id="early-warning">
          <EarlyWarning selectedZone={selectedZone} />
        </section>

        {/* ================= ALERTS ================= */}
        <section id="alerts">
          <Alerts selectedZone={selectedZone} />
        </section>

        {/* ================= FIELD REPORT ================= */}
        <section id="field-report">
          <FieldReport selectedZone={selectedZone} />
        </section>

        {/* ================= IMPACT ANALYSIS ================= */}
        <section id="impact-analysis">
          <ImpactAnalysis selectedZone={selectedZone} />
        </section>

        {/* ================= PRIORITY ================= */}
        <section id="priority">
          <Priority selectedZone={selectedZone} />
        </section>

        {/* ================= RISK TIMELINE ================= */}
        <section id="risk-timeline">
          <RiskTimeline selectedZone={selectedZone} />
        </section>

        {/* ================= OFFLINE MODE ================= */}
        <section id="offline-mode">
          <OfflineMode selectedZone={selectedZone} />
        </section>
      </main>
    </div>
  );
}

export default App;