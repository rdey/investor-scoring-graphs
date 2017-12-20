const keys = require('lodash/keys');
const assign = require('lodash/assign');
const {
  RELIABLE_INVESTOR_COMMUNICATIONS_QUESTION,
  SENTIMENT_CATEGORY,
  EXPECTATIONS_ON_FAVORABLE_CATALYSTS_QUESTION,
  ATTRACTIVE_COMPANY_VALUATION_QUESTION,
} = require('./constants');

module.exports = (scores) => {
  console.log(scores);
  const group1 = keys(scores.results)
    .filter((key) => key !== SENTIMENT_CATEGORY)
    .reduce((o, key) => {
      const addition = {};
      addition[key] = {
        title: scores.results[key].title,
        values: {
          score: scores.results[key].averageScore,
          reference: scores.results[key].averageReferenceScore,
        },
      };
      return assign({}, o, addition);
    }, {});

  const irScores = scores.results[SENTIMENT_CATEGORY].details;

  const group2 = keys(irScores).reduce((o, key) => {
    const addition = {};
    addition[key] = {
      title: irScores[key].title,
      values: {
        score: irScores[key].score,
        reference: irScores[key].reference,
      },
    };
    return assign({}, o, addition);
  }, {});

  const groups = assign(group1, group2);
  delete groups[RELIABLE_INVESTOR_COMMUNICATIONS_QUESTION]; // IR
  groups[EXPECTATIONS_ON_FAVORABLE_CATALYSTS_QUESTION].title = 'Catalysts';
  groups[ATTRACTIVE_COMPANY_VALUATION_QUESTION].title = 'Valuation';

  const ip = {};
  const valueTitleMap = {
    invest: 'Invest',
    divest: 'Divest',
    nothing: 'Nothing',
  };

  const valueColorMap = {
    invest: 'rgba(45, 178, 131, 1)',
    divest: 'rgba(255, 255, 255, 1)',
    nothing: 'rgba(246, 57, 3, 1)',
  };

  keys(scores.investmentPlan).forEach((groupId) => {
    keys(scores.investmentPlan[groupId]).forEach((valueId) => {
      const addition = {};
      addition[valueId] = {
        value: scores.investmentPlan[groupId][valueId],
        title: valueTitleMap[valueId],
        color: valueColorMap[valueId],
      };
      ip[groupId] = assign(ip[groupId], addition);
    });
  });
  return {
    ip,
    groups,
  };
};
