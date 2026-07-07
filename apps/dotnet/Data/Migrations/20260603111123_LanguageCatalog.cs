using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace LinkUp.Data.Migrations
{
    /// <inheritdoc />
    public partial class LanguageCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Language",
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
                    table.PrimaryKey("PK_Language", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Language",
                columns: new[] { "Id", "Code", "DisplayName", "IsActive", "SortOrder" },
                values: new object[,]
                {
                    { 1, "albanian", "Albanian", true, 1 },
                    { 2, "amharic", "Amharic", true, 2 },
                    { 3, "arabic", "Arabic", true, 3 },
                    { 4, "bosnian", "Bosnian", true, 4 },
                    { 5, "bulgarian", "Bulgarian", true, 5 },
                    { 6, "chinese", "Chinese", true, 6 },
                    { 7, "croatian", "Croatian", true, 7 },
                    { 8, "czech", "Czech", true, 8 },
                    { 9, "danish", "Danish", true, 9 },
                    { 10, "dutch", "Dutch", true, 10 },
                    { 11, "english", "English", true, 11 },
                    { 12, "finnish", "Finnish", true, 12 },
                    { 13, "french", "French", true, 13 },
                    { 14, "german", "German", true, 14 },
                    { 15, "greek", "Greek", true, 15 },
                    { 16, "hebrew", "Hebrew", true, 16 },
                    { 17, "hindi", "Hindi", true, 17 },
                    { 18, "hungarian", "Hungarian", true, 18 },
                    { 19, "indonesian", "Indonesian", true, 19 },
                    { 20, "italian", "Italian", true, 20 },
                    { 21, "japanese", "Japanese", true, 21 },
                    { 22, "korean", "Korean", true, 22 },
                    { 23, "kurdish", "Kurdish", true, 23 },
                    { 24, "malay", "Malay", true, 24 },
                    { 25, "norwegian", "Norwegian", true, 25 },
                    { 26, "persian", "Persian", true, 26 },
                    { 27, "polish", "Polish", true, 27 },
                    { 28, "portuguese", "Portuguese", true, 28 },
                    { 29, "romanian", "Romanian", true, 29 },
                    { 30, "russian", "Russian", true, 30 },
                    { 31, "serbian", "Serbian", true, 31 },
                    { 32, "slovak", "Slovak", true, 32 },
                    { 33, "somali", "Somali", true, 33 },
                    { 34, "spanish", "Spanish", true, 34 },
                    { 35, "swahili", "Swahili", true, 35 },
                    { 36, "swedish", "Swedish", true, 36 },
                    { 37, "thai", "Thai", true, 37 },
                    { 38, "turkish", "Turkish", true, 38 },
                    { 39, "ukrainian", "Ukrainian", true, 39 },
                    { 40, "urdu", "Urdu", true, 40 },
                    { 41, "vietnamese", "Vietnamese", true, 41 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Language_Code",
                table: "Language",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Language");
        }
    }
}
