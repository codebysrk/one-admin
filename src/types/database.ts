export interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  status: 'ACTIVE' | 'BANNED';
  createdAt: number;
}

export interface Device {
  deviceId: string;
  userId: string;
  userName: string;
  userEmail: string;
  deviceName: string;
  brand: string;
  model: string;
  platform: 'android';
  osVersion: string;
  appVersion: string;
  ipAddress: string;
  firstRegistered: number;
  lastActive: number;
  status: 'APPROVED' | 'BANNED';
  isCurrentDevice: boolean;
  forceLogout: boolean;
}

export interface Ticket {
  tid: string;
  userId: string;
  route: string;
  source: string;
  dest: string;
  busType: 'AC' | 'Non-AC';
  fare: number;
  baseFare: number;
  finalFare: string;
  total: string;
  qty: number;
  status: 'Active' | 'Expired';
  date: string;
  time: string;
  timestamp: number;
  fareSource: string;
  slab: {
    acFare: number;
    nonACFare: number;
    maxStops: number;
    minStops: number;
  };
}

export interface Notification {
  title: string;
  message: string;
  status: 'SENT' | 'PENDING';
  targetRoute: string; // 'ALL' or specific route
  readBy: Record<string, boolean>;
  timestamp: number;
}

export interface Route {
  route: string;
  directions: {
    up: {
      from: string;
      to: string;
      totalStops: number;
      stops: string[];
    };
    down: {
      from: string;
      to: string;
      totalStops: number;
      stops: string[];
    };
  };
}

export interface Stop {
  id: string;
  name: string;
  type: 'bus_stop';
  updatedAt: number;
}

export interface Log {
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details: string;
  type: 'SYSTEM' | 'USER';
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  timestamp: number;
}

export interface Metadata {
  system: {
    activeCollections: string[];
    lastInitialized: number;
  };
}
