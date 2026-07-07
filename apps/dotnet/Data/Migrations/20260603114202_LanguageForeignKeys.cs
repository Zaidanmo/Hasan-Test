using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinkUp.Data.Migrations
{
    /// <inheritdoc />
    public partial class LanguageForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Hand-edited: add the new FK columns, backfill them from the legacy string/JSON columns,
            // then let EF drop the legacy columns and rebuild the keys/foreign keys.

            // 1. New columns (temporary defaults; legacy columns kept for the backfill).
            migrationBuilder.AddColumn<int>(
                name: "MotherLanguageId",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TargetLanguageId",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TargetLanguageLevel",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "LanguageId",
                table: "UserKnownLanguage",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            // 2. Backfill from the legacy columns (still present at this point). Codes match
            //    case-insensitively. The target language/level come out of the stored JSON blob.
            migrationBuilder.Sql(
                @"DELETE FROM UserKnownLanguage WHERE Language NOT IN (SELECT Code FROM Language);");

            migrationBuilder.Sql(
                @"UPDATE UserKnownLanguage
                  SET LanguageId = (SELECT l.Id FROM Language l WHERE l.Code = UserKnownLanguage.Language COLLATE NOCASE);");

            migrationBuilder.Sql(
                @"UPDATE Users
                  SET MotherLanguageId = (SELECT l.Id FROM Language l WHERE l.Code = Users.MotherLanguage COLLATE NOCASE)
                  WHERE Users.MotherLanguage IN (SELECT Code FROM Language);");

            migrationBuilder.Sql(
                @"UPDATE Users
                  SET TargetLanguageId = (SELECT l.Id FROM Language l WHERE l.Code = json_extract(Users.TargetLanguage, '$.Language') COLLATE NOCASE),
                      TargetLanguageLevel = json_extract(Users.TargetLanguage, '$.Level')
                  WHERE json_extract(Users.TargetLanguage, '$.Language') IN (SELECT Code FROM Language);");

            // 3. Language.Code becomes case-insensitive.
            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Language",
                type: "TEXT",
                nullable: false,
                collation: "NOCASE",
                oldClrType: typeof(string),
                oldType: "TEXT");

            // 4. UserKnownLanguage: swap the string key for the Language FK.
            migrationBuilder.DropPrimaryKey(
                name: "PK_UserKnownLanguage",
                table: "UserKnownLanguage");

            migrationBuilder.DropIndex(
                name: "IX_UserKnownLanguage_Language_LevelRank_UserId",
                table: "UserKnownLanguage");

            migrationBuilder.DropColumn(
                name: "Language",
                table: "UserKnownLanguage");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserKnownLanguage",
                table: "UserKnownLanguage",
                columns: new[] { "UserId", "LanguageId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserKnownLanguage_LanguageId_LevelRank_UserId",
                table: "UserKnownLanguage",
                columns: new[] { "LanguageId", "LevelRank", "UserId" });

            migrationBuilder.AddForeignKey(
                name: "FK_UserKnownLanguage_Language_LanguageId",
                table: "UserKnownLanguage",
                column: "LanguageId",
                principalTable: "Language",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // 5. Users: drop the legacy language columns and wire up the FKs.
            migrationBuilder.DropIndex(
                name: "IX_Users_MotherLanguage",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "MotherLanguage",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Languages",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TargetLanguage",
                table: "Users");

            migrationBuilder.CreateIndex(
                name: "IX_Users_MotherLanguageId",
                table: "Users",
                column: "MotherLanguageId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_TargetLanguageId",
                table: "Users",
                column: "TargetLanguageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Language_MotherLanguageId",
                table: "Users",
                column: "MotherLanguageId",
                principalTable: "Language",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Language_TargetLanguageId",
                table: "Users",
                column: "TargetLanguageId",
                principalTable: "Language",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserKnownLanguage_Language_LanguageId",
                table: "UserKnownLanguage");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Language_MotherLanguageId",
                table: "Users");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Language_TargetLanguageId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_MotherLanguageId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_TargetLanguageId",
                table: "Users");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserKnownLanguage",
                table: "UserKnownLanguage");

            migrationBuilder.DropIndex(
                name: "IX_UserKnownLanguage_LanguageId_LevelRank_UserId",
                table: "UserKnownLanguage");

            migrationBuilder.DropColumn(
                name: "MotherLanguageId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TargetLanguageId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LanguageId",
                table: "UserKnownLanguage");

            migrationBuilder.RenameColumn(
                name: "TargetLanguageLevel",
                table: "Users",
                newName: "TargetLanguage");

            migrationBuilder.AddColumn<string>(
                name: "Languages",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MotherLanguage",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                collation: "NOCASE");

            migrationBuilder.AddColumn<string>(
                name: "Language",
                table: "UserKnownLanguage",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                collation: "NOCASE");

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Language",
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldCollation: "NOCASE");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserKnownLanguage",
                table: "UserKnownLanguage",
                columns: new[] { "UserId", "Language" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_MotherLanguage",
                table: "Users",
                column: "MotherLanguage");

            migrationBuilder.CreateIndex(
                name: "IX_UserKnownLanguage_Language_LevelRank_UserId",
                table: "UserKnownLanguage",
                columns: new[] { "Language", "LevelRank", "UserId" });
        }
    }
}
