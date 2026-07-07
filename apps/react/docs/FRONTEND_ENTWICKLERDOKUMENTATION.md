# LinkUp Frontend Entwicklerdokumentation


Diese Dokumentation beschreibt den aktuellen Aufbau des React-Frontends für LinkUp, die wichtigsten Datenflüsse und die Stellen, die bei Backend-Änderungen angepasst werden müssen.

## 1. Überblick

LinkUp ist eine React/Vite Single Page App für Tandem-Matching. Das Frontend übernimmt:

- Auth, Registrierung und Session-State.
- Profil anlegen, bearbeiten und löschen.
- Profilbild hochladen, anzeigen und löschen.
- Backend-Kataloge für Sprachen, Hobbys, Lernziele, Tandem-Formen und Häufigkeiten laden.
- Matching-Swipe-UI mit Score-Erklärung.
- Kontaktliste für gegenseitige Matches.
- Deutsch/Englisch-UI.

## 2. Stack und Start

Stack:

- React 19
- React Router 7
- Vite 8
- Tailwind CSS
- Axios
- ESLint

Scripts:

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

Das Backend wird lokal über `vite.config.js` erwartet unter:

```text
http://localhost:8083
```

Diese Pfade werden im Dev-Modus proxied:

- `/user`
- `/users`
- `/auth`
- `/matches`
- `/catalogs`
- `/swipes`

Wenn `VITE_API_BASE_URL` gesetzt ist, verwendet Axios diese Base URL. Sonst laufen Requests relativ zur Frontend-Origin.

## 3. Projektstruktur

```text
src/
  api/          Backend-Endpunkte und Axios-Client
  auth/         AuthContext und useAuth
  components/   Wiederverwendbare UI-Komponenten
  data/         Kleine stabile Daten, z. B. Sprachlevel
  hooks/        Daten-Hooks wie Kataloge, Matches, Profilbilder
  i18n/         Sprache, Übersetzungen, optionLabel
  pages/        Route-Level Screens
  routes/       Route Guards
  storage/      localStorage/sessionStorage Helper
  utils/        Mapper, Formatter, Payloads, Validierung
```

Architekturregel:

- API-Aufrufe gehören in `src/api`.
- DTO-Normalisierung gehört in `src/utils` oder Hooks.
- Pages orchestrieren Workflows.
- Reusable UI gehört in `src/components`.

## 4. Routing

Zentrale Datei: `src/App.jsx`

Provider-Reihenfolge:

```text
I18nProvider
AuthProvider
BrowserRouter
Routes
```

Routen:

| Pfad | Zugriff | Zweck |
| --- | --- | --- |
| `/` | öffentlich | Weiterleitung zu `/home` oder `/login` |
| `/login` | nur ausgeloggt | Login |
| `/register` | nur ausgeloggt | Registrierung |
| `/forgot-password` | nur ausgeloggt | Passwort-Reset UI |
| `/impressum` | öffentlich | Impressum |
| `/home` | geschützt | Matching |
| `/kontakte` | geschützt | Gegenseitige Matches |
| `/favoriten` | geschützt | Redirect zu `/kontakte` |
| `/account/edit` | geschützt | Mein Konto |

Guards:

- `ProtectedRoute`: ohne Token zu `/login`.
- `PublicOnlyRoute`: eingeloggte Nutzer weg von Login/Register.
- `RootRedirect`: entscheidet Startziel.

## 5. API-Layer

Zentrale Axios-Instanz: `src/api/index.js`

Verhalten:

- Liest Token aus `localStorage`.
- Setzt `Authorization: Bearer <token>`.
- Bei HTTP 401 wird die Auth-Session gelöscht.

API-Dateien:

- `authApi.js`: Login, Registrierung, Auth-Persistenz, Passwort-Reset-Platzhalter.
- `userApi.js`: aktueller Nutzer, Nutzerdetails, Account löschen.
- `catalogApi.js`: Kataloge und Cache.
- `matchApi.js`: Matches, Mutual Matches, Like.
- `profilePictureApi.js`: Profilbild Upload/Delete/Fetch.

Pages sollen nie direkt `axios` importieren.

