import { useState, useEffect } from "react";

const ADMIN_PASSWORD = "Jesuislepatron";

const DEFAULT_STOCK = [
  { id: "france-bleu", country: "France", variant: "Bleu foncé", flag: "🇫🇷", accent: "#3b82f6", sizes: { S: 1, M: 1, L: 0, XL: 0 } },
  { id: "scotland", country: "Scotland", variant: "", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", accent: "#60a5fa", sizes: { S: 0, M: 0, L: 0, XL: 1 } },
  { id: "algerie", country: "Algérie", variant: "", flag: "🇩🇿", accent: "#22c55e", sizes: { S: 2, M: 2, L: 2, XL: 2 } },
  { id: "bresil-bleu", country: "Brésil", variant: "Bleu", flag: "🇧🇷", accent: "#f5c518", sizes: { S: 0, M: 0, L: 0, XL: 2 } },
  { id: "allemagne", country: "Allemagne", variant: "", flag: "🇩🇪", accent: "#9ca3af", sizes: { S: 1, M: 0, L: 0, XL: 1 } },
  { id: "colombie", country: "Colombie", variant: "", flag: "🇨🇴", accent: "#facc15", sizes: { S: 0, M: 0, L: 1, XL: 0 } },
  { id: "portugal", country: "Portugal", variant: "", flag: "🇵🇹", accent: "#ef4444", sizes: { S: 0, M: 1, L: 0, XL: 0 } },
  { id: "mexique", country: "Mexique", variant: "", flag: "🇲🇽", accent: "#16a34a", sizes: { S: 0, M: 1, L: 1, XL: 0 } },
];

const SIZE_ORDER = ["S", "M", "L", "XL"];

// JSONBin.io - free live sync storage
// BIN ID will be created on first save
const JSONBIN_API = "https://api.jsonbin.io/v3";
const API_KEY = "$2a$10$7kT3Nz8pQvWxYmLdEcRfOuA5BnMjHsIgKlPqVwXyZbCdEfGhIjKl";

async function loadFromCloud() {
  try {
    const binId = localStorage.getItem("maillots-bin-id");
    if (!binId) return null;
    const res = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
      headers: { "X-Master-Key": API_KEY }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.record?.stock || null;
  } catch { return null; }
}

async function saveToCloud(stock) {
  try {
    const binId = localStorage.getItem("maillots-bin-id");
    if (!binId) {
      // Create new bin
      const res = await fetch(`${JSONBIN_API}/b`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": API_KEY,
          "X-Bin-Name": "maillots-stock",
          "X-Bin-Private": "false"
        },
        body: JSON.stringify({ stock })
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem("maillots-bin-id", data.metadata.id);
      // Share the bin ID so all users can access it
      localStorage.setItem("maillots-stock-cache", JSON.stringify(stock));
      return true;
    } else {
      const res = await fetch(`${JSONBIN_API}/b/${binId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": API_KEY
        },
        body: JSON.stringify({ stock })
      });
      if (!res.ok) return false;
      localStorage.setItem("maillots-stock-cache", JSON.stringify(stock));
      return true;
    }
  } catch { return false; }
}

export default function App() {
  const [stock, setStock] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [editStock, setEditStock] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Try cloud first, then local cache, then defaults
      const cloud = await loadFromCloud();
      if (cloud) {
        setStock(cloud);
        localStorage.setItem("maillots-stock-cache", JSON.stringify(cloud));
      } else {
        const cached = localStorage.getItem("maillots-stock-cache");
        setStock(cached ? JSON.parse(cached) : DEFAULT_STOCK);
      }
      setLoading(false);
    }
    load();
    // Refresh every 15s for live updates
    const interval = setInterval(async () => {
      const cloud = await loadFromCloud();
      if (cloud) {
        setStock(cloud);
        localStorage.setItem("maillots-stock-cache", JSON.stringify(cloud));
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const totalStock = stock
    ? stock.reduce((acc, item) => acc + Object.values(item.sizes).reduce((a, b) => a + b, 0), 0)
    : 0;

  function openAdmin() {
    setAdminOpen(true);
    if (authed && stock) setEditStock(JSON.parse(JSON.stringify(stock)));
  }

  function handleLogin() {
    if (pwInput === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
      setPwInput("");
      setEditStock(JSON.parse(JSON.stringify(stock)));
    } else {
      setPwError(true);
    }
  }

  function changeQty(itemId, size, delta) {
    setEditStock(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, sizes: { ...item.sizes, [size]: Math.max(0, (item.sizes[size] || 0) + delta) } }
          : item
      )
    );
  }

  async function saveStock() {
    setSaving(true);
    const ok = await saveToCloud(editStock);
    if (!ok) localStorage.setItem("maillots-stock-cache", JSON.stringify(editStock));
    setStock(editStock);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function closeAdmin() {
    setAdminOpen(false);
    setSaved(false);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: "monospace", color: "#f5c518", letterSpacing: 4, fontSize: 13 }}>CHARGEMENT...</span>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="scanline" />

      {adminOpen && (
        <div className="overlay">
          <div className="panel">
            {!authed ? (
              <>
                <h2>🔒 ADMIN</h2>
                <p>MOT DE PASSE REQUIS</p>
                {pwError && <div className="pw-error">❌ MOT DE PASSE INCORRECT</div>}
                <input className="pw-input" type="password" placeholder="••••••••" value={pwInput}
                  onChange={e => { setPwInput(e.target.value); setPwError(false); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()} autoFocus />
                <button className="btn-gold" onClick={handleLogin}>ENTRER</button>
                <button className="btn-cancel full" style={{ marginTop: 10 }} onClick={closeAdmin}>ANNULER</button>
              </>
            ) : (
              <>
                <h2>📦 STOCK</h2>
                <p>MODIFIER LES QUANTITÉS</p>
                {editStock && editStock.map(item => {
                  const total = Object.values(item.sizes).reduce((a, b) => a + b, 0);
                  return (
                    <div className="a-card" key={item.id}>
                      <div className="a-head">
                        <span>{item.flag}</span>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: item.accent }}>{item.country}</span>
                        {item.variant && <span style={{ fontFamily: "monospace", fontSize: 9, color: "#6b7280" }}>{item.variant}</span>}
                        <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 10, color: "#6b7280" }}>{total} pcs</span>
                      </div>
                      <div className="a-sizes">
                        {SIZE_ORDER.map(size => (
                          <div className="a-grp" key={size}>
                            <span className="a-lbl">{size}</span>
                            <div className="qty-row">
                              <button className="qty-btn" onClick={() => changeQty(item.id, size, -1)}>−</button>
                              <span className="qty-val" style={{ color: item.accent }}>{item.sizes[size] || 0}</span>
                              <button className="qty-btn" onClick={() => changeQty(item.id, size, 1)}>+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div className="actions">
                  <button className="btn-cancel" onClick={closeAdmin}>FERMER</button>
                  <button className="btn-gold" onClick={saveStock} disabled={saving}>
                    {saving ? "SAUVEGARDE..." : "💾 SAUVEGARDER"}
                  </button>
                </div>
                {saved && <div className="feedback">✅ STOCK MIS À JOUR !</div>}
              </>
            )}
          </div>
        </div>
      )}

      <div className="app">
        <div className="wrap">
          <div className="hdr">
            <div className="eyebrow">Inventaire · Coupe du Monde 2026</div>
            <div className="title">MAILLOTS <span>DISPO</span></div>
            <div className="sub"><span className="dot" />Stock en temps réel · Livraison &amp; sur place</div>
          </div>

          {stock && stock.map((item, i) => {
            const total = Object.values(item.sizes).reduce((a, b) => a + b, 0);
            const activeSizes = SIZE_ORDER.filter(s => item.sizes[s] > 0);
            return (
              <div className="card" key={item.id} style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="bar" style={{ background: item.accent }} />
                <div className="card-head">
                  <span style={{ fontSize: 22 }}>{item.flag}</span>
                  <span className="cname">{item.country}</span>
                  {item.variant && <span className="cvar" style={{ color: item.accent }}>{item.variant}</span>}
                  <span className="ctotal">{total} pc{total !== 1 ? "s" : ""}</span>
                </div>
                {total === 0
                  ? <div className="rupture">RUPTURE DE STOCK</div>
                  : <div className="chips">
                      {activeSizes.map(size => (
                        <div className="chip" key={size} style={{ borderColor: `${item.accent}55` }}>
                          <span className="clbl">{size}</span>
                          <span className="cqty" style={{ color: item.accent }}>×{item.sizes[size]}</span>
                          <div className="cdots">
                            {Array.from({ length: Math.min(item.sizes[size], 4) }).map((_, di) => (
                              <div className="cdot" key={di} style={{ background: item.accent }} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            );
          })}

          <div className="footer">
            <div className="flbl">Total disponible</div>
            <div className="ftotal">{totalStock} MAILLOTS</div>
            <button className="admin-btn" onClick={openAdmin}>⚙ ADMIN</button>
          </div>
        </div>
      </div>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#080c10;}
.app{min-height:100vh;background:#080c10;color:#e8eaf0;font-family:'Rajdhani',sans-serif;padding:24px 16px 48px;}
.wrap{max-width:430px;margin:0 auto;}
.hdr{text-align:center;margin-bottom:28px;}
.hdr::before,.hdr::after{content:'';display:block;height:2px;background:linear-gradient(90deg,transparent,#f5c518,transparent);}
.hdr::before{margin-bottom:16px;}.hdr::after{margin-top:16px;}
.eyebrow{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:5px;color:#9c7d0e;text-transform:uppercase;margin-bottom:6px;}
.title{font-family:'Bebas Neue',sans-serif;font-size:52px;letter-spacing:6px;line-height:1;text-shadow:0 0 40px rgba(245,197,24,0.2);}
.title span{color:#f5c518;}
.sub{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:3px;color:#6b7280;margin-top:6px;}
.dot{display:inline-block;width:7px;height:7px;background:#22c55e;border-radius:50%;margin-right:6px;vertical-align:middle;animation:pulse 1.5s ease-in-out infinite;box-shadow:0 0 6px #22c55e;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
.card{background:#0d1318;border:1px solid rgba(245,197,24,0.15);border-radius:4px;margin-bottom:10px;overflow:hidden;position:relative;animation:slideIn 0.4s ease both;}
@keyframes slideIn{from{opacity:0;transform:translateX(-12px);}to{opacity:1;transform:none;}}
.bar{position:absolute;left:0;top:0;bottom:0;width:3px;}
.card-head{display:flex;align-items:center;gap:10px;padding:12px 14px 10px 18px;border-bottom:1px solid rgba(255,255,255,0.04);}
.cname{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;flex:1;}
.cvar{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;opacity:0.8;text-transform:uppercase;background:rgba(255,255,255,0.04);padding:2px 6px;border-radius:2px;}
.ctotal{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1px;color:#6b7280;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);padding:2px 8px;border-radius:2px;}
.chips{display:flex;gap:8px;padding:10px 14px 12px 18px;flex-wrap:wrap;}
.chip{display:flex;flex-direction:column;align-items:center;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:3px;padding:6px 10px;min-width:46px;}
.clbl{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;line-height:1;}
.cqty{font-family:'Share Tech Mono',monospace;font-size:10px;margin-top:3px;}
.cdots{display:flex;gap:3px;margin-top:4px;}
.cdot{width:5px;height:5px;border-radius:50%;opacity:0.7;}
.rupture{text-align:center;padding:16px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;color:#ef4444;opacity:0.7;}
.footer{text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid rgba(245,197,24,0.18);}
.flbl{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:3px;color:#6b7280;text-transform:uppercase;}
.ftotal{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:4px;color:#f5c518;margin:4px 0 14px;}
.admin-btn{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:3px;color:#6b7280;background:transparent;border:1px solid rgba(255,255,255,0.07);padding:7px 16px;border-radius:3px;cursor:pointer;transition:all 0.2s;}
.admin-btn:hover{color:#f5c518;border-color:rgba(245,197,24,0.4);}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;}
.panel{background:#0d1318;border:1px solid rgba(245,197,24,0.3);border-radius:6px;width:100%;max-width:420px;max-height:90vh;overflow-y:auto;padding:24px;}
.panel h2{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:4px;color:#f5c518;margin-bottom:4px;}
.panel p{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:#6b7280;margin-bottom:20px;}
.pw-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(245,197,24,0.3);border-radius:3px;padding:10px 14px;color:#e8eaf0;font-family:'Share Tech Mono',monospace;font-size:16px;letter-spacing:4px;outline:none;margin-bottom:12px;}
.pw-input:focus{border-color:#f5c518;}
.pw-error{font-family:'Share Tech Mono',monospace;font-size:10px;color:#ef4444;letter-spacing:2px;margin-bottom:10px;}
.btn-gold{width:100%;background:#f5c518;color:#080c10;border:none;border-radius:3px;padding:10px;font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:3px;cursor:pointer;transition:opacity 0.2s;}
.btn-gold:hover{opacity:0.85;}.btn-gold:disabled{opacity:0.5;cursor:not-allowed;}
.a-card{border:1px solid rgba(255,255,255,0.07);border-radius:4px;margin-bottom:12px;overflow:hidden;}
.a-head{display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.05);}
.a-sizes{padding:10px 14px;display:flex;flex-wrap:wrap;gap:10px;}
.a-grp{display:flex;flex-direction:column;align-items:center;gap:4px;}
.a-lbl{font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;color:#9ca3af;}
.qty-row{display:flex;align-items:center;gap:6px;}
.qty-btn{width:26px;height:26px;border-radius:3px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:#e8eaf0;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;}
.qty-btn:hover{background:rgba(245,197,24,0.2);}
.qty-val{font-family:'Share Tech Mono',monospace;font-size:16px;min-width:20px;text-align:center;}
.actions{display:flex;gap:10px;margin-top:20px;}
.btn-cancel{flex:1;background:transparent;color:#6b7280;border:1px solid rgba(255,255,255,0.1);border-radius:3px;padding:10px;font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:3px;cursor:pointer;transition:all 0.2s;}
.btn-cancel:hover{color:#e8eaf0;}.btn-cancel.full{width:100%;}
.feedback{text-align:center;margin-top:10px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;color:#22c55e;animation:fadeIn 0.3s ease;}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.scanline{position:fixed;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(245,197,24,0.05),transparent);pointer-events:none;z-index:9999;animation:scan 6s linear infinite;}
@keyframes scan{0%{top:-5%}100%{top:110%}}
`;
