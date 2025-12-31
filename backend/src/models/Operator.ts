import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface OperatorAttributes {
  id: number;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  hireDate?: Date;
  status: 'active' | 'inactive' | 'on_leave';
  skills: string[];
  certifications: string[];
  licenseNumber?: string;
  licenseExpiry?: Date;
  emergencyContact?: string;
  emergencyPhone?: string;
  photoUrl?: string;
  hourlyRate?: number;
  performanceRating?: number;
  totalHoursWorked?: number;
  projectsCompleted?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OperatorCreationAttributes extends Optional<OperatorAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Operator extends Model<OperatorAttributes, OperatorCreationAttributes> implements OperatorAttributes {
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public documentType!: string;
  public documentNumber!: string;
  public email?: string;
  public phone?: string;
  public address?: string;
  public dateOfBirth?: Date;
  public hireDate?: Date;
  public status!: 'active' | 'inactive' | 'on_leave';
  public skills!: string[];
  public certifications!: string[];
  public licenseNumber?: string;
  public licenseExpiry?: Date;
  public emergencyContact?: string;
  public emergencyPhone?: string;
  public photoUrl?: string;
  public hourlyRate?: number;
  public performanceRating?: number;
  public totalHoursWorked?: number;
  public projectsCompleted?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public hasSkill(skill: string): boolean {
    return this.skills.includes(skill);
  }
}

Operator.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    documentType: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    documentNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hireDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'on_leave'),
      allowNull: false,
      defaultValue: 'active',
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    certifications: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    licenseNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    licenseExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    emergencyContact: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    emergencyPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    photoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    performanceRating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 5,
      },
    },
    totalHoursWorked: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    projectsCompleted: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'operators',
    timestamps: true,
  }
);

export default Operator;
