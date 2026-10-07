using StudentLab;
using Xunit;

namespace StudentLab.Tests;

public class ExperimentStoreTests
{
    [Fact]
    public void Add_NewExperiment_IsReadableAndIncomplete()
    {
        var store = new ExperimentStore();
        var item = store.Add("Try a new feature");
        Assert.NotEqual(Guid.Empty, item.Id);
        Assert.Equal("Try a new feature", item.Title);
        Assert.False(item.IsComplete);
        Assert.Equal(item, store.Find(item.Id));
        Assert.Contains(item, store.List());
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void Update_ExistingExperiment_PreservesIdentityAndTitle(bool isComplete)
    {
        var store = new ExperimentStore();
        var item = store.Add("Keep this title");
        var updated = store.Update(item.Id, isComplete);
        Assert.NotNull(updated);
        Assert.Equal(item.Id, updated.Id);
        Assert.Equal(item.Title, updated.Title);
        Assert.Equal(isComplete, updated.IsComplete);
        Assert.Equal(updated, store.Find(item.Id));
        Assert.False(item.IsComplete); // Previously returned records remain immutable.
    }

    [Fact]
    public void Delete_ExistingExperiment_RemovesOnlyThatExperiment()
    {
        var store = new ExperimentStore();
        var removed = store.Add("Remove me");
        var retained = store.Add("Keep me");
        Assert.True(store.Delete(removed.Id));
        Assert.Null(store.Find(removed.Id));
        Assert.False(store.Delete(removed.Id));
        Assert.Equal(retained, store.Find(retained.Id));
    }

    [Fact]
    public void MissingId_ReadUpdateAndDelete_DoNotChangeTheBoard()
    {
        var store = new ExperimentStore();
        var before = store.List();
        var missingId = Guid.NewGuid();
        Assert.Null(store.Find(missingId));
        Assert.Null(store.Update(missingId, true));
        Assert.False(store.Delete(missingId));
        Assert.Equal(before, store.List());
    }

    [Fact]
    public void List_ChangingReturnedArray_DoesNotChangeStoredData()
    {
        var store = new ExperimentStore();
        var snapshot = store.List();
        var original = snapshot[0];
        snapshot[0] = original with { Title = "Modified snapshot" };
        Assert.Equal(original, store.Find(original.Id));
    }

    [Fact]
    public void Stores_SeparateInstances_DoNotShareChanges()
    {
        var first = new ExperimentStore();
        var second = new ExperimentStore();
        var item = first.Add("Only in the first store");
        Assert.Null(second.Find(item.Id));
    }

    [Fact]
    public void Add_ConcurrentCalls_RetainsEveryItemWithUniqueIds()
    {
        var store = new ExperimentStore();
        var originalCount = store.List().Length;
        Parallel.For(0, 100, index => store.Add($"Concurrent item {index}"));
        var items = store.List();
        Assert.Equal(originalCount + 100, items.Length);
        Assert.Equal(items.Length, items.Select(item => item.Id).Distinct().Count());
    }
}
