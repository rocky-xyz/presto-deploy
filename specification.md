
# COMP6080 - Assignment 4

## 1. Before you start

### 1.1. Background & Motivation

This assignment is the process of building the front-end for an MVP (Minimum Viable Product) to the standards described. Features need to be implemented for your React.js app to meet requirements and operate with the provided backend.

The requirements describe a series of **screens**. Screens can be:

- popups / modals
- full-page views
- other UI representations

You have flexibility in how to implement them.

---

### 1.2. Lectures to watch

#### Before starting:

- Javascript Ecosystem  
- Node Package Manager  
- ReactJS Introduction  
- ReactJS Global CSS Usage  
- ReactJS Lifecycle  
- ReactJS useState hook  
- ReactJS useEffect hook  
- Working with multiple files  
- Components & Props  
- Linting  

#### To complete:

- Routing & SPAs  
- CSS Frameworks  
- useContext hook  
- Testing introduction  
- Component testing  
- UI Testing  

---

### 1.3. Setup & Requirements

You must:

- Build a web app using **React.js**
- Use the **provided backend**
- Build a **Single Page Application (SPA)**

❗ Requirements:

- No full page reloads
- Do NOT add/modify `.html` files in frontend

🚨 Failure = **50% penalty**

---

### 1.3.1 Languages

- You can use UI libraries:
  - Material UI
  - Radix UI
  - Any npm package

- MUST commit `package.json`

- Small external code allowed (< general purpose)
  - Must be attributed

---

### 1.3.2 Browser Compatibility

- Must work on latest **Google Chrome**

---

### 1.3.3 Using Code Online

- Allowed (small/general)
- MUST include attribution

---

### 1.3.4 ⚠ Prohibited Usage ⚠

- ❌ No global CSS imports
- ❌ No direct CSS importing

✔ Use instead:

- CSS Modules
- Styled Components
- UI frameworks (e.g. Tailwind, MUI)

- ❌ No Angular / Vue
- ❌ Avoid direct DOM manipulation

---

## 2. The Task 🔥🔥

See full spec here:

https://cgi.cse.unsw.edu.au/~cs6080/gitlabredir/26T1/ass4

---

## 3. Deployment & Backend

### 3.0 Deployment

- Deploy to **Vercel**
- Follow `deployment.md`

---

### 3.1 Frontend

```bash
cd frontend
npm install
npm run dev
````

❗ Missing packages = **5% penalty**

---

### 3.2 Backend (provided)

Clone:

```bash
git clone git@gitlab.cse.unsw.edu.au:coursework/COMP6080/[term]/ass4-backend/presto-backend.git
```

Setup:

```bash
npm install
nvm use
npm start
```

API:

```
http://localhost:5005
```

Useful commands:

```bash
npm run reset
npm run clear
npm run test
```

Config file:

```
frontend/src/backend.config.json
```

❗ Backend cannot be modified (except deployment.md)

---

## 4. Assumptions

* UI design is flexible
* Focus is functionality, not aesthetics
* Any npm package allowed (unless prohibited)

---

## 5. Teamwork

* Work in **pairs OR solo**

Rules:

* Contributions tracked via GitLab
* Unequal work → different marks possible
* Must commit using own account

Special consideration:

* Extension is **shared (half)**

---

## 6. Marking Criteria

### 6.1 Functionality (50%)

* Features implemented per spec

❗ Must update `progress.csv`

Values:

* NO
* PARTIAL
* YES

Missing → **5% penalty**

---

### 6.2 Responsiveness (10%)

* Works on:

  * Desktop
  * Tablet
  * Mobile (≥ 400px × 700px)

---

### 6.3 UI/UX (10%)

* Usable & intuitive
* Follow WCAG 2.1 & lecture principles

📄 Document in `UIUX.md`

---

### 6.4 Code Style (10%)

* Clean
* Well-commented
* Good naming
* React best practices

---

### 6.5 Lint + TypeScript (5%)

* Must pass:

  * eslint
  * tsc

❗ No partial marks

---

### 6.6 Testing (5%)

* UI testing (80% requirement coverage)
* Include alternative path testing

📄 Document in `TESTING.md`

---

### 6.7 Accessibility (5%)

* Follow accessibility principles

📄 Document in `A11Y.md`

---

### 6.8 Deployment (5%)

* Deploy to Vercel
* Provide URL in `progress.csv`

---

### 6.9 Bonus (5%)

* Extra features

Requirements:

* Non-trivial
* Clear justification

📄 Document in `BONUS.md`

---

## 7. Git Commit Requirements

You must:

* ≥ **4 days** commits
* ≥ **20 commits**
* Meaningful messages
* ≤ **200 lines per commit**

Dependency updates:

* Separate commits

⚠ Poor git → up to **50% penalty**

---

## 8. Originality

* Must be your own work
* No sharing

⚠ Violations:

* Fail course
* Academic penalties

---

## 9. Submission

* Push to **GitLab master branch**
* Must run clean when cloned

---

### Dryrun

```bash
6080 ass4dryrun ASS GROUP_NAME
```

Example:

```bash
6080 ass4dryrun presto my-group
```

---

## 10. Late Policy

* Up to **4 days late (96h)**
* **5% per day**

Starts **1 minute after deadline**

