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
    await this.collectionRef
      .doc(docId)
      .get()
      .then((docRef) => (docData = docRef.data()));
    return docData;
  }

  async writeDoc(docId, docData) {
    // If merge = true, existing fields in doc preserved and docData replaces conflicting fields and adds new fields.
    // If merge = false or unset, existing fields are all deleted and replaced with docData.
    await this.collectionRef
      .doc(docId)
      .set(docData, { merge: true })
      .catch((err) => {
        throw err;
      });
  }
}

// const test = async () => {
//   const collectionName = "profiles";
//   const docId = "f0NMjg0XLjQAiZzJvIE9";
//   const collection = new Collection(collectionName);

//   console.log(await collection.getDoc(docId));
//   await collection.writeDoc(docId, {
//     labels: ["Homer"],
//   });
//   console.log(await collection.getDoc(docId));
// };

// test();

module.exports = Collection;
