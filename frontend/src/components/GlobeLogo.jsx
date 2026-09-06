import { useEffect, useRef } from "react";
import Globe from "react-globe.gl";

function GlobeLogo() {
  const globeRef = useRef();

  useEffect(() => {
    if (!globeRef.current) return;

    const controls = globeRef.current.controls();

    // Continuous automatic rotation
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;

    // Prevent manual interaction
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = false;
  }, []);

  return (
    <div
      style={{
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        overflow: "hidden",
        background: "#052e16",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
          "0 0 12px rgba(34,197,94,0.8), 0 0 25px rgba(34,197,94,0.4)",
      }}
    >
      <Globe
        ref={globeRef}
        width={58}
        height={58}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
        bumpScale={0.4}
        showAtmosphere={true}
        atmosphereColor="#4ade80"
        atmosphereAltitude={0.15}
        enablePointerInteraction={false}
      />
    </div>
  );
}

export default GlobeLogo;