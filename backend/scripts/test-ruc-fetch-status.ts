import { RucFetcherService } from '../src/services/ruc-fetcher.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testRucFetch() {
  const service = new RucFetcherService();
  const ruc = '20523533194'; // EQUIPOS PESADOS S.A.C. from the user docs

  console.log(`Testing RUC fetch for: ${ruc}`);

  try {
    const data = await service.fetchRuc(ruc);
    console.log('Success! Data retrieved:');
    console.log(JSON.stringify(data, null, 2));

    if (data.estado_contribuyente && data.condicion_contribuyente) {
      console.log('\n✅ New fields detected:');
      console.log(`Estado: ${data.estado_contribuyente}`);
      console.log(`Condición: ${data.condicion_contribuyente}`);
    } else {
      console.log('\n❌ New fields MISSING or empty!');
    }
  } catch (error) {
    console.error('Error fetching RUC:', error);
  }
}

testRucFetch();
