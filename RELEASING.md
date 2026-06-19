# Releasing

## Release flow

1. Update package contents in the repository root.
2. Run local validation:

```bash
npm ci
npm run build
npm run lint
npm run test
npm pack
```

3. Bump `version` in `package.json`.
4. Create a tag using the package-specific convention:

```bash
git tag flow-skills-vX.Y.Z
git push origin flow-skills-vX.Y.Z
```

5. Ensure `NPM_TOKEN` is configured in the repository secrets.
6. Let `.github/workflows/flow-skills-release.yml` run validation and publish.

## Notes

- the workflow validates before publish
- the workflow publishes from the repository root
- the workflow currently uses `npm publish --access public`
- if the package should remain private, change the publish command before the first release
