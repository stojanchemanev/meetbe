
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
  name: string;
  role: string;
  avatar: string;
  timeslots?: TimeSlot[];
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
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  duration: number; // in minutes
  price: string;
  description?: string;
}
