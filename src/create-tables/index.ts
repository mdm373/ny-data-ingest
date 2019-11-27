import { get } from 'request-promise-native'
import { createPrompt, Prompt } from '../common/prompt';
import { connect, DbAccess, NypdTables } from '../common/db-access';

const primaryIdentifier = "persistent ID";

const typeTable: { readonly [key: string]: string } = {
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

const handleExistingComplaintsTable = async (dbAccess: DbAccess, prompt: Prompt): Promise<boolean> => {
  console.log('checking for existing table...')
  const result = await dbAccess.query(`SELECT FROM information_schema.tables WHERE table_name = '${NypdTables.complaints}'`);
  let complaintsTableExists = false
  if (result.rowCount != 0) {
    complaintsTableExists = true
    console.log("nypd complaints table exists")
    const shouldDrop = "DROP" === (await prompt.question("type drop to drop: ")).toUpperCase()
    if(shouldDrop) {
      await dbAccess.query(`DROP TABLE ${NypdTables.complaints}`);
      console.log('npyd_complaints dropped');
      complaintsTableExists = false
    }
  }
  return complaintsTableExists;
};

const makeNypdComplaints = async (dbAccess: DbAccess): Promise<void> => {
  console.log("getting schema data for nypd_complaints...")
  const response: MetaDataResult = await get('https://data.cityofnewyork.us/api/views.json?method=getDefaultView&id=qgea-i56i', { json: true });
  console.log("done.");
  const query = response.columns
    .filter( col => !col.fieldName.startsWith(":@"))
    .filter( col => ! col.fieldName.endsWith("_tm"))
    .reduce((agg, current) => {
      return `${agg}\n ${current.fieldName} ${typeTable[current.dataTypeName]},`
    }, "");
  const primaryCol = response.columns.find(item => item.description.includes(primaryIdentifier)) || { fieldName: 'NONE' }
  const primary = `\n PRIMARY KEY (${primaryCol.fieldName})\n`;
  const makeTableQuery = `CREATE TABLE ${NypdTables.complaints} (${query}${primary});`
  console.log("running make table query...", makeTableQuery.replace(/\n/g, " "));
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
    if( !await handleExistingComplaintsTable(dbAccess, prompt)) {
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
