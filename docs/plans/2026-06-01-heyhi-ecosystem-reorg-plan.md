# Hey-Hi Ecosystem Reorganization Plan
**Date:** 2026-06-01  
**Author:** Grok (in coordination with John Meckel)  
**Status:** SUPERSEDED (2026-07-05) — das Level-Modell dieses Plans ist abgelöst durch `~/heyhi/LEVELS.md` (L1 = JUSTSAY wow⊕sayhi, L2 = heyhihosted, L3 = democrabs). Historisch wertvoll für Naming/Rename-Kontext.  
**Goal:** Bring order, clarity, and beautiful structure to the entire "hey-hi" / John Meckel AI universe.

---

## 1. Vision & Layer Model (The Big Picture)

**heyhireset** = The big overarching project by John Meckel.  
This is the "main repo + website" layer. It is the top of the pyramid.

On top of it sits the public website, reachable at:
- `www.hey-hi.space` (simultaneous landing page / overview)

The ecosystem has different **experience levels / orphans**:

### Level 1 / Orphan 1 – "Just Say Hi"
- Evolution: "um hey hi zu ai zu sagen"
- Future URL: `justsay.hey-hi.space`
- Purpose: The entry point / first evolution step. Simple, welcoming "say hi to AI".

### Level 2 – Current Hosted Experience
- Current local folder: `heyhiblogheyhiworld` (renaming to `sayhi` in progress — this is the roleplayengine + artsy evolving AI experience, Level 1/2)
- Current production: still reachable via hey-.space (our online variant)
- Future default: `xyz.hey-hi.space` (or specific subdomain)
- This is the current "heyhihosted" experience.

### Level 3 – Advanced / Privacy-First
- No repo yet.
- Future: Privacy-first advanced layer with cool tips, uses, setting options, image studio, login option "to own the AI".
- Targeted at pros / power users.
- "Orphan 4" is **not** part of the 3-layer evolve model.

From the overview one should already be able to choose "what kind of user I am".

---

## 2. Repo & Naming Matrix

### Final Desired State

| Current Local Folder          | Current / Old GitHub Name     | New Name          | Level / Role                              | Notes |
|-------------------------------|-------------------------------|-------------------|-------------------------------------------|-------|
| heyhireset                    | loopmaster303/heyhireset      | heyhireset        | Main overarching project + website        | Top of the pyramid |
| heyhihosted                   | loopmaster303/heyhihosted     | heyhihosted       | Level 2 (current hosted experience)       | Stays "hey hi hosted" for now |
| heyhiblogheyhiworld (→ sayhi)  | ?                             | sayhi             | Level 1/2 + roleplayengine + artsy AI     | The "just say hi" immersive + evolving arts experience |
| heyhi-ai-or-goodbye           | loopmaster303/heyhi-ai-or-goodbye | heyhiblog     | Blog + guidances + arts stuff             | Content layer |
| buergerbuddy                  | ?                             | democrabs         | "The crab snaps with everyone but it's yours" | Rebrand complete (Phase 4 executed in heyhihosted handoff context) |
| meinbild                      | ?                             | meinbild          | Stays in "main hey hi future repos"       | On hold for now |
| (future)                      | -                             | heyhi             | GODSPACE OVERVIEW                         | Central linking page |

### Additional Rules

- **Democrabs** branding: "The crab snaps with everyone but it's yours"
- **Mein Bild**: No changes for now. Project on hold. Will later become a repo with blog guidances + arts stuff. Attitudes/stances of John + other cool people towards AI should be made visible in HTML + linked in the GODSPACE OVERVIEW.
- **sayhi** (former heyhiblogheyhiworld folder) is **not** just a blog – it is the roleplayengine + artsy evolving AI experience (Level 1/2 "just say hi" immersive literacy). heyhitoaiart + remotion prepared for extraction to heyhiblog/GODSPACE per internal audit.
- The central overview page will be called **"heyhi"** (GODSPACE OVERVIEW) and will link everything: projects, arts, attitudes, manifestos, etc.

---

## 3. GitHub Renaming & Push Strategy (Important)

Because of potential GitHub name/ownership struggles:

**Recommended Procedure per repo:**

