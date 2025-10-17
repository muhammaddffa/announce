export interface CreateDepartmentDto {
  name: string;
}

export interface UpdateDepartmentDto {
  name: string;
}

export interface DepartmentResponseDto {
  id: string;
  name: string;
  created_at: Date | null;
  updated_at: Date | null;
  _count?: {
    employees: number;
  };
}