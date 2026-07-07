using LinkUp.Core.Entities;
using LinkUp.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LinkUp.Data.Contexts;

public class LinkUpContext : DbContext
{
    public LinkUpContext(DbContextOptions<LinkUpContext> options) : base(options)
    { }

    public DbSet<User> Users => Set<User>();

    public DbSet<UserFavorite> UserFavorites => Set<UserFavorite>();

    public DbSet<UserKnownLanguage> UserKnownLanguages => Set<UserKnownLanguage>();

    public DbSet<Hobby> Hobbies => Set<Hobby>();

    public DbSet<LearningGoal> LearningGoals => Set<LearningGoal>();

    public DbSet<TandemForm> TandemForms => Set<TandemForm>();

    public DbSet<TandemFrequency> TandemFrequencies => Set<TandemFrequency>();

    public DbSet<UserHobby> UserHobbies => Set<UserHobby>();

    public DbSet<UserLearningGoal> UserLearningGoals => Set<UserLearningGoal>();

    public DbSet<Language> Languages => Set<Language>();

    public override int SaveChanges()
    {
        NormalizeUserIdentityFields();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        NormalizeUserIdentityFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id)
                .HasConversion(
                    id => id.ToString(),
                    value => Guid.Parse(value));

            entity.Property(x => x.Username)
                .IsRequired()
                .UseCollation("NOCASE");

            entity.Property(x => x.Email)
                .IsRequired()
                .UseCollation("NOCASE");

            entity.Property(x => x.ContactEmail)
                .IsRequired();

            entity.Property(x => x.Password)
                .IsRequired();

            entity.Property(x => x.CreatedAt)
                .IsRequired();

            entity.Property(x => x.FirstName)
                .IsRequired();

            entity.Property(x => x.Surname)
                .IsRequired();

            entity.Property(x => x.TelephoneNumber)
                .IsRequired();

            entity.Property(x => x.Degree)
                .IsRequired();

            entity.Property(x => x.Country)
                .IsRequired();

            entity.Property(x => x.DistinctHobby)
                .IsRequired();

            entity.HasIndex(x => x.Username)
                .IsUnique();

            entity.HasIndex(x => x.Email)
                .IsUnique();

