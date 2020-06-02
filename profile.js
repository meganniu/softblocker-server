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
const collection = new Collection(collectionName);

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
      this.topics = new Map();

      this.creationPromise = this.createNewProfile();
    }
  }

  async loadProfileData() {
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
    // profileData.topics isInTraining values to false, isTrained values to true.
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

    // Load map of topics and their training status.
    this.topics = new Map();
    const isTrainedKey = "isTrained";
    const isInTrainingKey = "isInTraining";

    for (var topic in profileData.topics) {
      if (profileData.topics.hasOwnProperty(topic)) {
        this.topics.set(
          topic,
          new Map([
            [
              isTrainedKey,
              profileData.topics[topic].hasOwnProperty(isTrainedKey)
                ? profileData.topics[topic][isTrainedKey]
                : false,
            ],
            [
              isInTrainingKey,
              profileData.topics[topic].hasOwnProperty(isInTrainingKey)
                ? profileData.topics[topic][isInTrainingKey]
                : false,
            ],
          ])
        );
      }
    }
  }

  getTopics() {
    let topics = {};
    this.topics.forEach((val, key) => {
      topics[key] = Object.fromEntries(val);
    });

    return topics;
  }

  getInfo() {
    return {
      id: this.id,
      name: this.name,
      dataset: this.dataset ? this.dataset.getInfo() : null,
      model: this.model ? this.model.getInfo() : null,
      modelInTraining: this.modelInTraining
        ? this.modelInTraining.getInfo()
        : null,
      topics: this.getTopics(),
    };
  }

  async createNewProfile() {
    this.topics = new Map();
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
    collection.writeDoc(this.id, { datasetId: this.dataset.getId() });
  }

  async createNewModel() {
    this.model = new Model({
      projectId,
      location,
      datasetId: this.dataset.getId(),
    });
    this.model.getTrainingPromise().then(() => {
      collection.writeDoc(this.id, { modelId: this.model.getId() });
    });
  }

  async addTopic(topic) {
    // `topics` is an array of strings.
    if (this.topics.has(topic) === false) {
      this.topics.set(
        topic,
        new Map([
          ["isTrained", false],
          ["isInTraining", false],
        ])
      );

      await collection.writeDoc(this.id, { topics: this.getTopics() });
    }
  }

  async trainModel(force) {
    let numUntrainedTopics = 0;
    this.topics.forEach((val, key) => {
      if (val.get("isTrained") === false) {
        ++numUntrainedTopics;
      }
    });

    // If dataset is created for profile and either training is forced on there is more than one untrained topics, train
    // a new model.
    if (
      this.dataset.getId() &&
      ((numUntrainedTopics > 0 && this.modelInTraining === null) ||
        force === true)
    ) {
      // TODO: if force, then cancel model that is in training before training new model

      // Upload training data of untrained topics to dataset.
      let dataImportPromise = Promise.resolve();
      this.topics.forEach(async (val, topic) => {
        if (!val.get("isTrained") && !val.get("isInTraining")) {
          const fileName = topic + ".csv";
          const csvData = createTrainingCSV(
            await wikipedia.getWikipediaData(topic),
            topic
          );

          const gcsFile = new GCSFile(bucketName, fileName);
          await gcsFile.write(csvData);
          this.topics.get(topic).set("isInTraining", true);

          // GCP requires that an upload to a dataset must complete before starting another one.
          dataImportPromise = dataImportPromise.then(() => {
            return this.dataset
              .importDatasetItems(bucketName, fileName)
              .catch((error) => {
                console.log(error);
                this.topics.get(topic).set("isInTraining", false); // If upload of topic data fails, topic will not be trained.
              });
          });
        }
      });

      dataImportPromise
        .then(() => {
          this.modelInTraining = new Model({
            projectId,
            location,
            datasetId: this.dataset.getId(),
          });
          return modelInTraining.getTrainingPromise();
        })
        .then((res) => {
          // Set isTrained to true when topic finished training.
          this.topics.forEach(async (val, topic) => {
            if (val["isInTraining"]) {
              this.topics.get(topic).set("isInTraining", false);
              this.topics.get(topic).set("isTrained", true);
            }
          });

          // Write
          return collection.writeDoc(this.id, { topics: this.getTopics() });
        })
        .catch((error) => {
          console.log(error);

          // If model training fails, topic will not be trained.
          this.topics.forEach(async (val, topic) => {
            if (val["isInTraining"]) {
              this.topics[topic]["isInTraining"] = false;
              this.topics[topic]["isTrained"] = false;
            }
          });

          collection.writeDoc(this.id, { topics: this.getTopics() });
        });
    } else {
      if (this.modelInTraining === null) {
        console.log(
          "No new topics were added since the last model was trained. A new model will not be trained."
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
