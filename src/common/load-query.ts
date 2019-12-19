import { readFile } from "fs-extra"

export const loadQuery = async (fileName: string, vars: {readonly [key: string]: string} = {}) => {
    const query = await readFile(`./sql/${fileName}`, 'UTF-8')
    return Object.keys(vars).reduce((agg, current) => {
        return agg.split(`{{${current}}}`).join(vars[current])
    }, query)
}