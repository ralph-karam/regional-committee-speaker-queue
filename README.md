# Regional Committee Speaker Queue

A production-oriented Next.js application for managing speaker requests during a Regional Committee meeting. It is designed for Vercel deployment and uses local storage for the initial version.

## Run Locally

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000` for the operator setup and control console
- `http://localhost:3000/display` for the room projection display
- `http://localhost:3000/speakers` for adding speakers, deleting speakers, and CSV import/export

## What It Includes

- Meeting setup on the initial operator page
- Searchable speaker directory with category filters
- Active queue with hold, restore, unavailable, notes, reorder, remove, top-of-queue confirmation, and clear confirmation
- Now Speaking panel with timer warnings, return, skip, and end controls
- Public display page with no administrative controls or private notes
- Separate speaker-management page with add, delete, CSV import, and CSV export tools
- Completed intervention history with restore, CSV export, and clear confirmation
- Local-storage persistence, saved-status indicator, undo, dark mode, keyboard shortcuts, and activity log
- Sample fictional speaker data
- A service layer in `lib/storage-service.ts` so local storage can later be replaced by Supabase, Firebase, or another real-time backend

## Keyboard Shortcuts

- `/` focuses speaker search
- `N` starts the next speaker
- `E` ends the current intervention
- `Cmd/Ctrl + Z` undoes the most recent queue action
- `F` opens the public display page

Shortcuts do not activate while typing in an input, select, or text area.

## CSV Format

Speaker import accepts the compact meeting-list format:

```csv
MS,Lebanon
Observer MS,Algeria
IG,Organization of Islamic Cooperation (OIC)
UN+Specialized+Related Agencies,UNICEF Regional Office
NSA,International Health Coalition
Government Entity,Saudi Fund for Development
Secretariat,Regional Committee Secretariat
```

The first column is the entity type. Supported codes include `MS`, `Observer MS`, `IG`, `UN+Specialized+Related Agencies`, `NSA`, `Government Entity`, and `Secretariat`. Rows can be pasted one per line or as wrapped text; the importer will split recognized entity codes into separate records.

It also accepts the full export format with a header row:

```csv
fullName,delegation,title,category,preferredLanguage,status
"Maya Haddad","Argana","Permanent Representative","Member State","Arabic","available"
```

Default categories are `Member State`, `Non-State Actor`, `Observer`, `UN Entity`, `Intergovernmental Organization`, `Government Entity`, and `Secretariat`. You can also add custom categories from the Manage Speakers page.

## Tests

```bash
npm run test
```

Tests cover queue addition, duplicate prevention, reordering, starting and ending interventions, restoring completed speakers, timer warnings, and local-storage persistence.

## Backend Upgrade Path

The app uses local storage unless Supabase environment variables are present. To sync multiple laptops:

1. Create a Supabase project.
2. Open Supabase SQL Editor and run `supabase-schema.sql`.
3. In Vercel, add:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_MEETING_ID=regional-committee
```

4. Redeploy Vercel.
5. Open `/` on the admin laptop and `/display` on the display laptop.

The first version stores one JSON state document in the `meetings` table. This is intentionally simple for a live meeting tool. Later, it can be normalized into separate `speakers`, `queue_entries`, and `completed_interventions` tables.
