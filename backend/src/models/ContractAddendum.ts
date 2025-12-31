import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface ContractAddendumAttributes {
  id: number;
  addendumNumber: string;
  contractId: number;
  newEndDate: Date;
  rateChanged: boolean;
  newRate?: number;
  newCurrency?: 'PEN' | 'USD';
  justification: string;
  documentUrl?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContractAddendumCreationAttributes extends Optional<ContractAddendumAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ContractAddendum extends Model<ContractAddendumAttributes, ContractAddendumCreationAttributes> implements ContractAddendumAttributes {
  public id!: number;
  public addendumNumber!: string;
  public contractId!: number;
  public newEndDate!: Date;
  public rateChanged!: boolean;
  public newRate?: number;
  public newCurrency?: 'PEN' | 'USD';
  public justification!: string;
  public documentUrl?: string;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ContractAddendum.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    addendumNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    contractId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'contracts',
        key: 'id',
      },
    },
    newEndDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    rateChanged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    newRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    newCurrency: {
      type: DataTypes.ENUM('PEN', 'USD'),
      allowNull: true,
    },
    justification: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    documentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
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
    tableName: 'contract_addendums',
    timestamps: true,
  }
);

export default ContractAddendum;
