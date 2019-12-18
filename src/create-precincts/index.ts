
import {createPrompt, Prompt} from '../common/prompt';
import {connect, DbAccess} from '../common/db-access';
import { loadQuery } from '../common/load-query';
import { promptDropTable } from '../common/prompt-drop-table';
import {encode } from '@mapbox/polyline'
import { LineString, Point } from 'geojson';


type PrecinctBoundyLine = Readonly<{
  precinct: string,
  bounds: string,
  centroid: string,
}>

const encodeLine = (line: LineString) => {
  return encode(line.coordinates.map((cord) => {
    const[ x, y] = cord
    return [y, x]
  }))
}

const encodePoint = (point: number[]) => {
  const[ x, y] = point
  return encode([[y, x]])
}

export const handler = async (): Promise<void> => {
    const prompt: Prompt = createPrompt();
    let dbAccess: DbAccess | undefined;
    try {
      console.log(`create precincts invoked`);
      dbAccess = await connect();
      const cachedAccess = dbAccess
      if(!(await promptDropTable(dbAccess, prompt, 'nypd_precinct_bounds')).tableExists) {
        await dbAccess.query<any>(await loadQuery('precinct_bounds_create.sql'))
      }
      console.log("clearing cached precinct boundry unions...")
      await dbAccess.query<any>(await loadQuery('precinct_temp_union_drop.sql'))
      console.log("building precinct boundry unions...")
      await dbAccess.query<any>(await loadQuery('precinct_temp_union_create.sql'))
      console.log("selecting precinct json bounds...")
      const queryResult = await dbAccess.query<PrecinctBoundyLine>(
        await loadQuery('precinct_json_bounds_select.sql')
      )
      console.log('encoding paths...')
      const encodedPrecincts = queryResult.rows.map((row) => {
        const line = JSON.parse(row.bounds) as LineString
        const centroid = JSON.parse(row.centroid) as Point
        return {
          id: row.precinct,
          path: encodeLine(line),
          centroid: encodePoint(centroid.coordinates)
        }
      })
      console.log(`inserting '${encodedPrecincts.length}' encoded precinct boundries into bounds table`)
      const insertQuery = await loadQuery('precinct_bounds_insert.sql')
      let id = 0;
      await encodedPrecincts.reduce(async (precicntPromise, precinct) => {
        await precicntPromise
        await cachedAccess.queryNamed('insert-precinct', insertQuery, [
          (id++).toString(),
          precinct.id,
          precinct.centroid,
          precinct.path
        ])
        return true
      }, Promise.resolve(true))
    } catch (e) {
      console.error('unexpexcted error');
      console.error(e);
    }
    dbAccess && await dbAccess.end();
    prompt.close();
  };
  