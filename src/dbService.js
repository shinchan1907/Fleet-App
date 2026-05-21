import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy, 
  setDoc,
  getDoc
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

// Default mock data to seed local storage on first load
const DEFAULT_DRIVERS = [
  { id: 'd1', name: 'Alexander Wright', status: 'active', created_at: new Date().toISOString() },
  { id: 'd2', name: 'Sarah Jenkins', status: 'active', created_at: new Date().toISOString() },
  { id: 'd3', name: 'Marcus Vance', status: 'active', created_at: new Date().toISOString() }
];

const DEFAULT_VEHICLES = [
  { id: 'v1', plate_number: 'TX-8890', make: 'Volvo', model: 'FH16 (Semi-Truck)', status: 'active', created_at: new Date().toISOString() },
  { id: 'v2', plate_number: 'CA-4421', make: 'Ford', model: 'Transit (Cargo Van)', status: 'active', created_at: new Date().toISOString() },
  { id: 'v3', plate_number: 'NY-1029', make: 'Toyota', model: 'Hilux (Pickup)', status: 'active', created_at: new Date().toISOString() }
];

const DEFAULT_TRIPS = [
  { id: 't1', trip_date: new Date().toISOString().split('T')[0], driver_id: 'd1', vehicle_id: 'v1', destination: 'Port Terminals to Warehouse A', km_ran: 450, remarks: 'Smooth delivery, heavy cargo.', created_by: 'admin', created_at: new Date().toISOString() },
  { id: 't2', trip_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], driver_id: 'd2', vehicle_id: 'v2', destination: 'Downtown Hub to North Side Logistics', km_ran: 120, remarks: 'Routine distribution run.', created_by: 'admin', created_at: new Date().toISOString() },
  { id: 't3', trip_date: new Date(Date.now() - 172800000).toISOString().split('T')[0], driver_id: 'd3', vehicle_id: 'v3', destination: 'Eastside depot to Construction Site 4', km_ran: 85, remarks: 'Delivered supplies.', created_by: 'agent', created_at: new Date().toISOString() }
];

const DEFAULT_SERVICES = [
  { id: 's1', vehicle_id: 'v1', service_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], service_type: 'oil change', amount: 350.00, km: 45000, created_by: 'admin', created_at: new Date().toISOString() },
  { id: 's2', vehicle_id: 'v2', service_date: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0], service_type: 'break pads', amount: 220.00, km: 28000, created_by: 'admin', created_at: new Date().toISOString() },
  { id: 's3', vehicle_id: 'v3', service_date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0], service_type: 'tyre change', amount: 600.00, km: 38000, created_by: 'admin', created_at: new Date().toISOString() }
];

const DEFAULT_USERS = [];

const DEFAULT_SETTINGS = {
  interval_oil_change: 10000,
  interval_break_pads: 30000,
  interval_tyre_change: 40000
};

class DBService {
  constructor() {
    this.firebaseConfig = null;
    this.app = null;
    this.db = null;
    this.auth = null;
    this.useFirebase = false;

    // First Priority: Load credentials from Environment Variables (Vite config)
    const envConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    if (envConfig.apiKey && envConfig.projectId) {
      try {
        this.firebaseConfig = envConfig;
        this.app = initializeApp(this.firebaseConfig);
        this.db = getFirestore(this.app);
        this.auth = getAuth(this.app);
        this.useFirebase = true;
        console.log('Firebase initialized successfully via Environment Variables.');
      } catch (e) {
        console.error('Failed to initialize Firebase with Environment Variables:', e);
        this.useFirebase = false;
      }
    } else {
      // Fallback Priority: Load custom Firebase config if available in localStorage
      try {
        const storedConfig = localStorage.getItem('fleet_firebase_config');
        if (storedConfig) {
          this.firebaseConfig = JSON.parse(storedConfig);
          this.app = initializeApp(this.firebaseConfig);
          this.db = getFirestore(this.app);
          this.auth = getAuth(this.app);
          this.useFirebase = true;
          console.log('Firebase initialized successfully via local storage backup.');
        }
      } catch (e) {
        console.error('Failed to initialize Firebase with stored config:', e);
        this.useFirebase = false;
      }
    }

    // Initialize LocalStorage with default seed data if empty
    this.initLocalStorage();
  }

