const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Настройка окружения
dotenv.config();

// подключение доп файлов
const { database } = require('./utils');

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
const { FIREBASE_PROJECT_ID, FIRESTORE_COLLECTION_NAME } = process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_PROJECT_ID) {
  console.error('File .env not specified, see .env.example');
}

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
    const fileName = oneFile.replace(EXTENSION, '');
    const _result = changeOneField(res, fileName);
    deleteFile(_result, fileName);
    result.push(_result);
  }
  return result;
}

/**
 * Старт
 */
(async () => {
  const result = await parseDir(5);
  if (result.length === 0) {
    console.warn(`Files not found in ${DATA_PATH}`);
  }
  const db = await database(FIREBASE_PROJECT_ID, FIRESTORE_COLLECTION_NAME);
  let success = 0;
  result.map(async (oneObj) => {
    const res = await db.addToDb(oneObj);
    if (!res) {
      console.warn(`Add to db result is ${res}`);
    } else {
      success++;
      console.info(`Success packs: ${success} from ${result.length}`);
    }
    console.info('Result ', result);
  });
})();
