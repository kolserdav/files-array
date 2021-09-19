const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Настройка окружения
dotenv.config();

// Настройки
const DATA_NAME = './data'; // релативный путь до папки с файлами
const EXTENSION = '.jpeg'; // добавляемое расширение
const FILE_PREFIX = '_'; // Разбитель в названии файла
const DEFAULT_METADATA_OBJECT = {
  id: 0,
  title: 'Image ',
  description: 'Static description',
  type: 'image',
  parameters: '',
  media: 'https://site.ru/images',
  copies: 1,
}; // Образец данных по умолчанию

// Константы
const DATA_PATH = path.resolve(__dirname, DATA_NAME); // Путь до папки с файлами
const { FIRESTORE_DATABASE_NAME, FIRESTORE_COLLECTION_NAME } = process.env;
if (!FIRESTORE_DATABASE_NAME || !FIRESTORE_DATABASE_NAME) {
  console.error('File .env not specified, see .env.example');
}

// Подключение к базе данных
const databaseConfig = {
  projectId: FIRESTORE_DATABASE_NAME,
  databaseURL: `https://${FIRESTORE_DATABASE_NAME}.firebaseio.com`,
};
const app = initializeApp(databaseConfig);

const db = getFirestore(app);
const colDb = collection(db, FIRESTORE_COLLECTION_NAME);

/**
 * Глобальные функции
 * @interface MetadataObjectType {

      title: "Image 1", // 1 - цифра картинки

      description: "Static description", // тут все всегда статично, без изменений

      type: "image". // тут всегда подставляется второй элемент из названия картинки 

      parameters:  "Valya, Petya, Kolya", // тут подставляются остальные элементы из названия картинки, сколько бы их ни было, через запятую.

      media: "https://site.ru/images/1.jpeg", // тут цифра картинки используется, как название файла jpeg

      copies: 1, // статичная цифра, всегда равна 1.

  };
 * @returns
 */

/**
 * Глобальная функция парсинга директории с выводом JSON строк объектов
 *  частей названия файлов в директории по количеству первых файлов
 *  переданному в аргументе
 * @param {number} count
 * @returns {Promise<MetadataObjectType[]>}
 */
async function parseDir(count) {
  /**
   * Встроенная функция
   * @param {MetadataObjectType} res
   * @param {string} name
   * @returns {Promise<null | Error>}
   */
  function deleteFile(res, name) {
    return new Promise((resolve, reject) => {
      const filePath = path.resolve(__dirname, `${DATA_NAME}/${name}`);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error delete files ', err.message);
          reject(err);
        }
        resolve(null);
      });
    });
  }

  /**
   * Встроенная функция
   * Функция создания одного массива файла
   * проходит по объекту метаданных для заполнения массива
   * @param {MetadataObjectType} dataObj
   * @param {string} name
   * @returns {[JSONString<MetadataObjectType>]}
   */

  function changeOneField(dataObj, name) {
    const keys = Object.keys(dataObj);
    const resObj = Object.assign({}, dataObj);
    for (let i = 0; keys[i]; i++) {
      const key = keys[i];
      switch (key) {
        case 'media':
          resObj.media = `${dataObj.media}/${clearExt(name.split(FILE_PREFIX)[0])}${EXTENSION}`;
          break;
        default:
      }
    }
    return resObj;
  }

  /**
   * Встроенная функция
   * Очищает расширение в строке
   * @param {string} fileTail
   * @returns {string}
   */
  function clearExt(fileTail) {
    return fileTail.replace(/\.[A-Za-z0-9\w]*$/, '');
  }

  /**
   * Скрипты
   */

  let _count = count;
  const files = await new Promise((resolve, reject) => {
    fs.readdir(DATA_PATH, (e, r) => {
      if (e) {
        console.error(`Reading directory "${DATA_PATH}" error `);
        reject(e);
      }
      resolve(r);
    });
  });
  if (files.length < count) {
    _count = files.length;
  }

  const result = [];
  // проход по файлам папки
  for (let i = 0; files[i] && i < _count; i++) {
    const oneFile = files[i];
    // если наименование файла не соответствует, то он пропускается
    if (!oneFile.match(/^\d+_/)) {
      continue;
    }
    const fileTails = oneFile.split(FILE_PREFIX);
    const res = Object.assign({}, DEFAULT_METADATA_OBJECT);
    res.parameters = '';
    // проход по частям названия файла с разбителем FILE_PREFIX
    for (let n = 0; fileTails[n]; n++) {
      const fileTail = fileTails[n];
      let param = '';
      switch (n) {
        case 0:
          // title
          res.id = parseInt(fileTail, 10);
          res.title = `${DEFAULT_METADATA_OBJECT.title} ${res.id}`;
          break;
        case 1:
          // type
          res.type = fileTail;
          break;
        default:
          if (!fileTails[i + 1]) {
            param = `, ${fileTail}`;
          } else {
            param = `, ${clearExt(fileTail)}`;
          }
          if (n !== 1) {
            res.parameters += param;
          }
      }
    }
    /**
     * Завершающие чистки и правки готового объекта
     * смена выборочных полей
     * удаление файла и возврат результата
     */
    res.parameters = res.parameters.replace(/^, /, '');
    res.parameters = res.parameters.replace(/\.[a-zA-Z0-9]*$/, '');
    const fileName = oneFile.replace(EXTENSION, '');
    const _result = changeOneField(res, fileName);
    if (_result) {
      deleteFile(_result, fileName);
    }
    result.push(_result);
  }
  return result;
}

/**
 * Служебные функции
 */

/**
 *
 * @param {MetadataObjectType[] | MetadataObjectType} doc
 * @returns {DocumentReference}
 */
async function addToDb(doc) {
  return await addDoc(colDb, doc);
}

/**
 * Старт
 */
(async () => {
  const arg = process.argv[2];
  const argNum = parseInt(arg, 10);
  if (isNaN(argNum)) {
    console.warn(`Third argument must be a number received ${arg}`);
    return;
  }
  const result = await parseDir(argNum);
  if (result.length === 0) {
    console.warn(`Files not found in ${DATA_PATH}`);
  }
  let success = 0;
  result.map(async (oneObj) => {
    const res = await addToDb(oneObj);
    console.info('Results: ', result);
    if (!res) {
      console.warn(`Add to db result is ${res}`);
    } else {
      success++;
      console.info(`Success packs: ${success} from ${result.length}`);
    }
    process.exit(0);
  });
})();
