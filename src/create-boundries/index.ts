import { BoundryTableConfig, createBoundryTable } from "./create-bounds"

export const handler = async () => {
    const configs: readonly BoundryTableConfig[] = [{
        preQueries: [
            'precinct_temp_union_drop.sql',
            'precinct_temp_union_create.sql',
        ],
        boundKey: 'precinct',
        boundSource: 't_unioned',
        tableName: 'nypd_precinct_bounds',
        geomKey: 'union_geom',
        tolerance: 0.0005
    }]
    await configs.reduce( async (agg, current) => {
        await agg
        if(process.env[`SKIP_${current.tableName.toUpperCase()}`] === JSON.stringify(true)){
            console.log(`skipping ${current.tableName}`)
            return true;
        }
        console.log(`building boundries into ${current.tableName}`)
        await createBoundryTable(current)
        return true;
    }, Promise.resolve(true))
}