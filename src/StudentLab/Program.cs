using StudentLab;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<ExperimentStore>();
builder.Services.AddSingleton<CreateExperimentValidator>();
builder.Services.AddSingleton<UpdateExperimentValidator>();
builder.Services.AddProblemDetails();
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 16_384);
var app = builder.Build();
app.UseExceptionHandler();
app.Use(async (context, next) =>
{
    context.Response.Headers.ContentSecurityPolicy = "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'";
    context.Response.Headers.XContentTypeOptions = "nosniff";
    await next(context);
});
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/experiments", (ExperimentStore store) => Results.Ok(store.List()));
app.MapPost("/api/experiments", (CreateExperiment request, ExperimentStore store, CreateExperimentValidator validator) =>
{
    if (!validator.Validate(request).IsValid)
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["title"] = ["Enter a title between 1 and 100 characters."] });
    var experiment = store.Add(request.Title!.Trim());
    return Results.Created($"/api/experiments/{experiment.Id}", experiment);
});
app.MapGet("/api/experiments/{id:guid}", (Guid id, ExperimentStore store) =>
    store.Find(id) is { } experiment ? Results.Ok(experiment) : Results.NotFound());
app.MapPut("/api/experiments/{id:guid}", (Guid id, UpdateExperiment request, ExperimentStore store, UpdateExperimentValidator validator) =>
{
    if (!validator.Validate(request).IsValid)
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["isComplete"] = ["Provide true or false."] });
    return store.Update(id, request.IsComplete!.Value) is { } experiment
        ? Results.Ok(experiment) : Results.NotFound();
});
app.MapDelete("/api/experiments/{id:guid}", (Guid id, ExperimentStore store) =>
    store.Delete(id) ? Results.NoContent() : Results.NotFound());
// Unknown API routes must remain JSON/404 instead of returning the SPA HTML.
app.MapFallback("/api/{**path}", () => Results.NotFound());
app.MapFallbackToFile("index.html");
app.Run();

