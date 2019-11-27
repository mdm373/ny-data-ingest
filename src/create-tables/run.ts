import {loadSecrets} from '../load-secrets';
import {handler} from '.';

(async (): Promise<void> => {
  await loadSecrets();
  console.log(await handler());
})();
