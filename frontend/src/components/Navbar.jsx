import GlobeLogo from "./GlobeLogo";

function Navbar() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        height: "75px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        background: "linear-gradient(135deg, #0A3323, #105666)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
      }}
    >
      {/* Logo + Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <GlobeLogo />

        <div>
          <h1
            style={{
              margin: 0,
              color: "#F7F4D5",
              fontSize: "22px",
              fontWeight: "800",
              letterSpacing: "0.5px",
              lineHeight: "1.2",
            }}
          >
            LANDGUARD AI
          </h1>

          <p
            style={{
              margin: "3px 0 0",
              color: "#B8C3A0",
              fontSize: "11px",
              letterSpacing: "1px",
              lineHeight: "1.2",
            }}
          >
            INTELLIGENT LANDSLIDE MONITORING
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "28px",
        }}
      >
        <a href="#dashboard" style={navLinkStyle}>
          Dashboard
        </a>

        <a href="#risk-map" style={navLinkStyle}>
          Risk Map
        </a>

        <a href="#field-report" style={navLinkStyle}>
          Reports
        </a>

        <a href="#alerts" style={navLinkStyle}>
          Alerts
        </a>
      </div>
    </nav>
  );
}

const navLinkStyle = {
  color: "#F7F4D5",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.25s ease",
  whiteSpace: "nowrap",
};

export default Navbar;