import { Department, Semester } from './DepartmentModel';
import { Student } from './StudentModel';

export interface FeeStructure {
  fee_structure_id: number;
  department: number | Department;
  semester: number | Semester;
  total_fee: number;
  created_at: string;
  updated_at: string;
}

export interface FeeBalance {
  id: number;
  student: number | Student;
  fee_structure: number | FeeStructure;
  total_fee: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Payment {
  id: number;
  student: number | Student;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id?: string;
}
