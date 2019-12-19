
import {createPrompt, Prompt} from '../common/prompt';
import {connect, DbAccess} from '../common/db-access';
import { loadQuery } from '../common/load-query';
import { promptDropTable } from '../common/prompt-drop-table';
import {encode } from '@mapbox/polyline'
import { LineString, Point } from 'geojson';


type BoundsRow = Readonly<{
  bound_id: string,
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

export type BoundryTableConfig = Readonly<{
  tableName: string,
  preQueries: readonly string[],
  boundKey: string,
  boundSource: string,
  geomKey: string,
  simplification: number
}>
export const createBoundryTable = async (config: BoundryTableConfig): Promise<void> => {
    const prompt: Prompt = createPrompt();
    let dbAccess: DbAccess | undefined;
    try {
      console.log(`create boundy table invoked`);
      dbAccess = await connect();
      const cachedAccess = dbAccess
      if(!(await promptDropTable(dbAccess, prompt, config.tableName)).tableExists) {
        await dbAccess.queryNamed<any>('bounds-create', await loadQuery(`bounds_create.sql`, {tableName: config.tableName}))
      }
      await config.preQueries.reduce(async(agg, current) => {
        await agg
        console.log(`running pre-query: ${current}`)
        await cachedAccess.query<any>(await loadQuery(current))
        return true
      }, Promise.resolve(true))
      console.log("selecting json bounds...")
      const queryResult = await dbAccess.query<BoundsRow>(
        await loadQuery('bounds_query.sql', {
          boundSource: config.boundSource,
          boundKey: config.boundKey,
          geomKey: config.geomKey,
          tolerance: config.simplification.toString()
        })
      )
      console.log('encoding bounds paths...')
      const encodedBounds = queryResult.rows.map((row) => {
        const line = JSON.parse(row.bounds) as LineString
        const centroid = JSON.parse(row.centroid) as Point
        return {
          id: row.bound_id,
          path: encodeLine(line),
          centroid: encodePoint(centroid.coordinates)
        }
      })
      console.log(`inserting '${encodedBounds.length}' encoded boundries into ${config.tableName}`)
      const insertQuery = await loadQuery('bounds_insert.sql', {tableName: config.tableName})
      let id = 0;
      await encodedBounds.reduce(async(agg, encodedBound) => {
        await agg
        await cachedAccess.queryNamed('insert-bounds', insertQuery, [
          (id++).toString(),
          encodedBound.id,
          encodedBound.centroid,
          encodedBound.path
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
  