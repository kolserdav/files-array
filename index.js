const fs = require('fs');
const path = require('path');

// Настройки
const DATA_NAME = './data';
const EXTENSION = '.jpeg';
const DATA_PATH = path.resolve(__dirname, DATA_NAME); // Путь до папки с файлами
const FILE_PREFIX = '_'; // Разбитель в названии файла

/**
 * Функция парсинга директории с выводом JSON строк объектов
 *  частей названия файлов в директории по количеству первых файлов
 *  переданному в аргументе
 * @param {number} count 
 * @returns {Promise<MetadataObjectType>{

      title: "Image 1", // 1 - цифра картинки

      name: "" - исходное имя на сервере

      description: "Static description", // тут все всегда статично, без изменений

      type: "image". // тут всегда подставляется второй элемент из названия картинки 

      parameters:  "Valya, Petya, Kolya", // тут подставляются остальные элементы из названия картинки, сколько бы их ни было, через запятую.

      media: "https://site.ru/images/1.jpeg", // тут цифра картинки используется, как название файла jpeg

      copies: 1, // статичная цифра, всегда равна 1.

  }}
 */
async function parseDir(count) {
  const defRes = {
    id: 0,
    title: 'Image ',
    name: '',
    description: 'Static description',
    type: 'image',
    parameters: '',
    media: 'https://site.ru/images',
    copies: 1,
  };
  const files = await new Promise((resolve, reject) => {
    fs.readdir(DATA_PATH, (e, r) => {
      if (e) {
        console.error(`Reading directory "${DATA_PATH}" error `);
        reject(e);
      }
      resolve(r);
    });
  });

  /**
   * 
   * @param {MetadataObjectType} res 
   * @returns {Promise<null | Error>}
   */
  function deleteFile(res) {
    return new Promise((resolve, reject) => {
      const reg = res.media.replace(new RegExp(`${defRes.media}/`), '');
      const filePath = path.resolve(__dirname, `${DATA_NAME}/${res.name}`);
      console.log(reg, 22)
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
   * Функция создания одного массива файла
   * проходит по объекту метаданных для заполнения массива
   * @param {MetadataObjectType} dataObj
   * @returns {[JSONString<MetadataObjectType>]} 
   */
  
  function createFileArray(dataObj) {
    const keys = Object.keys(dataObj);
    const resObj = Object.assign({}, dataObj);
    for (let i = 0; keys[i]; i++) {
      const key = keys[i];
      switch(key) {
        case 'media':
            resObj.media = `${dataObj.media}/${clearExt(dataObj.name)}${EXTENSION}`;
          break;
        default:
        
      }
    }
    return resObj;
  }

  /**
   * Очищает расширение в строке
   * @param {string} fileTail 
   * @returns {string}
   */
  function clearExt(fileTail) {
    return fileTail.replace(/\.[A-Za-z0-9]*$/, '');
  }

  const result = [];
  // проход по файлам папки
  for (let i = 0; files[i] && i < count; i++) {
    const oneFile = files[i];
    const fileTails = oneFile.split(FILE_PREFIX);
    const res = Object.assign({}, defRes);
    res.parameters = '';
    // проход по частям названия файла с разбителем FILE_PREFIX
    for (let n = 0; fileTails[n]; n++) {
      const fileTail = fileTails[n];
      switch (n) {
        case 0:
          // title
          res.id = parseInt(fileTail, 10);
          res.title = `${defRes.title} ${res.id}`;
          break;
        case 1:
          // type
          res.type = fileTail;
          break;
        default:
          let param = '';
          if (!fileTails[i + 1]) {
            param = `, ${fileTail}`;
          } else {
            param = `, ${clearExt(fileTail)}`
          }
          res.parameters += param;
      }
    }
    res.parameters = res.parameters.replace(/^, /, '');
    res.name = oneFile.replace(EXTENSION, '');
    const _result = createFileArray(res);
    deleteFile(_result);
    result.push(_result);
  }
  return result;
}

(async () => {
  const result = await parseDir(5);
  if (result.length === 0) {
    console.warn(`Files not found in ${DATA_PATH}`);
  }
  console.log(result);
})()