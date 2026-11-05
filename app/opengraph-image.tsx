import { ImageResponse } from "next/og";

export const alt = "Orindle — Everything AI. One Platform.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#ffffff", color: "#151918", fontFamily: "Arial, sans-serif", padding: "72px" }}>
      <div style={{ position: "absolute", right: -90, top: -120, width: 420, height: 420, borderRadius: 420, border: "72px solid #eef8f2", display: "flex" }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: 48, height: 48, gap: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: "7px 3px 3px 3px", background: "#151918" }} />
            <div style={{ width: 22, height: 22, borderRadius: "3px 7px 3px 3px", background: "#087f6a" }} />
            <div style={{ width: 22, height: 22, borderRadius: "3px 3px 3px 7px", background: "#76dfae" }} />
            <div style={{ width: 22, height: 22, borderRadius: "3px 3px 7px 3px", background: "#151918" }} />
          </div>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 600, letterSpacing: "-2px" }}>orindle</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 22, color: "#087f6a", marginBottom: 24 }}>CHAT · IMAGE · VIDEO · WEBSITES</div>
          <div style={{ display: "flex", fontSize: 76, lineHeight: 1.05, letterSpacing: "-5px", fontWeight: 600, maxWidth: 900 }}>Everything AI.<br />One Platform.</div>
          <div style={{ display: "flex", fontSize: 25, lineHeight: 1.4, color: "#4f5d58", marginTop: 28, maxWidth: 800 }}>One connected workspace for every part of your next idea.</div>
        </div>
      </div>
    </div>,
    size,
  );
}
