const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  getDoc,
  refEqual,
} = require('firebase/firestore');

/**
 * @param {void}
 * @returns {
 *  getFromDb: async function (count: number ): MetadataObjectType[]
 *  addToDb: async function (doc: MetadataObjectType[] | MetadataObjectType): DocumentReference
 * }
 */
async function database(projectId, collectionName) {
  const databaseConfig = {
    projectId: projectId,
    databaseURL: `https://${projectId}.firebaseio.com`,
  };
  /**
   * Инициализирует админ сессию приложения
   */
  const app = initializeApp(databaseConfig);

  const db = getFirestore(app);
  const colDb = collection(db, collectionName);

  /**
   * Получение списка из базы данных
   * @param {number} count
   * @returns {MetadataObjectType[]}
   */
  async function getFromDb(count) {
    const newCol = collection(db, collectionName);
    const snapShot = await getDocs(newCol);
    let result = [];
    for (let i = 0; snapShot.docs[i] && i < count; i++) {
      const item = snapShot.docs[i];
      const id = item._document.key.path.segments[6];
      result.push(item.data());
      deleteDoc(doc(db, collectionName, id));
    }
    return result;
  }

  /**
   *
   * @param {MetadataObjectType[] | MetadataObjectType} doc
   * @returns {DocumentReference}
   */
  async function addToDb(doc) {
    return await addDoc(colDb, doc);
  }

  return { getFromDb, addToDb };
}

module.exports = { database };
