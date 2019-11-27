import { get } from 'request-promise-native'
import { createPrompt, Prompt } from '../common/prompt';
import { connect, DbAccess, NypdTables } from '../common/db-access';

const primaryIdentifier = "persistent ID";

const dataType: { readonly [key: string]: string } = {
  "number": "numeric",
  "text": "text",
  "calendar_date": "timestamp",
  "point": "point"
}

type MetaDataResult = Readonly<{
  columns: ReadonlyArray<Readonly<{
    fieldName: string;
    dataTypeName: string;
    description: string;
  }>>
}>

const handleExistingComplaintsTable = async (dbAccess: DbAccess, prompt: Prompt): Promise<Readonly<{
  tableExists: boolean
}>> => {
  console.log('checking for existing table...')
  const result = await dbAccess.query(`SELECT FROM information_schema.tables WHERE table_name = '${NypdTables.complaints}'`);
  let tableExists = false
  if (result.rowCount != 0) {
    tableExists = true
    console.log("nypd complaints table exists")
    const shouldDrop = "DROP" === (await prompt.question("type drop to drop: ")).toUpperCase()
    if(shouldDrop) {
      await dbAccess.query(`DROP TABLE ${NypdTables.complaints}`);
      console.log('npyd_complaints dropped');
      tableExists = false
    }
  }
  return {tableExists};
};

const makeNypdComplaints = async (dbAccess: DbAccess): Promise<void> => {
  console.log("getting schema data for nypd_complaints...")
  const response: MetaDataResult = await get('https://data.cityofnewyork.us/api/views.json?method=getDefaultView&id=qgea-i56i', { json: true });
  console.log("done.");
  
  const colSchema = response.columns
    .filter( col => !col.fieldName.startsWith(":@"))
    .filter( col => ! col.fieldName.endsWith("_tm"))
    .reduce((agg, current) => {
      return `${agg} ${current.fieldName} ${dataType[current.dataTypeName]},`
    }, "");
  
  const primaryCol = response.columns.find(item => item.description.includes(primaryIdentifier))
  if(!primaryCol) {
    throw new Error("failed to locate primary key in nypd complaints table schema")
  }
  
  const primary = ` PRIMARY KEY (${primaryCol.fieldName})`;
  const makeTableQuery = `CREATE TABLE ${NypdTables.complaints} (${colSchema}${primary});`
  
  console.log("running create table query from schema", makeTableQuery);
  const result = await dbAccess.query(makeTableQuery)
  console.log("result", JSON.stringify(result))
}



const handler = async () => {
  const prompt: Prompt = createPrompt();
  let dbAccess: DbAccess | undefined = undefined
  let status = 200
  try {
    console.log('create tables invoked');
    dbAccess = await connect();
    const {tableExists} = await handleExistingComplaintsTable(dbAccess, prompt)
    if(!tableExists) {
      await makeNypdComplaints(dbAccess);
    }
  } catch (e) {
    status = 500;
    console.error('unexpexcted error')
    console.error(e)
  }
  dbAccess && (await dbAccess.end())
  prompt.close()
  return { status }
};

export { handler };
