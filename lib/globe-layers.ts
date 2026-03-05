import type { NuclearFacility, NavalVessel } from './types';

// ── Nuclear Facilities ────────────────────────────────────────────────
// Sources: SIPRI, IAEA, FAS Nuclear Notebook, open-source satellite imagery
export const NUCLEAR_FACILITIES: NuclearFacility[] = [
  // United States
  { layerType: 'nuclear', name: 'Kirtland AFB Storage', country: 'USA', lat: 35.04, lng: -106.61, type: 'storage', status: 'operational', warheads: 1900, notes: 'Largest US warhead storage site' },
  { layerType: 'nuclear', name: 'Pantex Plant', country: 'USA', lat: 35.24, lng: -101.55, type: 'storage', status: 'operational', notes: 'US nuclear weapons assembly & disassembly' },
  { layerType: 'nuclear', name: 'Y-12 National Security Complex', country: 'USA', lat: 36.01, lng: -84.25, type: 'enrichment', status: 'operational', notes: 'HEU storage and processing, Oak Ridge TN' },
  { layerType: 'nuclear', name: 'Bangor SSBN Base', country: 'USA', lat: 47.74, lng: -122.71, type: 'storage', status: 'operational', notes: 'Trident SSBN home port — ~1,300 warheads' },

  // Russia
  { layerType: 'nuclear', name: 'Severomorsk Naval Base', country: 'Russia', lat: 69.07, lng: 33.42, type: 'storage', status: 'operational', notes: 'Northern Fleet SSBN base' },
  { layerType: 'nuclear', name: 'Dombarovsky ICBM Base', country: 'Russia', lat: 50.78, lng: 59.45, type: 'storage', status: 'operational', notes: 'RS-28 Sarmat (Satan-2) silo field' },
  { layerType: 'nuclear', name: 'Ozersk (Chelyabinsk-65)', country: 'Russia', lat: 55.76, lng: 60.71, type: 'enrichment', status: 'operational', notes: 'Major plutonium production complex' },
  { layerType: 'nuclear', name: 'Saratov Oblast ICBM Fields', country: 'Russia', lat: 51.5, lng: 46.0, type: 'storage', status: 'operational', notes: 'ICBM deployment zone, Volga region' },

  // China
  { layerType: 'nuclear', name: 'Jilantai Training Area', country: 'China', lat: 39.28, lng: 105.78, type: 'storage', status: 'operational', notes: 'Known nuclear storage & training site' },
  { layerType: 'nuclear', name: 'Yumen ICBM Silo Field', country: 'China', lat: 40.5, lng: 96.8, type: 'storage', status: 'under-construction', notes: '~120 new DF-41 ICBM silos identified by satellite' },
  { layerType: 'nuclear', name: 'Ordos DF-41 Silo Field', country: 'China', lat: 39.8, lng: 109.8, type: 'storage', status: 'under-construction', notes: 'Second silo expansion area under construction' },

  // United Kingdom
  { layerType: 'nuclear', name: 'RNAD Coulport', country: 'UK', lat: 56.05, lng: -4.86, type: 'storage', status: 'operational', warheads: 225, notes: 'UK Trident warhead storage' },
  { layerType: 'nuclear', name: 'AWE Aldermaston', country: 'UK', lat: 51.38, lng: -1.21, type: 'research', status: 'operational', notes: 'UK nuclear weapons design & production' },

  // France
  { layerType: 'nuclear', name: 'Île Longue SSBN Base', country: 'France', lat: 48.32, lng: -4.42, type: 'storage', status: 'operational', warheads: 290, notes: 'French SSBN home port, Brest' },
  { layerType: 'nuclear', name: 'Valduc Nuclear Center', country: 'France', lat: 47.42, lng: 4.95, type: 'research', status: 'operational', notes: 'French warhead design and maintenance' },

  // Pakistan
  { layerType: 'nuclear', name: 'Khushab Plutonium Complex', country: 'Pakistan', lat: 32.07, lng: 72.19, type: 'enrichment', status: 'operational', warheads: 170, notes: '4 heavy-water reactors for Pu production' },
  { layerType: 'nuclear', name: 'Kahuta Enrichment Plant (KRL)', country: 'Pakistan', lat: 33.65, lng: 73.40, type: 'enrichment', status: 'operational', notes: 'Khan Research Laboratories — HEU production' },

  // India
  { layerType: 'nuclear', name: 'Bhabha Atomic Research Centre', country: 'India', lat: 19.02, lng: 72.92, type: 'research', status: 'operational', warheads: 164, notes: 'Primary Indian nuclear R&D and weapons design' },
  { layerType: 'nuclear', name: 'Rattehalli Rare Materials Plant', country: 'India', lat: 13.0, lng: 75.5, type: 'enrichment', status: 'operational', notes: 'Weapons-grade plutonium separation facility' },

  // North Korea
  { layerType: 'nuclear', name: 'Yongbyon Nuclear Complex', country: 'North Korea', lat: 39.79, lng: 125.75, type: 'enrichment', status: 'operational', warheads: 50, notes: 'Primary DPRK enrichment & reactor; actively operating' },
  { layerType: 'nuclear', name: 'Punggye-ri Test Site', country: 'North Korea', lat: 41.27, lng: 129.08, type: 'research', status: 'operational', notes: 'Underground nuclear test tunnels — reportedly re-activated' },

  // Iran
  { layerType: 'nuclear', name: 'Fordow Enrichment Plant', country: 'Iran', lat: 34.88, lng: 50.98, type: 'enrichment', status: 'operational', notes: 'Underground; 60% U-235 enrichment; JCPOA violations' },
  { layerType: 'nuclear', name: 'Natanz Enrichment Facility', country: 'Iran', lat: 33.72, lng: 51.73, type: 'enrichment', status: 'operational', notes: 'Main Iranian enrichment site; sabotaged multiple times' },
];

