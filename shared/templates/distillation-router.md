# Distillation Template Router

Use this file to map a user request to one or more detailed distillation templates. The router is the only place that defines template selection.

## Template Selection

| User target | Template |
|---|---|
| Person, character, appearance, clothing, speech, habits, psychology, relationships | `distillation-character.md` |
| Worldbuilding, rules, locations, groups, society, technology, daily life, objects, terms | `distillation-world.md` |
| Plot, event, cause, timeline, reveal, information gap, foreshadowing, payoff | `distillation-plot.md` |
| Voice, viewpoint, tense, rhythm, dialogue, description, imagery, scene or chapter structure | `distillation-style.md` |
| A target that combines multiple rows | Use all matching templates and keep their outputs separated |

## Matching Rules

1. Normalize the request into target objects, requested attributes, relationships, source scope, and desired output.
2. Match by the user's actual target, not by a generic word such as `analysis` or `summary`.
3. Use the smallest set of templates that covers the request. Do not run all templates unless the user asks for full distillation.
4. A template is a field contract, not permission to invent missing content.

## No-Match Protocol

When no template clearly covers the request, do not begin ordinary extraction immediately.

1. Perform a distillation design pass: define the target entity, fields, relationships, evidence unit, absence status, aggregation rule, and output artifact.
2. Write that design as `distillation-plan.md` inside the candidate knowledge version or report it before extraction when the candidate does not yet exist.
3. Ask one question only if the design materially changes the result; otherwise proceed with the explicit design.
4. Use `distillation-custom.md` as the temporary field contract.
5. Keep the custom output separate from the standard `characters.md`, `world.md`, `plot.md`, or `style-profile.md` files unless the user approves a mapping.

## Evidence Status

Every field uses one of:

- `explicit`: directly stated or directly observable in the source.
- `inferred`: supported interpretation; include the reasoning and evidence.
- `not mentioned`: no evidence in the declared scan scope.
- `conflict`: multiple incompatible pieces of evidence.

Never convert `not mentioned` into a negative fact or a creative completion.
