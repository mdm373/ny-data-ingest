import { readFile } from "fs-extra"

export const loadQuery = async (fileName: string) => {
    return await readFile(`./sql/${fileName}`, 'UTF-8')
}