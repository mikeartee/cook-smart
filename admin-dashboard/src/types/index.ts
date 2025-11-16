export interface Admin {
  id: number;
  email: string;
  username: string;
  name?: string;
  is_super_admin: boolean;
  last_login?: string;
  email_verified: boolean;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  admin: Admin;
}

export interface ApprovedEmail {
  id: number;
  email: string;
  is_super_admin: boolean;
  approved_by?: string;
  notes?: string;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  admin_id?: number;
  admin_email?: string;
  username?: string;
  action_type: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  created_at: string;
}
