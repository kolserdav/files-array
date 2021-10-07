const dotenv = require('dotenv');
dotenv.config();

const { FIRESTORE_DATABASE_NAME, FIRESTORE_COLLECTION_NAME } = process.env;

const admin = require('firebase-admin');

const serviceAccount = require('./s.json');

admin.initializeApp({
  projectId: FIRESTORE_DATABASE_NAME,
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${FIRESTORE_DATABASE_NAME}.firebaseio.com`,
});

const db = admin.firestore();

/**
 * Получение списка из базы данных
 * @param {number} count
 * @returns {MetadataObjectType[]}
 */
async function getFromDb(count) {
  db.collection(FIRESTORE_COLLECTION_NAME)
    .get()
    .then((snap) => {
      console.log(34, snap.size);
    });
  /*const newCol = collection(db, FIRESTORE_COLLECTION_NAME);
  const q = query(newCol, limit(count));
  const snapShot = await getDocs(q);
  const result = [];
  const array = [];
  for (let i = 0; snapShot.docs[i]; i++) {
    const item = snapShot.docs[i];
    const id = item._document.key.path.segments[6];
    const data = item.data();
    array.push(data.id);
    result.push(data);
    deleteDoc(doc(db, FIRESTORE_COLLECTION_NAME, id));
  }
  return { result, array };*/
  console.log(1);
}

getFromDb();
