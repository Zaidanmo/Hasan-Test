namespace LinkUp.Core.Entities;

/// <summary>
/// Shared shape for the admin-managed lookup tables (Hobby, LearningGoal, TandemForm, TandemFrequency).
/// <see cref="Code"/> is the stable business key that flows over the API and the matching logic keys on;
/// <see cref="DisplayName"/> is the user-facing label an admin can edit freely.
/// Modelled as an abstract base class (not an interface) so EF Core can translate generic
/// queries that filter on these members (e.g. <c>Set&lt;T&gt;().Where(x =&gt; x.IsActive)</c>).
/// </summary>
public abstract class CatalogEntity
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
