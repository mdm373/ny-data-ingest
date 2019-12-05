
import {createPrompt, Prompt} from '../common/prompt';
import {connect, DbAccess} from '../common/db-access';
import {handleDataSet} from './handle-data-set'
import { dataSets } from '../common/data-sets';

export const handler = async (): Promise<void> => {
    const prompt: Prompt = createPrompt();
    let dbAccess: DbAccess | undefined;
    try {
      console.log(`create tables invoked`);
      dbAccess = await connect();
      const cachedAccess = dbAccess
      await dataSets.reduce(async (agg, current) => {
        await agg
        await handleDataSet(current, cachedAccess, prompt);
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
  