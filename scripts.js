const fs = require('fs');
const path = require('path');
const DATA_PATH = path.resolve(__dirname, './data');

(async () => {
  for (let i = 0; i < 100; i++) {
    fs.writeFileSync(`${DATA_PATH}/${i}_dssd_dsds_dsds_Ds`, ' ');
  }
})();
