export interface DepartmentWithEmployees {
  id: string;
  name: string;
  created_at: Date | null;
  updated_at: Date | null;
  employees: Array<{
    id: string;
    employee_number: string;
    full_name: string;
    email: string | null;
    position: string | null;
    avatar_url: string | null;
  }>;
}

export interface DepartmentWithCount {
  id: string;
  name: string;
  created_at: Date | null;
  _count: {
    employees: number;
  };
}