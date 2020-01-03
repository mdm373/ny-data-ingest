import { DbAccess } from "../common/db-access"

export type InteropRow = Readonly<{
    id: number,
    bound_id: string,
    timestamp: string
    value: number
}>

export type Mapper = (db: DbAccess) => Promise<readonly InteropRow[]>