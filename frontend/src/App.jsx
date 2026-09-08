import { useState } from "react";

import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import RiskMap from "./components/RiskMap";
import RiskPrediction from "./components/RiskPrediction";
import EarlyWarning from "./components/EarlyWarning";
import Alerts from "./components/Alerts";
import FieldReport from "./components/FieldReport";
import ImpactAnalysis from "./components/ImpactAnalysis";
import RiskTimeline from "./components/RiskTimeLine";
import OfflineMode from "./components/OfflineMode";

function App() {
  // Stores the zone currently selected by the user
  const [selectedZone, setSelectedZone] = useState(null);

  return (
    <div className="app">
      <Navbar />

      <main>
        <section id="dashboard">
          <Dashboard selectedZone={selectedZone} />
        </section>

        <section id="risk-map">
          <RiskMap
            selectedZone={selectedZone}
            onZoneSelect={setSelectedZone}
          />
        </section>

        <section id="risk-prediction">
          <RiskPrediction selectedZone={selectedZone} />
        </section>

        <section id="early-warning">
          <EarlyWarning selectedZone={selectedZone} />
        </section>

        <section id="alerts">
          <Alerts selectedZone={selectedZone} />
        </section>

        <section id="field-report">
          <FieldReport selectedZone={selectedZone} />
        </section>

        <section id="impact-analysis">
          <ImpactAnalysis selectedZone={selectedZone} />
        </section>

        <section id="risk-timeline">
          <RiskTimeline selectedZone={selectedZone} />
        </section>

        <section id="offline-mode">
          <OfflineMode selectedZone={selectedZone} />
        </section>
      </main>
    </div>
  );
}

export default App;