// ── Naval Vessels ─────────────────────────────────────────────────────
// Known carrier strike group / warship positions — approximate, early 2026
// Update manually when deployments change significantly
export const NAVAL_VESSELS: NavalVessel[] = [
  // US Carrier Strike Groups
  { layerType: 'naval', name: 'USS Harry S. Truman (CVN-75)', country: 'USA', lat: 36.5, lng: 25.0, type: 'carrier', class: 'Nimitz-class', status: 'Deployed — Eastern Mediterranean' },
  { layerType: 'naval', name: 'USS Carl Vinson (CVN-70)', country: 'USA', lat: 20.0, lng: 115.0, type: 'carrier', class: 'Nimitz-class', status: 'Deployed — South China Sea' },
  { layerType: 'naval', name: 'USS Abraham Lincoln (CVN-72)', country: 'USA', lat: 22.5, lng: 59.5, type: 'carrier', class: 'Nimitz-class', status: 'Deployed — Arabian Sea / 5th Fleet' },
  { layerType: 'naval', name: 'USS Theodore Roosevelt (CVN-71)', country: 'USA', lat: 13.5, lng: 144.8, type: 'carrier', class: 'Nimitz-class', status: 'Western Pacific — Yokosuka-based' },

  // US Destroyers — Red Sea ops
  { layerType: 'naval', name: 'USS Cole (DDG-67)', country: 'USA', lat: 12.8, lng: 43.5, type: 'destroyer', class: 'Arleigh Burke-class', status: 'Red Sea — counter-Houthi operations' },
  { layerType: 'naval', name: 'USS Gravely (DDG-107)', country: 'USA', lat: 14.5, lng: 42.0, type: 'destroyer', class: 'Arleigh Burke-class', status: 'Red Sea — counter-Houthi operations' },

  // Russia
  { layerType: 'naval', name: 'RFS Admiral Gorshkov', country: 'Russia', lat: 69.3, lng: 33.0, type: 'frigate', class: 'Gorshkov-class', status: 'Northern Fleet — Severomorsk' },
  { layerType: 'naval', name: 'RFS Krasnodar (B-265)', country: 'Russia', lat: 43.1, lng: 30.5, type: 'submarine', class: 'Improved Kilo-class', status: 'Black Sea Fleet' },

  // China
  { layerType: 'naval', name: 'CNS Liaoning (CV-16)', country: 'China', lat: 22.3, lng: 114.2, type: 'carrier', class: 'Type 001', status: 'South China Sea exercises' },
  { layerType: 'naval', name: 'CNS Shandong (CV-17)', country: 'China', lat: 20.0, lng: 121.5, type: 'carrier', class: 'Type 001A', status: 'Western Pacific — Taiwan Strait ops' },
  { layerType: 'naval', name: 'CNS Nanchang (DDG-173)', country: 'China', lat: 18.5, lng: 110.3, type: 'destroyer', class: 'Type 055 Renhai-class', status: 'South China Sea — CSG escort' },

  // United Kingdom
  { layerType: 'naval', name: 'HMS Prince of Wales (R09)', country: 'UK', lat: 50.8, lng: -1.1, type: 'carrier', class: 'Queen Elizabeth-class', status: 'Portsmouth — workup before deployment' },

  // France
  { layerType: 'naval', name: 'FS Charles de Gaulle (R91)', country: 'France', lat: 43.1, lng: 5.9, type: 'carrier', class: 'Charles de Gaulle-class', status: 'Toulon — maintenance / standby' },
];
