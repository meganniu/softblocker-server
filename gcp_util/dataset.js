// Imports the Google Cloud AutoML library
const { AutoMlClient } = require("@google-cloud/automl").v1;

// Instantiates a client
const client = new AutoMlClient();

class Dataset {
  constructor(projectId, location, displayName) {
    this.projectId = projectId;
    this.location = location;
    this.displayName = displayName;
    this.name = null;
    this.id = null;
    this.created = false;
  }
  async createDataSet() {
    if (this.created === false) {
      // Construct request
      const request = {
        parent: client.locationPath(this.projectId, this.location),
        dataset: {
          displayName: this.displayName,
          textClassificationDatasetMetadata: {
            classificationType: "MULTICLASS",
          },
        },
      };

      // Create dataset
      const [operation] = await client.createDataset(request);

      // Wait for operation to complete.
      const [response] = await operation.promise();

      this.name = response.name;
      this.id = response.name
        .split("/")
        [response.name.split("/").length - 1].split("\n")[0];
      this.created = true;

      console.log(`Dataset name: ${this.name}`);
      console.log(`Dataset id: ${this.id}`);
    } else {
      console.log(`Dataset ${this.name} has already been created.`);
    }
  }

  async uploadDataSetItems(bucketName, fileName) {
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
    console.log("Dataset imported:", response);
  }

  getId() {
    return this.id;
  }
}

module.exports = Dataset;
