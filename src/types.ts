
export enum UserRole {
  CLIENT = 'CLIENT',
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  category: string;
  address: string;
  logo: string;
  rating: number;
}

export interface Employee {
  id: string;
  businessId: string;
  userId?: string;
  name: string;
  role: string;
  avatar: string;
  timeslots?: TimeSlot[];
}

export interface EmployeeLink {
  id: string;
  business_id: string;
  business_name: string;
}

export interface TimeSlot {
  id: string;
  employee_id: string;
  business_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  booked_by?: string | null;
}

export interface Appointment {
  id: string;
  slotId: string;
  clientId: string;
  businessId: string;
  employeeId: string;
  serviceId?: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  cancellationReason?: string | null;
  createdAt: string;
}

export interface AppointmentWithRelations {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  cancellation_reason: string | null;
  created_at: string;
  slot: { start_time: string; end_time: string };
  business: { id: string; name: string; logo: string };
  employee: { name: string; role: string };
  service: { name: string; price: string; duration: number } | null;
}

export interface Favorite {
  id: string;
  client_id: string;
  business_id: string;
  created_at: string;
  business?: {
    id: string;
    name: string;
    description: string;
    category: string;
    address: string;
    logo: string;
    rating: number;
  };
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  duration: number; // in minutes
  price: string;
  description?: string;
}