## 6. Auth und Session

Wichtige Dateien:

- `src/auth/AuthContext.jsx`
- `src/storage/authStorage.js`
- `src/api/authApi.js`

Storage Keys:

- Token: `token`
- User: `linkup_auth`
- Event: `linkup:auth-changed`

Login:

```js
POST /users/login
{
  user: { email, password }
}
```

Erwartet wird ein Token in der Antwort, z. B.:

```js
{
  auth: {
    id,
    username,
    email,
    token
  }
}
```

`persistAuthSession` speichert Token und Basis-User. Das Frontend akzeptiert sowohl camelCase als auch PascalCase aus dem Backend.

Logout löscht Token/User aus Storage und aktualisiert den React-State über das Auth-Event.

## 7. Kataloge und Cache

Zentrale Dateien:

- `src/api/catalogApi.js`
- `src/hooks/useProfileCatalogs.js`
- `src/data/profileOptions.js`

Geladene Endpunkte:

- `GET /catalogs/languages`
- `GET /catalogs/hobbies`
- `GET /catalogs/learning-goals`
- `GET /catalogs/tandem-forms`
- `GET /catalogs/tandem-frequencies`

`getProfileCatalogs()` lädt alle Kataloge gemeinsam mit `Promise.all`.

Cache:

- Memory-Cache für die aktuelle Laufzeit.
- `sessionStorage` unter `linkup.profileCatalogs.v3`.
- TTL: 10 Minuten.
- `useProfileCatalogs` triggert nach Ablauf automatisch einen Refresh.

Das verhindert doppelte Requests in Registrierung, Account, Matching und Kontakten.

Akzeptierte Backend-Formen:

```js
[
  { code: "Sport", displayName: "Sport & Bewegung" }
]
```

oder:

```js
{
  items: [
    { code: "Sport", displayName: "Sport & Bewegung" }
  ]
}
```

Auch `Code`, `DisplayName`, `value` und `label` werden unterstützt.

## 8. Katalog-Übersetzungen

Backend liefert Codes und Anzeigenamen auf Deutsch.

Frontend-Lösung:

- Backend-Code bleibt technischer Wert.
- An Backend wird immer der Code zurückgesendet.
- Anzeige läuft über `optionLabel(code, backendDisplayName)`.
- Wenn Übersetzung existiert, wird sie genutzt.
- Wenn nicht, wird `displayName` oder der Code angezeigt.

Wichtige Datei:

- `src/i18n/I18nProvider.jsx`
- `src/i18n/translations.js`

Keys:

```js
"option.Sport": "Sport & Bewegung"
"option.Face_to_Face": "Persönlich"
"language.German": "Deutsch"
```

Wartung bei neuen Backend-Codes:

1. Backend liefert neuen Code.
2. UI funktioniert sofort per Fallback.
3. Für saubere DE/EN-Anzeige müssen `option.<code>` oder `language.<code>` in `translations.js` ergänzt werden.

Langfristig wäre es sauberer, die Übersetzungen direkt vom Backend zu beziehen. Bis dahin verwenden wir bewusst eine Frontend-Übersetzung mit Fallback.
## 9. Profil-Datenmodell

Zentrale Datei: `src/utils/profilePayload.js`

Das UI-Formular benutzt eigene sprechende Feldnamen. Beim Senden werden sie in Backend-Felder gemappt.

Wichtige Mappings:

| UI | Backend |
| --- | --- |
| `lastName` | `surname` |
| `phone` | `telephoneNumber` |
| `studyProgram` | `degree` |
| `nativeLanguage` | `motherLanguage` |
| `knownLanguages` | `languages` |
| `targetLanguage` + `searchedLevel` | `targetLanguage` |
| `interests` | `hobbies` |
| `interestsText` | `distinctHobby` |
| `meetingFormat` | `tandemForm` |
| `meetingFrequency` | `tandemFrequency` |
| `expectations` + `contribution` | `bio` |

Sprachen werden so ans Backend geschickt:

```js
{
  Language: "German",
  Level: "B2"
}
```

`buildProfilePayload` filtert ausgewählte Codes gegen die geladenen Kataloge.

