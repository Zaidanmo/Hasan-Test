using LinkUp.Api.Features.Catalogs;
using LinkUp.Core.Entities;
using LinkUp.Core.Interfaces;

namespace LinkUp.Api.Features.Matching;

public sealed class MatchingHandler : IMatchingHandler
{
    private readonly ILinkUpRepository _linkUpRepository;
    private readonly ICatalogCache _catalogCache;
    private readonly ILogger<MatchingHandler> _logger;

    private const string HybridTandemFormCode = "Hybrid";
    private const string FlexibleTandemFrequencyCode = "Flexible";

    public MatchingHandler(ILinkUpRepository linkUpRepository, ICatalogCache catalogCache, ILogger<MatchingHandler> logger)
    {
        _linkUpRepository = linkUpRepository;
        _catalogCache = catalogCache;
        _logger = logger;
    }

    public async Task<PagedResult<MatchDto>> GetMatchesAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var currentUser = await _linkUpRepository.GetUserByIdReadOnlyAsync(userId, cancellationToken);

        if (currentUser is null)
        {
            return new PagedResult<MatchDto>
            {
                Items = new List<MatchDto>(),
                Page = page,
                PageSize = pageSize,
                TotalItems = 0,
                TotalPages = 0
            };
        }

        var candidates = await _linkUpRepository.GetCandidateUsersForMatchingAsync(
            currentUser.Id,
            currentUser.TargetLanguageId,
            currentUser.TargetLanguageLevel,
            cancellationToken);

        var favoriteUserIds = await _linkUpRepository.GetFavoriteUserIdsByUserAsync(
            currentUser.Id,
            cancellationToken);

        var usersWhoFavoritedCurrentUser = await _linkUpRepository.GetUserIdsWhoFavoritedUserAsync(
            currentUser.Id,
            cancellationToken);

        var favoriteUserIdSet = favoriteUserIds.ToHashSet();
        var usersWhoFavoritedCurrentUserSet = usersWhoFavoritedCurrentUser.ToHashSet();

        // Resolve catalog codes from the in-memory cache (built once per request) instead of joining
        // the catalog tables for every candidate.
        var context = await BuildMatchingContextAsync(currentUser, cancellationToken);

        var matches = candidates
            .Where(candidate => IsLanguageReciprocal(context, candidate))
            .Select(candidate => CalculateMatch(
                context,
                candidate,
                favoriteUserIdSet.Contains(candidate.Id),
                favoriteUserIdSet.Contains(candidate.Id) &&
                usersWhoFavoritedCurrentUserSet.Contains(candidate.Id)))
            .OrderByDescending(match => match.MatchScore)
            .ThenByDescending(match => match.HobbyScore)
            .ThenByDescending(match => match.LanguageScore)
            .ThenBy(match => match.Username)
            .ToList();

