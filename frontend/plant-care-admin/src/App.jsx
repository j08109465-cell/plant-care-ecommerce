import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest, sendJson } from "./api";
import plantCareLogo from "../../plant-care/src/assets/plantcare-logo.png";
import welcomePlant from "../../plant-care/src/assets/Monstera.jpg";
import localPlants from "../../plant-care/src/data/plants";
import localCategories from "../../plant-care/src/data/categories";

const sections = [
  { id: "Dashboard", icon: "grid", endpoint: "/admin/dashboard" },
  { id: "Products", icon: "leaf", endpoint: "/admin/products" },
  { id: "Categories", icon: "layers", endpoint: "/admin/products" },
  { id: "Users", icon: "users", endpoint: "/admin/users" },
  { id: "Orders", icon: "bag", endpoint: "/admin/orders" },
  { id: "My Products", icon: "leaf", endpoint: "/admin/products" },
  { id: "Logout", icon: "logout" },
];
const orderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const money = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const todayLabel = new Date().toLocaleDateString("en-IN", {
  weekday: "long",
  month: "long",
  day: "numeric",
}).toUpperCase();
const dateLabel = (value) => value
  ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  : "—";
const localPlantImages = new Map(localPlants.map((plant) => [plant.id, plant.image]));
const localCategoryImages = new Map(localCategories.map((category) => [category.name.toLowerCase(), category.image]));
const isAdminUser = (user) => user?.role === "admin";
const testOrDebugAccountPattern = /(?:^|[^a-z0-9])(?:test|debug)(?:[^a-z0-9]|$)/i;
const isRegisteredCustomer = (account) =>
  account.role === "customer" &&
  !/@example\.com$/i.test(account.email || "") &&
  !testOrDebugAccountPattern.test(account.email || "") &&
  !testOrDebugAccountPattern.test(account.name || "");

function productImage(product) {
  return typeof product.image === "string" && product.image.trim()
    ? product.image.trim()
    : localPlantImages.get(product.id) || welcomePlant;
}

function categoryImage(category) {
  const name = category.name.toLowerCase();
  const configuredImage = localCategoryImages.get(name);
  if (configuredImage) return configuredImage;
  const relatedPlant = localPlants.find((plant) =>
    plant.category.toLowerCase() === name ||
    plant.categories.some((plantCategory) => plantCategory.toLowerCase() === name)
  );
  return relatedPlant?.image || welcomePlant;
}

