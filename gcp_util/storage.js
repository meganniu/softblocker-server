// Imports the Google Cloud client library
const { Storage } = require("@google-cloud/storage");

class GCSFile {
  constructor(bucketName, fileName) {
    // Creates a client
    this.storage = new Storage().bucket(bucketName);
    this.bucketName = bucketName;
    this.fileName = fileName;
  }

  // TODO: for write and upload, DO NOT write/reupload if file already exists
  async write(data) {
    // Uploads a local file to the bucket
    const writeStream = this.storage.file(this.fileName).createWriteStream();
    writeStream.on("error", (err) => {
      console.log(err)
      console.error(`${this.fileName}: Error writing file to storage.`);
      console.error(`${this.fileName}: ${JSON.stringify(err)}`);
    });

    writeStream.write(data);
    writeStream.end();
  }

  async upload(filePath) {
    // Uploads a local file to the bucket
    await this.storage.upload(filePath, {
      gzip: true,
      // By setting the option `destination`, you can change the name of the
      // object you are uploading to a bucket.
      destination: this.fileName,
      metadata: {
        // Enable long-lived HTTP caching headers
        // Use only if the contents of the file will never change
        // (If the contents will change, use cacheControl: 'no-cache')
        cacheControl: "public, max-age=31536000",
      },
    });

    console.log(`${this.fileName} uploaded to ${bucketName}/${this.fileName}.`);
  }
}

// const fs = require("fs");
// const path = require("path");
// const wikipedia = require("../scrape/wikipedia");
// const createTrainingCSV = require("./trainingCSV");

// const test = async () => {
//   const bucketName = "softblocker-lcm";
//   const topic = "United_States";
//   const fileName = topic + ".csv";

//   const csvData = createTrainingCSV(
//     await wikipedia.getWikipediaData(topic),
//     topic
//   );

//   // Write directly to file in bucket.
//   // await gcsFile.write(csvData);

//   // Write to local fs and then upload to bucket.
//   const filePath = path.join(__dirname, "..", "training-data", fileName);
//   fs.writeFile(filePath.toString(), csvData, "utf-8", (err) => {
//     if (err) throw err;
//     console.log(`Data written to ${filePath}`);
//   });

//   const gcsFile = new GCSFile(bucketName, fileName);
//   gcsFile.upload(filePath);
// };

// test();

module.exports = GCSFile;
