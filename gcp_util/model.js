const {
  AutoMlClient,
  PredictionServiceClient,
  Operations,
} = require("@google-cloud/automl").v1;

class Model {
  constructor(projectId, datasetId, location, modelName, modelId) {
    this.projectId = projectId;
    this.datasetId = datasetId;
    this.location = location;
    this.trainingInProgress = false;
    this.trainingOperation = null;
    this.name = modelName; // TODO: what if the model name is not correct? i.e. modelName not actually associated with modelId on gcp
    // TODO: sanitize modelName... gcp has weired requirements abt display names
    // display name: only allowed ones are ASCII Latin letters A-Z and a-z, an underscore (_), and ASCII digits 0-9

    if (modelId === undefined) {
      this.id = null;
      this.trainModel();
    } else {
      this.id = modelId;
      // TODO: check that model with ID actually exists
    }
  }

  async trainModel() {
    if (this.id === null && this.trainingInProgress === false) {
      // Instantiates a client
      const client = new AutoMlClient();

      // Construct request
      const request = {
        parent: client.locationPath(this.projectId, this.location),
        model: {
          displayName: this.name,
          datasetId: this.datasetId,
          textClassificationModelMetadata: {}, // Leave unset, to use the default base model
        },
      };

      // Don't wait for the LRO
      const [operation] = await client.createModel(request);
      this.id = operation.metadata.id;
      this.trainingInProgress = true;
      this.trainingOperation = operation;

      console.log(`Training started...`, operation);
      console.log(`Training operation name: ${operation.name}`);

      // TODO: figure out how to use Operations. needs to be initialized with rpc impl (???) 
      // api: https://cloud.google.com/automl/docs/reference/rest/v1beta1/projects.locations.operations/wait
      // js api: https://googleapis.dev/nodejs/automl/latest/google.longrunning.Operations.html#waitOperation1
      const operations = new Operations() 
      operations.waitOperation({ name: this.name }, (err, response) => {
        this.trainingInProgress = false;

        if (err) {
          this.id = null;
          throw err;
        }
      });
    } else {
      if (this.trainingInProgress === true) {
        console.log(`Currently training model ${this.name} (ID: ${this.id}).`);
      } else {
        console.log(
          `Training already compeleted for model ${this.name} (ID: ${this.id}).`
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

    // for (const annotationPayload of response.payload) {
    //   console.log(`Predicted class name: ${annotationPayload.displayName}`);
    //   console.log(
    //     `Predicted class score: ${annotationPayload.classification.score}`
    //   );
    // }

    return response.payload.map((el) => {
      return { label: el.displayName, score: el.classification.score };
    });
  }
}

const scrape = require("../scrape/scrape.js");

const test = async () => {
  const model = new Model(
    "softblocker",
    "TCN1195179034997161984",
    "us-central1",
    "test_3"
    // "TCN5269559009697857536"
  );

  // console.log(
  //   await model.classifyData(
  //     // await scrape("https://www.youtube.com/watch?v=1e7gy3fsJa8", false) // homer
  //     await scrape("https://www.youtube.com/watch?v=VunWdHCjbI8", false) // homer simpson
  //   )
  // );
};

test();

module.exports = Model;
