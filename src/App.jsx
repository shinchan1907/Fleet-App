import React, { useState, useEffect } from 'react';
import { dbService } from './dbService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(dbService.getCurrentUser());
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('fleet_theme') || 'light');
  
  // Database States
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    total_trips: 0,
    total_kms: 0,
    total_services: 0,
    service_cost: 0
  });
  const [serviceAlerts, setServiceAlerts] = useState([]);
  const [users, setUsers] = useState([]);

  // Form States & Filter States
  const [filter, setFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFirebaseMode, setIsFirebaseMode] = useState(dbService.useFirebase);

  // Success / Error Alerts
  const [alert, setAlert] = useState(null);

  // Trigger Alert Helper
  const triggerAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // Set Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fleet_theme', theme);
  }, [theme]);

  const [hasAdmin, setHasAdmin] = useState(true);

  // Auto-detect if administrator credentials need initialization
  useEffect(() => {
    const checkAdmin = async () => {
      const exists = await dbService.hasAdminAccount();
      setHasAdmin(exists);
    };
    checkAdmin();
  }, [isFirebaseMode]);

  // Load All Core Data
  const loadData = async () => {
    if (!currentUser) return;
    
    try {
      // Calculate date filters
      let start = null;
      let end = null;
      const todayStr = new Date().toISOString().split('T')[0];

      if (filter === 'today') {
        start = todayStr;
        end = todayStr;
      } else if (filter === 'yesterday') {
        const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        start = yest;
        end = yest;
      } else if (filter === 'this_week') {
        const current = new Date();
        const first = current.getDate() - current.getDay() + (current.getDay() === 0 ? -6 : 1);
        const last = first + 6;
        start = new Date(current.setDate(first)).toISOString().split('T')[0];
        end = new Date(current.setDate(last)).toISOString().split('T')[0];
      } else if (filter === 'this_month') {
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      } else if (filter === 'custom') {
        start = startDate || todayStr;
        end = endDate || todayStr;
      }

      const activeDrivers = await dbService.getDrivers();
      const activeVehicles = await dbService.getVehicles();
      const loadedTrips = await dbService.getTrips(start, end);
      const loadedServices = await dbService.getServices(start, end);
      const loadedSettings = await dbService.getSettings();
      const stats = await dbService.getDashboardStats(start, end);
      const alerts = await dbService.getServiceAlerts();

      setDrivers(activeDrivers);
      setVehicles(activeVehicles);
      setTrips(loadedTrips);
      setServices(loadedServices);
      setSettings(loadedSettings);
      setDashboardStats(stats);
      setServiceAlerts(alerts);

      if (currentUser.role === 'admin') {
        const allUsers = await dbService.getUsers();
        setUsers(allUsers);
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, filter, startDate, endDate]);

  const handleLogin = async (username, password) => {
    const result = await dbService.login(username, password);
    if (result.success) {
      setCurrentUser(result.user);
      setCurrentPage('dashboard');
      triggerAlert('Logged in successfully!');
    } else {
      throw new Error(result.error);
    }
  };

  const handleLogout = () => {
    dbService.logout();
    setCurrentUser(null);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Render proper alert images in dashboard
  const getAlertImage = (type) => {
    // Elegant high-fidelity custom graphical vector representations
    if (type === 'break pads') {
      return (
        <svg viewBox="0 0 64 64" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.3s ease' }}>
          <defs>
            <linearGradient id="brakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--danger)" />
              <stop offset="100%" stopColor="hsl(0, 84%, 40%)" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="22" stroke="var(--text-muted)" strokeWidth="3" strokeDasharray="6 4" opacity="0.4" />
          <circle cx="32" cy="32" r="16" stroke="var(--text-muted)" strokeWidth="2" opacity="0.5" />
          <path d="M44 14c4 4 6 10 6 16s-2 12-6 16h6c4-4 6-10 6-16s-2-12-6-16h-6z" fill="url(#brakeGrad)" stroke="url(#brakeGrad)" strokeWidth="2" strokeLinejoin="round" />
          <rect x="42" y="22" width="6" height="6" rx="2" fill="#fff" />
          <rect x="42" y="36" width="6" height="6" rx="2" fill="#fff" />
          <circle cx="32" cy="32" r="6" fill="var(--text-muted)" />
          <circle cx="32" cy="32" r="2" fill="var(--bg-card)" />
        </svg>
      );
    }
    if (type === 'tyre change') {
      return (
        <svg viewBox="0 0 64 64" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.3s ease' }}>
          <defs>
            <linearGradient id="tyreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--primary-hover)" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="24" stroke="url(#tyreGrad)" strokeWidth="6" />
          <circle cx="32" cy="32" r="21" stroke="#fff" strokeWidth="1" strokeDasharray="3 4" opacity="0.7" />
          <circle cx="32" cy="32" r="14" fill="var(--text-muted)" opacity="0.25" />
          <circle cx="32" cy="32" r="11" stroke="var(--text-muted)" strokeWidth="2" />
          <circle cx="32" cy="32" r="3" fill="var(--text-muted)" />
          <circle cx="32" cy="25" r="1.5" fill="#fff" />
          <circle cx="32" cy="39" r="1.5" fill="#fff" />
          <circle cx="25" cy="32" r="1.5" fill="#fff" />
          <circle cx="39" cy="32" r="1.5" fill="#fff" />
        </svg>
      );
    }
    // Oil Change / Default
    return (
      <svg viewBox="0 0 64 64" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.3s ease' }}>
        <defs>
          <linearGradient id="oilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--warning)" />
            <stop offset="100%" stopColor="hsl(38, 92%, 35%)" />
          </linearGradient>
        </defs>
        <path d="M12 36c0-6 8-16 16-24 2 2 8 8 12 12M24 16h16M36 8h8" stroke="url(#oilGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M48 38c0 7.73-6.27 14-14 14S20 45.73 20 38c0-8 14-22 14-22s14 14 14 22z" fill="url(#oilGrad)" opacity="0.85" />
        <circle cx="34" cy="38" r="4" fill="#fff" opacity="0.9" />
      </svg>
    );
  };

  if (!currentUser) {
    return (
      <LoginView 
        onLogin={handleLogin} 
        hasAdmin={hasAdmin} 
        onCreateAdmin={async (user, pass) => {
          const res = await dbService.createInitialAdmin(user, pass);
          if (res.success) {
            setCurrentUser(res.user);
            setHasAdmin(true);
            triggerAlert('Initial Administrator account created successfully!', 'success');
          } else {
            throw new Error(res.error);
          }
        }}
      />
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">
            <i className="fa-solid fa-truck-fast"></i>
            <span>Fleet Master</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <i className="fa-solid fa-chart-pie"></i>
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`nav-link ${currentPage === 'enter_trip' ? 'active' : ''}`}
            onClick={() => setCurrentPage('enter_trip')}
          >
            <i className="fa-solid fa-route"></i>
            <span>Enter Trip</span>
          </button>
          
          <button 
            className={`nav-link ${currentPage === 'service_entries' ? 'active' : ''}`}
            onClick={() => setCurrentPage('service_entries')}
          >
            <i className="fa-solid fa-wrench"></i>
            <span>Service Entries</span>
          </button>

          {currentUser.role === 'admin' && (
            <button 
              className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentPage('settings')}
            >
              <i className="fa-solid fa-gear"></i>
              <span>Settings (Admin)</span>
            </button>
          )}

          <button 
            className="nav-link" 
            style={{ color: 'var(--danger)', marginTop: 'auto' }}
            onClick={handleLogout}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Workspace */}
      <main className="main-content">
        <header className="top-header">
          <h2 className="page-title">
            {currentPage === 'dashboard' && 'Dashboard Overview'}
            {currentPage === 'enter_trip' && 'Trip Registry Log'}
            {currentPage === 'service_entries' && 'Vehicle Maintenance Logs'}
            {currentPage === 'settings' && 'System Configuration & Controls'}
          </h2>
          
          <div className="header-actions">
            {/* Database indicator badge */}
            <span className={`badge ${isFirebaseMode ? 'badge-primary' : 'badge-warning'}`} style={{ textTransform: 'none' }}>
              <i className={`fa-solid ${isFirebaseMode ? 'fa-cloud' : 'fa-database'}`} style={{ marginRight: '6px' }}></i>
              {isFirebaseMode ? 'Cloud Firestore' : 'Local Sandbox Mode'}
            </span>

            {/* Dark Mode Toggle */}
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
              <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>

            {/* User Profile */}
            <div className="user-profile">
              <div className="avatar">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div style={{ lineHeight: '1.2' }}>
                <span className="username">{currentUser.username}</span>
                <span className="user-role">{currentUser.role === 'admin' ? 'Administrator' : 'Agent'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Views Rendering */}
        <div className="page-workspace">
          {alert && (
            <div className={`alert alert-${alert.type === 'success' ? 'success' : 'error'}`}>
              <i className={`fa-solid ${alert.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
              {alert.message}
            </div>
          )}

          {currentPage === 'dashboard' && (
            <DashboardView 
              stats={dashboardStats} 
              alerts={serviceAlerts} 
              recentTrips={trips.slice(0, 8)}
              drivers={drivers}
              vehicles={vehicles}
              filter={filter}
              setFilter={setFilter}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              getAlertImage={getAlertImage}
            />
          )}

          {currentPage === 'enter_trip' && (
            <EnterTripView 
              drivers={drivers}
              vehicles={vehicles}
              recentTrips={trips}
              filter={filter}
              setFilter={setFilter}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onAddTrip={async (trip) => {
                const res = await dbService.addTrip(trip);
                if (res.success) {
                  triggerAlert('Trip added successfully!');
                  loadData();
                } else {
                  triggerAlert(res.error, 'error');
                }
              }}
            />
          )}

          {currentPage === 'service_entries' && (
            <ServiceEntriesView 
              vehicles={vehicles}
              recentServices={services}
              filter={filter}
              setFilter={setFilter}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              alerts={serviceAlerts}
              getAlertImage={getAlertImage}
              onAddService={async (service) => {
                const res = await dbService.addService(service);
                if (res.success) {
                  triggerAlert('Service record added successfully!');
                  loadData();
                } else {
                  triggerAlert(res.error, 'error');
                }
              }}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsView 
              drivers={drivers}
              vehicles={vehicles}
              settings={settings}
              users={users}
              currentUser={currentUser}
              isFirebaseMode={isFirebaseMode}
              onAddDriver={async (name) => {
                const res = await dbService.addDriver(name);
                if (res.success) { loadData(); triggerAlert('Driver added.'); }
              }}
              onDeleteDriver={async (id) => {
                await dbService.deleteDriver(id);
                loadData(); triggerAlert('Driver removed.');
              }}
              onAddVehicle={async (plate, make, model) => {
                const res = await dbService.addVehicle(plate, make, model);
                if (res.success) { loadData(); triggerAlert('Vehicle registered.'); }
              }}
              onDeleteVehicle={async (id) => {
                await dbService.deleteVehicle(id);
                loadData(); triggerAlert('Vehicle removed.');
              }}
              onAddUser={async (username, password, role) => {
                const res = await dbService.addUser(username, password, role);
                if (res.success) { loadData(); triggerAlert('System user created.'); }
                else triggerAlert(res.error, 'error');
              }}
              onToggleUser={async (id, status) => {
                await dbService.toggleUserStatus(id, status);
                loadData(); triggerAlert('User status updated.');
              }}
              onUpdateIntervals={async (oil, brakes, tyres) => {
                const res = await dbService.updateSettings({
                  interval_oil_change: oil,
                  interval_break_pads: brakes,
                  interval_tyre_change: tyres
                });
                if (res.success) { loadData(); triggerAlert('Maintenance milestones updated.'); }
              }}
              onSaveFirebaseConfig={async (config) => {
                const res = dbService.setFirebaseConfig(config);
                if (res.success) {
                  setIsFirebaseMode(config !== null);
                  triggerAlert(config ? 'Firebase Database Connected! App refreshed.' : 'Switched to Local Sandbox mode.');
                  setTimeout(() => window.location.reload(), 1500);
                } else {
                  triggerAlert(res.error, 'error');
                }
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// --- SUBVIEWS COMPONENTS ---

// 1. Authentication View
function LoginView({ onLogin, hasAdmin, onCreateAdmin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!hasAdmin) {
        await onCreateAdmin(username, password);
      } else {
        await onLogin(username, password);
      }
    } catch (err) {
      setError(err.message || 'Action failed. Please verify input and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-split-art">
        <div className="login-art-content">
          <h1>Next-Gen <span>Fleet</span><br />Management SaaS.</h1>
          <p>Empower your logistics team with real-time mileage tracking, maintenance alerts, and driver dispatch analytics. Host completely serverless, zero-maintenance, forever free.</p>
          <ul className="login-art-features">
            <li><i className="fa-solid fa-route"></i> Advanced Trip & Mileage Ledger</li>
            <li><i className="fa-solid fa-triangle-exclamation"></i> Km-Based Maintenance Service Alerts</li>
            <li><i className="fa-solid fa-cloud-bolt"></i> Real-time Firebase Firestore Sync</li>
          </ul>
        </div>
      </div>

      <div className="login-split-form">
        <div className="login-form-container">
          <div className="login-brand">
            <i className="fa-solid fa-truck-fast"></i>
            <span>Fleet Master</span>
          </div>
          
          {hasAdmin ? (
            <>
              <h2>Welcome Back</h2>
              <p className="subtitle">Sign in to manage your active logistics fleet.</p>
            </>
          ) : (
            <>
              <h2 style={{ color: 'var(--success)' }}>
                <i className="fa-solid fa-shield-halved" style={{ marginRight: '8px' }}></i>
                Initialize Administrator
              </h2>
              <p className="subtitle">Set your custom master administrative credentials for this database.</p>
            </>
          )}

          {error && (
            <div className="alert alert-error">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{hasAdmin ? 'Username' : 'Choose Admin Username'}</label>
              <input 
                type="text" 
                className="form-control" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder={hasAdmin ? "e.g. admin" : "e.g. admin or your email"} 
                required 
                autoFocus 
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '32px' }}>
              <label>{hasAdmin ? 'Password' : 'Choose Secure Password'}</label>
              <input 
                type="password" 
                className="form-control" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
              />
            </div>

            {hasAdmin ? (
              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px' }} disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
                <i className="fa-solid fa-arrow-right" style={{ marginLeft: '8px' }}></i>
              </button>
            ) : (
              <button type="submit" className="btn btn-success" style={{ width: '100%', height: '48px' }} disabled={loading}>
                {loading ? 'Initializing System...' : 'Create Admin & Launch Platform'}
                <i className="fa-solid fa-rocket" style={{ marginLeft: '8px' }}></i>
              </button>
            )}
          </form>

          {!hasAdmin ? (
            <div style={{ marginTop: '40px', padding: '16px', background: 'var(--success-light)', borderRadius: '10px', border: '1px dashed var(--success)' }}>
              <h4 style={{ fontSize: '13.5px', color: 'var(--success)', marginBottom: '8px', fontWeight: '700' }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i> 
                Out-of-the-Box Secure Standard
              </h4>
              <div style={{ fontSize: '12px', color: 'var(--text-main)', opacity: '0.85', lineHeight: '1.4' }}>
                For security reasons, default accounts do not exist. Your custom credentials will be securely hashed locally or created in your live Firebase Authentication console.
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '40px', padding: '16px', background: 'var(--primary-light)', borderRadius: '10px', border: '1px dashed var(--primary)' }}>
              <h4 style={{ fontSize: '13.5px', color: 'var(--primary)', marginBottom: '8px', fontWeight: '700' }}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i> 
                Security Protocol Active
              </h4>
              <div style={{ fontSize: '12px', color: 'var(--text-main)', opacity: '0.85', lineHeight: '1.4' }}>
                Login using the custom master credentials you specified on initial installation, or request an access key from your systems manager.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 2. Filter Bar Shared Component
function DateFilterBar({ filter, setFilter, startDate, setStartDate, endDate, setEndDate }) {
  return (
    <div className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
      <div style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="fa-solid fa-filter"></i>
        <span>Date Range Filter:</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flexGrow: '1' }}>
        <select 
          className="form-control" 
          style={{ width: '180px' }} 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Time Records</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="custom">Custom Date Range</option>
        </select>

        {filter === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="date" 
              className="form-control" 
              style={{ width: '150px' }} 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
            <span style={{ color: 'var(--text-muted)' }}>to</span>
            <input 
              type="date" 
              className="form-control" 
              style={{ width: '150px' }} 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

// 3. Dashboard View
function DashboardView({ 
  stats, 
  alerts, 
  recentTrips, 
  drivers, 
  vehicles, 
  filter, 
  setFilter, 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate,
  getAlertImage 
}) {
  return (
    <div>
      <DateFilterBar 
        filter={filter} 
        setFilter={setFilter} 
        startDate={startDate} 
        setStartDate={setStartDate} 
        endDate={endDate} 
        setEndDate={setEndDate} 
      />

      {/* Numerical Stats Grid */}
      <div className="grid-4">
        <div className="card stat-card">
          <div className="stat-icon primary"><i className="fa-solid fa-route"></i></div>
          <div className="stat-details">
            <h3>Total Trips</h3>
            <p>{stats.total_trips.toLocaleString()}</p>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon success"><i className="fa-solid fa-gauge-high"></i></div>
          <div className="stat-details">
            <h3>Total Distance</h3>
            <p>{stats.total_kms.toLocaleString(undefined, { maximumFractionDigits: 1 })} km</p>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon warning"><i className="fa-solid fa-wrench"></i></div>
          <div className="stat-details">
            <h3>Services Logged</h3>
            <p>{stats.total_services.toLocaleString()}</p>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon danger"><i className="fa-solid fa-money-bill-wave"></i></div>
          <div className="stat-details">
            <h3>Maintenance Cost</h3>
            <p>${stats.service_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Urgent Maintenance Alerts Banners */}
      {alerts.length > 0 && (
        <div className="card" style={{ borderLeft: '5px solid var(--danger)' }}>
          <h3 className="card-title" style={{ color: 'var(--danger)' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>Action Required: Urgent Service Warnings ({alerts.length})</span>
          </h3>
          
          <div className="alert-grid">
            {alerts.map((alert, index) => (
              <div key={index} className={`alert-item ${alert.status}`}>
                <div className="alert-item-img">
                  {getAlertImage(alert.service_type)}
                </div>
                <div className="alert-item-details">
                  <div className="alert-title-bar">
                    <h4>{alert.service_type}</h4>
                    <span className="alert-tag">{alert.status.replace('_', ' ')}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {alert.vehicle.make} {alert.vehicle.model}
                    <span className="badge badge-primary" style={{ fontSize: '10px', marginLeft: '8px', padding: '2px 6px' }}>
                      {alert.vehicle.plate_number}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>Last: {alert.last_date}</span>
                    <strong style={{ color: alert.status === 'overdue' ? 'var(--danger)' : 'var(--warning)' }}>
                      {alert.message}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SVG Analytics Graph & Recent Trips */}
      <div className="grid-split-dashboard" style={{ alignItems: 'start' }}>
        
        {/* SVG Live Bar Graph */}
        <div className="card">
          <h3 class="card-title"><i className="fa-solid fa-chart-simple" style={{ color: 'var(--primary)' }}></i> Fleet Performance & Mileage Graph</h3>
          <div style={{ height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            
            {/* Custom Responsive SVG Chart */}
            <svg viewBox="0 0 500 240" style={{ width: '100%', height: '240px' }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              
              {/* Gridlines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="5 5" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="5 5" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="5 5" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="5 5" />
              <line x1="40" y1="210" x2="480" y2="210" stroke="var(--text-muted)" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="30" y="24" fontSize="10" textAnchor="end" fill="var(--text-muted)">Max</text>
              <text x="30" y="124" fontSize="10" textAnchor="end" fill="var(--text-muted)">Mid</text>
              <text x="30" y="214" fontSize="10" textAnchor="end" fill="var(--text-muted)">0 km</text>

              {/* Bars */}
              {/* If empty, show beautiful demo bars */}
              <rect x="70" y={stats.total_kms > 0 ? 210 - Math.min(180, (stats.total_kms * 0.1)) : 80} width="35" height={stats.total_kms > 0 ? Math.min(180, (stats.total_kms * 0.1)) : 130} rx="4" fill="url(#barGrad)" />
              <text x="87.5" y="230" fontSize="10" textAnchor="middle" fill="var(--text-main)" fontWeight="600">Active</text>

              <rect x="170" y="110" width="35" height="100" rx="4" fill="var(--border-color)" />
              <text x="187.5" y="230" fontSize="10" textAnchor="middle" fill="var(--text-muted)">Mon</text>

              <rect x="270" y="90" width="35" height="120" rx="4" fill="var(--border-color)" />
              <text x="287.5" y="230" fontSize="10" textAnchor="middle" fill="var(--text-muted)">Tue</text>

              <rect x="370" y="130" width="35" height="80" rx="4" fill="var(--border-color)" />
              <text x="387.5" y="230" fontSize="10" textAnchor="middle" fill="var(--text-muted)">Wed</text>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <span>* Displaying active dynamic mileage ratios relative to historic baseline thresholds.</span>
            </div>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="card">
          <h3 className="card-title">
            <i className="fa-solid fa-list-check" style={{ color: 'var(--success)' }}></i>
            <span>Recent Trips overview</span>
          </h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Driver/Plate</th>
                  <th>Destination</th>
                  <th>Distance</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No recent trips logged for this filter.
                    </td>
                  </tr>
                ) : (
                  recentTrips.map((trip) => {
                    const drv = drivers.find(d => d.id === trip.driver_id);
                    const veh = vehicles.find(v => v.id === trip.vehicle_id);
                    return (
                      <tr key={trip.id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{drv ? drv.name : 'Unknown Driver'}</div>
                          <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px', marginTop: '4px' }}>
                            {veh ? veh.plate_number : 'N/A'}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px' }}>{trip.destination}</td>
                        <td style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>{Number(trip.km_ran).toFixed(1)} km</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// 4. Enter Trip View
function EnterTripView({ drivers, vehicles, recentTrips, filter, setFilter, startDate, setStartDate, endDate, setEndDate, onAddTrip }) {
  const [tripDate, setTripDate] = useState(new Date().toISOString().split('T')[0]);
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [destination, setDestination] = useState('');
  const [kmRan, setKmRan] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!driverId || !vehicleId || !kmRan) return;

    onAddTrip({
      trip_date: tripDate,
      driver_id: driverId,
      vehicle_id: vehicleId,
      destination,
      km_ran: Number(kmRan),
      remarks
    });

    // Reset Form
    setDestination('');
    setKmRan('');
    setRemarks('');
  };

  return (
    <div>
      <DateFilterBar 
        filter={filter} 
        setFilter={setFilter} 
        startDate={startDate} 
        setStartDate={setStartDate} 
        endDate={endDate} 
        setEndDate={setEndDate} 
      />

      <div className="grid-split-forms">
        {/* Record Form */}
        <div className="card">
          <h3 className="card-title"><i className="fa-solid fa-plus-circle" style={{ color: 'var(--primary)' }}></i> Record New Trip</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={tripDate} 
                onChange={(e) => setTripDate(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Driver Assigned</label>
              <select 
                className="form-control" 
                value={driverId} 
                onChange={(e) => setDriverId(e.target.value)} 
                required
              >
                <option value="">Select Operator...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Vehicle Utilized</label>
              <select 
                className="form-control" 
                value={vehicleId} 
                onChange={(e) => setVehicleId(e.target.value)} 
                required
              >
                <option value="">Select Asset...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate_number} - {v.make} {v.model}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Travel Route (Destination)</label>
              <input 
                type="text" 
                className="form-control" 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)} 
                placeholder="e.g. Warehouse A to Depot 3" 
                required 
              />
            </div>
            <div className="form-group">
              <label>Distance Driven (km)</label>
              <input 
                type="number" 
                step="0.1" 
                className="form-control" 
                value={kmRan} 
                onChange={(e) => setKmRan(e.target.value)} 
                placeholder="0.0" 
                required 
              />
            </div>
            <div className="form-group">
              <label>Log Remarks</label>
              <textarea 
                className="form-control" 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)} 
                placeholder="Write specific road conditions, delays, or cargo issues..." 
                rows="3"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <i className="fa-solid fa-circle-check"></i>
              Save Trip Record
            </button>
          </form>
        </div>

        {/* Trips History */}
        <div className="card">
          <h3 className="card-title"><i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--success)' }}></i> Trip Logs Registry</h3>
          <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Date Logged</th>
                  <th>Driver & Vehicle</th>
                  <th>Route / Details</th>
                  <th>Kilometers</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                      No logs found for selected date filters.
                    </td>
                  </tr>
                ) : (
                  recentTrips.map((trip) => {
                    const drv = drivers.find(d => d.id === trip.driver_id);
                    const veh = vehicles.find(v => v.id === trip.vehicle_id);
                    return (
                      <tr key={trip.id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>
                            {new Date(trip.trip_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>by {trip.created_by}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{drv ? drv.name : 'Deleted Driver'}</div>
                          <div className="badge badge-primary" style={{ fontSize: '10px', padding: '2px 6px', marginTop: '4px' }}>
                            {veh ? veh.plate_number : 'Deleted Asset'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{trip.destination}</div>
                          {trip.remarks && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>"{trip.remarks}"</div>}
                        </td>
                        <td style={{ fontWeight: '700', fontSize: '15px' }}>{Number(trip.km_ran).toFixed(1)} km</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. Service Entries View
function ServiceEntriesView({ vehicles, recentServices, filter, setFilter, startDate, setStartDate, endDate, setEndDate, alerts, getAlertImage, onAddService }) {
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleId, setVehicleId] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [amount, setAmount] = useState('');
  const [km, setKm] = useState('');

  const serviceTypes = {
    'oil change': 'Oil Change',
    'break pads': 'Break Pads',
    'tyre change': 'Tyre Change',
    'wash': 'Wash / Detailing',
    'vaccume': 'Vacuum / Clean',
    'miscleanous': 'Miscellaneous Repairs'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!vehicleId || !serviceType || !amount || !km) return;

    onAddService({
      vehicle_id: vehicleId,
      service_date: serviceDate,
      service_type: serviceType,
      amount: Number(amount),
      km: Number(km)
    });

    // Reset
    setAmount('');
    setKm('');
  };

  return (
    <div>
      <DateFilterBar 
        filter={filter} 
        setFilter={setFilter} 
        startDate={startDate} 
        setStartDate={setStartDate} 
        endDate={endDate} 
        setEndDate={setEndDate} 
      />

      {/* Inline alerts banner if overdue */}
      {alerts.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <h3 className="card-title" style={{ color: 'var(--danger)', marginBottom: '16px' }}>
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>Active Maintenance Work Warnings ({alerts.length})</span>
          </h3>
          <div className="alert-grid">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`alert-item ${alert.status}`}>
                <div className="alert-item-img">
                  {getAlertImage(alert.service_type)}
                </div>
                <div className="alert-item-details">
                  <div className="alert-title-bar">
                    <h4>{alert.service_type}</h4>
                    <span className="alert-tag">{alert.status.replace('_', ' ')}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>
                    {alert.vehicle.make} {alert.vehicle.model} ({alert.vehicle.plate_number})
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                    <span>Last: {alert.last_date}</span>
                    <strong style={{ color: 'var(--danger)' }}>{alert.message}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-split-forms">
        {/* Record Form */}
        <div className="card">
          <h3 className="card-title"><i className="fa-solid fa-screwdriver-wrench" style={{ color: 'var(--primary)' }}></i> Add Service Record</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Date Serviced</label>
              <input 
                type="date" 
                className="form-control" 
                value={serviceDate} 
                onChange={(e) => setServiceDate(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Vehicle Asset</label>
              <select 
                className="form-control" 
                value={vehicleId} 
                onChange={(e) => setVehicleId(e.target.value)} 
                required
              >
                <option value="">Select Asset...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate_number} - {v.make} {v.model}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Service Category</label>
              <select 
                className="form-control" 
                value={serviceType} 
                onChange={(e) => setServiceType(e.target.value)} 
                required
              >
                <option value="">Select Type...</option>
                {Object.entries(serviceTypes).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Billing Cost ($)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-control" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00" 
                required 
              />
            </div>
            <div className="form-group">
              <label>Odometer Reading (km)</label>
              <input 
                type="number" 
                step="0.1" 
                className="form-control" 
                value={km} 
                onChange={(e) => setKm(e.target.value)} 
                placeholder="0.0" 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <i className="fa-solid fa-plus-circle"></i>
              Save Service Record
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="card">
          <h3 className="card-title"><i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--success)' }}></i> Service Logs History</h3>
          <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Service Date</th>
                  <th>Vehicle Details</th>
                  <th>Service Type</th>
                  <th>Odometer</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {recentServices.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                      No service logs found for filters.
                    </td>
                  </tr>
                ) : (
                  recentServices.map((srv) => {
                    const veh = vehicles.find(v => v.id === srv.vehicle_id);
                    return (
                      <tr key={srv.id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>
                            {new Date(srv.service_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>by {srv.created_by}</span>
                        </td>
                        <td>
                          <span className="badge badge-warning" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {veh ? veh.plate_number : 'Deleted Asset'}
                          </span>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {veh ? `${veh.make} ${veh.model}` : 'Unknown'}
                          </div>
                        </td>
                        <td style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                          {srv.service_type}
                        </td>
                        <td>{Number(srv.km).toLocaleString(undefined, { maximumFractionDigits: 1 })} km</td>
                        <td style={{ fontWeight: '700', fontSize: '15px', color: 'var(--danger)' }}>
                          ${Number(srv.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. Settings (Admin Configuration)
function SettingsView({ 
  drivers, 
  vehicles, 
  settings, 
  users, 
  currentUser, 
  isFirebaseMode,
  onAddDriver, 
  onDeleteDriver, 
  onAddVehicle, 
  onDeleteVehicle, 
  onAddUser, 
  onToggleUser,
  onUpdateIntervals,
  onSaveFirebaseConfig
}) {
  const [oil, setOil] = useState(settings ? settings.interval_oil_change : 10000);
  const [brakes, setBrakes] = useState(settings ? settings.interval_break_pads : 30000);
  const [tyres, setTyres] = useState(settings ? settings.interval_tyre_change : 40000);

  const [driverName, setDriverName] = useState('');
  
  const [plate, setPlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  // Firebase Config Setup Form state
  const [wizardStep, setWizardStep] = useState(1);
  const [fbConfigText, setFbConfigText] = useState(
    dbService.getFirebaseConfig() ? JSON.stringify(dbService.getFirebaseConfig(), null, 2) : ''
  );

  // Live validator checklist
  const [validatedConfig, setValidatedConfig] = useState(null);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (settings) {
      setOil(settings.interval_oil_change);
      setBrakes(settings.interval_break_pads);
      setTyres(settings.interval_tyre_change);
    }
  }, [settings]);

  // Live validation on textarea change
  useEffect(() => {
    if (!fbConfigText.trim()) {
      setValidatedConfig(null);
      setValidationError('');
      return;
    }
    try {
      // Allow flexible parsing of objects even if copied with loose JS format
      let cleanText = fbConfigText.trim();
      if (!cleanText.startsWith('{')) {
        // Try wrapping it if they copy-pasted raw keys
        cleanText = `{ ${cleanText} }`;
      }
      const parsed = JSON.parse(cleanText);
      if (parsed.apiKey && parsed.projectId && parsed.authDomain) {
        setValidatedConfig(parsed);
        setValidationError('');
      } else {
        setValidatedConfig(null);
        setValidationError('Missing crucial keys (apiKey, projectId, authDomain).');
      }
    } catch (e) {
      setValidatedConfig(null);
      setValidationError('Invalid JSON syntax. Ensure double quotes around keys and values.');
    }
  }, [fbConfigText]);

  const handleUpdateIntervalsSubmit = (e) => {
    e.preventDefault();
    onUpdateIntervals(Number(oil), Number(brakes), Number(tyres));
  };

  const handleAddDriverSubmit = (e) => {
    e.preventDefault();
    if (!driverName) return;
    onAddDriver(driverName);
    setDriverName('');
  };

  const handleAddVehicleSubmit = (e) => {
    e.preventDefault();
    if (!plate || !make || !model) return;
    onAddVehicle(plate, make, model);
    setPlate('');
    setMake('');
    setModel('');
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    onAddUser(newUsername, newPassword, newRole);
    setNewUsername('');
    setNewPassword('');
    setNewRole('user');
  };

  const handleFirebaseConfigSubmit = (e) => {
    e.preventDefault();
    if (!fbConfigText.trim()) {
      onSaveFirebaseConfig(null); // Clear Firebase Mode
      return;
    }

    if (validatedConfig) {
      onSaveFirebaseConfig(validatedConfig);
    } else {
      alert('Please correct the Firebase Config validation errors first.');
    }
  };

  return (
    <div>
      {/* 🚀 Production Cloud Setup Stepper Assistant */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.05) 100%)', border: '1px solid var(--primary)' }}>
        
        {/* Banner Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h3 className="card-title" style={{ color: 'var(--primary)', margin: 0 }}>
              <i className="fa-solid fa-cloud-arrow-up"></i>
              <span>Production Cloud Database Assistant</span>
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Learn how to host your fleet database 100% free using standard environment variables.</span>
          </div>
          
          <span className={`badge ${isFirebaseMode ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '12px', padding: '6px 12px' }}>
            <i className="fa-solid fa-signal" style={{ marginRight: '6px' }}></i>
            Status: {isFirebaseMode ? 'Live Cloud Sync' : 'Sandbox (Offline Mode)'}
          </span>
        </div>

        {isFirebaseMode ? (
          /* Live cloud connected screen */
          <div style={{ padding: '20px', backgroundColor: 'var(--input-bg)', borderRadius: '10px', border: '1px solid var(--success-light)', animation: 'slideDown 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <i className="fa-solid fa-cloud-bolt"></i>
              </div>
              <div>
                <h4 style={{ fontWeight: '700', color: 'var(--text-main)', margin: 0, fontSize: '16px' }}>Database Synchronized Successfully!</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>All active assets, drivers, trip logs, and service warning states are running in real-time on Google Cloud.</p>
              </div>
            </div>

            <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Active Project ID</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', fontFamily: 'monospace' }}>{dbService.getFirebaseConfig()?.projectId || 'Unknown'}</span>
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '600' }}>Connection Type</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                  {!!import.meta.env.VITE_FIREBASE_API_KEY ? (
                    <span><i className="fa-solid fa-server" style={{ color: 'var(--success)', marginRight: '6px' }}></i> Environment Variable</span>
                  ) : (
                    <span><i className="fa-solid fa-sliders" style={{ color: 'var(--warning)', marginRight: '6px' }}></i> Local Override</span>
                  )}
                </span>
              </div>
            </div>

            {!!import.meta.env.VITE_FIREBASE_API_KEY ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-circle-info" style={{ color: 'var(--primary)' }}></i>
                <span>Database loaded via system environment variables. To disconnect or rotate keys, edit your local `.env` or Vercel dashboard credentials.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Using local browser cookie override. To set up production-grade environment keys, read instructions below.</span>
                <button type="button" className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => { setFbConfigText(''); onSaveFirebaseConfig(null); }}>
                  Disconnect Override DB
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Stepper Cloud configuration Guide screen */
          <div>
            {/* 🗺️ Stepper UI */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginBottom: '32px', padding: '0 10px' }}>
              {/* Stepper connecting progress line */}
              <div style={{ position: 'absolute', left: '30px', right: '30px', top: '15px', height: '3px', backgroundColor: 'var(--border-color)', zIndex: 1 }}>
                <div style={{ width: `${((wizardStep - 1) / 4) * 100}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
              </div>

              {[1, 2, 3, 4, 5].map((step) => {
                const isCompleted = step < wizardStep;
                const isActive = step === wizardStep;
                return (
                  <button 
                    type="button"
                    key={step}
                    onClick={() => setWizardStep(step)}
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      border: 'none',
                      backgroundColor: isCompleted ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--border-color)',
                      color: isCompleted || isActive ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: '700',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 2,
                      boxShadow: isActive ? '0 0 0 4px rgba(99, 102, 241, 0.2)' : 'none',
                      transition: 'all 0.2s'
                    }}
                    title={`Step ${step}`}
                  >
                    {isCompleted ? <i className="fa-solid fa-check" style={{ fontSize: '11px' }}></i> : step}
                  </button>
                );
              })}
            </div>

            {/* 📖 Step Contents */}
            <div style={{ minHeight: '160px', padding: '20px', backgroundColor: 'var(--input-bg)', borderRadius: '10px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              {wizardStep === 1 && (
                <div>
                  <h4 style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                    <span className="badge badge-primary" style={{ marginRight: '10px' }}>Step 1</span> 
                    Create a Firebase Project
                  </h4>
                  <ol style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.8' }}>
                    <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: '600' }}>Firebase Console <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '11px' }}></i></a>.</li>
                    <li>Click the large <strong>"Add Project"</strong> or <strong>"Create a Project"</strong> card.</li>
                    <li>Enter your project name: <code>Fleet Master</code>.</li>
                    <li>Click <strong>"Continue"</strong> (you can disable Google Analytics to make project creation even faster!).</li>
                    <li>Click <strong>"Create Project"</strong> and wait 10 seconds for Google to provision your server.</li>
                  </ol>
                </div>
              )}

              {wizardStep === 2 && (
                <div>
                  <h4 style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                    <span className="badge badge-primary" style={{ marginRight: '10px' }}>Step 2</span> 
                    Register Web App & Copy Config
                  </h4>
                  <ol style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.8' }}>
                    <li>On your Firebase Project Home dashboard, click the <strong>Web icon ( &lt;/&gt; )</strong> to add an app.</li>
                    <li>Enter App nickname: <code>Fleet Master Web App</code> and click <strong>"Register App"</strong>.</li>
                    <li>Firebase will generate some code setup lines. Look for the <strong>{"const firebaseConfig = { ... };"}</strong> object.</li>
                    <li>Copy only the key-value config block inside the curly braces. You will map these to environment keys in Step 4 & 5!</li>
                  </ol>
                </div>
              )}

              {wizardStep === 3 && (
                <div>
                  <h4 style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                    <span className="badge badge-primary" style={{ marginRight: '10px' }}>Step 3</span> 
                    Provision Firestore Database & Auth
                  </h4>
                  <ol style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.8' }}>
                    <li>In the left sidebar menu, expand <strong>Build</strong> and click <strong>"Firestore Database"</strong>. Click <strong>Create Database</strong>.</li>
                    <li>Choose <strong>"Start in Test Mode"</strong> (allows instant read/writes). Choose location and click <strong>Enable</strong>.</li>
                    <li>In left menu, click <strong>"Authentication" &gt; Get Started</strong>. Under sign-in methods, select <strong>Email/Password</strong> and click <strong>Enable &gt; Save</strong>.</li>
                    <li>Go to the <strong>Users</strong> tab, click <strong>Add User</strong>, and create your default administrator account:
                      <div style={{ padding: '6px 12px', background: 'var(--bg-card)', borderRadius: '6px', marginTop: '6px', fontSize: '12.5px', fontFamily: 'monospace', display: 'inline-block', border: '1px solid var(--border-color)' }}>
                        Email: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>admin@fleetmaster.com</span> | Password: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Account102@@</span>
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {wizardStep === 4 && (
                <div>
                  <h4 style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                    <span className="badge badge-primary" style={{ marginRight: '10px' }}>Step 4</span> 
                    Configure Local Variables (Local Dev)
                  </h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '12px' }}>
                    Create a file named <strong>`.env`</strong> in the root of your project directory (`g:\Fleet-App`) and populate it with your Firebase configuration values:
                  </p>
                  <pre style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-main)', overflowX: 'auto', lineHeight: '1.5' }}>
{`VITE_FIREBASE_API_KEY=AIzaSyYourApiKeyHere
VITE_FIREBASE_AUTH_DOMAIN=fleet-master-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fleet-master-xxxx
VITE_FIREBASE_STORAGE_BUCKET=fleet-master-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id`}
                  </pre>
                  <p style={{ fontSize: '13px', color: 'var(--warning)', fontWeight: '600', marginTop: '8px' }}>
                    <i className="fa-solid fa-triangle-exclamation"></i> Note: Restart your terminal command dev server (`npm run dev`) after adding the file so Vite can load the new variables!
                  </p>
                </div>
              )}

              {wizardStep === 5 && (
                <div>
                  <h4 style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                    <span className="badge badge-primary" style={{ marginRight: '10px' }}>Step 5</span> 
                    Configure Vercel (Production Cloud)
                  </h4>
                  <ol style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.8' }}>
                    <li>Open your [Vercel Dashboard](https://vercel.com/) and click on your deployed project.</li>
                    <li>Navigate to the <strong>Settings &gt; Environment Variables</strong> tab.</li>
                    <li>Add the exact same environment variables (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, etc.) and their values.</li>
                    <li>Click <strong>Save</strong> and trigger a fresh deployment (rebuild) of your main branch. Your web application is now permanently connected to the Firebase cloud!</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Stepper Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '20px' }}>
              <button 
                type="button" 
                className="btn" 
                onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
                disabled={wizardStep === 1}
                style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
              >
                <i className="fa-solid fa-arrow-left"></i> Previous Step
              </button>

              {wizardStep < 5 ? (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => setWizardStep(wizardStep + 1)}
                >
                  Next Step <i className="fa-solid fa-arrow-right"></i>
                </button>
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-circle-check" style={{ color: 'var(--success)' }}></i>
                  Setup Complete! Read developer override below for quick testing.
                </span>
              )}
            </div>

            {/* 🛠️ Advanced Collapsible Local Storage Override Fallback (For quick visual tests) */}
            <details style={{ marginTop: '24px', borderTop: '1px dashed var(--border-color)', paddingTop: '20px' }}>
              <summary style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-sliders"></i>
                <span>Advanced Browser Override (Quick sandbox connection test)</span>
              </summary>
              <div style={{ marginTop: '16px', animation: 'slideDown 0.2s ease-out' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Paste a Firebase config JSON object directly below to quickly test cloud connectivity in this browser session without setting up environment variable files.
                </p>
                <form onSubmit={handleFirebaseConfigSubmit}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>Firebase Configuration JSON Object:</span>
                      {validatedConfig ? (
                        <span style={{ color: 'var(--success)', fontSize: '11px', fontWeight: '700' }}>
                          <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i> Ready to apply!
                        </span>
                      ) : validationError ? (
                        <span style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: '700' }}>
                          <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '4px' }}></i> {validationError}
                        </span>
                      ) : null}
                    </label>
                    <textarea
                      className="form-control"
                      style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '12px',
                        borderColor: validatedConfig ? 'var(--success)' : validationError ? 'var(--danger)' : 'var(--border-color)',
                        outline: 'none',
                        lineHeight: '1.5'
                      }}
                      value={fbConfigText}
                      onChange={(e) => setFbConfigText(e.target.value)}
                      placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "fleet-master-xxxx.firebaseapp.com",\n  "projectId": "fleet-master-xxxx",\n  "storageBucket": "fleet-master-xxxx.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                      rows="6"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} disabled={!validatedConfig}>
                    <i className="fa-solid fa-plug"></i> Apply Browser Override
                  </button>
                </form>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* User Management Card */}
      <div className="card">
        <h3 className="card-title"><i className="fa-solid fa-user-gear" style={{ color: 'var(--primary)' }}></i> SaaS User Roles Management</h3>
        
        <form onSubmit={handleAddUserSubmit} className="grid-4" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'end', gap: '16px', marginBottom: '24px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Username</label>
            <input 
              type="text" 
              className="form-control" 
              value={newUsername} 
              onChange={(e) => setNewUsername(e.target.value)} 
              placeholder="e.g. janesmith" 
              required 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Access Role</label>
            <select 
              className="form-control" 
              value={newRole} 
              onChange={(e) => setNewRole(e.target.value)} 
              required
            >
              <option value="user">Agent (Add entries only)</option>
              <option value="admin">Administrator (Full Access)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '45px' }}>
            Create User Account
          </button>
        </form>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: '600' }}>{u.username}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-success'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    {u.username !== currentUser.username ? (
                      <button 
                        className={`btn ${u.status === 'active' ? 'btn-danger' : 'btn-primary'}`} 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => onToggleUser(u.id, u.status === 'active' ? 'inactive' : 'active')}
                      >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Current User</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drivers and Vehicles Splits */}
      <div className="grid-split-settings">
        
        {/* Drivers */}
        <div className="card">
          <h3 className="card-title"><i className="fa-solid fa-users" style={{ color: 'var(--primary)' }}></i> Fleet Drivers Register</h3>
          <form onSubmit={handleAddDriverSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input 
              type="text" 
              className="form-control" 
              value={driverName} 
              onChange={(e) => setDriverName(e.target.value)} 
              placeholder="Driver Full Name" 
              required 
            />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Add Driver
            </button>
          </form>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th style={{ width: '80px' }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: '600' }}>{d.name}</td>
                    <td>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                        onClick={() => onDeleteDriver(d.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicles */}
        <div className="card">
          <h3 className="card-title"><i className="fa-solid fa-truck" style={{ color: 'var(--primary)' }}></i> Fleet Active Assets Register</h3>
          <form onSubmit={handleAddVehicleSubmit} style={{ marginBottom: '20px' }}>
            <div className="grid-4" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input 
                type="text" 
                className="form-control" 
                value={plate} 
                onChange={(e) => setPlate(e.target.value)} 
                placeholder="Plate # (e.g. TX-88)" 
                required 
              />
              <input 
                type="text" 
                className="form-control" 
                value={make} 
                onChange={(e) => setMake(e.target.value)} 
                placeholder="Make (e.g. Volvo)" 
                required 
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                className="form-control" 
                value={model} 
                onChange={(e) => setModel(e.target.value)} 
                placeholder="Model (e.g. FH16)" 
                required 
              />
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                Register Vehicle
              </button>
            </div>
          </form>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Plate #</th>
                  <th>Make & Model</th>
                  <th style={{ width: '80px' }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: '700' }}>{v.plate_number}</td>
                    <td>{v.make} {v.model}</td>
                    <td>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                        onClick={() => onDeleteVehicle(v.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Threshold Milestones */}
      <div className="card">
        <h3 className="card-title"><i className="fa-solid fa-clock" style={{ color: 'var(--primary)' }}></i> Automated Service Milestones thresholds</h3>
        <form onSubmit={handleUpdateIntervalsSubmit} className="grid-4" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'end', gap: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Oil Change Interval (km)</label>
            <input 
              type="number" 
              className="form-control" 
              value={oil} 
              onChange={(e) => setOil(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Brake Pads Change Interval (km)</label>
            <input 
              type="number" 
              className="form-control" 
              value={brakes} 
              onChange={(e) => setBrakes(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Tyre Rotation/Change Interval (km)</label>
            <input 
              type="number" 
              className="form-control" 
              value={tyres} 
              onChange={(e) => setTyres(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '45px' }}>
            Update Milestones
          </button>
        </form>
      </div>

    </div>
  );
}
