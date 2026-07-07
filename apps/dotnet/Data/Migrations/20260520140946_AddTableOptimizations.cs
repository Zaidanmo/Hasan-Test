using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinkUp.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTableOptimizations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserKnownLanguage_Language_LevelRank",
                table: "UserKnownLanguage");

            migrationBuilder.CreateIndex(
                name: "IX_Users_MotherLanguage",
                table: "Users",
                column: "MotherLanguage");

            migrationBuilder.CreateIndex(
                name: "IX_UserKnownLanguage_Language_LevelRank_UserId",
                table: "UserKnownLanguage",
                columns: new[] { "Language", "LevelRank", "UserId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_MotherLanguage",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_UserKnownLanguage_Language_LevelRank_UserId",
                table: "UserKnownLanguage");

            migrationBuilder.CreateIndex(
                name: "IX_UserKnownLanguage_Language_LevelRank",
                table: "UserKnownLanguage",
                columns: new[] { "Language", "LevelRank" });
        }
    }
}
