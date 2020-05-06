const {
  AutoMlClient,
  PredictionServiceClient,
} = require("@google-cloud/automl").v1;

class Model {
  constructor(projectId, location, datasetId, displayName) {
    this.projectId = projectId;
    this.location = location;
    this.datasetId = datasetId;
    this.displayName = displayName;
    this.trainingInProgress = false;
    this.id = null;
    this.name = null;
  }

  async trainModel() {
    if (!this.id) {
      // Instantiates a client
      const client = new AutoMlClient();

      // Construct request
      const request = {
        parent: client.locationPath(this.projectId, this.location),
        model: {
          displayName: this.displayName,
          datasetId: this.datasetId,
          textClassificationModelMetadata: {}, // Leave unset, to use the default base model
        },
      };

      // Don't wait for the LRO
      const [operation] = await client.createModel(request);
      this.id = operation.metadata.id;
      this.name = operation.name;
      this.trainingInProgress = true;

      console.log(`Training started...`, operation);
      console.log(`Training operation name: ${operation.name}`);

      client.waitOperation({ name: this.name }, (err, response) => {
        if (err) {
          console.log(err);
          this.id = null;
          this.name = null;
        }
        this.trainingInProgress = false;
      });

      return operation;
    } else {
      if (this.trainingInProgress === true) {
        console.log(`Currently training model ${this.name} (ID: ${this.id}).`);
      } else {
        console.log(
          `Training compeleted for model ${this.name} (ID: ${this.id}).`
        );
      }
    }
  }

  async classifyData(data) {
    // Instantiates a client
    const client = new PredictionServiceClient();

    // Construct request
    const request = {
      name: client.modelPath(this.projectId, this.location, this.id),
      payload: {
        textSnippet: {
          content: data,
          mimeType: "text/plain",
        },
      },
    };

    const [response] = await client.predict(request);

    for (const annotationPayload of response.payload) {
      console.log(`Predicted class name: ${annotationPayload.displayName}`);
      console.log(
        `Predicted class score: ${annotationPayload.classification.score}`
      );
    }

    // TODO: figure out what to return
  }
}

// const model = new Model(
//   "softblocker",
//   "us-central1",
//   "TCN1195179034997161984",
//   "model_1"
// );
// model.trainModel();

module.exports = Model;
