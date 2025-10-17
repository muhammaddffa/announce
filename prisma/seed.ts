import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create departments
  const engineeringDept = await prisma.departments.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: {
      name: 'Engineering'
    }
  });

  const uiuxDept = await prisma.departments.upsert({
    where: { name: 'UI/UX Design' },
    update: {},
    create: {
      name: 'UI/UX Design'
    }
  });

  const hrDept = await prisma.departments.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: {
      name: 'Human Resources'
    }
  });

  console.log('✅ Departments created');

  // Hash password
  const defaultPassword = await bcrypt.hash('password123', 10);

  // Create employees
  const john = await prisma.employees.upsert({
    where: { email: 'john.doe@company.com' },
    update: {},
    create: {
      employee_number: 'EMP001',
      full_name: 'John Doe',
      email: 'john.doe@company.com',
      password: defaultPassword,
      position: 'UI UX Super Admin',
      department_id: uiuxDept.id,
      is_active: true
    }
  });

  const jane = await prisma.employees.upsert({
    where: { email: 'jane.smith@company.com' },
    update: {},
    create: {
      employee_number: 'EMP002',
      full_name: 'Jane Smith',
      email: 'jane.smith@company.com',
      password: defaultPassword,
      position: 'Senior Software Engineer',
      department_id: engineeringDept.id,
      is_active: true
    }
  });

  const mike = await prisma.employees.upsert({
    where: { email: 'mike.johnson@company.com' },
    update: {},
    create: {
      employee_number: 'EMP003',
      full_name: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      password: defaultPassword,
      position: 'HR Manager',
      department_id: hrDept.id,
      is_active: true
    }
  });

  console.log('✅ Employees created');
  console.log('');
  console.log('📝 Test Credentials:');
  console.log('-----------------------------------');
  console.log('Email: john.doe@company.com');
  console.log('Password: password123');
  console.log('-----------------------------------');
  console.log('Email: jane.smith@company.com');
  console.log('Password: password123');
  console.log('-----------------------------------');
  console.log('Email: mike.johnson@company.com');
  console.log('Password: password123');
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });