import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../../utils/errorHandler';
import { HTTP_STATUS } from '../../shared/constants/statusCodes';

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  employee_number: string;
  full_name: string;
  email: string;
  password: string;
  department_id?: string;
  position?: string;
}

export class AuthService {
  private generateToken(payload: any): string {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  const secret = process.env.JWT_SECRET;
  const expiresIn = '7d';

  return jwt.sign(payload, secret, { expiresIn });
}

  async register(data: RegisterDto) {
    // Check if email already exists
    const existingEmail = await prisma.employees.findUnique({
      where: { email: data.email }
    });

    if (existingEmail) {
      throw new AppError('Email already registered', HTTP_STATUS.CONFLICT);
    }

    const existingEmployeeNumber = await prisma.employees.findUnique({
      where: { employee_number: data.employee_number }
    });

    if (existingEmployeeNumber) {
      throw new AppError('Employee number already exists', HTTP_STATUS.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create employee
    const employee = await prisma.employees.create({
      data: {
        employee_number: data.employee_number,
        full_name: data.full_name,
        email: data.email,
        password: hashedPassword,
        department_id: data.department_id,
        position: data.position,
        is_active: true
      },
      select: {
        id: true,
        employee_number: true,
        full_name: true,
        email: true,
        position: true,
        department_id: true,
        departments: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Generate token
    const token = this.generateToken({
      id: employee.id,
      email: employee.email,
      employeeNumber: employee.employee_number
    });

    return {
      user: employee,
      token
    };
  }

  async login(data: LoginDto) {
    // Find employee by email
    const employee = await prisma.employees.findUnique({
      where: { email: data.email },
      include: {
        departments: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!employee) {
      throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if password exists
    if (!employee.password) {
      throw new AppError('Password not set for this account', HTTP_STATUS.BAD_REQUEST);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, employee.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if account is active
    if (!employee.is_active) {
      throw new AppError('Account is inactive', HTTP_STATUS.FORBIDDEN);
    }

    // Generate token
    const token = this.generateToken({
      id: employee.id,
      email: employee.email,
      employeeNumber: employee.employee_number
    });

    // Remove password from response
    const { password, ...employeeWithoutPassword } = employee;

    return {
      user: employeeWithoutPassword,
      token
    };
  }

  async getProfile(userId: string) {
    const employee = await prisma.employees.findUnique({
      where: { id: userId },
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
        },
        created_at: true
      }
    });

    if (!employee) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    return employee;
  }

  verifyToken(token: string) {
    if (!process.env.JWT_SECRET) {
      throw new AppError('JWT_SECRET not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expired', HTTP_STATUS.UNAUTHORIZED);
      }
      throw new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED);
    }
  }
}