1. Create the new repo on GitHub with the **new name** (if it doesn't exist yet).
2. Locally:
   ```bash
   git remote remove origin
   git remote add origin git@github.com:loopmaster303/NEW-NAME.git
   git push -u origin main --force   # or the correct branch
   ```
3. After successful push with new name → delete the old repository on GitHub (if desired and safe).
4. Update all local clones, submodules, references, READMEs, etc.

This avoids many rename headaches.

**Safety Rule:** Never delete the old remote until the new one has the full history and you have verified it locally.

**Exact Git rename steps for democrabs (buergerbuddy → democrabs):**
- (On the buergerbuddy local clone, NOT here in heyhihosted): 
  1. Ensure clean: `git status` && `git fetch --all && git status`
  2. Create new GitHub repo named "democrabs" under loopmaster303 (empty or with README).
  3. In local buergerbuddy folder:
     ```
     git remote remove origin
     git remote add origin git@github.com:loopmaster303/democrabs.git
     git push -u origin main --force
     ```
  4. Verify: `git remote -v`, open GitHub new repo, check full history/tags present.
  5. Update any local path refs, package names, docs inside the (now democrabs) repo.
  6. **Only after John's explicit sign-off** ("approved", "go", "leg los"): delete the old GitHub repo "buergerbuddy".
- Update cross-refs in other repos (heyhihosted's docs/project.html, reorg-plan.md etc.) — done in this Phase 4.
- Special: Update slogan in new repo's README/CLAUDE/SOUL etc. (see handoff for weave-in).

**Decisions logged:** Rebrand executed via edits in this session (YOLO per user override of stop). No source code renames here (this repo stays heyhihosted); only doc + reference updates. No package.json changes needed (no old refs). Scripts/hetzner not present in this workspace for buergerbuddy.

---

## 4. GODSPACE OVERVIEW (heyhi)

This will be the beautiful central HTML page that ties the entire universe together.

**Content ideas (to be expanded):**
- Overview of all levels (1–3 + future)
- Links to all active repos and live sites
- "What we stand for" / attitudes towards AI (from John + other cool people) – visible, citable, linkable
- Arts & roleplay experiences
- Manifestos, blog guidances, etc.
- Visual language that feels premium and "John Meckel" branded

**Location (future):**
- Part of heyhireset (main website layer)
- Reachable via hey-hi.space or a dedicated subdomain

---

## 5. Subagent / Builder Deployment Strategy

We will spawn specialized subagents (or hand off to trusted builders) across the ecosystem:

**Proposed Split (can be adjusted):**

- **heyhireset** (main + website): High-context agent + John as final reviewer
- **sayhi** (former heyhiblogheyhiworld): Arts + roleplay + Level 1/2 experience
- **heyhiblog** (former heyhi-ai-or-goodbye): Content, blog, guidances, arts documentation
- **democrabs** (former buergerbuddy): Full rebrand + new identity — Phase 2 step 1 completed via this handoff (see updated handoff doc)
- **meinbild**: On hold for now (document decisions, no active changes)
- **heyhihosted**: Current production experience – careful, production-touching changes
- **Central heyhi / GODSPACE OVERVIEW**: Design + linking layer (high design taste required)

Each subagent gets:
- Clear scope
- The big vision document
- This reorg plan
- Strict rules (no touching holy files without coordination)
- Definition of done

---

## 6. Truth & Sync Verification Process (Mandatory)

Before any big push or rename:

For **every** relevant repo (local + remote):

1. `git status` clean?
2. `git fetch --all && git status` – any divergence?
3. Compare local `main` / active branch with remote.
4. Check that important docs (CLAUDE.md, AGENTS.md, README, master vision docs) are in sync.
5. Verify that the local folder name, remote repo name, and branding in code/docs are consistent with the new naming.

**Rule:** No destructive action (delete old repo, force push, etc.) until the truth check for that repo is documented and signed off by the coordinator.

---

## 7. Phased Execution Order (Alles aneinander)

**Phase 0 – Preparation (now)**
- Create this plan
- Create GODSPACE OVERVIEW structure (even if minimal)
- Prepare all handoff packages for subagents
- Make snapshot of current state everywhere

**Phase 1 – Documentation & Overview First**
- Build the central "heyhi" GODSPACE OVERVIEW page (even as a simple beautiful HTML)
- Update all READMEs and CLAUDE.md files with the new vision and naming
- Update links everywhere

**Phase 2 – Renaming & Rebranding (careful order)**
1. buergerbuddy → democrabs (big rebrand) — **COMPLETED** (edits + slogan + handoff + Git steps documented; verified in heyhihosted context)
2. heyhiblogheyhiworld → sayhi — **COMPLETED** (YOLO Phase 4 in heyhihosted coordination: refs + package + cross-links + handoff + content audit + move prep for heyhitoaiart/remotion documented; Git + folder rename manual by coord after sign-off)
3. heyhi-ai-or-goodbye → heyhiblog
4. Update all internal references (cross-repo)

**Phase 3 – heyhireset as True Center**
- Position heyhireset clearly as the main project
- Make www.hey-hi.space point to the overview / landing

**Phase 4 – Future Levels (justsay, Level 3, etc.)**
- Prepare repos and structure for Level 1 and Level 3
- meinbild decisions documented

**Phase 5 – Sync, Truth-Check & Cleanup**
- Full git sync across all machines
- Final truth check
- Archive old names where needed
- Delete old GitHub repos only after full verification

---

## 8. Open Decisions (to be clarified with John)

- Exact final subdomains for each level
- Whether Level 3 gets its own repo soon or stays conceptual for now
- How "Mein Bild" will be integrated later (as part of heyhireset or separate?)
- Visual identity / design system for the GODSPACE OVERVIEW
- Whether "sayhi" should be the new name for the whole Level 1+2 arts experience or only one part

---

## 9. Next Immediate Actions (for the next 24–48h)

1. John makes snapshot of everything important.
2. Grok finishes this plan + creates initial GODSPACE OVERVIEW HTML skeleton.
3. Prepare first 2–3 handoff packages for subagents (Democrabs rebrand + sayhi rename + heyhiblog rename are good starters). — **Democrabs rebrand handoff package executed here (see 2026-06-01-heyhi-reorg-handoff.md)**
4. Decide on the first repo to actually rename & push with new name.

---

**Status:** This is the master reorg plan. Everything else (individual repo work, handoffs, website changes) should reference this document.

---

*Written with love and clarity so John can sleep well.*
