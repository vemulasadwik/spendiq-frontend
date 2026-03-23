import { useState, useMemo, useRef, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area, LineChart, Line
} from "recharts";

// ── API ───────────────────────────────────────────────────────────────────────
const API_BASE = "https://spendiq-backend-wihw.onrender.com";
const apiCall = async (path, method = "GET", body = null) => {
  const token = localStorage.getItem("spendiq_token");
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Request failed");
  return json.data;
};

const CAT_META = {
  Food:          { color:"#f97316", icon:"🍜" },
  Entertainment: { color:"#8b5cf6", icon:"🎬" },
  Utilities:     { color:"#06b6d4", icon:"⚡" },
  Health:        { color:"#10b981", icon:"💪" },
  Transport:     { color:"#f43f5e", icon:"🚗" },
  Shopping:      { color:"#eab308", icon:"🛍️" },
  Income:        { color:"#22d3ee", icon:"💰" },
  Other:         { color:"#94a3b8", icon:"📦" },
};

const INIT_EXPENSES = [
  { id:1,  title:"Groceries",        amount:1500,  date:"2026-03-01", category:"Food",          type:"expense", recurring:false },
  { id:2,  title:"Netflix",          amount:649,   date:"2026-03-02", category:"Entertainment", type:"expense", recurring:true  },
  { id:3,  title:"Electricity Bill", amount:2200,  date:"2026-03-03", category:"Utilities",     type:"expense", recurring:true  },
  { id:4,  title:"Gym Membership",   amount:999,   date:"2026-03-05", category:"Health",        type:"expense", recurring:true  },
  { id:5,  title:"Petrol",           amount:800,   date:"2026-03-07", category:"Transport",     type:"expense", recurring:false },
  { id:6,  title:"Dinner Out",       amount:1200,  date:"2026-03-08", category:"Food",          type:"expense", recurring:false },
  { id:7,  title:"Freelance Work",   amount:8000,  date:"2026-03-04", category:"Income",        type:"income",  recurring:false },
  { id:8,  title:"Salary",           amount:45000, date:"2026-03-01", category:"Income",        type:"income",  recurring:true  },
];

const MONTHLY_DATA = [
  { month:"Jan", income:45000, expense:18500 },
  { month:"Feb", income:45000, expense:22100 },
  { month:"Mar", income:53000, expense:7348  },
];

