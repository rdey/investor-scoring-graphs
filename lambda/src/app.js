const Express = require('express');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const ssrArc = require('../ssrArc');
const ssrPolarPie = require('../ssrPolarPie');
const path = require('path');
const axios = require('axios');
const { fromJS } = require('immutable');

const { createCanvas, registerFont } = require('canvas');
const fontDir = path.join(__dirname, 'assets/fonts');
registerFont(path.join(fontDir, 'Oswald/Oswald-Light.ttf'), {
  family: 'Oswald',
  weight: 300,
});
registerFont(path.join(fontDir, 'Oswald/Oswald-Regular.ttf'), {
  family: 'Oswald',
  weight: 400,
});
registerFont(path.join(fontDir, 'Libre_Franklin/LibreFranklin-Regular.ttf'), {
  family: 'Libre Franklin',
  weight: 400,
});

const app = new Express();

app.use(awsServerlessExpressMiddleware.eventContext());
app.set('view engine', 'html');

// const assetDir = path.join(__dirname, 'assets');
const time = () => {
  const date = new Date();
  return date.getTime();
};

let storeCache = false;
let lastRequested = 0;

const apiDomain = 'https://www.redeye.se';

// app.use('/assets', Express.static(assetDir, { index: false }));
const requestLatestScored = (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=600');
  res.setHeader('Expires', new Date(Date.now() + 600 * 1000).toUTCString());

  const origin = req.get('origin');
  if (
    origin &&
    origin
      .match(/^http(|s):\/\/.*(localhost:8000|herokuapp\.com|redeye.se)$/)
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  const currentTime = time();
  if (currentTime - lastRequested > 30 * 1000) { /* 30 seconds of cache */
    let scores = null;
    let questions = null;
    axios
      .get(`${apiDomain}/api/v1/investor-scoring/recent-companies`)
      .then(({ data }) => {
        scores = data;
        return axios.get(`${apiDomain}/api/v1/investor-scoring/questions`);
      })
      .then(({ data }) => {
        questions = data;

        lastRequested = time();

        storeCache = fromJS({
          questions,
          scores,
        });
        req.store = storeCache;
        next();
      })
      .catch(() => {
        req.store = storeCache;
        next();
      });
  } else {
    req.store = storeCache;

    next();
  }
};
app.use('/lazy/*', requestLatestScored);

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

const setScoreByIndex = (s, index) => {
  let i = index;
  const ids = s.get('scores').keySeq();

  if (i > ids.size - 1) {
    i = ids.size - 1;
  } else if (i < 0) {
    i = 0;
  }

  const res = s.set('scores', s.getIn(['scores', ids.get(i)]));
  return res;
};

app.get('/lazy/index', (req, res) => {
  if (!req.store) {
    res.status(500);
    res.send('There was an error when requesting the api endpoint');
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  const keySeq = req.store.get('scores').keySeq();
  res.send(
    JSON.stringify(
      req.store
        .get('scores')
        .map((ob, key) => {
          const index = keySeq.indexOf(key);
          return {
            arc: `/arc/${index}`,
            pie: `/pie/${index}`,
            name: `${ob.get('name')}`,
            slug: `${ob.get('slug')}`,
          };
        })
        .toJS()
    )
  );
});

const getPie = ({ store, scaling = 1 }) => {
  const width = 300 * scaling;
  const height = 300 * scaling;
  const canvas = createCanvas(width, height);
  ssrPolarPie({
    width,
    height,
    canvas,
    scaling,
    store,
  });
  return canvas;
};

const getArc = ({ store, scaling = 1 }) => {
  const width = 300 * scaling;
  const height = 238.25 * scaling;
  const canvas = createCanvas(width, height);
  ssrArc({
    width,
    height,
    canvas,
    scaling,
    store,
  });
  return canvas;
};

/* LAZY ARC */
app.get('/lazy/arc/:index/:scaling', (req, res) => {
  if (!req.store) {
    res.status(500);
    res.send('There was an error when requesting the api endpoint');
    return;
  }
  const { index, scaling } = req.params;

  const canvas = getArc({ store: setScoreByIndex(req.store, index), scaling });

  res.setHeader('Content-Type', 'image/png');
  canvas.pngStream().pipe(res);
});

/* LAZY PIE */
app.get('/lazy/pie/:index/:scaling', (req, res) => {
  if (!req.store) {
    res.status(500);
    res.send('There was an error when requesting the api endpoint');
    return;
  }
  const { index, scaling } = req.params;

  const canvas = getPie({ store: setScoreByIndex(req.store, index), scaling });

  res.setHeader('Content-Type', 'image/png');
  canvas.pngStream().pipe(res);
});

/* GENERATE */
app.get('/generate/arc/:base64', (req, res) => {
  const store = fromJS(JSON.parse(decodeURIComponent(req.params.base64)));

  const canvas = getArc({ store });

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'max-age: 600');
  canvas.pngStream().pipe(res);
});

module.exports = app;
