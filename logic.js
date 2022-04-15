var fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require('crypto-js');
const sizeOf = require('image-size');
const piexif = require('piexifjs');
const byteSize = require('byte-size');

var dayjs = require('dayjs');
var customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

var logger = require("./logger.js");
var file_handler = require("./file_handler.js");

// ===========================
// This program is largely based off a fragment of the code from LoMiArch-API
// https://github.com/confused-Techie/LoMiArch-API
// This simply will save all found meta data of a file to a metadata.json file.
// Its goal is to allow users to see how much data can be stored in a photo.
// Alternatively can even look at what data is stripped when posting a photo to social media.
// ==========================

var mediaLoc = "./data/";

async function run(argv) {

  importData()
    .then(res => {

      file_handler.write_file("./metadata.json", res, "Meta Data File")
        .then(op => {
          console.log('Successfully wrote metadata.json file.');
        })
        .catch(err => {
          console.log(err);
          process.exit(1);
        });
    })
    .catch(err => {
      console.log(err);
      process.exit(1);
    });

}

module.exports = {
  run,
};


function importData() {
  return new Promise(function (resolve, reject) {

    const start = process.hrtime();
    var returnMedia = [];

    console.log(`Scanning: ${mediaLoc}...`);

    try {
      fs.readdir(mediaLoc, {withFileTypes: true}, (err, content) => {
        if (err) {
          console.log(`Error Reading media: ${err}`);
          process.exit(1);
        } else {
          content.forEach((file, idx) => {
            if (file.isDirectory()) {
              console.log('Directories not supported in data folder');
            } else if (file.isFile()) {
              if (file.name != '.gitignore') {
                extractMedia(file.name)
                  .then(res => {
                    console.log(`Successfully read media metadata: ${file.name}`);
                    returnMedia.push(res);
                    logger.logTime(start, `Gathering metadata of ${file.name}`);

                    if (idx === content.length-1) {
                      resolve(returnMedia);
                    }
                  })
                  .catch(err => {
                    console.log(`Error reading ${file.name}: ${err}`);
                  });
              }

            } else {
              console.log(`Unrecognized content: ${file.name}`);
              process.exit(1);
            }

          });

        }
      });

    } catch(err) {
      console.log(`Severe Error: ${err}`);
      process.exit(1);
    }
  });
}

function extractMedia(file) {
  return new Promise(function (resolve, reject) {

    var filePath = mediaLoc + file;

    const supported_files = ["jpg", "jpeg", "gif"];
    const supported_vidoes = ["mp4", "avi"];

    var file_type_check = file.split(".");
    var file_type = file_type_check[file_type_check.length -1];

    if (supported_files.includes(file_type)) {
      // now gather image meta data

      // all collected metadata to collect will be declared here.
      let contentName = file;
      let contentSpecificType = file_type;
      let contentType = 'image';
      let dimensionsData, exifData, md5Hash, uuidValue, epochTime, byteSize, friendlySize;

      // ============ DIMENSIONS =================
      try {
        dimensionsData = collectDimensions(filePath);
        if (dimensionsData.includes('ERROR')) {
          console.log(`Error gathering dimensions: ${dimensionsData}, declaring as empty`);
          dimensionsData = undefined;
          dimensionsData.height = '';
          dimensionsData.width = '';
        }
      } catch(err) {
        if (err instanceof TypeError) {
          // likely means it failed as hoped, since the object will no allow includes function.
        } else {
          console.log(`Error gathering dimensions: ${dimensionsData}, will declare as empty.`);
          dimensionsData = undefined;
          dimensionsData.height = '';
          dimensionsData.width = '';
        }
      }

      // =========== MD5 HASH =================
      try {
        md5Hash = md5Generate(filePath);

        if (md5Hash.includes('ERROR')) {
          console.log(`Error generating md5Hash: ${md5Hash}`);
          md5Hash = 'ERROR';
        }
      } catch(err) {
        console.log(`Error caught generating md5Hash: ${md5Hash}`);
        md5Hash = 'ERROR';
      }

      // =========== UUID ============
      try {
        uuidValue = uuidGenerate();

        if (uuidValue.includes('ERROR')) {
          console.log(`Error generating uuid: ${uuidValue}`);
          uuidValue = '';
        }
      } catch(err) {
        console.log(`Error caught generating uuid: ${err}`);
        uuidValue = '';
      }


      // ============= exifData ===========
      try {
        exifData = exifCollector(filePath);

        if (exifData.includes('ERROR')) {
          console.log(`Error gathering exif data: ${exifData}`);
          exifData = '';
        }
      } catch(err) {
        if (err instanceof TypeError) {
          // planned error since its an object as a successful return.
        } else {
          console.log(`Error caught generating exif data: ${err}`);
          exifData = '';
        }
      }

      // ============ filedata ==========
      try {

        fileStats(filePath, exifData)
          .then((fsStats) => {

            // now with the meta data collected, we can save the data and exit.
            let temp_content_json = {
              uuid: uuidValue,
              pod_loc: filePath,
              time_taken: fsStats.epochTime,
              dimensions: {
                height: dimensionsData.height,
                width: dimensionsData.width
              },
              md5: md5Hash,
              exifData: exifData,
              type: contentType,
              exactType: contentSpecificType,
              bytes: fsStats.byteSize,
              fiendlySize: fsStats.fiendlySize
            };
            resolve(temp_content_json);

          });
      } catch(err) {
        console.log(`Error gathering file stats: ${err}`);
        reject(`Error on last step of meta data collection.`);
      }

    } else if (supported_vidoes.includes(file_type)) {
      console.log(`Currently the logic is not built out for videos. Sorry`);
      reject('Videos are not currently supported.');
    } else {
      console.log(`Unrecognized content type found: ${file_type}`);
      reject(`Unrecognized content.`);
    }
  });
}