function exportCSV(expenses) {
  const header = "ID,Title,Amount,Date,Category,Type,Recurring";
  const rows = expenses.map(e => `${e.id},"${e.title}",${e.amount},${e.date},${e.category},${e.type},${e.recurring}`);
  const blob = new Blob([[header,...rows].join("\n")], { type:"text/csv" });
  const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="expenses.csv"; a.click();
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [authUser, setAuthUser]   = useState(null);
  const [authPage, setAuthPage]   = useState("login");
  const [allUsers, setAllUsers]   = useState([]);

  const fetchAllUsers = async () => {
    try { setAllUsers(await apiCall("/api/auth/users")); } catch(e) { console.error(e); }
  };

  const handleLogin = (user, token) => {
    localStorage.setItem("spendiq_token", token);
    setAuthUser(user);
    fetchAllUsers();
  };

  if (!authUser) return <AuthScreen onLogin={handleLogin} authPage={authPage} setAuthPage={setAuthPage}/>;
  return <Dashboard key={authUser?.id || authUser?.email} user={authUser} allUsers={allUsers} onLogout={()=>{ localStorage.removeItem("spendiq_token"); setAuthUser(null); setAllUsers([]); }}/>;
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function AuthScreen({ onLogin, authPage, setAuthPage }) {
  const [form, setForm]     = useState({ name:"", email:"", password:"", confirm:"" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const data = await apiCall("/api/auth/login", "POST", { email:form.email, password:form.password });
      onLogin(data.user, data.token);
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setError("");
    if (!form.name||!form.email||!form.password) { setError("All fields required."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const data = await apiCall("/api/auth/register", "POST", { name:form.name, email:form.email, password:form.password });
      onLogin(data.user, data.token);
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#0b0b10", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#dde1f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .ainp{background:#161622;border:1px solid #22223a;border-radius:12px;padding:12px 16px;color:#dde1f0;font-family:'DM Sans',sans-serif;font-size:14px;width:100%;outline:none;transition:border-color .2s}
        .ainp:focus{border-color:#5b5ef4;box-shadow:0 0 0 3px #5b5ef420}
        .abtn{background:linear-gradient(135deg,#5b5ef4,#8b5cf6);border:none;color:#fff;padding:13px;border-radius:12px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;width:100%;transition:opacity .2s;box-shadow:0 4px 20px #5b5ef440;letter-spacing:.02em}
        .abtn:hover{opacity:.88}
        .abtn:disabled{opacity:.5;cursor:not-allowed}
      `}</style>

      <div style={{ position:"fixed", inset:0, overflow:"hidden", zIndex:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,#5b5ef430,transparent 70%)", top:-100, left:-100 }}/>
        <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,#8b5cf620,transparent 70%)", bottom:-80, right:-80 }}/>
      </div>

      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:420, padding:20 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:44, marginBottom:8 }}>💸</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:32, background:"linear-gradient(135deg,#5b5ef4,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>SpendIQ Pro</div>
          <div style={{ color:"#5a5f7a", fontSize:13, marginTop:6 }}>Smart Expense & Group Splitting</div>
        </div>

        <div style={{ background:"#13131c", border:"1px solid #1f1f30", borderRadius:22, padding:32, boxShadow:"0 25px 80px #00000080" }}>
          <div style={{ display:"flex", background:"#0e0e17", borderRadius:12, padding:4, marginBottom:26, gap:4 }}>
            {["login","register"].map(t=>(
              <button key={t} onClick={()=>{ setAuthPage(t); setError(""); setForm({ name:"",email:"",password:"",confirm:"" }); }}
                style={{ flex:1, padding:"9px", border:"none", cursor:"pointer", borderRadius:9, fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13.5, transition:"all .2s",
                  background: authPage===t?"linear-gradient(135deg,#5b5ef4,#8b5cf6)":"transparent",
                  color: authPage===t?"#fff":"#5a5f7a", boxShadow: authPage===t?"0 2px 12px #5b5ef440":"none" }}>
                {t==="login"?"Sign In":"Register"}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {authPage==="register" && (
              <div>
                <div style={{ fontSize:11.5, color:"#5a5f7a", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:".04em" }}>Full Name</div>
                <input className="ainp" placeholder="Arjun Sharma" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
              </div>
            )}
            <div>
              <div style={{ fontSize:11.5, color:"#5a5f7a", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:".04em" }}>Email</div>
              <input className="ainp" type="email" placeholder="you@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
            </div>
            <div>
              <div style={{ fontSize:11.5, color:"#5a5f7a", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:".04em" }}>Password</div>
              <input className="ainp" type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
            </div>
            {authPage==="register" && (
              <div>
                <div style={{ fontSize:11.5, color:"#5a5f7a", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:".04em" }}>Confirm Password</div>
                <input className="ainp" type="password" placeholder="••••••••" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})}/>
              </div>
            )}
            {error && <div style={{ background:"#2a141a", border:"1px solid #f43f5e44", borderRadius:10, padding:"10px 14px", color:"#f43f5e", fontSize:13 }}>⚠️ {error}</div>}
            <button className="abtn" style={{ marginTop:4 }} disabled={loading} onClick={authPage==="login"?handleLogin:handleRegister}>
              {loading?"Please wait…":authPage==="login"?"Sign In →":"Create Account →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function Dashboard({ user, onLogout, allUsers }) {
  const [dark, setDark]           = useState(true);
  const [page, setPage]           = useState("dashboard");

  // ── Stable per-user storage keys ─────────────────────────────────────────
  // Use a ref so the key never changes mid-session even if user object updates
  const userKey    = user?.id || user?.email || "default";
  const storageKey = `spendiq_expenses_${userKey}`;
  const budgetKey  = `spendiq_budget_${userKey}`;

  // ── Helper: read from localStorage safely ────────────────────────────────
  const readLS = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  };

  // ── Helper: write to localStorage safely ─────────────────────────────────
  const writeLS = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  // ── Expenses: load from localStorage on mount, write on every change ─────
  const [expenses, setExpensesRaw] = useState(() => readLS(storageKey, []));

  const setExpenses = (val) => {
    setExpensesRaw(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      writeLS(storageKey, next);
      return next;
    });
  };

  // ── Budget: same pattern ──────────────────────────────────────────────────
  const [budget, setBudgetRaw] = useState(() => readLS(budgetKey, 15000));

  const setBudget = (val) => {
    setBudgetRaw(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      writeLS(budgetKey, next);
      return next;
    });
  };

  const [modal, setModal]         = useState(false);
  const [editTarget, setEdit]     = useState(null);
  const [filterCat, setFilterCat] = useState("All");
  const [search, setSearch]       = useState("");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [budgetEdit, setBudgetEdit] = useState(false);
  const [budgetInput, setBudgetInput] = useState(() => readLS(budgetKey, 15000));
  const [groups, setGroups]       = useState([]);
  const qrKey = `spendiq_qrmap_shared`; // shared across all users — QR codes belong to groups, not users
  const [qrMap, setQrMapRaw]      = useState(() => readLS(qrKey, {}));
  const [notifications, setNotifications] = useState({});
  const [splitterNav, setSplitterNav] = useState(null);
  const [showBell, setShowBell]   = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [form, setForm]           = useState({ title:"", amount:"", date:"", category:"Food", type:"expense", recurring:false });

  const refreshNotifications = async () => {
    try {
      const unread = await apiCall("/api/notifications/unread");
      const converted = unread.map(n => ({
        id: String(n.id),
        groupId: n.splitId,
        groupTitle: n.splitTitle,
        paidBy: n.paidByName,
        amount: parseFloat(n.amount),
        date: String(n.splitDate),
        dismissed: false,
      }));
      setNotifications({ [user.name]: converted });
      return converted;
    } catch(e) { console.error(e); return []; }
  };

  useEffect(() => {
    refreshNotifications().then(converted => {
      if (converted.length > 0) {
        setTimeout(() => setShowLoginPopup(true), 600);
      }
    });
  }, []);

  const myNotifs = (notifications[user.name] || []).filter(n => !n.dismissed);
  const unreadCount = myNotifs.length;

  const addNotificationsForGroup = () => {};

  const dismissNotificationForMember = async (groupId, memberName) => {
    try {
      const notif = (notifications[user.name] || []).find(n => n.groupId === groupId);
      if (notif) {
        await apiCall(`/api/notifications/${notif.id}/dismiss`, "PATCH");
        await refreshNotifications();
      }
    } catch(e) { console.error(e); }
  };

  const handleQRUpload = (groupId, memberName, file) => {
    if (!file) return;
    const gid = String(groupId); // normalize to string — JSON keys are always strings
    const reader = new FileReader();
    reader.onload = ev => {
      setQrMapRaw(prev => {
        const next = {
          ...prev,
          [gid]: { ...(prev[gid]||{}), [memberName]: ev.target.result }
        };
        writeLS(qrKey, next);
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const T = dark ? {
    bg:"#0b0b10", sidebar:"#0e0e17", card:"#13131c", row:"#161622",
    border:"#1f1f30", border2:"#22223a", text:"#dde1f0", muted:"#5a5f7a",
    input:"#161622", accent:"#5b5ef4", accentG:"linear-gradient(135deg,#5b5ef4,#8b5cf6)",
    hover:"#1b1b2e", ttBg:"#161622", navActive:"linear-gradient(135deg,#5b5ef4,#8b5cf6)",
  } : {
    bg:"#f0f2fa", sidebar:"#ffffff", card:"#ffffff", row:"#f7f8fc",
    border:"#e2e6f0", border2:"#dde3f0", text:"#1a1d2e", muted:"#7880a0",
    input:"#f0f2fa", accent:"#5b5ef4", accentG:"linear-gradient(135deg,#5b5ef4,#8b5cf6)",
    hover:"#edf0fb", ttBg:"#ffffff", navActive:"linear-gradient(135deg,#5b5ef4,#8b5cf6)",
  };

  const marchExp    = expenses.filter(e=>e.type==="expense"&&e.date.startsWith("2026-03"));
  const marchInc    = expenses.filter(e=>e.type==="income" &&e.date.startsWith("2026-03"));
  const totalSpent  = marchExp.reduce((s,e)=>s+e.amount,0);
  const totalIncome = marchInc.reduce((s,e)=>s+e.amount,0);
  const savings     = totalIncome - totalSpent;
  const budgetPct   = Math.min((totalSpent/budget)*100,100);

  const filtered = useMemo(()=>expenses.filter(e=>{
    if (filterCat!=="All"&&e.category!==filterCat) return false;
    if (search&&!e.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom&&e.date<dateFrom) return false;
    if (dateTo&&e.date>dateTo) return false;
    return true;
  }),[expenses,filterCat,search,dateFrom,dateTo]);

  const categoryData = Object.entries(CAT_META).filter(([n])=>n!=="Income")
    .map(([name,m])=>({ name, color:m.color, value:marchExp.filter(e=>e.category===name).reduce((s,e)=>s+e.amount,0) }))
    .filter(c=>c.value>0);

  const openAdd  = () => { setForm({ title:"", amount:"", date:"", category:"Food", type:"expense", recurring:false }); setEdit(null); setModal("entry"); };
  const openEdit = (e) => { setForm({ title:e.title, amount:e.amount, date:e.date, category:e.category, type:e.type, recurring:e.recurring }); setEdit(e.id); setModal("entry"); };
  const saveEntry = () => {
    if (!form.title||!form.amount||!form.date) return;
    if (editTarget) setExpenses(expenses.map(e=>e.id===editTarget?{...e,...form,amount:parseFloat(form.amount)}:e));
    else setExpenses([...expenses,{ id:Date.now(),...form,amount:parseFloat(form.amount) }]);
    setModal(false);
  };
  const del = (id) => setExpenses(expenses.filter(e=>e.id!==id));

  const ttStyle = { background:T.ttBg, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:12 };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:${T.bg}}::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
    .nb{background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;width:100%;text-align:left;display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:12px;font-size:13.5px;font-weight:500;color:${T.muted};transition:all .18s}
    .nb:hover{background:${T.hover};color:${T.text}}
    .nb.on{background:${T.navActive};color:#fff;box-shadow:0 4px 20px #5b5ef440}
    .card{background:${T.card};border:1px solid ${T.border};border-radius:18px;padding:22px}
    .sc{background:${T.card};border:1px solid ${T.border};border-radius:18px;padding:20px;transition:transform .2s,box-shadow .2s}
    .sc:hover{transform:translateY(-3px);box-shadow:0 8px 30px #00000030}
    .row{display:flex;align-items:center;justify-content:space-between;padding:13px 15px;border-radius:12px;background:${T.row};border:1px solid ${T.border2};margin-bottom:8px;transition:all .18s}
    .row:hover{border-color:${T.accent}44;background:${T.hover}}
    .pill{padding:5px 14px;border-radius:20px;border:1px solid ${T.border2};background:${T.row};color:${T.muted};font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s}
    .pill.on{border-color:${T.accent};background:${dark?"#1a1a3a":"#eceeff"};color:${dark?"#a5b4fc":"#5b5ef4"}}
    .btn{background:${T.accentG};border:none;color:#fff;padding:10px 20px;border-radius:11px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;font-size:13.5px;transition:opacity .18s;box-shadow:0 4px 18px #5b5ef430}
    .btn:hover{opacity:.88}
    .btn-g{background:${T.row};border:1px solid ${T.border2};color:${T.muted};padding:9px 18px;border-radius:11px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:500;font-size:13px;transition:all .18s}
    .btn-g:hover{border-color:${T.accent};color:${T.text}}
    .inp{background:${T.input};border:1px solid ${T.border2};border-radius:11px;padding:10px 14px;color:${T.text};font-family:'DM Sans',sans-serif;font-size:13.5px;width:100%;outline:none;transition:border-color .18s}
    .inp:focus{border-color:${T.accent};box-shadow:0 0 0 3px ${T.accent}18}
    .dbtn{background:none;border:none;cursor:pointer;color:${T.muted};font-size:14px;padding:5px 8px;border-radius:7px;transition:all .18s}
    .dbtn:hover{color:#f43f5e;background:${dark?"#2a141a":"#ffe4e8"}}
    .ebtn{background:none;border:none;cursor:pointer;color:${T.muted};font-size:14px;padding:5px 8px;border-radius:7px;transition:all .18s}
    .ebtn:hover{color:#5b5ef4;background:${dark?"#1a1a3a":"#eceeff"}}
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(6px)}
    .modal{background:${T.card};border:1px solid ${T.border};border-radius:22px;padding:30px;width:460px;max-height:90vh;overflow-y:auto;box-shadow:0 25px 80px #00000080}
    .srch{background:${T.input};border:1px solid ${T.border2};border-radius:11px;padding:9px 14px 9px 36px;color:${T.text};font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .18s;width:200px}
    .srch:focus{border-color:${T.accent}}
    .alert{padding:11px 16px;border-radius:12px;border-left:3px solid #f97316;background:${dark?"#1a1420":"#fff8f0"};font-size:13px;color:${T.text};margin-bottom:10px}
    lbl{font-size:11.5px;color:${T.muted};font-weight:600;display:block;margin-bottom:6px;letter-spacing:.04em;text-transform:uppercase}
    .tag{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600}
    .avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#5b5ef4,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
  `;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:T.bg, minHeight:"100vh", display:"flex", color:T.text }}>
      <style>{css}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:218, background:T.sidebar, borderRight:`1px solid ${T.border}`, padding:"22px 14px", display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
        <div style={{ paddingLeft:8, marginBottom:22 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:21, background:"linear-gradient(135deg,#5b5ef4,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>💸 SpendIQ Pro</div>
          <div style={{ fontSize:10, color:T.muted, marginTop:2, letterSpacing:".06em" }}>SMART EXPENSE TRACKER</div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:T.row, borderRadius:12, border:`1px solid ${T.border2}`, marginBottom:8 }}>
          <div className="avatar">{user.avatar}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.name}</div>
            <div style={{ fontSize:11, color:T.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.email}</div>
          </div>
          <button onClick={()=>setShowBell(v=>!v)} style={{ background:"none", border:"none", cursor:"pointer", padding:"4px", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, flexShrink:0, position:"relative" }}>
            <span style={{ fontSize:17 }}>🔔</span>
            {unreadCount > 0 && (
              <span style={{ position:"absolute", top:-1, right:-1, background:"#f43f5e", color:"#fff", borderRadius:"50%", minWidth:15, height:15, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${T.sidebar}`, padding:"0 2px" }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {[["dashboard","▦","Dashboard"],["expenses","☰","Expenses"],["analytics","◎","Analytics"],["recurring","↻","Recurring"],["splitter","⚡","Group Splitter"]].map(([id,ic,lb])=>(
          <button key={id} className={`nb ${page===id?"on":""}`} onClick={()=>setPage(id)}>
            <span style={{ fontSize:15 }}>{ic}</span>{lb}
            {id==="splitter"&&groups.length>0&&<span style={{ marginLeft:"auto", background:"#5b5ef4", color:"#fff", borderRadius:10, fontSize:10, padding:"1px 7px", fontWeight:700 }}>{groups.length}</span>}
          </button>
        ))}

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", marginTop:4 }}>
          <span style={{ fontSize:12.5, color:T.muted }}>{dark?"🌙 Dark":"☀️ Light"}</span>
          <button onClick={()=>setDark(!dark)} style={{ width:44, height:24, borderRadius:12, background:dark?"#5b5ef4":"#d1d5db", border:"none", cursor:"pointer", position:"relative", transition:"background .2s" }}>
            <span style={{ position:"absolute", width:18, height:18, borderRadius:"50%", background:"white", top:3, left:dark?23:3, transition:"left .2s", boxShadow:"0 1px 4px #00000040", display:"block" }}/>
          </button>
        </div>

        <div style={{ marginTop:"auto", padding:14, background:T.row, borderRadius:14, border:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
            <div style={{ fontSize:11, color:T.muted, textTransform:"uppercase", letterSpacing:".05em" }}>Monthly Budget</div>
            {!budgetEdit && <button onClick={()=>{ setBudgetInput(budget); setBudgetEdit(true); }} style={{ background:"none", border:"none", cursor:"pointer", color:T.accent, fontSize:12, padding:0, fontFamily:"'DM Sans',sans-serif" }}>✎ Edit</button>}
          </div>
          {budgetEdit ? (
            <div style={{ marginTop:8 }}>
              <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                <button onClick={()=>setBudgetInput(v=>Math.max(0,v-1000))} style={{ background:T.input, border:`1px solid ${T.border2}`, borderRadius:8, color:T.text, padding:"6px 12px", cursor:"pointer", fontSize:16, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>−</button>
                <input type="number" value={budgetInput} onChange={e=>setBudgetInput(Math.max(0,Number(e.target.value)))}
                  style={{ background:T.input, border:`1px solid ${T.accent}`, borderRadius:8, padding:"6px 8px", color:T.text, fontSize:13, width:"100%", outline:"none", fontFamily:"'DM Sans',sans-serif", textAlign:"center", fontWeight:700 }}/>
                <button onClick={()=>setBudgetInput(v=>v+1000)} style={{ background:T.input, border:`1px solid ${T.border2}`, borderRadius:8, color:T.text, padding:"6px 12px", cursor:"pointer", fontSize:16, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>+</button>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>{ setBudget(budgetInput); setBudgetEdit(false); }} style={{ flex:1, background:T.accentG, border:"none", borderRadius:8, color:"#fff", padding:"7px", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>✓ Save</button>
                <button onClick={()=>setBudgetEdit(false)} style={{ flex:1, background:"none", border:`1px solid ${T.border2}`, borderRadius:8, color:T.muted, padding:"7px", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:22, fontWeight:700, marginTop:4 }}>₹{budget.toLocaleString()}</div>
              <div style={{ background:T.border, borderRadius:6, height:5, marginTop:10 }}>
                <div style={{ background:budgetPct>=100?"#f43f5e":budgetPct>=80?"#f97316":"linear-gradient(90deg,#5b5ef4,#a78bfa)", width:`${budgetPct}%`, height:"100%", borderRadius:6, transition:"width .6s" }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                <span style={{ fontSize:11, color:budgetPct>=80?"#f97316":T.muted }}>₹{totalSpent.toLocaleString()} spent</span>
                <span style={{ fontSize:11, color:budgetPct>=100?"#f43f5e":budgetPct>=80?"#f97316":T.muted }}>{budgetPct.toFixed(0)}%</span>
              </div>
              <div style={{ display:"flex", gap:6, marginTop:10 }}>
                <button onClick={()=>{ setBudget(b=>Math.max(0,b-1000)); }} style={{ flex:1, background:T.input, border:`1px solid ${T.border2}`, borderRadius:8, color:T.text, padding:"5px", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>−1k</button>
                <button onClick={()=>{ setBudget(b=>b+1000); }} style={{ flex:1, background:T.input, border:`1px solid ${T.border2}`, borderRadius:8, color:T.text, padding:"5px", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>+1k</button>
              </div>
            </>
          )}
        </div>

        <button onClick={onLogout} style={{ background:"none", border:`1px solid ${T.border2}`, borderRadius:11, padding:"9px", color:T.muted, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, marginTop:8, transition:"all .18s", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
          onMouseOver={e=>e.currentTarget.style.borderColor="#f43f5e"} onMouseOut={e=>e.currentTarget.style.borderColor=T.border2}>
          ⎋ Sign Out
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex:1, padding:26, overflowY:"auto" }}>

        {(page==="dashboard"||page==="expenses") && budgetPct>=80 && (
          <div className="alert" style={{ borderLeftColor:budgetPct>=100?"#f43f5e":"#f97316" }}>
            {budgetPct>=100?"🚨 You've exceeded your monthly budget!":"⚠️ "+budgetPct.toFixed(0)+"% of budget used this month."}
          </div>
        )}

        {/* ═══ DASHBOARD ═══ */}
        {page==="dashboard" && <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:26 }}>Welcome back, {user.name.split(" ")[0]} 👋</div>
              <div style={{ color:T.muted, fontSize:13, marginTop:4 }}>March 2026 — Financial Overview</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn-g" onClick={()=>exportCSV(expenses)}>⬇ CSV</button>
              <button className="btn" onClick={openAdd}>+ Add Entry</button>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
            {[
              { label:"Total Income",  value:`₹${totalIncome.toLocaleString()}`,  accent:"#22d3ee" },
              { label:"Total Spent",   value:`₹${totalSpent.toLocaleString()}`,   accent:"#f43f5e" },
              { label:"Net Savings",   value:`₹${savings.toLocaleString()}`,      accent:savings>=0?"#10b981":"#f43f5e" },
              { label:"Transactions",  value:marchExp.length,                     accent:"#8b5cf6" },
            ].map((s,i)=>(
              <div key={i} className="sc">
                <div style={{ fontSize:10.5, color:T.muted, textTransform:"uppercase", letterSpacing:".05em", marginBottom:7 }}>{s.label}</div>
                <div style={{ fontSize:25, fontWeight:800, color:s.accent, fontFamily:"'Syne',sans-serif" }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:16, marginBottom:16 }}>
            <div className="card">
              <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Income vs Expenses</div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={MONTHLY_DATA} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="month" tick={{ fill:T.muted, fontSize:12 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip formatter={v=>`₹${v.toLocaleString()}`} contentStyle={ttStyle}/>
                  <Legend wrapperStyle={{ fontSize:12, color:T.muted }}/>
                  <Bar dataKey="income" name="Income" fill="#22d3ee" radius={[6,6,0,0]}/>
                  <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>By Category</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={44} outerRadius={70} dataKey="value" paddingAngle={4}>
                    {categoryData.map((c,i)=><Cell key={i} fill={c.color}/>)}
                  </Pie>
                  <Tooltip formatter={v=>`₹${v.toLocaleString()}`} contentStyle={ttStyle}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:4 }}>
                {categoryData.map((c,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:c.color }}/>
                    <span style={{ color:T.muted }}>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>Savings Trend</div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={MONTHLY_DATA.map(m=>({ month:m.month, savings:m.income-m.expense }))}>
                <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="month" tick={{ fill:T.muted, fontSize:12 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={v=>`₹${v.toLocaleString()}`} contentStyle={ttStyle}/>
                <Area type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} fill="url(#sg)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>}

        {/* ═══ EXPENSES ═══ */}
        {page==="expenses" && <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:26 }}>All Entries</div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn-g" onClick={()=>exportCSV(filtered)}>⬇ CSV</button>
              <button className="btn" onClick={openAdd}>+ Add Entry</button>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:T.muted, fontSize:13 }}>🔍</span>
              <input className="srch" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <input className="inp" type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ width:148 }}/>
            <span style={{ color:T.muted }}>→</span>
            <input className="inp" type="date" value={dateTo}   onChange={e=>setDateTo(e.target.value)}   style={{ width:148 }}/>
            {(search||dateFrom||dateTo)&&<button className="btn-g" style={{ padding:"8px 12px",fontSize:12 }} onClick={()=>{setSearch("");setDateFrom("");setDateTo("");}}>✕ Clear</button>}
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            {["All","Food","Entertainment","Utilities","Health","Transport","Shopping","Income"].map(c=>(
              <button key={c} className={`pill ${filterCat===c?"on":""}`} onClick={()=>setFilterCat(c)}>{c}</button>
            ))}
          </div>
          <div className="card">
            {filtered.length===0&&<div style={{ color:T.muted, textAlign:"center", padding:50, fontSize:14 }}>No entries match.</div>}
            {filtered.map(e=>(
              <div key={e.id} className="row">
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:(CAT_META[e.category]?.color||"#94a3b8")+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{CAT_META[e.category]?.icon||"📦"}</div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14, display:"flex", alignItems:"center", gap:7 }}>
                      {e.title}
                      {e.recurring&&<span className="tag" style={{ background:"#5b5ef420", color:"#a5b4fc" }}>↻</span>}
                    </div>
                    <div style={{ fontSize:11.5, color:T.muted }}>{e.date} · <span style={{ color:CAT_META[e.category]?.color }}>{e.category}</span></div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ fontWeight:800, fontSize:15, color:e.type==="income"?"#22d3ee":"#f43f5e" }}>{e.type==="income"?"+":"−"}₹{e.amount.toLocaleString()}</div>
                  <button className="ebtn" onClick={()=>openEdit(e)}>✎</button>
                  <button className="dbtn" onClick={()=>del(e.id)}>✕</button>
                </div>
              </div>
            ))}
            {filtered.length>0&&(
              <div style={{ marginTop:12, padding:"11px 15px", background:T.bg, borderRadius:11, display:"flex", justifyContent:"space-between", fontSize:13 }}>
                <span style={{ color:T.muted }}>{filtered.length} entries</span>
                <span style={{ fontWeight:700, color:T.accent }}>Net: ₹{filtered.reduce((s,e)=>s+(e.type==="income"?e.amount:-e.amount),0).toLocaleString()}</span>
              </div>
            )}
          </div>
        </>}

        {/* ═══ ANALYTICS ═══ */}
        {page==="analytics" && <>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:26, marginBottom:22 }}>Analytics</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
            <div className="card">
              <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Spending Distribution</div>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={85} dataKey="value" paddingAngle={3} label={({name,percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {categoryData.map((c,i)=><Cell key={i} fill={c.color}/>)}
                  </Pie>
                  <Tooltip formatter={v=>`₹${v.toLocaleString()}`} contentStyle={ttStyle}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Category Breakdown</div>
              {categoryData.map((c,i)=>(
                <div key={i} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{CAT_META[c.name].icon} {c.name}</span>
                    <span style={{ fontSize:13, color:c.color, fontWeight:700 }}>₹{c.value.toLocaleString()}</span>
                  </div>
                  <div style={{ background:T.border, borderRadius:5, height:5 }}>
                    <div style={{ background:c.color, width:`${(c.value/totalSpent)*100}%`, height:"100%", borderRadius:5, transition:"width .6s" }}/>
                  </div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{((c.value/totalSpent)*100).toFixed(1)}% of total</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Monthly Comparison</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={MONTHLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="month" tick={{ fill:T.muted, fontSize:12 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={v=>`₹${v.toLocaleString()}`} contentStyle={ttStyle}/>
                <Legend wrapperStyle={{ fontSize:12 }}/>
                <Bar dataKey="income" name="Income" fill="#22d3ee" radius={[5,5,0,0]}/>
                <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[5,5,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>}

        {/* ═══ RECURRING ═══ */}
        {page==="recurring" && <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:26 }}>Recurring</div>
            <button className="btn" onClick={openAdd}>+ Add Entry</button>
          </div>
          {(() => {
            const rec = expenses.filter(e=>e.recurring);
            const rOut = rec.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0);
            const rIn  = rec.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0);
            return <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:18 }}>
                {[{label:"Recurring Entries",value:rec.length,accent:"#8b5cf6"},{label:"Monthly Outflow",value:`₹${rOut.toLocaleString()}`,accent:"#f43f5e"},{label:"Monthly Inflow",value:`₹${rIn.toLocaleString()}`,accent:"#22d3ee"}].map((s,i)=>(
                  <div key={i} className="sc">
                    <div style={{ fontSize:10.5, color:T.muted, textTransform:"uppercase", letterSpacing:".05em", marginBottom:6 }}>{s.label}</div>
                    <div style={{ fontSize:24, fontWeight:800, color:s.accent, fontFamily:"'Syne',sans-serif" }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                {rec.map(e=>(
                  <div key={e.id} className="row">
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:40, height:40, borderRadius:12, background:(CAT_META[e.category]?.color||"#94a3b8")+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{CAT_META[e.category]?.icon||"📦"}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{e.title}</div>
                        <div style={{ fontSize:11.5, color:T.muted }}><span style={{ color:CAT_META[e.category]?.color }}>{e.category}</span> · Monthly</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span className="tag" style={{ background:e.type==="income"?"#22d3ee22":"#f43f5e22", color:e.type==="income"?"#22d3ee":"#f43f5e" }}>{e.type==="income"?"+":"−"}₹{e.amount.toLocaleString()}</span>
                      <button className="ebtn" onClick={()=>openEdit(e)}>✎</button>
                      <button className="dbtn" onClick={()=>del(e.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </>;
          })()}
        </>}

        {/* ═══ GROUP SPLITTER ═══ */}
        {page==="splitter" && <GroupSplitter T={T} dark={dark} groups={groups} setGroups={setGroups} addNotificationsForGroup={addNotificationsForGroup} dismissNotificationForMember={dismissNotificationForMember} allUsers={allUsers} currentUser={user} qrMap={qrMap} handleQRUpload={handleQRUpload} splitterNav={splitterNav} setSplitterNav={setSplitterNav}/>}
      </main>

      {showBell && <div style={{ position:"fixed", inset:0, zIndex:299 }} onClick={()=>setShowBell(false)}/>}

      {showBell && (
        <div style={{ position:"fixed", top:70, left:14, width:300, background:T.card, border:`1px solid ${T.border}`, borderRadius:16, boxShadow:"0 16px 50px #00000080", zIndex:400, overflow:"hidden" }}
          onClick={e=>e.stopPropagation()}>
          <div style={{ padding:"13px 16px 10px", borderBottom:`1px solid ${T.border2}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontWeight:700, fontSize:14, color:T.text }}>🔔 Notifications</div>
            <button onClick={()=>setShowBell(false)} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:16, lineHeight:1 }}>✕</button>
          </div>
          <div style={{ maxHeight:300, overflowY:"auto" }}>
            {myNotifs.length === 0 ? (
              <div style={{ padding:"24px 16px", textAlign:"center", color:T.muted, fontSize:13 }}>✅ All caught up — no pending payments!</div>
            ) : myNotifs.map(n => (
              <div key={n.id} style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border2}`, background:T.row }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#f97316", textTransform:"uppercase", letterSpacing:".04em" }}>💸 Payment Due</div>
                  <button onClick={()=>dismissNotificationForMember(n.groupId, user.name)} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:13, padding:"0 2px" }}>✕</button>
                </div>
                <div style={{ fontSize:13, color:T.text, marginTop:4 }}>
                  You owe <strong style={{ color:"#f43f5e" }}>₹{n.amount.toFixed(2)}</strong> to <strong style={{ color:"#22d3ee" }}>{n.paidBy}</strong>
                </div>
                <div style={{ fontSize:11.5, color:T.muted, marginTop:3 }}>📋 {n.groupTitle} · {n.date}</div>
                <button onClick={()=>{ setSplitterNav({groupId:n.groupId}); setPage("splitter"); setShowBell(false); }}
                  style={{ marginTop:9, background:"linear-gradient(135deg,#5b5ef4,#8b5cf6)", border:"none", color:"#fff", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer", width:"100%" }}>
                  View Split →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showLoginPopup && myNotifs.length > 0 && (
        <div className="overlay" onClick={()=>setShowLoginPopup(false)}>
          <div className="modal" style={{ maxWidth:420 }} onClick={e=>e.stopPropagation()}>
            <div style={{ textAlign:"center", marginBottom:18 }}>
              <div style={{ fontSize:38, marginBottom:8 }}>🔔</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:20 }}>
                You have {myNotifs.length} pending payment{myNotifs.length > 1 ? "s" : ""}!
              </div>
              <div style={{ color:T.muted, fontSize:13, marginTop:6 }}>These were split while you were away</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:18, maxHeight:260, overflowY:"auto" }}>
              {myNotifs.map(n => (
                <div key={n.id} style={{ padding:"14px 16px", background:T.row, border:`1px solid #f9731640`, borderRadius:13, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:"#f97316" }}>💸 {n.groupTitle}</div>
                    <div style={{ fontSize:12, color:T.muted, marginTop:3 }}>{n.date} · Paid by <span style={{ color:"#22d3ee", fontWeight:600 }}>{n.paidBy}</span></div>
                  </div>
                  <div style={{ fontWeight:800, fontSize:18, color:"#f43f5e", fontFamily:"'Syne',sans-serif" }}>₹{n.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn" style={{ flex:1 }} onClick={()=>{ setSplitterNav({groupId:myNotifs[0]?.groupId}); setPage("splitter"); setShowLoginPopup(false); }}>
                Go to Group Splitter →
              </button>
              <button className="btn-g" style={{ flex:1 }} onClick={()=>setShowLoginPopup(false)}>
                Remind Me Later
              </button>
            </div>
          </div>
        </div>
      )}

      {modal==="entry" && (
        <div className="overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:20, marginBottom:20 }}>{editTarget?"✎ Edit Entry":"+ New Entry"}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><lbl>Title</lbl><input className="inp" placeholder="e.g. Dinner" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><lbl>Amount (₹)</lbl><input className="inp" type="number" placeholder="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
                <div><lbl>Date</lbl><input className="inp" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><lbl>Category</lbl>
                  <select className="inp" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                    {Object.keys(CAT_META).map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><lbl>Type</lbl>
                  <select className="inp" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:T.row, borderRadius:11, border:`1px solid ${T.border2}` }}>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:600 }}>Recurring</div>
                  <div style={{ fontSize:11.5, color:T.muted }}>Repeats every month</div>
                </div>
                <button onClick={()=>setForm({...form,recurring:!form.recurring})}
                  style={{ width:44, height:24, borderRadius:12, background:form.recurring?"#5b5ef4":"#d1d5db", border:"none", cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0 }}>
                  <span style={{ position:"absolute", width:18, height:18, borderRadius:"50%", background:"white", top:3, left:form.recurring?23:3, transition:"left .2s", boxShadow:"0 1px 4px #00000040", display:"block" }}/>
                </button>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button className="btn" style={{ flex:1 }} onClick={saveEntry}>{editTarget?"Save Changes":"Add Entry"}</button>
                <button className="btn-g" style={{ flex:1 }} onClick={()=>setModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GROUP SPLITTER
// ══════════════════════════════════════════════════════════════════════════════
function GroupSplitter({ T, dark, groups, setGroups, allUsers, currentUser, qrMap, handleQRUpload, splitterNav, setSplitterNav, addNotificationsForGroup, dismissNotificationForMember }) {
  const [view, setView]           = useState("list");
  const [activeGroupId, setActiveId] = useState(null);
  const [gForm, setGForm]         = useState({ title:"", selectedMembers:[], totalAmount:"", paidBy:"", date:"", note:"" });
  const [formError, setFormError] = useState("");
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (splitterNav?.groupId) {
      setActiveId(splitterNav.groupId);
      setView("detail");
      setSplitterNav(null);
    }
  }, [splitterNav]);

  const loadGroups = async () => {
    try {
      const data = await apiCall("/api/splits");
      if (data.length > 0) console.log("🔍 Split API sample:", JSON.stringify(data[0], null, 2));
      // Read locally stored createdBy map (groupId -> creatorName)
      let createdByMap = {};
      try { createdByMap = JSON.parse(localStorage.getItem("spendiq_createdby") || "{}"); } catch {}
      const mapped = data.map(g => ({
        id: g.id,
        title: g.title,
        date: g.date,
        note: g.note || "",
        total: parseFloat(g.totalAmount) || 0,
        perHead: parseFloat(g.perHead) || 0,
        // try all possible field names the backend might use; members/paidBy may be objects or strings
        paidBy: g.paidByName || (typeof g.paidBy === "object" ? g.paidBy?.name : g.paidBy) || g.paid_by_name || g.paidByUserName || "",
        createdBy: createdByMap[g.id] || g.paidByName || (typeof g.paidBy === "object" ? g.paidBy?.name : g.paidBy) || "",
        members: (g.memberNames || g.members || []).map(m => typeof m === "object" ? (m.name || "") : m),
        owes: (g.owes || []).map(o => ({ name: o.userName || o.name || o.user_name || "", amount: parseFloat(o.amount) || 0, paid: !!o.paid, oweId: o.id })),
      }));
      console.log("🔍 Mapped groups:", mapped.map(g => ({ id: g.id, paidBy: g.paidBy, members: g.members, owes: g.owes })));
      setGroups(mapped);
    } catch(e) { console.error("loadGroups error:", e); }
  };

  const grp = groups.find(g => g.id === activeGroupId) || null;

  const toggleMember = (name) => {
    setGForm(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(name)
        ? prev.selectedMembers.filter(m => m !== name)
        : [...prev.selectedMembers, name],
      // Clear paidBy if that person was deselected
      paidBy: prev.paidBy === name && prev.selectedMembers.includes(name) ? "" : prev.paidBy,
    }));
  };

  // ── FIX: resolve names → IDs before sending to backend ───────────────────
  const handleCreate = async () => {
    setFormError("");
    const memberList = gForm.selectedMembers;

    if (!gForm.title || !gForm.totalAmount || !gForm.paidBy || !gForm.date) {
      setFormError("Please fill all required fields."); return;
    }
    if (memberList.length < 2) { setFormError("Select at least 2 members."); return; }
    if (!memberList.includes(gForm.paidBy)) { setFormError("Paid-by person must be a selected member."); return; }

    // Resolve names to user IDs
    const paidByUserId = allUsers.find(u => u.name === gForm.paidBy)?.id;
    const memberUserIds = memberList
      .map(name => allUsers.find(u => u.name === name)?.id)
      .filter(Boolean);

    if (!paidByUserId) {
      setFormError("Could not find user ID for paid-by person. Please try again."); return;
    }
    if (memberUserIds.length !== memberList.length) {
      setFormError("Could not resolve all member IDs. Please try again."); return;
    }

    setLoading(true);
    try {
      const payload = {
        title: gForm.title,
        memberUserIds,          // ✅ array of user IDs
        totalAmount: parseFloat(gForm.totalAmount),
        paidByUserId,           // ✅ single user ID
        date: gForm.date,
        note: gForm.note,
      };
      const created = await apiCall("/api/splits", "POST", payload);
      // Persist who created this split locally so we can restrict QR upload
      try {
        const createdByMap = JSON.parse(localStorage.getItem("spendiq_createdby") || "{}");
        createdByMap[created.id] = currentUser.name;
        localStorage.setItem("spendiq_createdby", JSON.stringify(createdByMap));
      } catch {}
      await loadGroups();
      addNotificationsForGroup && addNotificationsForGroup(created);
      setGForm({ title:"", selectedMembers:[], totalAmount:"", paidBy:"", date:"", note:"" });
      setActiveId(created.id);
      setView("detail");
    } catch(e) { setFormError(e.message || "Failed to create split."); }
    finally { setLoading(false); }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const markPaid = async (groupId, memberName) => {
    const g = groups.find(x => x.id === groupId);
    const owe = g?.owes.find(o => o.name === memberName);
    if (!owe) return;
    const u = allUsers.find(u => u.name === memberName);
    if (!u) return;
    try {
      await apiCall(`/api/splits/${groupId}/pay/${u.id}`, "PATCH");
      await loadGroups();
      dismissNotificationForMember && dismissNotificationForMember(groupId, memberName);
    } catch(e) { console.error("markPaid error:", e); }
  };

  const unmarkPaid = async (groupId, memberName) => {
    const u = allUsers.find(u => u.name === memberName);
    if (!u) return;
    try {
      await apiCall(`/api/splits/${groupId}/unpay/${u.id}`, "PATCH");
      await loadGroups();
    } catch(e) { console.error("unmarkPaid error:", e); }
  };

  const deleteGroup = async (id) => {
    try {
      await apiCall(`/api/splits/${id}`, "DELETE");
      setGroups(prev => prev.filter(g => g.id !== id));
      setView("list");
    } catch(e) { console.error("deleteGroup error:", e); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:26 }}>⚡ Group Splitter</div>
          <div style={{ color:T.muted, fontSize:13, marginTop:4 }}>Split bills, share QR codes, track who paid</div>
        </div>
        {view!=="create" && <button className="btn" onClick={()=>setView("create")}>+ New Split</button>}
        {view==="create" && <button className="btn-g" onClick={()=>setView("list")}>← Back</button>}
      </div>

      {/* ── LIST VIEW ── */}
      {view==="list" && <>
        {groups.length===0 && (
          <div className="card" style={{ textAlign:"center", padding:60 }}>
            <div style={{ fontSize:48, marginBottom:14 }}>🍽️</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, marginBottom:8 }}>No splits yet</div>
            <div style={{ color:T.muted, marginBottom:22, fontSize:14 }}>Create a group split for your next restaurant outing!</div>
            <button className="btn" onClick={()=>setView("create")}>+ Create First Split</button>
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {groups.map(g=>{
            const pending = (g.owes || []).filter(o=>!o.paid).length;
            return (
              <div key={g.id} className="row" style={{ cursor:"pointer" }} onClick={()=>{ setActiveId(g.id); setView("detail"); }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:44, height:44, borderRadius:13, background:"#f9731620", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🍽️</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{g.title}</div>
                    <div style={{ fontSize:12, color:T.muted }}>{g.date} · {(g.members || []).length} members · Paid by <span style={{ color:"#22d3ee" }}>{g.paidBy}</span></div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontWeight:800, fontSize:16, color:"#f97316" }}>₹{g.total.toLocaleString()}</div>
                    <div style={{ fontSize:11, color: pending>0?"#f97316":"#10b981" }}>{pending>0?`${pending} pending`:"All settled ✓"}</div>
                  </div>
                  <button className="dbtn" onClick={e=>{ e.stopPropagation(); deleteGroup(g.id); }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      </>}

      {/* ── CREATE VIEW ── */}
      {view==="create" && (
        <div className="card" style={{ maxWidth:560 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:19, marginBottom:22 }}>New Group Split</div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div><lbl>Split Title</lbl><input className="inp" placeholder="e.g. Pizza Night, Team Dinner" value={gForm.title} onChange={e=>setGForm({...gForm,title:e.target.value})}/></div>

            <div>
              <lbl>Select Members</lbl>
              {allUsers.length === 0 && <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>Loading users…</div>}
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:8 }}>
                {allUsers.map(u => {
                  const sel = gForm.selectedMembers.includes(u.name);
                  return (
                    <button key={u.id} onClick={()=>toggleMember(u.name)}
                      style={{ padding:"7px 14px", borderRadius:20, border:`2px solid ${sel?"#5b5ef4":T.border2}`,
                        background:sel?"linear-gradient(135deg,#5b5ef4,#8b5cf6)":"transparent",
                        color:sel?"#fff":T.text, fontWeight:600, fontSize:13, cursor:"pointer", transition:"all .15s" }}>
                      {u.name}
                    </button>
                  );
                })}
              </div>
              {gForm.selectedMembers.length > 0 && (
                <div style={{ fontSize:11.5, color:T.muted, marginTop:6 }}>
                  👥 {gForm.selectedMembers.length} members: {gForm.selectedMembers.join(" · ")}
                </div>
              )}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><lbl>Total Amount (₹)</lbl><input className="inp" type="number" placeholder="2400" value={gForm.totalAmount} onChange={e=>setGForm({...gForm,totalAmount:e.target.value})}/></div>
              <div><lbl>Date</lbl><input className="inp" type="date" value={gForm.date} onChange={e=>setGForm({...gForm,date:e.target.value})}/></div>
            </div>

            <div>
              <lbl>Paid By</lbl>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:8 }}>
                {gForm.selectedMembers.map(name => {
                  const sel = gForm.paidBy === name;
                  return (
                    <button key={name} onClick={()=>setGForm({...gForm,paidBy:name})}
                      style={{ padding:"7px 14px", borderRadius:20, border:`2px solid ${sel?"#10b981":T.border2}`,
                        background:sel?"#10b981":"transparent",
                        color:sel?"#fff":T.text, fontWeight:600, fontSize:13, cursor:"pointer", transition:"all .15s" }}>
                      {name}
                    </button>
                  );
                })}
                {gForm.selectedMembers.length === 0 && <div style={{ fontSize:12, color:T.muted }}>Select members first</div>}
              </div>
            </div>

            <div><lbl>Note (optional)</lbl><input className="inp" placeholder="Dinner at Barbeque Nation" value={gForm.note} onChange={e=>setGForm({...gForm,note:e.target.value})}/></div>

            {gForm.totalAmount && gForm.selectedMembers.length > 0 && (
              <div style={{ padding:"14px 16px", background:dark?"#1a1a27":"#f0f2fa", borderRadius:12, border:`1px solid ${T.border2}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:12, color:T.muted }}>Each person pays</div>
                  <div style={{ fontSize:24, fontWeight:800, color:"#f97316", fontFamily:"'Syne',sans-serif" }}>
                    ₹{(parseFloat(gForm.totalAmount||0)/Math.max(gForm.selectedMembers.length,1)).toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, color:T.muted }}>Total ÷ Members</div>
                  <div style={{ fontSize:14, color:T.text, fontWeight:600 }}>₹{parseFloat(gForm.totalAmount||0).toLocaleString()} ÷ {gForm.selectedMembers.length}</div>
                </div>
              </div>
            )}

            {formError && <div style={{ background:dark?"#2a141a":"#ffe4e8", border:"1px solid #f43f5e44", borderRadius:10, padding:"10px 14px", color:"#f43f5e", fontSize:13 }}>⚠️ {formError}</div>}
            <div style={{ display:"flex", gap:10, marginTop:4 }}>
              <button className="btn" style={{ flex:1 }} disabled={loading} onClick={handleCreate}>{loading?"Creating…":"Create Split →"}</button>
              <button className="btn-g" style={{ flex:1 }} onClick={()=>{ setView("list"); setFormError(""); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL VIEW ── */}
      {view==="detail" && grp && (
        <div>
          <button className="btn-g" style={{ marginBottom:18, padding:"8px 16px", fontSize:13 }} onClick={()=>setView("list")}>← All Splits</button>
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22 }}>🍽️ {grp.title}</div>
                <div style={{ color:T.muted, fontSize:13, marginTop:4 }}>{grp.date}{grp.note&&` · ${grp.note}`}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:28, fontWeight:800, color:"#f97316", fontFamily:"'Syne',sans-serif" }}>₹{grp.total.toLocaleString()}</div>
                <div style={{ fontSize:12, color:T.muted }}>Total Bill</div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginTop:18 }}>
              {[
                { label:"Members",    value:(grp.members || []).length,                    accent:"#8b5cf6" },
                { label:"Per Person", value:`₹${grp.perHead.toFixed(2)}`,                  accent:"#f97316" },
                { label:"Pending",    value:(grp.owes || []).filter(o=>!o.paid).length,    accent:"#f43f5e" },
              ].map((s,i)=>(
                <div key={i} style={{ background:T.row, borderRadius:12, padding:"12px 16px", border:`1px solid ${T.border2}` }}>
                  <div style={{ fontSize:11, color:T.muted, textTransform:"uppercase", letterSpacing:".05em" }}>{s.label}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:s.accent, fontFamily:"'Syne',sans-serif", marginTop:4 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding:"14px 18px", background:dark?"#0d2a1a":"#ecfdf5", border:"1px solid #10b98140", borderRadius:14, marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:50, background:"#10b98120", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>💳</div>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:"#10b981" }}>{grp.paidBy} paid the full bill</div>
              <div style={{ fontSize:12, color:T.muted }}>Others owe ₹{grp.perHead.toFixed(2)} each</div>
            </div>
          </div>

          <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>Members & Payment Status</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
            {(grp.owes || []).map((o,i)=>{
              const qr = (qrMap[String(grp.id)]||{})[grp.paidBy]; // QR is always the bill payer's payment code
              // ── Access control ───────────────────────────────────────────
              const isThisOwer   = currentUser.name === o.name;                            // the person who owes
              const isBillPayer  = currentUser.name === grp.paidBy;                        // the person who paid
              const canMarkPaid  = isThisOwer || isBillPayer;                              // either can mark paid
              const canUploadQR  = isBillPayer;                                            // only the bill payer uploads their QR
              const canUndo      = isThisOwer || isBillPayer;                              // either can undo
              // ─────────────────────────────────────────────────────────────
              return (
                <div key={i} style={{ background:T.card, border:`1px solid ${o.paid?"#10b98140":T.border}`, borderRadius:16, padding:18, transition:"all .2s" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:50, background:"linear-gradient(135deg,#5b5ef4,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:"#fff" }}>
                        {o.name.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{o.name}</div>
                        <div style={{ fontSize:11.5, color: o.paid?"#10b981":"#f97316", fontWeight:600 }}>{o.paid?"✓ Paid":"⏳ Pending"}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight:800, fontSize:18, color: o.paid?"#10b981":"#f43f5e", fontFamily:"'Syne',sans-serif" }}>₹{o.amount.toFixed(2)}</div>
                  </div>

                  {!o.paid && (
                    <div style={{ borderTop:`1px solid ${T.border2}`, paddingTop:14 }}>
                      {qr ? (
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontSize:12, color:T.muted, marginBottom:8 }}>📲 Scan to pay <strong style={{ color:T.text }}>{grp.paidBy}</strong></div>
                          <img src={qr} alt="QR" style={{ width:130, height:130, borderRadius:10, border:`2px solid ${T.border2}`, objectFit:"cover" }}/>
                          <div style={{ marginTop:8, padding:"8px 12px", background:dark?"#1a1a27":"#f0f4ff", borderRadius:9, fontSize:12, color:T.accent, fontWeight:600 }}>
                            Pay ₹{o.amount.toFixed(2)} to {grp.paidBy}
                          </div>
                          <div style={{ display:"flex", gap:8, marginTop:10 }}>
                            {canMarkPaid && (
                              <button className="btn" style={{ flex:1, fontSize:12, padding:"8px" }} onClick={()=>markPaid(grp.id,o.name)}>✓ Mark Paid</button>
                            )}
                            {canUploadQR && (
                              <label style={{ flex:1, cursor:"pointer" }}>
                                <div className="btn-g" style={{ textAlign:"center", padding:"8px", fontSize:12, borderRadius:11, border:`1px solid ${T.border2}`, color:T.muted }}>📷 Change QR</div>
                                <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleQRUpload(String(grp.id),o.name,e.target.files[0])}/>
                              </label>
                            )}
                            {!canMarkPaid && !canUploadQR && (
                              <div style={{ flex:1, textAlign:"center", fontSize:12, color:T.muted, padding:"8px", background:T.row, borderRadius:11, border:`1px solid ${T.border2}` }}>
                                🔒 Waiting for {o.name} to pay
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize:12, color:T.muted, marginBottom:10, textAlign:"center" }}>
                            📤 {grp.paidBy} can upload their QR code so {o.name} can scan & pay
                          </div>
                          {canUploadQR ? (
                            <>
                              <label style={{ cursor:"pointer", display:"block" }}>
                                <div style={{ border:`2px dashed ${T.border2}`, borderRadius:12, padding:"18px", textAlign:"center", transition:"border-color .18s" }}
                                  onMouseOver={e=>e.currentTarget.style.borderColor=T.accent}
                                  onMouseOut={e=>e.currentTarget.style.borderColor=T.border2}>
                                  <div style={{ fontSize:28, marginBottom:6 }}>📷</div>
                                  <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Upload QR Code</div>
                                  <div style={{ fontSize:11.5, color:T.muted, marginTop:4 }}>PNG, JPG · UPI / GPay / PhonePe</div>
                                </div>
                                <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleQRUpload(String(grp.id),o.name,e.target.files[0])}/>
                              </label>
                              {canMarkPaid && (
                                <button className="btn" style={{ width:"100%", marginTop:10, fontSize:12, padding:"9px" }} onClick={()=>markPaid(grp.id,o.name)}>✓ Mark as Paid (cash)</button>
                              )}
                            </>
                          ) : canMarkPaid ? (
                            <button className="btn" style={{ width:"100%", fontSize:12, padding:"9px" }} onClick={()=>markPaid(grp.id,o.name)}>✓ Mark as Paid</button>
                          ) : (
                            <div style={{ textAlign:"center", fontSize:12, color:T.muted, padding:"12px", background:T.row, borderRadius:11, border:`1px solid ${T.border2}` }}>
                              🔒 Only {o.name} or {grp.paidBy} can mark this as paid
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {o.paid && (
                    <div style={{ borderTop:`1px solid ${T.border2}`, paddingTop:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ fontSize:13, color:"#10b981", fontWeight:600 }}>✅ Payment settled</div>
                      {canUndo && (
                        <button className="btn-g" style={{ fontSize:11, padding:"5px 10px" }} onClick={()=>unmarkPaid(grp.id,o.name)}>Undo</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ background:dark?"#0d2a1a":"#ecfdf5", border:"1px solid #10b98140", borderRadius:16, padding:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:50, background:"#10b981", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:"#fff" }}>
                  {grp.paidBy.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{grp.paidBy}</div>
                  <div style={{ fontSize:11.5, color:"#10b981", fontWeight:600 }}>💳 Paid the full bill</div>
                </div>
              </div>
              <div style={{ marginTop:12, display:"flex", gap:8 }}>
                <div style={{ flex:1, padding:"10px 12px", background:"#10b98115", borderRadius:10, fontSize:12, color:"#10b981", fontWeight:600, textAlign:"center" }}>
                  <div style={{ fontSize:10, color:"#10b981aa", marginBottom:3 }}>COLLECTING</div>
                  ₹{(grp.perHead * (grp.owes || []).length).toFixed(2)}
                </div>
                <div style={{ flex:1, padding:"10px 12px", background:"#10b98115", borderRadius:10, fontSize:12, color:"#10b981", fontWeight:600, textAlign:"center" }}>
                  <div style={{ fontSize:10, color:"#10b981aa", marginBottom:3 }}>RECEIVED</div>
                  ₹{((grp.owes || []).filter(o=>o.paid).length * grp.perHead).toFixed(2)}
                </div>
              </div>
              {currentUser.name === grp.paidBy && (
                <div style={{ marginTop:14, borderTop:"1px solid #10b98130", paddingTop:14 }}>
                  {(qrMap[String(grp.id)]||{})[grp.paidBy] ? (
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:12, color:"#10b981", marginBottom:8, fontWeight:600 }}>Your QR code is uploaded</div>
                      <img src={(qrMap[String(grp.id)]||{})[grp.paidBy]} alt="Your QR" style={{ width:110, height:110, borderRadius:10, border:"2px solid #10b98160", objectFit:"cover" }}/>
                      <label style={{ display:"block", marginTop:10, cursor:"pointer" }}>
                        <div style={{ fontSize:12, color:"#10b981", padding:"7px 12px", border:"1px solid #10b98160", borderRadius:9, textAlign:"center" }}>📷 Replace QR</div>
                        <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleQRUpload(String(grp.id), grp.paidBy, e.target.files[0])}/>
                      </label>
                    </div>
                  ) : (
                    <label style={{ cursor:"pointer", display:"block" }}>
                      <div style={{ border:"2px dashed #10b98160", borderRadius:12, padding:"16px", textAlign:"center", transition:"border-color .18s" }}
                        onMouseOver={e=>e.currentTarget.style.borderColor="#10b981"}
                        onMouseOut={e=>e.currentTarget.style.borderColor="#10b98160"}>
                        <div style={{ fontSize:24, marginBottom:5 }}>📷</div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#10b981" }}>Upload Your QR Code</div>
                        <div style={{ fontSize:11.5, color:"#10b981aa", marginTop:3 }}>So others can scan and pay you</div>
                      </div>
                      <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleQRUpload(String(grp.id), grp.paidBy, e.target.files[0])}/>
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>

          {(grp.owes || []).length > 0 && (grp.owes || []).every(o=>o.paid) && (
            <div style={{ marginTop:18, padding:"18px 22px", background:dark?"#0d2a1a":"#ecfdf5", border:"1px solid #10b981", borderRadius:16, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:20, color:"#10b981" }}>All Settled!</div>
              <div style={{ color:T.muted, fontSize:13, marginTop:6 }}>Everyone has paid their share for "{grp.title}"</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}