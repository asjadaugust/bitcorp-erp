import * as https from 'https';
import { IncomingMessage } from 'http';
import Logger from '../utils/logger';

export interface RucData {
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  estado?: string;
  condicion?: string;
  estado_contribuyente?: string;
  condicion_contribuyente?: string;
}

export class RucFetcherService {
  /**
   * Fetch RUC data from external provider (DECOLECTA)
   */
  async fetchRuc(ruc: string): Promise<RucData> {
    const token = process.env.DECOLECTA_API_TOKEN;

    if (!token) {
      Logger.error('Missing DECOLECTA_API_TOKEN', { context: 'RucFetcherService.fetchRuc' });
      throw new Error('Configuration error: Missing API token');
    }

    const url = `https://api.decolecta.com/v1/sunat/ruc?numero=${ruc}&token=${token}`;

    try {
      Logger.info('Fetching RUC data from Decolecta', {
        ruc,
        context: 'RucFetcherService.fetchRuc',
      });

      return new Promise((resolve, reject) => {
        const req = https.get(url, (res: IncomingMessage) => {
          let data = '';

          res.on('data', (chunk: string | Buffer) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              if (res.statusCode !== 200) {
                Logger.warn('Decolecta API returned non-200 status', {
                  statusCode: res.statusCode,
                  ruc,
                  context: 'RucFetcherService.fetchRuc',
                });
                // Try to parse error message if available
                try {
                  const errorBody = JSON.parse(data);
                  return reject(
                    new Error(errorBody.message || errorBody.error || 'Failed to fetch RUC data')
                  );
                } catch (e) {
                  return reject(new Error(`API returned status ${res.statusCode}`));
                }
              }

              const response = JSON.parse(data);

              // Map Decolecta response to RucData
              // Based on docs:
              // { "razon_social": "...", "numero_documento": "...", "estado": "...", "condicion": "...", "direccion": "...", ... }

              if (response.message === 'ruc no valido' || response.error) {
                return reject(new Error(response.message || response.error || 'Invalid RUC'));
              }

              const rucData: RucData = {
                ruc: response.numero_documento,
                razon_social: response.razon_social,
                nombre_comercial: response.nombre_comercial || '', // Note: API might not return this in basic, let's see
                direccion: response.direccion,
                departamento: response.departamento,
                provincia: response.provincia,
                distrito: response.distrito,
                estado: response.estado,
                condicion: response.condicion,
                estado_contribuyente: response.estado,
                condicion_contribuyente: response.condicion,
              };

              resolve(rucData);
            } catch (err) {
              reject(new Error('Failed to parse API response'));
            }
          });
        });

        req.on('error', (err: Error) => {
          reject(err);
        });

        req.end();
      });
    } catch (error) {
      Logger.error('Error fetching RUC data', {
        ruc,
        error: error instanceof Error ? error.message : String(error),
        context: 'RucFetcherService.fetchRuc',
      });
      throw new Error('Failed to fetch RUC data');
    }
  }
}
