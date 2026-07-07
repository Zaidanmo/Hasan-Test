using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace LinkUp.Data.Migrations
{
    /// <inheritdoc />
    public partial class CatalogLookupTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTE: This migration is hand-edited. The legacy JSON/string columns
            // (Hobbies, LearningGoals, TandemForm, TandemFrequency) are kept until AFTER the data
            // has been copied into the new catalog/join tables, then dropped last. The new FK columns
            // are added with a temporary default (0) so they can be added to existing rows, then
            // backfilled before the foreign keys are created.
            migrationBuilder.AddColumn<int>(
                name: "TandemFormId",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TandemFrequencyId",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Hobby",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hobby", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LearningGoal",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningGoal", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TandemForm",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TandemForm", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TandemFrequency",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TandemFrequency", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserHobby",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    HobbyId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserHobby", x => new { x.UserId, x.HobbyId });
                    table.ForeignKey(
                        name: "FK_UserHobby_Hobby_HobbyId",
                        column: x => x.HobbyId,
                        principalTable: "Hobby",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserHobby_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserLearningGoal",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    LearningGoalId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserLearningGoal", x => new { x.UserId, x.LearningGoalId });
                    table.ForeignKey(
                        name: "FK_UserLearningGoal_LearningGoal_LearningGoalId",
                        column: x => x.LearningGoalId,
                        principalTable: "LearningGoal",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserLearningGoal_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Hobby",
                columns: new[] { "Id", "Code", "DisplayName", "IsActive", "SortOrder" },
                values: new object[,]
                {
                    { 1, "Sport", "Sport & Bewegung", true, 1 },
                    { 2, "Arts_and_Culture", "Kunst, Kultur & Kreatives", true, 2 },
                    { 3, "Travel", "Reisen", true, 3 },
                    { 4, "Cuisine", "Kochen & Kulinarik", true, 4 },
                    { 5, "Technology", "Technologie & Programmieren", true, 5 },
                    { 6, "Gaming", "Gaming", true, 6 },
                    { 7, "Social_Activities", "Soziale Aktivitäten & Networking", true, 7 }
                });

            migrationBuilder.InsertData(
                table: "LearningGoal",
                columns: new[] { "Id", "Code", "DisplayName", "IsActive", "SortOrder" },
                values: new object[,]
                {
                    { 1, "Practice_Everyday_Language", "Alltagssprache üben", true, 1 },
                    { 2, "Improve_Technical_Language", "Fachsprache verbessern", true, 2 },
                    { 3, "Cultural_Understanding", "Kulturelles Verständnis vertiefen", true, 3 },
                    { 4, "Interview_Preparation", "Vorbereitung auf Bewerbung / Vorstellungsgespräch", true, 4 },
                    { 5, "Exam_Preparation", "Prüfungsvorbereitung", true, 5 }
                });

            migrationBuilder.InsertData(
                table: "TandemForm",
                columns: new[] { "Id", "Code", "DisplayName", "IsActive", "SortOrder" },
                values: new object[,]
                {
                    { 1, "Face_to_Face", "Persönlich", true, 1 },
                    { 2, "Online", "Online", true, 2 },
                    { 3, "Hybrid", "Hybrid", true, 3 }
                });

            migrationBuilder.InsertData(
                table: "TandemFrequency",
                columns: new[] { "Id", "Code", "DisplayName", "IsActive", "SortOrder" },
                values: new object[,]
                {
                    { 1, "Weekly", "Wöchentlich", true, 1 },
                    { 2, "Monthly", "Monatlich", true, 2 },
                    { 3, "Flexible", "Flexibel / nach Bedarf", true, 3 }
                });

            // --- Data backfill (legacy columns still present here) ---

            // Multi-select hobbies/learning goals: explode the stored JSON arrays into join rows.
            migrationBuilder.Sql(
                @"INSERT INTO UserHobby (UserId, HobbyId)
                  SELECT u.Id, h.Id
                  FROM Users u, json_each(u.Hobbies) je
                  JOIN Hobby h ON h.Code = je.value;");

            migrationBuilder.Sql(
                @"INSERT INTO UserLearningGoal (UserId, LearningGoalId)
                  SELECT u.Id, g.Id
                  FROM Users u, json_each(u.LearningGoals) je
                  JOIN LearningGoal g ON g.Code = je.value;");

            // Single-select tandem form/frequency: map the stored code string to the catalog row id.
            migrationBuilder.Sql(
                @"UPDATE Users
                  SET TandemFormId = (SELECT tf.Id FROM TandemForm tf WHERE tf.Code = Users.TandemForm)
                  WHERE Users.TandemForm IN (SELECT tf2.Code FROM TandemForm tf2);");

            migrationBuilder.Sql(
                @"UPDATE Users
                  SET TandemFrequencyId = (SELECT tf.Id FROM TandemFrequency tf WHERE tf.Code = Users.TandemFrequency)
                  WHERE Users.TandemFrequency IN (SELECT tf2.Code FROM TandemFrequency tf2);");

            migrationBuilder.CreateIndex(
                name: "IX_Users_TandemFormId",
                table: "Users",
                column: "TandemFormId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_TandemFrequencyId",
                table: "Users",
                column: "TandemFrequencyId");

            migrationBuilder.CreateIndex(
                name: "IX_Hobby_Code",
                table: "Hobby",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LearningGoal_Code",
                table: "LearningGoal",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TandemForm_Code",
                table: "TandemForm",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TandemFrequency_Code",
                table: "TandemFrequency",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserHobby_HobbyId",
                table: "UserHobby",
                column: "HobbyId");

            migrationBuilder.CreateIndex(
                name: "IX_UserLearningGoal_LearningGoalId",
                table: "UserLearningGoal",
                column: "LearningGoalId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_TandemForm_TandemFormId",
                table: "Users",
                column: "TandemFormId",
                principalTable: "TandemForm",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_TandemFrequency_TandemFrequencyId",
                table: "Users",
                column: "TandemFrequencyId",
                principalTable: "TandemFrequency",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Drop the legacy columns LAST, now that their data has been migrated.
            migrationBuilder.DropColumn(
                name: "Hobbies",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LearningGoals",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TandemForm",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TandemFrequency",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_TandemForm_TandemFormId",
                table: "Users");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_TandemFrequency_TandemFrequencyId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "TandemForm");

            migrationBuilder.DropTable(
                name: "TandemFrequency");

            migrationBuilder.DropTable(
                name: "UserHobby");

            migrationBuilder.DropTable(
                name: "UserLearningGoal");

            migrationBuilder.DropTable(
                name: "Hobby");

            migrationBuilder.DropTable(
                name: "LearningGoal");

            migrationBuilder.DropIndex(
                name: "IX_Users_TandemFormId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_TandemFrequencyId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TandemFormId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TandemFrequencyId",
                table: "Users");

            migrationBuilder.AddColumn<string>(
                name: "Hobbies",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LearningGoals",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TandemForm",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TandemFrequency",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }
    }
}
