# Phase 0 Research: Evidence + RAG + MCP

(Moved here from the now-deleted umbrella spec `019-mcp-faiss-implementation/research.md` §2-4,
which covered all phases together before they were split into separate per-phase specs.)

## 1. FAISS index type and rebuild strategy

**Decision**: `faiss.IndexFlatIP` (exact inner-product search over L2-normalized MiniLM
embeddings, equivalent to cosine similarity) built once offline by
`backend/src/scripts/build_evidence_index.py`, persisted to `data/index/evidence.faiss` + a
parallel `data/index/evidence_meta.json` (ordered list of `{id, source_type, source_id, text}`
matching the index's vector order), loaded read-only by `evidence_engine.py` at first use (lazy
singleton, same pattern already used by `course_recommendation_engine.py`'s `_get_model()`/
`_get_course_embeddings()`).

**Rationale**: Corpus size is in the low hundreds of chunks (34 competencies + ~6 roles + 30-50
courses + optionally a bounded ESCO slice) — exact search is fast enough that an approximate index
(IVF, HNSW) would add tuning complexity for no measurable speed gain, matching the master
document's own §6.2 instruction to "not rebuild on every request" without mandating any particular
index sophistication. This mirrors the exact pattern `course_recommendation_engine.py`'s
`semantic_fallback()` already uses (`SentenceTransformer.encode(..., normalize_embeddings=True)` +
dot product) — FAISS's `IndexFlatIP` is the same math, just index-managed, chosen here specifically
because the evidence corpus is queried more often and from more call sites (assessment context,
learning-plan grounding) than the course catalogue, so a dedicated persisted index is worth the
small added code versus reusing raw numpy dot products inline everywhere.

**Alternatives considered**: (a) Reuse the existing raw-numpy cosine approach from
`course_recommendation_engine.py`/`competency_mapping.py` instead of FAISS — rejected only because
the master document explicitly requires FAISS as one of the two authorized new infrastructure
pieces; technically either would work at this scale. (b) An approximate FAISS index type —
rejected as unjustified complexity at low-hundreds scale.

## 2. Evidence corpus composition

**Decision**: Build the corpus from exactly three already-curated sources:
`data/curated/competencies.json` (name + description per competency), `data/curated/roles.json`
(name + description per role), `data/curated/courses.json` (title + description + provider per
course). ESCO's four active CSVs are used only as an optional, explicitly-bounded addition
(skill/occupation descriptions already referenced by the curated competencies'
`esco_source_id`/roles' `esco_occupation_id` fields, if present) — never the full ESCO file set.

**Rationale**: Matches this phase's FR-001 ("built from the platform's own curated/reference
data... not external or invented content") and `CLAUDE.md` Rule 7 (only the four active ESCO files
are part of the pipeline, and even those only as optional reference). Reusing data that's already
validated/curated means no new data-quality risk is introduced by this phase.

**Alternatives considered**: Scraping/generating additional evidence text via Mistral — rejected;
would violate FR-001 and Rule 4 (Mistral doesn't own the competency/role/course framework, and an
LLM-generated "evidence" corpus would risk fabricated grounding material, defeating the point of
grounding).

## 3. Grounding validator approach

**Decision**: A pure-Python post-processing step in `learning_plan_planner.py` — after Mistral
returns plan JSON, extract every course/provider/skill name/duration string it references, and
check each against (a) the deterministic course/gap data actually supplied in the prompt and (b)
the retrieved evidence items' source ids. Any reference not found in either is stripped from the
displayed text (never silently left in), and the removal is recorded in a `grounding_report` the
caller can log/surface. No second LLM call is used to "check" the first (would violate Rule 13's
call-minimization spirit and add another failure point).

**Rationale**: Matches this phase's FR-005 exactly and keeps grounding deterministic/backend-owned
(Rule 6). Since the plan generator is only ever given real courses/gaps/evidence to reference in
the first place (FR-004), the check is a closed-world membership test, not open-ended
fact-checking — cheap and reliable.

**Alternatives considered**: A second Mistral call asking "is this claim supported by this
evidence?" — rejected as unnecessary LLM spend and a second point of potential
hallucination/failure for something a string-membership check already answers deterministically.
