export default {
  globs: ['**/*.md'],
  customRules: [
    'markdownlint-rule-relative-links'
  ],
  outputFormatters: [
    ['markdownlint-cli2-formatter-pretty', { appendLink: true }],
    ['markdownlint-cli2-formatter-summarize', { byRule: true }]
  ]
}
