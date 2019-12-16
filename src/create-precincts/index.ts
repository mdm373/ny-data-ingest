
import {createPrompt, Prompt} from '../common/prompt';
import {connect, DbAccess} from '../common/db-access';
import { loadQuery } from '../common/load-query';
import { promptDropTable } from '../common/prompt-drop-table';
import {encode } from '@mapbox/polyline'
import {union, polygonToLine, polygon, Feature, Polygon, LineString, MultiLineString} from "@turf/turf"

type PrecinctGeoms = Readonly<{
  precinct: string,
  geoms: ReadonlyArray<string>,
  sectors: ReadonlyArray<string>
}>

const flatten = <T>(agg: T[], current: T[]) => {
  return agg.concat(current)
}
const encodePolygon = (precinct: string) => (cords: number[][][]): string[] => {
  const out = polygonToLine(polygon(cords)) as Feature<LineString | MultiLineString>
  const lineGeom = out.geometry
  if(!lineGeom) {
    throw new Error('no geom for converted poly to line')
  }
  return lineGeom.type === 'MultiLineString'
    ? lineGeom.coordinates.map((cords) => encode(cords))
    : [encode(lineGeom.coordinates)]
}

const decodRawMultiPolyGon = (shape: string) => {
  const polyBlobMatch = /^MULTIPOLYGON \((.*)\)$/g.exec(shape)
  const polysBlob = polyBlobMatch && polyBlobMatch[1]
  if(!polysBlob) {
    throw new Error(`unsupported geom decode requested`)
  }
  const polyGroupRegex = /\(\(([^))]*)\)\)/g
  let match: RegExpExecArray | null = null
  const matches: string[] = []
  do {
    match = polyGroupRegex.exec(polysBlob)
    if(match) {
      matches.push(match[1])
    }
  } while (match)
  const polysForSector = matches.map((rawPoly) => {
    const polyForRaw = polygon([rawPoly.split(",").map((set)  => {
      const [lng, lat] = set.trim().split(" ")
      const nums = [Number(lat), Number(lng)]
      if(!nums[0] || !nums[1]) {
        throw new Error(`invalid coord ${set}`)
      }
      return nums
    })])
    return polyForRaw
  })
  return polysForSector
}

export const handler = async (): Promise<void> => {
    const prompt: Prompt = createPrompt();
    let dbAccess: DbAccess | undefined;
    try {
      console.log(`create precincts invoked`);
      dbAccess = await connect();
      const cachedAccess = dbAccess
      if(!(await promptDropTable(dbAccess, prompt, 'nypd_precinct_bounds')).tableExists) {
        dbAccess.query<any>(await loadQuery('precinct_bounds_create.sql'))
      }
      
      const queryResult = await dbAccess.query<PrecinctGeoms>(await loadQuery('precinct_geoms.sql'))
      console.log('encoding paths...')
      const encodedPrecincts = queryResult.rows.map((row) => {
        const polysForPrecinct = row.geoms.map(decodRawMultiPolyGon).reduce(flatten, [] as Feature<Polygon>[])
        const unioned = union(...polysForPrecinct)
        if (!unioned.geometry) {
          throw new Error('unioned geom missing')
        }
        return {
          id: row.precinct,
          paths: unioned.geometry.type === 'MultiPolygon'
            ? unioned.geometry.coordinates.map(encodePolygon(row.precinct))
            : [encodePolygon(row.precinct)(unioned.geometry.coordinates)]
        }
      })  
      console.log("inserting encoded paths into bounds table")
      const insertQuery = await loadQuery('precinct_bounds_insert.sql')
      let id = 0;
      await encodedPrecincts.reduce((outerPromise, encodedPrecinct) => outerPromise.then(
        () => encodedPrecinct.paths.reduce((innerPromise, pathSet) => innerPromise.then(
          () => pathSet.reduce((innerInnerPromise, path) => innerInnerPromise.then(
            () => cachedAccess.queryNamed('insert-precinct', insertQuery, [(id++).toString(), encodedPrecinct.id, path])
          ), Promise.resolve(true) as Promise<any>)
        ), Promise.resolve(true) as Promise<any>)
      ), Promise.resolve(true) as Promise<any>)
    } catch (e) {
      console.error('unexpexcted error');
      console.error(e);
    }
    dbAccess && await dbAccess.end();
    prompt.close();
  };
  