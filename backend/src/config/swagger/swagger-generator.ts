import swaggerAutogen from 'swagger-autogen';
import { getDtoSchemas } from './schema-loader';
import * as path from 'path';
import * as fs from 'fs';

// Load version safely from package.json using fs
let version = '1.0.0';
try {
  const pkgPath = path.resolve(__dirname, '../../../package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    version = pkg.version || version;
  }
} catch (error) {
  console.error('Warning: Could not load version from package.json');
}

const doc = {
  info: {
    title: 'Bitcorp ERP API (Auto-generated)',
    version,
    description: 'Automated API documentation for Bitcorp ERP Backend',
  },
  host: 'localhost:3400',
  basePath: '/',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Enter your bearer token in the format: Bearer <token>',
    },
  },
  components: {
    schemas: getDtoSchemas(),
  }
};

const outputFile = path.join(__dirname, '../../../swagger-api.json');
// Crawl ONLY the route files to keep it fast
const endpointsFiles = [
  path.join(__dirname, '../../api/**/*.routes.ts')
];

/* NOTE: If you are using the "TS" versions, swagger-autogen might need 
   the compiled JS files or you might need to run this via ts-node */

console.log('Generating Swagger documentation...');

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger documentation generated successfully!');
}).catch((err) => {
  console.error('Error generating Swagger documentation:', err);
});
