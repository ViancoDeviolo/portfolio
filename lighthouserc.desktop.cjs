const base = require('./lighthouserc.cjs');

module.exports = {
  ci: {
    ...base.ci,
    collect: { ...base.ci.collect, settings: { preset: 'desktop' } },
    assert: {
      ...base.ci.assert,
      assertions: { ...base.ci.assert.assertions, 'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'median' }] },
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci/desktop' },
  },
};
