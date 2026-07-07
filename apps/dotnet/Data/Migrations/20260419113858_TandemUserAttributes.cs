using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinkUp.Data.Migrations
{
    /// <inheritdoc />
    public partial class TandemUserAttributes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LearningGoals",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TandemFrequency",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LearningGoals",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TandemFrequency",
                table: "Users");
        }
    }
}
