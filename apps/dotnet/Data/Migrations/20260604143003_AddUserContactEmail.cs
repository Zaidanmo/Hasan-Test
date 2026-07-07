using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinkUp.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserContactEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            // Backfill existing rows: ContactEmail is required and these accounts predate it, so seed
            // it with their login email (the only address on file). Users can change it afterwards.
            migrationBuilder.Sql("UPDATE Users SET ContactEmail = Email;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContactEmail",
                table: "Users");
        }
    }
}
