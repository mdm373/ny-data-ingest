import { loadSecrets } from "../load-secrets"
import { handler } from ".";

(async () => {
    await loadSecrets();
    console.log(await handler());
})();