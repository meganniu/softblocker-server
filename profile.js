var short = require("short-uuid");

const scrape = require("./scrape/scrape.js");
const wikipedia = require("./scrape/wikipedia");

const createTrainingCSV = require("./gcp_util/trainingCSV");
const GCSFile = require("./gcp_util/storage");
const Dataset = require("./gcp_util/dataset");
const Model = require("./gcp_util/model");
const Collection = require("./gcp_util/firestore");

const bucketName = "softblocker-lcm";
const projectId = "softblocker";
const location = "us-central1";
const collectionName = "profiles";

// homer: https://www.youtube.com/watch?v=1e7gy3fsJa8
// homer simpson: https://www.youtube.com/watch?v=VunWdHCjbI8

class Profile {
  // TODO: figure out how member fields of object are initialized
  //       can I just list them in one place instead of listing them in both ctors?

  constructor(profileInfo) {
    if (profileInfo.id !== undefined) {
      this.id = profileInfo.id; // this.id is the id of the document in Firestore that corresponds to this profile.
      this.creationPromise = this.loadProfileData();
    } else {
      this.id = short.generate();
      this.name = profileInfo.name ? profileInfo.name : "N/A";

      this.dataset = null;
      this.model = null;
      this.modelInTraining = null;
      this.labels = new Map();

      this.creationPromise = this.createNewProfile();
    }
  }

  async loadProfileData() {
    const collection = new Collection(collectionName);
    const profileData = await collection.getDoc(this.id);
    // TODO: if profile with this.id does not exist, create a new profile doc in collection

    if (profileData.name === null || profileData.name === undefined) {
      // const collection = new Collection(collectionName);
      collection.writeDoc(this.id, { name: this.name });
    } else if (this.name !== profileData.name) {
      this.name = profileData.name;
    }

    if (profileData.datasetId === null || profileData.datasetId === undefined) {
      await this.createNewDataset();
    } else {
      this.dataset = new Dataset({
        projectId,
        location,
        datasetId: profileData.datasetId,
      });
    }

    // BUG: model in training is not supposed to have an id ...
    // this.modelInTraining = profileData.modelInTrainingId === null || profileData.modelInTrainingId === undefined ? null : new Model(profileData.modelInTrainingId);
    // TODO: Check if model in training is done(training operation id in profileData). If done, set this.model to the new model and set
    // profileData.labels isInTraining values to false, isTrained values to true.
    this.modelInTraining = null;

    if (profileData.modelId === null || profileData.modelId === undefined) {
      this.model = null;
    } else {
      this.model = new Model({
        projectId,
        location,
        datasetId: this.dataset.getId(),
        modelId: profileData.modelId,
      });
    }

    this.labels = new Map(); // Trained labels have true value. Untrained labels have false value.

    if (profileData.labels !== null && profileData.labels !== undefined) {
      Object.keys(profileData.labels).forEach((key, val) => {
        this.labels.set(
          key,
          new Map([
            ["isTrained", val["isTrained"] === true ? true : false],
            ["isInTraining", val["isInTraining"] === true ? true : false],
          ])
        );
      });
    }
  }

  getInfo() {
    let jsonLabels = {};
    this.labels.forEach((val, key) => {
      jsonLabels[key] = Object.fromEntries(val);
    });

    return {
      id: this.id,
      name: this.name,
      dataset: this.dataset ? this.dataset.getInfo() : null,
      model: this.model ? this.model.getInfo() : null,
      modelInTraining: this.modelInTraining
        ? this.modelInTraining.getInfo()
        : null,
      labels: jsonLabels,
    };
  }

  async createNewProfile() {
    this.labels = new Map();
    this.model = null;
    this.modelInTraining = null;

    this.createNewDataset();
  }

  async createNewDataset() {
    this.dataset = new Dataset({
      projectId,
      location,
    });
    await this.dataset.getCreationPromise();
    const collection = new Collection(collectionName);
    collection.writeDoc(this.id, { datasetId: this.dataset.getId() });
  }

  async createNewModel() {
    this.model = new Model({
      projectId,
      location,
      datasetId: this.dataset.getId(),
    });
    this.model.getTrainingPromise().then(() => {
      const collection = new Collection(collectionName);
      collection.writeDoc(this.id, { modelId: this.model.getId() });
    });
  }

  addLabels(labels) {
    // `labels` is an array of strings.
    labels.forEach((label) => {
      if (this.labels.has(label) === false) {
        this.labels.set(
          label,
          new Map([
            ["isTrained", false],
            ["isInTraining", false],
          ])
        );
      }
    });

    const collection = new Collection(collectionName);
    collection.writeDoc(this.id, { labels: this.labels });
  }

  async trainModel(force) {
    let numUntrainedLabels = 0;
    this.labels.forEach((key, val) => {
      if (val["isTrained"] === false) {
        numUntrainedLabels += 1;
      }
    });

    if (
      (numUntrainedLabels > 0 && this.modelInTraining === null) ||
      force === true
    ) {
      // TODO: if force, then cancel model that is in training before training new model
      // TODO: upload all label training data to dataset
      //   const datasetName = this.id;
      // const dataset = new Dataset(projectId, location, datasetName);

      // labels.forEach(label => {
      //   this.addLabel(label);

      //   const fileName = label + ".csv";
      //   const csvData = createTrainingCSV(await wikipedia.getWikipediaData(topic), label);

      //   const gcsFile = new GCSFile(bucketName, fileName);
      //   await gcsFile.write(csvData);

      //   dataset.importDatasetItems(bucketName, fileName);
      // });
      const modelInTraining = Model(
        projectId,
        location,
        dataset.getId(),
        displayName
      );
      modelInTraining.trainModel();

      // TODO: when a model is done training, update this.labels
    } else {
      if (this.modelInTraining === null) {
        console.log(
          "No new labels were added since the last model was trained. A new model will not be trained."
        );
      } else {
        console.log("Model is currently being trained.");
      }
    }
  }

  classifyPage(url) {
    scrape(url, false);
  }

  getCreationPromise() {
    return this.creationPromise;
  }
}

// const test = async () => {
//   const profile = new Profile({
//     name: "Phewa Niu",
//     id: "tOdjytdGdLI2B5Jjvfnw",
//   });
// };

// test();

module.exports = Profile;