        var totalItems = matches.Count;

        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)pageSize);

        var pagedMatches = matches
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new PagedResult<MatchDto>
        {
            Items = pagedMatches,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        };
    }
    
    public async Task<FavoriteResultDto> FavoriteUserAsync(
        Guid userId,
        Guid favoriteUserId,
        CancellationToken cancellationToken)
    {
        if (userId == favoriteUserId)
        {
            throw new InvalidOperationException("You cannot favorite yourself.");
        }

        var currentUserExists = await _linkUpRepository.UserExistsByIdAsync(userId, cancellationToken);

        if (!currentUserExists)
        {
            throw new InvalidOperationException("Current user does not exist.");
        }

        var favoriteUserExists = await _linkUpRepository.UserExistsByIdAsync(favoriteUserId, cancellationToken);

        if (!favoriteUserExists)
        {
            throw new InvalidOperationException("Favorite user does not exist.");
        }

        var alreadyFavorited = await _linkUpRepository.UserFavoriteExistsAsync(
            userId,
            favoriteUserId,
            cancellationToken);

        if (!alreadyFavorited)
        {
            var favorite = new UserFavorite(userId, favoriteUserId);

            await _linkUpRepository.AddUserFavoriteAsync(favorite, cancellationToken);

            try
            {
                await _linkUpRepository.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                var favoriteNowExists = await _linkUpRepository.UserFavoriteExistsAsync(
                    userId,
                    favoriteUserId,
                    cancellationToken);

                if (!favoriteNowExists)
                {
                    throw;
                }
                _logger.LogDebug("Duplicate favorite insert was ignored because the favorite already exists.");
            }
        }

        return await BuildFavoriteResultAsync(
            userId,
            favoriteUserId,
            cancellationToken);
    }
    
    private async Task<FavoriteResultDto> BuildFavoriteResultAsync(
        Guid userId,
        Guid favoriteUserId,
        CancellationToken cancellationToken)
    {
        var isMatch = await _linkUpRepository.MutualFavoriteExistsAsync(
            userId,
            favoriteUserId,
            cancellationToken);

        return new FavoriteResultDto
        {
            FavoriteUserId = favoriteUserId,
            IsMatch = isMatch,
            Message = isMatch ? "It's a match." : "Favorite saved."
        };
    }
    
    public async Task<List<MutualMatchDto>> GetMutualMatchesAsync(Guid userId, CancellationToken cancellationToken)
    {
        var currentUser = await _linkUpRepository.GetUserByIdReadOnlyAsync(userId, cancellationToken);

        if (currentUser is null)
        {
            return new List<MutualMatchDto>();
        }

        var mutualFavoriteUsers = await _linkUpRepository.GetMutualFavoriteUsersByUserAsync(
            currentUser.Id,
            cancellationToken);

        return mutualFavoriteUsers
            .Select(ToMutualMatchDto)
            .ToList();
    }

    private static MutualMatchDto ToMutualMatchDto(User user)
    {
        return new MutualMatchDto
        {
            UserId = user.Id,
            Username = user.Username,
            FirstName = user.FirstName,
            Surname = user.Surname,
            Degree = user.Degree,
            Country = user.Country,
        };
    }

    #region Matching Calculation

    private async Task<MatchingContext> BuildMatchingContextAsync(User currentUser, CancellationToken cancellationToken)
    {
        var tandemFormCodes = await _catalogCache.GetIdToCodeAsync<TandemForm>(cancellationToken);
        var hybridTandemFormId = tandemFormCodes
            .FirstOrDefault(entry => string.Equals(entry.Value, HybridTandemFormCode, StringComparison.Ordinal))
            .Key;

        var tandemFrequencyCodes = await _catalogCache.GetIdToCodeAsync<TandemFrequency>(cancellationToken);
        var flexibleTandemFrequencyId = tandemFrequencyCodes
            .FirstOrDefault(entry => string.Equals(entry.Value, FlexibleTandemFrequencyCode, StringComparison.Ordinal))
            .Key;

        return new MatchingContext(
            currentUser.TandemFormId,
            currentUser.TandemFrequencyId,
            currentUser.TargetLanguageId,
            currentUser.TargetLanguageLevel,
            currentUser.DistinctHobby,
            currentUser.UserHobbies.Select(userHobby => userHobby.HobbyId).ToHashSet(),
            currentUser.UserLearningGoals.Select(userLearningGoal => userLearningGoal.LearningGoalId).ToHashSet(),
            await _catalogCache.GetIdToCodeAsync<Hobby>(cancellationToken),
            await _catalogCache.GetIdToCodeAsync<LearningGoal>(cancellationToken),
            await _catalogCache.GetIdToCodeAsync<Language>(cancellationToken),
            tandemFormCodes,
            tandemFrequencyCodes,
            hybridTandemFormId,
            flexibleTandemFrequencyId,
            currentUser.MotherLanguageId,
            currentUser.KnownLanguages
                .GroupBy(knownLanguage => knownLanguage.LanguageId)
                .ToDictionary(group => group.Key, group => group.Max(knownLanguage => knownLanguage.LevelRank)));
    }

    private static MatchDto CalculateMatch(
        MatchingContext context,
        User candidate,
        bool isLikedByCurrentUser,
        bool isMutualMatch)
    {
        // Common hobbies/goals are ordered by id, which matches the seeded SortOrder.
        var commonHobbies = candidate.UserHobbies
            .Select(userHobby => userHobby.HobbyId)
            .Where(context.CurrentHobbyIds.Contains)
            .OrderBy(hobbyId => hobbyId)
            .Select(hobbyId => context.HobbyCodes[hobbyId])
            .ToList();

        var commonLearningGoals = candidate.UserLearningGoals
            .Select(userLearningGoal => userLearningGoal.LearningGoalId)
            .Where(context.CurrentLearningGoalIds.Contains)
            .OrderBy(learningGoalId => learningGoalId)
            .Select(learningGoalId => context.LearningGoalCodes[learningGoalId])
            .ToList();

        // Highest level at which the candidate knows the current user's target language (null = not listed).
        var candidateTargetKnownRank = candidate.KnownLanguages
            .Where(known => known.LanguageId == context.TargetLanguageId)
            .Select(known => (int?)known.LevelRank)
            .Max();

        var languageScore = MatchScore.Language(
            candidate.MotherLanguageId,
            candidateTargetKnownRank,
            context.TargetLanguageId,
            (int)context.TargetLanguageLevel,
            out var languageReasons);

        var hobbyScore = MatchScore.Hobbies(
            commonHobbies.Count,
            HasSameDistinctHobby(context.CurrentDistinctHobby, candidate.DistinctHobby),
            out var hobbyReasons);

        var learningGoalScore = MatchScore.LearningGoals(commonLearningGoals.Count, out var learningGoalReasons);

        var tandemFormScore = MatchScore.TandemForm(
            context.CurrentTandemFormId,
            candidate.TandemFormId,
            context.HybridTandemFormId,
            out var tandemFormReasons);

        var tandemFrequencyScore = MatchScore.TandemFrequency(
            context.CurrentTandemFrequencyId,
            candidate.TandemFrequencyId,
            context.FlexibleTandemFrequencyId,
            out var tandemFrequencyReasons);

        var totalScore = languageScore + hobbyScore + learningGoalScore + tandemFormScore + tandemFrequencyScore;

        var reasons = new List<string>();
        reasons.AddRange(languageReasons);
        reasons.AddRange(hobbyReasons);
        reasons.AddRange(learningGoalReasons);
        reasons.AddRange(tandemFormReasons);
        reasons.AddRange(tandemFrequencyReasons);

        return new MatchDto
        {
            UserId = candidate.Id,
            Username = candidate.Username,
            FirstName = candidate.FirstName,
            Surname = candidate.Surname,
            Degree = candidate.Degree,
            Country = candidate.Country,
            MotherLanguage = context.LanguageCodes[candidate.MotherLanguageId],

            TargetLanguage = new UserLanguage
            {
                Language = context.LanguageCodes[candidate.TargetLanguageId],
                Level = candidate.TargetLanguageLevel
            },
            TandemForm = context.TandemFormCodes[candidate.TandemFormId],
            TandemFrequency = context.TandemFrequencyCodes[candidate.TandemFrequencyId],
            Bio = candidate.Bio,
            HasProfilePicture = candidate.ProfilePictureFileName is not null,

            MatchScore = totalScore,
            LanguageScore = languageScore,
            HobbyScore = hobbyScore,
            LearningGoalScore = learningGoalScore,
            // Tandem preference: form (max 10) + frequency (max 5) into a single 15-point score.
            TandemPreferenceScore = tandemFormScore + tandemFrequencyScore,

            CommonHobbies = commonHobbies,
            CommonLearningGoals = commonLearningGoals,
            Reasons = reasons,
            IsLikedByCurrentUser = isLikedByCurrentUser,
            IsMutualMatch = isMutualMatch
        };
    }

    private static bool IsLanguageReciprocal(MatchingContext context, User candidate)
    {
        return MatchScore.CanSatisfyTarget(
            context.CurrentMotherLanguageId,
            context.CurrentKnownLanguageRanks,
            candidate.TargetLanguageId,
            (int)candidate.TargetLanguageLevel);
    }

    private static bool HasSameDistinctHobby(string? currentDistinctHobby, string? candidateDistinctHobby)
    {
        if (string.IsNullOrWhiteSpace(currentDistinctHobby) || string.IsNullOrWhiteSpace(candidateDistinctHobby))
        {
            return false;
        }

        return string.Equals(
            currentDistinctHobby.Trim(),
            candidateDistinctHobby.Trim(),
            StringComparison.OrdinalIgnoreCase);
    }

    private sealed record MatchingContext(
        int CurrentTandemFormId,
        int CurrentTandemFrequencyId,
        int TargetLanguageId,
        LanguageLevel TargetLanguageLevel,
        string CurrentDistinctHobby,
        IReadOnlySet<int> CurrentHobbyIds,
        IReadOnlySet<int> CurrentLearningGoalIds,
        IReadOnlyDictionary<int, string> HobbyCodes,
        IReadOnlyDictionary<int, string> LearningGoalCodes,
        IReadOnlyDictionary<int, string> LanguageCodes,
        IReadOnlyDictionary<int, string> TandemFormCodes,
        IReadOnlyDictionary<int, string> TandemFrequencyCodes,
        int HybridTandemFormId,
        int FlexibleTandemFrequencyId,
        int CurrentMotherLanguageId,
        IReadOnlyDictionary<int, int> CurrentKnownLanguageRanks);

    #endregion
}