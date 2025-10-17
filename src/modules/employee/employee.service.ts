import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errorHandler';
import { HTTP_STATUS } from '../../shared/constants/statusCodes';
import { getPaginationParams, getPaginationMeta } from '../../utils/pagination';
import { 
  GetAllEmployeesParams, 
  PaginatedEmployeesResponse,
  EmployeeWithDepartment 
} from './employee.types';
import { CreateEmployeeDto, UpdateEmployeeDto } from './employee.dto';
import bcrypt from 'bcrypt';

export class EmployeeService {
  // Get all employees
  async getAll(params: GetAllEmployeesParams): Promise<PaginatedEmployeesResponse> {
    const { page, limit, search, departmentId, isActive } = params;
    const { skip, take } = getPaginationParams(page, limit);

    const where: any = {};

    if (departmentId) {
      where.department_id = departmentId;
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employee_number: { contains: search, mode: 'insensitive' } }
      ];
    }

    const total = await prisma.employees.count({ where });

    const employees = await prisma.employees.findMany({
      where,
      skip,
      take,
      orderBy: { full_name: 'asc' },
      select: {
        id: true,
        employee_number: true,
        full_name: true,
        email: true,
        position: true,
        avatar_url: true,
        is_active: true,
        department_id: true,
        departments: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      data: employees,
      meta: getPaginationMeta(page, limit, total)
    };
  }

  // Get employee by ID
  async getById(id: string): Promise<EmployeeWithDepartment> {
    const employee = await prisma.employees.findUnique({
      where: { id },
      select: {
        id: true,
        employee_number: true,
        full_name: true,
        email: true,
        position: true,
        avatar_url: true,
        is_active: true,
        department_id: true,
        created_at: true,
        updated_at: true,
        departments: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!employee) {
      throw new AppError('Employee not found', HTTP_STATUS.NOT_FOUND);
    }

    return employee;
  }

  // Get employees by department
  async getByDepartment(departmentId: string): Promise<EmployeeWithDepartment[]> {
    return prisma.employees.findMany({
      where: { department_id: departmentId },
      orderBy: { full_name: 'asc' },
      select: {
        id: true,
        employee_number: true,
        full_name: true,
        email: true,
        position: true,
        avatar_url: true,
        is_active: true,
        department_id: true,
        departments: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  // Create employee
  async create(data: CreateEmployeeDto): Promise<EmployeeWithDepartment> {
    // Check if employee_number already exists
    const existing = await prisma.employees.findUnique({
      where: { employee_number: data.employee_number }
    });

    if (existing) {
      throw new AppError('Employee number already exists', HTTP_STATUS.CONFLICT);
    }

    // Check if email already exists
    if (data.email) {
      const existingEmail = await prisma.employees.findUnique({
        where: { email: data.email }
      });

      if (existingEmail) {
        throw new AppError('Email already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    const employee = await prisma.employees.create({
      data: {
        employee_number: data.employee_number,
        full_name: data.full_name,
        department_id: data.department_id,
        email: data.email,
        password: hashedPassword,
        position: data.position,
        avatar_url: data.avatar_url,
        is_active: data.is_active ?? true
      },
      select: {
        id: true,
        employee_number: true,
        full_name: true,
        email: true,
        position: true,
        avatar_url: true,
        is_active: true,
        department_id: true,
        departments: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return employee;
  }

  // Update employee
  async update(id: string, data: UpdateEmployeeDto): Promise<EmployeeWithDepartment> {
    const existing = await prisma.employees.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Employee not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if employee_number already exists (if updating)
    if (data.employee_number && data.employee_number !== existing.employee_number) {
      const existingNumber = await prisma.employees.findUnique({
        where: { employee_number: data.employee_number }
      });

      if (existingNumber) {
        throw new AppError('Employee number already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // Check if email already exists (if updating)
    if (data.email && data.email !== existing.email) {
      const existingEmail = await prisma.employees.findUnique({
        where: { email: data.email }
      });

      if (existingEmail) {
        throw new AppError('Email already exists', HTTP_STATUS.CONFLICT);
      }
    }

    let hashedPassword: string | undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    const updateData: any = {
      employee_number: data.employee_number,
      full_name: data.full_name,
      department_id: data.department_id,
      email: data.email,
      position: data.position,
      avatar_url: data.avatar_url,
      is_active: data.is_active
    };

    if (hashedPassword) {
      updateData.password = hashedPassword;
    }

    const employee = await prisma.employees.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        employee_number: true,
        full_name: true,
        email: true,
        position: true,
        avatar_url: true,
        is_active: true,
        department_id: true,
        departments: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return employee;
  }

  // Delete employee
  async delete(id: string): Promise<void> {
    const existing = await prisma.employees.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Employee not found', HTTP_STATUS.NOT_FOUND);
    }

    const announcementCount = await prisma.announcements.count({
      where: { created_by: id }
    });

    if (announcementCount > 0) {
      throw new AppError(
        `Cannot delete employee with ${announcementCount} announcement(s). Please reassign or delete announcements first.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.employees.delete({ where: { id } });
  }
}