// Posts the routine's answers on QuaX as quax-bot. Run by actions/github-script with quax-bot's
// token: the answers are only ever handled as data, parsed with JSON.parse and sent to the REST API,
// never to a shell. QuaX's validator and triage schema are read from its checkout in quax/.

const { validate } = require('../quax/.github/triage/validate.js')
const TRIAGE_SCHEMA = require('../quax/.github/triage/action.schema.json')
const ANSWERS_SCHEMA = require('../answers.schema.json')

const QUAX = { owner: 'Teskann', repo: 'QuaX' }

const triageErrors = (answers) =>
  answers.flatMap((answer, i) =>
    answer.triage ? validate(TRIAGE_SCHEMA, answer.triage, `$.answers[${i}].triage`) : [],
  )

const duplicateErrors = (answers) =>
  answers
    .map((answer) => answer.issue)
    .filter((issue, i, issues) => issues.indexOf(issue) !== i)
    .map((issue) => `#${issue} is answered more than once`)

function parseAnswers(json) {
  const parsed = JSON.parse(json)
  const shapeErrors = validate(ANSWERS_SCHEMA, parsed)
  const errors =
    shapeErrors.length > 0
      ? shapeErrors
      : [...triageErrors(parsed.answers), ...duplicateErrors(parsed.answers)]
  if (errors.length > 0) throw new Error(`Invalid answers: ${errors.join('; ')}`)
  return parsed.answers
}

const commentBody = ({ comment, triage }) =>
  triage ? `${comment}\n\n<!-- quax-triage ${JSON.stringify(triage)} -->` : comment

async function isOpenIssue(github, number) {
  const { data } = await github.rest.issues.get({ ...QUAX, issue_number: number })
  return data.state === 'open' && !data.pull_request
}

async function postAnswer(github, core, answer) {
  if (!(await isOpenIssue(github, answer.issue))) {
    core.warning(`#${answer.issue} is not an open issue: skipped`)
    return
  }
  const body = commentBody(answer)
  await github.rest.issues.createComment({ ...QUAX, issue_number: answer.issue, body })
  core.info(`Answered #${answer.issue}`)
}

module.exports = async ({ github, core, json }) => {
  const answers = parseAnswers(json)
  for (const answer of answers) await postAnswer(github, core, answer)
}

module.exports.parseAnswers = parseAnswers
