using LinkUp.Api.Features.Matching;

namespace LinkUp.Tests.Matching;

/*
 * Tests the scoring rules and ensures they add up to a total of 100 points.
 */

public class MatchScoreTests
{
    // ------ Language ------

    [Fact]
    public void Language_CandidateIsNativeSpeakerOfTarget_ReturnsMax()
    {
        // Mother tongue == target language.
        var score = MatchScore.Language(
            candidateMotherLanguageId: 7,
            candidateTargetKnownRank: null,
            targetLanguageId: 7,
            targetRank: 2,
            out var reasons);

        Assert.Equal(MatchScore.MaxLanguage, score);
        Assert.Equal(40, score);
        Assert.NotEmpty(reasons);
    }

    [Fact]
    public void Language_NativeTakesPrecedenceOverAListedLevel()
    {
        var score = MatchScore.Language(
            candidateMotherLanguageId: 7,
            candidateTargetKnownRank: 0,
            targetLanguageId: 7,
            targetRank: 5,
            out _);

        Assert.Equal(40, score);
    }

    [Fact]
    public void Language_KnowsTargetAboveRequestedLevel_Returns35()
    {
        var score = MatchScore.Language(
            candidateMotherLanguageId: 1,
            candidateTargetKnownRank: 4,
            targetLanguageId: 7,
            targetRank: 2,
            out var reasons);

        Assert.Equal(35, score);
        Assert.NotEmpty(reasons);
    }

    [Fact]
    public void Language_KnowsTargetAtRequestedLevel_Returns30()
    {
        var score = MatchScore.Language(
            candidateMotherLanguageId: 1,
            candidateTargetKnownRank: 2,
            targetLanguageId: 7,
            targetRank: 2,
            out var reasons);

        Assert.Equal(30, score);
        Assert.NotEmpty(reasons);
    }

    [Fact]
    public void Language_KnowsTargetBelowRequestedLevel_ReturnsZero()
    {
        var score = MatchScore.Language(
            candidateMotherLanguageId: 1,
            candidateTargetKnownRank: 1,
            targetLanguageId: 7,
            targetRank: 2,
            out var reasons);

        Assert.Equal(0, score);
        Assert.Empty(reasons);
    }

    [Fact]
    public void Language_DoesNotKnowTargetAndIsNotNative_ReturnsZero()
    {
        var score = MatchScore.Language(
            candidateMotherLanguageId: 1,
            candidateTargetKnownRank: null,
            targetLanguageId: 7,
            targetRank: 2,
            out var reasons);

        Assert.Equal(0, score);
        Assert.Empty(reasons);
    }

