using FluentValidation;

namespace StudentLab;

public record CreateExperiment(string? Title);
public record UpdateExperiment(bool? IsComplete);

public sealed class CreateExperimentValidator : AbstractValidator<CreateExperiment>
{
    public CreateExperimentValidator()
    {
        RuleFor(request => request.Title)
            .Must(title => !string.IsNullOrWhiteSpace(title) && title.Trim().Length <= 100)
            .WithMessage("Enter a title between 1 and 100 characters.");
    }
}

public sealed class UpdateExperimentValidator : AbstractValidator<UpdateExperiment>
{
    public UpdateExperimentValidator()
    {
        RuleFor(request => request.IsComplete).NotNull().WithMessage("Provide true or false.");
    }
}
