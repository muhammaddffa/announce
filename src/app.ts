import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import announcementRoutes from './modules/announcements/announcement.route';
import authRoutes from './modules/auth/auth.route';
import departmentRoutes from './modules/departments/department.route';
import employeeRoutes from './modules/employee/employee.route';
import uploadRoutes from './modules/upload/upload.route';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use('/api/announcements', announcementRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes); 
app.use('/uploads', express.static('uploads'));
app.use('/api/upload', uploadRoutes); 

app.use(errorHandler);


app.get("/", (req, res) => {
  res.status(200).json({ message: "Awesome it works 🐻" });
});


export default app;