  initLocalStorage() {
    if (!localStorage.getItem('fleet_drivers')) localStorage.setItem('fleet_drivers', JSON.stringify(DEFAULT_DRIVERS));
    if (!localStorage.getItem('fleet_vehicles')) localStorage.setItem('fleet_vehicles', JSON.stringify(DEFAULT_VEHICLES));
    if (!localStorage.getItem('fleet_trips')) localStorage.setItem('fleet_trips', JSON.stringify(DEFAULT_TRIPS));
    if (!localStorage.getItem('fleet_services')) localStorage.setItem('fleet_services', JSON.stringify(DEFAULT_SERVICES));
    if (!localStorage.getItem('fleet_users')) localStorage.setItem('fleet_users', JSON.stringify(DEFAULT_USERS));
    if (!localStorage.getItem('fleet_settings')) localStorage.setItem('fleet_settings', JSON.stringify(DEFAULT_SETTINGS));
  }

  // Set Firebase Config and reconnect
  setFirebaseConfig(config) {
    if (!config) {
      localStorage.removeItem('fleet_firebase_config');
      this.useFirebase = false;
      this.app = null;
      this.db = null;
      this.auth = null;
      return { success: true };
    }

    try {
      localStorage.setItem('fleet_firebase_config', JSON.stringify(config));
      this.firebaseConfig = config;
      this.app = initializeApp(config);
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);
      this.useFirebase = true;
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: e.message };
    }
  }

  getFirebaseConfig() {
    return this.firebaseConfig;
  }

  // --- AUTHENTICATION ---
  async login(username, password) {
    if (this.useFirebase) {
      try {
        // If they use Firebase, standard login is through email/password.
        // We will map usernames to an email format 'username@fleet.com' for seamless usage!
        const email = username.includes('@') ? username : `${username}@fleetmaster.com`;
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        
        // Fetch role from Firestore
        const userDocRef = doc(this.db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        let role = 'user';
        let status = 'active';

        if (userDoc.exists()) {
          role = userDoc.data().role || 'user';
          status = userDoc.data().status || 'active';
        } else {
          // If first time admin logs in, provision the user document
          if (username === 'admin') {
            role = 'admin';
            await setDoc(userDocRef, { username, role, status: 'active' });
          }
        }

        if (status === 'inactive') {
          throw new Error('Account is deactivated.');
        }

        const session = { uid: userCredential.user.uid, username, role };
        localStorage.setItem('fleet_session', JSON.stringify(session));
        return { success: true, user: session };
      } catch (e) {
        console.error(e);
        return { success: false, error: e.message };
      }
    } else {
      // LocalStorage Auth
      const users = JSON.parse(localStorage.getItem('fleet_users'));
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (!user) return { success: false, error: 'Invalid username.' };
      if (user.password !== password) return { success: false, error: 'Invalid password.' };
      if (user.status === 'inactive') return { success: false, error: 'Account is deactivated.' };

      const session = { uid: user.id, username: user.username, role: user.role };
      localStorage.setItem('fleet_session', JSON.stringify(session));
      return { success: true, user: session };
    }
  }

  logout() {
    if (this.useFirebase && this.auth) {
      signOut(this.auth).catch(console.error);
    }
    localStorage.removeItem('fleet_session');
  }

  getCurrentUser() {
    const session = localStorage.getItem('fleet_session');
    return session ? JSON.parse(session) : null;
  }

  async hasAdminAccount() {
    if (this.useFirebase) {
      try {
        const querySnapshot = await getDocs(collection(this.db, 'users'));
        return querySnapshot.docs.some(doc => doc.data().role === 'admin');
      } catch (e) {
        console.error('Firebase hasAdminAccount check failed:', e);
        return true; // Fallback to normal login screen if firestore is blocked or fails
      }
    } else {
      const users = JSON.parse(localStorage.getItem('fleet_users')) || [];
      return users.some(u => u.role === 'admin');
    }
  }

  async createInitialAdmin(username, password) {
    if (this.useFirebase) {
      try {
        const email = username.includes('@') ? username : `${username}@fleetmaster.com`;
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
        
        // Write user profile to Firestore
        await setDoc(doc(this.db, 'users', userCredential.user.uid), {
          username,
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString()
        });

        const session = { uid: userCredential.user.uid, username, role: 'admin' };
        localStorage.setItem('fleet_session', JSON.stringify(session));
        return { success: true, user: session };
      } catch (e) {
        console.error('Failed to create initial Firebase Admin account:', e);
        return { success: false, error: e.message };
      }
    } else {
      const users = JSON.parse(localStorage.getItem('fleet_users')) || [];
      const id = 'u_' + Date.now();
      const newAdmin = {
        id,
        username,
        role: 'admin',
        status: 'active',
        password
      };
      users.push(newAdmin);
      localStorage.setItem('fleet_users', JSON.stringify(users));

      const session = { uid: id, username, role: 'admin' };
      localStorage.setItem('fleet_session', JSON.stringify(session));
      return { success: true, user: session };
    }
  }

  // --- DRIVERS ---
  async getDrivers() {
    if (this.useFirebase) {
      try {
        const q = query(collection(this.db, 'drivers'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(d => d.status === 'active' && !d.deleted_at);
      } catch (e) {
        console.error('Firebase read failed, falling back to LocalStorage:', e);
      }
    }
    const drivers = JSON.parse(localStorage.getItem('fleet_drivers'));
    return drivers.filter(d => d.status === 'active' && !d.deleted_at);
  }

  async addDriver(name) {
    const newDriver = { name, status: 'active', created_at: new Date().toISOString() };
    if (this.useFirebase) {
      try {
        const docRef = await addDoc(collection(this.db, 'drivers'), newDriver);
        return { success: true, id: docRef.id };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    const drivers = JSON.parse(localStorage.getItem('fleet_drivers'));
    newDriver.id = 'd_' + Date.now();
    drivers.push(newDriver);
    localStorage.setItem('fleet_drivers', JSON.stringify(drivers));
    return { success: true, id: newDriver.id };
  }

  async deleteDriver(id) {
    if (this.useFirebase) {
      try {
        const docRef = doc(this.db, 'drivers', id);
        await updateDoc(docRef, { status: 'inactive', deleted_at: new Date().toISOString() });
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    const drivers = JSON.parse(localStorage.getItem('fleet_drivers'));
    const index = drivers.findIndex(d => d.id === id);
    if (index !== -1) {
      drivers[index].status = 'inactive';
      drivers[index].deleted_at = new Date().toISOString();
      localStorage.setItem('fleet_drivers', JSON.stringify(drivers));
    }
    return { success: true };
  }

  // --- VEHICLES ---
  async getVehicles() {
    if (this.useFirebase) {
      try {
        const querySnapshot = await getDocs(collection(this.db, 'vehicles'));
        return querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(v => v.status === 'active' && !v.deleted_at);
      } catch (e) {
        console.error(e);
      }
    }
    const vehicles = JSON.parse(localStorage.getItem('fleet_vehicles'));
    return vehicles.filter(v => v.status === 'active' && !v.deleted_at);
  }

  async addVehicle(plate_number, make, model) {
    const newVehicle = { plate_number, make, model, status: 'active', created_at: new Date().toISOString() };
    if (this.useFirebase) {
      try {
        const docRef = await addDoc(collection(this.db, 'vehicles'), newVehicle);
        return { success: true, id: docRef.id };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    const vehicles = JSON.parse(localStorage.getItem('fleet_vehicles'));
    newVehicle.id = 'v_' + Date.now();
    vehicles.push(newVehicle);
    localStorage.setItem('fleet_vehicles', JSON.stringify(vehicles));
    return { success: true, id: newVehicle.id };
  }

  async deleteVehicle(id) {
    if (this.useFirebase) {
      try {
        const docRef = doc(this.db, 'vehicles', id);
        await updateDoc(docRef, { status: 'inactive', deleted_at: new Date().toISOString() });
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    const vehicles = JSON.parse(localStorage.getItem('fleet_vehicles'));
    const index = vehicles.findIndex(v => v.id === id);
    if (index !== -1) {
      vehicles[index].status = 'inactive';
      vehicles[index].deleted_at = new Date().toISOString();
      localStorage.setItem('fleet_vehicles', JSON.stringify(vehicles));
    }
    return { success: true };
  }

  // --- TRIPS ---
  async getTrips(startDate = null, endDate = null) {
    let trips = [];
    if (this.useFirebase) {
      try {
        const querySnapshot = await getDocs(collection(this.db, 'trips'));
        trips = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.error(e);
        trips = JSON.parse(localStorage.getItem('fleet_trips'));
      }
    } else {
      trips = JSON.parse(localStorage.getItem('fleet_trips'));
    }

    // Sort by trip date descending
    trips.sort((a, b) => b.trip_date.localeCompare(a.trip_date));

    // Filter by date range
    if (startDate && endDate) {
      trips = trips.filter(t => t.trip_date >= startDate && t.trip_date <= endDate);
    }
    return trips;
  }

  async addTrip(trip) {
    const session = this.getCurrentUser();
    const newTrip = { 
      ...trip, 
      created_by: session ? session.username : 'system',
      created_at: new Date().toISOString() 
    };

    if (this.useFirebase) {
      try {
        const docRef = await addDoc(collection(this.db, 'trips'), newTrip);
        return { success: true, id: docRef.id };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    const trips = JSON.parse(localStorage.getItem('fleet_trips'));
    newTrip.id = 't_' + Date.now();
    trips.push(newTrip);
    localStorage.setItem('fleet_trips', JSON.stringify(trips));
    return { success: true, id: newTrip.id };
  }

  // --- SERVICES ---
  async getServices(startDate = null, endDate = null) {
    let services = [];
    if (this.useFirebase) {
      try {
        const querySnapshot = await getDocs(collection(this.db, 'services'));
        services = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.error(e);
        services = JSON.parse(localStorage.getItem('fleet_services'));
      }
    } else {
      services = JSON.parse(localStorage.getItem('fleet_services'));
    }

    // Sort by service date descending
    services.sort((a, b) => b.service_date.localeCompare(a.service_date));

    if (startDate && endDate) {
      services = services.filter(s => s.service_date >= startDate && s.service_date <= endDate);
    }
    return services;
  }

  async addService(service) {
    const session = this.getCurrentUser();
    const newService = { 
      ...service, 
      created_by: session ? session.username : 'system',
      created_at: new Date().toISOString() 
    };

    if (this.useFirebase) {
      try {
        const docRef = await addDoc(collection(this.db, 'services'), newService);
        return { success: true, id: docRef.id };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    const services = JSON.parse(localStorage.getItem('fleet_services'));
    newService.id = 's_' + Date.now();
    services.push(newService);
    localStorage.setItem('fleet_services', JSON.stringify(services));
    return { success: true, id: newService.id };
  }

  // --- USERS MANAGEMENT ---
  async getUsers() {
    if (this.useFirebase) {
      try {
        const querySnapshot = await getDocs(collection(this.db, 'users'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.error(e);
      }
    }
    return JSON.parse(localStorage.getItem('fleet_users'));
  }

  async addUser(username, password, role) {
    if (this.useFirebase) {
      try {
        // In firebase setup, we can register user on the client side Firestore
        // Note: Creating actual Firebase Auth credentials requires Admin SDK,
        // so client-side we record the profile in the Firestore 'users' collection.
        // During auth, they log in via email format, or a fallback collection lookup can be done.
        const id = 'u_' + Date.now();
        await setDoc(doc(this.db, 'users', id), { username, role, status: 'active' });
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    const users = JSON.parse(localStorage.getItem('fleet_users'));
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: 'Username already exists.' };
    }
    const id = 'u_' + Date.now();
    users.push({ id, username, password, role, status: 'active' });
    localStorage.setItem('fleet_users', JSON.stringify(users));
    return { success: true };
  }

  async toggleUserStatus(id, newStatus) {
    if (this.useFirebase) {
      try {
        await updateDoc(doc(this.db, 'users', id), { status: newStatus });
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    const users = JSON.parse(localStorage.getItem('fleet_users'));
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index].status = newStatus;
      localStorage.setItem('fleet_users', JSON.stringify(users));
    }
    return { success: true };
  }

  // --- SETTINGS ---
  async getSettings() {
    if (this.useFirebase) {
      try {
        const docRef = doc(this.db, 'settings', 'intervals');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data();
        } else {
          await setDoc(docRef, DEFAULT_SETTINGS);
          return DEFAULT_SETTINGS;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return JSON.parse(localStorage.getItem('fleet_settings'));
  }

  async updateSettings(settings) {
    if (this.useFirebase) {
      try {
        await setDoc(doc(this.db, 'settings', 'intervals'), settings);
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    localStorage.setItem('fleet_settings', JSON.stringify(settings));
    return { success: true };
  }

  // --- UTILITY AGGREGATIONS ---
  async getDashboardStats(startDate = null, endDate = null) {
    const trips = await this.getTrips(startDate, endDate);
    const services = await this.getServices(startDate, endDate);

    const total_trips = trips.length;
    const total_kms = trips.reduce((acc, t) => acc + Number(t.km_ran || 0), 0);
    const total_services = services.length;
    const service_cost = services.reduce((acc, s) => acc + Number(s.amount || 0), 0);

    return {
      total_trips,
      total_kms,
      total_services,
      service_cost
    };
  }

  async getServiceAlerts() {
    const settings = await this.getSettings();
    const intervals = {
      'oil change': Number(settings.interval_oil_change || 10000),
      'break pads': Number(settings.interval_break_pads || 30000),
      'tyre change': Number(settings.interval_tyre_change || 40000)
    };

    const vehicles = await this.getVehicles();
    const trips = await this.getTrips();
    const services = await this.getServices();

    const alerts = [];

    for (const vehicle of vehicles) {
      const vid = vehicle.id;
      
      // Calculate lifetime kilometers traveled by this vehicle
      const vehicleTrips = trips.filter(t => t.vehicle_id === vid);
      const totalLifetimeKm = vehicleTrips.reduce((sum, t) => sum + Number(t.km_ran || 0), 0);

      for (const [type, interval] of Object.entries(intervals)) {
        // Find most recent service of this type for this vehicle
        const typeServices = services.filter(s => s.vehicle_id === vid && s.service_type === type);
        
        if (typeServices.length > 0) {
          const lastService = typeServices[0]; // Already sorted descending by date
          const lastServiceKm = Number(lastService.km || 0);
          const lastServiceDate = lastService.service_date;

          // Sum trip kilometers driven after the last service date
          const tripsSinceService = vehicleTrips.filter(t => t.trip_date > lastServiceDate);
          const kmSinceService = tripsSinceService.reduce((sum, t) => sum + Number(t.km_ran || 0), 0);

          if (kmSinceService >= interval) {
            alerts.push({
              vehicle,
              service_type: type,
              status: 'overdue',
              last_date: new Date(lastServiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              message: `Overdue by ${(kmSinceService - interval).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`
            });
          } else if (interval - kmSinceService <= 1000) {
            alerts.push({
              vehicle,
              service_type: type,
              status: 'due_soon',
              last_date: new Date(lastServiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              message: `Due in ${(interval - kmSinceService).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`
            });
          }
        } else {
          // Has never undergone this service
          if (totalLifetimeKm >= interval) {
            alerts.push({
              vehicle,
              service_type: type,
              status: 'overdue',
              last_date: 'Never',
              message: `Overdue by ${(totalLifetimeKm - interval).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`
            });
          }
        }
      }
    }

    return alerts;
  }
}

export const dbService = new DBService();
