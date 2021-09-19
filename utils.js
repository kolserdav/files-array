const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  getDoc,
  refEqual,
} = require('firebase/firestore/lite');

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
    console.log(count);
    // TODOO
    const newCol = collection(db, collectionName);
    const snapShot = await getDocs(newCol);
    const list = snapShot.docs.map((doc) => doc.data());
    return list;
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
