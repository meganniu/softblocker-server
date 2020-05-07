const admin = require("firebase-admin");

const serviceAccount = require("../softblocker.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

class Collection {
  constructor(name) {
    this.name = name;
    this.collectionRef = admin.firestore().collection(this.name);
  }

  async getDoc(docId) {
    let docData = null;
    await this.collectionRef.doc(docId).get().then((docRef) => docData = docRef.data());
    return docData;
  }
}

// const test = async () => {
//   const collectionName = "profiles";
//   const docId = "f0NMjg0XLjQAiZzJvIE9";
//   const collection = new Collection(collectionName);

//   console.log(await collection.getDoc(docId));
// };

// test();

module.exports = Collection;
