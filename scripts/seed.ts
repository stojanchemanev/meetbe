import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface Business {
  id?: string;
  owner_id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  logo: string;
  rating: number;
}

interface Employee {
  business_id: string;
  name: string;
  role: string;
  avatar: string;
}

interface Service {
  business_id: string;
  name: string;
  duration: number;
  price: string;
  description: string;
}

const sampleBusinesses: Business[] = [
  {
    owner_id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Elite Hair Studio',
    description: 'Premium hair styling and coloring salon',
    category: 'Beauty & Wellness',
    address: '123 Main Street, Downtown',
    logo: 'https://images.unsplash.com/photo-1596464716127-f2a82ad5d27f?w=300',
    rating: 4.8,
  },
  {
    owner_id: '223e4567-e89b-12d3-a456-426614174001',
    name: 'Fit Body Gym',
    description: 'State-of-the-art fitness center',
    category: 'Fitness',
    address: '456 Fitness Ave, Midtown',
    logo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300',
    rating: 4.6,
  },
  {
    owner_id: '323e4567-e89b-12d3-a456-426614174002',
    name: 'Zen Yoga Studio',
    description: 'Relaxing yoga and meditation classes',
    category: 'Wellness',
    address: '789 Peace Road, Uptown',
    logo: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=300',
    rating: 4.9,
  },
];

const sampleEmployees: Employee[] = [
  {
    business_id: '', // Will be set after businesses are created
    name: 'Sarah Johnson',
    role: 'Senior Stylist',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
  },
  {
    business_id: '',
    name: 'Mike Chen',
    role: 'Head Trainer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
  },
  {
    business_id: '',
    name: 'Emma Wilson',
    role: 'Yoga Instructor',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
  },
];

const sampleServices: Service[] = [
  {
    business_id: '',
    name: 'Hair Cut',
    duration: 30,
    price: '$45',
    description: 'Professional haircut with styling',
  },
  {
    business_id: '',
    name: 'Hair Coloring',
    duration: 90,
    price: '$120',
    description: 'Full hair coloring service',
  },
  {
    business_id: '',
    name: 'Personal Training Session',
    duration: 60,
    price: '$75',
    description: '1-on-1 personal training',
  },
  {
    business_id: '',
    name: 'Group Fitness Class',
    duration: 45,
    price: '$25',
    description: 'Group fitness class with trainer',
  },
  {
    business_id: '',
    name: 'Hatha Yoga Class',
    duration: 60,
    price: '$20',
    description: 'Traditional Hatha yoga practice',
  },
  {
    business_id: '',
    name: 'Meditation Session',
    duration: 45,
    price: '$15',
    description: 'Guided meditation session',
  },
];

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Delete existing data (optional, for clean seeding)
    console.log('Clearing existing data...');
    await supabase.from('services').delete().neq('id', '');
    await supabase.from('employees').delete().neq('id', '');
    await supabase.from('businesses').delete().neq('id', '');

    // Insert businesses
    console.log('Adding businesses...');
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .insert(sampleBusinesses)
      .select();

    if (businessError) {
      throw new Error(`Failed to insert businesses: ${businessError.message}`);
    }

    console.log(`✅ Added ${businessData?.length || 0} businesses`);

    // Insert employees
    console.log('Adding employees...');
    const employeesToInsert = [
      { ...sampleEmployees[0], business_id: businessData[0].id },
      { ...sampleEmployees[1], business_id: businessData[1].id },
      { ...sampleEmployees[2], business_id: businessData[2].id },
    ];

    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .insert(employeesToInsert)
      .select();

    if (employeeError) {
      throw new Error(`Failed to insert employees: ${employeeError.message}`);
    }

    console.log(`✅ Added ${employeeData?.length || 0} employees`);

    // Insert services
    console.log('Adding services...');
    const servicesToInsert = [
      { ...sampleServices[0], business_id: businessData[0].id },
      { ...sampleServices[1], business_id: businessData[0].id },
      { ...sampleServices[2], business_id: businessData[1].id },
      { ...sampleServices[3], business_id: businessData[1].id },
      { ...sampleServices[4], business_id: businessData[2].id },
      { ...sampleServices[5], business_id: businessData[2].id },
    ];

    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .insert(servicesToInsert)
      .select();

    if (serviceError) {
      throw new Error(`Failed to insert services: ${serviceError.message}`);
    }

    console.log(`✅ Added ${serviceData?.length || 0} services`);

    console.log('✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
