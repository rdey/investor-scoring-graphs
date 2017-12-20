const { writeFile, mkdirSync } = require('fs');
const { exec } = require('child_process');
const path = require('path');

const command = 'sls invoke local -f api --data \'{ "path": "/pie" }\'';

const ps = exec(command);

const getData = new Promise((resolve, reject) => {
  let rawJData = '';
  ps.stdout.on('data', (data) => {
    try {
      rawJData += data;
      const jData = JSON.parse(rawJData);
      if (jData) {
        resolve(jData);
        ps.kill();
      }
    } catch (err) {
      /* unecpected end of JSON input */
    }
  });
  ps.on('error', () => {
    try {
      reject();
      ps.kill();
    } catch (err) {
      /* nothing */
    }
  });
});

const writePNG = ({ body }) =>
  new Promise((resolve) => {
    // const dataURL = `data:image/png;base64,${body}`;
    // console.log(dataURL);

    const tmpDirectory = path.join(__dirname, 'testing_tmp');

    try {
      mkdirSync(tmpDirectory);
    } catch (err) {
      /* folder exists */
    }

    const pngPath = path.join(tmpDirectory, 'test.png');
    const pngData = Buffer.from(body, 'base64');
    writeFile(pngPath, pngData, () => {
      resolve(pngPath);
    });
  });

getData
  .then(writePNG)
  .then((imgPath) => {
    const openChromeCommand = `open -a "Preview" ${imgPath}`;
    exec(openChromeCommand, () => {});
  })
  .catch((err) => {
    console.log(err);
  });
