export type Role = "platform_admin" | "company_admin" | "staff";

export interface CompanyBrief {
  id: number;
  name: string;
  status?: string;
  phone?: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_platform_admin: boolean;
  company: CompanyBrief | null;
}

export type JobStatus =
  | "recruiting"
  | "closed"
  | "contracted"
  | "completed"
  | "cancelled";

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  contact_note: string | null;
}

export interface Job {
  id: number;
  status: JobStatus;
  company?: CompanyBrief;
  is_owner: boolean;
  moving_date: string | null;
  time_slot: string | null;
  from_prefecture: string;
  from_city: string | null;
  to_prefecture: string;
  to_city: string | null;
  building_type: string;
  layout: string | null;
  luggage_volume: string;
  truck_size: string | null;
  worker_count: number | null;
  floors: string | null;
  has_elevator: boolean | null;
  desired_price: number | null;
  note: string | null;
  application_deadline: string | null;
  applications_count?: number;
  has_applied?: boolean;
  is_winner?: boolean;
  created_at?: string;
  attachments?: Attachment[];
  customer?: CustomerInfo;
}

export interface Attachment {
  id: number;
  name: string;
  mime: string;
  is_image: boolean;
  url: string;
}

export type ApplicationStatus = "applied" | "accepted" | "rejected";

export interface Application {
  id: number;
  status: ApplicationStatus;
  message: string | null;
  created_at: string;
  company?: CompanyBrief;
  applicant?: { id: number; name: string };
  job?: Job;
}

export interface DashboardStats {
  recruiting: number;
  my_posted: number;
  my_applications: number;
  my_contracted: number;
}

export interface Paginated<T> {
  data: T[];
  meta?: { total: number; current_page: number; last_page: number };
}
