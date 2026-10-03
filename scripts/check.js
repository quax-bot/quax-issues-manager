// node scripts/check.js < answers.json
// Checks answers exactly as the Post answers workflow will, before they are sent.

const { parseAnswers } = require('./post.js')

try {
  const answers = parseAnswers(require('fs').readFileSync(0, 'utf8'))
  console.log(`Valid: ${answers.length} answers`)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
