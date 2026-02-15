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
}

export class RucFetcherService {
  /**
   * Fetch RUC data from external provider
   * Mocked for now, but ready for integration with APIs like Sunat, Migo, etc.
   */
  async fetchRuc(ruc: string): Promise<RucData> {
    try {
      Logger.info('Fetching RUC data', { ruc, context: 'RucFetcherService.fetchRuc' });

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock implementation
      // In production, this would call an external API
      if (ruc === '20100017491') {
        return {
          ruc: '20100017491',
          razon_social: 'PETROLEOS DEL PERU SA - PETROPERU SA',
          nombre_comercial: 'PETROPERU',
          direccion: 'AV. ENRIQUE CANAVAL MOREYRA NRO. 150',
          departamento: 'LIMA',
          provincia: 'LIMA',
          distrito: 'SAN ISIDRO',
          estado: 'ACTIVO',
          condicion: 'HABIDO',
        };
      }

      // Generic mock for other RUCs
      return {
        ruc,
        razon_social: `PROVEEDOR MOCK ${ruc}`,
        direccion: 'DIRECCION DE PRUEBA 123',
        estado: 'ACTIVO',
        condicion: 'HABIDO',
      };
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
