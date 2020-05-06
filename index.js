const scrape = require("./scrape/scrape.js");
const wikipedia = require("./scrape/wikipedia");

const createTrainingCSV = require("./gcp_util/trainingCSV");
const GCSFile = require("./gcp_util/storage");
const Dataset = require("./gcp_util/dataset");
const Model = require("./gcp_util/model")

const bucketName = "softblocker-lcm";
const projectId = "softblocker";
const location = "us-central1";

const buildModel = async topics => {
  const datasetName = "test_2";
  const dataset = new Dataset(projectId, location, datasetName);
  await dataset.createDataSet();
  
  let fileNames = []
  topics.forEach(topic => {
    fileName = topic + ".csv"
    fileNames.push(fileName);
    const csv = createTrainingCSV(await wikipedia.getWikipediaText(topic));

    const gcsFile = new GCSFile(bucketName, fileName);
    await gcsFile.write(csv);
  });

  fileNames.forEach(fileName => {
    await dataset.uploadDataSetItems(bucketName, fileName);
  })

  const model = Model(projectId, location, dataset.getId(), displayName);
  model.trainModel();

};

const classifyPage = async (url) => {
  scrape(url, false);
};

buildModel();

// homer: https://www.youtube.com/watch?v=1e7gy3fsJa8
// homer simpson: https://www.youtube.com/watch?v=VunWdHCjbI8
