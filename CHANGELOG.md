# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows semantic versioning.

## [1.0.1] - 2026-04-05

### Fixed
- Corrected the import path in `src/index.js` to match the actual filename casing of `src/core/Exprify.js`.
- Resolved a cross-platform build issue where Rollup failed on Linux-based CI environments because of case-sensitive path resolution.
