const { writeFile, mkdirSync } = require('fs');
const { exec } = require('child_process');
const path = require('path');

const command = 'sls invoke local -f api --data \'{ "path": "/index" }\'';

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


getData
  .then(console.log)
  .catch((err) => {
    console.log(err);
  });
