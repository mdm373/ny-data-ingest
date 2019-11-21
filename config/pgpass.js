
'use strict';

const fs = require('fs');
const helper = require( 'pgpass/lib/helper.js' );


module.exports.warnTo = helper.warnTo;

module.exports = function(connInfo, cb) {
  const file = helper.getFileName();

  fs.stat(file, function(err, stat) {
    if (err || !helper.usePgPass(stat, file)) {
      return cb(undefined);
    }

    const st = fs.createReadStream(file);

    helper.getPassword(connInfo, st, cb);
  });
};