function Icon({ name, size = 19 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    leaf: <><path d="M20.8 3.2C12.1 2.4 5.4 4.6 4 10.7c-.8 3.5 1.5 6.2 4.8 6.2 6.4 0 10.8-6 12-13.7Z" /><path d="M3 21c3.5-6.6 7.2-9.4 13.7-12.4" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await apiRequest("/admin/auth/login", sendJson("POST", { email, password }));
      if (!isAdminUser(result.user)) {
        throw new Error("Administrator access is required.");
      }
      onLogin(result.user);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-art">
          <div className="login-brand"><img src={plantCareLogo} alt="PlantCare" /></div>
          <div className="art-plant art-plant-one" />
          <div className="art-plant art-plant-two" />
          <div className="art-sun" />
          <div className="art-caption"><span>GROW WITH CARE</span><h2>A little more green, every day.</h2><p>Your nursery, at a glance.</p></div>
          <div className="art-pill"><span className="online-dot" /> Plant care, made simple</div>
        </div>
        <div className="login-form-wrap">
          <span className="eyebrow">ADMINISTRATOR PORTAL</span>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to manage your PlantCare store.</p>
          {error && <div className="notice error" role="alert">{error}</div>}
          <form className="login-form" onSubmit={submit}>
            <label>Email address<input autoComplete="username" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@plantcare.com" required /></label>
            <label>Password<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></label>
            <button className="button primary login-submit" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in to dashboard"}<Icon name="arrow" size={17} /></button>
          </form>
          <p className="login-foot"><span className="lock">◈</span> Secure access for authorized administrators only</p>
        </div>
      </section>
      <p className="login-copyright">© {new Date().getFullYear()} PlantCare. Admin workspace.</p>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("Dashboard");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const currentSection = sections.find((section) => section.id === active) || sections[0];
  const sidebarOrderCount = active === "Dashboard"
    ? payload?.stats?.orders
    : active === "Orders"
      ? payload?.orders?.length
      : 0;
  const rows = active === "Products"
    ? payload?.products || []
    : active === "My Products"
      ? (payload?.products || []).filter((product) => product.ownerId === user?.id)
    : active === "Categories"
      ? payload?.products || []
      : active === "Users"
        ? (payload?.users || []).filter(isRegisteredCustomer)
        : active === "Orders"
          ? payload?.orders || []
          : [];
  const filteredRows = useMemo(
    () => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())),
    [rows, query]
  );
  const plantSuggestions = useMemo(() => {
    if (!query.trim() || (active !== "Products" && active !== "My Products")) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const seenNames = new Set();
    return rows
      .filter((product) => product.name?.toLocaleLowerCase().includes(normalizedQuery))
      .filter((product) => {
        const normalizedName = product.name.toLocaleLowerCase();
        if (seenNames.has(normalizedName)) return false;
        seenNames.add(normalizedName);
        return true;
      })
      .slice(0, 8);
  }, [active, query, rows]);

  function navigateToSection(section) {
    setActive(section);
    setQuery("");
    setSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
  }

  useEffect(() => {
    const clearAdminSession = () => {
      fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "include",
        keepalive: true,
      }).catch((error) => {
        console.error("Unable to clear the PlantCare admin session on page exit.", error);
      });
    };
    window.addEventListener("pagehide", clearAdminSession);
    return () => window.removeEventListener("pagehide", clearAdminSession);
  }, []);

  function handleLogin(activeUser) {
    setUser(activeUser);
  }

  const loadActive = useCallback(async () => {
    if (!user) return;
    if (!currentSection.endpoint) {
      setPayload(null);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest(currentSection.endpoint);
      setPayload(result);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [currentSection.endpoint, user]);

  useEffect(() => {
    loadActive();
  }, [loadActive]);

  useEffect(() => {
    if (!user || active !== "Dashboard") return undefined;
    const refreshDashboard = async () => {
      try {
        setPayload(await apiRequest("/admin/dashboard"));
      } catch (refreshError) {
        setError(refreshError.message);
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshDashboard();
    };
    const intervalId = window.setInterval(refreshDashboard, 30_000);
    window.addEventListener("focus", refreshDashboard);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshDashboard);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [active, user]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function logout() {
    try {
      await apiRequest("/admin/auth/logout", { method: "POST" });
      setUser(null);
      setPayload(null);
      setActive("Dashboard");
    } catch (logoutError) {
      setError(logoutError.message);
    }
  }

  async function saveRecord(url, method, form, successMessage) {
    setSaving(true);
    setError("");
    try {
      await apiRequest(url, sendJson(method, form));
      setDialog(null);
      setNotice(successMessage);
      await loadActive();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(url, label, confirmationMessage) {
    if (!window.confirm(confirmationMessage || `Delete ${label}? This action cannot be undone.`)) return;
    setError("");
    try {
      await apiRequest(url, { method: "DELETE" });
      setNotice(`${label} deleted.`);
      await loadActive();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  if (!isAdminUser(user)) return <Login onLogin={handleLogin} />;

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <a className="sidebar-brand" href="#" onClick={(event) => { event.preventDefault(); navigateToSection("Dashboard"); }}>
          <img src={plantCareLogo} alt="PlantCare" />
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Admin sections">
          {sections.map((section) => (
            <button key={section.id} className={`nav-item ${active === section.id ? "selected" : ""}`} type="button" onClick={() => {
              if (section.id === "Logout") {
                logout();
                return;
              }
              navigateToSection(section.id);
            }}>
              <Icon name={section.icon} /><span>{section.id}</span>
              {section.id === "Orders" && sidebarOrderCount > 0 && <span className="nav-count">{sidebarOrderCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><span className="tip-spark">✧</span><strong>Growing together</strong><p>Thoughtful care for a greener home.</p></div>
          <div className="sidebar-user"><div className="avatar">{(user.name || "A").slice(0, 1).toUpperCase()}</div><div className="sidebar-user-info"><strong>{user.name}</strong><span>Administrator</span></div></div>
        </div>
      </aside>

      <div className="main-panel">
        <header className={`topbar ${active === "Dashboard" ? "dashboard-topbar" : ""}`}>
          {active !== "Dashboard" && <div className="breadcrumb"><span>Workspace</span><span className="crumb-divider">/</span><strong>{active}</strong></div>}
          <div className="topbar-tools">
            {active !== "Dashboard" && <div className="search-control">
              <div className="search-box">
                <Icon name="search" size={17} />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSuggestionsOpen(true);
                    setActiveSuggestionIndex(-1);
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                  onBlur={() => setSuggestionsOpen(false)}
                  onKeyDown={(event) => {
                    if (!suggestionsOpen || !plantSuggestions.length) {
                      if (event.key === "Escape") setSuggestionsOpen(false);
                      return;
                    }
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveSuggestionIndex((index) => (index + 1) % plantSuggestions.length);
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveSuggestionIndex((index) => (index <= 0 ? plantSuggestions.length - 1 : index - 1));
                    } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
                      event.preventDefault();
                      setQuery(plantSuggestions[activeSuggestionIndex].name);
                      setSuggestionsOpen(false);
                      setActiveSuggestionIndex(-1);
                    } else if (event.key === "Escape") {
                      setSuggestionsOpen(false);
                    }
                  }}
                  placeholder={`Search ${active.toLowerCase()}...`}
                  aria-label={`Search ${active.toLowerCase()}`}
                  aria-autocomplete="list"
                  aria-expanded={suggestionsOpen && plantSuggestions.length > 0}
                  aria-controls="plant-search-suggestions"
                  aria-activedescendant={activeSuggestionIndex >= 0 ? `plant-suggestion-${activeSuggestionIndex}` : undefined}
                />
                {query && <button
                  className="search-clear"
                  type="button"
                  aria-label="Clear search"
                  title="Clear search"
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setQuery("");
                    setSuggestionsOpen(false);
                    setActiveSuggestionIndex(-1);
                  }}
                >×</button>}
              </div>
              {suggestionsOpen && (active === "Products" || active === "My Products") && query.trim() && <div className="search-suggestions" id="plant-search-suggestions" role="listbox" aria-label="Matching plants">
                <span className="suggestions-heading">PLANT MATCHES</span>
                {plantSuggestions.length
                  ? plantSuggestions.map((plant, index) => <button
                    key={plant.id}
                    id={`plant-suggestion-${index}`}
                    className={`suggestion-option ${activeSuggestionIndex === index ? "highlighted" : ""}`}
                    type="button"
                    role="option"
                    aria-selected={activeSuggestionIndex === index}
                    onPointerDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    onClick={() => {
                      setQuery(plant.name);
                      setSuggestionsOpen(false);
                      setActiveSuggestionIndex(-1);
                    }}
                  ><span className="suggestion-leaf" aria-hidden="true">✦</span>{plant.name}</button>)
                  : <span className="suggestions-empty">No matching plants found.</span>}
              </div>}
            </div>}
          </div>
        </header>

        <main className="content">
          {error && <div className="notice error" role="alert">{error}<button onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
          {notice && <div className="notice success" role="status">{notice}</div>}
          {loading
            ? <div className="loading-state"><span className="spinner" /> Loading {active.toLowerCase()}...</div>
            : active === "Dashboard"
              ? <Dashboard data={payload} user={user} onNavigate={navigateToSection} />
              : active === "Chat"
                ? <ChatPanel />
              : <Management
                  active={active}
                  rows={filteredRows}
                  total={rows.length}
                  onAdd={() => setDialog({ kind: active === "My Products" ? "Products" : active, record: null })}
                  onEdit={(record) => setDialog({ kind: active === "My Products" ? "Products" : active, record })}
                  onDelete={deleteRecord}
                  onSave={saveRecord}
                  saving={saving}
                  reload={loadActive}
                />}
        </main>
      </div>

      {dialog && <RecordDialog
        kind={dialog.kind}
        record={dialog.record}
        onClose={() => setDialog(null)}
        onSave={saveRecord}
        saving={saving}
      />}
    </div>
  );
}

function Dashboard({ data, user, onNavigate }) {
  const stats = data?.stats;
  const recentSales = [...(data?.recentOrders || [])]
    .filter((order) => order.status !== "Cancelled")
    .reverse();
  const maxSale = Math.max(...recentSales.map((order) => order.total || 0), 1);
  const chartPoints = recentSales.map((order, index) => ({
    ...order,
    x: recentSales.length === 1 ? 50 : 6 + (index / (recentSales.length - 1)) * 88,
    y: 90 - ((order.total || 0) / maxSale) * 72,
  }));
  const cards = [
    { label: "Total products", value: stats?.products ?? "—", icon: "leaf", tone: "green", link: "Products", note: "Across your catalog" },
    { label: "Categories", value: stats?.categories ?? "—", icon: "layers", tone: "sage", link: "Categories", note: "Plant collections" },
    { label: "Customers", value: stats?.customers ?? "—", icon: "users", tone: "gold", link: "Users", note: "Registered accounts" },
    { label: "Total revenue", value: money(stats?.revenue), icon: "bag", tone: "deep", link: "Orders", note: `${stats?.orders ?? 0} orders placed` },
  ];
  return (
    <>
      <section className="dashboard-welcome">
        <div className="dashboard-title">
          <span className="eyebrow">{todayLabel}</span>
          <h1>Welcome back, {user.name.split(/\s+/)[0]} <span aria-hidden="true">✳</span></h1>
          <p>A fresh look at what&apos;s growing in your store.</p>
        </div>
        <button className="button soft-button" onClick={() => onNavigate("Products")}><Icon name="leaf" size={17} /> Manage products</button>
      </section>
      <section className="stats-grid dashboard-stats">
        {cards.map((card) => <button key={card.label} className="stat-card" onClick={() => onNavigate(card.link)}>
          <div className="stat-top"><span>{card.label}</span><span className={`stat-icon ${card.tone}`}><Icon name={card.icon} /></span></div>
          <strong className="stat-value">{typeof card.value === "number" ? card.value.toLocaleString("en-IN") : card.value}</strong>
          <span className="stat-change">{card.note}</span>
        </button>)}
      </section>
      <section className="dashboard-layout">
        <div className="dashboard-main-column">
          <div className="panel sales-panel dashboard-panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">STORE PERFORMANCE</span><h2>Sales overview</h2><p>Order totals from your latest orders</p></div>
              <span className="chart-legend"><i /> Sales</span>
            </div>
            {chartPoints.length ? (
              <div className="sales-chart">
                <div className="chart-axis"><span>{money(maxSale)}</span><span>{money(maxSale / 2)}</span><span>{money(0)}</span></div>
                <div className="chart-plot">
                  <div className="chart-gridlines"><i /><i /><i /></div>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Sales chart of recent order totals">
                    <defs><linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#719b75" stopOpacity=".25" /><stop offset="100%" stopColor="#719b75" stopOpacity=".01" /></linearGradient></defs>
                    {chartPoints.length > 1 && <polygon points={`0,100 ${chartPoints.map(({ x, y }) => `${x},${y}`).join(" ")} 100,100`} fill="url(#sales-fill)" />}
                    {chartPoints.length > 1 && <polyline points={chartPoints.map(({ x, y }) => `${x},${y}`).join(" ")} fill="none" stroke="#477752" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />}
                    {chartPoints.map((point) => <circle key={point.reference} cx={point.x} cy={point.y} r="1.8" fill="#fff" stroke="#477752" strokeWidth="1.5" vectorEffect="non-scaling-stroke"><title>{`${point.reference}: ${money(point.total)}`}</title></circle>)}
                  </svg>
                </div>
                <div className="chart-labels">{chartPoints.map((order) => <span key={order.reference}>{dateLabel(order.date)}</span>)}</div>
              </div>
            ) : <div className="chart-empty">Sales will appear here when your store receives its first order.</div>}
          </div>
          <div className="panel recent-panel dashboard-panel">
            <div className="panel-heading">
              <div><span className="panel-kicker">LATEST ACTIVITY</span><h2>Recent orders</h2><p>Your latest customer purchases</p></div>
              <button className="text-button" onClick={() => onNavigate("Orders")}>View all <Icon name="arrow" size={15} /></button>
            </div>
            <OrderTable orders={data?.recentOrders || []} />
            <div className="recent-footer"><span>{stats?.orders ?? 0} total orders</span><strong>{money(stats?.revenue)} total revenue</strong></div>
          </div>
        </div>
      </section>
    </>
  );
}

const stateMapPoints = {
  "delhi": [235, 101], "new delhi": [235, 101], "maharashtra": [201, 220],
  "gujarat": [150, 191], "rajasthan": [168, 132], "karnataka": [214, 293],
  "tamil nadu": [232, 345], "kerala": [204, 351], "telangana": [232, 247],
  "andhra pradesh": [253, 277], "uttar pradesh": [270, 127], "west bengal": [331, 175],
  "bihar": [298, 154], "punjab": [190, 82], "haryana": [218, 101],
  "madhya pradesh": [221, 174], "assam": [355, 128], "odisha": [290, 214],
  "chhattisgarh": [255, 200], "jharkhand": [303, 190], "goa": [188, 269],
};
const cityMapPoints = {
  "mumbai": [175, 227], "pune": [193, 219], "bengaluru": [211, 303],
  "bangalore": [211, 303], "chennai": [251, 329], "hyderabad": [235, 249],
  "kolkata": [334, 182], "ahmedabad": [153, 177], "jaipur": [177, 130],
  "lucknow": [267, 130], "new delhi": [235, 101], "delhi": [235, 101],
  "kochi": [200, 356], "surat": [164, 196], "indore": [210, 174],
};

function OrderLocationMap({ locations }) {
  const points = locations.flatMap((location) => {
    const city = cityMapPoints[location.city?.trim().toLowerCase()];
    const state = stateMapPoints[location.state?.trim().toLowerCase()];
    const point = city || state;
    return point ? [{ ...location, x: point[0], y: point[1] }] : [];
  });
  return (
    <div className="location-content">
      <div className="india-map" role="img" aria-label="Map of India highlighting customer order locations">
        <svg viewBox="0 0 420 420" aria-hidden="true">
          <defs><pattern id="map-grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 22" fill="none" stroke="#dfe9dd" strokeWidth=".6" /></pattern></defs>
          <rect width="420" height="420" rx="18" fill="url(#map-grid)" />
          <path className="india-shape" d="M112 43 151 50 173 65 203 67 220 82 242 85 256 99 283 99 296 112 320 108 337 121 358 120 370 139 354 153 343 170 328 178 320 199 307 216 294 225 291 244 278 260 273 283 261 301 255 326 242 350 231 379 220 369 214 344 201 327 194 302 181 286 176 261 161 246 153 221 139 205 127 183 113 168 101 144 89 129 91 110 103 95 103 74Z" />
          {points.map((point) => <g key={`${point.city}-${point.state}`} transform={`translate(${point.x} ${point.y})`}><circle className="map-pulse" r="11" /><circle className="map-dot" r="4.5"><title>{`${point.city}, ${point.state}: ${point.orders} orders`}</title></circle></g>)}
          <text x="20" y="394" className="map-caption">INDIA · LIVE ORDER DESTINATIONS</text>
        </svg>
      </div>
      <div className="location-list" aria-label="Top order locations">
        {locations.slice(0, 5).map((location, index) => <div className="location-row" key={`${location.city}-${location.state}`}>
          <span className="location-rank">{String(index + 1).padStart(2, "0")}</span>
          <span className="location-name"><strong>{location.city}</strong><small>{location.state}</small></span>
          <span className="location-count"><strong>{location.orders}</strong><small>{location.orders === 1 ? "order" : "orders"}</small></span>
        </div>)}
      </div>
    </div>
  );
}

function ChatPanel() {
  return (
    <>
      <section className="page-heading management-heading">
        <div><span className="eyebrow">CUSTOMER CARE</span><h1>Chat</h1><p>Customer conversations for your PlantCare store.</p></div>
      </section>
      <section className="panel chat-unavailable">
        <span className="chat-empty-icon"><Icon name="chat" size={27} /></span>
        <h2>Chat is not connected yet</h2>
        <p>There isn&apos;t a chat service or conversation data connected to this workspace.</p>
      </section>
    </>
  );
}

function Management({ active, rows, total, onAdd, onEdit, onDelete, onSave, saving, reload }) {
  const descriptions = {
    Products: "Keep your plant catalog fresh and up to date.",
    "My Products": "Manage the plants you added to the catalog.",
    Categories: "Organize your plants into thoughtful collections.",
    Users: "Registered customers who created an account through PlantCare.",
    Orders: "Track orders and keep customers in the loop.",
  };
  const isProductList = active === "Products" || active === "My Products" || active === "Categories";
  const isUserList = active === "Users";
  return (
    <>
      <section className="page-heading management-heading">
        <div><span className="eyebrow">STORE MANAGEMENT</span><h1>{active}</h1><p>{descriptions[active]}</p></div>
        {active !== "Orders" && !isUserList && <button className="button primary" onClick={onAdd}><span className="plus">+</span> Add {isProductList ? "product" : "category"}</button>}
      </section>
      <section className="panel table-panel">
        <div className="panel-heading table-toolbar"><div><h2>{isUserList ? "Registered customers" : active === "Orders" ? "All orders" : `All ${active.toLowerCase()}`}</h2><p>{total} {isUserList ? total === 1 ? "customer" : "customers" : total === 1 ? ({ Products: "product", "My Products": "product", Categories: "product" }[active] || "order") : active === "My Products" || active === "Categories" ? "products" : active.toLowerCase()} in your store</p></div><button className="icon-button refresh-button" type="button" title="Refresh" aria-label={`Refresh ${active.toLowerCase()}`} onClick={reload}>↻</button></div>
        {isProductList && <ProductTable rows={rows} onEdit={onEdit} onDelete={onDelete} pageSize={4} />}
        {isUserList && rows.length > 0 && <UserTable rows={rows} onDelete={onDelete} />}
        {active === "Orders" && <OrderManagementTable rows={rows} onSave={onSave} saving={saving} />}
        {!rows.length && <div className="empty-state"><span className="empty-plant">✳</span><strong>{total ? "No results found" : isUserList ? "No registered customers yet" : `No ${active.toLowerCase()} yet`}</strong><p>{total ? "Try a different search." : isUserList ? "Customers who sign up for a PlantCare account will appear here." : "Your store will show up here once you add some."}</p></div>}
      </section>
    </>
  );
}

function Table({ headers, children }) {
  return <div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function Actions({ onEdit, onDelete }) {
  return <div className="row-actions"><button className="edit-action" onClick={onEdit}>Edit</button><button className="delete-action" onClick={onDelete}>Delete</button></div>;
}

function ProductTable({ rows, onEdit, onDelete, pageSize = 8 }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const visibleRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    <>
      <div className="table-scroll product-table-scroll">
        <table className="product-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-name-cell">
                    <strong>{product.name}</strong>
                    {product.description && <small>{product.description}</small>}
                  </div>
                </td>
                <td>{product.category}</td>
                <td className="price-cell">{money(product.price)}</td>
                <td>
                  <span className={`status-pill ${product.stock > 0 ? "status-active" : "status-out"}`}><i />{product.stock}</span>
                </td>
                <td><Actions onEdit={() => onEdit(product)} onDelete={() => onDelete(`/admin/products/${encodeURIComponent(product.id)}`, product.name)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination-row" aria-label="Product pagination">
          <button type="button" className="pagination-button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`pagination-page ${pageNumber === safePage ? "active" : ""}`}
                aria-current={pageNumber === safePage ? "page" : undefined}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
          </div>
          <button type="button" className="pagination-button" disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
        </div>
      )}
    </>
  );
}

function CategoryCards({ rows, onEdit, onDelete }) {
  return <div className="management-card-grid category-card-grid">{rows.map((category) => (
    <article className="management-card category-admin-card" key={category._id}>
      <div className="management-card-image category-card-image">
        <img src={categoryImage(category)} alt={`${category.name} plants`} />
        <span className="category-photo-label">Plant collection</span>
      </div>
      <div className="management-card-body">
        <h3>{category.name}</h3>
        <p className="card-description">{category.description || "A leafy collection for every kind of home."}</p>
        <span className="card-product-id">Created {dateLabel(category.createdAt)}</span>
        <div className="card-actions"><button className="card-edit" onClick={() => onEdit(category)}>Edit category</button><button className="card-delete" onClick={() => onDelete(`/admin/categories/${category._id}`, category.name)}>Delete</button></div>
      </div>
    </article>
  ))}</div>;
}

function UserTable({ rows, onDelete }) {
  return <Table headers={["User", "Email", "Account", "Actions"]}>{rows.map((account) => (
    <tr key={account.id}>
      <td><div className="user-cell"><span className="avatar table-avatar">{account.name.slice(0, 1).toUpperCase()}</span><strong>{account.name}</strong></div></td>
      <td>{account.email}</td>
      <td><span className="role-pill">Registered</span></td>
      <td><div className="row-actions"><button
        className="user-remove-button"
        type="button"
        onClick={() => onDelete(
          `/admin/users/${encodeURIComponent(account.id)}`,
          account.email,
          `Remove customer ${account.name} (${account.email})? Their orders will be kept.`
        )}
      >Remove</button></div></td>
    </tr>
  ))}</Table>;
}

function OrderTable({ orders }) {
  if (!orders.length) return <div className="empty-state compact-empty"><span className="empty-plant">✳</span><strong>No orders yet</strong><p>New orders will appear here.</p></div>;
  return <Table headers={["Order", "Customer", "Total", "Status"]}>{orders.map((order) => (
    <tr key={order.reference}><td className="order-ref">#{order.reference}</td><td><strong>{order.name}</strong><small>{dateLabel(order.date)}</small></td><td className="price-cell">{money(order.total)}</td><td><span className={`status-pill ${statusClass(order.status)}`}><i />{order.status || "Pending"}</span></td></tr>
  ))}</Table>;
}

function statusClass(status) {
  return status === "Delivered" ? "status-active" : status === "Cancelled" ? "status-out" : "status-pending";
}

function paymentStatusClass(status) {
  return status === "Paid" ? "status-active" : status === "Failed" ? "status-out" : "status-pending";
}

function OrderManagementTable({ rows, onSave, saving }) {
  const [drafts, setDrafts] = useState({});
  const [busyOrder, setBusyOrder] = useState("");
  useEffect(() => setDrafts({}), [rows]);
  return <Table headers={["Order", "Customer", "Date", "Payment method", "Payment status", "Total", "Status", ""]}>{rows.map((order) => {
    const status = drafts[order.reference] ?? order.status ?? "Pending";
    const paymentStatus = order.paymentStatus || (order.payment === "COD" ? "Pending" : "Failed");
    return <tr key={order.reference}>
      <td><strong className="order-ref">#{order.reference}</strong><small className="order-items">{order.items.map((item) => `${item.name} ×${item.quantity}`).join(", ")}</small></td>
      <td><strong>{order.name}</strong><small>{order.phone}</small></td><td>{dateLabel(order.date)}</td><td>{order.payment}</td>
      <td><span className={`status-pill ${paymentStatusClass(paymentStatus)}`}><i />{paymentStatus}</span></td>
      <td className="price-cell">{money(order.total)}</td>
      <td><select className="status-select" value={status} onChange={(event) => setDrafts((current) => ({ ...current, [order.reference]: event.target.value }))}>{orderStatuses.map((option) => <option key={option}>{option}</option>)}</select></td>
      <td><button className="save-status" disabled={saving || status === (order.status || "Pending")} onClick={async () => {
        setBusyOrder(order.reference);
        await onSave(`/admin/orders/${encodeURIComponent(order.reference)}`, "PUT", { status }, "Order status updated.");
        setBusyOrder("");
      }}>{busyOrder === order.reference ? "Saving..." : "Save changes"}</button></td>
    </tr>;
  })}</Table>;
}

const productForm = (record) => ({
  name: record?.name || "",
  category: record?.category || "",
  categories: record?.categories?.join(", ") || "",
  price: record?.price ?? "",
  originalPrice: record?.originalPrice ?? "",
  stock: record?.stock ?? 20,
  image: record?.image || "",
  description: record?.description || "",
});

function RecordDialog({ kind, record, onClose, onSave, saving }) {
  const isEditing = Boolean(record);
  const imageInput = useRef(null);
  const [imageError, setImageError] = useState("");
  const [form, setForm] = useState(() => kind === "Products"
    ? productForm(record)
    : kind === "Categories"
      ? { name: record?.name || "", description: record?.description || "" }
      : { name: record?.name || "", email: record?.email || "", role: record?.role || "customer", password: "" });
  const title = `${isEditing ? "Edit" : "Add"} ${kind === "Products" ? "product" : kind === "Categories" ? "category" : "user"}`;

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Choose a valid image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageError("Choose an image smaller than 2 MB.");
      return;
    }

    setImageError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setImageError("The selected image could not be read.");
        return;
      }
      update("image", reader.result);
    };
    reader.onerror = () => setImageError("The selected image could not be read. Please try another file.");
    reader.readAsDataURL(file);
  }

  function submit(event) {
    event.preventDefault();
    const base = kind === "Products"
      ? {
          ...form,
          price: Number(form.price),
          originalPrice: form.originalPrice === "" ? null : Number(form.originalPrice),
          stock: Number(form.stock),
          categories: form.categories.split(",").map((item) => item.trim()).filter(Boolean),
        }
      : form;
    const path = kind === "Products"
      ? `/admin/products${isEditing ? `/${encodeURIComponent(record.id)}` : ""}`
      : kind === "Categories"
        ? `/admin/categories${isEditing ? `/${record._id}` : ""}`
        : `/admin/users${isEditing ? `/${record.id}` : ""}`;
    onSave(path, isEditing ? "PUT" : "POST", base, `${title} ${isEditing ? "saved" : "added"}.`);
  }

  const field = (label, key, options = {}) => (
    <label className={options.full ? "field-full" : ""}>{label}
      {options.textarea
        ? <textarea value={form[key]} onChange={(event) => update(key, event.target.value)} rows="3" required={options.required} maxLength={options.maxLength} />
        : options.select
          ? <select value={form[key]} onChange={(event) => update(key, event.target.value)}>{options.select.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          : <input type={options.type || "text"} value={form[key]} onChange={(event) => update(key, event.target.value)} required={options.required} min={options.min} max={options.max} step={options.step} maxLength={options.maxLength} autoComplete={options.autoComplete} placeholder={options.placeholder} />}
      {options.help && <small className="field-help">{options.help}</small>}
    </label>
  );
  const previewImage = form.image || (record ? localPlantImages.get(record.id) || welcomePlant : "");

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="modal-heading"><div><span className="eyebrow">STORE MANAGEMENT</span><h2 id="dialog-title">{title}</h2></div><button className="modal-close" onClick={onClose} aria-label="Close dialog">×</button></div>
      <form className="record-form" onSubmit={submit}>
        {kind === "Products" && <>
          {field("Product name", "name", { required: true, maxLength: 100 })}
          {field("Primary category", "category", { required: true, maxLength: 80 })}
          {field("Additional categories (optional)", "categories", { full: true, placeholder: "e.g. Indoor Plants, Low Light Plants", help: "Separate additional collections with commas. The primary category above is always used." })}
          {field("Selling price (₹)", "price", { type: "number", required: true, min: 0.01, step: "0.01" })}
          {field("Original price (₹)", "originalPrice", { type: "number", min: 0, step: "0.01" })}
          {field("Stock quantity", "stock", { type: "number", required: true, min: 0, step: 1 })}
          <div className="field-full product-image-field">
            <span className="image-field-label">Product image</span>
            <div className="image-upload-row">
              <div className="image-preview">
                {previewImage
                  ? <img src={previewImage} alt="Selected product preview" onError={(event) => {
                    const fallback = record ? localPlantImages.get(record.id) || welcomePlant : "";
                    if (fallback && !event.currentTarget.dataset.fallbackAttempted) {
                      event.currentTarget.dataset.fallbackAttempted = "true";
                      event.currentTarget.src = fallback;
                    } else {
                      event.currentTarget.hidden = true;
                    }
                  }} />
                  : <span>✳</span>}
              </div>
              <div className="image-upload-controls">
                <button className="button soft-button" type="button" onClick={() => imageInput.current?.click()}>Choose image</button>
                <span>PNG, JPG, WEBP or other image · Max 2 MB</span>
                <input ref={imageInput} className="visually-hidden" type="file" accept="image/*" onChange={selectImage} />
              </div>
            </div>
            {imageError && <p className="image-error" role="alert">{imageError}</p>}
            {field("Image URL (optional)", "image", { full: true, placeholder: "https://...", help: "Choosing a file replaces this URL. The selected image is saved with the product." })}
          </div>
          {field("Description", "description", { textarea: true, full: true, maxLength: 4000 })}
        </>}
        {kind === "Categories" && <>
          {field("Category name", "name", { required: true, maxLength: 80, full: true })}
          {field("Description", "description", { textarea: true, full: true, maxLength: 500 })}
        </>}
        {kind === "Users" && <>
          {field("Full name", "name", { required: true, maxLength: 100 })}
          {field("Email address", "email", { type: "email", required: true, maxLength: 254 })}
          {!isEditing && field("Temporary password", "password", { type: "password", required: true, min: 8, maxLength: 128, autoComplete: "new-password" })}
          {field("Account role", "role", { select: [{ value: "customer", label: "Customer" }, { value: "admin", label: "Administrator" }] })}
        </>}
        <div className="modal-actions"><button className="button cancel-button" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save changes" : `Add ${{ Products: "product", Categories: "category", Users: "user" }[kind]}`}</button></div>
      </form>
    </section>
  </div>;
}

export default App;
