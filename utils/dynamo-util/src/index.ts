import main from './dynamo-util';
import log from './log';

main()
  .then(() => {
    log('SUCCESS');
    process.exit(0);
  })
  .catch((err) => {
    log('ERROR', err);

    process.exit(1);
  });
