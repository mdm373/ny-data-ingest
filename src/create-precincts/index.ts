
import {createPrompt, Prompt} from '../common/prompt';
import {connect, DbAccess} from '../common/db-access';
import { loadQuery } from '../common/load-query';
import { promptDropTable } from '../common/prompt-drop-table';

export const handler = async (): Promise<void> => {
    const prompt: Prompt = createPrompt();
    let dbAccess: DbAccess | undefined;
    try {
      console.log(`create precincts invoked`);
      dbAccess = await connect();
      await promptDropTable(dbAccess, prompt, 'npyd_precincts')
      const results = await dbAccess.query(await loadQuery('precinct_geoms.sql'))
      console.log(results)
    } catch (e) {
      console.error('unexpexcted error');
      console.error(e);
    }
    dbAccess && await dbAccess.end();
    prompt.close();
  };
  