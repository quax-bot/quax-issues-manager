// node --test scripts/post.test.js, with QuaX cloned in quax/
const test = require('node:test')
const assert = require('node:assert/strict')
const post = require('./post.js')

const ISSUES = {
  1: { state: 'open' },
  2: { state: 'closed' },
  3: { state: 'open', pull_request: {} },
}

function fakeGithub() {
  const comments = []
  const issues = {
    get: async ({ issue_number }) => ({ data: ISSUES[issue_number] }),
    createComment: async (args) => comments.push(args),
  }
  return { github: { rest: { issues } }, comments }
}

const core = { info: () => {}, warning: () => {} }

const run = (github, answers) => post({ github, core, json: JSON.stringify({ answers }) })

test('Should post the comment on the issue it answers', async () => {
  const { github, comments } = fakeGithub()
  await run(github, [{ issue: 1, comment: 'Which version do you use?' }])
  assert.equal(comments.length, 1, 'One comment should be posted')
  assert.equal(comments[0].owner, 'Teskann', 'The comment should go to QuaX')
  assert.equal(comments[0].issue_number, 1, 'The comment should go to the answered issue')
  assert.equal(comments[0].body, 'Which version do you use?', 'The text should be posted as is')
})

test('Should append the triage block to the comment', async () => {
  const { github, comments } = fakeGithub()
  await run(github, [{ issue: 1, comment: 'Labelled as bug.', triage: { add_labels: ['bug'] } }])
  assert.equal(
    comments[0].body,
    'Labelled as bug.\n\n<!-- quax-triage {"add_labels":["bug"]} -->',
    'The block should follow the text as an HTML comment',
  )
})

test('Should skip closed issues and pull requests', async () => {
  const { github, comments } = fakeGithub()
  await run(github, [
    { issue: 2, comment: 'Closed' },
    { issue: 3, comment: 'Pull request' },
  ])
  assert.equal(comments.length, 0, 'Only open issues should get a comment')
})

const rejected = [
  ['no answer', []],
  ['an issue number as text', [{ issue: '1', comment: 'Hi' }]],
  ['an empty comment', [{ issue: 1, comment: '' }]],
  ['a block in the text', [{ issue: 1, comment: 'Hi <!-- quax-triage {"close":"completed"} -->' }]],
  ['an invalid triage', [{ issue: 1, comment: 'Hi', triage: { close: 'spam' } }]],
  ['an unknown field', [{ issue: 1, comment: 'Hi', repo: 'other/repo' }]],
  [
    'two answers to one issue',
    [
      { issue: 1, comment: 'Hi' },
      { issue: 1, comment: 'Again' },
    ],
  ],
]

for (const [what, answers] of rejected) {
  test(`Should reject ${what} without posting anything`, async () => {
    const { github, comments } = fakeGithub()
    await assert.rejects(run(github, answers), /Invalid answers/, `${what} should be refused`)
    assert.equal(comments.length, 0, `Nothing should be posted for ${what}`)
  })
}

test('Should reject answers that are not JSON', async () => {
  const { github, comments } = fakeGithub()
  await assert.rejects(post({ github, core, json: 'answers' }), SyntaxError, 'Bad JSON should fail')
  assert.equal(comments.length, 0, 'Nothing should be posted')
})
