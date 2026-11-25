import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Si ya está instalada o ya se mostró antes, no mostrar
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    const alreadyShown = localStorage.getItem("pwa_install_prompt_shown") === "1";
    if (isStandalone || alreadyShown) {
      setDismissed(true);
      return;
    }
    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
    };
    const installedHandler = () => {
      setInstalled(true);
      localStorage.setItem("pwa_install_prompt_shown", "1");
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (installed || dismissed || !deferred) return null;

  return (
    <div className="card" style={{ background: "#e0f2f1" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Instala AYAMONTE A PIE en tu móvil</p>
        <button onClick={() => { localStorage.setItem("pwa_install_prompt_shown", "1"); setDismissed(true); }} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
      </div>
      <button
        className="btn btn-primary"
        onClick={async () => {
          deferred.prompt();
          const { outcome } = await deferred.userChoice;
          localStorage.setItem("pwa_install_prompt_shown", "1");
          if (outcome === "accepted") setInstalled(true);
          setDeferred(null);
        }}
      >
        Instalar aplicación
      </button>
    </div>
  );
}