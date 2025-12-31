import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface DailyReportAttributes {
  id: number;
  equipmentId: number;
  operatorId: number;
  projectId: number;
  reportDate: Date;
  startTime: Date;
  endTime: Date;
  hoursWorked: number;
  hourmeterStart?: number;
  hourmeterEnd?: number;
  hourmeterDiff?: number;
  odometerStart?: number;
  odometerEnd?: number;
  odometerDiff?: number;
  fuelConsumed?: number;
  fuelType?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  workDescription?: string;
  observations?: string;
  photoUrls?: string[];
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: number;
  approvedAt?: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  createdAt?: Date;
  updatedAt?: Date;
}

interface DailyReportCreationAttributes extends Optional<DailyReportAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class DailyReport extends Model<DailyReportAttributes, DailyReportCreationAttributes> implements DailyReportAttributes {
  public id!: number;
  public equipmentId!: number;
  public operatorId!: number;
  public projectId!: number;
  public reportDate!: Date;
  public startTime!: Date;
  public endTime!: Date;
  public hoursWorked!: number;
  public hourmeterStart?: number;
  public hourmeterEnd?: number;
  public hourmeterDiff?: number;
  public odometerStart?: number;
  public odometerEnd?: number;
  public odometerDiff?: number;
  public fuelConsumed?: number;
  public fuelType?: string;
  public location?: string;
  public latitude?: number;
  public longitude?: number;
  public workDescription?: string;
  public observations?: string;
  public photoUrls?: string[];
  public status!: 'pending' | 'approved' | 'rejected';
  public approvedBy?: number;
  public approvedAt?: Date;
  public syncStatus!: 'synced' | 'pending' | 'failed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public calculateHours(): void {
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);
    const diff = end.getTime() - start.getTime();
    this.hoursWorked = diff / (1000 * 60 * 60);
  }
}

DailyReport.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    equipmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'equipment',
        key: 'id',
      },
    },
    operatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'operators',
        key: 'id',
      },
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    reportDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    hoursWorked: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    hourmeterStart: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    hourmeterEnd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    hourmeterDiff: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    odometerStart: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    odometerEnd: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    odometerDiff: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    fuelConsumed: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    fuelType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    workDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    observations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    photoUrls: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    syncStatus: {
      type: DataTypes.ENUM('synced', 'pending', 'failed'),
      allowNull: false,
      defaultValue: 'synced',
    },
  },
  {
    sequelize,
    tableName: 'daily_reports',
    timestamps: true,
    indexes: [
      {
        fields: ['equipmentId', 'reportDate'],
      },
      {
        fields: ['operatorId', 'reportDate'],
      },
      {
        fields: ['projectId', 'reportDate'],
      },
    ],
  }
);

export default DailyReport;
