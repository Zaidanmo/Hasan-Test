using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinkUp.Data.Migrations
{
    /// <inheritdoc />
    public partial class UserAttributeFeedbackFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GermanLevel",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TargetLanguage",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GermanLevel",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TargetLanguage",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }
    }
}
