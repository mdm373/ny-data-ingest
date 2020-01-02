import { DbAccess } from "../common/db-access"

export type InteropRow = Readonly<{
    id: number,
    bound_id: string,
    start_time: string
    end_time: string,
    value: number
}>

export type Mapper = (db: DbAccess) => Promise<readonly InteropRow[]>