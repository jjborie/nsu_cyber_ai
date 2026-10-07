using StudentLab;
using Xunit;

namespace StudentLab.Tests;

public class ExperimentValidationTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_EmptyTitle_IsRejected(string? title)
        => Assert.False(new CreateExperimentValidator().Validate(new CreateExperiment(title)).IsValid);

    [Fact]
    public void Create_TitleLengthBoundary_IsEnforcedAfterTrimming()
    {
        var validator = new CreateExperimentValidator();
        Assert.True(validator.Validate(new CreateExperiment(" " + new string('x', 100) + " ")).IsValid);
        Assert.False(validator.Validate(new CreateExperiment(new string('x', 101))).IsValid);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void Update_ExplicitBoolean_IsValid(bool value)
        => Assert.True(new UpdateExperimentValidator().Validate(new UpdateExperiment(value)).IsValid);

    [Fact]
    public void Update_MissingBoolean_IsRejected()
        => Assert.False(new UpdateExperimentValidator().Validate(new UpdateExperiment(null)).IsValid);
}
