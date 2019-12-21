
import {createPrompt, Prompt} from '../common/prompt';
import {connect, DbAccess, boundsTypeTableName} from '../common/db-access';
import {handleDataSet} from './handle-data-set'
import { getDataSetConfigs } from '../common/data-sets';
import { promptDropTable } from '../common/prompt-drop-table';
import { loadQuery } from '../common/load-query';

export const handler = async (): Promise<void> => {
    const prompt: Prompt = createPrompt();
    let dbAccess: DbAccess | undefined;
    try {
      console.log(`create tables invoked`);
      dbAccess = await connect();
      if(!(await promptDropTable(dbAccess, prompt, boundsTypeTableName)).tableExists){
        await dbAccess.query(await loadQuery('bound_type_table_create.sql', {tableName: boundsTypeTableName}))
      }
      const cachedAccess = dbAccess
      const dataSets = await getDataSetConfigs()
      await dataSets.reduce(async (agg, current) => {
        await agg
        await handleDataSet({
          description: current.description,
          id: current.sources[0].id,
          primaryKey: current.primaryKey,
          tableName: current.tableName
        }, cachedAccess, prompt);
        return true;
      }, Promise.resolve(true))
    } catch (e) {
      console.error('unexpexcted error');
      console.error(e);
    }
    console.log('all tables handled.')
    dbAccess && await dbAccess.end();
    prompt.close();
    console.log('connections closed.')
  };
  