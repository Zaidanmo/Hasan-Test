namespace LinkUp.Core.Entities;

public class UserLearningGoal
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public int LearningGoalId { get; set; }
    public LearningGoal LearningGoal { get; set; } = null!;
}