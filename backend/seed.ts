import mongoose from 'mongoose';
import Incident from './models/Incident.ts';
import Building from './models/Building.ts';
import Shelter from './models/Shelter.ts';
import Alert from './models/Alert.ts';

/**
 * Seed script for populating RESQ-AI database with test data
 * Run: tsx seed.ts
 */

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/resq-ai';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Incident.deleteMany({});
    await Building.deleteMany({});
    await Shelter.deleteMany({});
    await Alert.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create incidents
    const incidents = await Incident.insertMany([
      {
        incidentId: 'INC-FLOOD-001',
        title: 'Sector 4 Flash Flood & Embankment Breach',
        hazardType: 'FLOOD',
        severity: 'LEVEL_4_CRITICAL',
        location: {
          latitude: 17.3850,
          longitude: 78.4867,
          sector: 'Sector 4',
          district: 'Hyderabad Demo',
          state: 'Telangana'
        },
        status: 'ACTIVE',
        exposedPopulation: 8420,
        vulnerableCount: 1840,
        affectedBuildings: 482,
        trappedCount: 38,
        startTime: new Date()
      },
      {
        incidentId: 'INC-LANDSLIDE-002',
        title: 'Giri Ridge Hillslope Instability',
        hazardType: 'LANDSLIDE',
        severity: 'LEVEL_3_HIGH',
        location: {
          latitude: 17.3900,
          longitude: 78.4800,
          sector: 'Giri Ridge',
          district: 'Hyderabad Demo',
          state: 'Telangana'
        },
        status: 'ACTIVE',
        exposedPopulation: 2100,
        vulnerableCount: 450,
        affectedBuildings: 28,
        trappedCount: 12,
        startTime: new Date()
      }
    ]);
    console.log(`✅ Created ${incidents.length} incidents`);

    // Create buildings
    const buildings = await Building.insertMany([
      {
        buildingId: 'B-404',
        name: 'Surya Low-Income Housing Cluster',
        buildingType: 'RESIDENTIAL',
        floors: 4,
        occupants: 285,
        vulnerabilityScore: 85,
        location: {
          latitude: 17.3840,
          longitude: 78.4860,
          address: 'Ward 8, Sector 4',
          sector: 'Sector 4'
        },
        hazardZone: 'RED',
        evacuationStatus: 'EVACUATING',
        rescueNeeded: true,
        trappedPersons: 15,
        structuralDamage: 'MODERATE'
      },
      {
        buildingId: 'B-402',
        name: 'Government Primary School & Anganwadi',
        buildingType: 'INSTITUTIONAL',
        floors: 2,
        occupants: 80,
        vulnerabilityScore: 72,
        location: {
          latitude: 17.3860,
          longitude: 78.4870,
          address: 'Central Ward, Sector 4',
          sector: 'Sector 4'
        },
        hazardZone: 'RED',
        evacuationStatus: 'EVACUATING',
        rescueNeeded: true,
        trappedPersons: 8,
        structuralDamage: 'MINOR'
      },
      {
        buildingId: 'B-409',
        name: 'Shree Sai Multi-Story Complex',
        buildingType: 'RESIDENTIAL',
        floors: 12,
        occupants: 420,
        vulnerabilityScore: 92,
        location: {
          latitude: 17.3870,
          longitude: 78.4850,
          address: 'North Extension, Sector 4',
          sector: 'Sector 4'
        },
        hazardZone: 'RED',
        evacuationStatus: 'EVACUATING',
        rescueNeeded: true,
        trappedPersons: 15,
        structuralDamage: 'COLLAPSED'
      },
      {
        buildingId: 'B-405',
        name: 'Giri Ridge Tribal Settlement',
        buildingType: 'RESIDENTIAL',
        floors: 1,
        occupants: 150,
        vulnerabilityScore: 78,
        location: {
          latitude: 17.3920,
          longitude: 78.4810,
          address: 'Giri Ridge Hamlet',
          sector: 'Giri Ridge'
        },
        hazardZone: 'ORANGE',
        evacuationStatus: 'WARNING',
        rescueNeeded: false,
        trappedPersons: 0,
        structuralDamage: 'NONE'
      }
    ]);
    console.log(`✅ Created ${buildings.length} buildings`);

    // Create shelters
    const shelters = await Shelter.insertMany([
      {
        shelterId: 'SH-01',
        name: 'North Highland Shelter',
        location: {
          latitude: 17.3890,
          longitude: 78.4900,
          address: 'North Highland Community Center',
          sector: 'Sector 4'
        },
        capacity: 1500,
        currentOccupancy: 840,
        foodStock: 8,
        waterStock: 18500,
        medicalBeds: 35,
        status: 'PARTIAL',
        manager: 'Mr. Raj Kumar',
        contactPhone: '+91-9876543210'
      },
      {
        shelterId: 'SH-02',
        name: 'East District Stadium',
        location: {
          latitude: 17.3800,
          longitude: 78.4950,
          address: 'East Ward Sports Complex',
          sector: 'Sector 4'
        },
        capacity: 2200,
        currentOccupancy: 1120,
        foodStock: 12,
        waterStock: 40000,
        medicalBeds: 60,
        status: 'PARTIAL',
        manager: 'Ms. Priya Singh',
        contactPhone: '+91-9876543211'
      },
      {
        shelterId: 'SH-03',
        name: 'Central Community Hall',
        location: {
          latitude: 17.3850,
          longitude: 78.4920,
          address: 'Central Ward Hall',
          sector: 'Sector 4'
        },
        capacity: 800,
        currentOccupancy: 740,
        foodStock: 6,
        waterStock: 12000,
        medicalBeds: 20,
        status: 'FULL',
        manager: 'Mr. Vikram Patel',
        contactPhone: '+91-9876543212'
      },
      {
        shelterId: 'SH-04',
        name: 'Giri Ridge Relief Center',
        location: {
          latitude: 17.3930,
          longitude: 78.4820,
          address: 'Giri Ridge Admin Block',
          sector: 'Giri Ridge'
        },
        capacity: 600,
        currentOccupancy: 210,
        foodStock: 10,
        waterStock: 15000,
        medicalBeds: 25,
        status: 'READY',
        manager: 'Mr. Arjun Das',
        contactPhone: '+91-9876543213'
      }
    ]);
    console.log(`✅ Created ${shelters.length} shelters`);

    // Create alerts
    const alerts = await Alert.insertMany([
      {
        alertId: 'ALT-001',
        incidentId: 'INC-FLOOD-001',
        title: 'EVACUATION ALERT - Sector 4 Flood',
        message: 'Mandatory immediate evacuation of Surya Housing Colony and surrounding areas. Move to North Highland Shelter or East Stadium.',
        severity: 'CRITICAL',
        alertType: 'EVACUATION',
        channels: ['SMS', 'PUSH', 'BROWSER', 'SACHET_CAP'],
        targetArea: {
          radiusKm: 1.8,
          latitude: 17.3850,
          longitude: 78.4867,
          sectors: ['Sector 4']
        },
        estimatedAudience: 8420,
        deliverySuccessRate: 98.4,
        status: 'DISPATCHED',
        createdBy: 'CMD-SYSTEM',
        createdAt: new Date(),
        dispatchedAt: new Date(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
      },
      {
        alertId: 'ALT-002',
        incidentId: 'INC-FLOOD-001',
        title: 'STAGE-3 PUBLIC WARNING',
        message: 'River levels rising rapidly. All low-lying areas must evacuate immediately. Follow official evacuation routes.',
        severity: 'CRITICAL',
        alertType: 'WARNING',
        channels: ['SMS', 'PUSH', 'SACHET_CAP', 'RADIO'],
        targetArea: {
          radiusKm: 3.0,
          latitude: 17.3850,
          longitude: 78.4867
        },
        estimatedAudience: 25000,
        deliverySuccessRate: 97.2,
        status: 'DISPATCHED',
        createdBy: 'CMD-SYSTEM',
        createdAt: new Date(),
        dispatchedAt: new Date(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
      }
    ]);
    console.log(`✅ Created ${alerts.length} alerts`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log(`
📊 Summary:
  - Incidents: ${incidents.length}
  - Buildings: ${buildings.length}
  - Shelters: ${shelters.length}
  - Alerts: ${alerts.length}
  
🎯 Test URLs:
  - GET  http://localhost:3000/api/health
  - GET  http://localhost:3000/api/incidents
  - GET  http://localhost:3000/api/buildings/gis/boundaries
  - GET  http://localhost:3000/api/shelters/report/capacity
  - GET  http://localhost:3000/api/alerts
    `);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedData();
