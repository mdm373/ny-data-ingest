import {get} from 'request-promise-native';
import {Prompt} from '../common/prompt';
import {connect, DbAccess} from '../common/db-access';
import { NyDataTableName } from '../common/data-sets';

export type DataSetConfig  = Readonly<{
  id: string
  description: string,
  tableName: NyDataTableName,
  primaryKey: string,
}>

const dataType: { readonly [key: string]: string } = {
  'number': 'numeric',
  'text': 'text',
  'calendar_date': 'timestamp',
  'point': 'point',
  'multipolygon': 'text',
  'date' : 'date'
};

type MetaDataResult = Readonly<{
  columns: ReadonlyArray<Readonly<{
    fieldName: string;
    dataTypeName: string;
    description: string;
  }>>;
}>

const handleExistingTable = async (config: DataSetConfig, dbAccess: DbAccess, prompt: Prompt): Promise<Readonly<{
  tableExists: boolean;
}>> => {
  console.log('checking for existing table...');
  const result = await dbAccess.query(`SELECT FROM information_schema.tables WHERE table_name = '${config.tableName}'`);
  let tableExists = false;
  if (result.rowCount != 0) {
    tableExists = true;
    console.log('table exists');
    const shouldDrop = config.tableName.toUpperCase() === (await prompt.question(`type ${config.tableName} to drop: `)).toUpperCase();
    if (shouldDrop) {
      await dbAccess.query(`DROP TABLE ${config.tableName}`);
      console.log('table dropped');
      tableExists = false;
    }
  }
  return {tableExists};
};

const makeTable = async (config: DataSetConfig, dbAccess: DbAccess): Promise<void> => {
  console.log('getting schema data...');
  const response: MetaDataResult = await get(`https://data.cityofnewyork.us/api/views.json?method=getDefaultView&id=${config.id}`, {json: true});
  console.log('done.');

  const colSchema = response.columns
      .filter( (col) => !col.fieldName.startsWith(':@'))
      .filter( (col) => ! col.fieldName.endsWith('_tm'))
      .reduce((agg, current) => {
        return `${agg} ${current.fieldName} ${dataType[current.dataTypeName]},`;
      }, '');

  const primary = ` PRIMARY KEY (${config.primaryKey})`;
  const makeTableQuery = `CREATE TABLE ${config.tableName} (${colSchema}${primary});`;

  console.log('running create table query from schema', makeTableQuery);
  const result = await dbAccess.query(makeTableQuery);
  console.log('result', JSON.stringify(result));
};


export const handleDataSet = async (config: DataSetConfig, dbAccess: DbAccess, prompt: Prompt): Promise<void> => {
  console.log(`processing ${config.description}`);
  dbAccess = await connect();
  const {tableExists} = await handleExistingTable(config, dbAccess, prompt);
  if (!tableExists) {
    await makeTable(config, dbAccess);
  }
};
