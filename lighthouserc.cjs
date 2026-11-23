module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['/', '/en/', '/privacidade/', '/en/privacy/'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 15360 }],
        'errors-in-console': ['error', { maxLength: 0 }],
      },
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci' },
  },
};
