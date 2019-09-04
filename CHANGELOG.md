# Changelog

## 2.9.1 - 2019-09-04
### Changed
- Updated `bowser` subdependency from 2.5.3 to 2.5.4. See [#88](https://github.com/helmetjs/csp/pull/88)

### Fixed
- The "security" keyword was declared twice in package metadata. See [#87](https://github.com/helmetjs/csp/pull/87)

## 2.9.0 - 2019-08-28
### Added
- Added TypeScript type definitions. See [#86](https://github.com/helmetjs/csp/pull/86)

### Fixed
- Switched from `platform` to `bowser` to quiet a security vulnerability warning. See [#80](https://github.com/helmetjs/csp/issues/80)

## 2.8.0 - 2019-07-24
### Added
- Added a new `sandbox` directive, `allow-downloads-without-user-activation` (see [#85](https://github.com/helmetjs/csp/pull/85))
- Created a changelog
- Added some package metadata

### Changed
- Updated documentation to use ES2015
- Updated documentation to remove dependency on UUID package
- Updated `content-security-policy-builder` to 2.1.0
- Excluded some files from the npm package

Changes in versions 2.7.1 and below can be found in [Helmet's changelog](https://github.com/helmetjs/helmet/blob/master/CHANGELOG.md).
