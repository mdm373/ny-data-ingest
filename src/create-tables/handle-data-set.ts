import {get} from 'request-promise-native';
import {Prompt} from '../common/prompt';
import {connect, DbAccess} from '../common/db-access';
import { promptDropTable } from '../common/prompt-drop-table';

export type DataSetConfig  = Readonly<{
  id: string
  description: string,
  tableName: string,
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
  const result = await dbAccess.query<any>(makeTableQuery);
  console.log('result', JSON.stringify(result));
};


export const handleDataSet = async (config: DataSetConfig, dbAccess: DbAccess, prompt: Prompt): Promise<void> => {
  console.log(`processing ${config.description}`);
  dbAccess = await connect();
  const {tableExists} = await promptDropTable(dbAccess, prompt, config.tableName);
  if (!tableExists) {
    await makeTable(config, dbAccess);
  }
};
