export interface EmployeeDepartment {
  id: string;
  name: string;
}

export interface EmployeeWithDepartment {
  id: string;
  nik: string;
  full_name: string;
  email: string | null;
  position: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  department_id: string | null;
  departments?: EmployeeDepartment | null;
}

export interface GetAllEmployeesParams {
  page: number;
  limit: number;
  search?: string;
  departmentId?: string;
  isActive?: boolean;
}

export interface PaginatedEmployeesResponse {
  data: EmployeeWithDepartment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
}