`mapUserToProfileForm` macht das Gegenteil: Backend-User zu UI-Formular.

## 10. Bio-Feld

Das Backend hat ein `bio` Feld. Die UI zeigt zwei Felder:

- Erwartungen an den Tandem-Partner.
- Was ich einbringen kann.

`buildBio` schreibt beide Bereiche mit Labels in `bio`.

`parseBio` kann sie beim Bearbeiten wieder trennen. Alte Bio-Texte ohne Labels werden bestmöglich übernommen.

## 11. Registrierung

Datei: `src/pages/RegisterPage.jsx`

Die Registrierung hat 5 Schritte:

1. Über dich
2. Sprachen
3. Lernziele
4. Interessen
5. Konto

Wichtig:

- Username und E-Mail sind unique.
- Kontakt-E-Mail, E-Mail, Username usw. sind Pflicht.
- Profilbild ist optional.
- Kataloge kommen aus `useProfileCatalogs`.
- Payload kommt aus `buildProfilePayload(..., includePassword: true)`.

Submit-Flow:

1. Schritt validieren.
2. `POST /user`.
3. Antwort direkt in Auth speichern.
4. Falls Bild gewählt: `POST /user/profile-picture`.
5. Weiter zu `/home`.

Wenn das Backend bei Username/E-Mail-Konflikt HTTP 409 liefert, springt die UI zurück zu Schritt 1 und zeigt eine verständliche Fehlermeldung.

## 12. Mein Konto

Datei: `src/pages/AccEditPage.jsx`

Lade-Flow:

1. Kataloge laden.
2. Danach `GET /user`.
3. Userdaten mit Auth-Session mergen.
4. Mit `mapUserToProfileForm` ins Formular mappen.

Speichern:

1. Validieren.
2. `buildProfilePayload`.
3. `PUT /user`.
4. Antwort zurück ins Formular mappen.
5. Auth-Session mit Username, E-Mail und Kontakt-E-Mail aktualisieren.

Account löschen:

- Button öffnet Dialog.
- 5-Sekunden-Countdown.
- Danach erst `DELETE /user` möglich.
- Bei Erfolg Session löschen und zu `/login`.

## 13. Profilbilder

Dateien:

- `src/api/profilePictureApi.js`
- `src/hooks/useProfilePictureUrl.js`
- `src/components/profile/ProfileAvatar.jsx`
- `src/components/profile/ProfilePictureControl.jsx`

Endpunkte:

- `POST /user/profile-picture`
- `DELETE /user/profile-picture`
- `GET /users/{userId}/profile-picture`

Erlaubt:

- JPEG
- PNG
- WebP
- max. 5 MB

Anzeige:

- `ProfileAvatar` bekommt `userId` und `hasProfilePicture`.
- `useProfilePictureUrl` lädt den Blob und erstellt eine Object URL.
- Beim Unmount wird die Object URL freigegeben.
- `pictureVersion` erzwingt ein Neuladen nach Upload/Delete.
- Wenn kein Bild vorhanden ist, wird ein Initial angezeigt.

Der Header-Avatar kommt aus `HeaderProfileLink`, das dafür `GET /user` lädt.

## 14. Matching

Dateien:

- `src/pages/HomePage.jsx`
- `src/hooks/useMatchSuggestions.js`
- `src/hooks/useMutualMatches.js`
- `src/utils/matchMapper.js`

Endpunkte:

- `GET /matches?page=1&pageSize=20`
- `GET /matches/mutual`
- `POST /matches/{favoriteUserId}/favorite`

`useMatchSuggestions`:

- lädt paged Match-Vorschläge.
- normalisiert DTOs mit `normalizeMatches`.
- merged neue Pages nach ID.
- prefetches nächste Page, wenn nur noch wenige Profile sichtbar sind.

`HomePage`:

- zeigt nur Profile, die noch nicht geliked und kein Mutual Match sind.
- Left-Swipe ist lokaler Skip.
- Right-Swipe sendet Like.
- Bei gegenseitigem Match erscheint `MatchModal`.
- Fehlgeschlagene Likes holen die Karte zurück.

