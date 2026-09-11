# Quickstart: Task 4 — Resume Processing

## Prerequisites

- Task 3 complete (FastAPI app running, `/health` returns ok).
- `MISTRAL_API_KEY` set in `.env` (Task 0).
- A sample resume fixture (PDF and DOCX) available for testing.

## Steps

1. Golden path: `curl -F "resume=@sample_resume.pdf" http://localhost:8000/candidates/resume` → expect
   HTTP 201 with a `candidate_id` and a non-empty `initial_profile`.
2. Repeat with a DOCX fixture → same expected shape.
3. Reject path: `curl -F "resume=@image.png" http://localhost:8000/candidates/resume` → expect HTTP 400.
4. Oversized file: upload a file above the configured size limit → expect HTTP 400.
5. Corrupted file: upload a renamed non-PDF file with a `.pdf` extension → expect HTTP 422 with the
   "Try Demo Candidate" message, and confirm the server process is still running afterward (no crash).
6. Query the database directly and confirm a `candidates` row and matching `candidate_skills` rows exist
   for the successful upload in step 1.

## Expected Outcome

A resume upload reliably produces a persisted candidate with an initial competency profile, every failure
path returns a clear client error without crashing the backend, and the response contract in
`contracts/api.md` is verified entirely via `curl` before Task 5 (target role selection) or any frontend
work touches this endpoint.
