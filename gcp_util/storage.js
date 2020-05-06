// Imports the Google Cloud client library
const { Storage } = require("@google-cloud/storage");

// TODO: open write stream to a file and write to google cloud storage instead of filesystem
// ref: https://googleapis.dev/nodejs/storage/latest/File.html#createWriteStream

class GCSFile {
  constructor(bucketName, fileName) {
    // Creates a client
    this.storage = new Storage().bucket(bucketName);
    this.bucketName = bucketName;
    this.fileName = fileName;
  }

  async write(data) {
    // Uploads a local file to the bucket
    writeStream = storage.file(this.fileName).createWriteStream();
    // var entities = {}; //huge json object;
    // Object.values(entities).forEach((json) => {
    //   var str = JSON.stringify(json);
    //   gcsStream.write(str + "\n");
    // });
    writeStream.on("error", (err) => {
      console.error(`${this.fileName}: Error storage file write.`);
      console.error(`${this.fileName}: ${JSON.stringify(err)}`);
    });

    writeStream.write(data);
    writeStream.end();
    //gcsStream.end();
  }

  async uploadFile(fileName) {
    // Uploads a local file to the bucket
    await this.storage.upload(fileName, {
      // Support for HTTP requests made with `Accept-Encoding: gzip`
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

    console.log(`${fileName} uploaded to ${bucketName}/${this.fileName}.`);
  }
}

module.exports = uploadFile;
