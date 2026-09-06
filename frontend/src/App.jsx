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
  return (
    <div className="app">
      <Navbar />

      <main>
        {/* Dashboard */}
        <section id="dashboard">
          <Dashboard />
        </section>

        {/* Risk Map */}
        <section id="risk-map">
          <RiskMap />
        </section>

        {/* Risk Prediction */}
        <section id="risk-prediction">
          <RiskPrediction />
        </section>

        {/* Early Warning */}
        <section id="early-warning">
          <EarlyWarning />
        </section>

        {/* Alerts */}
        <section id="alerts">
          <Alerts />
        </section>

        {/* Field Reports */}
        <section id="field-report">
          <FieldReport />
        </section>

        {/* Impact Analysis */}
        <section id="impact-analysis">
          <ImpactAnalysis />
        </section>

        {/* Risk Timeline */}
        <section id="risk-timeline">
          <RiskTimeline />
        </section>

        {/* Offline Mode */}
        <section id="offline-mode">
          <OfflineMode />
        </section>
      </main>
    </div>
  );
}

export default App;