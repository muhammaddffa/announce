export interface CreateEmployeeDto {
  employee_number: string;
  full_name: string;
  department_id?: string;
  email?: string;
  password?: string;
  position?: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface UpdateEmployeeDto {
  employee_number?: string;
  full_name?: string;
  department_id?: string;
  email?: string;
  password?: string;
  position?: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface EmployeeResponseDto {
  id: string;
  employee_number: string;
  full_name: string;
  email: string | null;
  position: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  department_id: string | null;
  departments?: {
    id: string;
    name: string;
  } | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface GetAllEmployeesQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  isActive?: boolean;
}