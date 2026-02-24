import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { getMetadataStorage } from 'class-validator';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Dynamically loads all DTOs from the src/types/dto directory
 * and converts them to OpenAPI schemas using class-validator-jsonschema.
 */
export function getDtoSchemas() {
  const dtoDir = path.join(__dirname, '../../types/dto');
  
  // Ensure reflect-metadata is loaded (it should be in index.ts but good to be sure)
  require('reflect-metadata');

  // Load all .ts files in the DTO directory to register them with class-validator
  if (fs.existsSync(dtoDir)) {
    const files = fs.readdirSync(dtoDir);
    files.forEach(file => {
      if (file.endsWith('.dto.ts')) {
        try {
          // We use require to load the module so decorators are executed
          require(path.join(dtoDir, file));
        } catch (error) {
          console.error(`Error loading DTO file ${file}:`, error);
        }
      }
    });
  }

  // Convert the registered metadata to Swagger schemas
  const schemas = validationMetadatasToSchemas({
    additionalConverters: {
      // Add custom converters if needed for specific class-validator decorators
    }
  });

  return schemas;
}
