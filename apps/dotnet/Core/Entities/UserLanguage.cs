using LinkUp.Core.Interfaces;

namespace LinkUp.Core.Entities;

public class UserLanguage
{
    public string Language { get; set; } = null!;
    
    public LanguageLevel Level { get; set; }
}