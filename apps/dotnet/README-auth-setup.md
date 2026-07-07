# LinkUp auth-only backend setup

This version strips the backend down to only the database connection, EF Core setup, migrations, and user authentication.

## Included
- SQLite connection through `AppDbContext`
- `Users` table with EF Core migration files
- registration endpoint: `POST /api/users`
- login endpoint: `POST /api/users/login`
- current user endpoint: `GET /api/user`
- JWT authentication and password hashing

## Request format
### Register
```json
{
  "user": {
    "username": "umair",
    "email": "umair@example.com",
    "password": "Pass123!"
  }
}
```

### Login
```json
{
  "user": {
    "email": "umair@example.com",
    "password": "Pass123!"
  }
}
```

## Commands to run locally
```bash
dotnet restore

dotnet ef database update --project src/Data/LinkUp.Data.csproj --startup-project src/Api/LinkUp.Api.csproj

dotnet run --project src/Api/LinkUp.Api.csproj
```

## Notes
- The original project signs JWTs with a certificate. This stripped-down LinkUp version uses a symmetric secret key to keep the setup simpler.
- Change the `Jwt:SecretKey` value in `src/Api/appsettings.json` before production use.


Folder layout in this package matches your existing empty LinkUp structure:
- API
- Core
- Data
- Infrastructure

Use `API/Program.cs` as the real startup file. If you currently have a blank root-level `Program.cs`, you can delete it or ignore it.
