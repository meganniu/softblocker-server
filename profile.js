class Profile {
    // TODO: figure out how member fields of object are initialized
    //       can I just list them in one place instead of listing them in both ctors?
  constructor(){
      // TODO: impl default constructor
      // TODO: create a data set in gcp if profile doesn't already exist in db
  }

  constructor(id) {
    this.name = null;
    this.id = id;
    this.labels = new Map(); // Active labels have true value. Inactive labels have false value.
    this.model = null;
    this.dataset = null;

    // TODO: query db to see if profile already exists
    //       if dne, call default ctor
  }

  addLabel(label) {
    if (!this.labels.has(label)) {
      // TODO: add data for label to data set for training
    }
    this.labels.set(label) = true;
  }

  removeLabel(label) {
    if (this.labels.has(label)) {
      this.labels.set(label) = false;
    }
  }

  // TODO: make methods to train model. method should be called infrequently bc it is v expensive
}

module.exports = Profile;
