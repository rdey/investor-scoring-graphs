const { createSelector } = require('reselect');
const keys = require('lodash/keys');
const assign = require('lodash/assign');
const {
  RELIABLE_INVESTOR_COMMUNICATIONS_QUESTION,
  EXPECTATIONS_ON_FAVORABLE_CATALYSTS_QUESTION,
  ATTRACTIVE_COMPANY_VALUATION_QUESTION,
  SENTIMENT_CATEGORY,
} = require('./constants');

const keyVal = (key, val) => {
  const ob = {};
  ob[key] = val;
  return ob;
};
const extend = (...args) => assign({}, ...args);

/**
 * Direct selector to the communityScoring state domain
 */

const selectScore = (state) => state.get('scores');
const selectQuestions = (state) => state.get('questions');
const selectResults = createSelector([selectScore], (state) =>
  state.get('question_scores')
);
const resultsSelector = createSelector(
  [selectQuestions, selectResults],
  (questions, results) => {
    const resultsBuild = {};
    questions.forEach((questionGroup, groupKey) => {
      const questionCollection = questionGroup.get('questions');
      resultsBuild[groupKey] = {
        title: questionGroup.get('title'),
        averageScore: 0,
        averageReferenceScore: 0,
        details: {},
      };

      const groupBuild = resultsBuild[groupKey];
      questionCollection.forEach((value, key) => {
        if (!results.has(key)) {
          return;
        }
        groupBuild.averageScore += results.get(key).get('score');
        groupBuild.averageReferenceScore += results.get(key).get('reference');
        groupBuild.details[key] = extend(results.get(key).toJS(), {
          title: value,
        });
      });
      groupBuild.averageScore /= questionCollection.size;
      groupBuild.averageReferenceScore /= questionCollection.size;
    });

    return resultsBuild;
  }
);

function calculateInvestmentPlan(plan, total) {
  return plan
    .map((val) => {
      const frac = val / total;
      return 100 * frac;
    })
    .toJS();
}

const scoresSelector = createSelector(
  [selectScore, resultsSelector],
  (state, results) => ({
    numTotal: state.get('num_total').toJS(),
    ownShares: {
      title: null,
      /* eslint-disable no-mixed-operators */
      values: {
        score:
          100 *
          state.get('num_own_shares') /
          state.getIn(['num_total', 'company']),
        negativeScore:
          100 *
          (1 -
            state.get('num_own_shares') /
              state.getIn(['num_total', 'company'])),
      },
      /* eslint-enable no-mixed-operators */
    },
    investmentPlan: {
      company: calculateInvestmentPlan(
        state.getIn(['num_investment_plan', 'company']),
        state.getIn(['num_total', 'company'])
      ),
      reference: calculateInvestmentPlan(
        state.getIn(['num_investment_plan', 'reference']),
        state.getIn(['num_total', 'reference'])
      ),
    },
    results,
  })
);

const pieChartDataSelector = createSelector([scoresSelector], (scores) => {
  const group1 = keys(scores.results)
    .filter((key) => key !== SENTIMENT_CATEGORY)
    .reduce((o, key) => {
      return extend(
        o,
        keyVal(key, {
          title: scores.results[key].title,
          values: {
            score: scores.results[key].averageScore,
            reference: scores.results[key].averageReferenceScore,
            details: scores.results[key].details,
          },
        })

      );
    }, {});
  const irScores = scores.results[SENTIMENT_CATEGORY].details;

  const group2 = keys(irScores).reduce((o, key) => {
    return extend(o, keyVal(key, {
      title: irScores[key].title,
      values: {
        score: irScores[key].score,
        reference: irScores[key].reference,
        details: extend(irScores),
      },
    }));
  }, {});

  const groups = extend(group1, group2);
  delete groups[RELIABLE_INVESTOR_COMMUNICATIONS_QUESTION]; // IR
  groups[EXPECTATIONS_ON_FAVORABLE_CATALYSTS_QUESTION].title = 'Catalysts';
  groups[ATTRACTIVE_COMPANY_VALUATION_QUESTION].title = 'Valuation';

  return groups;
});

const arcChartDataSelector = createSelector([scoresSelector], (scores) => {
  const ip = {};
  const valueTitleMap = {
    invest: 'Invest',
    nothing: 'No change',
    divest: 'Divest',
  };

  const valueColorMap = {
    invest: 'rgba(45, 178, 131, 1)',
    nothing: 'rgba(255, 255, 255, 1)',
    divest: 'rgba(246, 57, 3, 1)',
  };

  keys(scores.investmentPlan).forEach((groupId) => {
    ['invest', 'nothing', 'divest'].forEach((valueId) => {
      ip[groupId] = extend(ip[groupId], keyVal(valueId, {
        value: scores.investmentPlan[groupId][valueId],
        title: valueTitleMap[valueId],
        color: valueColorMap[valueId],
      }));
    });
  });

  return ip;
});

module.exports = {
  arcChartDataSelector,
  pieChartDataSelector,
  scoresSelector
};
