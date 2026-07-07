# LinkUp Backend

LinkUp is a language‑tandem matching platform. This backend is a **.NET 8 REST API** that handles
accounts, profiles, the admin‑managed option catalogs, profile pictures, and the matching/favorites
engine. Data is stored in **SQLite** via EF Core.

## Tech stack

- **.NET 8 / C#**, ASP.NET Core minimal APIs organized with **Carter** modules
- **EF Core 8 + SQLite** (pooled `DbContext`, WAL mode, migrations applied on startup)
- **JWT** bearer authentication, **BCrypt** password hashing (work factor 12)
- **Serilog** logging, **SixLabors.ImageSharp** for image processing
- In‑memory caching for catalog lookups, fixed‑window **rate limiting** on auth endpoints (needs to be improved since its for all users)

## Project layout (`LinkUp.AuthOnly.sln`)

| Project            | Responsibility                                                            |
|--------------------|---------------------------------------------------------------------------|
| **Core**           | Entities, DTOs, interfaces, enums — no external dependencies              |
| **Data**           | `LinkUpContext`, EF configuration + seed data, migrations, the repository |
| **Api**            | Carter feature modules, handlers, validators, mappers, `Program.cs`       |
| **Infrastructure** | JWT token generation, filesystem profile‑picture storage                  |
| **Tests**          | xUnit unit tests (matching scoring + user handler)                        |

## Request flow

```
HTTP → Carter module (route, auth, user id from JWT) → FluentValidation (request bodies)
     → Handler (handles main logic) → ILinkUpRepository → EF Core / SQLite
     → Mapper projects entities to DTOs → JSON response
```

On startup, `Program.cs` applies pending migrations, enables SQLite WAL, and seeds the catalog tables.

## Authentication

- `POST /user` registers a user (password is BCrypt‑hashed); `POST /users/login` returns a **JWT**.
- Protected endpoints require `Authorization: Bearer <token>`. The acting user id is read from the
  token's `NameIdentifier` claim — never trusted from the request body.
- `Username` and `Email` are **unique** and stored **case‑insensitively** (SQLite `NOCASE`). The login `Email`
  stays private; `ContactEmail` is the address exposed on a public profile.
- Rate limits: **5/min** on login, **3 / 10 min** on register. (This needs to be improved, the relevant code lines can be found in program.cs)

## Domain concepts

**Catalogs (lookup tables).** Hobbies, learning goals, tandem forms, tandem frequencies, and languages
are admin‑managed rows rather than hard‑coded enums. Each row has a stable `Code` (the value sent over
the API and keyed on by the matching logic) and an editable `DisplayName`. Clients fetch them
anonymously via `GET /catalogs/*` to populate the registration/profile forms. Implementation needs
to be improved slightly in order to add/remove catalogs but shouldn't be too hard to implement.

**Languages as references.** A user's mother language, target language, and every known language are
foreign keys into the `Language` catalog (not free text). Known languages also carry a CEFR `Level`
(A1–C1, Native) and its numeric `LevelRank`.

**Matching.** `GET /matches` scores each viable candidate out of **100 points**:

| Component                                            | Max |
|------------------------------------------------------|-----|
| Target‑language coverage (native / above / at level) | 40  |
| Shared hobbies (+5 for the same custom hobby)        | 25  |
| Shared learning goals                                | 20  |
| Tandem preferences (form 10 + frequency 5)           | 15  |

The scoring rules live in the pure, unit‑tested `MatchScore` class. A **reciprocity filter** keeps only
candidates where the exchange works *both* ways - you can teach their target language *and* they can
teach yours — so one‑sided pairs are hidden from both users. Results are sorted by score and paginated.

**Favorites & mutual matches.** `POST /matches/{id}/favorite` records a like; when two users like each
other it becomes a mutual match, listed by `GET /matches/mutual`.

**Profile pictures.** Uploads are validated as real images, resized (≤512px), stripped of metadata, and
re‑encoded to WebP by ImageSharp, then written to the filesystem — only the filename is stored in the
DB. Images are served from `GET /users/{id}/profile-picture`.

## Endpoints

| Area                     | Endpoints                                                                                                 |
|--------------------------|-----------------------------------------------------------------------------------------------------------|
| **Auth / User**          | `POST /user` (register), `POST /users/login`, `GET /user`, `PUT /user`, `DELETE /user`, `GET /users/{id}` |
| **Matching**             | `GET /matches?page&pageSize`, `GET /matches/mutual`, `POST /matches/{favoriteUserId}/favorite`            |
| **Catalogs** (anonymous) | `GET /catalogs/{hobbies \| learning-goals \| tandem-forms \| tandem-frequencies \| languages}`            |
| **Profile picture**      | `POST /user/profile-picture`, `GET /users/{id}/profile-picture`, `DELETE /user/profile-picture`           |

## Configuration

- `Jwt:SecretKey` (**required**, ≥32 bytes — the app refuses to start without it), `Jwt:Issuer`,
  `Jwt:Audience`, `Jwt:ExpirationMinutes`. Supply the secret via user‑secrets (dev) or the
  `Jwt__SecretKey` environment variable.
- `ConnectionStrings:DefaultConnection` (defaults to `Data Source=linkup.db`).
- Dev profile listens on `http://localhost:8083` (Swagger at `/swagger` in Development).

## Run & test

```bash
export Jwt__SecretKey="$(openssl rand -base64 48)"   # or store it in user-secrets
dotnet run --project Api      # http://localhost:8083
dotnet test                   # xUnit suite
```

## Database

**Notes**
- Composite‑key join tables: `UserKnownLanguage`, `UserHobby`, `UserLearningGoal`, `UserFavorite`.
- Deleting a user **cascades** to their join rows. Catalog foreign keys use **Restrict**, so a catalog
  row that is in use cannot be deleted.
- `UserFavorite` is a **self‑referencing** many‑to‑many on `Users` (`UserId` → `FavoriteUserId`).
- `Id` on `Users`/`UserFavorite` is a `Guid` stored as text; catalog ids are integers.