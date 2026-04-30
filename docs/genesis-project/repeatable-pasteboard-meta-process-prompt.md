# Generic Prompt-Bundle Meta-Process Prompt

Use this prompt when you have gathered a bundle of information that is mostly
made of prompts, prompt fragments, asks, notes-to-self, commands, or intended
outputs, and you need another agent to sort it into its best working form.

The point is not the source. The point is the meta-process: "Here is a bunch of
prompt-like material. Figure out what it is trying to do, what should be run
together, what should stand alone, what should be generalized, and what final
artifact best serves the whole bundle."

```text
I am giving you a bundle of information. Much of it is prompts, prompt
fragments, repeated asks, notes-to-self, intended outputs, or commands I have
collected. Treat this as a meta-assignment.

The material may be out of sequence. Some pieces may belong in a dependency
ladder. Some may need to be soloed out as standalone reusable prompts. Some may
be duplicates, variants, supporting context, or unfinished starts. Some may be
asking for a report, a plan, a critique, a study guide, a technical spec, a
market artifact, an experiment, or something else.

Your job is to infer the best use of the bundle, not merely summarize it.
Sort it, give your best take, identify what each piece is trying to make happen,
and turn the recurring parts into repeatable processes that can be reused later.

Primary goals:

1. Preserve the raw language as evidence.
2. Separate provenance from authority:
   where something came from may matter, but source order should not control the
   ideal order.
3. Identify what each item was expected to produce or cause.
4. Explain the use and value of each item or cluster.
5. Decide whether each item belongs in a sequence, should stand alone, should be
   merged with another item, or should be treated as context only.
6. Generalize repeated asks into reusable prompt templates, processes, or
   operating rules.
7. Give your best critical take on the whole bundle: what it is really trying to
   become, what it does well, what is missing, and what risks it creates.
8. Produce the final artifact that best fits the bundle, including any specific
   output types requested inside the bundle.

For each item or cluster, identify:

- Raw text or representative excerpt.
- Source/provenance if available.
- Function.
- Expected output.
- Value created.
- Quality standard or implied bar.
- Dependencies and downstream artifacts.
- Classification: sequence step, standalone prompt, duplicate/variant,
  supporting context, unresolved question, or discard/archive candidate.
- Generalized reusable form.

Start with this broad taxonomy, then revise it to fit the material:

- Naming / compression.
- Purpose / intent.
- Research / source grounding.
- Academic rigor / proof / method.
- Critique / review / response.
- Planning / sequencing.
- Implementation / architecture.
- Experiment / validation.
- Marketing / persuasion / packaging.
- Documentation / handoff / memory.
- Governance / rules / process.
- Next action / next artifact.
- Other corpus-specific function.

Then create:

1. A bundle map:
   every item or cluster mapped to its function, expected output, and value.

2. A sequence map:
   the dependency-ordered ladder of items that should be run together.

3. A standalone shelf:
   items that should remain solo prompts, tools, questions, or procedures.

4. A duplicate/variant ledger:
   items that ask for the same thing in different words, with the strongest
   canonical version selected.

5. A process library:
   reusable prompt templates, procedures, or rules derived from the bundle.

6. A best-take report:
   what the bundle is really trying to do, what its governing pattern is, what
   it does well, what it is missing, and what should happen next.

Use this general sequence unless the bundle proves another order is better:

1. Identify what the bundle is.
2. Preserve raw language and provenance.
3. Cluster related items.
4. Infer each cluster's function and expected output.
5. Separate sequence items from standalone items.
6. Collapse duplicates and variants.
7. Build the strongest dependency order.
8. Extract reusable prompt/process templates.
9. Critique the resulting method.
10. Name the next artifact or action.

Important constraints:

- Do not flatten charged, strange, symbolic, or personal language too early.
  Preserve it in the raw layer, then explain its function.
- Do not assume every item should become part of one long sequence.
- Do not let source order control ideal order.
- Do not force the bundle into a product spec, research plan, or marketing asset
  unless the material asks for that.
- Do not stop at classification; produce reusable prompts, procedures, or
  operating rules.
- If the bundle contains explicit asks for specific outputs, honor them inside
  the final artifact.

Final output format:

# Prompt-Bundle Meta-Report

## Input Boundary
State what input was analyzed and what was excluded.

## Executive Finding
State the governing pattern found in the bundle.

## Bundle Map
Map items/clusters to function, expected output, and value.

## Sequence Map
Give the recommended order and explain why each stage precedes the next.

## Standalone Shelf
List items that should remain standalone and when to use them.

## Duplicate / Variant Ledger
Collapse repeated asks into canonical forms.

## Repeatable Process Library
Provide reusable prompt templates, procedures, or rules for future use.

## Critical Take
Assess strengths, risks, blind spots, and misuse cases.

## Reviewer Questions
Give questions other people should answer when responding to the report.

## Next Artifact
Name the next most logical artifact by dependency order.
```

## Short Invocation

Use this when the bundle is already nearby and the session only needs a compact
starter.

```text
Treat this information bundle as a meta-assignment. Most of it is prompt-like
material. Preserve raw language, separate provenance from authority, classify
each item by function, expected output, and value, decide what belongs in
sequence versus what should stand alone, collapse duplicates into canonical
forms, extract reusable prompts/processes, give your best critical take, and
produce the final artifact the bundle is asking for.
```
