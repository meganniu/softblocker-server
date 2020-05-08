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

  constructor(name, id) {
    if (id !== undefined) {
      this.id = id; // this.id is the id of the document in Firestore that corresponds to this profile.
      this.name = name;
      this.loadProfileData();
    } else {
      this.id = short.generate();
      this.name = name;

      this.dataset = null;
      this.model = null;
      this.modelInTraining = null;
      this.labels = new Map();

      this.createProfile();
    }
  }

  async loadProfileData() {
    const collection = new Collection(collectionName);
    const profileData = await collection.getDoc(this.id);
    // TODO: if profile with this.id does not exist, create a new profile doc in collection

    if (profileData.name === null || profileData.name === undefined) {
      const collection = new Collection(collectionName);
      collection.writeDoc(this.id, { name: this.name });
    } else if (this.name !== profileData.name) {
      this.name = profileData.name;
    }

    this.dataset =
      profileData.datasetId === null || profileData.datasetId === undefined
        ? this.createNewDataset()
        : new Dataset({
            projectId,
            location,
            datasetId: profileData.datasetId,
          });

    if (profileData.modelId === null || profileData.modelId === undefined) {
      this.model = null;
    } else {
      // TODO: rm await
      await this.dataset.waitForCreationCompletion(() => {
        this.model = new Model({
          projectId,
          location,
          datasetId: this.dataset.getId(),
          modelId: profileData.modelId,
        });
      });
    }

    // BUG: model in training is not supposed to have an id ...
    // this.modelInTraining = profileData.modelInTrainingId === null || profileData.modelInTrainingId === undefined ? null : new Model(profileData.modelInTrainingId);
    this.modelInTraining = null;

    this.labels = new Map(); // Trained labels have true value. Untrained labels have false value.

    console.log(profileData);
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

    console.log(this);
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
    this.dataset.waitForCreationCompletion(() => {
      const collection = new Collection(collectionName);
      collection.writeDoc(this.id, { datasetId: this.dataset.getId() });
    });
  }

  async createNewModel() {
    this.model = new Model({
      projectId,
      location,
      datasetId: this.dataset.getId(),
    });
    this.model.waitForTrainingCompletion(() => {
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
}

const test = async () => {
  const profile = new Profile("Phewa Niu", "tOdjytdGdLI2B5Jjvfnw");
};

test();

module.exports = Profile;
