module.exports.write_file = function( datapath, datatowrite, friendlyName) {
  return new Promise(function (resolve, reject) {
    const start = process.hrtime();

    var fs = require('fs');
    var logger = require('./logger.js');

    try {
      fs.writeFile( datapath, JSON.stringify(datatowrite, null, 2), function(err) {
        if (err) {
          reject(err);
        } else {
          logger.logTime(start, `Writing metadata file.`);
          resolve('SUCCESS');
        }
      });
    } catch(err) {
      reject(err);
    }

  });
};
