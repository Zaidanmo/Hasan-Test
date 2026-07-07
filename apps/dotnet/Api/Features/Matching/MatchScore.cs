namespace LinkUp.Api.Features.Matching;

internal static class MatchScore
{
    public const int MaxLanguage = 40;
    public const int MaxHobbies = 25;
    public const int MaxLearningGoals = 20;
    public const int MaxTandemForm = 10;
    public const int MaxTandemFrequency = 5;

    // The total a candidate can ever score. A Unit test checks if this is always correctly
    // calculated.
    public const int MaxTotal =
        MaxLanguage + MaxHobbies + MaxLearningGoals + MaxTandemForm + MaxTandemFrequency;

    private const int HobbyPointsEach = 10;
    private const int HobbyFromSharedMax = 20;
    private const int SameDistinctHobbyBonus = 5;

    private const int LearningGoalPointsEach = 5;

    private const int SameTandemFormPoints = 10;
    private const int HybridTandemFormPoints = 5;

    private const int SameTandemFrequencyPoints = MaxTandemFrequency; // 5
    private const int FlexibleTandemFrequencyPoints = 2;

    private const int NativeLanguagePoints = 40;
    private const int AboveLevelLanguagePoints = 35;
    private const int AtLevelLanguagePoints = 30;


    public static int Language(
        int candidateMotherLanguageId,
        int? candidateTargetKnownRank,
        int targetLanguageId,
        int targetRank,
        out List<string> reasons)
    {
        reasons = new List<string>();

        if (candidateMotherLanguageId == targetLanguageId)
        {
            reasons.Add("Candidate is a native speaker of the target language.");
            return NativeLanguagePoints;
        }

        if (candidateTargetKnownRank is null)
        {
            return 0;
        }

        if (candidateTargetKnownRank > targetRank)
        {
            reasons.Add("Candidate knows the target language above the requested level.");
            return AboveLevelLanguagePoints;
        }

        if (candidateTargetKnownRank == targetRank)
        {
            reasons.Add("Candidate knows the target language at the requested level.");
            return AtLevelLanguagePoints;
        }

        return 0;
    }
    
    public static int Hobbies(int commonHobbyCount, bool sameDistinctHobby, out List<string> reasons)
    {
        reasons = new List<string>();

        var score = Math.Min(commonHobbyCount * HobbyPointsEach, HobbyFromSharedMax);

        if (commonHobbyCount > 0)
        {
            reasons.Add($"Users share {commonHobbyCount} hobbies.");
        }

        if (sameDistinctHobby)
        {
            score += SameDistinctHobbyBonus;
            reasons.Add("Users have the same custom hobby.");
        }

        return Math.Min(score, MaxHobbies);
    }


    public static int LearningGoals(int commonLearningGoalCount, out List<string> reasons)
    {
        reasons = new List<string>();

        if (commonLearningGoalCount == 0)
        {
            return 0;
        }

        reasons.Add($"Users share {commonLearningGoalCount} learning goals.");

        return Math.Min(commonLearningGoalCount * LearningGoalPointsEach, MaxLearningGoals);
    }
    
    public static int TandemForm(int currentFormId, int candidateFormId, int hybridFormId, out List<string> reasons)
    {
        reasons = new List<string>();

        if (currentFormId == candidateFormId)
        {
            reasons.Add("Users prefer the same tandem form.");
            return SameTandemFormPoints;
        }

        if (currentFormId == hybridFormId || candidateFormId == hybridFormId)
        {
            reasons.Add("One user prefers a hybrid tandem form, so the form is partially compatible.");
            return HybridTandemFormPoints;
        }

        return 0;
    }
    
    public static int TandemFrequency(int currentFrequencyId, int candidateFrequencyId, int flexibleFrequencyId, out List<string> reasons)
    {
        reasons = new List<string>();

        if (currentFrequencyId == candidateFrequencyId)
        {
            reasons.Add("Users prefer the same tandem frequency.");
            return SameTandemFrequencyPoints;
        }

        if (currentFrequencyId == flexibleFrequencyId || candidateFrequencyId == flexibleFrequencyId)
        {
            reasons.Add("One user is flexible on frequency, so the cadence is partially compatible.");
            return FlexibleTandemFrequencyPoints;
        }

        return 0;
    }

    public static bool CanSatisfyTarget(
        int motherLanguageId,
        IReadOnlyDictionary<int, int> knownLanguageRanks,
        int targetLanguageId,
        int targetRank)
    {
        if (motherLanguageId == targetLanguageId)
        {
            return true;
        }

        return knownLanguageRanks.TryGetValue(targetLanguageId, out var rank) && rank >= targetRank;
    }
}
