module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['/', '/en/', '/privacidade/', '/en/privacy/'],
      numberOfRuns: 5,
    },
    assert: {
      assertions: {
        // CLAUDE.md fala da nota e do LCP típicos: vale a mediana das execuções, não a melhor (padrão 'optimistic' do LHCI).
        'categories:performance': ['error', { minScore: 0.85, aggregationMethod: 'median' }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500, aggregationMethod: 'median' }],
        'resource-summary:script:size': ['error', { maxNumericValue: 450000 }],
        'errors-in-console': ['error', { maxLength: 0 }],
      },
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci' },
  },
};
