# Try it yourself

For each exercise: describe the expected behavior, make a small change, verify it, and explain what you learned. Use a branch or a copy of the project for experiments.

1. **Follow a request.** Add an experiment with DevTools Network open. Identify the method, JSON body, status, and response. Find the endpoint and DOM update that handle it.
2. **Filter the board.** Add All / Incomplete / Complete filters in the SPA. Keep the stored data unchanged. Verify empty-filter results and keyboard navigation.
3. **Extend the contract.** Add a category with a small allowed set. Update backend validation, frontend form, response rendering, documentation, and HTTP checks together. Verify unknown categories are rejected.
4. **Practice negative tests.** Send a blank title, 101 characters, a missing completion flag, and a nonexistent ID. Explain why browser validation alone is insufficient.
5. **Explore safe rendering.** Add `<img src=x onerror=alert(1)>` as a title on your local board. It should display as text. Explain the role of `textContent` and the content security policy without weakening either.
6. **Add persistence.** Replace the store with SQLite. Preserve the API contract. Verify that restart retains data and that queries use parameters. Document new dependencies and setup.
7. **Investigate access control.** Sketch how students could have private boards. Identify where ownership checks belong before implementing authentication. Never use a client-supplied user ID as proof of identity.
8. **Review an AI change.** Ask an assistant for one feature. Read its diff, run checks, and find an edge case it missed. Record evidence rather than accepting a claim that it works.

Keep security experiments on your own local instance with fictional data.
