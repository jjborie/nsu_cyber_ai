using System.Diagnostics;
class ProcessReview
{
    void Run(string command)
    {
        // ruleid: academic-csharp-process-execution
        Process.Start(command);
    }
}
