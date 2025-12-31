import { Request, Response } from 'express';
import { EmployeeService } from '../../services/employee.service';

const employeeService = new EmployeeService();

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let employees;
    
    if (search) {
      employees = await employeeService.searchEmployees(search as string);
    } else {
      employees = await employeeService.getAllEmployees();
    }
    
    // If empty list, just return it. Don't return 404 with "Employee not found".
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployee = async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;
    const employee = await employeeService.getEmployeeByDni(dni);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user?.username || 'SYSTEM';
    const employee = await employeeService.createEmployee(req.body, user);
    res.status(201).json(employee);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;
    const user = (req as any).user?.username || 'SYSTEM';
    const employee = await employeeService.updateEmployee(dni, req.body, user);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;
    const success = await employeeService.deleteEmployee(dni);
    
    if (!success) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
