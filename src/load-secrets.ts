import { readFile } from "fs-extra"

export const loadSecrets = async () => {
    const secrets = JSON.parse(await readFile("./.secret.json", "UTF-8"));
    Object.keys(secrets).forEach((key) => {
        process.env[key] = secrets[key]
    })
}