`matchMapper.js` normalisiert Scores, Namen, Avatar-Daten, gemeinsame Hobbys/Lernziele und Match-Gründe.

## 15. Matching Score UI

Score-Texte liegen in `src/i18n/translations.js`.

Aktuelle Erklärung:

- Sprache: bis 40 Punkte.
- Gemeinsame Hobbys: bis 25 Punkte.
- Lernziele: bis 20 Punkte.
- Tandem-Präferenzen: bis 15 Punkte.

Wenn das Backend den Algorithmus ändert, müssen besonders diese Keys geprüft werden:

- `matchingInfo.*`
- `card.score.*`
- `profile.scoreDetails`

`translateReason` in `matchMapper.js` übersetzt einige Backend-Reasons per Textmuster. Wenn das Backend später Reason-Codes liefert, sollte das auf Code-Mapping umgebaut werden.

## 16. Kontakte

Datei: `src/pages/ContactsPage.jsx`

Flow:

1. `GET /matches/mutual` über `useMutualMatches`.
2. Liste zeigt sofort Basisdaten.
3. Für fehlende Details wird pro Match `GET /users/{id}` vorgeladen.
4. `GET /user` wird einmal geladen, um gemeinsame Werte gegen das aktuelle Profil zu berechnen.
5. Ergebnisse landen in `detailsCacheRef`.

Warum Zusatzcalls?

`/matches/mutual` liefert nicht alle Daten für die Detailansicht, z. B. Kontakt-E-Mail, komplette Hobbys, Sprachen oder `hasProfilePicture`.

Falls das Backend später vollständige Mutual-DTOs liefert, können diese Calls reduziert werden.

Kontakt-E-Mail:

- Pflichtfeld bei Registrierung und Account.
- Wird im Kontakt-Modal als `mailto:` angezeigt.
- Backend muss sicherstellen, dass sie nur berechtigten Nutzern geliefert wird.

## 17. Übersetzung

Dateien:

- `src/i18n/I18nProvider.jsx`
- `src/i18n/translations.js`

Sprachen:

- `de`
- `en`

Storage Key:

```js
linkup.language
```

`t(key, values)`:

- nimmt aktuelle Sprache.
- fällt auf Deutsch zurück.
- ersetzt Platzhalter wie `{name}`.

`optionLabel(value, fallback)`:

- prüft `option.<value>`.
- prüft `language.<value>`.
- fällt auf Backend-Fallback oder Code zurück.

Neue UI-Texte immer in beiden Sprachen ergänzen.

## 18. Mobile und Layout

Patterns:

- Mobile Header oben.
- `BottomNav` für `/home` und `/kontakte`.
- Große Touch-Ziele.
- Modals mit `max-h` und Scroll.
- Desktop bekommt `DesktopSidebar`.

Theme und Animationen liegen in `tailwind.config.js`.

Wichtige Theme-Farben:

- `ovgu.primary`: `#7A003F`
- `ovgu.yellow`: `#FFD400`
- `ovgu.soft`: `#F7EEF3`
- `ovgu.accent`: `#FF6978`

## 19. Validierung und Fehler

Zentrale Dateien:

- `src/utils/validationRules.js`
- `src/utils/apiErrorMessages.js`

Wichtige Regeln:

- Username: 3 bis 40 Zeichen.
- Passwort: 8 bis 128 Zeichen.
- E-Mail: max. 254 Zeichen.
- Kontakt-E-Mail Pflicht.
- Mindestens eine bekannte Sprache.
- Mindestens ein Lernziel.
- Häufigkeit und Format Pflicht.
- Mindestens ein Interesse.

`getApiErrorMessage` normalisiert:

- 429
- Validation Errors
- Username/E-Mail-Konflikte
- generische Backend-Messages

Client-Validierung ist nur UX. Backend muss alle Regeln weiterhin prüfen.

## 20. Sicherheit und Stabilität

Bereits umgesetzt:

