import { Sequelize } from 'sequelize';
import Logger from '../utils/logger';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'bitcorp_dev',
  username: process.env.POSTGRES_USER || process.env.DB_USER || 'bitcorp',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'dev_password_change_me',
  logging:
    process.env.NODE_ENV === 'development'
      ? (sql: string) => Logger.debug('Sequelize SQL', { sql, context: 'Sequelize' })
      : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export { sequelize };

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    Logger.info('Sequelize database connection established successfully', {
      dialect: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      database: process.env.POSTGRES_DB || process.env.DB_NAME || 'bitcorp_dev',
      context: 'Database.connect',
    });

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      Logger.info('Sequelize database models synchronized', {
        mode: 'alter',
        context: 'Database.connect',
      });
    }
  } catch (error) {
    Logger.error('Sequelize database connection failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      host: process.env.DB_HOST || 'postgres',
      database: process.env.POSTGRES_DB || process.env.DB_NAME || 'bitcorp_dev',
      context: 'Database.connect',
    });
    throw error;
  }
};
