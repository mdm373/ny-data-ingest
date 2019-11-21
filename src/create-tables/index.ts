import {Client} from 'pg';
const handler = async () => {
  console.log('create tables invoked');
  const client = new Client({
      host: "",
      port: 5432,
      user: 'postgres',
      password: '',
      database: 'nyc_data'
  })
  console.log('connecting...');
  await client.connect()
  console.log('connected');
  const result = await client.query(`SELECT FROM information_schema.tables WHERE table_name = 'nypd_complaints'`);
  if(result.rowCount == 0) {
      return await client.query(`CREATE TABLE nypd_complaints()`);
  }
  return "table exists"
};
export {handler};
