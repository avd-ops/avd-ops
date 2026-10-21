---
name: brand-profile
description: Use when making a page, artifact, slide, image or README header for a project, so it follows that project's brand from its brand/profile.json; and to set up or update a project's brand profile.
---

# Brand profile

Each project keeps its brand in one file at `brand/profile.json` in its repo: colors for light and dark, the
roles those colors play, type, every logo and brand image with what it is for, starter files, the lines every
page must carry, voice and rules. This skill reads that file before making anything for the project, and writes
it when a brand is set up or changes. The format is `brand/profile.schema.json` in avd-ops (copy it next to a new
profile; nothing in it is specific to avd-ops).

## Known profiles

| Project | Repo | Visibility |
|---|---|---|
| avd-ops (the public AVD repos) | https://github.com/avd-ops/avd-ops | public |

When you set up a profile for another project, add its row here by proposing an update to this skill.

## 1. Find the profile

1. In the repo you're working in: `brand/profile.json`.
2. Otherwise the project's row above. Get it with git, not by retyping:

```bash
rm -rf /tmp/brand-src && git clone -q --depth 1 https://github.com/avd-ops/avd-ops.git /tmp/brand-src && ls /tmp/brand-src/brand
```

3. No profile and no row: ask which project it is for, or offer to set one up (section 3). Never invent a brand.

If the profile has `release.tag`, prefer that tag (`--branch <tag>`) and fall back to the default branch.

## 2. Make something with it

- **Start from a starter** when `starters` has one for the job (`page`, `artifact`, ...): copy the file and fill
  it. Don't rebuild what it already holds.
- **No starter:** build from the profile. Write the `colors` as CSS custom properties: every token's light value on
  `:root`, the dark values again under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`
  and under `:root[data-theme="dark"]`. Use `roles` to know which token is the background, text, accent and so on.
  Fonts from `type`: self-hosted `files` in a repo; `googleFonts` in a Claude artifact (the only font host it may
  load), always with the `fallback` stack.
- **Logos and images:** pick from `assets` by `kind`, `background` and `use`; never redraw or recolor one. In an
  artifact, embed the SVG as a `data:` URI. A file marked `generated` is rebuilt by its script, not edited.
- **Required lines:** every item in `required` appears where its `where` says (notices, credit lines, license lines).
- **Voice and rules:** follow `voice` and every line of `rules`. `visibility: private` means nothing made from the
  profile goes on a public page, and a public page never names a private project.
- Design both themes, keep a 16px gutter and no sideways scroll at 390px, and meet the artifact-design contract
  for an artifact.

## 3. Set up a profile for a project

1. Gather what the repo already has before asking: stylesheets with custom properties, theme files, logos and icons,
   fonts, the README's name and tagline, any design doc.
2. Ask the person only for what's missing (name, tagline, the main colors, logo files). Images they share go into the
   repo under `brand/` (`png/`, `source/`), never into chat history alone.
3. Write `brand/profile.json` to the schema (copy `brand/profile.schema.json` from avd-ops beside it), with
   `sourceOfTruth` naming the files that define the brand if the repo has them, every brand file in `assets`, and
   `visibility`. Add `brand/README.md` listing the files.
4. Add a test, in the repo's own test runner, that the profile matches its source of truth and lists every brand
   file (avd-ops `tests/brand.test.mjs` is a model).
5. Propose it as a pull request, then propose this skill's Known profiles row.

## 4. Update a profile

1. If `sourceOfTruth` names a file for what changes (a token stylesheet, a logo), change that first.
2. Change `brand/profile.json` to match, set `updated` to today, and bump `release` if the repo releases its brand.
3. Rebuild generated files with their scripts (the `generated` field names them) and run the repo's tests.
4. Pull request. For avd-ops: bump the version line in the four design-system files, run
   `node scripts/site/design-manifest.mjs`, `node scripts/site/build-kit.mjs`, `python3 scripts/site/brand_lockups.py`
   (and `node scripts/site/brand-png.mjs` for the pictures), then `node --test "tests/*.test.mjs"`. The owner tags
   the release after the merge; Claude sessions can't push tags.

## Never

- Put secrets, IDs, emails, customer or tenant names in a profile or a brand file.
- Use one project's brand for another, or a public brand on a private project's page.
- Load a brand's files from its website at run time; repos take a pinned copy.