function uuidGenerate() {
  try {
    return uuidv4();
  } catch(err) {
    return `ERROR Occured: ${err}`;
  }
}

function md5Generate(file) {
  const rawFile = fs.readFileSync(file).toString('binary');

  try {
    const md5Hash = CryptoJS.MD5(rawFile);
    return md5Hash.toString(CryptoJS.enc.Hex);
  } catch(err) {
    return `ERROR Occurred: ${err}`;
  }
}

function collectDimensions(file) {
  try {
    const dimensions = sizeOf(file);
    return dimensions;
  } catch(err) {
    return `ERROR Occurred: ${err}`;
  }
}

function exifCollector(file) {
  try {
    const getBase64Data = filename => fs.readFileSync(filename).toString('binary');
    const getExif = filename => piexif.load(getBase64Data(filename));
    const mediaExif = getExif(file);

    // loop throughb the imnage file direcotry and extrac all tags associated. Will star sorting them all expecpt thumbnail.
    var mediaIFD = {};

    for (const ifd in mediaExif) {
      if (ifd != 'thumbnail') {
        for (const tag in mediaExif[ifd]) {
          var ifdTag = piexif.TAGS[ifd][tag]['name'];
          var ifdValue = mediaExif[ifd][tag];

          mediaIFD[ifdTag] = ifdValue;
        }
      }
    }

    return mediaIFD;
  } catch(err) {
    return `ERROR Occurred reading Exif Data: ${err}`;
  }
}

function timeConverter(date, format) {
  // having the valueOf will convert this to milliseconds since epoch time to align with fs return.
  return dayjs(date, format).valueOf();
}

function sizeConverter(size) {
  // defaults to using metric, so no other values needed
  return byteSize(size);
}

function fileStats(filePath, exifData) {
  return new Promise(function (resolve, reject) {

    let temp_byteSize, temp_friendlySize, temp_epochTime;

    try {
      fs.stat(filePath, (err, stats) => {
        if (stats.size) {
          temp_byteSize = stats.size;
          temp_fiendlySize = sizeConverter(temp_byteSize);
        } else {
          temp_byteSize = 0;
          temp_friendlySize = 0;
        }

        // to create a proper timestamp I will need to compare the Exif Data and what the system thinks is the original time.
        // Exif Data if present should win the argument.
        // First I can list all the available times, converting to epoch time, and whichever is the earliest will win.

        let max_value = Number.MAX_SAFE_INTEGER; // to ensure it never wins the argument
        let fsBirthTime;
        let exifDateTime;
        let exifDateTimeOriginal;
        let exifDateTimeDigitized;
        let currentDate = Date.now();

        if (stats.birthtimeMs) {
          if (typeof stats.birthtimeMs !== undefined) {
            fsBirthTime = stats.birthtimeMs;
          } else {
            fsBirthTime = max_value;
          }
        } else {
          fsBirthTime = max_value;
        }

        const attemptTimeConvert = function(value) {
          if (value) {
            return timeConverter(value, 'YYYY:MM:DD HH:mm:ss');
          } else {
            return max_value;
          }
        };

        exifDateTime = attemptTimeConvert(exifData.DateTime);
        exifDateTimeOriginal = attemptTimeConvert(exifData.DateTimeOriginal);
        exifDateTimeDigitized = attemptTimeConvert(exifData.exifDateTimeDigitized);

        // with all the time formats declared we can compare.
        const earliestEpoch = Math.min(fsBirthTime, exifDateTime, exifDateTimeOriginal, exifDateTimeDigitized, currentDate);
        temp_epochTime = earliestEpoch;

        // NULL CHECK
        if (isNaN(temp_epochTime)) {
          console.log(`Evaluated epoch time is null. Error checking media date.`);
          temp_epochTime = 0;
          console.log(`epochTime: ${temp_epochTime}, birthtime: ${fsBirthTime}, datetime: ${exifDateTime}, datetimeoriginal: ${exifDateTimeOriginal}, DateTimeDigitized: ${exifDateTimeDigitized}, currentdate: ${currentDate}`);
        }

        resolve( { byteSize: temp_byteSize, friendlySize: temp_friendlySize, epochTime: temp_epochTime } );

      });
    } catch(err) {
      reject(err);
    }

  });
}
