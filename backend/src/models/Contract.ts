import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface ContractAttributes {
  id: number;
  contractNumber: string;
  equipmentId: number;
  providerId: number;
  startDate: Date;
  endDate: Date;
  rateType: 'hourly' | 'daily' | 'monthly' | 'fixed';
  rate: number;
  currency: 'PEN' | 'USD';
  includesEngine: boolean;
  includesOperator: boolean;
  engineCost?: number;
  includedHours?: number;
  excessPenalty?: number;
  specialConditions?: string;
  documentUrl?: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'extended';
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContractCreationAttributes extends Optional<ContractAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Contract extends Model<ContractAttributes, ContractCreationAttributes> implements ContractAttributes {
  public id!: number;
  public contractNumber!: string;
  public equipmentId!: number;
  public providerId!: number;
  public startDate!: Date;
  public endDate!: Date;
  public rateType!: 'hourly' | 'daily' | 'monthly' | 'fixed';
  public rate!: number;
  public currency!: 'PEN' | 'USD';
  public includesEngine!: boolean;
  public includesOperator!: boolean;
  public engineCost?: number;
  public includedHours?: number;
  public excessPenalty?: number;
  public specialConditions?: string;
  public documentUrl?: string;
  public status!: 'active' | 'expiring_soon' | 'expired' | 'extended';
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public getDaysRemaining(): number {
    const now = new Date();
    const end = new Date(this.endDate);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  public updateStatus(): void {
    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining < 0) {
      this.status = 'expired';
    } else if (daysRemaining <= 30) {
      this.status = 'expiring_soon';
    } else {
      this.status = 'active';
    }
  }
}

Contract.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    contractNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    equipmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'equipment',
        key: 'id',
      },
    },
    providerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'providers',
        key: 'id',
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    rateType: {
      type: DataTypes.ENUM('hourly', 'daily', 'monthly', 'fixed'),
      allowNull: false,
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.ENUM('PEN', 'USD'),
      allowNull: false,
      defaultValue: 'PEN',
    },
    includesEngine: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    includesOperator: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    engineCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    includedHours: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    excessPenalty: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    specialConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    documentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'expiring_soon', 'expired', 'extended'),
      allowNull: false,
      defaultValue: 'active',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'contracts',
    timestamps: true,
  }
);

export default Contract;
