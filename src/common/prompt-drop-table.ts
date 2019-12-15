import { DbAccess } from "./db-access";
import { Prompt } from "./prompt";

export const promptDropTable = async (dbAccess: DbAccess, prompt: Prompt, tableName: string): Promise<Readonly<{
  tableExists: boolean;
}>> => {
  console.log(`checking for existing table '${tableName}'`);
  const result = await dbAccess.query(`SELECT FROM information_schema.tables WHERE table_name = '${tableName}'`);
  let tableExists = false;
  if (result.rowCount != 0) {
    tableExists = true;
    console.log('table exists');
    const shouldDrop = tableName.toUpperCase() === (await prompt.question(`type ${tableName} to drop: `)).toUpperCase();
    if (shouldDrop) {
      await dbAccess.query(`DROP TABLE ${tableName}`);
      console.log('table dropped');
      tableExists = false;
    }
  } else {
      console.log('table does not exist')
  }
  return {tableExists};
};