    // ------ Hobbies ------

    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 10)]
    [InlineData(2, 20)]
    [InlineData(3, 20)] // shared-hobby points cap at 20
    [InlineData(10, 20)]
    public void Hobbies_SharedHobbiesScaleAndCapAt20(int commonCount, int expected)
    {
        var score = MatchScore.Hobbies(commonCount, sameDistinctHobby: false, out _);

        Assert.Equal(expected, score);
    }

    [Fact]
    public void Hobbies_SameCustomHobbyAddsBonus()
    {
        var score = MatchScore.Hobbies(commonHobbyCount: 0, sameDistinctHobby: true, out var reasons);

        Assert.Equal(5, score);
        Assert.Contains(reasons, reason => reason.Contains("custom hobby"));
    }

    [Fact]
    public void Hobbies_TotalCapsAtMax25()
    {
        // 20 (shared, capped) + 5 (custom hobby bonus) = 25 = MaxHobbies.
        var score = MatchScore.Hobbies(commonHobbyCount: 5, sameDistinctHobby: true, out _);

        Assert.Equal(MatchScore.MaxHobbies, score);
        Assert.Equal(25, score);
    }

    // ------ Learning Goals ------

    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 5)]
    [InlineData(4, 20)]
    [InlineData(5, 20)] // caps at 20
    [InlineData(9, 20)]
    public void LearningGoals_ScaleAndCapAt20(int commonCount, int expected)
    {
        var score = MatchScore.LearningGoals(commonCount, out _);

        Assert.Equal(expected, score);
    }

    // ------ Tandem Form ------

    [Fact]
    public void TandemForm_SameForm_ReturnsFull()
    {
        var score = MatchScore.TandemForm(currentFormId: 1, candidateFormId: 1, hybridFormId: 3, out var reasons);

        Assert.Equal(MatchScore.MaxTandemForm, score);
        Assert.Equal(10, score);
        Assert.NotEmpty(reasons);
    }

    [Theory]
    [InlineData(3, 1)] // current user prefers hybrid
    [InlineData(1, 3)] // candidate prefers hybrid
    public void TandemForm_OneSideHybrid_ReturnsPartial(int currentForm, int candidateForm)
    {
        var score = MatchScore.TandemForm(currentForm, candidateForm, hybridFormId: 3, out var reasons);

        Assert.Equal(5, score);
        Assert.NotEmpty(reasons);
    }

    [Fact]
    public void TandemForm_DifferentNonHybridForms_ReturnsZero()
    {
        var score = MatchScore.TandemForm(currentFormId: 1, candidateFormId: 2, hybridFormId: 3, out var reasons);

        Assert.Equal(0, score);
        Assert.Empty(reasons);
    }

    // ------ Tandem Frequency ------

    [Fact]
    public void TandemFrequency_SameFrequency_ReturnsFull()
    {
        var score = MatchScore.TandemFrequency(currentFrequencyId: 1, candidateFrequencyId: 1, flexibleFrequencyId: 3, out var reasons);

        Assert.Equal(MatchScore.MaxTandemFrequency, score);
        Assert.Equal(5, score);
        Assert.NotEmpty(reasons);
    }

    [Theory]
    [InlineData(3, 1)] // current user is flexible
    [InlineData(1, 3)] // candidate is flexible
    public void TandemFrequency_OneSideFlexible_ReturnsPartial(int currentFrequency, int candidateFrequency)
    {
        var score = MatchScore.TandemFrequency(currentFrequency, candidateFrequency, flexibleFrequencyId: 3, out var reasons);

        Assert.Equal(2, score);
        Assert.NotEmpty(reasons);
    }

    [Fact]
    public void TandemFrequency_DifferentNonFlexibleFrequencies_ReturnsZero()
    {
        // e.g. Weekly (1) vs Monthly (2), neither is Flexible (3).
        var score = MatchScore.TandemFrequency(currentFrequencyId: 1, candidateFrequencyId: 2, flexibleFrequencyId: 3, out var reasons);

        Assert.Equal(0, score);
        Assert.Empty(reasons);
    }

    // ------ Total Points ------

    [Fact]
    public void MaxTotal_IsExactly100()
    {
        Assert.Equal(100, MatchScore.MaxTotal);
    }

    [Fact]
    public void ComponentMaxima_SumToExactly100()
    {
        var sum = MatchScore.MaxLanguage
                  + MatchScore.MaxHobbies
                  + MatchScore.MaxLearningGoals
                  + MatchScore.MaxTandemForm
                  + MatchScore.MaxTandemFrequency;

        Assert.Equal(100, sum);
        Assert.Equal(MatchScore.MaxTotal, sum);
    }

    [Fact]
    public void PerfectCandidate_ScoresExactly100()
    {
        var language = MatchScore.Language(candidateMotherLanguageId: 7, candidateTargetKnownRank: null, targetLanguageId: 7, targetRank: 0, out _); // 40
        var hobbies = MatchScore.Hobbies(commonHobbyCount: 5, sameDistinctHobby: true, out _); // 25
        var goals = MatchScore.LearningGoals(commonLearningGoalCount: 9, out _); // 20
        var form = MatchScore.TandemForm(currentFormId: 1, candidateFormId: 1, hybridFormId: 3, out _); // 10
        var frequency = MatchScore.TandemFrequency(currentFrequencyId: 1, candidateFrequencyId: 1, flexibleFrequencyId: 3, out _); // 5

        var total = language + hobbies + goals + form + frequency;

        Assert.Equal(100, total);
        Assert.Equal(MatchScore.MaxTotal, total);
    }

    [Fact]
    public void CanSatisfyTarget_NativeSpeakerOfTarget_ReturnsTrue()
    {
        var ok = MatchScore.CanSatisfyTarget(
            motherLanguageId: 7,
            knownLanguageRanks: new Dictionary<int, int>(),
            targetLanguageId: 7,
            targetRank: 5);

        Assert.True(ok);
    }

    [Theory]
    [InlineData(3, 3)]
    [InlineData(4, 3)]
    public void CanSatisfyTarget_KnowsTargetAtOrAboveLevel_ReturnsTrue(int knownRank, int requiredRank)
    {
        var known = new Dictionary<int, int> { [7] = knownRank };

        var ok = MatchScore.CanSatisfyTarget(motherLanguageId: 1, known, targetLanguageId: 7, targetRank: requiredRank);

        Assert.True(ok);
    }

    [Fact]
    public void CanSatisfyTarget_KnowsTargetBelowLevel_ReturnsFalse()
    {
        var known = new Dictionary<int, int> { [7] = 1 };

        var ok = MatchScore.CanSatisfyTarget(motherLanguageId: 1, known, targetLanguageId: 7, targetRank: 3);

        Assert.False(ok);
    }

    [Fact]
    public void CanSatisfyTarget_DoesNotKnowTargetAndNotNative_ReturnsFalse()
    {
        var known = new Dictionary<int, int> { [9] = 5 };

        var ok = MatchScore.CanSatisfyTarget(motherLanguageId: 1, known, targetLanguageId: 7, targetRank: 0);

        Assert.False(ok);
    }
}
