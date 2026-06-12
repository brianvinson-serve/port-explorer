# port-explorer

Interactive cruise port-of-call planner. Static site, no build step.

## Run locally

    python3 -m http.server 8080
    # open http://localhost:8080

## Test

    node --test tests/

## Persistence

Selections are saved to `data/selections.json` via the GitHub Contents API.
On first visit the app asks for a GitHub PAT (fine-grained, Contents: Read
and Write on this repo only). The PAT is stored in localStorage, never in
the repo.
