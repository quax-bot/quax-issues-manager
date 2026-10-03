# QuaX Issues Manager

Lets a Claude routine triage the issues of [QuaX](https://github.com/Teskann/QuaX) as `quax-bot`,
an account with no write access to QuaX. The routine's GitHub proxy only works on repositories it
can write to, so it works here and these workflows reach QuaX for it:

- `read_issues.yml` publishes the QuaX issues as an artifact of its run;
- `post_answers.yml` posts the routine's answers (`answers.schema.json`) on QuaX as `quax-bot`.
  Labels and closing go with a comment as a `quax-triage` block, which `triage_apply.yml` in QuaX
  validates and applies.

The routine prompt is in `ROUTINE.md`.

## Tests

With QuaX cloned in `quax/`:

```bash
node --test scripts/post.test.js
```
