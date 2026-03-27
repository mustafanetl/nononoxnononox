

# Bypass Paywall Gating (Keep Code, Easy to Re-enable)

## Approach
Set `isPremium` to always return `true` in the subscription hook. This single change bypasses all gating everywhere. To re-enable later, just revert this one line.

## File to Modify

### `src/hooks/useSubscription.ts`
- Change `const isPremium = plan !== "free"` to `const isPremium = true` 
- Add a comment: `// TODO: Re-enable paywall: const isPremium = plan !== "free"`

That's it — one line change, all paywall checks bypassed, trivial to restore.