- Kein `dangerouslySetInnerHTML`.
- Token wird zentral im Axios-Interceptor gesetzt.
- 401 löscht Session.
- Storage-Zugriffe sind in `try/catch`.
- Katalogwerte werden gegen Backend-Optionen gefiltert.
- Profilbild-Dateityp und Größe werden geprüft.
- Blob URLs werden freigegeben.
- Async-Effekte nutzen Cleanup oder active Flags.
- Doppelte Swipe-Requests werden verhindert.

Grenzen:

- Token liegt in `localStorage`.
- Frontend-Dateiprüfung ersetzt keine Backend-Prüfung.
- Account-Löschung und Kontaktfreigabe müssen backendseitig abgesichert sein.

## 21. Bekannte offene Backend-Abhängigkeiten

Passwort-Reset:

- UI existiert.
- Backend Funktion fehlt.

Left-Swipe:

- nur lokaler Skip.

Katalog-Lokalisierung:

- Frontend übersetzt bekannte Codes.
- Neue Codes fallen auf Backend-Label zurück.

## 22. Backend-Verträge

Auth:

- `POST /users/login`
- `POST /user`

User:

- `GET /user`
- `PUT /user`
- `DELETE /user`
- `GET /users/{id}`

Profilbild:

- `POST /user/profile-picture`
- `DELETE /user/profile-picture`
- `GET /users/{id}/profile-picture`

Matching:

- `GET /matches?page=&pageSize=`
- `GET /matches/mutual`
- `POST /matches/{favoriteUserId}/favorite`

Kataloge:

- `GET /catalogs/languages`
- `GET /catalogs/hobbies`
- `GET /catalogs/learning-goals`
- `GET /catalogs/tandem-forms`
- `GET /catalogs/tandem-frequencies`

Username/E-Mail-Konflikt:

- Sollte HTTP 409 sein.
- Message sollte `username`, `email` oder beides enthalten, damit das Frontend die richtige Meldung anzeigen kann.

## 23. Wartungsregeln

Neue API:

1. API-Funktion in `src/api`.
2. DTO bei Bedarf in `src/utils` normalisieren.
3. Hook erstellen, wenn mehrere Screens die Daten brauchen.
4. Fehler über `getApiErrorMessage` oder einen lokalen Mapper anzeigen.

Neue Katalogoption:

1. Backend-Code liefern.
2. `translations.js` für DE/EN ergänzen.

Neues Profilfeld:

1. `EMPTY_PROFILE_FORM` erweitern.
2. `mapUserToProfileForm` erweitern.
3. `buildProfilePayload` erweitern.
4. Registrierung und Account prüfen.
5. Validierung und Übersetzung ergänzen.


## 24. Datei-Landkarte

| Datei | Zweck |
| --- | --- |
| `src/App.jsx` | Routing und Provider |
| `src/api/index.js` | Axios, Token, 401 Handling |
| `src/api/catalogApi.js` | Katalog-Endpunkte und Cache |
| `src/api/authApi.js` | Login, Registrierung, Auth-Persistenz |
| `src/api/userApi.js` | User CRUD |
| `src/api/matchApi.js` | Matches und Likes |
| `src/api/profilePictureApi.js` | Profilbilder |
| `src/auth/AuthContext.jsx` | Auth-State |
| `src/hooks/useProfileCatalogs.js` | Kataloge laden und refreshen |
| `src/hooks/useMatchSuggestions.js` | Match-Paging |
| `src/hooks/useMutualMatches.js` | Kontakte laden |
| `src/hooks/useProfilePictureUrl.js` | Profilbild-Blob laden |
| `src/i18n/I18nProvider.jsx` | Sprache und Übersetzungsfunktionen |
| `src/pages/RegisterPage.jsx` | Registrierung |
| `src/pages/AccEditPage.jsx` | Mein Konto |
| `src/pages/HomePage.jsx` | Matching |
| `src/pages/ContactsPage.jsx` | Kontakte |
| `src/utils/profilePayload.js` | Profil-Mapping und Payload |
| `src/utils/matchMapper.js` | Match-Normalisierung |
| `src/utils/profileFormatters.js` | Anzeige von Katalogwerten |
| `src/utils/apiErrorMessages.js` | API-Fehlertexte |
| `tailwind.config.js` | Theme und Animationen |
| `vite.config.js` | Dev Proxy |
