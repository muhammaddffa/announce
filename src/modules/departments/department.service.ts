import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errorHandler';
import { HTTP_STATUS } from '../../shared/constants/statusCodes';

export class DepartmentService {
  // Get all departments
  async getAll() {
    const departments = await prisma.departments.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        created_at: true,
        _count: {
          select: {
            employees: true // Count employees in department
          }
        }
      }
    });

    return departments;
  }

  // Get department by ID
  async getById(id: string) {
    const department = await prisma.departments.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employee_number: true,
            full_name: true,
            email: true,
            position: true,
            avatar_url: true
          }
        }
      }
    });

    if (!department) {
      throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
    }

    return department;
  }

  // Create department
  async create(data: { name: string }) {
    const existing = await prisma.departments.findFirst({
      where: { name: data.name }
    });

    if (existing) {
      throw new AppError('Department already exists', HTTP_STATUS.CONFLICT);
    }

    return prisma.departments.create({
      data: {
        name: data.name
      }
    });
  }

  // Update department
  async update(id: string, data: { name: string }) {
    const existing = await prisma.departments.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
    }

    return prisma.departments.update({
      where: { id },
      data: { name: data.name }
    });
  }

  // Delete department
  async delete(id: string) {
    const existing = await prisma.departments.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if has employees
    const employeeCount = await prisma.employees.count({
      where: { department_id: id }
    });

    if (employeeCount > 0) {
      throw new AppError(
        `Cannot delete department with ${employeeCount} employee(s)`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await prisma.departments.delete({ where: { id } });
  }
}