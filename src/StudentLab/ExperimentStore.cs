namespace StudentLab;

public record Experiment(Guid Id, string Title, bool IsComplete);

// A single shared demo board. Restarting the server restores these sample items.
public sealed class ExperimentStore
{
    private readonly object gate = new();
    private readonly List<Experiment> experiments =
    [
        new(Guid.NewGuid(), "Inspect an API request in browser DevTools", false),
        new(Guid.NewGuid(), "Add a category to each experiment", false),
        new(Guid.NewGuid(), "Test how the API rejects an empty title", true)
    ];

    public Experiment[] List() { lock (gate) return experiments.ToArray(); }
    public Experiment? Find(Guid id) { lock (gate) return experiments.Find(item => item.Id == id); }
    public Experiment Add(string title)
    {
        lock (gate)
        {
            var item = new Experiment(Guid.NewGuid(), title, false);
            experiments.Add(item);
            return item;
        }
    }
    public Experiment? Update(Guid id, bool isComplete)
    {
        lock (gate)
        {
            var index = experiments.FindIndex(item => item.Id == id);
            if (index < 0) return null;
            return experiments[index] = experiments[index] with { IsComplete = isComplete };
        }
    }
    public bool Delete(Guid id) { lock (gate) return experiments.RemoveAll(item => item.Id == id) > 0; }
}
