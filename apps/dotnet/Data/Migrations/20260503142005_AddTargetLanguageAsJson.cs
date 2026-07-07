using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinkUp.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTargetLanguageAsJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TargetLanguage",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TargetLanguage",
                table: "Users");
        }
    }
}
