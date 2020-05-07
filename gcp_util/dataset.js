// Imports the Google Cloud AutoML library
const { AutoMlClient } = require("@google-cloud/automl").v1;

// Instantiates a client
const client = new AutoMlClient();

class Dataset {
  constructor(projectId, location, datasetName, datasetId) {
    this.projectId = projectId;
    this.location = location;
    this.name = datasetName;
    this.creationInProgress = false;
    if (datasetId === undefined) {
      this.id = null;
      this.createDataset();
    } else {
      // TODO: check that dataset wit id actually exists
      this.id = datasetId;
      this.creationPromise = Promise.resolve(); //TODO: assign a dummy resolved promise
    }
  }

  async createDataset() {
    if (this.id === null && this.creationInProgress === false) {
      this.creationInProgress = true;
      // Construct request
      const request = {
        parent: client.locationPath(this.projectId, this.location),
        dataset: {
          displayName: this.name,
          textClassificationDatasetMetadata: {
            classificationType: "MULTICLASS",
          },
        },
      };

      this.creationPromise = client
        .createDataset(request)
        .then(([operation]) => operation.promise())
        .then(([response]) => {
          this.id = response.name
            .split("/")
            [response.name.split("/").length - 1].split("\n")[0];
          this.creationInProgress = false;

          console.log(`Dataset name: ${this.name}`);
          console.log(`Dataset id: ${this.id}`);
        });
    } else {
      if (this.creationInProgress === true) {
        console.log(`Dataset ${this.name} (ID: ${this.id}) is being created.`);
      } else {
        console.log(
          `Dataset ${this.name} (ID: ${this.id}) has already been created.`
        );
      }
    }
  }

  async importDatasetItems(bucketName, fileName) {
    this.creationPromise.then(async () => {
      const path = `gs://${bucketName}/${fileName}`;
      const request = {
        name: client.datasetPath(this.projectId, this.location, this.id),
        inputConfig: {
          gcsSource: {
            inputUris: path.split(","),
          },
        },
      };

      // Import dataset
      console.log("Proccessing import");
      const [operation] = await client.importData(request);

      // Wait for operation to complete.
      const [response] = await operation.promise();
      console.log(`Dataset imported: ${response}`);
    });
  }

  getId() {
    return this.id;
  }
}

// const test = () => {
//   dataset = new Dataset("softblocker", "us-central1", "test_4");
//   dataset.importDatasetItems("softblocker-lcm", "Homer.csv");
// };

// test();

module.exports = Dataset;
