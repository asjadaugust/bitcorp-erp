import * as dotenv from 'dotenv';

dotenv.config();

export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: {
    name: string;
    email: string;
  };
  enabled: boolean;
  logOnly: boolean; // If true, log emails to console instead of sending
}

export const emailConfig: EmailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  from: {
    name: process.env.EMAIL_FROM_NAME || 'BitCorp ERP',
    email: process.env.EMAIL_FROM_EMAIL || 'noreply@bitcorp.com',
  },
  enabled: process.env.EMAIL_ENABLED !== 'false', // Default to enabled
  logOnly: process.env.EMAIL_LOG_ONLY === 'true', // Default to false (send real emails)
};

// Recipient configuration for different notification types
export const emailRecipients = {
  // Roles that should receive approval notifications
  approvalRoles: ['ADMIN', 'DIRECTOR', 'JEFE_EQUIPO'],

  // Roles that should receive payment notifications
  paymentRoles: ['ADMIN', 'CONTABILIDAD'],

  // System admin email for critical errors
  systemAdmin: process.env.SYSTEM_ADMIN_EMAIL || 'admin@bitcorp.com',
};
