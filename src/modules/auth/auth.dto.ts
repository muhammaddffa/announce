export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  employee_number: string;
  full_name: string;
  email: string;
  password: string;
  department_id?: string;
  position?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    employee_number: string;
    full_name: string;
    email: string;
    position: string | null;
    department_id: string | null;
  };
  token: string;
}