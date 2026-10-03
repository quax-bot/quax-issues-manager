# QuaX Issues Manager

Lets a Claude routine triage the issues of [QuaX](https://github.com/Teskann/QuaX) as `quax-bot`,
an account with no write access to QuaX. The routine's GitHub proxy only works on repositories it
can write to, so it works here and these workflows reach QuaX for it:

- `read_issues.yml` publishes the QuaX issues as an artifact of its run;
- `post_answers.yml` posts the routine's answers (`answers.schema.json`) on QuaX as `quax-bot`.
  Labels and closing go with a comment as a `quax-triage` block, which `triage_apply.yml` in QuaX
  validates and applies.

The routine prompt is in `ROUTINE.md`.

## Setup

1. Create a classic personal access token on `quax-bot` with the `public_repo` scope only, and an
   expiration date.
2. In this repository's settings, create the environment `quax`. Under deployment branches, allow
   `main` only. Add the token as the environment secret `QUAX_BOT_TOKEN`. Do not add it as a
   repository secret: the routine can start workflows from other branches, and only the environment
   keeps the token away from them.
3. Protect `main` so that only pull requests can change it.
4. Create a cloud routine on this repository with the content of `ROUTINE.md` as its prompt, no
   connector, and a daily schedule.

## Tests

With QuaX cloned in `quax/`:

```bash
node --test scripts/post.test.js
```
