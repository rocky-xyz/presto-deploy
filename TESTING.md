# Testing

This document satisfies **README §2.6 (Testing)**: it specifies the **admin happy-path** UI test, a **second path** with steps and rationale (using different features), and how markers run the suite.

## Running tests (assignment)

From the **`frontend`** directory, markers run UI tests with a reset backend:

```bash
cd frontend
npm run test
```

You may need to press **`a`** in the test runner to execute all tests (see README). Configure the `test` script in `frontend/package.json` as needed (for example Vitest or Cypress), as allowed by the README.

Lint (`npm run lint`) and TypeScript (`npm run tsc`) are separate criteria (**README §2.5**); they are not part of §2.6 but should pass before submission.

---

## 1. Admin happy-path UI test (required)

The assignment requires a UI test for the **happy path of an admin** described as the following **eight** steps. The automated test should assert each step succeeds.

1. **Registers successfully** — e.g. submit registration with valid name, email, password, and confirmation; expect success and access to the authenticated app.
2. **Creates a new presentation successfully** — e.g. open the new-presentation flow, submit title (and any optional fields), expect the presentation to be created.
3. **Updates the thumbnail and name of the presentation successfully** — e.g. open edit-presentation, change title and thumbnail, save, expect updated values.
4. **Adds some slides in the slideshow deck successfully** — e.g. use “new slide” (or equivalent) to add multiple slides, expect the deck to reflect them.
5. **Switches between slides successfully** — e.g. use the slide list and/or arrow navigation, expect the active slide to change.
6. **Deletes the presentation successfully** — e.g. trigger delete and confirm, expect the presentation to be removed.
7. **Logs out of the application successfully** — e.g. use logout, expect unauthenticated state.
8. **Logs back into the application successfully** — e.g. sign in with the same credentials, expect authenticated access again.

---

## 2. Second UI test path (required) — steps and rationale

**Rationale:** The admin path above covers account lifecycle and presentation CRUD on the deck. This **second path** is required to exercise **different features**: rich slide content, editor tooling, responsive layout, and preview behaviour. Those flows are not validated by the eight admin steps alone, but they are where regressions most often appear.

**Requirement:** This path must use **different features** from the admin happy path (per README).

### Steps

1. Register or log in, then create a presentation and open the editor.
2. Add a **text** element; assert default styling (e.g. font size `2em`), centred alignment, and sensible box sizing for the content.
3. Add a **code** element with sample JavaScript, Python, or C/C++ code; assert **syntax highlighting** in the rendered block.
4. Add a **second slide**; assert feedback such as a success toast where applicable.
5. Toggle the **Slides** control; assert visible **active** state changes.
6. At a **mobile viewport**, open Slides; assert the slide panel replaces or overlays the canvas as designed (e.g. full-width list).
7. Select an element; use the **hover / context menu** to edit, delete, change **proportional vs stretch** sizing, and move the layer **forward/backward**; assert each action works.
8. Open **preview**; assert **arrow controls** hide after inactivity (if implemented) and **keyboard arrow** navigation works.

**Expected outcome:** Editor and preview stay usable on desktop and mobile; dialogs do not overflow; code and content render consistently between editor and preview.

---

## Optional: manual smoke check

Automated UI tests are the marked deliverable. If you manually sanity-check in a browser, use a local backend and `http://localhost:3000/`; keep any ad-hoc notes out of submission unless your course asks for them.