            entity.HasOne(x => x.TandemForm)
                .WithMany()
                .HasForeignKey(x => x.TandemFormId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.TandemFrequency)
                .WithMany()
                .HasForeignKey(x => x.TandemFrequencyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.MotherLanguage)
                .WithMany()
                .HasForeignKey(x => x.MotherLanguageId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.TargetLanguage)
                .WithMany()
                .HasForeignKey(x => x.TargetLanguageId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(x => x.TargetLanguageLevel)
                .HasConversion<string>()
                .IsRequired();
        });

        modelBuilder.Entity<UserKnownLanguage>(entity =>
        {
            entity.ToTable("UserKnownLanguage");

            entity.HasKey(x => new { x.UserId, x.LanguageId });

            entity.Property(x => x.UserId)
                .HasConversion(
                    id => id.ToString(),
                    value => Guid.Parse(value));

            entity.Property(x => x.Level)
                .HasConversion<string>()
                .IsRequired();

            entity.Property(x => x.LevelRank)
                .IsRequired();

            entity.HasIndex(x => new { x.LanguageId, x.LevelRank, x.UserId });

            entity.HasOne(x => x.User)
                .WithMany(x => x.KnownLanguages)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Language)
                .WithMany()
                .HasForeignKey(x => x.LanguageId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserFavorite>(entity =>
        {
            entity.ToTable("UserFavorites");

            entity.HasKey(x => new { x.UserId, x.FavoriteUserId });

            entity.Property(x => x.UserId)
                .HasConversion(
                    id => id.ToString(),
                    value => Guid.Parse(value));

            entity.Property(x => x.FavoriteUserId)
                .HasConversion(
                    id => id.ToString(),
                    value => Guid.Parse(value));

            entity.Property(x => x.CreatedAt)
                .IsRequired();

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.FavoriteUser)
                .WithMany()
                .HasForeignKey(x => x.FavoriteUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        ConfigureCatalogs(modelBuilder);
    }

    private static void ConfigureCatalogs(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Hobby>(entity =>
        {
            entity.ToTable("Hobby");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).IsRequired();
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.DisplayName).IsRequired();

            entity.HasData(
                new Hobby { Id = 1, Code = "Sport", DisplayName = "Sport & Bewegung", IsActive = true, SortOrder = 1 },
                new Hobby { Id = 2, Code = "Arts_and_Culture", DisplayName = "Kunst, Kultur & Kreatives", IsActive = true, SortOrder = 2 },
                new Hobby { Id = 3, Code = "Travel", DisplayName = "Reisen", IsActive = true, SortOrder = 3 },
                new Hobby { Id = 4, Code = "Cuisine", DisplayName = "Kochen & Kulinarik", IsActive = true, SortOrder = 4 },
                new Hobby { Id = 5, Code = "Technology", DisplayName = "Technologie & Programmieren", IsActive = true, SortOrder = 5 },
                new Hobby { Id = 6, Code = "Gaming", DisplayName = "Gaming", IsActive = true, SortOrder = 6 },
                new Hobby { Id = 7, Code = "Social_Activities", DisplayName = "Soziale Aktivitäten & Networking", IsActive = true, SortOrder = 7 });
        });

        modelBuilder.Entity<LearningGoal>(entity =>
        {
            entity.ToTable("LearningGoal");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).IsRequired();
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.DisplayName).IsRequired();

            entity.HasData(
                new LearningGoal { Id = 1, Code = "Practice_Everyday_Language", DisplayName = "Alltagssprache üben", IsActive = true, SortOrder = 1 },
                new LearningGoal { Id = 2, Code = "Improve_Technical_Language", DisplayName = "Fachsprache verbessern", IsActive = true, SortOrder = 2 },
                new LearningGoal { Id = 3, Code = "Cultural_Understanding", DisplayName = "Kulturelles Verständnis vertiefen", IsActive = true, SortOrder = 3 },
                new LearningGoal { Id = 4, Code = "Interview_Preparation", DisplayName = "Vorbereitung auf Bewerbung / Vorstellungsgespräch", IsActive = true, SortOrder = 4 },
                new LearningGoal { Id = 5, Code = "Exam_Preparation", DisplayName = "Prüfungsvorbereitung", IsActive = true, SortOrder = 5 });
        });

        modelBuilder.Entity<TandemForm>(entity =>
        {
            entity.ToTable("TandemForm");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).IsRequired();
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.DisplayName).IsRequired();

            entity.HasData(
                new TandemForm { Id = 1, Code = "Face_to_Face", DisplayName = "Persönlich", IsActive = true, SortOrder = 1 },
                new TandemForm { Id = 2, Code = "Online", DisplayName = "Online", IsActive = true, SortOrder = 2 },
                new TandemForm { Id = 3, Code = "Hybrid", DisplayName = "Hybrid", IsActive = true, SortOrder = 3 });
        });

        modelBuilder.Entity<TandemFrequency>(entity =>
        {
            entity.ToTable("TandemFrequency");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).IsRequired();
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.DisplayName).IsRequired();

            entity.HasData(
                new TandemFrequency { Id = 1, Code = "Weekly", DisplayName = "Wöchentlich", IsActive = true, SortOrder = 1 },
                new TandemFrequency { Id = 2, Code = "Monthly", DisplayName = "Monatlich", IsActive = true, SortOrder = 2 },
                new TandemFrequency { Id = 3, Code = "Flexible", DisplayName = "Flexibel / nach Bedarf", IsActive = true, SortOrder = 3 });
        });

        modelBuilder.Entity<Language>(entity =>
        {
            entity.ToTable("Language");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).IsRequired().UseCollation("NOCASE");
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.DisplayName).IsRequired();

            // Code is the canonical language identifier the user references by FK. It is matched
            // case-insensitively (NOCASE), so the client may submit it in any case. DisplayName is the label.
            entity.HasData(
                new Language { Id = 1, Code = "albanian", DisplayName = "Albanian", IsActive = true, SortOrder = 1 },
                new Language { Id = 2, Code = "amharic", DisplayName = "Amharic", IsActive = true, SortOrder = 2 },
                new Language { Id = 3, Code = "arabic", DisplayName = "Arabic", IsActive = true, SortOrder = 3 },
                new Language { Id = 4, Code = "bosnian", DisplayName = "Bosnian", IsActive = true, SortOrder = 4 },
                new Language { Id = 5, Code = "bulgarian", DisplayName = "Bulgarian", IsActive = true, SortOrder = 5 },
                new Language { Id = 6, Code = "chinese", DisplayName = "Chinese", IsActive = true, SortOrder = 6 },
                new Language { Id = 7, Code = "croatian", DisplayName = "Croatian", IsActive = true, SortOrder = 7 },
                new Language { Id = 8, Code = "czech", DisplayName = "Czech", IsActive = true, SortOrder = 8 },
                new Language { Id = 9, Code = "danish", DisplayName = "Danish", IsActive = true, SortOrder = 9 },
                new Language { Id = 10, Code = "dutch", DisplayName = "Dutch", IsActive = true, SortOrder = 10 },
                new Language { Id = 11, Code = "english", DisplayName = "English", IsActive = true, SortOrder = 11 },
                new Language { Id = 12, Code = "finnish", DisplayName = "Finnish", IsActive = true, SortOrder = 12 },
                new Language { Id = 13, Code = "french", DisplayName = "French", IsActive = true, SortOrder = 13 },
                new Language { Id = 14, Code = "german", DisplayName = "German", IsActive = true, SortOrder = 14 },
                new Language { Id = 15, Code = "greek", DisplayName = "Greek", IsActive = true, SortOrder = 15 },
                new Language { Id = 16, Code = "hebrew", DisplayName = "Hebrew", IsActive = true, SortOrder = 16 },
                new Language { Id = 17, Code = "hindi", DisplayName = "Hindi", IsActive = true, SortOrder = 17 },
                new Language { Id = 18, Code = "hungarian", DisplayName = "Hungarian", IsActive = true, SortOrder = 18 },
                new Language { Id = 19, Code = "indonesian", DisplayName = "Indonesian", IsActive = true, SortOrder = 19 },
                new Language { Id = 20, Code = "italian", DisplayName = "Italian", IsActive = true, SortOrder = 20 },
                new Language { Id = 21, Code = "japanese", DisplayName = "Japanese", IsActive = true, SortOrder = 21 },
                new Language { Id = 22, Code = "korean", DisplayName = "Korean", IsActive = true, SortOrder = 22 },
                new Language { Id = 23, Code = "kurdish", DisplayName = "Kurdish", IsActive = true, SortOrder = 23 },
                new Language { Id = 24, Code = "malay", DisplayName = "Malay", IsActive = true, SortOrder = 24 },
                new Language { Id = 25, Code = "norwegian", DisplayName = "Norwegian", IsActive = true, SortOrder = 25 },
                new Language { Id = 26, Code = "persian", DisplayName = "Persian", IsActive = true, SortOrder = 26 },
                new Language { Id = 27, Code = "polish", DisplayName = "Polish", IsActive = true, SortOrder = 27 },
                new Language { Id = 28, Code = "portuguese", DisplayName = "Portuguese", IsActive = true, SortOrder = 28 },
                new Language { Id = 29, Code = "romanian", DisplayName = "Romanian", IsActive = true, SortOrder = 29 },
                new Language { Id = 30, Code = "russian", DisplayName = "Russian", IsActive = true, SortOrder = 30 },
                new Language { Id = 31, Code = "serbian", DisplayName = "Serbian", IsActive = true, SortOrder = 31 },
                new Language { Id = 32, Code = "slovak", DisplayName = "Slovak", IsActive = true, SortOrder = 32 },
                new Language { Id = 33, Code = "somali", DisplayName = "Somali", IsActive = true, SortOrder = 33 },
                new Language { Id = 34, Code = "spanish", DisplayName = "Spanish", IsActive = true, SortOrder = 34 },
                new Language { Id = 35, Code = "swahili", DisplayName = "Swahili", IsActive = true, SortOrder = 35 },
                new Language { Id = 36, Code = "swedish", DisplayName = "Swedish", IsActive = true, SortOrder = 36 },
                new Language { Id = 37, Code = "thai", DisplayName = "Thai", IsActive = true, SortOrder = 37 },
                new Language { Id = 38, Code = "turkish", DisplayName = "Turkish", IsActive = true, SortOrder = 38 },
                new Language { Id = 39, Code = "ukrainian", DisplayName = "Ukrainian", IsActive = true, SortOrder = 39 },
                new Language { Id = 40, Code = "urdu", DisplayName = "Urdu", IsActive = true, SortOrder = 40 },
                new Language { Id = 41, Code = "vietnamese", DisplayName = "Vietnamese", IsActive = true, SortOrder = 41 });
        });

        modelBuilder.Entity<UserHobby>(entity =>
        {
            entity.ToTable("UserHobby");
            entity.HasKey(x => new { x.UserId, x.HobbyId });

            entity.Property(x => x.UserId)
                .HasConversion(
                    id => id.ToString(),
                    value => Guid.Parse(value));

            entity.HasOne(x => x.User)
                .WithMany(x => x.UserHobbies)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Hobby)
                .WithMany()
                .HasForeignKey(x => x.HobbyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.HobbyId);
        });

        modelBuilder.Entity<UserLearningGoal>(entity =>
        {
            entity.ToTable("UserLearningGoal");
            entity.HasKey(x => new { x.UserId, x.LearningGoalId });

            entity.Property(x => x.UserId)
                .HasConversion(
                    id => id.ToString(),
                    value => Guid.Parse(value));

            entity.HasOne(x => x.User)
                .WithMany(x => x.UserLearningGoals)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.LearningGoal)
                .WithMany()
                .HasForeignKey(x => x.LearningGoalId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.LearningGoalId);
        });
    }

    #region Normalization
    private void NormalizeUserIdentityFields()
    {
        foreach (var entry in ChangeTracker.Entries<User>())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified))
            {
                continue;
            }

            entry.Entity.Email = NormalizeEmail(entry.Entity.Email);
            entry.Entity.Username = NormalizeUsername(entry.Entity.Username);
        }
    }

    private static string NormalizeEmail(string? email)
    {
        return string.IsNullOrWhiteSpace(email)
            ? string.Empty
            : email.Trim().ToLowerInvariant();
    }

    private static string NormalizeUsername(string? username)
    {
        return string.IsNullOrWhiteSpace(username)
            ? string.Empty
            : username.Trim();
    }
    #endregion
}