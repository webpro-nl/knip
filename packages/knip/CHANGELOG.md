# Changelog

## Release 6.23.0

* feat: add customCss to Starlight plugin (#1828) (f85d96f84a47f10c34df95a5246ee1ddefd95db5) - thanks @trueberryless!
* fix: enable vite and vitest plugins when vite-plus is found (#1830) (62e97538fca8dff3d152326b114ffc4b7241a0d2) - thanks @ghostdevv!
* feat: add support for @astrojs/markdoc (#1829) (94e2863308947f19f5e759cc12666952c8f683d7) - thanks @trueberryless!
* Support nub (resolve #1831) (8a6050e6a92da81d4875f730f852fb7d9252a018)
* Don't report optimizeDeps and dedupe deps as unlisted (resolve #1832) (849b5ac230e7a8c103b6e1b1e2ddb333d2da3ca0)

## Release 6.22.0

* Support XO v1+ (#1819) (1dffe368b5c336d190e358ab4c2e2240e3d50e26) - thanks @patrik-csak!
* feat: detect execaNode scripts in execa visitor (#1824) (5095ae1ccd0ceb083d4434e827443f03ba19a1ff) - thanks @gwagjiug!
* Skip optional peerDeps referenced only via a host (resolve #1823) (7759a9894f2ac1d9425cf682e1e3c400f0976080)
* docs: update npmjs.com links to npmx.dev (#1826) (11fe8bd248c839c6eeb95b06c8204c25294e0adb) - thanks @serhalp!
* docs: fix semi-broken link to DEVELOPMENT.md in CONTRIBUTING.md (#1827) (a5302b2466be1294633b1f40e86ca81a00605293) - thanks @serhalp!
* feat: add support for Lunaria (#1825) (3e1b8212086dfae26fa7f368f245285ec82af14d) - thanks @trueberryless!
* Fix lint issues (76c92e2328a94257afead6ae497a747a9e2944ea)

## Release 6.21.0

* Detect Vite config dependencies (resolve #1721) (8754c43368112922c6f80d1f8d1d8ddb6cb29f25)
* fix: Update timerifyMethods to include resolveFromAST (#1814) (3c8deac3b856def31c16372f85525bf867105132) - thanks @gwagjiug!
* Fix crash on null root export in package.json (resolve #1815) (9b8af2b343e1aacae46fedcb155252f56f9bae61)
* Fix unresolved subpath imports with a colon prefix (resolve #1816) (f89db4192ff7ff6c873828ed19fe40d379566b49)
* Detect Next.js entry files in subdirectory (resolve #1817) (f32c6ea215dde54a59af7b91fd8bdd2177cc2881)

## Release 6.20.0

* Add raw transfer opt-out (resolve #1813) (6f08c680ac4acd6edf0806ba3c1c5c8f7bca24cd)
* Fix cached plugin config cycles (resolve #1811) (2bc2f2420ca71db1ae70846626c6152896d270ee)

## Release 6.19.0

* feat: support new optional sveltekit config pattern via vite config (#1810) (3fee8bf608e0862d7bcdd1377cfb859a9185f17d) - thanks @fubits1!
* Optimize hot path string scanning (e30cfe796423e3ecd9adff42291f3c4de6604d2b)
* Update astro snapshot (71e71a71b888a1b8034d4438635e94831d62b330)

## Release 6.18.0

* Update dependencies (pin oxc-resolver) (7dda4eccc65c6d61ef2546442eb752b2a73edab9)
* Resolve tsconfig paths for non-TS importers independent of oxc ownership (3b71565e72107d43cbd6d2ddec7ab2fbbf65c001)
* Format (64865f8247b8956def52f1a387234562fbddd667)
* Fix false positive for Vitest mocks (#1802) (ec93e2013deb53902b406463b30fa6386445f9c9) - thanks @remcohaszing!
* Mark npx-run binaries optional unless --no-install (resolve #1803) (203c31e1b2bd77eb9c94f82121f353fbf0671c67)
* Ignore pnpm [WARN] lines in ecosystem snapshots (392835a39b9429a3d85d712025da4c6531b8ece6)
* Update slonik snapshot (62d802bf8d53d7790f6322f481a290e09812cbcc)
* Update Jest entry patterns for Jest 30 (#1808) (d2caeddf32ba99ca12e5c26e891b7974392f981a) - thanks @gwagjiug!
* Report stale workspaces configuration keys as configuration hints (#1807) (9083c16b3313fbebf5cb3cd11cadf45ac773bc3d) - thanks @WooWan!

## Release 6.17.2

* Fix up jest plugin (63dbd653b6e1be08a36401f5f728b351ab69e81b)
* Detect coverage provider from bare `vitest --coverage` flag (#1800) (dc11d9fc5458e6e1f734013eb82403eab07af2c1) - thanks @WooWan!
* Don't disable configuration hints in workspace-scoped runs (#1791) (8ce1ec8160a786dad90903e43c3ef646ffba9464) - thanks @WooWan!
* Detect react-email v6 packages from non-numeric version ranges (resolve #1798) (27a1caeb1bff6abcccd7140c7e92e4a57197ad47)
* Discover workspaces included after a negated pattern (resolve #1797) (630e152f6f687d9404cc25ffa01f0d49737d9229)

## Release 6.17.1

* Remove ignoreBinaries w/ tar (b13d0ca1ce0a201b7e66f725039d9f346b4d424e)
* Wrap up docs/refs (29f3e46cc765a70643bcf2ef96e940ff371f39c6)
* Update dependencies (7b2f3458176110900204fa49e50650ac50d1f4db)
* Fix up vscode-languageclient imports (820c2335ca63f329f862eb8ec5c264bd8d5f09eb)

## Release 6.17.0

* chore(mcp): add package metadata links (#1783) (e3d93b930) - thanks @sh962214-hub!
* fix(capacitor): detect iOS platform with Swift Package Manager (#1787) (e6cc533a8) - thanks @jthrilly!
* Support ignoreIssues per workspace (resolve #1782) (15a329a05)
* Add commitlint.config.mts (resolve #1784) (fa8eb6da8)
* Treat scoped and tilde SCSS imports as packages (resolve #1786) (98aa9623e)
* Add followCursor setting for Imports/Exports views (resolve #1788) (67a0be89f)
* Flag undeclared sibling imports in published workspaces (resolve #1792) (aeabff789)
* Fix type-check errors in vscode-knip (12f266e94)
* Note Markdown formatting with pnpm remark (bdffeec0d)
* Bump some doc-related dependencies (333419303)
* Update vscode-knip tool descriptions (be341788c)
* Overhaul docs (55e3f3bda)
* Improve mcp guidance (67483f0ac)
* Fix repeated --fix-type arg (9bb0512ca)
* Resolve module paths from selected tsconfig (resolve #1794) (1c2f39833)
* Update sanity snapshot (4ebce9c50)
* Add tar to globally ignored binaries (resolve #1796) (8c028e5fb)

## Release 6.16.1

* Resolve SvelteKit ./$types in monorepos (resolve #1778) (370ef4cefec6540ee7d58249cc402f479ec76405)

## Release 6.16.0

* Update sponsors data + fix sponsors layout on narrow screen (fadf13aad5ebc36f7bc2fbc7615bfa77681d3660)
* Detect binaries and entry files in node:child_process calls (fc3598cfac640a2ae53b0113883574bf15bc5d47)
* It works™ (2d9ce845121484ef3ff84e4a761cfd98891d6c09)
* Extend known issues doc w/ workaround (close #1763) (fcd444bf4c6b2ddc5d7bb0ebfd6f3991cf5d0be2)
* Support ignoreExportsUsedInFile per workspace (close #1495) (4b898a971105d865d86d4dc81bc694721bff8793)
* feat(vscode): add `workspaceRoot` config option to enable use in a VSCode workspace that does not have package.json at the workspace root (#1667) (7c1ebef6ab6d1c5a7f2f920d4243241246b53f4b) - thanks @anmilleriii!
* Replace minimist with node:util.parseArgs (resolve #1492) (b360c5ce1acfbb2cbd5f4e92ecca6c9b461ae094)
* Preserve minimist numeric coercion and --no-x negation (c12153ce0601378354421e454a6b6bbab74ae9fb)
* Simplify parseArgs adapter (ba15e413be7515620e4224b21483a1a87659dc34)
* Detect and credit registered custom elements (resolve #1394) (62dcda5fa46ccf6bdd94175b725fd38678049319)
* Add Lit and FAST plugins to detect @customElement classes (348d2c9decf09bb61ab47477bc6cc57e4b089ec3)
* Add new testimonials (77fd7ed7dffaccfa8bc024105fe81dbe09b70671)
* Scope custom path aliases per workspace (resolve #1775) (d908099b52e4fd93b7947bafecbabeddfc7847f3)
* Restructure tests (ec4c77941d42aef54bed9e4dd1cae8e8784aa147)
* Simplify boolean check in parseArgs adapter (ba6865de03785eb49b2adf833f7f769eece78d49)
* Scope static custom-element define detection to the FAST plugin (94632cddd15f75eadd204cb480b3df6c1f2a842d)
* Add Custom Elements feature docs page (230bd734652f3a269b70da09cd26ac7e80a210cd)
* Update known-issues.md (f1f4c1bceef9a6575d7b31cc1340538ea894f824)
* Fix crash on backtick string literals in plugin config (resolve #1776) (f1adc7fbd68fc52a89a4d2a4d6b17d905d051de7)
* Format (e4720cab435be48e1a40afa8c548e21bdb74b14e)
* Fix backtick string literals in require() and plugin-name config arrays (#1776) (d14eb053331daaaeaec89c3c8e04cfeeba7580af)
* Credit custom elements via aliases, scoped registries, and static blocks (d7cbe12bd904f65b20016bdd2dfd4a5d7c5c1524)
* Improve Stencil plugin: credit @Component and recognize test files (152d73052f87f29b348abbab90e117cfb97dd69b)
* Add Catalyst plugin to credit bare @controller custom elements (8a37f8c25b03cd4e55bd18ba822906be35fcd97b)
* Document Stencil, Catalyst, static-block custom el reg. (105fba3a829f1cf4cf871035dbc9c170b0de7bc1)
* Auto-format md (f4fcf4e1c6a399d761151fc367125416e7741675)

## Release 6.15.0

* Report exported type used only in inferred-return function body (resolve #1765) (2413408753f7abc7a9dfdba520990afd18c53ee0)
* Work that EXPORTS.md again (7e13451fab7ad85362fb63a4715ea450690aedef)
* Update npmx ecosystem snapshot (dfc401145a880f156c66eb83ea1622a99540304a)
* Link `dependencies` key with notes (closes #1764) (e3e66cea9e946558940bf8705129efea3f23b3ba)
* Resolve tsconfig paths when loading plugin configs (#1762) (0177c7466559e2ae99b5e1cd1e3a8043ca494edc) - thanks @jakeleventhal!
* Avoid caching failed plugin config loads (#1768) (5e201cde9b1ba2568ead2ae790ab888c966828ae) - thanks @jakeleventhal!
* Resolve extensionless .sass imports in SCSS compiler (#1770) (30c22835383b2355787cc2a871b22de80ff75544) - thanks @sebacardello!
* fix(vite): detect inline module script entry points in index.html (#1772) (51f4eddc9e1b2fed1ba25e81fc596e9fb514ce01) - thanks @lucas-spin!
* Harden vite inline module script import detection (b8abcfd2f4f5486aea08a934514bc55de86be030)
* Use RecordableHistogram for timerified function stats (d575c6905704af1b0b4620edd874fc09bc86ed28)
* Add orval plugin (resolves #1751) (4c82aa82c2a02fbda27a316389f210d11621f8cb)
* Add treatTagHintsAsErrors and --no-tag-hints (resolves #1767) (4b6a573e0c1e0daf65c76c32f7336ea71db6bb64)
* Add nano-spawn plugin (resolves #1769) (b2cad06dfd9958485537c5545c6c497fc8823ac3)
* Simplify glob cache validation and ignore-list assembly (df1a9603a5ea8ed7bad9588bf13672cedf37c90e)
* Dedupe ignore-pattern collection and dependency fixing (d49b626ad6736d7123d44568ef8c42a3e1d28aa3)
* Simplify installed-binaries collection in manifest metadata (55143941eebbc8dac12c79b77c1f65a8b61dfbef)
* Flatten control flow in ConfigurationChief (010d5709b0f9a3adc5ebe6e7169b9f5c4f29abc5)
* Inline trivial installed-binaries and types-included accessors (b5afb9f29e3474eee4bf276c1de83cb0682a5663)
* Format (eb4b178d5d90a719cdc576d644766f8f95a47876)
* Replace @wdio/types dev dep with inline types (a3747d61ee0e594854e5da0ca6cb7597e0096b99)
* Bump dependencies (822ab3905cb7b5a216404231607a7820105930a2)
* Work AGENTS.md, etcetera (361bd4803934a01e01b08170565f8374e4e49eb2)
* Remove rootDirs workaround resolved by oxc-resolver 11.20.0 (e190a9fec22db41975cf9568a31970a05c86e66b)
* Add nuxt no-root-tsconfig fixture guarding alias resolution (e3e5bc94d5f7b6ffdbc89b18d7c8d5acbb5a9008)
* Allow extra args for release-it (f9c59952fa2c8c4c13bd42edc0935610900d1980)
* Add @vercel as platinum sponsor (c4c06a9149c986680f0d1aa74b57a46ff1f88601)
* Overhaul & improve --trace functionailty (60df0b05f364c8d841c0f784a06bab2a3215a32f)
* Re-gen plugins.md (0f9d044d312053154498a562e3a9422a4f44afe6)

## Release 6.14.2

* Fix vscode-knip build: pin native oxc bindings to bundled JS version (1b45a4103312c9c059560ae2e1eac25d86b4e2ac)
* Release vscode-knip@2.1.5 (328892eb04e65b4702e1ef2303db3156b8f2e1a3)
* Fix Astro plugin to support both possible middleware entry points (#1749) (33e0cc1a530a8cf5b6b05c8b3a3ca55f8fce8a75) - thanks @schmalz-dmi!
* Fix LICENSE link (#1760) (829620f9077ddea086a610c279c7c1250dd66e11) - thanks @vortispy!
* Fix GraphQL Codegen script config dependencies (#1756) (e841c6355e7eff240e74010bfd2be8bbb22ff2b6) - thanks @jakeleventhal!
* Set pnpm config via env vars, disable verify-deps in ecosystem tests (53c12248cc3e79fd79f3efde691d463fc795c40f)
* Update slonik ecosystem snapshot (f18410b34c8554364a9f003660bebae5e826de57)
* Fix Serverless TypeScript plugin dependencies (#1757) (ebde7f8f3e3004db7f51fb5d60a0bdc2452116ef) - thanks @jakeleventhal!
* Fix extended tsconfig type dependency attribution (#1758) (f600b09e562317a37844ed8cdf1b9b46e06c9405) - thanks @jakeleventhal!
* Fix Bun binary dependency tracking (#1759) (1b289239f35ff2912195b7e39a96c667c54c1fc5) - thanks @jakeleventhal!
* Detect Babel plugins/presets in Vite plugin options (resolve #1761) (2753d6910743a12a207fca81cb8325c00803963a)

## Release 6.14.1

* Detect dynamic imports in Svelte compiler (#1747) (e1c1b1705f96ed7d6ac537a7969cbd07d238246a) - thanks @jinhyuk9714!
* Detect dynamic import attributes; share import matcher with Astro-MDX (9dae64166bbc45be1abeb8d741127d109d48d351)
* Work the docs (close #1746) (919cba2f11d1979b854c7abaaca8992ee8b08e23)

## Release 6.14.0

* Resolve imports satisfied via transitive peerDeps (d654ec74d)
* Don't flag undeclared sibling workspace imports as unlisted (#1742) (e7122a1ae)
* Update github-actions reporter snapshots (2308b5a42)
* Cache syncGlob() results like defaultGlob() does (6c34287a5)
* Trim redundant statSync calls in FileEntryCache (eee3b899b)
* Cache parsed .gitignore patterns across --cache runs (7ffdc2ff3)
* Tighten cache module callsites (64e507265)
* Extract shared disk-cache helper used by glob and gitignore caches (0987421d9)
* Simplify CacheConsultant: replace trampoline with default arrow methods (bebe750d3)
* Pin pnpm minimumReleaseAge and trustPolicy (77efb32e5)
* Eliminate rescanFrontier polling in walkAndAnalyze (38d91b6e3)
* Reduce findWorkspaceByFilePath per-call overhead (91494378f)
* Memoize DependencyDeputy.getDependencies (a661a2142)
* Tighten module-graph map helpers (drop double-lookup + optional chains) (c11d62fb0)
* Add --duration flag for zero-overhead duration measurement (d4b59d89b)
* Cover analysis pipeline with --performance timerify (694dbf44d)
* Align --help text (6f12997b1)
* Add cli arg shorthands: -p, -s, -w, -D, -f, -F, -u (f21a58710)
* Format (8db5346e4)
* This one's okay (662ceaf46)

## Release 6.13.1

* Add jest.config.{cts,mts} (#1743) (44738d678c9992799f5fe4909a01cc5ddd702aa2) - thanks @joshkel!
* Update ecosystem tests (74420a614dfa15b81906266279c31ae0bf4e21bd)
* Fix `export * as` re-exported namespace case (5923af48fc33aa56c2f42f882aa185e66626453d)
* Add `.mts` and `.cts` config files to some plugins (69d1e83123e56c2c441f320c81bae099ba1eb014)
* Docusaurus: ignore `@generated/*`, handle local plugin paths (ce5f7672fced084bfb017410650b78d36133e1b0)
* Nx: expand `{projectRoot}` / `{workspaceRoot}` token variables (871531228b0cb67ff07fdb9d77316c4340ccaf33)

## Release 6.13.0

* Add mercurial (hg) to command constants (#1737) (abb08b0958e08a12684deacf0ab62dc7ada38074) - thanks @unrevised6419!
* Expand wildcards in Jest `projects` (#1710) (7cb2d37a5c46b54d8be9bee1fbb026b52bb71246) - thanks @joshkel!
* Add knex visitor to scan source files for config (resolve #1736) (4c96fd297f33316921186293cf9f9d323ca48eb8)
* Refactor to a better split of ast helpers (6e726a2c66727c2346b4c249a2efcd7d752231f5)
* Handle package.json exports for outDir="." (resolve #1738) (42497c249545cd9e4ae8b7e64995e62cb0e8885d)
* Fix star re-exported namespace case (resolve #1739) (e566c4b1a1bc697c0997e8a4ef6bdeb746524166)
* Strip comments in scripts in compilers (resolve #1740) (a123d5c35ba6b9239f6ac1d20cf50b8b0f9b2d28)
* Update rolldown snapshot (edfee2b3b6bfc3085d432fa5765b4e7a60ba5783)
* Source-map subpath imports + collect pairs from referenced tsconfigs (7c5acc4a33047156205ff61413a83625bb9e05b4)
* Tighten source-mapping utilities (0b68b81b4a732b3db64d69fd8c47802ff3302564)
* Update dependencies (8788c1a64a93d568a9391693278a388af6980dec)
* Remove obsolete internal jsdoc tag (0fed9756b485deb1831fbc78d8053bc939bd6971)
* Add @serhalp and @stevennevins to sponsors (thank you!) (999a5e3551e0bafbcfa7a1540ae7f3fc4218828b)
* Fix astro config after bump (f63537aa40f42aa7d3ff4bc64dab20dd01ecba83)

## Release 6.12.2

* Fix symbol reporter file paths with --directory (#1733) (d54074d4f5b9299aecb264897c7369fb81a499fc) - thanks @cyphercodes!
* fix(webpack): reference TS loaders for `.ts`/`.cts` config (close #1732) (f37c5daa5403fdf78e2746fea83ce79e1577eb48)
* fix(serverless-framework): skip functions without handler (close #1735) (616739de3ee9c5c216c0efe098d837bb286c102f)
* ci(integration): disable minimumReleaseAge for test installs (081dfc83039324292ceb1018f73ab2c98fd51ccd)
* ci(snapshots): query — add CreateQueriesOptions to unused types (5dd0b8a15e1c8298b8bad7388a17951a70285f56)

## Release 6.12.1

* fix: type-only imports in monorepos (#1715) (de33a2cb020f321f242bfb3884cdd597fb5f868c) - thanks @lishaduck!
* Bump jiti to ^2.7.0 (#1729) (0fe8dc33dc60b05a814828046aa5207051fc4b6d) - thanks @re-taro!
* Fix Vercel config detection (#1726) (370236d2e67058fb30c77a5f54d88b9774276eef) - thanks @jakeleventhal!
* Fix inferred declaration export references (#1728) (4dcd756f0903c1045a7600201243decbc7184715) - thanks @jakeleventhal!
* Remove stale root watch script (#1731) (2d555a18befc2576539491b5d66799e630689b38) - thanks @jeffrey-takuma!
* Update sponsorships script/numbers (c3dcc8f4fd923f87baad444c5f8e23fd7be15497)
* Add orgs using knip (78fd581857c0b01fc2ab987bc86d888954e97a71)
* Yolo (7e689bf60b39c6a4af46e8d68e9a6986df0e6f04)

## Release 6.12.0

* Use venz light/dark responsive svg img (2354194043354b67ed9463b6998d40a8e8cbab81)
* Fix types/path references (4afc873801bcca933dbc71c47b5557cbab646c6b)
* Move on to pnpm 11 (b1060652e85b8bf9a306135ca12ae22032099889)
* Fix up ecosystem tests (c226a72b8936397dab2fc6d30e27517c257c36ca)
* Add shell binaries to global ignore list (#1716) (ddcf7debd820b9deac9f29d1ed904f340c0ee91e) - thanks @jakeleventhal!
* Fix declaration export regression and document (resolve #1722) (3a2c22b52cda834b4d8a9956d9089b3dea9422bd)
* Update snapshot after 3a2c22b (8300078b75913d94ef19dbd1990e2073db8541d8)
* Detect babel.plugins/presets in @vitejs/plugin-react via function-form defineConfig (resolve #1723) (d56ee51c2162c29baf3564ded39639a1a258caa1)
* Lift defineConfig-arg unwrapper to ast-helpers, route findCallArg through it (7195b0a5f0986833a059c5d2cda9697d7d0abbf7)
* Fix PostCSS detection for @tailwindcss/postcss (#1719) (60f84824eebeece47ec5d2683fe4db9aaa6e7d00) - thanks @jakeleventhal!
* Allow `>` inside SFC `<script>` attribute values (resolve #1714) (9e5501f60150d0521bf7f2aa5a9af8db1285813b)
* Resolve Cypress reporter set per testing type (resolve #1724) (7cc4fc19ea12f4aefb55ef01a0ad5237b2dac8c4)
* Add Vercel config plugin (#1720) (10f97c10cd3203761c6ba2f4ee335c9719d81840) - thanks @jakeleventhal!
* Direct config hint title to stderr (53236b5f7dc12c2e7e561448c276a0168a6367fc)
* Some light housekeeping (727f842709f2adf9fe7658b6ed1b66b11043d821)
* Fix up ecosystem tests (0db3300e4109cb184520863e98eff6c2c956a717)
* Fix --no-exit-code condition for `isTreatConfigHintsAsErrors` (f27c3f4a556fdd18bfafb9b270fddc9b12c8033a)
* A friendlier message (aab1e83baaa088b8f8730f03f0d8e6520fa48d64)
* Mark plugin-name fallback binaries as optional in knownBinsOnly mode (c709a5aaa473184d1a73f7cbcb8eaf0d73e072d4)

## Release 6.11.0

* Ignore & remove uninteresting lines in snapshots (767ebaf9b20d02f271d2a083404b60cba63119d7)
* Flag stale `@internal` tags in production mode (resolve #1658) (dd1caeda80784d6070b028c781a3502b33e9765a)
* Add compiler-extensions in tsc-files mode (resolve #1708) (ea867ad4bb9195f556ff58dae010d0d77c57bb25)

## Release 6.10.0

* Ecosystem patches → snapshots (1803f9f94d42ebe88730465c002098de54c6650a)
* Fix unlisted pkg when only @types/pkg listed (resolve #1707) (62082b69b382ea56d86e718da623ccadb9281a14)
* Don't report imports matching engines.X as unlisted (23582e0f4da7a98cfe50c065b63d38a75870911e)
* Treat imports in .d.ts files as type-only (84caac58d99f39fde56c664f42bad2c000d8943e)
* Treat tsconfig compilerOptions.types as type-only (ce18854b0a008f1060e30c660eee820eba1568e5)
* Resolve hoisted deps from monorepo root in single-package mode (resolve #1711) (23b756fb0becacaa19fbd71a0d9a0264f8647e88)

## Release 6.9.0

* Expose types for JSON reporter (961b734f398b451bc26708f8d3bfa72a71983dcc)

## Release 6.8.0

* feat: add WXT plugin (#1703) (9167557755a0aef81947aaedfa4745805ffaa571) - thanks @sebastianbreguel!
* Add support for pnpm@11 new commands (#1706) (c937697a68caaf1ac224627537993b32d37cc91b) - thanks @PatrykWalach!
* Fix case of spread export → other exports used (resolve #1705) (0f94d2d2b024d268df2395677a0ca0f6fd95503d)
* Add more pnpm commands + tests (f2819b3474b6d6ff7c24197be54072d2291d15b6)
* Bump oxc-parser (5c21d278814436c4c084d0ee609360eddaedd676)

## Release 6.7.0

* Fix markdown reporter column width (resolve #1700) (4713108de98bcfe76eb606036b9f968abe3e89a0)
* Handle Vitest agent and minimal reporters (#1701) (a71ead11b99aaa67f31eed7b35628907b2dddd06) - thanks @dskwrite!
* Add e2e tests w/ tsgo defs + lib consumption (98113e61d913e47631748b58c25d1042c8dd387e)
* Fix pkg name inconsistencies (544c3e68d72dd754b20f8e0b0bf8ed107c05d677)
* Add `export {}` to maintain module shape (27d8a0230c10f2827ba1e1a8b2c65020554f61f8)
* Strip leading UTF-8 BOM before parsing package.json (47e4029c39ff95043cd495681e4c7558970b0ed9)
* Skip workspace with invalid JSON manifest (bfb48670966387a3cd26005b9fb9d8769b2a1213)
* Preserve out-of-bound writes to stdout/err (95faad8d6219ba456a3700df697273eb154c1dd9)
* Consistent prefix in logError/logWarning (2c6d8a049d1c20d9427425b4abae3b76ac7a5720)
* Don't exit on config file load error (0914bd3832b1851e4d34137577c0d08efaf8aef6)
* Fix tsgo resolution in e2e tests (a68950131e33214ef2a4f13d11fab1a78c16bad6)

## Release 6.6.3

* Use venz chart svg directly from CDN (ba7e9073d1770e4a21ec18435bcb61f394db0d1c)
* Bump that plugin counter (abae75bbd3030e006fe67d3f63641a31a65e671c)
* Fix plugin title (f2b8fcfc94bb78fb70dfe2be3f48ef8f254066f7)
* Work Table util class: fix bugs, tighten API, water-fill widths (2eb4045e0f34c2638875504b9b64e881e9a74db5)
* Questionable.. (970a0dbdfc7b59df2fd0a3064a4bd6be4e5a59bc)
* Fmt (14538ec1fe94cdf3c45798515160609f3ffbec9d)
* Ensure output is flushed on exit (#1699) (9533365115d4704e9b057b7ba8d5f43fd553d1a1) - thanks @joshkel!
* Use currentColor to support light/dark themes (7ea055aa68b86ccc6cb302a3092c2da9e56cdde6)
* Tighten type-chain alignment + gate via ignoreExportsUsedInFile (resolve #1698) (0910b33fc6c07867a751af2e26989a61c8a6c548)
* Eating our own dog food ↻ (d5aa1f6b007a2dfef1a8326000dc1802510d64ab)

## Release 6.6.2

* Don't track typeof value refs at top of exported type alias (resolve #1697) (1a9904832878f5e8e4b633bdb08fb327baa17ed6)
* Treat Props as used when Astro.props is referenced (resolve #1629) (46cb33871b236249cf9b09679988d530a61a545f)
* Update dependencies (dcf53157452b996f970d91d3149c4b7bb4f45edd)

## Release 6.6.1

* Fix website papercuts (#1696) (c6d9c436d4c0b85f8aae34bab1197e3c2b5eb139) - thanks @skoeva!
* fix(rslib): resolve entry points from rslib config (#1695) (af83d68d9856b3666af5111338f25dc2b4897cc7) - thanks @rpereira-anchor!
* Update react-email plugin for react-email@6 (#1694) (200db55064811eba4a168598615417d36d77e3aa) - thanks @krystofspiller!
* Introduce Manifest wrapper with scriptNames + getMajor helpers (6fded2f00f4e9cf8328231f9e30280d62c85e95d)

## Release 6.6.0

* picocolors → styleText (e7abd6bb1a42c8997ae79555e55b7d9d19f56a48)
* @nodelib/fs.walk → fdir (6f781b84f9776d211c6fd1b0d9b280457701051a)
* Improve performance, but only slightly (c2c0323efd1a327936c4cdd65d335c913eb0e0ef)
* Fix package-entry hint for bare specifier in main (resolve #1693) (2e8cf477dada77b93c54a3717d4c21f3107f5f23)
* Extract vite.resolve.alias from Astro config AST (resolve #1692) (fab587198659cfc095e97699cf3a751034aa2160)
* Add plugin-contributed source-map rules (e11c2b1c02c7bf390f791e675fcdc3c7ec57a007)
* Add `@sveltejs/package` plugin (resolve #1690) (8b2d402c9fff1a18e13512bfc08b5c3f9af891df)
* Windows ❤️ (91964e428b44750ed0d03e3acf1560ba3ec1c202)

## Release 6.5.0

* Drop project-extension-redundant config hint (resolve #1683) (f86092949d6dbd041fd621876da674fd3eac7534)
* Add instructions to .agents/PLUGINS.md (e2943ed8fb6d2c0ab4cf12ff04d10bd5ab9fd5f7)
* Add a plugin for react-email (#1684) (d8ae4d3ccb810b9a9211fd43e9d1e7d7b704fcaf) - thanks @xaqrox!
* Replace `fast-glob` with `tinyglobby` (#1462) (9f6b4c8aa6857fea40e66d008c905c948af10939) - thanks @gameroman!
* Added plugin for Serverless framework (#1478) (f885f1ded52427d984c67e7172e3141eb4e5ee29) - thanks @BenCrinion-IW!
* Add args to Prettier plugin to resolve --config CLI flag (#1685) (f4658c84e714afd8a2233b72be6169da1ac3723e) - thanks @xaqrox!
* fix(util): tolerate JSONC and array extends in findRootDirsBase (#1681) (f7e5464a6f70e9024a341fdb923766b5ff53a831) - thanks @Hoffs!
* Format (15bd7e7a56b470096cfee1690263d5d13ddb8fb6)
* Inherit outDir/rootDir from tsconfig project references (resolve #1680) (b89b4f716f4c117b0106e9a212e9e5c46aa85035)
* tsc → tsgo (a6e09ca1b65936b3790a6c3628a4646f030d18b8)
* Update dependencies (4cb05c96a2ae7c790d29ee76ff13288c5bbb97a2)
* Housekeep (28c56cb8bf68031b1c8e9bee75b18ee7274ec981)
* Test test test (7eb4ab3a8a6635dcaf756bb2b4a88e1298615994)
* Add pino plugin with `transportCall` visitor (resolve #1480) (53a033e4ddc5036c6a4a0e55c0abc42c5c64e4f5)
* Add signal to projects using knip (dbedd665c1f8d735030600d3f68ef1825d9a2668)
* Tune logos (3148f4d0485875370634b9b53c1b3aa7f6eafcc3)
* Tweak `knip-run` tool response (42940381a947c46996ae4055e8789f6ea39cfca4)
* Add `workspace` option to `knip-run` tool (64c4aaea89e3abb41d8695ebffc5538878520b21)
* Remove old lingering `experimentalTags` (e503d108e5535800ac6467f4d92c7dd6a9e90037)
* Fix compiler type (resolve #1689) (e7a69adb5e584eb6e5af9b4007820afcbcf27a08)

## Release 6.4.1

* license (2d3d8d86ea51f18224c3558a38c28df00113f683)
* Handle file path arguments in Bun plugin (resolve #1678) (cdbe298efcb226ae4baec6567a0cbb6fdf001ee8)

## Release 6.4.0

* chore: change license file to have more conventional casing (#1664) (ed97e6a37) - thanks @Zamiell!
* fix: whitelist spelling error (#1666) (bcad12012) - thanks @Zamiell!
* Add Panda CSS plugin (#1671) (7ab0d4d88) - thanks @Faithfinder!
* fix(rspack): detect plugins from swc-loader (#1675) (1431ff3d5) - thanks @TkDodo!
* docs: fix broken anchor link in DEVELOPMENT.md (#1677) (e78c7f609) - thanks @vincent067!
* Fix `@jest-environment` pragma resolution and limit pragma scope (3832364e2)
* Track Object enumeration to skip enum-member checks in nsTypes mode (a47aff535)
* Cache module resolution by directory + specifier (cefed38c2)
* Skip read+parse in walkAndAnalyze when the file cache will hit (25a7982c1)
* Collapse double statSync in FileEntryCache.reconcile (b63fbd9f2)
* Refactor walkAndAnalyze: dedupe cached/uncached paths (573df54ba)
* Cache glob results across `--cache` runs (6ab8de805)
* Mark namespace members used when enumerated via Object.* (dabf8ce77)
* Add config hints for redundant/unregistered extensions (close #1672, close #1673) (050689575)
* Enable Tailwind CSS compiler for @tailwindcss integrations (close #1674) (f3ed14d0e)
* Resolve scss path aliases (resolve #1676) (00ae83be9)
* Re-gen plugins.md (35d8fabaa)
* Resolve path.join(__dirname, ...) in Worker/child_process calls (#1660) (40a917e3f)
* license (608f0ed76)

## Release 6.3.1

* Fix peer dependency resolution (#1645) (0a6e93d16f89bde270a5458c0e76e1c6a996012f) - thanks @controversial!
* Support absolute file paths in react-router routes (#1659) (97bb283e31eb72da8c60fcede607b22da2929103) - thanks @mpalmer685!
* Track namespace imports used as object property values (resolve #1669) (c4d6b28df5955abbe9dde40d245ceb5a6e0bc669)
* Split plugins/util smoke globs to fit Windows cmd.exe limit (33ef87d15770d0ee9dc248a640538ce2f0d75a46)

## Release 6.3.0

* Re-gen sponsorships chart (83ee4895f36d934bf9f2efaaaf3e141c33c889f8)
* Add testimonial (be16c54d379698899e3f10646bb23b280024b989)
* Add deferred resolve entries as direct entry paths to avoid ws exclusion (91a183539fb63528f900b187328c3bba1b161e88)
* Add rolldown plugin (resolve #1661) (44bfd6273375384dc0b01b2cf673b6ad1b6783f0)
* Housekeep plugins a bit (dc6986821bde185185b730e119d2c528048f9976)
* Improve `module.register` handling (b9e36ea42d0b2b35d6080aafc94b292a3d7fd711)
* Housekeep release script (f81bd0f5f6630c2cac9934c3b96ace0d42bd2353)

## Release 6.2.0

* Support tilde-prefixed scoped package names (e.g. @~private/pkg) (#1656) (947893d9dd9135fb8878e30de65841d4dff17f0c) - thanks @MatissJanis!
* fix(storybook): mark vitest coverage deps as optional when addon-vitest is used (#1654) (06e88d42d7c1f89e18cba3d09c12ef080cb231a4) - thanks @brick-pixel!
* Deduplicate module graph queue to avoid redundant file processing (#1657) (e34d3b0dd4cc97d16a9c70c7bd436372a3e3081d) - thanks @MatissJanis!
* Export KnipConfiguration type for dynamic config use cases (resolve #1634) (4a64e0e833511859b7703ac36e08a178e663192d)
* Release knip@6.2.0 (d8c016164fda981209186c205f86329b522e76ee)

## Release 6.1.1

* Handle absolute Vitest test roots (#1650) (898a412d369edd6ee967485c2df95d0c6ae87a18) - thanks @filipw01!
* Fix `reference types` regex to allow extra attributes (resolve #1649) (1d5f9438e2e4e0d01558f41608a450093afa60e5)
* Update docs (close #1614, close #1615) (f1ac52964ff7aa9c3454e085a2c582e00ff69e4b)
* Release knip@6.1.1 (fcfdabe8bd956b4ed71126a75b72e3e304e6518b)

## Release 6.1.0

* Add `knip.nodeRuntimePath` setting (resolve #1643) (65e943ccde55ea54c1cd749e577b4bcb4f97e1b4)
* Swap Astro sharp detection to match default behavior (#1559) (84968bb713a0d8c478b8b329323a43da6bf0833e)
* feat: stencil plugin (#1644) (d5d20e5e21d64590c0e735c6bc840295cda665cd) - thanks @johnjenkins!
* Enable metro plugin when expo is installed (#1600) (14bc9d7744962d740e2bef1ead3e3f444b2cca5c) - thanks @DaniFoldi!
* Resolve jsPlugins dependencies in oxlint plugin (#1576) (e11c962ea55d7afa89ae812686565383b852a50a) - thanks @nikolailehbrink!
* Wrap up oxlint `jsPlugins` support (209a9f78784153d14c2ef0ae2c987926d35de4b7)
* Update dependencies (close #1646) (869020fc2ed765a52cc242810e0f20a137047b26)
* Fix config hint `filePath` edge case (e79c302f9cfd33957485327688e5fcbc25848eec)
* Rename oxlint config file in fixtures (563020402f35281f2c57672aff12a09aebb363fe)

## Release 6.0.6

* Suppress issues initially to not overwhelm agent in mcp server (7793962c5)
* Auto-format (346247a70)
* Fix false positive unused deps when run from workspace dir (resolve #1642) (95f443195)
* Move from `convertPathsToAlias` → `compilePathMappings` (resolve #1641) (ccc62d684)

## Release 6.0.5

* Fix up ecosystem pipeline, add sanity (a338b211d4d8b4634dce4de51b9c7ef8d3cd1f05)
* Fix broken links in Writing a Plugin docs (#1640) (963f20627a6d5d683a6e46df0162795c054dbef9) - thanks @skoeva!
* Minor alignment edits to MCP texts.js (714089f09309be00ebef0a91ca903669856acd0d)
* Merge JSDoc tags across function overload signatures (resolve #1639) (6269ec34ef6fe75be1d69c4f67e8fc43fabf83db)
* Housekeep tag matching (b15bc7e245e972b29496035090a1a35782a4d1ed)
* Housekeep `reference` type matching (d9c8731c7e57142a738bc37db0db75616944f832)
* fix(nx): fall back to workspace cwd when run-commands target has no cwd (#1638) (cf2dc7db8dc7105cfc3aef2a0d17255cb288d5b2) - thanks @liorp!

## Release 6.0.4

* Defer ns member ref resolution to post-walk batch pass (resolve #1633) (304504fec11ad5bb94e1a0ea0678eaee876d56ab)
* Show namespace member statuses in trace output (47ddf43dc41d578bd09dedabf828cc22fa89fca4)
* Add shadow detection for function params, arrow params, and catch bindings (70ebb76a2789e14cb12bd278d5a63db69719b82d)
* Strip trailing slashes from tsconfig outDir and rootDir (resolve #1635) (1dcdb02b551bf09b23d2a3b8c0fcad8f0563fcff)

## Release 6.0.3

* Handle symlinks → real paths from tsconfig files (#1630) (529810a97ff17aa868dfa5e83ddc412e880ac020)
* Filter empty strings from Qwik `routesDir` values (resolve #1632) (beb8ae3a99c305e77749dc9700adddab4b5c5638)

## Release 6.0.2

* Add scope-aware shadow detection to fix false negatives from name-based matching (9ec38b339568bcdc096a13c394102521d97c2e9d)
* Fix false negatives from overly broad collectRefsInType (261bd062d33d77c09f4e56292be7f8d9afc77143)
* Add doc re. exports (f82d3ad671b6a2659636f6b7f6b4e9489aefc969)
* Bump get-tsconfig to 4.13.7, remove patch (resolve #1630) (09bbce539229c5666a313ebf1a120dd885cae6e8)
* Pass on `rootDirs` to work around oxc-resolver feature gap (resolve #1628) (4dc16cc913b1f90769df1f2176888ce77573e593)
* Update patches (836c2cfe6e675280a572bd2a5750cb9ed698e6c5)

## Release 6.0.1

* Update sponsors (0659240f0e6f16d69188d2c6eb99d912f00daa00)
* Handle computed access in local refs visitor (b998babb8952040478105d8d824710d5091eb38b)

## Release 6.0.0

Blog post: [Announcing Knip v6](https://knip.dev/blog/knip-v6)

See the pre-releases for details:

- https://github.com/webpro-nl/knip/releases/tag/knip%406.0.0-0
- https://github.com/webpro-nl/knip/releases/tag/knip%406.0.0-1
- https://github.com/webpro-nl/knip/releases/tag/knip%406.0.0-2
- https://github.com/webpro-nl/knip/releases/tag/knip%406.0.0-3

Breaking changes:

- Dropped support for Node.js v18 → Knip v6 requires Node.js v20.19.0 or newer
- Dropped issue type `classMembers`
- Dropped `--include-libs` → this is now the default and only behavior
- Dropped `--isolate-workspaces` → this is now the default and only behavior
- Dropped `--experimental-tags` → use `--tags`
- In reporter functions, `issues.files` is consistent with other issue shapes. Removed `issues._files`.
- In the JSON reporter, issues are consistently arrays for any issue type. Removed root `files`.

## Release 6.0.0-3

* Improve Nuxt plugin (`staticExports` → `ExportNamedDeclaration`) (6554251a8)
* Improve `isReferencedInUsedExport` items (d4d996758)

## Release 5.88.1

* Bump GitHub actions to their latest versions (#1624) (bf2ffca61184504734145b01db29da095c62064b) - thanks @deining!
* Prettier config for other formatters (e.g. unified-prettier) (e034cbdeb48733b0cbb38e33c6d816d7bc82a99c)
* Fix module/namespace regression (resolve #1603) (394bcbaaea3e01adff3583044d2b72378e1134af)
* Fix counter type and `--fix` exit code (37b6f60133c406d07fcbae69cdc3a17808060e1f)
* Restore all ecosystem tests (4d2cd9b423a0ce365e71fb35707f2753bb8fbd04)
* Release knip@5.88.1 (8c25e4b7ff5c43d348082030600b1ba8677486af)

## Release 6.0.0-2

* Bump GitHub actions to their latest versions (#1624) (bf2ffca61)
* Use resolveFromAST to skip jiti loading for JS/TS configs (91cb6f662)
* Use resolveFromAST for flat configs, skip jiti loading (5e5f63c45)
* Housekeeps (5e5e0a832)
* Use resolveFromAST for JS/TS configs, skip jiti loading (426f52766)
* Prettier config for other formatters (e.g. unified-prettier) (e034cbdeb)
* Fix module/namespace regression (resolve #1603) (394bcbaae)
* Fix counter type and `--fix` exit code (37b6f6013)
* Restore all ecosystem tests (4d2cd9b42)
* Release knip@5.88.1 (8c25e4b7f)
* Add `useLocalVersion` to vscode extension (resolve #1572) (e180e65be)
* Merge main into v6 (c1d4b2f05)
* Fix v6 extension: oxc-parser bundling + system Node runtime (1d79aea86)
* Cache findWorkspaceByFilePath lookups (c9fe8c5ce)
* Flatten visitor handler dispatch in buildVisitor (fbf9e7550)
* Dedupe plugin visitor registration across workspaces (5b9df9f9f)
* Consistent object shapes in JSON reporter (b10d87efd)
* Add coverage for `module {}` syntax (f4706c96e)

## Release 5.88.0

* Add Sanity plugin (#1608) (f777834a6db8530f7588e24a916f47b5d5b75673) - thanks @jonahsnider!
* feat: detect duplicated package.json dependencies (#1611) (dec15a7e5a37ae97732f83ca091f6373b3a62eda) - thanks @Zamiell!
* fix: docusaurus faster (#1616) (c7a0128ca67b66e58b045d44468e61bed5492bfa) - thanks @Zamiell!
* feat: raycast plugin (#1619) (52c77eedb75a565fa8ad2869af45131d51692504) - thanks @TkDodo!
* fix: docusaurus scripts and stylesheets (#1618) (9fa485f121d9853db4758442c738aa962e17174f) - thanks @Zamiell!
* Improve getPackageNameFromModuleSpecifier performance (817180ebd38d4ba51db4ec53e482a4c726edc0d1)
* Mark Nuxt `extends` entries as dependencies (96f178f96490045ad5ae766193d7bbc726a5896f)
* Simplify devDependency duplicate detection logic (99a7c9bffdfcb6ed3b58db762e00a47d1349c81d)
* Add patch for argos (cecab2183959c60a46860a32f9c6654a9f8aa6b0)
* Fix conflict and iterate on docusaurus plugin (d3d8cae3b3707f36ce6d5b6b1836735c020dc86c)
* Iterate on raycast plugin (4948bf81102c8347930ebb344365d07ea350b404)
* Oxfmt now supports .ts config files (#1621) (27a4813a9362a6da0ab344feb9f61baa4fdc4472) - thanks @DaniFoldi!
* Fix typos (#1622) (386b4775579f678cc8f7793da9c652d8bd98f6fc) - thanks @deining!
* docs: bump astro to newly released version 6 (#1623) (f941db9f03c64e60941b0217375dc0657344c563) - thanks @deining!
* pnpm dedupe (d1a90891a15613fa322b52ce6a199ee668833fef)
* Release knip@5.88.0 (7aeb857f540af593051d003acdf4d52eef3b0d70)

## Release 6.0.0-1

* Remove --include-libs flag, always include external type definitions (86f4eb81f)
* Remove --isolate-workspaces from docs (fc5211a92)
* Add TS namespaces support + `namespaceMembers` issue type (resolve #1603) (750236c1f)
* Deduplicate module resolution in staticImports/staticExports loops (8d06e903a)
* Restore memory marks post --isolate-workspaces removal (c93665756)
* Housekeeps (092d72163)
* Update docs (4c4fe6ba0)
* Merge main into v6 (c4e449bad)
* Remove unused export (a92a958eb)
* Auto-format (0a344cc3c)
* Fix type-in-type refs in nested generic types (96e7f7b83)
* Update typescript patch (9a039601b)
* Fix `collectIdentifiers` in nuxt plugin (.vue → .vue.ts) (157450ff4)
* Housekeeps, reuse `parseFile` (77ae0c7ff)
* Update oxc-parser (0c8b10649)

## Release 5.87.0

* Add pkg as built-in pnpm command (#1597) (32ee5591e) - thanks @azat-io!
* Add oxlint.config.ts to oxlint plugin (#1598) (2951050e5) - thanks @DaniFoldi!
* Add oxfmt plugin (#1599) (6bd980742) - thanks @DaniFoldi!
* Head banger (7930467e3)
* Add sanity to the list (4ee3d0ddd)
* Fix minor lint issue (9e0dcd974)
* Flatten `test()` (d010c5597)
* Make toPosix a no-op on non-Windows platforms (b37112361)
* Replace isBuiltin with startsWith('node:') in sanitizeSpecifier (e7b100aef)
* Skip picomatch recompilation when gitignore adds no new patterns (c7870dba6)
* Incrementally compile picomatch matchers during gitignore walk (9948284fb)
* Identify binaries called by `find -exec` (#1601) (f7367fd48) - thanks @t3chguy!
* Identify that `@babel/runtime` is needed when `@babel/plugin-transform-runtime` is used (#1602) (ef4da0691) - thanks @t3chguy!
* Rename package-manager → resolvers, move `find` (0bd97f01f)
* Streamline babel plugin impl (3cc192e08)
* Detect local $schema references in changesets plugin (resolve #1335) (3a180820f)
* Resolve Nx run-commands from `cwd` (resolve #1595) (e71c9acc9)
* Fix up issue types table (resolve #1376) (20a3762d5)
* Skip optional peerDep issues for installed deps (resolve #1545) (f554d2f30)
* Add dim highlight opts for enum/class members, duplicates (resolve #1567) (35ce4229f)
* Cache isGitIgnored results (75942dd0a)
* Don't report unused files outside project set (resolve #1606) (fef625da8)
* Fix openapi-ts dependency resolution (#1607) (663825ef4) - thanks @jonahsnider!
* Improve --performance and --memory output, clean up timerify calls (df0ace489)

## Release 6.0.0-0

* Replace TS backend with oxc-parser (7fa943bfc)
* Drop Node.js v18 (b24e96901)
* pnpm dedupe (7eb2a9fea)
* Only handle `module.register` with `node:module` import (872e3ef8b)
* Don't use injected aliases by default, add fallback resolver with (04fe17d2a)
* Remove `_files` issue type → consistent objects (d48955be3)
* Flatten the flattening (dc4cdd50f)
* Update docs (dd5c94936)
* Probe extensions with existsSync instead of globbing in toSourceFilePath (53d7cc4da)
* Use existsSync for non-glob package.json entry validation (230cddb0d)
* Fix tests for issues.files format change (Set → object) (d41537032)
* Single ProjectPrincipal: eliminate per-workspace principals (623df835c)
* Remove JS-side resolution cache, rely on oxc-resolver Rust cache (00800a3b5)
* Streamline module resolver: remove dead fields, split resolve paths (cfacf5156)
* Fix lint errors and format (5b9e7e4fd)
* 6 (39a13b7f5)

## Release 5.86.0

* Rewrite import specifiers to use .ts extensions, remove tsx (#1548) (58674ade551d04ca38eea5b8273e8843eed7659d) - thanks @wojtekmaj!
*  Add .spec-d to vitest entry files (#1556) (3123ab76745990b2483f9c8f26c9c9ad4500d4aa) - thanks @yamachi4416!
* Update docs for tsx → node (0418eba6dc6a0d5e1e56cce1c037b0ae6846bc64)
* Auto-format (7142fd701f97f8a4115c4094d1007f2551c33537)
* Add Qwik plugin (#1557) (fc668f4b59e40caddf8e9904fb50dc59de1a86f8) - thanks @azat-io!
* Fix Bun plugin to handle directory arguments in `bun test` (c112b6c68b13976e4b601c5169a09e748e67fd4f)
* Update FAQ (b105a42610346f7b9a07071ab8f5d2d7c60b004f)
* fix(plugin): swc with `externalHelpers` setting ignores `@swc/helpers` dependency (#1560) (4bcb1f5429d003e6e2b28e2bd65a64c849fe0786) - thanks @bobaaaaa!
* chore: git ignore artifacts (#1563) (4878724a6599bc80a9ef9c62d86d2805d7d8a914) - thanks @unional!
* Fix Vite plugin to respect root option for index.html entries (#1561) (67a56470f61cadfe1e771adc87385a98e398da2e) - thanks @azat-io!
* Fix Astro sharpImageService() false positive for unused sharp (#1559) (c36247cc034a14a846e94faafbdd2097f9a5d7d2) - thanks @azat-io!
* Fix up gitignore test (b2c3d086be6c76791d2b60b10944df3b7b52d9fc)
* fix: normalize Windows backslash paths in fs.watch listener to fix --watch on Windows (#1558) (b86b421ec9f6bf1c930600c5109511712af3d224) - thanks @Aiudadadadf!
* Fix wrangler plugin not enabled by jsonc config (#1564) (00bb1be35386300e6ea302c14a9b15e3f6e03b35) - thanks @DaniFoldi!
* Edit AGENTS.md (a2aaf2f9983e24b881191403bd716bd1ee791c70)
* Fix tsconfig presets marked as unlisted in strict mode (resolve #1568) (463d67dad5f105cc2a76ce847192a9a7d1fb8498)
* oxcellent (8a602c7863b63b1a940584e2a0436b70d8650be8)
* Refactor format test and use prettier for consistent results (b6afc01828f884f579747e6d8e425aa1b07a068f)
* Sort package.json (d3a521b62d4ba5de05d3497b456cf9d225a743c8)
* Add .git to GLOBAL_IGNORE_PATTERNS (resolve #1571) (4e95ffb45748fa1ae84548c1992d2947826d2667)
* Detect Yarn plugins that are listed by their path alone (#1574) (de4c7d898f83a52ea80a374d9395bcb109f39c23) - thanks @robintown!
* Start using unbash (a5de2c4e49bda454f0e42b4e5bfae54024d27772)
* Bump unbash & simplify bash parser further (57896d32c86412ad5941c67fbb2fc29882a5bafa)
* Fix refs in workspaces fixture (#1578) (fbee3426ccc05eaf2fcaa069826cd3594f946db9)
* Include a few more entry patterns with `pageExtensions` (resolve #1581) (c6a6d9e72b7674392cb58675befcc4c6bbb64e11)
* Clean exit if --fix fixes all issues (resolve #1577) (c182c29e35748ff044048c578b6bf7dd99dae9a8)
* Document JSDoc tag hints (0e7b6ae8d66650da9e4aad81aa2bb7cfbd985e57)
* Update AGENTS.md (f845462736f9fb6349c7e4bfd0f72d76df473f8c)
* Add openapi-ts plugin (#1579) (42d1b3f5f912b37ed73ab46dc0fe07a93135413b) - thanks @jonahsnider!
* Migrate from `js-yaml` → `yaml` (fb042ae235e57b340d167bb7bb7d7ddb0fa5b1fb)
* pnpm dedupe (2586254448e28bd54025f5726d23bf4f95c2e886)
* Fix plugin list order (#1587) (519ae3aca72333978c674aab0e7376c7007deaaf) - thanks @ikeyan!
* Fix confusing test fixtures for openapi-ts plugin (#1591) (f0083cac6c51337b1b53ee499dadcd5fa5e209ba) - thanks @jonahsnider!
* Off-by-1 (7d7dec6fec59ab8cddca09688d4ad05cdece1aea)
* Don't fix compiled files (pos off) (a9fdc77fa6321e469b718131df556c37289a7dbd)
* Add aliases from any tsconfig file in typescript plugin (resolve #1347) (ced77c707d064c5067b6dc331e76d878dc4add87)
* Support auto-imports in Nuxt plugin (#1517) (4ce27b2f793882bc3fc8f72813b4c0c6152e5168)
* Fix + lint .ts extension in import specifiers (d349de315a37f5ae208522abe830f1c41732779a)
* Safe `ts.isInTopLevelContext` → `isInTopLevelScope` (1819c2050440f82eb30e7be9d271298e6b4c8f14)
* Wrap `session.handleFileChanges` in try/catch (185afb8cc6b914df31ca0c22315190e44c2834da)
* Improve MDX compiler (9205e2a9480182605975687ebc4282f9805da58b)
* fix(playwright): Add missing built-in `null` reporter (#1596) (0f1ce7d1bba7a80ce0697378efd2be0968383a86) - thanks @shrink!
* Add package.json#imports as entry points (1fbe286046bd51653fff4139b4b8a0ef1ea04193)
* Update some dependencies + dedupe (381241e2e1e1875da7e34baee6b5d00f0aef0295)
* Add support for `extends` in nuxt plugin (9fcbdf5244f81820b9a2f53d5b320e6c54fba792)
* Update release script (f446b4f08ca48f7b135eb9da34a6388249598f1e)

## Release 5.85.0

* Fix require.context regex matching for path-aware patterns (#1547) (c33d93ae24dc1304baa49f85b25beb24af803dd8) - thanks @jstaab!
* Make knip compatible with erasableSyntaxOnly (#1541) (f63089bdadb2cea47d22fa27b22c16003e1a4b61) - thanks @wojtekmaj!
* feat: add Payload CMS plugin (#1546) (58d99de46ee3a9e15cd77e3806b5de55931cebf2) - thanks @Robot-Inventor!
* Look everywhere for manifest/robots file in next plugin (9da6205fdc45fdc992919d3e246415829025ea46)
* Merge some next glob patterns (8c5f35fa81ccccc4faceb6a1d8329d562927d450)
* Add SAP & Google Gemini to projects using Knip (c8ab8957ad1f15ee9ff67f13f5029f213e464ada)
* Bump remark-preset-webpro & dedupe (b9372cd7a0dc1a1ab54b7baa7b8a939a399ccc14)
* Document CLI usage for LS (97fe1cfe8a18af145eff9ca1f040e4c756acd270)
* fix: tsdown entry compatibility issues #1550 (#1554) (95051ebf3aa44a2db722837acf3ce73e03f72fc5) - thanks @huijiewei!
* Fix incorrect coverage provider being reported (#1552) (2d0b5cda41f994116c6e211fc68c95b44c21b2cb) - thanks @rexxars!
* Temp disable npmx in ecosystem run (a5cd9862943dcca1b217bcec2895553ba23dbe34)
* Fix OOM in gitignore walk for large monorepos (f192a6ba3fbe9fc303f48e3901db918f5bcd5164)

## Release 5.84.1

* Fix false positives for arrow-wrapped dynamic imports assigned to variables (#1544) (75a42c3aa4b8f9db59fb450ef4f45540ab94ec26) - thanks @jantimon!
* Improve pnpm arg handling (df8c353c7f30ee11d749b2cf3208f288def1ed84)
* Ignore `module.register` if 2nd arg is not `import.meta.url` (#1535) (970fdb1f747c0941759aa3e0394c30ff6cf63481)

## Release 5.84.0

* Post-release shenanigans (e7965cba23b0c63f0165a12c96aed75257aa6919)
* Move most compilers to plugins & register from there (61beafe3e002408e91169397f7c384e14c613d92)
* Minor refactor (e20a6828be8dd1e49b819d5b5b896a26db2a91ac)
* Fix lint issues (d2bbc139e63235c415a243e76ad8685693b8edf2)
* Add missing catalog property to rules in JSON schema (#1518) (5d49dea2696db454e630014efd25172d6edde9fa) - thanks @Mohmdev!
* feat(plugins): add @typescript/native-preview (tsgo) support (#1513) (babfb10a0426059bc2d79d14a2ba9c33767b6571) - thanks @jgoux!
* Fix up quoting for spaced args (resolve #1515) (2b735cb8d87a827bf9ea53ea2bcfcedf117e6d4d)
* Switch to tsconfig-aware module resolver in input handler (634d0f68f681df1bf1e8896846f4d4c29b03e689)
* Use `bun test` positionals as entry points (resolve #1521) (da9472555b28b04eddba703b1dfee69b2cb8b6f9)
* Edit docs (327726ff2c5f2b135581088dea62bd3ed4bc99d4)
* Minor refactor while at it (dc87e8ea7157745a449955e9a275877d19cf4d87)
* Add config hints for unused `ignore` and `ignoreFiles` items (a4989eef8c870aa038d9c9d9e09597590ca444e7)
* Accept known bins only behind double-dash (resolve #1524) (b9214e35659f1f87eabc6695d9b9643c0e6c8022)
* feat(plugins): add support for bun test preloaded files (#1525) (14ee32a8f818e1cbf48398ba57bf0f19812ed8be) - thanks @jgoux!
* Add `date` to `IGNORED_GLOBAL_BINARIES` (#1476) (f08f92bd9eac95ec4eafd01ddb01279cb047544e) - thanks @duci9y!
* Fix edge case for binaries in scripts (82331ee2d336349d24a23437527991b73c764039)
* Report ignore/files config hints only if sure & relevant (4c3bd085477139f50dce468c4231ba2753459c54)
* Add consistent `repository` fields (781a0fd44a2cece4fd9c1413e50caa88df528607)
* Add language-server bin (13d78454c4100f5d6a4f0cadcf1d77eadec523b2)
* Use --stdio if no transport provided (bedb21adff873c13095350842c85bb1bfeac643b)
* Refactor from "enabled" to "deferSession" (resolve #1499) (15e3360f11c81a866b8e6de76e894986bdfddedd)
* Use `initializationOptions.config` or default fallback config obj (resolve #1503) (0abe5684083428340254dc1b0136760aacb9acff)
* Also publish ls + mcp with pkg-pr-new (78065260f55fc491d59912e2db41d789e49a1bb7)
* Auto-format (51b7dc1de9e2ec5b738df5389906df84dc1f3dd7)
* Remove `chdir` shenanigans (close #1516) (0cbee8f38f4a91504b3adc4faee466b9624120fc)
* Bind `console.*` to distinguish internal↔ external logs (3eac278273856994483a9164539bf57a51ed440b)
* Add early bail-outs for changed files we can ignore (36c2dd5c4345d743c3de58ebd677b6f48a270213)
* Avoid unnecessary module graph updates for unmodified files (f94c41f24fb7f5c4682a620bafd03700cf14ba68)
* Fix typo in pkg-pr-new-pkg-dir (7e7a8b05a06f1f972a1d5e236dc53facbbb99729)
* Add .DS_Store to .gitignore (#1530) (40fe5cc608f2ecf71d148e061071e249c8940edb) - thanks @wojtekmaj!
* Ignore RNC CLI and metro internals in react-native projects (#1528) (0f892aeed2556a018ddaa769c24be68fba8b91aa) - thanks @wojtekmaj!
* Support nested _generated dirs in Convex plugin (#1531) (bd75e9fce6a25997d3ecd90e58b087f05a89c96f) - thanks @kvnwolf!
* Housekeep cli help output (c24e746b31b5dd994d004286229bd9d913bf8f14)
* Fix up gitignore test (6bc640c166daed354ec9514277b9f719155eb8ab)
* Introduce `isFilterTransitiveDependencies` flag (close #1507, close #1101) (8678df2d6f6cbedfe9483dae75e84a5605d730df)
* Housekeep webpack plugin (2cc13066cdfd82e03459cb724907ff998231145b)
* Move up `plugin.setup` & tear down `plugin.teardown` (4dbf23dd54ec7712f33eb8c714c8dd9942eb5538)
* Skip config file loading if only external re-exports (ab775b1038a25e3e844e23c84ae4fc30b87eb7be)
* Improve & optimize ignore pattern handling (c3d391210d3cf9230622b32416c1b8093062b232)
* Housekeep compiler registration (2aaf9fc6b68fcd36d6a8781690d5882f7bb7cc3e)
* Edit docs re. config file location (79bfb352246c900035c6deac7c3742c7780e726f)
* Register visitors from plugins (9b059f823a3aaa707a5e4bd3c14d7d879d397cf2)
* importMetaGlobCall visitor for Vite plugin (1874b19b0509c50e50446c58d4237a8c411d7259)
* Extend registerVisitors with script visitor support (728c8142a88df12bc4465201400cef4a057df0af)
* Move execa script visitor to execa plugin (71c739a63df39b17cf0b20e8e268a1e78aaacea8)
* Move zx script visitor to zx plugin (5ac24c7b86005fd2ed5ae5a559e346d3c6831ec0)
* Add require.context visitor to webpack plugin (100f1748e1bcc2c157ce482418295ccab7efb110)
* Add module.register() visitor for Node.js loader API (resolve #1535) (742407c61dba9c71de685e052cf531fddc8e1736)
* Add .DS_Store _in fixtures_ to .gitignore (#1534) (90fa6774ee1cb4d6a093bdf224730cd4b2d68358) - thanks @wojtekmaj!
* Mention that depcheck recommends knip (#1536) (75d00ff3276b4a1adac88de51de2895d68ff8220) - thanks @ArtskydJ!
* Remove `@source` matcher from tailwind plugin (resolve #1537) (b7149b6185407be18aaa1613f3cb275a1a92a4b7)
* Fix `-w` → `-W` flag for Yarn (f305250f06c84653162c15f9500cad2d65dea8c7)
* Update AGENTS.md (ec83887947c4a92625ec8974e25cb051640baa89)
* Extract and extend react-native plugin (#1538) (9fd04a89f2e45c95831e56ba813d918a2fbdfcd7)
* Add pm2 plugin (#1540) (3bb4203e549f163e27caab3b4ff7f8d8d3076784) - thanks @wojtekmaj!
* Fix Yarn (Berry) plugins and binaries reported as unused (#1523) (4f0a3076f84fff6212f2a9c9a99d1cc4254e98ee) - thanks @wojtekmaj!
* Update docs (ed23dd23790a0787dd747a1f183586470220be57)
* Minor refactor while at it (4115b9733bff321e138d026bcad2a29c35f74dc2)
* Add @knip/create-config to release script (1135b82d7bd9096f4c3752482c58e72e10d0ef1a)

## Release 5.83.1

* Fix package.json import (f8c14c873127481927306751479001d16deafa58)
* Organize imports (5d716bae3919b3cd684f0c8c9af73a960d12c5cd)
* Update a bunch of dependencies (78bf644bbfc6554109d7098f83cd30fc8e115900)
* Add minimal test suite to vscode-knip (b6395089f6b307a145d2493bca59db9d5bc3364a)
* Add support for monorepo when installing dependency (close #1501) (5782b07f79eb1a25f90c5fdd62b1217db11246b1)
* Fix unused file output in table (0f3dbb47b850e731c4405e06809aa069f68c7608)
* Restore slonik in ecosystem tests (35d9185a39cb1efba55ce8a749d3eb9a31eb82a4)
* Fix type in exported value case (resolve #1508) (d6dda74021a2bc08931691ba1d10029102b0e425)
* Organize imports (fcdd33b9e8f9169cc0bfb921b468f163ec0f980f)
* Remove unused export (c777bae22c500606857d9df820aab8af7593b24e)
* Don't flag exports (including used as type) in protected or consumed exports (a01bec149b8977e0927bd1ecd9d0197a1626e3a6)
* Add npmx.dev to ecosystem tests (8f8205261fe88144df6cf0cde6e7007952f8ba1d)
* fix: fix vitest setupFiles resolution (#1511) (273b940f7e32ff7156c3a24875f5d9265ff2559a) - thanks @tmair!
* Improve & extend vitest args handling (6c49e5ca61866a8d3fe62aaf8f5a6764aa9c4e86)
* Detect Bun differently to avoid TS complaint (c1499d32332751fbbed4baa648f5360f1db36dbc)
* A temporary workaround until they catch up 🤫 (028b9726dfab717a41d95d7e73ad8ee2ca929d31)
* feat(vite): detect module entry from index.html (#1487) (a76ab85337c5459a0d22128d33d5fcd9e3623db6) - thanks @WooWan!
* Auto-format (69150bfd315dff04778f067438194122e4d50761)
* Add double-dash handling and add tests (close #1404) (4c1de75890c53f35529b6ea6f24e159c9532bedf)
* Revert most of previous commit 4c1de75 (0cd91ae44ee1bddc584c2fb7494147aeb3f53feb)
* Auto-format (cf3d8ff92cb53b769814c4140b3c56023d92fd27)

## Release 5.83.0

* fix: skip empty string entries in package.json exports (#1477) (6b64ac5b89916869a2361077a51dc28adb4679df) - thanks @SBoudrias!
* add LS version to serverInfo (#1468) (2c28cb8dc8923d83800959a7a259b439d5c50a0e) - thanks @niklas-wortmann!
* Avoid highlighting path-like specifiers (#1488) (c8fec09666ad0ce145e1d2bbf99737a6bc95fd05) - thanks @azat-io!
* Update avatar URLs (#1489) (d612ac2dab39a560875c53b9cccb3d920caafdd1) - thanks @azat-io!
* Copy fix-fixtures to tmp dir (bd1519c30bb0a4004cfae463f10f8b066b778d95)
* Don't add excluded issue types (resolve #1486) (4eeeec602a8275f8f8d4252157ed6fa3cdd83f24)
* Minor refactor (767b2c5927d940f8815d157c2fa50c67f0a80d63)
* Edit docs (78111c96f54da3c41cfb84bd972bb5e836e1b859)
* feat: add plugin for expressive-code (#1493) (fbf958a9bfb2d913c345c98283a793a7f10faae5) - thanks @cylewaitforit!
* Truncate file path left-side (resolves #1494) (235949c0b68e0bf2f3eb9ef0f3f88e750984e70a)
* Revert fix-fixture format test (fails in outside cwd) (8e961259bddef4652ae3b98387d1afa8514429ec)
* Skip empty manifest entries (resolve #1497) (d314ce43e7f9fe26125db167c1a8af4728329828)
* Filter out empty issue objects in compact reporter (resolve #1482) (7df0b4d8ee888f524132cd96260e18b870e8c57c)
* Lint/group import statements (61e7a24460e11bd2e9e27e9a791953eb004947df)
* Update AGENTS.md & docs (7537f8a1c474ce931a05a06efcc238eef5806447)
* Optimize `relative` path helper (ac8a45454f9e8d88898141e112897803c844f803)
* Move `postinstall` script to non-production (360110bed44d77da4ed5e553a63986176d2ed716)
* Ignore simple-git-hooks in production (like husky etc) (bbab35b144080d061641b6b6a6545176e5286553)
* Move & add testimonials (5ab18133b0e375508b34014085e10b78dcfd88ff)
* Update sponsors page (4534a55e37f804bfdef65522354b053f28a5a8f2)
* Edit docs, add config hints page (1a73a053dad914025e330c03cabaf9ded2444e91)
* Rename reporter to match project style (58f8c4e476b8a051dd27fdf27859014c4954289b)
* Auto-format (854124f7b5436436d57c5249f9b64f53e71e1994)
* Refactor fs helper to match project style (f22e7e94a48ac0dedf41985f3928ff556d04d727)

## Release 5.82.1

* Add vsce + ovsx verify PATs (6bec12857f9278c07685388eac3f9d475b63d5df)
* Improve coverage for `isReferencedInExport` types (570eafe3a69cc2738e5aabb800cc9dd0076b83ca)

## Release 5.82.0

* Release @knip/create-config@1.2.0 (31eaaf544c88bd4c26003025da515a0f8ac134dd)
* Update docs (0384673619ad523cfc936b7c7c465010de40f5b1)
* Add config load error hint + example env var fixes (close #1470) (844beb008dc155b8b04fee085949c9e32513f409)
* Improve mdx "compiler" (resolve #1471) (cd145e2a189be3be37ca997ad3aa0d96c90270be)
* Add and use `deputy.addIgnoredUnresolved` (4f6d9e5c9216fe9743ddaec1fa8f71d4fc33469f)
* Unescape regex in config hint output (b51772648213276b960fd11d93a4c1df01c3ba4d)
* Create new sveltekit plugin (split from svelte) (714af2e7908f3493c27b1c2f74b617e9a2d3c4d6)
* Use bun@1.2.22 (cf5bae269428b87a1f1c84aa49654399b910d484)
* Detect and install none installed packages (#1473) (abefd095a798b0356b1952dcbc74a6f851b69ab0) - thanks @AlexanderKaran!
* Auto-format (443017526c47e1095bd6b44babc1fb2639a28cde)

## Release 5.81.0

* Update CLI documentation to match current implementation (#1458) (937dd832d9421a295e733d0046266b3154fd78fc) - thanks @sebacardello!
* Replace glob with fs helpers (#1454) (880f7182f3df5df5b1ee497d73c02846ae8f10f4) - thanks @gameroman!
* Expand workspace filter (#1455) (b3edb80a9b56fecd2b9ed67a5dcc927e405bd93d) - thanks @fightZy!
* Sync up cli-arguments ↔ md docs further (47559d21f1f13a2317c4b9d8439d5df4c8084306)
* Minor refactor for lints & consistency (c5e66dbe226612c8ea7c65b5d193292a115c987e)
* Fix manual enabled compilers (#1457) (57df2e1c581b14e85023bd857048bb313d386130) - thanks @digitsum!
* add push notification once module graph is built (#1461) (57825f443509fb2afa0444f7831ea67a798364f8) - thanks @niklas-wortmann!
* fix(prisma): Avoid crash if Prisma schema path is not specified (#1464) (1e0ffc7d64fa513eec47e082b0aba96c817960ee) - thanks @stephenwade!
* Add Nitro plugin (#1415) (ecf5e34b51f3817dabcf50ca6705141aea3f56e5) - thanks @lynnntropy!
* Add a few impl guidelines to AGENTS.md (5923a20b0b8a12fb33ef23ecf600e82cc1afe7c9)
* Optimize workspaces storage & usage inside `ConfigurationChief` (602603fdf428d329925e191dde319388e8726597)
* Exclude optional peer deps from the production deps check in strict mode (resolve #1145) (605fb852a927ef89c0983000cf623f00ab3ebc55)
* Consider all members of `keyof typeof MyEnum` used (7d5b9d6c34f0c25d5608f398defe3ed12f0f49c3)
* Add entry files to sveltekit (resolve #1162, resolve #1465) (c0ed40a21519993d0513bb87b1b2a189b3d0054f)
* Consistent config options (dc11214340839b3e0d11c6b5f0d1bcbd271ccb5f)
* Warn for faux monorepo in init script (b94dcfa6b0e108d3bcb80d35fdde7ff54274d908)
* Document new --workspace behavior (#1455) (9cbbbc203199c002616722ad76704b621c0706d4)
* Auto-format (4c3e45ffe9dc447ab9630022406a89a04ae7acda)
* Add `npm login` to release script (968d339f8583c678bb891a446ac038d79b6716c9)

## Release 5.80.2

* Add astro-og-canvas plugin (#1445) (bb93a2b8ea4cbd87b300f5bcc4676cd8e83d786d) - thanks @JoshuaKGoldberg!
* Small performance optimization on bun commands (#1453) (af0d73673b587df10635ec19e367b788bdb173cd) - thanks @ClementValot!
* Accept `cwdOrPath` in `isDirectory` and `isFile` (2d0bb0cd38fb8d0502532b0999cb4cf795c3e4cb)
* Improve `hasRefsInFile` (86bde97ea1a202fdd9dad1fd05a30026fa78f284)
* Rename find-internal-references.ts → has-refs-in-file.ts (307c37b87e311da519342d39216e8a38aa635388)
* Move `pos` from exported `default` keyword to identifier (8e74ec7154f408e53973a9cdad7492c711d7811b)
* Fix release script (71206b79a43b7c293be36135f863e2b73981d16a)

## Release 5.80.1

* Minor lints/formats (26a6f7b5)
* Resolve _partial.scss in compiler (close #1439) (ee09aa33)
* Add tip re. Knip editor extension early on (88c488a8)
* Add more deterministic workspace mapping to remedy test flakiness (4d000e74)
* Remove `ignoreExportsUsedInFile` from default config (f3eddf3d)
* Update docs (29e5f175)
* Show link to docs for module load errors in CLI (31ce18a1)
* Bump release-it (64ad7b4f)
* Improved TanStack Router Configs (#1449) (3e0b847b)- thanks @AlexanderKaran!
* Add warning about invalid tag characters to docs (#1448) (de508e34) - thanks @solomonhawk!
* Housekeep a few thingies around `resolve` in plugins (5b98269b)
* Improve react-router `appDir` + fix glob escaper (f993591b)
* Extended the NX plugins (#1443) (b9dc80e3) - thanks @AlexanderKaran!
* Remove mention of editor plugins from FAQ (#1444) (d8fa043c) - thanks @sebacardello!
* Fix remaining broken links (a8d0bfd0)
* Bump md/mdx presets (a4d6b1e7)
* Fix quoting in release script (2f663e3c)

## Release 5.80.0

* Edit docs (d6f33a51)
* Only try to use tsconfig files if tsconfig.json exists (707c96db)
* Also create comment for commits that close an issue (3485d677)
* Plugin for Parcel (#1438) (24d81313) - thanks @AlexanderKaran!
* Edit "Knip for Editors & Agents" (e031018e)
* Timerify `hasRefsInFile` (#1435) (c6fa5e47)
* Fixes #1436 - Make stderr redirection platform-agnostic (#1437) (61305e74) - thanks @ClementValot!
* Refactor `isReferenced` and `hasStrictlyNsReferences` to better express intent (fa23a330)
* Fix up and reuse base graph objects in tests (ddc66932)
* Rename file node key to `importedBy`, and then some.. (cabee8e6)
* Refactor `hasStrictlyNsReferences` (resolve #1427) (0768c8a5)
* Replace entry symbol in trace output (circle → enter) (a7bc12b6)
* Add comments to module graph types (9971d476)
* Work + comment release script (e8486156)

## Release 5.79.0

* Edit docs (a60e15aaccda64ae5511c07d8b641115789c5fd1)
* Added docs to explain dynamic config (#1423) (834104176c634ee939093480eba79b92c70ff3c0) - thanks @AlexanderKaran!
* Fix recursion for namespaced self-re-export (resolve #1429) (edb8bcd09a0cad29e760cd5a43179a6c61e97da1)
* Fix plugin doc gen after b7bf92a (7a7d19691fb9bb7ad6f545bb88dfa962600f1521)
* Add cache to OG image gen to speed up build time (1c66878dbf683bcfaee10306c68fc5f6544916ef)
* Move OG img cache dir, maybe CF build cache uses it (82158fa24142a84c9a0a4b83717591d050203f66)
* Update tests after edb8bcd (431cb558b854b7991971fde4cd752b17e2a30500)
* Turn on command echo-ing in CI (24a3e47e2d75f77046d2ce4656e39eba2aec99a1)
* Minor refactor graph type (1b23041ac69ed48305967f30f09b5060511126e6)
* Refactor in-file ref tracking and fix edge case (7c8cf23088e2b0909de57f6db99b776dc96f44dd)
* 1289 knex plugin (#1418) (af0ebaa98537be9c95f32c2c3b58cb506922d9a3) - thanks @AlexanderKaran!
* Fixes #1432 - Fixes packageManager detection for yarn berry (#1433) (0b34c2626c64787967356783dbb3b19631b8356e) - thanks @ClementValot!
* Add missing bun commands and aliases (#1434) (f188f1794de2a2124dc65911d25d315dc215584d) - thanks @ClementValot!
* Added TanStack Router Plugin (#1430) (e718bdf67ff403afd0b616509d18f7954325e376) - thanks @AlexanderKaran!
* Fix gitignore ancestor detection for git worktrees (#1424) (67a93c641301a93401c2416895b74349043bbfd1) - thanks @altendky!
* Update sponsors page (cff7e45f43598b20b05155f80c6cdf1a5d8e74a2)
* Update a few dependencies (1b4da160758aae0bea57bf766d1bdf74b4b60cca)
* Release @knip/create-config@1.1.1 (312d8231b40f547c0272f4ed5a628fa5c3f00cea)
* Fix lint/format issues (c5d1d49301d9cb97903199ba5feb2c200f1e6aa1)
* Release knip@5.79.0 (953819a129abac47bd2d361bdaec7f4c328024a2)

## Release 5.78.0

* Allow subpath entries in webpack plugin (resolve #1164) (9bc9f87d463e0d3c5f764a4478a855a9f30ae7b3)
* Improve graphql-codegen plugin → package mapping (resolve #1194) (ae6035eeb88c1114ada9310304fd98ec6b52e5e6)
* Move config pattern → entry (resolve #1213, close #1252) (c6fe20eb9c708092aad8f6e84ad6de96c2802ac1)
* Support arrays for moonrepo commands (resolve #1228, close #1232) (216ffe0db50c1e216c370273e3b3345497d01352)
* Improve Astro "compiler" a bit (close #1245) (65f90096e9c57b78b3c5a4afbfbb123d252fb3c6)
* Consider exported type used in exported interface used (resolve #1250) (2ec95f762a01a0b7ec09837c8823373cc81a27cc)
* Improve/loosen up source mapping (resolve #1256) (af536ca6c3a732be8f59824d7d4a09840dd9aa1e)
* Accept `node_modules/` specifiers in deferred entries (resolve #1271) (5c1f0beebc11b46a9bb4ede49c1243b8c6bd5942)
* Fix up a few lint issues (5cb4c304811d3798da8449f2c7b6b5788c4e978f)
* Fix Workspace Circular Symlink (#1319) (bffae524e5fdacbc2ba11d4f1ed7240febc2c169) - thanks @mattietea!
* Remove unused imports/vars (fc965951212423bffc964f078c27ddccc9590088)
* Add support for git worktree (resolve #990, close #991) (b7bf92abd17cc28146019bc5c65b27fd8b21b382)
* Fix TS issues with config-as-a-function (6dc082e9083a73d56aa7f80622d15dfb754dcc41)
* Dear CI, please accept my offer (a0138b5cbf060d1ddcd34cd957337ec1775b86e5)
* Allow negated `ignore` patterns to filter issues (resolve #1420) (b2cbbd5a2bd5e345a0e124906cc1be90d9583842)
* Apply fixes after running preprocessors (#763 #1420) (10f5bd2599297848ce051da086c10251c3e8f793)
* Add more hints to AGENTS.md (0ca7881b6374c3673b89cc5f8766fb4be164e58f)
* Remove unused export ✂️ (bd685bb57ffac6b7e5198511eff3272e3be870b0)

## Release 5.77.4

* Go `process.chdir` and defer `process.cwd()` usage (a83d858789e48eb4c00ac809fd1093ae5967611c)
* Improve error logging (36785fe45e9c56974cf3e8c17c0a5eb16b067bac)

## Release 5.77.3

* Safe config hints set → array (for json-rpc serialization) (b0ce4ddfde76b5020814be3bf2b3a32f08072b33)
* Remove unused session method (b624c9763ae52d05e522c37f09afa949cdfbffd5)
* Remove unused export (942086701fc565dcaa5c382304a68bfa8aff885c)

## Release 5.77.2

* Fix missing import in mcp server (f725d411f0b531460102f73d9bbc9ade53cd9324)
* Update READMEs (56277d3353ae1bd3faaf81593f5b7c320e52caeb)
* Upgrade release-it (478d6fc8118005856d6d309fad52790f9eed362c)
* Improve release sequence (8900e70d7256634ad1ed2eb63ef53f7dc1b6fba6)

## Release 5.77.1

* Fix docs in MCP (31029ecc)
* Improve a few notes here & there (f0fdef45)
* Patch create-typescript-app (7827890f)
* Exposed WorkspaceConfig (#1417) (3d8d88d1)
* Fix plugin title (eafb9d4d)
* Complete the release flow (431d530a)

## Release 5.77.0

* read options after help or version (#1412) (9120432e1c274b3a421975796019191018fdfc14) - thanks @GameRoMan!
* #1355 vitepress plugin (#1414) (dc5bb2a683e17011cb159130e5c8a3bea5be97b6) - thanks @AlexanderKaran!
* Improve config hints for redundant entry patterns (2a3b456bbda188030daa4085ff97ef9f83c5736e)
* Add a few notes here & there (f2f4986b14f2fa2e3c7540409c6c39b388e6d1f0)
* Fix lint/format issues (3cc5bc2c5c877d35beeed6ed57520d988cd3d648)
* Use release-it to publish all the things (a009cb38489a774e94d0c6cd3c06c496e1a0ed20)

## Release 5.76.3

* #1381 Config default to packageManager if present in PackageJSON (#1402) (da7045bfe195accb4162a62a94220a279a22b25a) - thanks @AlexanderKaran!
* Release v0.0.7 packages (c9b2625c677b5cbec35cdc7895e1dcc45c1c1430)
* Release vscode-knip@0.0.11 (593e7ac19e6a30be7f52ead5648cf4f2e39b4b33)
* Read package.json only once (b5238895acc314c6e7b490e29c02b8819f2fb602)
* Release @knip/create-config@1.1.0 (805ee2ed4eae96e6b930db768e17c416764247b9)
* Add release script for @knip/create-config (7e6de6e48f6c7dbeb7f3c7a2bc51bbed22f78ecc)
* Improve `bunx` handler (resolve #1410) (5ab0488ae59b9f06d82709df86b038c2fc125e93)
* Improve bun/node test runner handling (resolve #1411) (d66834572e89d9baa7cdac8fe9a7d692ed6eda13)
* Skip `externalRefs` work if we're not in a session (0fc619424771e7d00e7c2718aca64f261944ecd9)
* Skip work for e.g. `--files` or `--dependencies` runs (60d760cb7630ceec3868073b0d41b9c49744d844)
* Skip work if we're not reporting dependency issues (2456dcf29a829454f222701edd7ecf7ec8b1050d)
* Auto-format (95cf1a96e7035ff7d0cadac1757eb4f86f2bb20f)

## Release 5.76.2

* fix docs url (#1408) (bcbb1dd2a96eebb0ba673c011bb82f5bb331cecb) - thanks @GameRoMan!
* Release v0.0.5 packages (e92537e424e4f3e5130efc3b0d39eb23b843db59)
* Release v0.0.10 vscode-knip (c4b8c318593e49f17b8c080091a44fa307bd0d5a)
* Less foo-ing (b71704ab05a63bb529a56064ec0ecbed4a74e15d)
* Add link to extension on openvsx registry (2923c971861ace5c65b10c2e4117ea521e0bef00)
* Extend biome config (696b8e65102b8b13f62ccc3c32b25198701a4d97)
* Extend AGENTS.md (a02e0b59e739702abeecf5e264bf78edbca7f4e7)
* Add note re. internal workspaces in Nx setting (#1395) (f8cfcf140374c179eb491a365e2969ceadb62ace)
* Update release scripts (95c2f516dad6bcbb011aa3669e3ba99b49f9ca29)
* Release v0.0.6 packages (38c3fdea710387b398b64f0dbad78faa2ab5bce6)
* Re-gen plugin list (419b8ef19baeba9365afa777c48980bfe7e1b1ba)
* Update sponsors page (60965788d91698d00fee0522d489069f4f1fe3b5)
* Add note to Nx plugin (close #1395) (527d64ea778850a6b82d3bb3bf2799eb36891e4f)
* Improve bun script file resolver (resolve #1409) (e1ca76e90845b0724191f0dba20cf205716b169f)
* Improve script handling (#1404) (8d47360686859d38d73c41fb322ac2680590ab4f)
* Add enabled plugins to tool results (avoid unnecessary entries) (906a49f7136fa36f241aba022afee24580a055c6)
* Fix var name in ci job error handler (9d0ebe0794dd62dfdab0cc1fee72207eb0bab5dc)

## Release 5.76.1

* Session re-export monorepo test setup (#1407) (69050886a9e62b51bfba9b716841643f08b81854) - thanks @Sheraff!
* Release v0.0.3 packages (344fab2057419c7ef5fd275bef7bde6c12b6c83b)
* Fix jiti src + mcp docs (fa6cf89431a1ff079ec113857871bf7f8c4faa81)
* Release v0.0.9 vscode-knip (69b32a9612cfca1410cb8d1166eab508d1a8ed0d)
* Walk through entry files (resolve #1397) (96f884eae5baaac5c9c0707ce7344657364fcf99)
* Fix glob-likes & links in workspaces in imports tree view (413cc8c57ca0e56b2cd541d6348733e3e4ed362b)
* Improve extension build script (dad8a8c1e25bb107ab49eae85a3ae752d6064ca4)

## Release 5.76.0

* fix: Unexpected error when pnpm catalogs are empty (#1406) (e2dc8ba8f935f07bad08d2d7e7562f111fa65da7) - thanks @Promise2679!
* Release v0.0.3 packages (b4baaa03f4247b1e8470a2e10f1fa91262c3efd2)
* Release v0.0.8 vscode-knip (3af5727104099ad3a9bac60af59c0db60ee61f90)
* Fix link to self (63e51438551b48cac2e723d430a677e5997d3d7b)
* Fix excessive output/handling for files outside project scope (7df0da846dae10bea15f12514051c926793a9e85)
* Add `getDependencyUsage` operation to explorer (3ff7afae57245bdba9801839b561b2276c2d0871)
* Add `--trace-dependency` flag + trace reporter (a4a8528528f60576f727761380e3e2fb11711ff1)
* Add dependency-usage-on-hover to LS + extension (c44d15be091eade246e846eb59e561fac8f5ec3a)
* Refactor getReferencedInputsHandler → createInputHandler (5b48fec78c0f999f2da64e55756602149c891b1f)
* Add & use `imports.externalRefs` (136ff8afc814a01860f715be8aee6bb478f3c299)
* Restore `workspace:*` protocol (e1eaa5ee6a59fe88913a574861505c5ef9067b53)
* Fix up test (9a2af6c40b7e91236e75e7728ed3ac512fc878a1)
* Wrap up the refactors (c9f5abe639bd085a5811503e928c7476b95ab286)
* Dedupe dependency trace output (0950f661f6335f5a5d7e084f9be8d22d3378dee3)
* Add entries + screenshot to docs (444b5678f70b2d705aee9bd967eec23b78e3710f)
* Conditions apply (65168ece74749c60cab3840103b96ef2699e3fe1)
* Prepare for `ovsx publish` (ed49b41b920392868e98900d4c67ee037de8d859)
* Deterministic order for issues/hints + fix up specs (0faa3b8babc5708c9c719f0f5756c3655ef00cfd)

## Release 5.75.2

* Release v0.0.2 packages (a4f7f32e170805fe4f2c845ce2b65572871e508e)
* Wrap up blog post (ef4b300eb37fd121748aeac67f9074172b5139eb)
* Add build & publish script for `vscode-knip` (fc88bd82a7015d99c0983fcd9bec640e1c0e8e55)
* Refactor session tests a bit (c8a7104f2f02da4209090799fa14e8ebfcf08b1c)
* Add fixture for re-export count (#1397) (0f11b65edee595e83cd9fa603b7b841a1fcf18b4)
* Externalize jiti (resolve #1400) (a54aa6b15ea3064214c364065675336661063316)
* Add `op` to `endOfCommandBinaries` (resolve #1399) (164532dbdc43b5a2387ec5afacf086da10e7e7ed)
* Rename parsedCLIArgs → args (0432ce50d9db35fba68a3e2187e2c481fa0195f8)
* Add `configFilePath` setting (843c2ff950e74cc16351e0d026914f3e783793ee)
* Remove unused imports (6ecf4e7211eb4cb286c84ce2bc9147194abdd497)

## Release 5.75.1

* Release v0.0.1 packages (c38a8c0f19ee4170f9a321d635e30d242dbc7925)
* Revert `sourceMap` setting (443ce672147329b9141573358bc20c4169346af3)
* Loosen save (e7bcb40986b7a73febccc3e275ac896b454d891e)
* Fix up vscode publish issues (fb0d52d0a914134e1ff45bd7d8bc48fbbe8e82b1)

## Release 5.75.0

* Add Language Server & VS Code extension (ae55e760a7b006396b97de46818e13db2b9557ca)
* Add symlinks to node_modules for LS playground (68f53487a79726f6009dbdc77a67ca224b0e3ee9)
* Fix path resolver in exports tree view (a9d1e8b5f67a14d7402b1068c234c1a4938e0744)
* Refactor language server and improve SoC (47dd1641b58ac49304ca681d5acfeec8a8cf8225)
* Add readme to language-server package (a40c9fa2b1a4d7ee3cd9ba28c22383265a97e980)
* Fix lint issues (8460552d99f46e7bbe10e5a64e4521b7be2496d8)
* Merge branch 'main' into feat/lang-server-and-vscode-ext (5eeac38c8f176c88a439046825ead2df8b304b9d)
* Add packages to AGENTS.md (57bc12b51e462d3f8f8456f2a1b8d7be18a910d9)
* Fix up `isReExport` → `via` (c01868def0e5f4a5e349ce64d5fac547cedb4ce2)
* Improve import location display on export hover (b03f5b5365bcc305124c3deda8277fd3c39f5872)
* Rename a few watch → session thingies (b1f16ee6a5bad7c4bba51479110b0f720dd0f244)
* Merge branch 'main' into feat/lang-server-and-vscode-ext (7342ffe57e4ef6eb8423c938c597300f16c184e7)
* Rename a few watch → session thingies (0abd716985ad1c2e85bfdab5e136a53c0fba3fc1)
* Clean up `loadTSConfig` (8bf4cced8fe126d4dbb07a5c5b720a583b4bdd2a)
* Fix up a few lint issues (d97805be9658784ec4d9ab9660e6e7cde4d1b3a9)
* Set engines.node in LS pkg (7003be4a28574db50e48418aec8edb9c2bea318a)
* Introduce `--use-tsc-files` flag for `project` files (#1354) (3432dd9f6a1629285d8c8d5fbcbf3187878b3cc4)
* Set `isUseTscFiles: true` in session w/o config file (78c913aeb7a6d1d89de5fc2b14d2656c272c71c1)
* Merge branch 'main' into feat/lang-server-and-vscode-ext (5401c8c7571ee8d7322ac568c7e581418e95eefb)
* Fix support for Windows (156e952674b6bfd31fa9cd5a3c8c25d89e2cbf23)
* Add MCP server (ae8f5c0d96da427e3de50d60d7c4a478b1a558bb)
* Sync names/decriptions & minor updates (5a3b65e32c196e8076b848876ba629284e72d1b4)
* Add "For Editors & Agents" blog post (886661caf5b1cdf7a7c4a7ebc60c4d59d015fcaa)
* Merge branch 'feat/lang-server-and-vscode-ext' (e9daddcf3cf3a8174b6b8fb21cc9d9377567f758)
* Pre-publish blog post (e49de6cea3b87669f4fe379658c1fb8d7d6eea1e)
* Clean up launch configs (1ae694f4c5b6c618612e2d064ccaea70838d7359)
* Minor refactors (5633e2fec6fcb9ebb9fd1aa5f938023958a262f4)

## Release 5.74.0

* Rename import modifiers → flags (287d04b5ee9320d5bfb24f98d37325165e828d31)
* Improve class member tracking (88f2fb8d7d247a179d5a4c86df9d81bd966bfe72)
* Add json and jsonc to `resolveSync` (d6e9a13dd32ef4a4634be25ecae6c7a15489c6cd)
* Get rid of `isSkipLibs` in module resolver now that we're using oxc-resolver (bcd97330641f2933cf9565e6021d2d543eb90ce3)
* Miscellaneous minor refactors/naming/comment improvements (9aeb6debfa7e1b2bd6aea1db3008baf9af04964e)
* Shape consistency/value reuse for clarity + enable V8 optimizations (577b4d7a1fd4cbd1d719e537e6d22f7a44c8c48f)
* Fix up launch configs (3d9f6f3b22989c8ace14ad11362bb9c7150e6c2d)
* Fix lint issues (f1aca2fd8f2e15016b4e755db5a4705b0134f0f2)
* Temp disable slonik (54d4d459cb24602fc03b3155c07ec64f1d39618d)
* Improve clarity re. shape/mutability (d6d61053ccadcd38c0a50fb5b872912cb90e2db8)
* Add SWC plugin (#1390) (926808485335e33e8ccc623785e21dbbec109e36) - thanks @ebroder!
* Ignore sass builtin dependencies in Sass/SCSS files (#1392) (c7efb229572a11d3e60e34c71eb935b2e194e3b5) - thanks @ebroder!

## Release 5.73.4

* fix(bun resolver): detect "publish" and others as builtin commands instead of unlisted binaries (#1387) (542e2ad11603d9652809fdd8c841f24dff402626) - thanks @viktormarinho!
* fix: detect namespace imports used as default values in destructuring (#1386) (31095065823e3c6b691da44178252d7d863410ae) - thanks @jstaab!
* Update release-it (71fa7b14cb220dce939d7b87d08df33977863d84)
* Fix up some md(x) logistics (a879075b8898aaaea4b0a34e234ef865a59d0fe7)
* Add DTS extensions to the resolver (9126b1e23a992c3d542b1dff7ead06d85c24f17b)
* Improved zod error (0f0cef3654c55be2271c594ff84734ac2a878e33)
* Auto-format (353c9b55af62e70189d46150496e89621d0d366d)

## Release 5.73.3

* Fix up package.json after previous release (1b2d9ab300dcf16f1d0e3480dd2ba9e38578789c)

## Release 5.73.2

* Sync issue types in json schema (dd275e1182b0860a8cb6494b0d81f29b33c48fd2)

## Release 5.73.1

* Improve handling of "bridged" require calls in ts modules (dc546c67cc0a48b4da8477d1befb8a43485db022)
* Optimize workspaces finder (056c619dc32734f9d5520729565c380160343b7f)
* Don't add prerelease comment to closed issues (12f41cc0616dc8bce2acf18e19f6b33bba3c0b7a)
* fix(plugins/astro): srcDir config detection creating wrong entry patterns (#1384) (fba49d7f3f8a9cd0f4c549bf00587e3c633ffc25) - thanks @viktormarinho!

## Release 5.73.0

* Bail out early if specifier starts with colon (resolve #1379) (68c959766e5e4a3a9bda3a519dd9982fe44ea47e)
* Add `clear` to list of ignored global binaries (91522bb59a8844c0259646f4d34e2b49b6fa65a7)
* Add next-intl plugin (resolve #1380) (430b8a391cdd841deb85b6efed60531ffe622bd8)
* Create new next-mdx plugin (extract from next plugin) (c4acf7a6d77be6fda8b88ace4f499b297aa4eb6b)
* Refactor preview/ecosystem workflow + add comment (861252a28c7890b28efea8437e7db8e114370fb3)
* Allow workflow to add comment (188920a317f21d508948753c0b7266ac8ad3da57)
* Remove eslint patch (d9fc8f7248816ddd399088145d5dab4f055c0ddb)
* Use pkg-pr-new `--commentWithDev` flag (c9af60858ed02c3ce8fe3c2137514096743ce052)
* Fix regression with `require` call in ts file (resolve #1383) (557c7456c41e8574cfe6bbb10ee52e15eeb1f65e)
* Remove unpublished flag (f08c7eed172fcd98c82490aed5baf59fca38c8c0)

## Release 5.72.0

* Resolve setupFiles and globalSetup from config file dir (resolve #1317) (ff8c33d20e1cfbd9eaa7d7f963e5ddbf99678770)
* Add SASS/SCSS compiler (resolve #1292) (333ace375f74357b62d1a6b31260fd29f54b5932)
* Update compilers docs (2a5be2d48fbde70f82063dfbba23ceaf17b30291)
* Move & update dependencies (9fb19b3d7dc3c6f2e991feab83e7a0cdc189a476)
* Add .vscode/extensions.json (77433bc68590e1695084cb3829c8743fd86b1762)
* Keep tracing exports/members through pseudo re-exports + conditions (resolve #1371) (fb3cc39e8d59950ad721b5b6ba10d620d55afad2)
* Defer work for a minor perf optimization (e0a464900b73e8a917db86a03d060b52f6dd261c)
* Remove obsolete .prettierignore (9cd40e1b1702ffc112aa56b8533d7208e7ecb40e)
* Add docs re. coding agents + AGENTS.md (262dacf37cec57f957b0fda2010bc5caca25ebc3)
* Add some docs/hints to code (8237a304690f12fbfd9a0589376a36d7b12bce52)
* Ignore `void` lint issue in explorer helper type (33d7497809b6458044082d1505d1f750d98eb2b4)
* Ignore dependencies used by IDE extensions (fb988139784eed1e1e4ac4c79b46dfd1608762d6)
* Update rsbuild plugin to check preEntry (#1373) (b542cb7a92d67d0a5ffad2404c23cd1b6abbab5d) - thanks @MichielHegemans!
* Support cli args for config file in vite plugin (ab01e82e3378bf89d45a2edf245004b92460e967)
* Refactor `traceRefs` out and improve export tracer (62d574eb3b6f744fa698668ef2bbae2d61fff80d)
* Improve & add `importAliases` to `refs` tracker (f90eed6d1f612a169c8ed677a53c3028c0e2eb44)
* Make non-pkg specifiers relative in SCSS compiler (c77ea4431eafef46ee80494d52e2f1a48379cd08)
* Allow integration test patch (733bc92771f37ff20a3260a03d56128d3e10f8dd)
* Add knip config patch to eslint integration test (ff6979403704a9953894958b3603532c312434d7)
* Work that tracer ✨ (d79c1f6239683e50174f353ad2a2fe1145df6dbe)
* Allow multiple `--performance-fn` (5be3cdc3908d55585e915b68889a6e065edc7034)
* Add `extensionAlias` (ebf3ff3ac0775a57cfc16bfbf90dd425c75bf7d3)
* Sort files for trace output & add diff test helper (4c22ec32d5cf3432f2003d9df5f2ffa9739e568f)
* Bump oxc-resolver to 11.15.0 (ff4d0899e98331890bfcfc38e68ed45f0262003b)
* Add `tsconfig: auto` and use `resolveFileSync` method (b2f213d4db15050e22a7b8f973a443b89dcb632c)
* Use `containingFile` (not dir) (ed0cdacf972b44d57bcf739a39bbffc4bec61c77)
* Add missing tsconfig.json files (141d5c81d5fb3f3c98c729596d3fac979dfeef63)
* Add test for tsconfig rootDirs (close #873) (eeb41744983bf96c88091afdfb0bbc8fded7c287)
* Keep using sync resolver outside ts module scope (a3fd7dd42b3e34b68d23e3028ddc92e07266bcc1)
* Add index to mem table (96edd57bf2eb98771577c106347fa45ca4c7e02b)
* Update export tracer screenshots (018837137882deea5bc9206ba716edd0a49255c8)
* Add SVGR plugin (3b564dd28425c2c95d129b1f90a095d5dadf532b)
* Update command to create plugin in help text (6385b2513ba012b4f479ec8292d766f01a771198)
* Format (dee9795b114c9d341fc3f41c2a3268b5568aa1cb)
* Add support for `viteConfigPath` in storybook plugin (ec9d6ccf647e305758cbb03df6f4ddc188e5f98b)
* Add impl walk-through & new plugin instructions (4f0c8b100d718d6e292e24ccf9b7717fefd44f19)
* Minor refactor `formatTrace` (143755e9c916dd884b01da9740a98905152bdd26)

## Release 5.71.0

* Add `sed` to globally ignored binaries (#1365) (ea8d61899fe8d4ba160ec998d564d3c9f5aafd55) - thanks @jmoses!
* Consider NS in condition referenced (closes #1364) (7a5a8ea2351b31e1cefb1405d33b8dbb464c2ec9)
* Improve dynamic import binding handling (close #1368) (b210b18c18357885b33827fc23a7333615ef7d64)
* Introduce graph explorer (b107af4cfbf034159903cf79c82e6926ff7dd91c)
* Find mdx plugins in next config (resolve #1367) (07c0539dd167681e2f5533bef15a7759bd6a3f5f)
* Filter out subshell function calls (resolve #1369) (97d8f6acc9fda00486b2072f9717789d54b4e225)

## Release 5.70.2

* Restore & add TS v5.5.0 workarounds ↻ oh my (fe7ea23981ae1c94118041299b9f1fecceba62d4)
* Extend & refactor `Import` in module graph (ad25794fc5ed465cf4be151df05fc4196d1589e4)
* Fix `TYPE_ONLY` instance (b431303d60f84f6abf77f37f93ccf9ab399d4cc9)
* Add side-effect imports as well (ed289ba9e69a030f945a42aef0828029fbe9b734)
* Remove `project` patterns from astro plugin (ac9e378d2bdf84b70791bdce9febc511bee924b4)
* Don't leak negated entry into project patterns (eab2b892c774c8ed545952997e66cf53719fa68e)
* Run glob sets with negations separately (resolves #1249) (969e3afdb25d9e607ff68f60543c8f1e64be5a69)
* Include all groups to negate entry patterns in production mode (406592dca0e44917703b24cee78c2d85b0a42fb6)

## Release 5.70.1

* chore: fix vitest node env recognition (#1360) (9a38e10230b18b256ee8ed03dcc5217029b5298d) - thanks @jonathansamines!
* Improve some export/import positions (f6f58fa96ef1243c4e5c70e8860b286bd63bed94)
* Add some common hints/FAQs to plugin test template (da7cf84a501321a9bbb3e118e840d36d47abad56)

## Release 5.70.0

* Revert "Revive some tests in Bun" (f1406b5d8fc5add850e88ea23619bad745519c97)
* feat(plugins): Add Prisma plugin entry and Prisma schema compiler (#1340) (9f80aa4b09f9c9c5a0e55015a8b0eae9fb2e1812) - thanks @CHC383!
* Improve some export/import positions (b19282b3ff84d1486820afb9f09e1384d8934bc8)
* Move block to group top-level patterns (bba25f33d489fb1942925d022348536513e4a4dd)
* Improve some naming around module graph (63d61176f0613bb405627f6cab2dc1bbee052df5)
* Minor refactors (a63b0dce0f886f297650185c72003f7c935a9deb)
* Update auto-fix.mdx (#1356) (c64d9056ef9aed63b1b8255dc1bad120a21f311f) - thanks @skvale!
* Improve side-effects & opaque import call handling (resolve #1352) (e364589d790ce185c9a3b29aa2ea00f2663064d6)
* Add some unit tests for `isIdentifierReferenced` (f31eab4b443f084ff4af3eab187c352deab27089)
* Add support for awaited import call promise (92cbcef6b0501891e9e62ef6a3ef801b0de945e7)
* Edit and dim tag hints title (e4affd2f0651ba530817bb04805805e6474b0fbe)
* feat(plugins): Add taskfile plugin (#1357) (f64b72c31f0ee47da68a1eff96505dc770c43194) - thanks @elierotenberg!
* Improve pragmas handling/setup (resolves #1358) (e0f497cc937e5cb5281a84a7e9c2181942b94361)
* Upgrade js-yaml + some others (resolve #1359) (5195888a691c200c971e214f28ad20bf4a395862)
* Clean up (da9440fb6a09222cc8a50093178e6cd69fee3bd6)

## Release 5.69.1

* Release @knip/create-config 1.0.8 (87405169656dbfa8cf931092d516c91647f95529)
* Edit docs (5eb8a6943904505b5630dee1ee58379c7707f72d)
* Apply Next.js page extensions to app directory (#1351) (f9cf9dc0fd44880a515979a104261ed77fa8878d) - thanks @remcohaszing!
* Refactor fixes & consistently use `issue.fixes` (d7b45cfebb135881160ecda2acf0ad5239d98441)
* Revive some tests in Bun (74a0bd8ebf6e68e121333489495d2b6d58545fd4)
* Fix import identifier/specifier pos (95d2c04d5400ffb57f9057653c0977967b3ae02e)
* Fix namespace import pos (6b6b80b813d545d16ba74fc68beecd492f1252a2)
* Improve some export/import positions (9b87b1ac20fb33d9f9b5af1de1cbe1d053fa18ff)
* Rely on absolute paths with formatly (npx acts weird) (6653f357074c559f537af1b5563b191372d7901e)

## Release 5.69.0

* Update mdxlint-preset-webpro (88e772a01022dd8a023d5f9c54fe2e1e1407565b)
* Edit docs (c44b8bfe849e131c0a071cd67cb63e8ef1bffc30)
* Upgrade biome (5d3d74d0cdcd507c5b9f7db2bc4c7a9896394bff)
* Fix up issue type shorthands (88ad825f80cd8390631ea6a67db35a28d21d6a0c)
* Improve zod error message (208381009cf99a15c0b1fe3feecbc202cbe4d7a1)
* Correct mdxlint setup in package.json (#1337) (71a4d125a8450c7a9e4a5c78735bbb3c2aabdae1) - thanks @remcohaszing!
* (create-config): Fix regex for detecting packages in `pnpm-workspace.yaml` (#1342) (46e33d95f8390ca051ddc43f711724dfc2ac0e4e) - thanks @taro-28!
* Add missing dependency on remark-gfm (#1338) (e1462d3ca7fe65402d8eb7f9ed758129554cbdc0) - thanks @remcohaszing!
* feat(plugins): extend prisma plugin (#1339) (6dc700a1351c776342ca54b6968865ed3bc9fd43) - thanks @CHC383!
* Link to github org knip search results (2ee1f1b488150cbe848ecf2e4b4952997f43f0eb)
* Support --format in eslint plugin (resolves #1343) (4cb18bb21419194df751e54baaab069bfdd26219)
* mdxlint uses remark prefix (cdd21733e458693b9ca61c28289e804c26eeab48)
* Print relative path in trace renderer (379e798b7a8e950ae5fc0c609e433987d3189ab6)
* Allow to un-ignore wildcard ignored workspaces (b422f10229d953f4e480bdc51bbf51c531448d1e)
* Support URL constructor with `import.meta.url` (resolves #1310) (ffff5a625bfd7c3f8647cdf8f326907a5089f6dc)
* Refactor import props into modifiers (9a0ace7460cb58ab3aec632caacf1008e4cf1adc)
* Rename method (d922df43f501b42afd93de21641247b14d6807e3)
* Fix up `KnipConfig` that can be an (async) function (4310d2065bf5caab6641a7e6145d745c1a5eed3a)
* Verify only first word for valid binary (resolve #1345) (153ced021a66c3a8cff9e6c6ca1bd9ec66ce5e05)
* Add auto-fixable `catalog` issue type  (#1204) (063b647951d3f446f94639921a1ca276dc27017e)
* Refactor plugins to use `Plugin` type annotation (f1e8b8263656d2e7998fdeb7adf4c221312a0bbc)
* Update some dependencies (0339f499fae08abd2fc5f4d715b83d26d5d2daea)
* Lint & format (f606570c74b3195d7eca2160f4fc6ddc484a4784)

## Release 5.68.0

* Re-gen sponsorships chart + add link (b1ee77635954df6bd5328b65ad456c9ea1d95906)
* Add `ignoreMembers` to workspace schema (#1332) (4a4687ed402b4d74be8fcc8cd73816451de4a005) - thanks @Jiralite!
* Deduplication in schema (#1334) (311bc8016e6e3d1cb58ae60d3a7772e5425d1333) - thanks @Jiralite!
* chore: fix typo in FAQ documentation (#1333) (2d6cf70032ac39bb549be52301c35d9a7e2a0bae) - thanks @0xflotus!
* fix: 🐛 re-support `"astro:env/*"` imports (#1331) (b88336b12e41ad3c5b9ec91672cd6d8294f648a1) - thanks @jimmy-guzman!
* Support CSpell TS configurations (#1336) (10b5ddb11f985b4669d29fc20ca51dc25de5e85c) - thanks @azat-io!
* Move mdx formatting to mdxlint (0077f25278c3990103d78cb3da73e416dc2d8127)
* Format mdx (3a89d84eb38f7e84e5120cb3fe187ce9f4886927)
* Fix plugin specifier handling in remark plugin (469883e659a691af46baa8ce68c351c31635fe78)
* Add mdxlint plugin (5075a7b13b5e2c2b75cb17772f6d9f0f61ea2002)

## Release 5.67.1

* Restore integration test repo (7b4bd4198e8b3ecb300abdb5a53ce990e8b93313)
* Import default exports in tailwind compiler (resolve #1330) (4f3bd099fadedf59c40f130f1d5fa22da8b2b79c)

## Release 5.67.0

* docs: fix typo in writing a plugin section (#1327) (c27b46a1e8bc75f5bcdaf4f65f7e5e15cb18bcae) - thanks @nikolailehbrink!
* Fix create-plugin script (85f1af4eb1d8edf2cc7db45c4232062800b777e7)
* Remove obsolete rest prop (b43ec693b97e85be465fc6dfd8dab7d60ca10056)
* Don't show progress in test run (301d057e2cd56835fa2ac4808ccf94fccd9e7528)
* Fix up docs (5afc522d2acf3b8b14d9f7cb49384c750bdab655)
* Add svelte compiler example to docs (0fcdebe07f219cbaeb93467241f3ac971bca225d)
* Fix weird sentence (19067d92295e0d4f4e3914277ca9d0a524a9639f)
* feat(astro-db): add astro-db plugin with configuration and tests (7812e90ef3a55d261a11bdde5bebdd44dc7c2d66) - thanks @nikolailehbrink!
* Edit docs (cda13eb4e7ab18ee1bc9068155e8b4d2496624bc)
* Add --max-show-issues argument (#1329) (caa2fede63be72197c571d00b99dd5d6e955152e)
* Improve config hints (7a5349f03cf5ba05bd3954e52b8d00c62bb3d70e)
* Add knip.json in create pkg (#1329) (8a30a26e1db77593ef54cfb6baa2c88602442efa)
* Fix a bit of formatting (29b50d4794101610b3201b7c6850bf0f278cfaca)
* Support node v18 (32d607385cdee8a9002df547682c6517021b9e2f)
* Release @knip/create-config 1.0.7 (0a4089cb82ac240fbe5d5471d93f6356d972bf90)
* Add tailwind css compiler (c88d4d1e6fee18d032405d9c4e1b336ec56c0946)

## Release 5.66.4

* Add experimental nextjs conventions support (#1322) (b7acf1fc7038f31797f82ec55a007cb73e9af08c) - thanks @vinnymac!
* Fix one character getting removed too much when fixing unused exported type (#1324) (935cf5d21d75ab19fd4783efe536a14a27bd9d6b) - thanks @ulrichstark!
* Set --fix if --fix-types or --allow-remove-files is set (close #1325) (d4b56e721c59f80c30ccd74c76f45cdeb9361dfa)
* Update sponsors page (87c388047fde4e81ea39c3b8bbada61e51f8da7c)
* Re-gen plugins list (a7d1ece38157ed7c1b177e0bf1ad3fed0fe63c37)
* Update oxc-resolver (close #1316) (3eaad532be46d12c46ea6b80352216e4e355ec4e)

## Release 5.66.3

* feat(next): add proxy to entry file pattern (#1318) (c730727babd1321c5c1037178651113360ed38bc) - thanks @filipweilid!
* Add new vitest built-in reporters (#1320) (3bfdc80de8fe4e8a2d74ab99669c011e4cce2162) - thanks @ocavue!
* Fix unwanted duplicates reports if disabled (8012b548fe344540d6db1b5a9e7bfe24b9f0e411)
* Fix bug in import map updater (90fc72e44d02c3b0919dd8ac60ec67fd8ab38fe0)
* Increase precision for named import pos (4eb6dd3636bd2fc2df473ae960c8c37f930099a1)
* Turn off rule if that issue type is disabled (4bc66d87396cea4dc079163b06bef9c4415cea21)
* Move types (b7cf6aa0d2458e948b2066f726f49022d2683c50)
* Get text of element.name (resolves #1315) (c39e7757c0e87d98a0601a202fecff8bd0e0384f)

## Release 5.66.2

* Fix negated patterns from package.json#exports (related to #1308) (2464f3704a11b0c6d1f71a1850f4fa928e6c623f)
* Entries in rsbuild config are production entries (resolves #1309) (9eebc5574aa964f12a91f9bc8bb415f79c35aeed)
* Add label for entry paths from package.json (42370b27eff932c25d2abfabb5313b20a65fbed5)

## Release 5.66.1

* Revive some tests in Node (20690d196775e8391dd50ae23398e57e8bd74267)
* Fix up `SymbolType` and reuse `SYMBOL_TYPE` (resolves #1306) (d7c1c8313c751419588c0bec3e5e3b1f7e636ba0)
* Minor refactor (3143c4e40303f1a1001035a04c41da14ccdb42f6)
* Make `defineNuxtConfig` writable and deletable (resolves #1307) (c31a77f923452b4df88fe9a2bb9914ee400afbfd)
* Fix up progress flag (c761a9d3647be2f7910c6992377695582e6a2d1e)
* Clear screen in watch mode (fb3ff4e9d7e6a466312d290f01ff68adc70e4276)
* Refactor watch mode (661440e8c822894e889524d5df5e0f9220c1c8be)
* Re-play previously unretained issues in watch mode (9b96730aaa35bcfa13c210c1fba6485595918d03)
* Format & lint (7776ae839f85c6d454894f019c79c3a0bfca2a3d)

## Release 5.66.0

* Add coverage for `ignoreFiles` feat (87ca476cdc1ebcc7637e2ff17a88e4fd7dfe790d)
* update eleventy API to add addBundle() fix (#1300) (ed2acecbdbcf3eece05c4e5777ac5bb4f3620e06) - thanks @hoardinghopes!
* feat: add danger plugin (#1302) (d9e969da0eefce9c7e0060eb352aef8250f2004e) - thanks @what1s1ove!
* feat: add support for ignoring specific issue types per file pattern (#1303) (673893ac5cc1342ec85ca468ffeaff6ac239239c) - thanks @rfalke-rtl!
* Speed up JSON load (83ca88f4c007402d3a0b2b479b81a292ca76af5b)
* Add JSON5 explainer to error (closes #1297) (cb926ca9eaec6b03b218ed76f06b690a13db2485)
* Add `ignoreIssues` to JSON Schema (90056915e49be7b36a03cb35ec563876110d16c9)
* Update docs (b4b89299399fa089ab85b8ea432b4cb753e11964)
* Oh, CI (b153f93143b54288afaee09d626b43d9d6803c44)
* Fix lint issues (0ccfda67af6190b8184ef6fe94036e79c9a06f1d)

## Release 5.65.0

* Release 5.64.3 (157ae943fa2a7b16321c1c6c5fff87ba9d6f3566)
* Oops (f7ce7d7a0fed6acd4d22d8825dc3de08bff5df15)
* Fix some typos in docs and code comments (#1299) (715d7cc75f4349547fba049839b4dca253acf57f) - thanks @jdufresne!
* Consider imported ns members referenced w/ spread (resolves #1298) (8b91d08a7ccb5eb25009a0f08c41b6b8a492b184)
* Fix up added glob ignore patterns and debug output (4a3025da22c42c7c48472ef1ba24865f749db6b1)
* Iterate on configuring-project-files.md (fac5613c53145421dc31d0b5bdc4f117eeb8544e)
* Add `ignoreFiles` config option (c9ab3c9db213ff2036245af254129943e96e111e)
* Work JSON Schema (bfe7a0ea78a2024d4eae760be8751e4b811b22a9)
* Fix up lint-staged plugin (resolves #1293) (b39832dcd37de57c584f12e5f038215e5e82bb4d)
* Speed up `strip-json-comments` a tad (7172653aff27e53d9d87ee10d684c9738ce82e0b)
* 4 ain't 5 (9b3981be670917a55ba380f8dd92b3f08a9ed85d)
* Add .npmrc to .gitignore (2d261f537da23aec98d731da83a09c99fbe86dbc)

## Release 5.64.3

* Add support for json5 files (#1290) (5dd115f29d073916c3f612334758197a94c18621) - thanks @rfalke-rtl!
* Skip comments in .lintstagedrc.json files using a heuristic (#1291) (83b02bb6bd9122fa178dac8fbe1260a9bf0baf40) - thanks @rfalke-rtl!
* Fix --trace and add test (cf0556e0de35522229a8a1d7aa9ea35a78007a8f)
* Fix sponsor color in svg (3db7eb730138dc99c0d7426f91a6c541f8b3eb17)
* Upgrade pnpm (0531075156f0e6d0ba1a908c70078e07395eb249)
* Add fallback webpack entry if context is set (resolves #1296) (c6845c72cd185dcdb302a5ec180b248795d037c9)

## Release 5.64.2

* refactor: use `toC12config` for `bump` plugin (#1280) (dbdd98bd28a623eb8a6e33330a171f5b9b4c181b) - thanks @nyarthan!
* chore: specifiy `packageManager` field for corepack users (#1281) (7c70d9f9926a002468285d4493ef05ff747d0b7e) - thanks @nyarthan!
* Fix config hints in production mode (resolves #1279) (7abdc6909aef50ff542905cdb5de6c89a2db4e9c)
* Refactor config hints a bit for perf tweak (d7e78663c3c4e28ec4f249c44cde6062f7b06410)
* Bump a few deps for docs (665f38a98318a8a305ad51d7fe10553f806a4fd7)
* Re-gen sponsorships chart (461edb48f7f4d5e29a83088a11024fd016422280)
* Fix lint issue (4c72030d1896329459679a495c4cd265413de376)
* Stick with bun 1.2.22+6bafe2602 (7ee634af03f0737c276b3c6b9a40e46c10087ac5)
* Fix config hints (e687287e45d8b9b77a52f73485b71494dcbf804f)
* Update projects component (edb7367a265a8b1595b7ce1e7fc4fdf794faf749)
* feat: detect vitest ui mode (#1284) (b6ac28c950a94c04bf4117a598b05cdbfd297154) - thanks @nyarthan!
* Fix ESLint config error (#1286) (3efb8a309bf1d0ca76d14e1ef664b8216c71aafb) - thanks @dnicolson!
* fix: Mark nested Next.js sitemaps as entrypoints (#1287) (dde7a80e1015a615bb6c0b0ae3a9cef3004694b5) - thanks @hugotiger!

## Release 5.64.1

* Edit docs (634b59d07353bc09db762ee1b672df06da66da59)
* Edit docs (d3433f00840736e11cc5c845babffe415ecad1fe)
* Add "How to keep package.json under control" article (570f40b15007c075d7f1e4d77bd2970034eec8ec)
* We're incompatible with typescript v7 (f4f9166a0fca265e6f0dc939528836ce7003938f)
* Migrate from bun → pnpm (f18428c53d5bff7bad5259bf053e1d8c2b78881f)
* Migrate from biome v1 → v2 (7ae5d72dadba0d8084842765ba3c045ac9199aa5)
* Update dependencies (3174456e0c0f3086cc52d41cbea647b5a50cc057)
* Re-gen plugins list (2da7ba49e8930c68b3cf8d1421a88cf975af9800)
* Migrate from zod v3 → v4 (a71c1030be3ee6b7312fdb952504a3f1dbe5a694)

## Release 5.64.0

* Fix formatting (900068149a5612cb6d084d46a3ff31b94c49b284)
* Add `env-cmd` Support (#1254) (21d6b5183ad10b3296cdb9c8f21a8f2d01bb36e9) - thanks @joealden!
* Re-gen sponsorships chart (185c6389226216548c5691acbac38dda3bf07dfd)
* fix: handle only string modules in dependency resolution (#1263) (a54021b6e5904fe6a6e87614728b841fe6931858) - thanks @wattanx!
* fix: bun ci (#1267) (3d1c3c5b91f440ade9f1069dd41f402e50645c6c) - thanks @Zamiell!
* Filter out invalid binaries (resolves #1264) (6f306111e4571418546da2aaf40d9b533940dd28)
* Work types for good ol' ts 5.0.4 (9913ee755014285036a12ceed65371eb47a321eb)
* Add @Datadog-OSS sponsor (a61d9fef9b3ea9c163c6408b1b38495417aeb1da)
* feat: GitHub actions reporter (#1231) (0a234504fd626f9f0a59aa377301fa46639539c1) - thanks @cylewaitforit!
* Add pos to unlisted deps issue type (5b54dae614d1b0719046405241d80e390ab9f4ba)
* Improve import specifier sanitizer (resolves #1257) (087a98e028994d3e19bfcfd88b7b6231855de781)
* Cover more cases for symbol refs finder (resolves #1273) (3d76e51e59eceeb528ef6e20ca5e3a1bfff2a841)
* Fix package name of rslib enabler (#1272) (432bdccb9aa3c8c7d8c0114f6614a651d959e56d) - thanks @nyarthan!
* Pass parsed CLI args to config-as-a-function (b0814c9d454ccd060aeda693398d1707ef678fc4)
* Ignore !-suffixed deps/bins only in production mode (resolves #1253) (06d4df84e7fe2735fce8bc1b1b12e78016e38ebb)
* Update docs (0d8fd135b46855f6d606783e6c256cceeccf9acf)
* Auto-format (f54a7bd2cd74354f51fb46ae978b3e5db8759fd7)
* Find accessed identifiers for dynamic imports (resolves #1155, resolves #1230) (ec0be7e3b222da5b6ddb34baad9d2591f0f479cb)
* Update oxc-resolver and a few more (dev) deps (96c822a40855c21152f81a1599458850b4f6c2dc)
* Optimize `getAccessedIdentifiers` (8fb95019030533909c970bdb204b4779c19eaf5d)
* fix: enable pnpm plugin on root config & lockfile (#1275) (6e339cadc079b0e144c2036134154c696e8b31c0) - thanks @nyarthan!
* Remove ancient past sponsors (e9e6e911d87cf550df87647f5a9b949d32faa27f)
* Remove default `binaries` values in plugins (aac28c491ead836231e7487a8ebea056d0cf16cc)
* Remove default `containingFilePath` value in angular plugin (92089275df7752a830c171d8d1d4cb39b0a83565)
* Add `isRootOnly` to pnpm plugin (fe99f594ac79c2bb3590091651300062b690a12b)
* Move/extend docs to write plugin (497bddb5479a53d59baaa078225343a621eaa317)
* feat: add `time` & `unzip` to ignored binaries (#1276) (4f8d9df599ffaba171e2535ffe61153f4ce1089a) - thanks @nyarthan!
* Add `Rstest` Plugin (#1277) (5b7d92f101153294708a3d1afe8d2c4d61595116) - thanks @nyarthan!
* Edit docs (847ccf168776f2cb6c9b5108a208ea8eae12799f)
* feat: add plugin for `bumpp` (#1278) (136a14bc4ff4138389a831afc62f5406f66223a5) - thanks @nyarthan!
* Support input resolver from args in plugins (resolve #1274) (19dd367764fa078fb9c93bb0a715492ff0581098)
* Edit docs (77d683e2b75b44c7fd5fc47b59621398b86028ea)

## Release 5.63.1

* Fix `rsbuild` Plugin (#1227) (e91eea3382059ad4067ace6079e856b2268d9f94) - thanks @joealden!
* Binaries don't contain colons (closes #1234) (1d060ac1043ccf211380682962c4c668758740ed)
* Refactor options all over the place (982d3272e46609f06ca858605d802a75726500d1)
* feat: detect nuxt modules as dependencies (#1241) (f2072e6aecd81a2082dc60f440d1e48ab583e480) - thanks @danielamaia!
* Add missing pnpm commands (#1236) (a4eb20b8777f436250fa523989b2ab234c9553b4) - thanks @kretajak!
* Hire me (165c9ea5cb2f5a0d039fcb2e5a1ce2fabaf62f79)
* feat: pnpm plugin (#1219) (e81eac311abb880188bc11e5dc988a429be4f98e) - thanks @lishaduck!
* Bump zod a bit (8b338a25c5a6c323bc686557b3dbcf707ae271e2)
* Update `rsbuild` Plugin to Check Environments (#1246) (c7366b5d620fc678b53777d1e0d4dca99803134c) - thanks @joealden!

## Release 5.63.0

* Don't default-export `null` (should fix CI) (cacf1198a489e771a07ee1ac74b5c3e625ee0f1e)
* Always remove ignored issues (#1184) (8deecde9b5f713a37d4609d81a60d9f036934d0b) - thanks @wereHamster!
* Add option to ignore class member implementations (#1174) (e132ab595b73bb840630d926a8a80ed9d4e46123) - thanks @Desuuuu!
* Update configuration.md (#1195) (15d05e2a1eb0985e2270b437b7b13a553534b4b5) - thanks @Swimburger!
* Astro: don't interpret files and folders beginning with underscores as entrypoints (#1187) (efac577948ae8759fb20920991db77e6de6a4367) - thanks @Ivo-Evans!
* Edit docs: enhanced-resolve → oxc-resolver (fdaa2d09b246523253a96eec84ac10d28fbebfbb)
* Add support for negated `ignoreWorkspaces` (resolves #1191) (592bd7358d669fd01fea249e240e89d576a906bd)
* Update dependencies (63dacd5aeec18edc749eef0c50e5e28444be6fa7)
* Fix up formatly report handling (5d4d166be904437c17e2f6c1ec560a08c1ab5358)
* Replace type-fest with two basic type defs (99ef1e47499620179e828ecfea64f57256b3749a)
* docs: only add TSDoc for configuration (#1161) (377bf73cae916624a42fcc44636f775e19d6da5c) - thanks @cylewaitforit!
* Prioritize renamed re-exports (resolves #1196) (0e21c3b4c18808d38d82f6ccda011c8f7425918a)
* Re-gen sponsorships chart (bda00d06a26f1c502c10c130f2b1e26923bba8d8)
* Format (0de887b69ac79599976f1362b1dc0dd03b528f03)
* Bump Node.js 20 → 24 in ecosystem integration tests (5b7b1cef323c003b9894a440abf1855c522cd37a)
* Too many times "If this is a Svelte or Vue component.." (f71c91940b33422a962b0d27b629b8a9e47f4178)
* Bail out early in lefthook plugin in production mode (50999c8e42884f2b7271ad2d8e9b13144cf1157a)
* Add tsc commands, gitignore file, node version to repro templates (close #1197) (44faf38ee684d5a80cbb88046513bd2c8b415602)
* Consistent namespaced issue storage (15ee3fe19557877b7c6185234360911aa8966046)
* Bump engines.node for dev/docs (3237a4700bc9da9802145361756dfc93852f7ea7)
* Edit docs (78cab1c763537932796e97eaf2b835ddddeb7063)
* Add `globalSetup` and `globalTeardown` to playwright plugin (closes #1202) (1e112d857ea98011667e98150092caa15e05c50b)
* Don't show success message for config errors (resolves #1200) (7dfd8361875806f4d11b085a15bdff3f03c8e14b)
* Consider subpath import dependencies as referenced (resolves #1198) (05767f1e54d4968535a42c05d83bc2c3dca0f0ee)
* Add support for binaries with all positionals as scripts (resolves #1183) (feb0f1b55ce43b23d94bfeae170d117b7aac3638)
* Edit debug output label + test title (28ac5acd5a451340a1f88cb4c9fb24149cf693a1)
* Fix `isConsiderReferencedNS` for `TypeQuery` nodes (resolves #1211) (bf29535b12acde62ca3ae1f489a123619e5b1a7d)
* Binaries don't contain asterisks (e.g. script name wildcard) (1ddb0966eef7babb29d3ecc040cebf7d84e854b2)
* Rspack plugin: add mts and cts file extension support (#1207) (abdd3aeefabb23eccc9bacd75dbf75acec43e08a) - thanks @newswim!
* [react-router] mark routes and entries as production entries (#1188) (8d96f3e64c5cc0ce02bc5f631a2417c728412ec8) - thanks @rossipedia!
* Minor refactor (cfa693f5168e737a283111d7e762728308edc6ab)
* Simplify monorepro template (67184d431c263b33804b5d6e60c226a8f2db596b)
* Remove links to discord server (4550d3d343548f6541486786dd6f9a453eeb689a)
* Update issue templates (875e7f55d752d246703d7fd536a6363fe00a230b)
* Add plugins + compiler matcher and a tailwind test (#1176) (ffd4187fc18ade93bf184d71eec2a2d216e65157)
* Clean up plugin template (1d3b8465eb5bed6d092c62e5da0788e3b37b8c3b)
* Add rslib plugin (placeholder) (resolve #870) (7e12ea7119ed0101ae2fdd7f4e0cb9e13ceaf2d0)
* Fix up rsbuild plugin (resolve #1141) (69decdab1cbbadc40632f9983248390ef23a14ab)
* Edit docs (3aa2074f5954cd23269324b607076d82a49dbe0c)
* Partition negated glob patterns into fast-glob ignore option (520caecccf9af5b23ddb199a4b6d2fb2867f4b70)
* Add test for export pattern with --include-libs (close #1199) (938b906a52df337b28bfcfe4cb9e95db8b8d469f)
* feat: node-modules-inspector plugin (#1215) (439afa6b16b8525276a8ff3b80ba318cedb86450) - thanks @lishaduck!
* rm polar (0cd0aa965e15570589691673a25a9e4bc3feea23)
* Add "Relative paths across workspaces" (close #1214) (1396eec083ea54001aa227443eec2f90d64066f9)
* Add package-entry config hint (resolve #1159) (4f4eefbcd04b1ccccee306c2a9c309a147a37c0e)
* Fix issue with git ignore pattern conversion (96713195ec35c7a88c2cf2cc53756da1ccc29e32)
* Update PR template (3905e90ca270b4cedbbcf0805ab34fff09923d03)
* Knip it before you ship it (ad30f8208dd19333d90ea532a02165c6d730cbea)
* fix: resolve reporter and preprocessor absolute paths properly (#1216) (eefd4cf201d00575de48341de2ecbcfc9b957c66) - thanks @scandar!
* Add Knip article (19aa7bae02e6a1efcaa395c68725a8a191b41c86)
* Fix #1224 (#1225) (e789b1b5478b143e037c70cb837e22cc20641c9d) - thanks @VanTanev!
* Fix related-tooling.md link (#1223) (cf8706898a766f3980469af3c5e847d197cd4347) - thanks @raulrpearson!
* Fix lint issues (975a1bb2ca35e06704e2e4aaf332bc7237542559)
* Update linter config (98999c9caf9c9fa936558a65295cd03a3f25fb48)
* Improve table cell width calc (45d0600dd54ea23ae80f6a3927ccd9b224631323)
* Tune config hints output (3a909ca75cc192d410beb633e0ffca9fcecc76ff)
* Update oxc-resolver & astro (5ffb87e79c12c8371c18c1cff3cf2e063cc460ec)

## Release 5.62.0

* Support `.ts` extension in `toLilconfig`utility for default TS configs (#1157) (cbfb9c3b1c6fd4f77b5e5f0987e0f027ee609feb) - thanks @what1s1ove!
* Update reporters to have the correct name for the default reporter (#1165) (bf811460b57a5c6ce1773dae3956edf62f50ce81) - thanks @gavinhenderson!
* Add `audit` as a valid command for bun (#1168) (014cbaac78e1ccd09830b7e5bbe8389035f82880) - thanks @carlosedp!
* Fix Angular plugin to allow for @angular/build (#1175) (0754130ed26cb4cba6a15bcc708836e1218a4aae) - thanks @davidlj95!
* Correctly detect used/unused namespace exports that begin with double underscores (#1180) (259a2f693be762cb3459a7756ee8fad20075c5e3) - thanks @akallem!
* Rename tsconfig-loader.ts → load-tsconfig.ts (61280b0ef37161b889959062dbbd750783c8e7a2)
* Support absolute path for config argument (b6066816cc1950515af8c76f956e06d23b4e6784)
* Fix formatting (ebc9202f7ae303edafd01921d26b11c871f90ac7)
* Add bun.lock support in @knip/create-config (#1182) (da80ab33cccf611143e44d81eb78680e960cce33) - thanks @ShooTeX!
* Support new biome config extends definition  (#1177) (07439ef3af85dab40df7596f2c0ae5d392e16b3f) - thanks @Thomascogez!
* Support Vitest projects configuration for dynamic project discovery (#1171) (cd0ed32c66c310db835210fd50f579cb54641d23) - thanks @yyxi!
* Fix up ESLint flat config resolution (replace #1173) (021ecfff467ce6fa8d23fe3e046364807006cbcd)
* Reuse existing entry/production patterns in astro plugin (e65f7099facb55d28c305051c04f2fabfba58d07)
* Edit docs (10f8a4f3ec850624d91c87d0187a9326142af12d)

## Release 5.61.3

* docs: add config docs for compilers and treatConfigHintsAsErrors, move Plugins and Workspace to group level (#1152) (93375c826702645197279652d7f2b5184d9e3275) - thanks @cylewaitforit!
* Release 1.0.6 (46ca32343d39807fc7a89d6e25193ed294dc3c0d)
* Remove unnecessary await in test (6a7964d37ebb60fbd34147e8d948f9a2ef0bf82f)
* PackageJsonPeeker → PackagePeeker (f0087f883b8797f023a7418aeef86aacc9d9f3a3)
* Minor refactor/rename (457e8ff4e4e2a41401b63adb0d3c0dee821ace36)
* Fix absolute path in karma plugin (c40751b37292d014e0d774baef0e85ddeb0ed3a4)
* Update docs re. dev (cc555048f503815c792e276d39cbf2ad65229b26)
* Refactor post-processing of irregular imports/resolveds (#1156) (aaa1bd0121464012a050bce7cf8250724485b138)
* Add config file to cache (#1156) (0b49c69c0eec55671cb94efb021a2e3a0bee4db1)
* Don't overwrite cached config file inputs in same run (resolves #1156) (efe2d5d67c9374357a8137334dca90ac44fa2ef7)
* Consolidate file node post-processing in one place (843b69b7d387bf8683037eca03a12618df9fe28e)
* Add "Debug Node test" launch configs (5a76a6c5d77ea156c810e6bab89aaac0c3f9e5f1)

## Release 5.61.2

* Add .ts extension to babel config file pattern (a1bcdbb5ab7381552dedce20c7699e533ebe73b9)
* Refactor biome plugin a bit (20e5914a0c7149abebfcf5e0dee53d77688cecac)
* Add boolean flags to args definition in node plugin (49fe2370bc1dc205b7003ae93161a4e526e7aff4)
* Update integration test suite (6bd250afaf9daac6c784f9669ea6224063961dc3)
* Read only first bytes of yarn.lock (e2f0fbf728883c87d6e452b3e1d33eb16b42773d)
* Add error handler for `npm pkg set` (bfda6e956819cbe424cd8c51ea8a75272e94b78e)
* Enable eslint plugin config resolver for v9 without eslint-config-next (b334c3a868c50043edc46324c9540b178c02c873)
* In the aftermath of the previous commit, this had to be done (2de78bd5ec28fa962a34db87abc0889ca8bf7585)

## Release 5.61.1

* Add new sponsors @samdenty and @MidnightDesign! ❤️ (191bc9ed5f2515ae2beb2119976d75c98330f218)
* Add and clean up posts (d2b8786f69152d53d9549f281418438633fc5f32)
* Improve top-level config hint text (7d3119b110d102141fc5514e98ff44d5859dc639)
* Edit docs (60da8213d8009571973a38a7566b29ce74cffa0f)

## Release 5.61.0

* Update plugin test template (#1123) (101f4bc13e3a574ca1d0b180598590eeb015df04) - thanks @daivinhtran!
* feat: `biome` plugin (#1113) (7cc1a4325bacd93ae889204299ad38976ad25e6f) - thanks @daivinhtran!
* Restore formatting of fixture (b346903187cebf19fc0516d2ea46bd8dec7d4dfe)
* Recognize vue.config.mjs (#1128) (53c8e960b150786fc1e96d15339a5483e5d1647a) - thanks @davidsickmiller!
* Restructure biome configurations (#1125) (4b3b4dca8e84a214482078bd1919059e0ed73bfc) - thanks @daivinhtran!
* Reverted change in the react-router plugin on windows (#1130) (bbf67ddaee79f342108a99dbb2869a966ad578c8) - thanks @AlemTuzlak!
* Override base dir for `.git/info/exclude` (resolves #1129) (4aa35f4aa03bd657d6f5a533e1f90cc8f51c796c)
* Don't transcend .git dir to find gitignore files (#531) (a2cf84bc41458e95d8f787755247633fb9f53557)

## Release 5.60.2

* Add .ts extensions to Node test runner entries (#1121) (7a06a2084124850fe9ef7dd6d84f8164dcd26e28) - thanks @MidnightDesign!
* Print top-level config hints first (d04a8de0bd4d8d0994b8812e548796f5c5414dd1)

## Release 5.60.1

* Update sponsorships data (bd18e06deafd432dd9b9f583312f048944876296)
* Fix Eleventy plugin error with certain configuration file formats (#1112) (19f918185e27bdfb3dca45d9a4e7b340842edf36) - thanks @aarongoldenthal!
* Add new methods to the dummy eleventy config class (607594a456741e926ddc679ae501ff92088a645b)
* feat(storybook): add support for Storybook React Native v9 (#1118) (35630293882889d68023e165cc0b7b7ac0fe161b) - thanks @cylewaitforit!
* feat(storybook): add support for .storybook/vitest.setup.ts file (#1119) (5ca03f11d48651dd05cc8ff9ff3e4f0c823216c9) - thanks @cylewaitforit!

## Release 5.60.0

* Revisit dev guidelines (18842738a4acc06e11654a853c5247f0e8399d27)
* Remove unnecessary escapes from regexes (d0c3f822f10b1d90a0d0fa376a8fc3235011df5a)
* Add WebStorm run config (e6e9813c7ff369ed2c143be2d328bb35909ab2c6)
* Remove unneeded condition (311d5e7b3eb4babdd96d1c79abf3cf305ca518ab)
* Remove obsolete comment (ad999051d757a2b51b281eb80d7758f793350889)
* Turn ignored logic around (for config hints) (eb0d16bea84d4e1cd832a604ee43d323f3281f23)
* Add boolean flags to args definition in node plugin (5a42a143ed7a49ddd82308e2adc4b957477d262f)
* Regen plugin overview (5252f4baa7b0df6144f1c43704f873bdbe0debfb)
* Update dependencies (2506865ba2daaba53d75aa292c55e3060b96c39f)
* Add `entry` and `project` configuration hints (#1105) (58dcfa570778b903de77d6a860df02e149d4a2ec)

## Release 5.59.1

* Edit some docs re. handling binaries (closes #1107) (6ce390855a383e6548c30b20c156dceb5294d81d)
* Add "contributing" page (cd4f29379f2940b459adec676fd770c63fcb456c)
* Link to e18e.dev (384367838bd6329cec0642c7156d426f730b39b0)
* Ignore scripts with name not starting with word character (a240f0dbc5c3e8a955a97791734765ea0b51291d)
* Add `cargo` to global list of ignored binaries (0fcbe114c3a1ed141311927986358fa92f8ab2cd)
* Minor refactors (3b447b83dd17d6482821a7fc671fb6854b54c792)

## Release 5.59.0

* feat(astro-mdx): add compiler for @astrojs/mdx to treat layout value from mdx frontmatter as import (#1102) (4a8dd49716cdee13d325b68aafd00549387ba730) - thanks @cylewaitforit!
* Add `oxnode` to binaries with first positional arg entry (a6f243444b09bbae78779754c772245ad173fe06)
* Fix up stylelint plugin (0c3d054a3ea8c782b4158bab7ee3921eef971e0f)
* feat: `tsdown` plugin (#1109) (20dc8f14ee1f7644752c2a9f6b30e3a9309e6535) - thanks @TheAlexLichter!

## Release 5.58.1

* Mark sentry config files as production entrypoints (#1104) (7138e8f330875b2911a3cca9d437d25dfb2739f2) - thanks @camjackson!
* Standardize on fixture directory and package names (a9cbf1913a6c217dc1e3b4a1665d17602849873f)
* Fix dimmed `count` in reporter (ba392b0eeb6a1ad8508a5ae014c929a1fdc40491)
* Improve negated workspace pattern method (b63f83bb97b37e234ece6126d6d2b3c6ba24d461)
* Move `isDisableConfigHints` to clean up (aafda400003557c35d59321594f347e54dd64e6f)

## Release 5.58.0

* Add setup/teardown to plugins (to prepare env) (375bd427db7557ad74b3bd9b549ee5fea9d75902)
* Move nuxt init to setup function (closes #1097) (951240e1f48a13a7008c99c2456535b23cdb7fc3)
* feat(webpack): process resolveLoader.alias (#1100) (70ffa83bc59c4598b6d8bcaccd53bb8d47135352) - thanks @TkDodo!
* Add vite plugin to resolve file from `resolve.extension` (#1080) (a88d655c273441f28c7c0b62c118c8cea943d307) - thanks @clickCA!

## Release 5.57.2

* Remove `baseUrl` property from tsconfig (#1092) (b77c52475e2a73ebdeb4250cf79f09f54a6b43e4) - thanks @ItsNickBarry!
* Fix/add mocks as entries conditionally (jest + vitest) (7726d41a3795c89a0a7b291309e2b15ba3933aa7)
* Add custom MDX compiler example (#1098) (d746092154a2bea0efbf64dd522d8340e316514d)

## Release 5.57.1

* Add example known issue when loading config files (cc36b08c542c3f3e5b0c3d384ba84a027e1ab29c)
* Remove empty import (689993bb8862143a1d2cc446f7c484c9eb7c042f)
* Add `x` to --trace legend (dd91f3a954dc5afd789a87cdf6aa4d5f495b0a54)
* Improve sponsors script and add venz url (ecefd9efc8234e2125d3669253ec8e7153dacd20)
* resolve issue with plugin overlap on config files (#1096) (c54603e08b723ee57f58de2261dd2d558bd53532) - thanks @apeloquin-agilysys!
* Add fixture to cover prevention of circular dependencies in config files (0b63a01c88dea503b82b70d3d7fbbe0bf9375fe5)
* Update docs dependencies (54f96af1dd8958fee6baf20a892f1ba8f1f96af4)
* A bit of tests/fixtures housekeeping (866793cfc041289b214baa8b9fd6467f5d5172b4)

## Release 5.57.0

* Don't show mem usage twice with `--memory-realtime` (b91f5ca740ce0b784da3a8bb1387ed7c9d569d12)
* Update docs (d26acbb93a57ff6896af88122a939b32ec5980eb)
* Add license section and attribute more explicitly (3b3c972a96868ac60f895b94168eef9611a0f7de)
* Update license files (88aa6edd92a98d4244c51ba73c39fac550340b4a)
* Revisit/remove ts-ignore tags (86de614ced61e0ca6f5491575e55818f36059855)
* Remove `toSorted` (introduced in Node.js v20) (df56a82e0bb8915a60cb5315652e1d325ff854cc)
* docs: remove rehype-autolink-headings and use Starlight heading anchor links. (#1076) (541c999e18d122231f840b2b57f3a81df6ed95d0) - thanks @cylewaitforit!
* Add Convex plugin (#1085) (fb74e8c136be4693d888156cd4c33d08ca92c051) - thanks @narthur!
* detect test files if `tsx --test` script is present (#1090) (46658b95337a4ff5d26a391a9ae1f5993981424d) - thanks @ItsNickBarry!
* Add Hardhat plugin (#1087) (eba5ebfd6985d7114720215f999af31158e89544) - thanks @ItsNickBarry!
* Fixes for Mocha plugin (#1089) (3424a5b7a5b7ed37e48950cf6349560acb5d179a) - thanks @apeloquin-agilysys!
* Add Changelogen and Changelogithub plugins (#1086) (a45a1d6253f189bad9af53c6e612ba7a8c4f9611) - thanks @azat-io!
* Add support for NX rich command structure (#1093) (123c5146108f23ad936df4e105ca2272e5b06596) - thanks @jotaRenan!

## Release 5.56.0

* Add explicit `process.exit(0)` (e52b129776f9e8dcf7ecc677378ccece95630739)
* Fix contributors link in README.md (#1077) (a28448b284d8d6d32d083f2127e5001c211f0980) - thanks @BreakBB!
* feat: add Docusaurus plugin (#1055) (ccb9a5f40994ed3163124602e9dec2a70f50ccc6) - thanks @cylewaitforit!
* Improve naming in --performance realm, add --performance-fn (677252b6ebd253eeca775c12035e629002803d14)
* Always timerify `resolveSync` (6d1d36476435529f77ecaf731cca01267d4649a0)
* Remove unused file (f71470e95f4a5a1600d5d5d2e875943f4c6669be)
* Fix reported unused files in watch mode (0f724189a7bcd0195f4b5386dffd2c8a2cbc193c)
* Add test files so they're picked up in watch mode (a287453dac6623ad060c06edc19284e1116b365a)
* Minor refactor/housekeeping (9d3da2e9f919810fd3376211c7bda99471ce4544)
* Refactor reporters and reuse `getTableForType` (9d976cd089f215cf8b6fb193a5348e9dfeb07102)
* Edit docs (91d3949888367cb01643e04e778aac00ae153478)
* Remove incorrect `create-plugin` script error message (3643374749225c5373e38fecca76c993d11684c7)
* Migrate enhanced-resolve to oxc-resolver (#1081) (fdfd859d218d74f3f92bd57bf21d65bf55d76c9c) - thanks @agneym!
* Flag `--memory-leak` implies `-no-progress` (8344a2e0883f421d0b652f12a37689f7871dd350)
* Fix up memory usage related logic/names (47984740d0d3b158cba5f17bf5b7038825506496)
* Update docs (2ef362142222b11d3a54b11724243c3e118c216b)
* Separate production mode cache (95023231f6d3175c2d033d5758edacc7ee4bab87)

## Release 5.55.1

* Update Node.js versions in CI (09a158b4fa6f9e0e7d72b62f99120d7d36be8714)
* Update plugin authoring guide (b9bf354852d908a410f9721053f0800e6ea393c6)
* Update sponsors info (2014ac094f995b82cac0e40b60a7710a577239d6)
* Leverage `isProduction` better in webpack config (779948d5fc31c8e3831c93db599f509a79edce77)
* Add smoke test command to dev guide (59b23cf86025f66af46ff9e5046e1cb2d43709bc)
* Consistent messages in `streamer.cast` (1b2866bb0b4d81a7892daff4f5e2ab0a890b5b97)
* Add `exports` to ignored binaries list (7073b6845f6b8da5e8db4d65b9964a1fd986d1a8)
* Edit docs (ffc3cacb85750dcdada2c477939d587e4364a514)
* Remove obsolete installed-check flag (61b65eb4ed9c0030e4890f1a9394cba017e35d58)
* Use minimum supported node version in CI (almost!) (7787123a8a9c46ccb48da26caad89e58392f7d58)

## Release 5.55.0

* Add quotes (e7b45464dd8b902044c9d06e74a2362e6b461493)
* Marvellous (9292e4a398c2555994e69f2053988014fd818c62)
* Accept `prefix` string in `toAlias` (59c9e89934b27e1b2678530884718578699c9313)
* Fix webpack ts issue (wut?) (bb62995d8c439428e7bc1eb65f79f446056f95a6)
* That's enough for today (5cde7d51599d897b1440ace2ebf23bc74bc69718)
* Support custom srcDir in Astro plugin (#1067) (49f85829b6e5a77b325cb82b4d5ee98327483a88) - thanks @azat-io!
* Add support for Babel plugins used in Vite/React config (#1075) (407e625878c23867478e62975a5b49c95f0f8147) - thanks @mbacalan!
* Narrow down package/workspace handling in `getReferencedInputsHandler` (ffa3ca9a4d22b6fe80c7e7f1dee8f38d8d1d2838)
* feat: add prisma plugin (#1073) (5b49bdea3fd5dde0a0df1c37a1202f81dd80cf6d) - thanks @nissy-dev!
* Improve truncated/padded table cells (6a05c41d820cfcbefad53b58fb5237153998d91a)
* feat(vitest): add __mocks__ to entry files (#1070) (200eaf840da390f4a5a987db2a4446bdfe385fed) - thanks @narthur!

## Release 5.54.1

* Fix add aliases crashing on obj (#1074) (1b9c8c9ea87c594805c0352e94eefe939a554158) - thanks @tancredi!
* Restore and fix Windows coverage in CI (61d09abee2d816354d79880da155ef026857a042)
* Format (9689d9ea52215422f4ac602ec0aeac6ab42985b7)

## Release 5.54.0

* (PostCSS plugin): Add postcss to used dependencies when using `@tailwindcss/postcss` plugin (#1069) (3d4800457dbdf51fdb87b13160e33454d0bd129f) - thanks @karmatys8!
* Support size-limit plugins usage (#1061) (e88d7f04594abff15f9c968c122c133d13bc1892) - thanks @azat-io!
* Add Formatly and --format flag to autofix mode (#1029) (268a30b57b2f88cdb14ab5a3cc02702fbfd228b1)
* Add/update articles (17f0b05a6c1b8a8e3ce616f79023858f743f427e)
* Minor refactor glob core (fd5ef3eb8d52b7f3925cd892e47c0173b2a3e05c)
* Merge `resolveEntryPaths` into `resolveConfig` (8c599b23367eecaf67d19a07e1ba11d2c870f282)
* Improve test titles (5c4df675d9cc18576ad8e0e15f87f2b6245d4dc8)
* Add name to console output (7ca3823f0437d87fdc4a230ef4256b0111e2ba50)
* Refactor `compilerOptions.paths` and add `alias` input (1bccd592a6cd4652c6dd755c276980332113fc8f)
* Housekeeping a few plugins after recent refactor (9e827763b321b95b7451e9aa804e9958ed2b82b4)
* Fix path alias `prefix` in Windows (22b546404dda26a71720cdc614e4a03d7e16e871)
* Update docs (c8b69703b70a81c233831e0a5a2eb097df1b0d38)

## Release 5.53.0

* Remove unused script (d6484de8af16d492f018c0958db70c99c851819e)
* Add --force and --graceful options to create-plugin script (063db24c2265ecb28c545b07109ff8d0cc05c3ad)
* Add SVGO plugin (#1065) (5d68767699206f179fac63a1dd9285be8e5b9dd4) - thanks @azat-io!
* Replace `pretty-ms` with `prettyMilliseconds` fn (d38389998f1f177095f6a4e73129406c73e59415)
* Add mem flags, observer & table to `Performance` (dabb874b88962ef29bccb5fa367423719eb07684)
* Fix --isolate-workspaces flag to gc principals (b75c87251e2d0913ce8a101cfcb6519013a78ca4)
* Fix and optimize git-ignore cache (c1c8e8c83aa44b54a3d472ece943df2506cd8810)

## Release 5.52.0

* Use default entries w/o config file (fixes #1063) (01a8e651a702165209dd6fa7a357ee3429fe6835)
* Fix negated glob pattern for ignored workspacea (28d9b4c982cf1748fd2927b0bed09671cccff600)
* Don't bail out early for --filter if also -r in pnpm resolver (48e49a7d0509e766323da35c21e4d60455774883)
* Replace `easy-table` with new `Table` (cd70e950333fdc03291393ef275dbf33e18a1bc3)

## Release 5.51.1

* Support Prettier TypeScript configs (#1059) (6717595018e84f2d4f3e552cbdd73f77d4544730) - thanks @azat-io!
* Expand astro.config.* and reuse in starlight plugin (859a16bfb46b4ccb7decbe9104faad38cc843ae2)
* Improve pnpm cmd resolver (844d7a8b04e401781c10f4ed81f676078d90daa5)
* Split and improve source map functions (ae89d67c22610d174c39d4db353104c1f5ff02b0)

## Release 5.51.0

* Add 'instrumentation-client' to next plugin entry points (#1035) (b739fccb4d37d3eabc2071060ab854239663a472) - thanks @matbour!
* Upgrade release-it (4ac189751ddcf1496a7ca9c1bd4aa8cda6747aa1)
* Handle `catch` prop access when returning named bindings (resolves #1039) (e94083597d6026d09f128ab1fb9b0e1b5fd0fc14)
* Housekeeping imports fixture (4fe4099f1ee24c58883e2388362a540fcb981127)
* Add treatConfigHintsAsErrors to config file options (resolves #1026) (cafff6e1c996d1d334183c0c31a4be666e97cc11)
* Refactor exec test helper + callsites (e8b642d628845951e995b61b1e0f1858ec0f98a7)
* Organize quick `test:smoke` runs (exclude cli & fs tests) (949fe5a0fdcfba40265375b373c50a4829dccf46)
* Add bun plugin (resolves #1038) (36e30f616ea78f74bb104cf4a2da8c062bd03c0e)
* Document `allowIncludeExports` and start using it a few plugins (resolves #1043) (755f689a1205e67f2ae32906ef027ed9256a85b0)
* Re-generate plugins.md (4f6f8fe910ebb6411ae175bab036661df92b014e)
* Split `bun test` cases between plugin and binary resolver (5d3673d7b4a3248599d64bff077216fe29580f30)
* Fix and skip a few test (to circumvent issues in Windows) (8f8e4c23bc19f818aaf766ebb8774e00992e9fe4)
* Add oxlint plugin (#1042) (0f8561545b9e2090f83a2ec921472e52dc3f025e) - thanks @PatrykWalach!
* feat: add nano-staged plugin (#1045) (a05726c00c2464f7dbd1d02a010ef266c90eaf46) - thanks @cylewaitforit!
* Migrate some odd astro pages to mdx content (04aa73a31152a5fdf5a39b68a61c398251666df9)
* Update favicon (736c05ec29c1b2abbb43b4e4a49867fdfa31b055)
* 100 (65dc8f971c7f173574130c7615f8dcce4899e315)
* Update astro/starlight (a9fba6fdc25c6f91d830d12f573cd97a85faef70)
* Refactor OG images (508fa39ff06d40b776f0d4238a21adb85c717587)
* refactor(lint-staged): remove unneeded default packageJsonPath value (#1049) (77dedbcd828ce18a6fed3d1b9ecb5ab17e2222fe) - thanks @cylewaitforit!
* Quickfix light theme colors (d2972599352674da629f6cd742a215314e0210d2)
* Concise and consistent description (f33684b792712c5ba35a70e00fd005d1020b0bc9)
* Add astro to integration suite and sort jobs a-z (c2afe4e466ea07fdf535dfcefcd799973cf7a68c)
* Add Astro to projects using knip (4661469bf53aea0282d633ea0dde06434820f140)
* Mark mdx-components as an entry file for Next.js (#1050) (3e7df189f4d488311ef1c9f617cf8ecf605cf522) - thanks @remcohaszing!
* Fix tanstack router function call without arguments (1b8acc7909166311a3261459a5ec277db7a9c267)
* Try remove `eslint | prettier | xo in config` check in enablers (03790bd08f0308b74f91d1efee2bf6df8decf12c)
* Update ecosystem pipeline (c95c303e03e5bfe96a59a0dc5bf6911a3c7a7c2d)
* Unleash biome on fixtures (94fa4eec4a78215b8d865452dca3107055003958)
* Fix order and add types in codeclimate specs (f1d48453ce48028cf9eb6c2aae4c991f4d0e15e8)
* Fix order in json reporter specs (b0a3b8697af94efd37119a37aa1fda3ddfb2885b)
* add relay plugin (#1047) (1e65c29e57b801b338d52af2e0ed77958d772b12) - thanks @PatrykWalach!
* Simplify git ignore cache and fix --dir ancestor case (b09eaff47e45f0e8827cf527b3822da5a33f3f45)
* Remove tanstack-router plugin (7dca60e41c42bc28e0b5b1a70e4694335aaf96c3)
* Work around bun test pattern issue (20823cfff6aa3b38eee6b41cd5722f5f5df8a3a0)
* Update docs (d3009bd368d61dc89f89f40a353b4524dcf08334)
* Exclude dir that doesn't contain tests (d4c73790ccedd2704cf436f92cd8f266e0ebb895)
* Allow to force-enable built-in sync compilers (b868c2e578e75c3eb437a48ee80c9465e39e126b)
* Refactor and simplify glob-core a bit (5c91dfa1ce53c4edae4177011e14f4f20eb2da79)
* Ignore imports inside tagged template literals (#1041) (1ff6db941421251aaea534bbf97babc316fe7872) - thanks @azat-io!
* Include members for default-exported enums/classes (beae106e18023a4eaf6939ea8b422748508c4eb6)
* Fix cache in glob, reuse `name` (82ca2980c21c12d3979906dfadbf641a48d1972e)
* Skip `runAsyncCompilers` if no async compilers (c418cf1e63065ffebda8537933371f5d3aca253a)
* Add compiler extensions to source mapper (cb2735d2fafec4835e691df2ce2aab9f0e26ea1e)

## Release 5.50.5

* Add jiti to "positionals" (resolves #1033) (08a4688543161e74c31fc3bba02b2ec9fbd144ac)
* Group some scripts tests (edf56e0d1a8459e348b06fb0221b1d8ba53a9abe)
* Fix starlight social config (cc51eaad5f07b41fbe0110487fced98b6f21fd8a)
* Support ignoreUnresolved from top-level and root ws config (resolves #1032) (852298bd8c0009ce33b0edc16499449414097f50)
* Update docs re. production mode (3b142b197be7bc0dfdabe87f010474cc08423ac1)

## Release 5.50.4

* Don't exclude (dist) files with js ext from being source mapped (b39ac44651f662cdd545d854011d107ab260baa2)
* Mark simple-git-hooks as used dependency when config exists (#1027) (78f8cf4d4949f4102fd010d419ce49bcd36eac64) - thanks @azat-io!
* Update docs dependencies (a8b44f6bf9dc47772826e288b6db28fe2f0f635f)

## Release 5.50.3

* Include empty named import declaration (d958e90dd279cfd98cf5b43cc7b1dd3e9011d0b6)
* Use pnpm workspaces over package.json workspaces (330e91857d89fa4a974c034be60b3fa71a638fdf)
* Update comment (e8fcd87d46282b196434f5a5b323513b1305ceed)
* Revert and improve fix for #1024 (3db59f715dcd3e2a6cbeb1360951e9237891d7ed)

## Release 5.50.2

* Add i18next-parser plugin (#1023) (6b6536b7a65b8c08a664f9cd85382529d7bb610c) - thanks @robinvdvleuten!
* Fix recursion in config file handling (resolves #1024) (1966c231deea753752e77cb205477fdaa739b3a1)

## Release 5.50.1

* Revert "Remove unused TS config options"

This reverts commit d1686e2f9aaff684e406b5681ca82c9bcf82fef7. (731fe7e9ba6478a50bc821a6d3bd80239e4efaf7)

## Release 5.50.0

* Add missing git-ignored files in fixture (bf4fd5bf36a79857cc2ee4883fa8c9400a50af57)
* feat: add create-typescript-app plugin (#1022) (0dfed33bd5f3a26eb559d14811ef14456cd42858) - thanks @JoshuaKGoldberg!
* Remove unused TS config options (d1686e2f9aaff684e406b5681ca82c9bcf82fef7)
* Add "source mapping" docs (3bdf5abd1a20a29999381d7ba67a643d4f81effd)
* Minor refactor json reporter types (58cc662cc84d91dd787f76158efc437cdf7fbc7e)

## Release 5.49.0

* Fix TS Router plugin name (d350725350a0f01a772abe63b782edce96a18efe)
* Remove a wrong "not" in handling-issues.mdx (#1021) (6132bf75b03afbe09d85da67681f9a1fb32db85c) - thanks @dyedwiper!
* Improve support for package.json#exports (closes #853) (3378d60dae98415833b9f098e3236c0127ca4591)
* Improve handling/skipping of exports in entry files (d4df7941e0ab7bcf2fba7446199ce226511cee15)
* Simplify `toSourcePath` a bit (5efde33c38098d48f9c25e5286e9a0bc03c6370e)
* Fix up `toEntry` callsites (898c18eecb9ad34af69ced49f4cbb4ce94eee4c7)

## Release 5.48.0

* Upgrade release-it (8017157023728046ac9292fda9ad9fc9deeec972)
* Use strict config validation (resolves #966) (74763372f598201dcd2eb132e2ef29c0764b7fad)
* fix: escape react-router route paths (#988) - thanks @rossipedia!
* Add support for resolveFromAST in plugins (#1005) (17a6f3c369c37b9609db3e3331bddcd29be3b3c9)
* Don't add entry files from nodemon positional arg (closes #1019) (e51ef342321be3fadbbc27eb9bfbd23a2b472105)
* Sync up @nodelib/fs.walk version with fast-glob (8cf2247aa8356c3a79e53d64b14eefc5e431dda3)
* Replace codeowners dependency with internal helpers + tests (c9c9211674d20ad230fe4fa0b2b8167f1067b17c)
* Replace summary dependency with internal helper (450a565505a3e97e73a0cae6c16d4d23d1846f32)
* Report unused re-exports (resolves #874) (6630e3953e8cb83179ffd5752d1868f167e1b767)
* Fix typos in test (aab0962b807762a08f6daed85aac7999813c3942)
* Improve SST plugin (ba917c3475abde215031a71945ab0bf6fbf92ede)

## Release 5.47.0

* Always consider husky inputs non-production (resolves #1017) (11139573b5616b0b01d20b1e6ddb7e583088db75)
* Housekeeping (cc20ce9dad9fdb5be1e4767a12adf2b497476572)
* Always consider lint-staged inputs non-production (#1017) (69f81eb8d8be64aa863fa72202a87d924f1fdc79)
* Add GitHub Action plugin (resolves #1018) (4ced243edee339cf1fcb95e8dba41da6e43ab6b0)
* Update ecosystem pipeline (f1c4015a4ba7e8bdb4c7d06c7f578df14bfd90fd)
* Fix up qa command (cea22e4dd379e18377666ff415cfd922b544d458)
* feat: handle vitest workspace configuration (#1003) (332360230fac21ba7912dbf532a8f9bd63bbca34) - thanks @codepunkt!
* Add pnpm version to pnpm commands (#1020) (0b2cef7ac2e91faca5672fe4cf313e99be42eee9) - thanks @thomasballinger!
* Update docs (50b10bdcae331c5094b5d32b68ce56cb2f32d6c8)
* Update dependencies (046b0fb4548fb38c03a024db900bf6132ec2681f)

## Release 5.46.5

* Revert 7ba16e1 and add fixtures (resolves #1015) (5464a4b6a0fdf4ab42faac38da1825848f6c467d)
* Topologically sort workspaces (#1015) (e5ca159a13a27dca29b59694edd4d4d7ba6d8101)
* Move root workspace to start and improve sorterer (#1015) (990f292fb19e406882ca32ef838e5dfbb964f91d)
* No longer need to force-install in eslint repo (93ec53fa4cbc063259b9ee0d2fe85b17a3cdef91)
* Fix `getAvailableWorkspaceNames` (6ec22268d336c629f40cf3ca72673af637afb033)
* Let's go safe here (eb68ec02c3161f64ecd92d82e88a2d136cf0f029)
* Update sponsorships chart (8d22178b6eccb6f58ddbdb3e31643958752dc205)
* Add patterns to exclude descendant workspaces for expensive globs (bab315bc89d469e3ae6acf9c841c533ef3117241)

## Release 5.46.4

* fix: Fix the issue where the built-in Vue compiler only supports <scr… (#997)
* Update dependencies (16667d14e3c23206075529c9ec2c9eb324170690)

## Release 5.46.3

* Add support for `webpack.ProvidePlugin` (resolves #840) (6a6954386b33ee8a2919005230a4bc094e11bc03)
* Add `cache` to pnpm commands (resolves #1010) (5f2efd457d94d5d4baccd1075f17467096a97795)
* Don't reuse principals with `rootDir` set (resolves #1007) (7ba16e1dadeeaeb3ee59e9e41b95f0c60f02c856)

## Release 5.46.2

* npm pkg fix (52e2f1f0906bfd34a189b8c7f0ab7939d0938356)
* Upgrade release-it (80281f72d2349802ced7d774799dbcdd0223a588)
* Make server.js production entry in node plugin (89f59f1b1cf9389fcb4aae1e64a33c1449d6ca6e)
* Make entry points coming from plugins optional in production mode (resolves #1000) (f26f95fb3c1640bd9daf83ea136b8e37d5c63824)

## Release 5.46.1

* Migrate Bun lockfile (cd8ffbb865909d85112d23d2dbb4e1fb14a7f04f)
* Format docs (76d476080bc4bcab09b0230c14d1cbc24ffa322b)
* Temporarily use --legacy-peer-deps (for release-it@next) (11344c3635f53d25232e53bd9de0e2ae73e97405)
* Update dependencies (9d4f456937ab2e6fd30c6ec7c5c1f199389b00cb)
* Restore repo.url (release-it wasn't too fond of it yet) (670ed1762484c543e851e1a688b93e7923f8bd4a)
* Fix up a few deprecated Astro thingies (3f266275eed1c3e7e17fdae3603c0230af068754)
* Just build the docs please (93c724a76ac5dfa8a96440057b59883f5668ec7d)
* Pin @types/bun@1.2.4 (97a7465dadaa328c31fd957bc5024087bca1dc06)
* Allow for windows cmd commands (#992) (b0dbfe42e9cc23e9fe4ec8727f419d0ce2489432) - thanks @Its4Nik!
* Report type of referenced default-exported symbol (6f7e0c5ed6ad9cbc864c9995750757a817ea8358)
* Update docs (1e194ab2032b9fd4e0df6fe4efe1d2bfa697cfbd)
* Add fixture for implements in class members (186f57f95d14828923a91cfea10a0f340e7c5f52)
* Add `isTypeOnly` to namespace import (#995) (af19fa5c948a5ff2715e8bcf00d53bf21df2eff8)
* Use codeclimate-types (#995) (c50e19a6c1fc327094b89e47b924c8824269579f) - thanks @remcohaszing!
* Add options with `dir` to more input types (resolves #998) (e43f88dd84ec67de55c6e3f88f2bdffce3d2a9c8)
* Configure MDX IntelliSense (#1001) (82b4aa174333df4c112f4a804ba77d81832addad) - thanks @remcohaszing!
* Avoid position to calculate CodeClimate fingerprint (#1002) (c7cc3824813646f8824a92081082f95ec3a086a2) - thanks @remcohaszing!
* fix: Fix custom stylelint plugin causes knip crash (#1004) (4b952cdd7f70bb1fd9827f1cd6b4e9e03aa07ced) - thanks @tbashiyy!
* Fix slug in og image (c97bf7cb881bbb9f4b8b04239ccdd91fd5cf4119)
* Upgrade docs deps (85d4967961a5a759c9c51be2c7580cdcdc13724e)
* Add npm link to docs (168a4ac62ffa696829622324effdd0db36d0fcea)
* Add extensions to entries in nuxt plugin (resolves #980) (697a326fa398a67d874e56e26f917e107c082323)
* Add references to dynamic config (close #926) (91eb9ad498c6c172c9d3c8102a883d84a2c8644f)
* Add issue type to description (close #986) (0a54fc3adf78cb836203c0bd150c42057396ec51)

## Release 5.46.0

* support .mts files in storybook config and project (#962) (8edeaeac9c7e9001b2ff43e4f4c4b096234c2184) - thanks @jjoselv!
* Add timeout to bun launch config, remove unused attr (2e1c627ba24167f1da225079c738d4e1a6e88328)
* Add "the state of knip" to blog (273b70404ffaf7aa65a50c18cd0b075cd5725026)
* Update sponsorships monthly overview (f35b5c280088d7b5d93f970e42a7f0aaa9b07005)
* Link latest article from home (0a2fb85be5bd8d939863e4879f6ec6eb38b1dd9e)
* Edit latest article to clarify loading config file (b96f7a5f50c7b30c916a239e1a2d8f6303730bc6)
* Use svg logos for projects using Knip (df1ca89133fef20ef70686140ce84a4256fb8baa)
* Formatting (8405908e0796674b63344c3479aed419310743e4)
* Homepage edits (7faf05e93608f0399bd50cbc3dad0a032a5399af)
* Add shopify, fix up sponsors in light theme (b8b6d6b9fc6de984cc16702e312c07b23be09e74)
* Fix path to plugin schema (fixes #972) (7e22547039df179a47335c4be25736acf0e5ad33)
* fix(create-config): updated script for latest Yarn version (#969) (2419174b9ffac136a837b872eb3058e109b95104) - thanks @GauBen!
* Release @knip/create-config 1.0.5 (15c40461e071b39c6c958a30ff6486d834bded61)
* Update docs (903d3a464e1f34683527d182201d20e0c06ad9e5)
* Some minor housekeeping (e081df6f9df6ae3012d6aa047f882ff14e05ca57)
* Document TypeScript path aliases → dependencies (close #961, close #977) (c5f7f2c46a18982961c35861ff292f870b666b6f)
* Bail out early without a command in Yarn resolver (resolves #979) (d6a8c3b678cfecf59ff46f7c928ef5ed82df482e)
* Make _files issue type consistent with the other types (171c86a392bb4f0046e7e9e71a9f311fbc8ce309)
* Support tags from configuration file (resolves #881) (8e97007ca1c9045180a06dc568891aaa91d83288)
* Update reporters list in cli help output (4bf863a8855cb44752a93a8cdc568735e31feb59)
* Add --treat-config-hints-as-errors to exit with code 1 (resolves #891) (54834256ab7ed293ccf26068cdbcab431f35d4e3)
* feat: add Gitlab Code Quality Reporter (#970) (9cbb6b6a7224e59e397fba77ed04a4f8116f085e) - thanks @atheck!
* Fix `bun run [entry]` (resolves #982) (46af78a0cd38c5a3e8fca856fb19881a67966ebe)
* Add `dir` to bun resolver, but ignore `bun run --cwd [dir]` (69880ea92b3423eeae167a092fd7dbf929c8cc1d)
* Fix wibbly-wobbly doubly unused file cell in default reporter (25d42800d80eb6cecc2392f9751436c337654317)
* Find flow nodes recursively (resolves #984) (f4d98f0de76226e27fe4dbea93d2be317bd55fdd)
* Run `npm pkg fix` (5c39e92f33f4a5fe2bf0434e08b9f7dc4a10f8f9)
* Use release-it@next (0e539ce5970184dfcbc298aa0f3bedf5958a9c42)

## Release 5.45.0

* What are we without badges? (8175043e9d2ef8b955f37533ed61da2fb2bef0fb)
* feat(plugin-eslint): support eslint.config.ts files (#956) (474dca3c141c7d527ef30b404b01bab09066af35) - thanks @cylewaitforit!
* Improve cross-workspace config file handling (4717edf933d512bf13b3a5ae5fb3a0baae22f552)
* Fix up playwright(-ct) args/bin (b49b753de03caacd7d9b0a39c35a7e13c6ad4e95)
* Improve cross-workspace config & binary handling (7ea7c344d187b53e09f1c2bda4fd4759abb0bdfd)
* Add tests for cross-workspace inputs coverage (100129acd5eb0371a603797f6bda28932f2440ed)
* Add note re. config cascade eslint v8 (resolves #957) (ee2c94d1e680d0004f4a40f0de8b93d25832e3c0)
* Add support for eslint v9 config files + settings (f55dc1b55ea84bfb4752ffdff5fbf1da6575f131)

## Release 5.44.5

* Release @knip/create-config 1.0.4 (06dcbaf45d291e8b9bc5f86cc060b5dd27736a3c)
* Refine input methods (512c3e480fe0271ab9a773679ba111d697b1ac3d)
* Fix up some variable names for consistency (f22341f6ef00284bc615692fe0d80c5b129d1c3f)
* Add `//` prefix to better reflect debug value is text/comment (0ec09337193eb30570fc36f9539b047fbcca6932)
* Fix webpack bins in fixture (15055579f804e6404588cfd71c045cc099d8b2c2)
* Defer resolve entry points in webpack plugin (resolves #949) (e42b09d9cf13ecde2fc7449cb7ec76fc1968cddb)
* Update docs (a530ff44d78f36ad8e3460a02534cafd5ad104e4)

## Release 5.44.4

* Fix `workspace` checks in Windows (4f4d0bf02f56dc24d6d62ee10bc71966c60b8e16)

## Release 5.44.3

* Fix workspace graph finder (resolve #948) (63929e23919a841b3ccc838b33aa8bb197639178)
* Simplify function name (bfbcf5d99d7dd750698ea069b45eb72b5a3a6e6b)

## Release 5.44.2

* Improve chart, update copy (f63df95f0436055ca49155d2234cd8f63aed34cd)
* Move config schema (6098cb9964b4a85de1dad40df8b0262df585f7b0)
* Move some utils (d3b7ab64e740ff7608f5900f85c07e957268ec4f)
* Split main sequence into build + analyze graph (c145c5833765902fb5b9ccd1bcf7044a9ca8b12c)
* Update docs (dae0f784c8ce22858d8fdd79ade148ba51ccf2fa)
* Edit docs (0b7f05fad65dae10696dbceca2ca2fafba279c9f)
* Fix dynamically added config files for disabled plugins (resolve #947) (82099178e22022c32f2d628a75406f8a7c4d03e0)

## Release 5.44.1

* Shorten @auvred (79d527988afcbaf17106c782ee05cab746255365)
* RR title (b572c7cfbf4332fccc392924c2417b020bd6aa48)
* Add links to remove-unused-vars (f94a9ee22e61e078e855391d7652f465c4abe69c)
* Document support for `-t jsconfig.json` (close #787) (12bd803b6540acfa21b58b7a41f6a5798cc846ff)
* Add scripts + chart re. sponsorship activities (de89b7e780064f418f5583807b49aef47b2436e3)
* feat: Support Stylelint custom syntax object (#937) (41a2bcc7f325fb3cba1e5463a8a04ae1a931bf51) - thanks @TJNhxMZHmqGytuWT!
* Fix unused `@types` DT dependencies (resolve #942) (fc95526767dd75b63e113c81504f5859d0f19746)

## Release 5.44.0

* Add fixture w/ compilers/workaround for tailwind v4 (3cf1d055f219b00ee523fa150b28fa876482fc67)
* fix: ensure augmentWorkspace honors tsConfig rootDir (#933) (2afffe0ddcc1349224c092e98d2f913d76dfe35b) - thanks @rmunch!
* feat: Add plugin for React router 7 framework mode (#931) (012fd5be9b49768ae81f66673c0639746513cc27) - thanks @lasseklovstad!
* Refactor some bits to add `manifestStr` (9ce5766c0cf66fab7beacc246b2160238762f5ef)
* Use `manifestStr` and introduce `PackageJsonPeeker` (f2efd223476e7ae51cae60101c3337b91df9aa03)
* Add `pos` to more issue types in json reporter (resolves #930) (72cbcfa32c219fabfc7b9ab24bbe2745ed354583)
* Merge node and node-test-runner plugins (1019b99704afe2181aa6b86a44ff9c1279f3e6fc)
* Ignore built-in test reporters (resolve #935) (090e76b594a4da8905f2f15de3598f46dcd3ced6)
* Housekeep react-router plugin (dd0f68263d8f609871755e183b1424c1a8986b33)
* Bright & dimmed issue type header colors in symbol reporter (close #934) (dcf5df3a7809614737769101661a7e111d4c1c5e)
* Update dependencies (905069539b74f04b198058e72089c9f7c023b6cb)

## Release 5.43.6

* Update docs for writing a plugin (f3669e2220a8ad40333643408ab4f78dcc73a029)
* Remove unused property (18612d2f2ce6c932b461ebd2c2ebaa9317b3e4a3)
* Merge glob patterns (3815faefb6e1875cebcee84f32a25973fd3d7654)
* Update docs for writing a plugin (c1de2ba43faa541cdae8af718002e2dc6d0bfab4)
* Invoke expo config function with context obj (resolves #919) (2d0876baaad2246757ba1b35d43960655068c0c2)
* Add empty `plugins: []` to dummy expo obj to cause less issues (15b8aac5087c2a5aa8d6d0597ea61f90d29e7514)

## Release 5.43.5

* Allow nsTypes to always consider all enums (the actual fix for #927) (881de38e24f95508e198db8369df14e4b4136147)

## Release 5.43.4

* Add missing test & widen scope for implicit enumerations (resolves #927) (d02db682d83890c65c6332c0dc7a8f763f5e818a)

## Release 5.43.3

* Improve enum/member handling (fc5982e9a90edb5f966391069a19b778d37dfe0e)
* More concise naming (f93a410f1319fd49661cafd73ddec8d10b546b6f)
* feat(jest): add __mocks__ to entry files (#925) (895434b8ce3adf02b11b3fe3835d658ade05f348) - thanks @TkDodo!
* Move mock (0259b8752b6f8c6b2bd780270b09e63ff227a10d)

## Release 5.43.2

* Add a bit of error handling for failed contributors fetch (b70958a58ea255ee7a7831e404786da807ca93d7)
* Always use `production` entries by default in expo plugin (resolves #918) (9b8cb699dfbfe7bb9422ac2834dd229ebb93eb06)
* knipignore → lintignore (47460d28c8723dfca4f85fb81be3037c2c52c8f1)
* Fix scoping of namespace import refs (c8ce64d71dc841745cef6d059f43841d0f2d2419)
* Bun started exposing `serialize` and `deserialize` directly from `node:v8` (cbfc56e98bdab15d708c16413dcff4ecf2916e8d)
* Update docs (b7b627398930b9aaf64e1a1bf56f6aea0ff9f35d)
* Update dependencies (9b4f695c6c1b8ed9cc4b503e51888f40e1fc1a88)

## Release 5.43.1

* Add `ignoreUnresolved` to json schema (ec1cca705d0dbae53927938ae3d09cb1b5d1da1b)
* Update docs (d1f05c1e2df592cbee7b40b76f6657d8c07d43cb)

## Release 5.43.0

* Add `ignoreUnresolved` feature (resolves #920) (081a776adc106221b0e7c0a0c14bcb594e7f651d)
* Edit metro plugin doc (a418b57eda0fb31cf54f8d148da2ecbd4294988d)

## Release 5.42.3

* Do not crash when running npm init @knip/config on a repository not using git (#916) (10575b8afbc0d6cc7a1442d9c28d6fa144b656ea) - thanks @guillaumebrunerie!
* feat: add support for storybook framework option as a string (#923) (030ac406877d3c61005eee4f0067b555942c9a2f) - thanks @filipw01!
* Fix vitest reporters with options (#922) (02a300c1f01dc9d1dc1c312404e25d88c97a125f) - thanks @dakro!
* Improve `containingFilePath` for inputs + debug output for failed script parser (8ccee8178e1087791b563a47018e220db386ed9e)

## Release 5.42.2

* Accept function that returns config in expo plugin (96b67835ebc07abea5c899154978b6f09ca39bff)
* Improve pm binary/package handling (4b78b614d8dace82c6c8c168c7909f4f4f025f7b)
* Make github-action inputs optional in production mode (resolves #914) (c510a3500e946153db798d912d8d9c8dc399bb0d)
* Minor housekeeping (4011b233dcef91ea8c48e971c018bbc16141cef4)
* Track Angular polyfills (#913) (e5688024e618ad066a85ef995c8a2f292fe3c43d) - thanks @davidlj95!

## Release 5.42.1

* Exclude semantic-release packages (resolves #899) (a28cc021)* Edit docs + gen (d850cbeb)
* Improve reported line sorting (7ff0b70b)
* Rename tests touching fs for easier exclusion (be5ba912)
* Add test:watch script to watch only failing test (86b2123f)
* Add default formatter for jsx (4a212ad9)
* Avoid overwrites in issue collector storage key (0530465c)
* Rename file to match test/fixture consistency (959b64cf)
* Fix case of `node ../../node_modules/.bin/executable` (resolves #908) (5a77dcc4)
* Log debug session from launcher (be1f9d42)
* Introduce `optional` dependencies & improve pm cli arg handling (1731ee5d)
* Support more `execa` methods in visitor (5f2cf340)
* Minor refactor (052375f1)
* Fix non-internal `isDependency` case (e908cfea)
* Format on save (0f670160)
* Fix case of $/execa script like `yarn lint:spellcheck` (03abffdd)
* Reduce noise (5a3177f5)
* feat: add dependency-cruiser plugin (#911) (8d206a07) - thanks @filipw01!
* Update dependencies (b9aff835)
* Update docs re. 1731ee5 (938496c3)

## Release 5.42.0

* Refactor getImportsAndExports return structure (3cb27ebfbcddbb64f19e605c0b893eb21f82a44a)
* Add isModule to narrow down visitor condition (17f2224537b243046fe808ecc199f6c033ec019d)
* Always run config resolver (#884) (94474cbc0ac3af7488a0aa4056ba1df6abb80405) - thanks @davidlj95!
* Clean up after #884 (4fc91eb2831de105179cc6f8e6012555f6b53a1a)
* Add Karma configuration from Angular plugin configuration (#885) (e1ba4472a13a79984b9dbd49b2431f1efbe69cb7) - thanks @davidlj95!
* Ignore `zip` global binary (#888) (62fbc7664ab2a5cff36e38f7ff8b31485d19ed2b) - thanks @davidlj95!
* Ignore `rsync` global binary (#889) (d29ec3488c90d387a5aa62f8beb36a136e5ec397) - thanks @davidlj95!
* Track Angular scripts build option (#886) (f43b63849670b927f62de29ef9d317778d7a45a5) - thanks @davidlj95!
* Fix up count after merging multiple PRs (9590b9238d558098430f9535f95c1f40d437c2ec)
* Add support for nx command shorthand to nx plugin (#896) (337de52c36d2b0bcb07ba5ebaaa23a995dbbd3de) - thanks @jjjjonathan!
* Delete principal from array after usage for GC (#897) (79a7d487d686d85faf9b7f23e641e0ad6ba4384b) - thanks @heystewart!
* Fix iterating over namespaces imported using '*' (star) reporting unused classes (#898) (26331c00e8312a6c461480af1d0c2935c2471c07) - thanks @heystewart!
* Add `metro` plugin (#895) (b106a5ff7dd9bd712f5b33fd16135242092945de) - thanks @jjjjonathan!
* Separate Angular production vs non-production entries (#887) (91130f8651fae2202450e51c281656f7b49af774) - thanks @davidlj95!
* Add testimonial/tweet (9c824704bf0a0b751dd3c1c0e41a746ca72080a3)
* Remove links to closed "request plugin" issue (5e54e1dde309edc36b4796f23de7176e9d759583)
* Styling (169dba1658a427ea778a79833c2bc347d77ef1c5)
* Update dependencies (fbaec015b8e3ab5a0276672a6f6beae0056494dd)
* Housekeep isInForIteration heuristic (566d11c6e24f11b577b847bf8b8fadde569ade67)
* Only wipe principals in isolate-workspaces mode (f1e6770cd08b5242c299ece8b09d88b99fc6740a)
* Fix commands in dev guide (5d6fe802a91a9325a0a615e59467a60a74d27087)
* Minor edit readme (b5f426c851081147b528336368cfa2a5b987e505)
* Split angular test (4fa4a03707ff569995cb07de4d431632f08e99e0)
* Fix photo url (a9f2d74b5ce8b282bac1765ea77d3740ef3e852a)
* Fix cache location (5dc317ae76c976ecac1e6bd6131794a0d8176d69)
* Require Node.js v18.6.0 → v18.18.0 + downgrade release-it (daf92ce6af2f63612d45b0cd6e7c412fe4f2d614)
* Truncate start of lengthy symbols (a6b2b9e92bf6639eca8ca50402f6211a0e341609)
* Add `args` to webpack plugin to find webpack config files (08663029e6c2ec15a118e13ca3af84ccd58310df)
* Add `args` to jest plugin to find jest config files (3c0a6c54b17fe4e22a06657150acaf11502333e0)
* Fix up create-new-plugin script (f5a1edecdf614255a676183b2d7f8901d647c299)
* Add platform-specific entries to metro plugin (2e8c8ac65fa9e05fc170d08913d7fbac2b2bd876)
* Generate docs (093dcca11155072159175830cfbc9c3cca0dde8d)
* Improve plugin docs a bit (6471cf130f5ff85d6215c3a9032c7483f84402f3)
* Update release-it and use new `releaseNotes.commit` template (0c496895121aa2b9720786fcec26315cdb245ce8)
* Minor housekeeping 🔍 (4a9ff563046eda5bff6d04f8d1c36651a4ff6d7a)
* Update dependencies (2bd03e09bba0da3d7936d8329c01eb8fad3e9197)
* Plugin docs tweaks (5fe4cb4d0d04ed198ad8c1de10aa2732baa0ca94)
* Update release-it (ac7e93322762d60937f4a984cc1f27ef05e067cd)

## Release 5.41.1

* Remove contrib.rocks img (8d996a68)
* Support caching results on Win32-based systems (#832) (3b280e63)

## Release 5.41.0

* Add `expo` plugin (#879) (40f7be98)
* #598 Nx plugin doesn't look in package.json (#880) (9ce4a49a)
* Remove twitter link from header (34004ba6)
* Tiny fix code block (17ddcb7b)
* Update & format (f696807b)
* Fix up doc build scripts (9ba09983)

## Release 5.40.0

* Add Karma plugin (#871) (3d29854d)
* Remove tea.yaml (e43304b4)
* Add Workleap (@gsoft-inc) as sponsor (thank you!) (c7385612)
* Update comparison page + auto-format (e6340b03)

## Release 5.39.4

* Ignore ignore patterns in vite test.include patterns (df390a0d)
* Stop using package.json as fallback `containingFilePath` (de6682b0)

## Release 5.39.3

* Doc edits (0f640e1e)
* feat: update mdx detection dependency list and update custom compiler… (#875) (055a2e38)
* Add new content configuration entry for Astro (#872) (c80ac0e7)

## Release 5.39.2

* Fix up moonrepo fixture (382c909f)
* Edit docs (69d602a4)
* Plugin housekeeping (770685bc)
* Add `isRootOnly` to moonrepo and yarn plugins (9c072943)

## Release 5.39.1

* Fix case sensitivity in package name check (resolves #869) (d6dab3da)

## Release 5.39.0

* `yarn.config.cjs` support (#864) (759503db)
* Track Angular environment files as entry points (#868) (7950bf3d)

## Release 5.38.4

* Update Angular workspace types and add update script (#866) (9074440d)
* Tracks Cypress component support file (#867) (4a6eddc3)
* docs: update entry/project defaults with production mode (#861) (5f4e1391)
* Track Angular's `server` builder option (#865) (dbf502b8)
* fix: add `scp` to `IGNORED_GLOBAL_BINARIES` (#863) (0362c89f)

## Release 5.38.3

* Fix traces for default export (resolves #860) (90d1f5cd)
* Fix typo (204ce6dd)

## Release 5.38.2

* Fix for certain failing cases of --include-libs (resolves #855) (5242ddd4)

## Release 5.38.1

* Fix regression re. isIncludeEntryExports → skipExportsAnalysis from scripts/plugins (resolves #857) (b8379dec)

## Release 5.38.0

* Webpack → webpack (5f4cb26b)
* Fix ignored workspace matching (1c6309d0)
* Upgrade smol-toml (closes #852) (fc88c1a4)
* Add past sponsors (38cfa080)
* Update docs (close #845) (7d7802ce)
* Add plop pkg/bin + auto-format fixture (cd59544e)
* Add plop plugin (#851) (060b28d3)
* Add Astro middleware and actions (#850) (031bc205)
* Add issue template for docs (fd621249)
* Fix non-terminal ec blocks bg color (closes #846) (f735453b)

## Release 5.37.2

* Update some deps (862701ea)
* Fix up ec styling a bit (9bdb2c06)
* Add array expression to `isConsiderReferencedNS` (resolves #844) (1baa1d4c)
* Fix up unused files for jest-unit (resolves #841) (4657618d)

## Release 5.37.1

* Use entire body of <script lang=ts> in vue compiler (fixes #740) (8d53df51)
* Update compilers.md. (#838) (1cf68c89)
* Format (db9da719)

## Release 5.37.0

* Fix incorrect unused file in watcher (48850caa)
* Add fix demo (9e9c7f87)
* Add `global` as yarn cmd (ea1aa057)
* Update sponsor list (22e684b3)
* Support resolving jest-junit file dependencies (#835) (7a53029c)
* jest: support custom testEnvironment (#834) (153a8368)
* fix: Fix incorrect rootPath resolution in jest plugin (#833) (9730d02a)
* Respect and document NO_COLOR (403d2578)

## Release 5.36.7

* Temp disable argos (fixes in knip → issues reported issues) (fd2d9d31)
* Format generated file (6e15421d)
* Credit file-entry-cache (fe7812e8)
* Simplify `isReferencedInExport` and report types-in-types (resolves #830) (80537c58)

## Release 5.36.6

* Generate plugin schema file (resolves #829) (9d3367bb)
* Move `pluginsSchema` to separate file (8e6fe9e5)
* Add tweet and pat myself on the back (f4b253cf)

## Release 5.36.5

* Use plugin names as binary name fallback (fixes #743) (57997e5f)

## Release 5.36.4

* Format (d5d1ba0d)
* Reduce own config (234d8cff)
* Refactor globbin' to improve debug output (2bd294ea)
* Add glob args parser to plugins (7464371f)
* Remove oddity (0b09ff7a)
* Add comment to generated files (39a77ba2)
* Some plugins only need to run in root (811af534)
* Add warning for --isolate-workspaces + class members (98318d7d)
* Add log util (328ba014)
* Housekeeping config file (fb71a2cd)
* Remove unused export (6d2fdeaa)
* Follow your own rules (135e478e)
* Filter out external refs to re-exports (b9ffef4c)
* Make more sense in --include-libs tests (9a78e330)
* Add plugins card to homepage (5d32cfb7)
* Add "plugin docs generated" remark to plugin pages (ac3344a3)

## Release 5.36.3

* Consolidate specifier workspace handling into helper (5c4a9d59)
* No need to add .json files as entry files (8c0289f3)
* Update comparison-and-migration.md. Fix wrong link of npm-check (#828) (a4a98827)
* Only show any config hints in non-production mode (a1383889)

## Release 5.36.2

* Read runtime in jest plugin (closes #603) (d7660064)
* Minor doc edits, formatting (db3fe403)

## Release 5.36.1

* Format (813908fd)
* Skip indexing into a gh action if its not an array (#827) (04470035)
* Upgrade jiti (1d8211f7)
* Fix up plugin file generator (5f16b2e8)
* Add a bit more to integrated monorepo doc (61357545)
* Add newline to disclosure reporter output (a74d27b0)
* More posts, from bsky too (7baeab91)

## Release 5.36.0

* Add disclosure reporter (c5f0ee65)

## Release 5.35.1

* Fix up webpack plugin (af71a390)
* Housekeeping (fe8003d7)
* Add bsky link (23810520)
* Add article + format (fe4f6a84)

## Release 5.35.0

* Start support for binaries that may have command behind double-dash (be09c99c)
* Minor fixes (51f44816)
* Add nx daemon known issue + solution (closes #727) (aff3720d)

## Release 5.34.4

* Add tip to integrated workspace doc (c8d1dbdb)
* Flatten cspell import (fixes #825) (aa6e2650)
* Minor refactors (67e90850)

## Release 5.34.3

* Sort unused file paths in symbols reporter (resolves #817) (b933cd25)
* Fix knip chrasing due to invalid picocolors version (#821) (fb9596ae)
* Add `amplify` to `IGNORED_GLOBAL_BINARIES` (#819) (cfcdcbe1)

## Release 5.34.2

* Highlight package name in specifier in symbols reporter (eca123b2)
* Fix binary extraction from specifier (c881d783)
* Rename util to get-referenced-inputs.ts (62b10ba4)
* (TypeScript plugin): Add references path of tsconfig to config (#816) (bff09772)
* Update docs (366acdcf)

## Release 5.34.1

* Fix edge case for binary disguised as entry (#161) (846ed76d)
* Only ignore "http" if in dependency specifier (fixes #813) (9defcb94)
* Move helper to less confusing location (e0285280)
* Consistent naming (20070ba4)
* Rename test file, fix up default values (5bb56e7b)
* Update docs (c9afd52e)
* Add documentation for unplugin-icons imports issue (#812) (20b25049)

## Release 5.34.0

* Don't use `path` if step also has `repository` in github-action plugin (c6e4d310)
* Give plugins a chance to prep config args (a2217a28)
* Let's start out conservatively (a2e83f88)
* More consistent naming (bae87d96)
* Optimize a bit after the dust has settled (31f1e7ee)
* Cherry on the pie (617e067e)
* Handle config files only once across workspaces (939f5110)
* Improve naming and simplify a few things (f4db2047)
* Add coverage for unused files with compiler extension (c2e27127)
* Ignore `virtual:` imports, don't report as unlisted dependencies (2ef75ccf)
* Remove module resolving from plugins (53839e08)
* Temp use Bun for in this integration test for green lights (98c1ff7a)
* Add ability to add unresolved imports to `ignoreDependencies` (b8875be3)
* Let's start out a tad more conservative (58ba79f9)
* Update dependencies (f4dc1e11)
* Optimize referenced dependency handling (a413ad84)
* Resolve config file paths and parse recursively (c03f9630)
* Exclude empty config file path arrays from debug output (d288779e)
* Extend typedoc plugin (f2732fad)
* Presets are extended by local config in jest plugin (4973a9dc)
* Add test case to get refs from scripts (61151070)
* Refactor binary resolver & referenced dependency handling (f1349c23)

## Release 5.33.3

* Add comment (close #808) (3dd6cfd0)
* Don't remove internally referenced bindingElement nodes (#808) (307ef8df)
* Expand unused exports referenced in used exports (#808) (1c041635)
* Got tired of it (2f2a11ea)
* Add test in new workspaces fixture for 3ee04761 (4a3f84cd)
* Fix travis `isEnabled` (b6541f32)

## Release 5.33.2

* Revert "Add/fix `getPluginEntryFilePatterns` helper" (resolves #804) (3ee04761)
* Add French article + order by date (recent first) (617a06a1)
* Skip windows-latest (error: "The syntax of the command is incorrect") (aebbfb64)

## Release 5.33.1

* Upgrade jiti (a056e8d9)

## Release 5.33.0

* Remove more whitespace including newlines with enum members (29b35ea7)
* Upgrade jiti to v2.3.2 (c5b94c91)
* Add `module` and `browser` fields to `getEntryPathsFromManifest` (e63ebeca)

## Release 5.32.0

* Add `pos` to reference pragma import node (f704a2bb)
* Rename propertyAccessCall → resolveCall (72b48273)
* Update dev doc (36b85bad)
* Minor refactor, add comments to get-imports-and-exports (e9416ec5)
* Add `ts.isPropertyAssignment` to `isConsiderReferencedNS` (e4bada42)
* Use `{default: true}` in jiti.import call (700a091c)
* Update a few dependencies (d2a7b597)
* Consider enum members used if used in object enumeration method (resolves #699) (feab7921)
* Refactor behavior with/out ignoreExportsUsedInFile (14d2cfc2)
* Always check types/classes for referenced in exported type (50bc1256)
* Don't try to find refs to empty string in `findInternalReferences` (42d626f9)
* Don't ignore (global) dependency if relative path (86ec088d)
* Move hard-coded `deno` out of bash parser (fb0da5b7)
* Add travis CI plugin (4821b528)
* Improve nyc plugin (e6fa86ac)
* Stylelint plugin - fix issue where "customSyntax" property is not recognised as a resolved dependency (#802) (fdb02462)
* Don't try to find refs to empty string in `findInternalReferences` (fixes #800) (d9ae5dc9)
* Update docs (0749921b)
* Post "two years" (69c021b2)

## Release 5.31.0

* Do not treat trailing `#` in gitignore as comment (#797) (7fc63552)
* Fix extension for file fixture containing TS (847649df)
* Update some devDependencies (d304d8db)
* Update docs for auto-fix (close #788) (48fbddfd)
* Consistent reporter output (94da7f78)
* Add support for enum and class members (1109cbf6)
* Refactor for reuse/readabilty, more tests (20c2390c)
* Fix issue type in export declarations (0f786f4b)
* Support exported types (2a251fa2)
* Improve unused export fixer, add tests (b0bb6430)
* Update docs (b384403c)
* Improve var naming in tests (2ed9e514)
* Upgrade to jiti v2.1.0 (dea12f81)
* Update docs re. known issues w/ jiti (6819eb93)
* Remove obsolete jiti options (6d476308)
* Use jiti.import + add tests (resolves #565) (3dd8ea68)
* Migrate to jiti v2 (de7fa2d4)

## Release 5.30.6

* Ignore TS issue with Bun for now (2a361399)
* Add --trace arguments to help text (4b314e2a)
* accept _ and . in package names (#790) (84db2459)
* Remove duplicate job (it's in integration.yml as well) (2b550b0f)
* continue-on-error: true → fail-fast: false (8ed9314c)
* Update argos ci commands (ed4bad21)
* Add freeCodeCamp to integration suite (0784ca5f)
* Update FUNDING.yml (cf6c5fe8)

## Release 5.30.5

* Use root testDir fallback in projects in playwright plugin (d4c5af94)
* Try harder to resolve package name (1e64b6ce)
* Consider `module.exports = require()` to be re-exports (e2bdb952)
* Auto-format docs (e40f618d)

## Release 5.30.4

* Bun is catching up (1002b670)
* Deal with packages that confusingly include `package.json#types` but also recommend to install DT pkg (dd10163e)

## Release 5.30.3

* Update some dependencies (233c2a01)
* Add `@eslint/js` to eslint plugin enablers (cbe6fea4)
* Update docs (d6740203)
* Update docs (eb283cfb)
* Update remark-preset-webpro (22ab19fe)
* Fix: Expand Vitest File Extension Checks (#785) (b0f7c466)
* Fix commit sha in PRs in integration.yml (dc9e3ed5)
* Use actions matrix to run jobs in parallel (fd868c6d)
* Add Prettier to projects + int tests (bc628317)
* Dogfoodin' is underrated (74b63cc9)
* Fix formatting (34a757c7)
* Update docs, styling (resolves #783) (d05795cb)
* Update docs (2e09608d)
* Update some dependencies (e60b8e48)
* Update docs (b52125de)

## Release 5.30.2

* Update lockfile (f71c697d)
* No longer need to bail out for node_modules/ in resolver, allow such specifiers (closes #773) (62bc9561)
* Minor refactor (5730b49b)
* Try local package specifiers first (enhanced-resolve has trouble) (89a384e0)
* Tweak basic playground (dae3362a)
* Add og image for playground (c9b1829c)
* Update docs (aa011bab)
* Update playground (b620f167)
* Remove obsolete vercel config (e4bbb5cb)
* Update dependencies in issue templates & add playground + templates (62bafaf0)
* Update docs (9e860fa3)
* Let's try typescript@next (b194667d)
* chore: update docs with links (#776) (350bc0b4)

## Release 5.30.1

* Support `snapshotSerializers` in jest config resolver (b69c6a32)
* Treat --package arg the same as positional arg in npx resolver w/ --yes arg (b41594d0)
* Update configuration.md (#774) (39d473a4)

## Release 5.30.0

* chore: Update dynamic-configuration.mdx (#777) (7967f9f7)
* chore: update gitattributes with more file types (#775) (40a16fbb)
* Fix bug with patterns already in globally ignored patterns (720386af)
* Update invokeai cmd (7035dee1)
* yolo (dabf4f65)
* Add redirect (bef644de)
* Add robots.txt (f28f6d44)
* No point in adding unignores to fast-glob options (859403b7)
* Always ignore node_modules (even if gitignore:false) (b583ae86)
* Log full fast-glob options obj in debug mode (8b5bc3fd)
* Update docs (273cf040)
* Remove unused prop, add more tests (0fe67f50)
* No longer need bun@canary (d9169c62)
* Fix windows issue, refactor, improve perf (359e624e)
* Refactor glob utils, support ancestor .gitignore files, add tests (closes #531) (52ef9a4f)

## Release 5.29.2

* Edit docs (5ca20def)
* Add `.ts` config ext to webdriver plugin (d8df5e1f)
* Prepare for ts v5.6 (6fb6e7a3)
* Pick up typescript@rc in CI again (116c6c64)
* Merge 2 glob helpers & fix debug output for glob (c0601469)
* Rename function argument (480ff04b)
* Add/fix `getPluginEntryFilePatterns` helper (573ec9cb)
* Fix typo in svelte plugin and remove overarching `project` patterns (def8e257)
* Edit docs (ac75feba)

## Release 5.29.1

* Disable e1061c55 as it might be unexpected/breaking with eslint v8 (9e676226)

## Release 5.29.0

* Extract packages from rules in eslint plugin (e1061c55)
* Normalize generator package names in nx plugin (bb86a059)
* feat: coreutils to IGNORED_GLOBAL_BINARIES (#771) (97e171d9)
* Edit docs + add note to nuxt plugin (3e0c4646)
* Add optional `note` feature to plugin docs generator (9a11e1cc)
* Update docs (70bf7056)

## Release 5.28.0

* Fix helper name (e5c20dde)
* Add preconstruct plugin (af61c962)
* Add nest plugin (4ea83f20)
* Add nuxt plugin (bc548c59)
* Add vike plugin (72b797a8)

## Release 5.27.5

* Add `nuxt` to Vue compiler condition (closes #770) (24fb3ea4)
* Improve import matcher in "compilers" (4d2487f2)
* Improve regex in "compilers" a bit (resolves #769) (382dd06c)
* Fix blockquote style (aa137237)
* Format/edit docs (6bd1617e)
* Edit preprocessor section (2e072c59)

## Release 5.27.4

* Edit docs, add "unsupported" page (c28b62d4)
* Match against normalized package name in `ignoreDependencies` (89780376)
* Add mocha to `Projects Using Knip` (#765) (a2305823)

## Release 5.27.3

* (PostCSS plugin): Add `postcss` to  used dependencies when using PostCSS with Tailwind CSS (#764) (23526a9f)
* Edit FAQ (53a50ae2)
* Release @knip/create-config 1.0.3 (fd6c7d11)
* Add FAQ (#759) (4f2665fc)
* Revert "Temp exclude unlisted in typescript integration test" (02e4ef70)
* Edit issue templates (5ef4e8d8)
* Fix issue templates (closes #760) (ebed4a83)
* Minor edits (e83c3730)
* Revert to tsx@4.7.1 (d1899545)
* Extend and consistentify issue templates + related docs (dbfefa31)
* Add pronunciation to homepage + readme (2cda6425)
* Restore symlink (d961f3c0)
* Edit some docs (5ea8dfe4)
* Fix format/lint issues (b29f102e)
* Extract getWorkspaceFlag(pm) to also detect Yarn workspace configurations (#755) (7da1272c)

## Release 5.27.2

* Don't git-ignore user configured entry files (5e07bbcb)
* Release @knip/create-config 1.0.2 (ba39caa5)

## Release 5.27.1

* Use `pathsBasePath` if available to make `compilerOptions.paths` absolute (fixes #748) (6c866d26)
* Format docs (d0d5f970)
* Increase enhanced-resolve cache duration (c7fa02e1)
* Add test coverage for tsconfig.json w/ module:commonjs (3d5a5363)
* Add non-standard CJS require calls in TS files as entry files (as require.resolve) (f8f0d669)
* Update docs (b2ea3a9a)
* Fix regression issue template (f6066d69)
* Aid ts issues (9eff1bb1)
* Enable more tests in Bun (953d6f61)
* Update lockfile (4d8b35b8)
* Replace resolve with enhanced-resolve (39e0f223)
* Temp exclude unlisted in typescript integration test (76752c88)
* Inline playwright types (ea099cc0)
* Add Vue example to compilers in docs (#733) (949ddd8b)
* Minor refactor (8c21df51)
* Fix omitted expressions in Promise.all imports (resolves #725) (858c0b73)
* Clean up `tryResolve` etc. (e20a9e9a)
* fix: pnpm workspace fixes (#738) (d5003d1b)
* Update .gitattributes to exclude binary files (b9b8f4da)
* Revert "CRLF will be replaced by LF the next time Git touches it" (0fdb4c93)
* Upgrade Astro (ccb7523f)
* Use latest tsx again (2b7d0537)
* Add `bun create @knip/config` to installation instructions (fb199152)

## Release 5.27.0

* CRLF will be replaced by LF the next time Git touches it (bea004fe)
* Remove OS eol diffs in tests (799cc422)
* git config eol=lf (5d239323)
* Re-enable windows test for bun (bc66b4fa)
* Add test case (fixed by ae5c3417) (5e742dc3)
* Move more cli args into single location, refactor some namings (9f5eb01a)
* Update contrib dev docs (108eff17)
* Add ladle plugin (#728) (ebd79d4b)
* Circumvent case where `element == undefined` (#725) (ae5c3417)
* Adjust tests after f5680fb2 (b4dc6921)
* Edit docs (916b633a)
* Print relative .gitignore paths in debug output (fef3dba5)
* Don't add ignored files as entry paths (resolves #734) (f5680fb2)
* Use single or double star to ignore workspaces, remove single star for ignore glob pattern (f6b00582)
* Restore support for legacy husky w/ lint-staged (bd16c985)
* Support override configs in babel plugin (953d4fbd)
* Add react-cosmos plugin (2de39245)
* Add rsbuild plugin (placeholder) (efd7d2ad)
* Add rspack plugin (3cbfd0a8)
* Add `src/vite-env.d.ts` to entry paths in vite(st) plugin (closes #732) (8cf6a0ac)
* feat(cypress): add support for cypress-multi-reporter (#726) (cdea5b19)
* Add Forge 42 (@forge42dev) as a sponsor (d0166be6)
* Update Astro dependencies (d887b1d8)
* Use bun 1.1.19 (also see https://github.com/oven-sh/bun/issues/4899) (03cba1d4)
* Move watch logic into separate module (3ea24cfd)
* Move dep graph utils from main sequence to helper module (85fc933a)
* Rename createPkgGraph → createWorkspaceGraph, etc. (9deb9c5a)
* Group handlers in main sequence (7274e8d9)
* More consistent file names (0dc5eba5)
* Move `toSourcePath` to `ProjectPrincipal` constructor (ef1ab492)

## Release 5.26.0

* Regenerate lockfile (3a7fcc9a)
* (plugin/GraphQL Codegen): Support full name for plugin and preset (#730) (1562b3d4)
* Support subpath import with arbitrary extensions (#723) (c35bad7a)
* Update issue templates + issue reproduction doc (d4121d98)

## Release 5.25.2

* Include additional workspaces when loading manifests (resolves #722) (ca03fd83)
* Move & refactor setRefs → findInternalReferences (deeb2acc)
* Minor refactors (09fc5363)
* Always pre-set `moduleResolution: bundler` if tsconfig.json (3c131184)
* No need to publish twice here (34be850f)
* Minor refactors (c1db1ec2)
* Update docs re. shared/isolated workspaces (699fd28b)
* Set `moduleResolution: bundler` if not set and don't share it (resolves #719) (2c246784)
* fix: Use `parseFragment` instead of `text` node which breaks formatting (#720) (3201c076)

## Release 5.25.1

* Publish vendor dir (fdac7ba8)

## Release 5.25.0

* Update dependencies docs (b42c85b4)
* Sync @nodelib/fs.walk version w/ fast-glob (e77ce774)
* Vendor bash-parser (78e7b28d)
* Add pkg.pr.new workflow (2679f202)

## Release 5.24.4

* Start using central resolveEntry from plugin helpers (#716) (65d80981)

## Release 5.24.3

* Improve Angular plugin a bit + add fixture/test (#717) (641b5fcf)
* Fix Cannot read properties of undefined (reading 'name') (#718) (f0f9f5ab)

## Release 5.24.2

* Fix entry patterns in jest plugin (resolves #716) (1cd4bd84)
* Support multiple --loaders etc. for NODE_OPTIONS prefix (resolves #715) (66f48c0f)
* Update pnpm/action-setup to v4 (9754973e)
* Add missing rule keys to JSON Schema (#713) (1f61f776)
* Add note to rules re. `dependencies` warning (#713) (71e89a28)
* Update styling (3d03cdef)
* Add wonderful tweets (bb333ede)

## Release 5.25.0-slim.0

* Sync @nodelib/fs.walk version w/ fast-glob (3c2ce764)
* Vendor bash-parser (ae7a4aa2)
* Add pkg.pr.new workflow (fd3d374b)
* Add wonderful tweets (bb333ede)

## Release 5.24.1

* Fix up rules in issue collector and reporter (resolves #713) (77752130)
* Fix Knip config (4c4e3e1e)
* Use jiti `alias` over custom transform (b9f1715e)

## Release 5.24.0

* Add `vitest` as enabler to vite plugin (b384d18a)
* Fix up formatting/config (9961e2a5)

## Release 5.23.3

* Update dependencies (8c783e91)
* Restore that (only) interfaces can be default-exported (resolves #709) (919a68bf)
* Improve generated plugin docs (f33f1136)

## Release 5.23.2

* Fixes to config files + Cosmiconfig, Lilconfig and Unconfig generation. (#700) (83e18a10)
* Exclude `nsExports`, `classMembers` and `nsTypes` from `--exports` shortcut (#698) (2e834465)
* Update marketing materials (62090b40)
* Update funding options (e8a4a00c)
* Update marketing materials (4f6a1977)
* Switch to microsoft/TypeScript main in integration tests (c8c6dabb)
* Add whitespace in exports coverage (alias-exclude) (a03d4ebc)
* Add more coverage for tag hints (3d551dbb)

## Release 5.23.1

* Minor refactors (efafcdc3)
* Add test for re-export with `includeEntryExports` + `ignoreExportsUsedInFile` (#698) (c0a0f0be)
* Consider alias exclude symbols referenced in `ignoreExportsUsedInFile` (resolves #697) (326b0181)
* Fix enum members in re-exports in entry files (resolves #703) (3ff2253d)
* Fix tag hints (#691) (dd051cd0)
* Minor refactors (3e9806a9)
* Fix `isReferencedInExportedType` AST helper (bc2e7165)

## Release 5.23.0

* Update docs (1f945edf)
* Show unused custom ignored tags as hints (resolves #691) (78255fc7)
* Don't report exports referenced in exported types (resolves #687) (834c26be)
* Fix unused exports used in file with substring overlap (#695) (5a2176ea)
* Name tests/fixtures after option name (a7b9a984)
* Fix unused exports used in file with substring overlap (resolves #695) (555c1629)
* Update docs re. issue reproduction (646ed753)

## Release 5.22.3

* Try harder looking up strictly-ns-references recursively (#690) (4cf13377)
* Also traverse into re-exports and re-exported aliases when looking up strictly-ns-references (resolves #690) (b98c5b9e)
* Update docs (e906674a)
* Add support for graphql-codegen plugin level config (resolves #692) (#693) (71de7f17)

## Release 5.22.2

* Fix abs extended tsconfig paths if internal (resolves #689) (d1261c1d)
* Update release-it and use JSON schema (a4111fe6)

## Release 5.22.1

* Add fixture for #687 (e15da45d)
* Add `require()` import with ts ext to commonjs fixture (#681) (0c56610e)
* Add support for thenable dynamic import w/ destructured arg (resolves #688) (1343826a)
* Update ts dev dep (67404f39)

## Release 5.22.0

* Replace file-entry-cache with custom impl + built-in serializer (7aa2f6df)

## Release 5.21.2

* Fix: Support Cypress configs with `false` value for `e2e.supportFile` and `component.supportFile` (#684) (bd77bcce)

## Release 5.21.1

* Fix lockfile-lint config filename (#683) (f5304b6d)
* feat: add command to ignored binaries (#682) (d049b6c4)
* Add (custom) og img for sponsors page (d89ec129)
* Rename `NOT_FOUND` to `KNIP_ADDED` workspace names (3a41f8ec)

## Release 5.21.0

* Add webdriver-io plugin (7414dc1a)
* Update plugin docs (df35b9f4)
* Minor housekeeping (1422c9d2)
* Add size-limit plugin (dbd82f87)
* Add lockfile-lint plugin (d70d0de7)
* Use provided name in plugin template (43961f91)
* Minor housekeeping (c81b1a23)
* Update readme with badges and stuff (c18fcba5)
* Update docs (Configuring Project Files) (e10ac2e4)

## Release 5.20.0

* Lockfile (e9298477)
* Edit doc (5afaac44)
* More consistent usage of fg (25cbba0a)
* Eliminiate custom TS System instance (#680) (d7325c69)
* Go against the grain in the cypress plugin (ef2464d5)
* Remove duplicate code (6a17ad29)
* Add simple-git-hooks plugin (#679) (9129af70)
* Add missing `root` property to vitest (#677) (6797bf8d)
* Update some dependencies (7c9b6455)
* Update docs (1c9361f3)
* Make TS-style path mappings work for all files with extensions (#673) (e9b3e669)

## Release 5.19.0

* Fix up integration test for slonik (2abcea61)
* Stop printing the bulky help text for config errors (95764130)
* Throw if passed --workspace dir does not contain package.json (resolves #667) (ea3f1240)
* Support import.meta.resolve (resolves #642) (177baa2b)
* Handle `NODE_OPTIONS=` in scripts (2ec5189a)
* Minor refactor (7c87441e)
* Timerify `resolveModuleNames` (#673) (9f2077ca)
* Support Jest's globalTeardown (#676) (c170aebf)

## Release 5.18.2

* Improve re-export handling (9ccefb34)
* Add identifier to trace for re-export from entry file (b0b8b3d3)
* Move tagged export logic into reusable handler (1dff2db4)
* Update docs (2f91c8d0)
* Update `@ericcornelissen/bash-parser` to 0.5.3 (#674) (9a7ffac2)

## Release 5.18.1

* Refactor and improve dep graph naming/typing (28f05f0a)
* Speed up (de)serialized and add test (deb3b9c5)
* Move cli tests involving stdout to separate folder (978674fc)
* Update and caretify dependencies (e14f6d24)
* Fix link to screenshot (c2f9507e)

## Release 5.18.0

* Don't report issues when using --trace (d8e9719b)
* Emphasize --debug and --trace on troubleshooting page (bcb5e93f)
* Add --performance screenshot (d0d01082)
* Integration test knip --cache for eslint as well (443b8be0)
* Dogfoodin' is underrated (7115889b)
* Update docs (0651144c)
* Test against latest TS 5.5 rc (f7aba23c)
* Add test for imports-self (closes #663) (736b0a25)
* Major refactor of dep graph for trace feature (ad16689b)
* Use cwd as default base in `toAbsolute` (678f47ab)
* Fix tsup entries are production entry files (4d839d8f)
* Don't need to cache package.json (da33b9c4)
* Better explain `ignoreBinaries` configuration option (#670) (8470505f)
* Update funding options (81cf806d)

## Release 5.17.4

* Fix up caching (e75f0e92)
* Minor refactor (28b24349)
* Do literal text search in setRefs (closes #595 #596 #664) (6e64d60c)
* Refactor to use more maps over objects, move/rename some vars (90fcd4cd)
* Add polar to funding.yml (c4bb9167)
* Use `IMPORT_STAR` const (cb9ed830)
* Remove specifier from dep graph and `SerializableImports` type (474a6f70)
* Add ‘xvfb-run’ as globally available binary (#662) (87850eac)
* Add ‘aws’ as globally available binary (#661) (6fd3e461)

## Release 5.17.3

* Add ‘kill’ and ‘ssh’ as globally available binaries (#660) (5e576a28)
* Remove version selector (9ad1d466)
* Timerify (de)serialize functions (0e04f1e4)
* Update docs (935a7066)

## Release 5.17.2

* Fix external require.resolve (resolves #657) (c188a7a7)

## Release 5.17.1

* Any is OK (28ad084b)
* Fix (de)serialization of maps (resolves #656) (3ab95ef7)
* Fix graphql-codegen config filter (resolves #658) (24c13553)

## Release 5.17.0

* Fix --watch after refactors (db2a2616)
* Improve `getHasStrictlyNsReferences` and traverse into re-exports (9d75e0d4)
* Restore imports in Footer.astro (c836517a)

## Release 5.17.0-canary.2

* Bring `isGitIgnored` into fields of sanity (1075b305)
* Get rid of `internalWorkspaceFilePaths` and handle in `analyzeSourceFile` (d3d7fa08)
* Minor refactor (b968da8f)
* fix(Auto-fix): ignore is not applied (#654) (32ddd715)
* Refactor ignore deps/bins + config hints (99d978a1)
* Fix formatting (693192b9)
* Fix more links (2ceee1a0)
* Update urls from webpro/knip → webpro-nl/knip (70df0916)

## Release 5.17.0-canary.1

* Simplify pseudo re-export handling (94cfb94c)
* Refactor `importedAs` to map (#647) (0b1ce0b9)
* Always return TS resolved module (resolves #651) (4055e314)

## Release 5.17.0-canary.0

* Refactor internal dep graph & module resolution (f5faf52b)
* Defer principal deletion if --isolate-workspaces (6616fe1e)
* Start support for dist → src file path rewiring (4408a34e)
* Fix module resolution across multiple dependent workspaces with incompatible tsconfigs  (#611) (f99e5f1f)
* Just get that symbol (resolves #647) (bbc5f1a1)
* Support GraphQL Config in graphql-codegen plugin (#645) (8b12dedb)
* Add typescript-eslint to projects using Knip (4ccc696b)
* Add issue reproduction template for monorepo (199f0307)
* Remove obsolete file (6f9b8c85)
* Webpack plugin: support absolute entry paths (#640) (fb5023ec)
* Remove unused file in integration test (cb436119)
* Add anonymous const (efb45c86)
* Refactor configuration hints + ignored binaries/dependencies (8d838e83)
* Supported 'oneOf' rule in webpack plugin (#644) (a8a12372)
* Add UnoCSS plugin (#638) (46ec674f)
* fix: isFile/isDirectory edge cases (#635) (dabccf14)
* Update sponsor link (#637) (c3adf192)

## Release 5.16.0

* Document namespace imports, extensionless imports, svelte $app path alias, and some edits (20f55022)
* Add @hyoban to sponsors page (79918d3d)
* feat(plugins): add plugin for lost-pixel config (#630) (24772ca0)
* fix(plugin-commitlint): handling of `parserPreset` when it's not a string (#632) (d7b2545b)

## Release 5.15.1

* Add `typeof` case to `isConsiderReferencedNS` (#626) (696d2a7e)

## Release 5.15.0

* feat(plugins): add plugin for syncpack config (#629) (44005ef2)
* Fix edit link (da2a5c80)

## Release 5.14.0

* Add @nicoespeon to sponsors page (f469fc47)
* Bump cache version (f8837c87)
* Fix and extend commitlint plugin (resolves #628) (b52118ed)
* Refactor dep graph (#626) (004ae3bc)
* Respect `.git/info/exclude` (resolves #613) (29a0bdc4)
* Add "using knip in ci" page to docs (closes #608) (2f752724)
* Replace kleur with picocolors in docs (cca7a24c)
* Revert "Temporarily disable slonik integration test" (1823d1fa)

## Release 5.13.0

* Update some (dev) dependencies (c6121382)
* Temporarily disable slonik integration test (67c03de8)
* Return empty source file for foreign files (resolves #623) (dc2f5088)
* feat(plugins): add plugin for xo config (#621) (96f91df9)
* Fresh project overview, auto-format (79cf6316)

## Release 5.12.3

* Fix cache-location typo (fixes #624) (6481d123)
* Update lockfile (2da82992)
* Add `npm init @knip/config` option and features overview (ea9b106a)
* Add `@knip/create-config` (4a7bac37)

## Release 5.12.2

* Fix exported identifier refs for re-exports (fixes #622) (7b4da85e)
* Include package.json#types and typings (resolves #607) (296ab06d)
* Lint monorepo (ab8952bd)
* Disallow console.log (47020f54)
* Remove console.log (b23756f2)

## Release 5.12.1

* Fix `configFileDir` in recursive config loader in eslint plugin (fixes #570) (20e44c67)
* Allow workspace patterns to be relative (fixes #617) (6c713994)

## Release 5.12.0

* Increase readability of integration workflow (119daf09)
* Rename fixture/test to cli arg name (83d840f3)
* Extend capacitor plugin for android + ios configs (closes #604) (4af5c865)
* fix: route handler extensions (#606) (9d05b6ac)
* Update constants.ts (#605) (4dc1f6bc)

## Release 5.11.0

* Install peer deps in workspace (9bf286fe)
* Fix some module/resolution configs in fixtures (9d319cf8)
* Add support for isJSDocImportTag (introduced in TS v5.5.0) (504738df)
* No more back & forth (014ca2a4)
* Back & forth (589ee177)

## Release 5.10.1

* Update some dependencies (57c21b0c)
* Add new arg to defaults in tests (b7db9762)
* Fix `storybook core.builder.name` handling (resolves #602) (8ad04069)
* Temp job with Node.js v22 + typescript v5.5-beta (21bbf28c)
* Back & forth (f054070c)

## Release 5.10.0

Please see https://twitter.com/webprolific/status/1782695065380684124 for a walk-through of the main features in this release (the commits below don't cover what was in the canary [releases](https://github.com/webpro/knip/releases)).

* vitest: add bench file extension (03b93841)
* Fix Windows path issue (92de4118)
* Add debug log for raw watch events (49862ab5)
* Check and remove unused vars/imports (f3694ee5)
* Fix up some dev commands (6c511ca9)
* Update docs (988b6320)
* Format (01a27671)
* Add monorepo demo folder (3c9d9ad2)
* Don't re-analyze files that are still in the unused files cache (4d337b01)
* Add file removal to auto-fix (c5fe4c25)
* Mark issues as fixed in fix mode and print in grey in default reporter (d4324f82)
* Add file removal to auto-fix (34abc720)
* Fix CLI help text (a430a1ff)
* Remove obsolete workaround in tag helper (5cb4f511)
* Minor refactor (a98a7fc6)
* Tiny bits of fast + safe in import refs finder (7893d0f3)
* Remove obsolete `by` set (359abc15)
* Refactor to improve tests + readability of member access handling during AST traversal (c0323713)
* Rename and throw a few things around (a1f49876)
* Update integration test cmd (b140cbd0)
* Skip test in bun (17b90a37)
* We weren't testing much due to a bug in Bun (https://github.com/oven-sh/bun/issues/10353) (48b883de)
* Fix up some fixture pkg names (9af92afb)


Please see https://twitter.com/webprolific/status/1782695065380684124 for a walk-through of the main features in this release (the commits below don't cover what was in the canary [releases](https://github.com/webpro/knip/releases)).

## Release 5.10.0-canary.4

* Add support for destructuring pattern on member access of (re)exported symbol (933dd35c)
* Fix up some fixture pkg names (73aacf22)

## Release 5.10.0-canary.3

* Support deeper levels of tracing when looking up id refs (3ecbbf22)
* Prevent circular refs in `isIdentifierReferenced` (705896f0)

## Release 5.10.0-canary.2

* Enable biome code actions on save (9d89b75e)
* Support import-equals w/ ns.access (438280ef)
* Add InvokeAI to integration tests (knip-bun + production mode + auto-fix) (82f19f3b)

## Release 0.0.0-metro.1

* Keep track of analyzed files per resolver (890375f0)
* Add `@expo/metro-config` to metro plugin enablers (9ad7a3ca)
* Fix version (bd710560)

## Release 5.10.0-canary.1

* Lockfile (b217e4d6)
* Organize imports (7e0826db)
* Fix pnpm workspaces glob pattern in fixture (2bf13977)
* Remove micromatch and use picomatch everywhere (58006d51)
* Replace `@npmcli/map-workspaces` with internal util (6072d3f9)
* Replace `@npmcli/package-json` with internal util (e684ed8a)
* Move dev dep (fd11d3b8)
* Replace `@pnpm/workspace.pkgs-graph` with internal util (94ae6b5a)
* Prefix error message with red "error" (2d2f0c5e)
* Update docs (close #583) (9d022009)
* Update docs, add "configuring project files" (f206428d)
* Return `development` as default env in babel plugin (resolves #593) (630f85ef)
* Update astro (c0c75e02)
* Fix/update docs (0d961581)
* Minor refactorings, add a few comments (0d68820c)
* Add oclif plugin (46805cbc)
* Add cucumber.js plugin (09a0e904)
* Use bun to test (f95eaac5)
* Remove tsx from dependency lists (0975a641)

## Release 5.10.0-canary.0

* Update docs (d4b2995a)
* Add --watch (incl. required refactor) (71b7dc79)
* Update/fix specs (507daa6e)
* Consistent --help description (90a1d8b3)
* Fix up workspaces-dts test/fixture (817b24e1)
* Refactor serializable import and export map types (e622a147)
* Refactor module resolution a bit (e8e61083)
* Add --cache (and --cache-location) (fb9a1aa8)
* Add knip-bun bin (b685723f)
* Early exit in glob fn (beb2c5dd)

## Release 5.9.4

* Timerify `isMatch` (5d516205)
* Update performance doc (66ed0082)
* Update some dependencies (9366edd5)
* Downgrade tsx (c61cb0ae)
* Lockfile was removed (0f207d47)

## Release 5.9.3

* More npm → bun (62d42b00)
* Remove npm lockfile (ee5fb25b)
* Restore `@pnpm/logger` for Yarn (ace0d246)

## Release 5.9.2

* Temporarily disable bundows install (88e6ac34)
* Housekeeping (f923d69b)
* bun install --ignore-scripts --frozen-lockfile (b870d4d8)
* Fix up source code (cc94ba17)
* Support, organize & pick tests to run tests in Bun + Node (c4b4001c)
* Fix other code (8ee92e0a)
* Use bun:test (e6dd4268)
* Fix up source code (52a8e0da)
* Update CI workflows and keep using npm/npx (ccd9d954)
* Go Bun + Biome (2fe8436d)
* fix(plugin/babel): bypass directly required plugins or presets in babel config (#590) (77329afe)

## Release 5.9.1

* Update a few dependencies (fc631055)
* Ignore whitespace-only lines from `.gitignore` files (close #589) (202ed86a)
* Imply --production if --strict (f915b91b)
* Update docs (#583) (e64e6ad7)

## Release 5.9.0

* Lockfile (c0b49923)
* feat: support all vitest built in reporters (#588) (038c4855)
* feat: support commitlint plugins key (#587) (9b4e0d9e)
* Add plugin for moonrepo (moonrepo.dev) (#579) (770f6588)
* Fix typos in docs (#582) (359e6dfe)
* Add engine field verification (#581) (f6684ada)

## Release 5.8.0

* Add support for CommonJS `exports.key = value` syntax (closes #580) (404236bd)
* Add more links to sponsor option (f5a5f8ae)

## Release 5.7.3

* Update dependencies (d580b6e0)
* Fix `route.ts` pattern in next plugin (dc021ded)

## Release 5.7.2

* Auto-format mdx (161f5dc5)
* Add mdx to remark formatter (440d72ba)

## Release 5.7.1

* Formatting (9e5e5395)
* fix: add jsx extensions for next default file convention (#578) (bd12fe19)
* Add tea.yaml (682c1627)

## Release 5.7.0

* Add test + fixture for updated module resolution (478ab3f9)
* Start using `resolve` as the default module resolver (47ff3eb4)
* Add TypeScript repo to integration tests (21895963)
* Minor refactorings (ee551274)
* Minor fixes in git ignores parser (e455527f)

## Release 5.6.1

* Fix recursive tsconfig extends retrieval (resolves #574) (78f6a785)
* Don't return `null` for vitest environment (fixes #575) (473d7abb)

## Release 5.6.0

* Rename IgnorePatterns → EnablerPatterns in plugin template (2b996ab8)
* Add `testSequencer` and `globalSetup` to jest plugin (bc274b14)
* Add wrangler plugin (#572) (82c84be3)

## Release 5.5.0

* Minor fixes in git ignores parser (ec11f376)
* Remove unnecessary check for `node.isTypeOf` (resolves #571) (4c3160bb)
* Extend import extraction from source file pragmas (resolves #571) (07998647)
* Rename for prettier --performance display (5399182b)
* Refactor some internals (54d2634d)
* Update some docs/templates (23f98dec)
* Add reproduction templates and link directly (4c45d3df)

## Release 5.4.0

* Add option to ignore class and enum members in the report (resolves #387) (8e7dc6be)
* Fix gc for --include-libs (0c202aa4)
* Add note with `npx knip` (close #389) (d06fd4ce)

## Release 5.3.1

* Fix `pos` for computed props in class members (closes #360) (6ce065ea)
* Skip work if `classMembers` are not included (be1eb08c)

## Release 5.3.0

* Document the new `--include-libs` flag (914febb5)
* Add --include-libs flag and do an extra `findReferences` for unused exports (resolves #522, closes #534) (2038d5e4)
* Extend re-exports-ns-types fixtures (closes #529) (8e04d6a9)
* Add --files flag (shorthand for --include files) (6eda950f)
* Move `handleReferencedDependency` to separate module (2d8b432c)
* Correct link in documentation for eslint config files (#569) (05011dcb)

## Release 5.2.2

* Dedupe extensions (00141f01)
* Don't override async compilers (fixes #566) (ad3edbfb)
* Add known issue, improve docs re. auto-fix & tags (92f5c1bb)

## Release 5.2.1

* Restore `css` in foreign extensions (resolves #563) (032b1d7b)
* Accept `workerDirectory` array (closes #562) (1f8ad1d6)
* Fix default-exported types & interfaces (resolves #498) (892501d2)
* Fix Windows EOL (f48475bc)

## Release 5.2.0

* Improve cleanup after --fix (closes #418) (5133ca35)
* Support tagged re-exports and (dynamic) imports to ignore unresolved imports (c5d030d8)

## Release 5.1.6

* Deprecate --experimental-tags, use --tags (3541bc75)

## Release 5.1.5

* Add "path aliases in config files" to known issues (closes #558) (fb92db7b)
* Add eslint + tanstack/table and give those columns a bit of room to breathe (d33beabf)
* Respect custom compilers (6cb3a497)
* Exclude foreign file extensions from virtual file paths in module resolver (closes #559) (491c1ae5)
* Update script-parser.md (#484) (36162333)
* Each plugin's default export `satisfies Plugin` (a70c78cf)

## Release 5.1.4

* Support shorthand when --ignoreExportsUsedInFile (fixes #555) (754673c0)
* Create empty source file when necessary (resolves #554) (b81a7916)

## Release 5.1.3

* Add eslint to integration tests (0110d7d5)
* Plugin list (bf82f179)
* Minor refactoring (6b5be426)
* Migrate msw plugin (15df5d09)
* Minor refactoring (2907b9dc)
* Update docs re. new plugin API (bc35d5df)
* Fix docs generation (1be4f5f0)
* Update docs re. new plugin API (52493b97)
* Housekeeping some types & imports (89de974c)
* Add scrappy script to print some plugin table (baa908af)
* Update scripts & templates (03acdcec)
* Migrate plugin tests (ddb2a80d)
* Migrate plugin fixtures (11670706)
* Move ESLint config loader (70b7aef1)
* Migrate plugins (7bdf5441)
* Refactor plugin API (b2f5133d)

## Release 5.1.3-canary.0

* Dogfoodin' is underrated (ff70dc3e)
* Refactor module resolution (closes #504, closes #511, closes #550) (318d28e6)

## Release 5.1.2

* Use sanitized specifier for virtual file path (#202) (3cd351f9)
* Allow root package.json without name (resolves #539) (715342b5)
* Add `touch` to globally ignored binaries (resolves #552) (8539b9eb)

## Release 5.1.1

* Skip work, gc file manager (7dd06519)
* Minor refactoring (70e09008)
* Add documented type for second string arg to compilers (#548) (407a4736)

## Release 5.1.0

* Work around Argos issue (a641d848)
* Update docs (closes #536) (ab67d2c7)
* Use Node.js v20 for integration tests (d49daa94)
* Skip dynamic import calls (closes #544) (cf03a06f)
* Use bun's import() if available in loader (e0fb321f)
* Add Mock Service Worker - msw (#513) (14043487)

## Release 5.0.4

* Update dependencies (e4108726)
* Resolve JS files referenced by TypeScript declaration files if possible (#503) (11d15558)
* Add linthtml.config.js as config to linthtml plugin (#533) (6906c630)
* fix: simplify husky plugin (#537) (35b0f9af)
* Remove colon (02bf8bf2)
* Add sponsors page (0074cc19)
* Update dependencies (6f61a158)

## Release 5.0.3

* update types for include/exclude configuration options (#532) (c7896e63)
* Added support for eslint.config.cjs and eslint.config.mjs files (#525) (d93c7472)

## Release 5.0.2

* Update dependencies (f03b0779)
* Return undefined if no manifest (shouldn't happen anyway) (7a815e28)
* Fix config to entry file patterns in tailwind plugin (d5bb530d)
* Fix knip --version command (#519) (1c989c9b)
* fix truncated JSON output with JSON reporter (#512) (fabacabf)

## Release 5.0.1

* Close enough (e16609b5)
* Update dependencies (d22f8e35)
* Add missing jsx/tsx extensions to route/default files for Next.js (#507) (5a1ebb70)
* fix: make nx crystal work with standalone plugins (#509) (d6f8f4dc)
* Add support for  cypress/support/commands.js file (#508) (78058cfd)
* Fix typos (0ab28691)
* Update version in json schema (b2501126)

## Release 5.0.0

* Update config for v5 (c6ae93a6)
* Add v5 release post (9649c937)
* Update docs (df7d0a9b)
* Dogfoodin' is underrated (4fab774d)
* Reorganize exports/types and nsExports/nsTypes issue types (resolves #475) (41c20177)
* We're all set (87917dfb)

Also see https://knip.dev/blog/knip-v5 for more details

## Release 4.6.0

* Update dependencies (34df6ee2)
* Support husky v9 (#500) (1edc9fbf)

## Release 4.5.0

* Update dependencies (0d598b5f)
* Use isGitIgnored directly if available, rename fn getter (0963c966)
* Add webpack-cli to webpack plugin enablers (resolves #492) (1960a67e)
* Add/move link to commit hooks (#500) (91bef851)
* Add vercel-og plugin (resolves #489) (78e406c2)
* feat: improve markdown reporter (#502) (0b029233)
* Ignore @types/bun by default (#501) (d99f7d80)

## Release 4.4.0

* Update dependencies (5082f5a5)
* Add note to minimal repro (cb985937)
* feat: support nx crystal for nx plugin (#496) (1ce0b401)

## Release 4.3.1

* Make integration tests pass (5a7a80ae)
* Update integration tests (5bca4041)
* Add link to GitHub search for projects using Knip (bdd3c7ba)
* Safe-guard fixes (closes #486) (cf3761ba)
* Add silent and shell-mode boolean flags to pnpm resolver (resolves #491) (2d5c0b57)
* Filter dependencies in vitest plugin for vite plugin (#334) (d81a00f7)

## Release 4.3.0

* Remove unused var in husky plugin (9698660a)
* Add Svelte to projects using Knip (6d9684c6)
* Add yorkie plugin (a6baf030)
* Update Eleventy plugin config paths (#490) (476af189)
* add 'playwright-ct' config entry. resolves #487 (#488) (bf38d48c)

## Release 4.2.3

* Remove `@pkgjs/parseargs` now that Bun has `util.parseArgs` (ada0597c)

## Release 4.2.2

* Update dependencies (faec4d60)
* Add .json ext to ts config path if necessary (resolves #480) (fe3d17db)
* Fix npm aliases (resolves #474) (470437dc)
* Add `deploy` to binaries not following the --require convention (closes #477) (ad1ff7f8)
* Hide plugin pages from sidebar (db4cb7af)
* Update dependencies (0eccd537)
* Add introduction video to front page (0741b705)

## Release 4.2.1

* Add resolver for ts-node (resolves #470) (3343ea46)
* docs: add project to index.mdx (#471) (5202a28f)
* Add guide for CommonJS (closes #465) (2d17925d)

## Release 4.2.0

* Auto-format (0e65cfba)
* Update docs (91465e6f)
* Update netlify plugin/test after the refactor (e0eba0c1)
* Add missing fixture file (877a95ab)
* Remove unused helper (093bbaa8)
* Include class members when dogfooding (d9c2eb49)
* More comprehensive/consistent options for plugin tests after the refactor (95dac2b7)
* Tiny refactoring in github-actions plugin (f08a828c)
* Update plugins after the refactor (e786b603)
* Refactor to unravel and separate concerns better (756bcdd7)
* Improve some member and function names (6145ce17)
* Fix typo in comment (7a5c1b0b)
* Refactor `npm.findDependencies` into `DependencyDeputy` as `analyzeManifest` (864fa843)
* Improve some member and function names (05766734)
* Tiny refactoring in vitest plugin (37724858)
* Use own PackageJson (with plugins) where possible (d314123c)
* Add Netlify plugin (#466) (3a8fe857)
* Check for node_modules presence instead of isInternal for Eleventy plugin (#462) (c0b23b56)
* Edit docs (59e341fd)

## Release 4.1.0

* Add bun script visitor (df869d7a)
* Add bun binary resolver (70e936a4)
* Ignore bun being a runtime dependency (0a947440)
* Make `hasImportSpecifier` reusable (ab39cf29)

## Release 4.0.4

* Add additional test & fixture for eleventy plugin (dbf8c02c)
* Fix up toEntryPattern → toProductionEntryPattern in Eleventy plugin (9809d760)
* Clean up debug output a bit (81c5e310)
* Doc tweak (66f88c21)
* Convert some arrays to sets (a28c624d)
* Rename fixture paths-workspaces → custom-paths-workspaces (85224add)
* Handle passthrough copied files in Eleventy (#460) (9f224003)
* Add Eleventy data directory as entry pattern (#454) (85e7fe24)

## Release 4.0.3

* Add pos to JSDoc import specifiers (70a1f7f6)
* Fix pos for `module.exports` identifiers (20d8287c)
* Add a few edge cases to webpack plugin (3323ef39)
* Add `postcss-cli` to postcss plugin enablers (5ece2a1b)
* Improve stylelint plugin (a11b5e53)

## Release 4.0.2

* Regenerate plugin list (23735cf0)
* Update dependencies (80654ac9)
* Minor updates (cc9d0643)
* Restore schema.json (fixes #455) (bd873cf1)
* use the 'String#endsWith' method instead (#451) (fb7c7976)

## Release 4.0.1

* Increase visibilty for --experimental-tags (4cc6c9f5)
* Optimize and simplify --experimental-tags (9bed9376)
* Update version number in Getting started (11c6cc84)

## Release 4.0.0

* Add release notes for v4 (e611b29)
* Add SourceGraph tweet/project (ad224c4)
* Update & duplicate license file (468ba3c)
* Update pull request template (a95967f)
* Fix Vercel deployment issues (206b5c8)
* Make plugins export default (d8babee)
* Fix c8 command (9482c09)
* Update Vercel config default: v3 → v4 (6c5b9fb)
* Update dependencies (ecaabfc)

Also see https://knip.dev/blog/knip-v4 for more details

## Release 4.0.0-canary.15

* Restore workspace.config in debug output (6399fc93)
* Fix case with namespaced star import (resolves #452) (c8aaa0d7)
* Remove some obsolete comments in fixtures (a54777a3)

## Release 4.0.0-canary.14

* Add test coverage, docs, and support for members for --experimental-tags (deb06f4f)
* Add `patterns` to glob debug output (187225c7)

## Release 4.0.0-canary.13

* Update schema.json version to v4 (96b1d4ef)
* Fix case in namespaced member access (bfae2848)
* Fix handling of leading slash in gitignore item (d13c1943)
* Update perf/compiler docs (497c967b)
* Improve debug output (97569fd0)
* Exclude class members by default (4751d0a1)

## Release 4.0.0-canary.12

* Improve some names (b2d0958d)
* Custom incrementally update pico matcher (90d0b686)
* Destructure `path` imports (6c4e2904)

## Release 4.0.0-canary.11

* Cache and use glob ignores per working dir, add micro-optimizations (5b9dcb61)

## Release 4.0.0-canary.9

* Dogfoodin' is underrated (ae9f69a9)
* remove slash before fragment in pagefind component (#447) (b744b8f9)
* fix: plugins eslint-config-next is always reported as unused (80958d9b)
* Restore and isolate finding unused class members (plus `findReferences`) (62c17689)

## Release 4.0.0-canary.10

* Don't use `options.ignore` for `gitignore:false` and don't mutate it (bf5d2262)
* Convert path to posix for Windows (d758afb4)
* Fix ignores in intial root walker (ba516b55)
* Mostly formatting (7c603340)
* Fix ignores cache (for test runs) (66d70a01)
* replace globby with much faster code when gitignore enabled (#426) (08381ba3)

## Release 3.13.2

* replace chalk with picocolors (#448) (7521a4c)
* Omit negated entry patterns in tsup plugin (5f80d0c)
* Update theme color for docs (46b787d)
* Update issue templates & add pull request template (2c3f166)
* Extend tsup config file patterns (176f881)
* remove slash before fragment in pagefind component (#447) (8bcbe67)

## Release 3.13.1

* Use JSON loader in typescript config (fixes #420) (ed4e691)
* Wrap up Next.js plugin config (5c9cc51)
* fix: allow router handlers to be jsx files, add default.{js,jsx,ts,tsx} (#441) (bb39a57)

## Release 4.0.0-canary.8

* Regenerate docs/fix up some formatting (4f793e94)
* docs: add info about markdown reporter to docs (#428) (89958d5c)
* feat: add markdown reporter (#419) (e865021e)
* Fix compiler exports (a71027b3)

## Release 3.13.0

* Generate/format Markdown (828a2c52)
* Wrap up unbuild plugin (e1f9f66c)
* Add `set` to the ignored binaries list (closes #429) (1198ccc3)
* Add `unbuild` plugin (#435) (d9d48d5c)
* Add support for JavaScript GitHub Actions (#432) (7f5254fd)
* fix: add .test-d to vitest entry files (#436) (a3a17e19)

## Release 4.0.0-canary.7

* Dogfoodin' (ebb252a3)
* Add vitest to resolver list so it does not fallback to default and parse -r args (fixes #417) (0cd4c1a8)
* Temp fix exports (ba393219)
* Refactor config to auto-install (overridable) compilers (8c1c7a2a)

## Release 3.12.0

* Fix `tests/` → `test/` (closes #405) (8850c690)
* Add Vue plugin incl. Webpack config support (81d981bf)
* Support `parserOptions.parser` in eslint plugin (0a8aebbc)
* Make webpack dependency finder reusable (f7b8fae2)
* docs: add info about markdown reporter to docs (#428) (b70b957b)

## Release 3.11.0

* Add support for (local) `reporters` in playwright plugins (resolves #423) (5ff8420d)
* Fix 11ty entry file patterns (82cc7125)
* Filter out invalid binary names (fixes #421) (23d5f377)
* feat: add markdown reporter (#419) (b2c98293)

## Release 4.0.0-canary.6

* Reduce red squigglies (846b4a05)
* Add visitor for `ImportTypeNode` (656bc1a7)

## Release 3.10.0

* Update dependencies (6349aab)
* Work the docs a bit (d36c86e)
* Fix up some formatting (91c230d)
* Add vitest to resolver list so it does not fallback to default and parse -r args (fixes #417) (711d4b6)
* Add visitor for `ImportTypeNode` (514cbed)

## Release 4.0.0-canary.5

* Add undocumented --experimental-tags flag (usage: `--experimental-tags=+internal,-alpha`) (5c30abf8)
* Use noop when --debug is not enabled (5ad2ad9d)
* Enforce --no-progress for --debug or --trace (ee302377)
* Fix member pos (072021b6)
* Add `inspect` helper to log objects with full depth/length (f3c66c57)
* Extract `createSerializableMember` function (f8e18cd8)
* Improve coverage and add tracing for export lookups (db8b8a49)

## Release 4.0.0-canary.4

* Remove unused function (04c7f384)
* Fix ns re-export assignment (ae6f11c3)
* Refactor `isIdentifierImported`, add --trace flag, add `exportLookupLog` (38062571)
* Refactor some internal names (fab10879)
* Add custom header component with version selector (f29976de)
* Fix some TS issues (8b4a9cee)
* Update dependencies (4168b659)
* Keep moving (4729cf99)

## Release 3.9.0

* Fix some links (2ab781ba)
* Add `find` to ignored global binaries (closes #413) (80ac4d2d)
* Add wireit to schema.json, improve consistency (37e58a8c)
* fix: docs internal link replacement (#415) (18dea2a5)
* Add LintHTML plugin (#408) (0c688542)
* Add wireit plugin (#407) (45ff78c8)
* 11ty plugin (#404) (27632efe)

## Release 3.8.4

* Update dependencies (462615b3)
* Add custom header component with version selector (4dec0e2d)
* Update edit link (06459d48)
* Add Next.js global-error entry file (#406) (f929c41e)
* Rewrite /v4 to v4 branch deployments, v3 = default (2b7418e5)
* Auto-format md (38f6d4c5)
* Keep moving (818838c9)
* Fix some TS issues (4da056e1)

## Release 4.0.0-canary.3

* Add `knip.config.ts` and `knip.config.js` to default config locations (resolves #182) (8fc86f26)
* Edit/format docs (4fc721f6)
* Additional refactorings for /v4 (ade4c218)
* Serve docs at /v4 (06f70c55)

## Release 4.0.0-canary.2

* Patch config in integration test repos (2cdfae26)
* Use `ignore` patterns to filter reported issues (i.e. not only to negate entry/project files) (a24918cf)
* Improve handling of re-exports (incl. from entry files) (3240017f)
* Fix individual fix booleans for `analyzeSourceFile` (b2094947)
* I mean maybeAddAccessExpressionAsNsImport (d04d1311)

## Release 3.8.3

* Update dependencies (1b9603ec)
* Fix individual booleans for `analyzeSourceFile` (7b822cb0)
* Swap block for consistency (753303ae)
* Fix workspace hints in production mode (ed834e97)
* fix: use svelte plugin options from user config (#401) (77e7c661)

## Release 4.0.0-canary.1

* Fix regexes in ignored bins/deps for non-root workspace (89e3f884)
* Remove unused else block (387c6eb0)
* Improve name maybeAddNamespaceAccessAsImport → maybeAccessExpressionAsNsImport (eae8c7bb)
* Improve support for mediated re-exports (56dc6470)
* Run issue fixer if only --fix-type argument is provided (11b0c073)
* Support multiple fixes for the same exported identifier (e.g. function overloads) (e2110a07)
* Refactor for clarity (e4be46c9)
* Skip some work by handling only top-level import/export assignments (235aa45b)

## Release 3.8.2

* Run issue fixer if only --fix-type argument is provided (fcbaed09)
* add sveltekit entry patterns (#393) (70551205)
* Fix `postcreate-plugin` script (4fd44b6f)
* Edit docs (ef999c49)

## Release 3.8.1

* Fix regexes in ignored bins/deps for non-root workspace (resolves #392) (82635fc8)
* Update dependencies (9456b898)
* Publish (4821581f)
* Add draft "slim down to speed up" (7faa5d6f)

## Release 4.0.0-canary.0

* Remove `findReferences` and make imports & exports serializable (961e20a7)
* Temp disable integration repo that now shows issues (ae9a9d98)
* Update dependencies (25defaca)
* Add draft "slim down to speed up" (49027af5)

## Release 3.8.0

* Document `--isolate-workspaces` + reword principal → program (c5f98fd)
* Add mem usage + major gc events (f72bf62)

## Release 3.7.1

* Filter out some odd stuff in custom settings resolver in eslint plugin (790646a2)
* Improve handling of `import` type nodes in JSDoc (8c3d77c9)
* Deduplicate workspace names (#391) (28d43bb1)

## Release 3.7.0

* Move `@npmcli/package-json` from dev → dependencies (2157f57e)
* Introduce experimental --fix feature (resolves #63) (cf1619c6)
* Move tweets to mock (2f8e78f3)

## Release 3.6.1

* Respect `isIncludeEntryExports` for class & enum members (#360) (fae9b759)
* Edit "handing issues" (7c3d2df0)
* Timerify `getImportsAndExports` (7c614b7b)
*  Add "unresolved" to `issueTypes` in JSON Schema + sort (e44a0330)
* fix(schema): Added "binaries" to `issueTypes` (#385) (efd607cb)
* Add sponsorship copy + funding.yml (bb5a9835)
* Improve guidance for newcomers through configuration topics (closes #384) (e32011f2)

## Release 3.6.0

* Update/sync dependencies (a2060f7e)
* Improve and support regex in `ignoreBinaries` and `ignoreDependencies` (resolves #315, resolves #383) (40f9791a)
* Add "findReferences" to performance page (a11a6f3f)
* Log message about 404 file edge case in debug mode (72c50041)
* Improve names and readability a tad + skip work if `nsExports` or `nsTypes` is excluded (a288c3eb)

## Release 3.5.1

* Add `snapshotResolver` option to jest plugin (closes #291) (95bf66c2)
* Add argos-ci/argos repo to integration test suite (35adacf6)
* Add some projects using Knip to homepage (130a35d8)
* Improve regex for `astro check` (b6c78166)
* Import less underscores in plugins (d5918f1e)
* Try to make plugin template a little bit more accessible (855337f4)
* Clarify when plugins are enabled (69662986)
* Improve heuristic for enabling node-test-runner plugin (1f784b48)
* Add `xargs` to ignored global binaries (963eb4e8)
* Rename module name helper (db8f01aa)
* Use `basename` and `extname` over `endsWith` for file names (0a582379)
* Fix sitemap (aeb91376)
* Fix gitignore item (0ee4f253)

## Release 3.5.0

* Ignore generated files when in md linker checker (beb5c41c)
* Fix test for absence of test config in vitest plugin (3b1135bc)
* Move "script parser" section to dedicated feature page to make entry files more accessible (c2ff2b39)
* Add common pattern to config file patterns in vite and vitest plugins (302798e8)
* Add extensions to config file patterns in webpack plugin (1f857a4e)
* Add unused img to assert it does not end up as unused dependency or file (18ff2b9b)
* Fix up plugin doc template (d69c4a58)
* Remove generated files (85307206)
* Fix contributors list (953fc12d)
* Remove "new" button (b2fdfc07)
* Update link in CLI help text (cf2c50d5)
* vitest: Detect whether coverage is enabled in npm scripts (#378) (9fc7d1f4)

## Release 3.4.0

* Refactor module resolution for non-std files + group related tests (fixes #376) (1154a091)
* Move `@types/node` to peer deps + include `node` types with compiler options (closes #317) (e7c26d9c)
* Fix Windows issue when trying git command to get hooks path (resolves #377) (b8544094)
* Sort keywords (73845d0a)

## Release 3.3.5

* Update dependencies (7b818018)
* Improve consistency (fba7a0a9)
* Swallow errors for git init cmd (81c57365)
* Add extra favicon/manifest meta files (c10f4a97)
* Edit performance page (43725198)

## Release 3.3.4

* Add page about performance to docs (7513521)
* Improve caching for relative paths in module resolver (6292c7f)
* Add nice tweet to testimonials (f947b0a)

## Release 3.3.3

* Include lockfile change in release commit (6cb92b3)
* Don't sanitize `virtual:*` imports (resolves #370) (9697689)
* Add TanStack/query to integration suite (09f7a58)
* Don't complain about `ignoredWorkspaces` without a `package.json` (42dbfce)
* Rename test + fixture (flow-node → export-declaration) (ecee44b)

## Release 3.3.2

* Edit configuration page (9d7eccf)
* Add missing test to nx plugin (2fb17d2)
* Add `includeEntryExports` to workspace config in TS and JSON schema (1a848d9)
* Fix errors with space-separated include/exclude arg (ec64c07)
* Return stdout, stderr, status from `exec` test helper (f0ae9e7)
* Add footer w/ license, name, links (9499c89)

## Release 3.3.1

* Add referenced optional peer deps to docs (6b97b9c)
* Don't report optional peer dependency as unused if hosts have the peer as optional (8b20201)
* Auto-format Markdown (1936c6d)

## Release 3.3.0

* Fix up JSDoc visitor and try harder to find import types (70691ff)
* Add support for build.lib.entry paths in vite plugin (f6c1d93)
* Add `posDecl` to `exportDeclaration` visitor + support function declarations (#353) (5054906)
* Add `posDecl` to distinguish export identifier vs declaration (to `findReferences`) (e5eef1f)
* Add link to jiti issue (740eeb1)
* Add schema.json for JSONC (#320) (e7696e1)

## Release 3.2.0

* adds support for `package.json` shared prettier configuration (#368) (121015f)

## Release 3.1.0

* Throw for duplicate package names (closes #339) (8e1dca6)
* Override potentially expensive compiler options, just in case (c7234b7)
* Throw for invalid issue types when using include/exclude filter (closes #366) (4e42ff8)
* Remove `target`, `module` and `moduleResolution` from compiler option overrides (6407d4d)
* Mention MNWE/MRE in docs (db951b2)
* Exclude negated production patterns in default mode (resolves #352) (fca87f8)
* Don't try to load fake path in tsconfig-loader (7c80ad1)
* Add --isolate-workspaces flag (undocumented) (b0913ac)
* Add a few more testimonials 🧡 (0321a8d)

## Release 3.0.2

* Don't assume `symbols` to exist (fixes #367) (6713525)
* Fix link in readme (a11ef44)

## Release 3.0.1

* Add README.md to knip package (ef54583)

## Release 3.0.0

* Update dependencies (f709e24)
* Clean up some bits for v3 (9f1a42e)
* Add `line` and `col` in default reporter to issues that include `pos` (closes #335) (3547fc2)
* Run tests etc. across workspaces from root script (08aa7d7)
* Add minimal reproduction templates to docs (e2b5f0c)
* Fix up some links + plugin list (ede47e9)

## Release 3.0.0-canary.4

* Merge branch 'v3' (18e4e51)
* Release 2.43.0 (cbd69ea)
* Fix up name resolver in babel plugin helper (resolves #363) (a3a5fbb)
* Add config file paths to babel plugin (d7a07a0)
* Use `flowNode` pos if available for export declarations (resolves #353) (9e89be6)
* Lockfile (fb00e75)
* Add troubleshooting entry and known issues to docs (482dbf6)
* Tweak some styling (8ba65ea)
* Update dependencies (4f3cc85)
* Add remark-directive + housekeeping remark plugins (ce95fff)
* Formatting (e077a76)
* Fix up tweets + support >280 char tweets (a0e6cb4)
* Add cSpell settings (18563c6)
* Fix typos + link refs (3ee4bf3)
* Release 2.42.0 (e94ed72)
* Add tests with typescript@latest (c95e060)
* Add compat w/ typescript v5.3.2 (395c278)
* Release 2.41.6 (77e14ad)
* Update dependencies (a69fa9e)
* Fix error message (76c5b26)
* Add tsconfig.json to nx fixture (#358) (622848a)
* Use babel plugin to find dependencies from `babelOptions` in eslint plugin (resolves #357) (be9a14c)
* Go nuclear for fresh OG images (7d1f20a)
* Smoothen that scissors + remove border animation (16854a2)
* Lockfile (8e91b4b)
* Tweak some styling (36f91e3)
* Tune some docs (b909180)
* Add edit link (9d02ada)
* Release 2.41.5 (3c8b4d0)
* Bail out for node built-ins in module resolver + don't try to sanize absolute paths (b54f44f)
* Release 2.41.4 (5420b85)
* Fix ts files with ignored extension (fixes #354) (59a2373)
* Unique test titles (b3e97c0)
* Add --import argument to node resolver (resolves #351) (c0a9c5b)
* Use ESM loader for `.mts` extension (65f699b)
* Add some extensions to config file patterns in vitest plugin (e1ae62a)
* Release 2.41.3 (c10ea4d)
* Fix up plugin resolving in graphql-codegen plugin a bit (resolves #349) (ee83151)
* Add config file patterns for codegen plugin (resolves #348) (72b3add)
* Respect `coverage.disabled` in vitest plugin (resolves #347) (b1cd3da)

## Release 2.43.0

* Fix up name resolver in babel plugin helper (resolves #363) (a3a5fbb)
* Add config file paths to babel plugin (d7a07a0)
* Use `flowNode` pos if available for export declarations (resolves #353) (9e89be6)

## Release 2.42.0

* Add tests with typescript@latest (c95e060)
* Add compat w/ typescript v5.3.2 (395c278)

## Release 2.41.6

* Update dependencies (a69fa9e)
* Fix error message (76c5b26)
* Add tsconfig.json to nx fixture (#358) (622848a)
* Use babel plugin to find dependencies from `babelOptions` in eslint plugin (resolves #357) (be9a14c)

## Release 2.41.5

* Bail out for node built-ins in module resolver + don't try to sanize absolute paths (b54f44f)

## Release 2.41.4

* Fix ts files with ignored extension (fixes #354) (59a2373)
* Unique test titles (b3e97c0)
* Add --import argument to node resolver (resolves #351) (c0a9c5b)
* Use ESM loader for `.mts` extension (65f699b)
* Add some extensions to config file patterns in vitest plugin (e1ae62a)

## Release 3.0.0-canary.3

* Tweak some styling (760f516)
* Tune some docs (06d6214)
* Rename `isIncludeEntryExports` → `includeEntryExports` in user config (eae216b)
* Update dependencies + lockfile (e348ddd)
* Install astro-expressive-code and improve code blocks + theming (b2d5862)
* Add typescript to installation command (87e3618)
* s/Appraisal/Testimonials/ (506f30e)
* Add fixtures + test for workspaces with tsconfig paths + compilers (0324979)

## Release 3.0.0-canary.2

* Lockfile (86d6509)
* Update docs (0b0fd40)
* Add `isIncludeEntryExports` option, and respect it per-workspace (resolves #337) (96490c4)
* Fix contributors fetch headers (430ff9d)

## Release 3.0.0-canary.1

* Lockfile (fe9b0de)
* Add convenience scripts to root package.json (68bce74)
* Add line/col/pos to issue type `duplicates` (bd53755)
* Move typescript to peerDependencies (04c8c43)

## Release 2.41.3

* Fix up plugin resolving in graphql-codegen plugin a bit (resolves #349) (ee83151)
* Add config file patterns for codegen plugin (resolves #348) (72b3add)
* Respect `coverage.disabled` in vitest plugin (resolves #347) (b1cd3da)
* Add `corepack` to list of ignored binaries (d79728b)
* Remove problematic links (4be9ec9)

## Release 3.0.0-canary.0

* Initial commit for docs website (d47eba1)
* Update dependencies + lockfile (ff386bd)
* Fix astro plugin: ignore `@astrojs/check` in production mode (234672e)
* Rename reporter `jsonExt` to `json` and add `files` (resolves #307 #309) (0caf160)
* Use only exit code 0, 1 and 2 (a9441a8)
* Don't exclude types in production mode (5cfced2)
* Add module resolution cache to resolver (c565cbf)
* Add `pos` to import visitors and add to unresolved import issues (resolves #308) (50b8d7f)
* Rename reporter `jsonExt` to `json` and add `files` (resolves #307 #309) (c1937c5)
* Move `skipTypeOnly` flag to strict mode (2ea8ca8)
* Don't exclude types in production mode (5a8efe6)
* Remove --ignore-internal (it's now the default in production mode) (a6a9138)
* Stop testing in Node.js v16 (b9a9d7d)
* Set engines.node to >= 18.6 (58212c0)
* Update dependency that requires Node.js v18 (49ef4eb)
* Move ESLint to local workspace and migrate to flat config (9d08ead)
* Delete `--debug-file-filter` flag (93c4621)
* Go monorepo (5cf0568)
* Add `corepack` to list of ignored binaries (d79728b)
* Remove problematic links (4be9ec9)

## Release 2.41.2

* Distinguish jiti CJS and ESM loader, and clean up (fixes #328) (7a537a6)
* Simplify `isTypeModule` a bit (942fbc1)
* Update vite.config extension in vite plugin (48ce2f0)

## Release 2.41.1

* Refactor vitest entry resolver (c34a3df)
* Load .js module using native import call (fixes #290) (aeaf70a)
* Remove path from extend plugin:specifier in eslint plugin + simplify specs (fixes #343) (3a9e510)

## Release 2.41.0

* Fix integration.yml workflow (49d2157)
* Switch to jiti in `tryResolve` (3d8a245)
* Consider JSDoc tags of individual export specifiers + their parent declaration (3757140)
* Make `compilerOptions.paths` (and configured `paths`) absolute if no `baseUrl` (c9b3770)
* Add some module resolutions in vitest plugin (465d170)
* Add tsup plugin (af7a7bf)
* Respect `ignore` option for entry paths from manifest (587c6bb)
* Improve lazy ignore pattern builder (a77aa07)
* Re-apply cdd04fb (Don't add entry paths that should be ignored) (a8b46a9)
* Use a single centralized `isGitIgnored` fn (ffbe805)
* Remove obsolete comment (df4c020)
* Sync node-test-runner plugin entry patterns (5263ad3)
* Move tsx to separate module + reuse node resolver (fixes #344) (0451e23)
* Add --watch arg to node resolver (08483e8)
* Increase readability of `module.exports` visitor (4fb6239)

## Release 2.40.2

* Revert "Don't add entry paths that should be ignored" (fixes #341) (17ee32e)
* Minor comment fix (b89b0f6)
* Always try to give declaration nodes to get JSDoc tags (fixes #342) (7fec492)
* Return only top-level imports + `module.exports` visitor refactor (fixes #340) (0b789a0)
* More diverse id's (b634e6e)
* Add fixtures and coverage for postcss plugin (#338) (32205b5)

## Release 2.40.1

* Fix enabler text in node-test-runner plugin (0a3c214)
* Lint only isolated workspace in single workspace + strict mode (4ee774c)
* Don't add entry paths that should be ignored (cdd04fb)
* Sanitize initially unresolved specifiers (d9d736d)
* Don't sanitize `node:*` modules (8355b5e)
* Don't run link checker on tags (66a3d31)

## Release 2.40.0

* Fix up usage of `compact` (fixes #334) (1ef5da5)
* Add `docker` to list of ignored binaries (#333) (9916b73)

## Release 2.39.0

* Suppress report for `@astrojs/check` (#332) (fc2eea8)
* Add `bunx` to list of ignored binaries (#330) (548270d)

## Release 2.38.6

* Fix up remark plugin (cd0be45)
* Fix `pkgName`  for additional workspaces (d042d55)

## Release 2.38.5

* Regenerate docs (13849ef)
* Add fixtures around import calls access prop (#317) (4f95977)
* Unique test titles (7518192)
* Start using virtual file paths for common imported extnames (resolves #322) (0223be5)
* Reuse custom module resolver when handling referenced deps (fixes #319) (6d35bb2)
* Update dependencies (981dadc)
* Reuse `loadFile` and ignore fake requests (resolves #325) (008e3a7)
* Add DefinitelyTyped-tools to integration.yml (e37f15b)
* Extend imports-namespace fixture (#317) (150ef27)
* Housekeeping graphql-codegen plugin (8d9ee61)

## Release 2.38.4

* Ignore `--require` for `adb` program (4afe6db)

## Release 2.38.3

* Downgrade zod-validation-error (for Node.js v16 support) (fixes #321) (974216f)

## Release 2.38.2

* Update dependencies (805ac5e)
* Filter http url's out from script dependencies (resolves #318) (1ffd290)
* Ignore unresolved imports that look external but have ignored extension (resolves #311) (e8859e7)
* Fix entry file patterns in storybook plugin (resolves #313) (cdff59b)

## Release 2.38.1

* Update depdencies (bbfd39c)
* Update Storybook entry patterns and support pattern object (fixes #312) (bba540d)
* Minor housekeeping (762cc2c)

## Release 2.38.0

* Add graphql-codegen support (#305) (eb64c62)

## Release 2.37.0

* Reuse same obj w/ slightly different pos (EOL on win32 is one more char) (d1c6cf4)
* Add `jsonExt` reporter to output JSON with row/col of exports/types issues (#288) (7e483d4)
* Add line, col & pos to exports/types issues (#288) (92c4a80)

## Release 2.36.0

* Update dependencies (e765d74)
* Extend PackageJson type with plugin config keys (6d67c07)
* Return production dependency from typescript plugin (#186) (1da495f)
* Fix typo in schema.json (085b8a1)
* Extend async function config support to vitest plugin (#303) (407be68)
* Support mjs files for prettier configuration (#306) (766a9a0)

## Release 2.35.0

* Support (async) function in vite plugin (resolves #303) (7b1686b)
* Also make astro, gatsby, next and remix entry patterns overridable (e2aebc3)
* support postcss cjs format (#304) (47b09c9)

## Release 2.34.1

* Add `finalData.counters` and use `finalData.report` (#300) (1a19087)

## Release 2.34.0

* Add support for class get/set accessors (resolves #297) (d027e97)
* Base total error count on report after preprocessing (fixes #300) (3e29758)
* Add `--directory [dir]` argument to run the process from a different dir (b331033)
* Update compilers docs + fixtures (7f63c75)
* Regenerate docs (02bc3e3)
* Add test suite for all current config loading systems (#301) (a18f2a6)
* Add astro plugin (#298) (50dd048)
* Change Nx detection to the new npm scope (#302) (4d6dea8)

## Release 2.33.4

* Wrap result of `path.relative` in `toPosix` (176777e)
* Update readme w/ Bun support (6a1cbb3)
* Major housekeeping for plugins + configs (consistency + bug fixes) (9fd764b)
* Remove unused lockfiles (589c69a)
* Prettify debug output a bit, consistent context arg (3638fb2)

## Release 2.33.3

* Vitest config can be a function (resolves #292) (432a308)

## Release 2.33.2

* Update dependencies (8ce71b3)
* Add 10ten-ja-reader (022c86a)
* Fix up storybook plugin (fixes #289) (7488701)
* Fix up playwright config (1239eb3)
* Don't bail out if plugin `entry` is set (d31a31a)
* Filter out ignored extensions from binaries in scripts + add .sh (31ffb42)
* Fix var scope/name in webpack plugin (06a89bf)

## Release 2.33.1

* Update dependencies (7adf9a1)
* JSON Reporter: Add missing binaries report (#287) (5113e50)
* Edit docs (50b5aa3)

## Release 2.33.0

* Wrap up ci integration workflow (8576f2a)
* Try parseArgs fallback for Bun (c4cebe8)
* Add slonik (192b687)
* Add integration workflow w/ Bun (20fd0b2)

## Release 2.32.5

* Update dependencies (08bff61)
* Handle some less common package path ref from plugin dependencies (c987dd7)
* Minor refactoring (a129b61)
* Stop throwing for local file 404s, instead warn in debug mode (b35b70d)

## Release 2.32.4

* Add .ts extension to ava plugin entry file patterns, config can be a function (436a473)

## Release 2.32.3

* Fix up after merge (72a055f)
* Rename tests → test (f89dd93)
* Fix and simplify config hints (1dbc024)
* Use all available workspace when finding referenced internal workspace (c6e0aab)
* Move module resolution from `require.resolve` to `ts.resolveModuleName` in `handleReferencedDependency` (0155306)
* Return `module.js` not `module.d.ts from `resolveModuleName` for internal imports (7e62157)
* Don't throw for configuration issues (91d8989)
* Match against all available internal workspace pkg names (3d1fbe8)
* Include only direct dependents and filter issues by provided --workspace (4dd951b)
* Add @pnpm/logger (6cf4f0d)
* Find dependents (not dependencies) + prevent recursion loop (5ab5a87)
* Include dependencies when analyzing single --workspace (#249) (7ffa993)

## Release 2.32.2

* Fix schema.json (plugin value can be `true`) (e8414d4)
* Check more package.json#scripts for matches in node-test-runner plugin (dc1f590)
* Update dependencies (ebbb186)
* Make test titles unique (f1fcf69)
* Always log full stack trace in debug mode (b74844c)
* Fix playwright-ct plugin, add coverage (d6fb53d)

## Release 2.32.1

* Fix eslint plugin (eslint.config.js missed as entry file) (3f1a5f0)

## Release 2.32.0

* Reset version (4256731)
* feat: allow gatsby plugin to see local plugins as entrypoints (#273) (85ffbc9)
* Update docs (925e2f6)
* Fix up cypress plugin + coverage (3277795)
* Increase coverage for test patterns from plugins or local config (46575b8)
* Fix up playwright plugin (9ce013f)
* Fix up after merge (36f7830)
* Add package.json path to lint-staged plugin (1b10d90)
* Add types + support for projects in playwright plugin (c45a337)
* Report @types/pkg as unused if pkg already has types included (e58953c)
* Prevent unnessary invocations of plugin dependency finder (977e756)
* Refactor drizzle plugin to use new `entry;` protocol (a8dea3f)
* Go public (51adaa3)
* Fix node-test-runner plugin (8e83198)
* Refactor vitest plugin a bit (ea6f1e0)
* Improve typing for `PluginConfiguration` inside plugins (2144996)
* Use more readable protcols (9c76e62)
* Add node-test-runner config to knip.json (71b501d)
* Catch errors in cli test helper (1f72702)
* Adjust the rest fixtures and tests (28ba933)
* Migrate plugins and their tests (8e09fcd)
* Add node-test-runner plugin (9508c73)
* Move test/entry file patterns to plugins (82278f8)
* Move `bin:` protocol helpers to separate module (92c6f1b)

## Release 2.31.0

* Ignore ts/eslint violation for raw config (c57c94e)
* Fix explicit root workspace dir in pnpm-workspace.yaml (fixes #284) (3bf5ad6)
* Prevent duplicate analysis/infinite recursion (#281) (2d32eb1)
* Support force-enabling of plugins, by with value object or `true`  (resolves #276) (a06925d)
* Refactor & fix workspace config normalization (9ed0775)

## Release 2.30.1

* Re-format markdown (122ccc1)
* Update dependencies (2e7f099)
* Add `curl` to list of ignored binaries (770c0b4)

## Release 2.30.0

* Update dependencies (7035637)
* Report @types/pkg as unused if pkg already has types included (resolves #241) (032ecca)

## Release 2.29.0

* Move unresolved module handling to `resolveModuleName` internally (close #206, close #258) (11f91f9)
* add support for workspace file in vitest plugin (#265) (c267827)
* Fix pattern for icons in Next apps (#270) (ee88f41)

## Release 2.28.0

* Add definition paths from TS config to the program (5e46079)
* Update dependencies (af237ce)
* Add jest's `testResultsProcessor` to dependency check (#267) (ae6bd8e)
* drizzle plugin (#266) (c310162)
* Add more plugin config to docs + fix up plugin-config fixtures (d802b86)

## Release 2.27.1

* Remove react dependency requirement when using `react-jsx` in `tsconfig.json` (#264) (503fdd1)

## Release 2.27.0

* Update dependencies (9991ee2)
* Fix `compilerOptions.module` in TS config (c79e26c)
* Playwright for components plugin (#262) (af3c11b)
* Add support for Storybook test runner's hook api (#263) (7611360)
* add `tsconfig.*.json` pattern to the typescript plugin (#261) (2a5504a)

## Release 2.26.0

* Update next readme (8064f47)
* Support plugin config at root level (resolves #260) (0918da3)
* Add initial version of angular plugin (closes #138) (14f3e98)
* Support non-entry cross-reference imports in workspaces (resolves #244) (8ab8992)
* Mark .ts files as entrypoints inside Next.js app dir (#257) (16f16ae)
* Fix up some fixtures (799bc4b)
* Fix up some fixtures (98d0707)
* Update contributing doc (783b69b)
* feat: add --preprocessor-options flag (#252) (7a431d4)
* Optimize findManifestDependencies (#247) (43b68a8)

## Release 2.25.2

* Clarify debug log message (5e37152)
* Simplify array.from+map (#246) (63403d4)
* Simplify map+flat call (#245) (77887a5)

## Release 2.25.1

* Fix typed peer dep + improve some peer/host namings (fixes #239) (ef94f5b)

## Release 2.25.0

* Do not return `react` as a dependency for `jsx: preserve/none` in typescript plugin (#226) (37b9e81)
* Update dependencies (ccd3613)
* Use `rootDir` option in jest plugin (fixes #240) (2f58848)
* Add nx binaries resolver (resolves #243) (5ba99e7)
* Don't throw for invalid tags in getJSDocTags (fixes #242) (d17371b)

## Release 2.24.1

* Remove .d.ts file and regenerate docs (db064e3)
* Fix entrypoints for Next.js plugin when using Next.js app router (#236) (f345663)
* Replace expired Discord invite link (740a171)
* Move requireResolve call to generic prop access visitor + tests (b10b41c)
* Fix fixtures after resolvable fs.exists specifiers fix (a702758)
* Accept resolvable fs.exists specifiers which ts did not (0f02519)
* Add `types` as dependencies from typescript plugin (b89fe3b)
* Fix log-level arg in script (2de7a57)

## Release 0.0.0-angular.0

* Add initial version of angular plugin (c4dbc37)
* Add `types` as dependencies from typescript plugin (b89fe3b)
* Fix log-level arg in script (2de7a57)

## Release 2.24.0

* Add vitest dependency resolver to vite plugin (resolves #233) (4766659)
* Fix tests after deaa7e7 (lol) (838175c)

## Release 2.23.0

* Add `@evilmartians/lefthook` as lefthook plugin enabler (1dc53ed)
* Fix lefthook handling in CI, where it does not install hooks (#231) (deaa7e7)
* Update dependencies (de35df4)
* Parse releaseNotes scripts in release-it (#232) (b7b10d9)
* Add JSDoc handling to readme (4496cfb)

## Release 2.22.0

* Update lefthook plugin docs (1695209)
* Add `@alias` as JSDoc tag to ignore duplicate exports (closes #228) (17000b3)
* Refactor/improve jsDocTags handling (28ad80e)
* Find no issues/hints if optional peerDependencies are also ignored (dev)Dependencies (#194) (7e896a7)
* Add issue type for referenced optional peerDependencies (resolves #194) (bdbc77a)
* Improve bash parser (1557e2e)
* Fix up lefthook plugin (resolves #231) (79c46d8)
* Move husky git helpers to central utils (4322e1b)
* Improve the eslint-config/plugin-prettier hack + tests (closes #230) (aa718c2)
* Improve watch script (7743f68)
* Improve pnpm resolver arg handling (4f74ce2)
* Add alias `-W` to `--workspace` (3dc026c)

## Release 2.21.2

* Update dependencies (fb9df38)
* Look up importing module ourselves, don't defer to `ts.LS.findReferences` (fixes #229) (ca95b21)
* Move existing re-exports test (36214cb)
* Add contents section to more docs + minor edits (908ddb5)
* Install Markdown link checker (3e980e6)
* Fix links in readme (fixes #227) (b8ce60d)

## Release 2.21.1

* Fix ancestor workspaces for single --workspace (fixes #213) (d765f21)

## Release 2.21.0

* Add nodemon resolver (resolves #221) (581aae1)
* Support pipes in scripts (fixes #221) (b18c8d3)
* Update dependencies (17cd42f)
* Add `chmod` to global ignored binaries (fixes #222) (52e1f04)
* Update docs (239814c)
* Add tests for --reporter and --preprocessor (85effd1)
* Wrap up reporters and preprocessors (b7a138a)
* Add --preprocessor argument + support multiple reporters (resolves #204) (298245e)

## Release 2.21.0-autofix.0

* Update docs (0ac0a87)
* Start support for `--fix` flag (#63) (97f5f35)

## Release 2.20.2

* Add auto-toc settings (8dd7d36)
* Update docs (85c4dc0)
* Pass config to plugin dependency resolvers (e631d24)
* Always run all visitors (9012ddf)

## Release 2.21.0-op.0

* Add issue type for referenced optional peerDependencies (resolves #194) (0c836b6)

## Release 2.20.1

* Update dependencies (985ca1a)
* Just return paths as provided in vitest plugin (fixes #219) (a0bc23b)

## Release 2.20.0

* Add --ignore-internal flag to ignore `@internal` exports in production mode (resolves #193) (d71c9f2)
* Simplify peer dep handling a tiny bit (86d67ac)
* Resolve `setupFiles` and `globalSetup` in vitest plugin (6c81d3c)
* Refactor odd quoted string in ava plugin (18f0e96)
* Provide `cwd` to `isGitIgnoredSync` (fix Windows slashes incompat) (90aeaa3)
* Remove redundant parts of comments (a504ee6)

## Release 2.19.11

* Revert "Migrate from bash-parser to tree-sitter" (3035c07)
* Revert "Migrate from bash-parser to tree-sitter (closes #72)" (8b798af)

## Release 2.19.10

* Fix node position for `LS.findReferences` (fixes #215) (2c87aae)
* Refactor for readability (b66ad64)
* Fix typo in test title (a025f88)
* Rename `getPeerDependencies` to `getPeerDependenciesOf` (1c6dbde)
* Add extra link to webpack docs re. config function (0c3d80e)
* Move nestjs-middleware fixture/test files (871b4a9)
* Run `npm ci` in CI (w/ lockfile) (a3c02c2)

## Release 2.19.9

* Update dependencies (0e57e45)
* Add @JoshuaKGoldberg's article (a3c86ef)
* Remove console.log + obsolete assertion (9dc8d37)
* fix: add middleware to default nextjs config plugin (#212) (2f212e3)

## Release 2.19.8

* Temp downgrade tree-sitter-bash to v0.19.0 (39c81c4)
* Add link to Discord channel + fix Dutch explanation of "Knip" (776776e)

## Release 2.19.7

* Add `pnpm store` and more subcommands to pnpm resolver (fixes #208) (7c6ae33)
* Sort package manager commands (bb16843)
* Add `@beta` as JSDoc tag to skip unused exports (like `@public`) (resolves #151) (ff0710a)

## Release 2.20.0-preprocess.0

* Add --preprocessor argument + support multiple reporters (444dfc6)
* Add ignored file (93fecda)

## Release 2.19.6

* Update dependencies (8ce85e7)
* Support tagged templates with options in execa visitor (resolves #207) (d7f8f71)
* Migrate from bash-parser to tree-sitter (closes #72) (ef3981f)
* Replace @ericcornelissen/bash-parser with tree-sitter + tree-sitter-bash (73f569f)
* Add ignored file (93fecda)

## Release 2.19.5

* Update readme (f49940e)
* Ignore unresolved import specifiers in .gitignore (fixes #205) (4c453c6)
* Sanitize unresolved specifiers, webpack loader stuff (fixes #202) (9cf6bad)

## Release 2.19.4

* Refactor docs (6c2e349)
* Update dependencies (08791ea)
* Add `.cz.json` to commitizen config files (a49d6c0)
* Minor refactor for config validator (05afc2c)

## Release 2.19.3

* Only throw for missing internal files (resolves #196) (930d6c8)
* webpack: handle a couple more cfg.entry formats (#197) (c45cb07)

## Release 2.19.2

* Update dependencies (bc9ac32)
* Dual-load ts config (merge extend configs + find ext deps) (6310bf4)
* Update projects using knip (004b462)

## Release 2.19.1

* Update dependencies (bdd0763)
* Clean up tests (e8edf37)
* Refactor eslint plugin helpers (resolves #195) (4c2bcbb)
* Add notes to test plugins about test file patterns (9740b09)
* Add jest config to workspaces-tooling (e.g. to verify `<rootDir>` in workspace) (f32d815)
* Rename fixture `workspaces-eslint-config` to `workspaces-tooling` (640f9db)
* Fix `tsconfig.json#extends` in typescript plugin can be an array (434b951)

## Release 2.19.0

* Add `.yarn` to global ignore patterns (resolves #148, resolves #184) (531770c)
* Remove package scope from default binary name (resolves #184) (12e9674)
* Throw when `--workspace [dir]` does not exist (resolves #176) (b4e0c6f)
* Improve docs a bit re. workspaces config and `--workspace` arg (closes #176) (719b2e2)
* Update dependencies (2e774ee)
* Add and apply `verbatimModuleSyntax` in TS config (d22a448)
* fix(vitest): support default coverage provider (#192) (c321a9c)
* Simplify logic for `resolveExtendsSpecifier` ESLint helper (85e49a4)

## Release 2.18.0

* Simplify resolver for `@typescript-eslint/eslint-plugin` case (resolves #188) (dd017f5)
* Add support for `projects` and `runner` in jest plugin (resolves #189) (27c063f)
* Recursively load tsconfig.json#extends (resolves #187) (a315cb3)
* Add support for `jsx` and `jsxImportSource` in TS config + import pragmas (resolves #186) (899a1a1)
* Set parent nodes only for internal source files (3bce942)

## Release 2.17.3

* Update dependencies (a9bbe5f)
* Add `.yml` and `.yaml` to extensions to ignore (fixes #178) (6d5835b)
* feat: silent in CI (#180) (9955f35)
* docs: document ci + show-progress (#179) (f0a22b3)

## Release 2.17.2

* Vitest reporter can be reporter instance (fixes #175) (badd7af)
* Fix up ignored/enabled workspace getters (closes #174) (04acb61)
* Improve npx dependency resolver (482396e)

## Release 2.17.2-ts.0

* Migrate from bash-parser to tree-sitter (ad80c38)
* Replace bash-parser with tree-sitter + tree-sitter-bash (8fd3ff5)
* Improve npx dependency resolver (482396e)

## Release 2.17.1

* Correct --help and --version in help text (closes #173) (81180f7)
* Add `+server` to svelte entry pattern (fixes #170) (ecad69d)
* Improve argument handling in script resolvers (fixes #171) (c724068)

## Release 2.17.0

* Minor improvements for some plugin coverage (a4e7a89)
* Fix test coverage to show original source files (b1814dd)
* Remove unused `isDynamic` variable (db9a941)
* Pass source file path to compilers (#169) (bc3eb55)

## Release 2.16.2

* Dogfoodin' is awesome (2df8594)
* Skip import types only in --production mode (fixes #167) (e870966)
* Include `context` when resolving `entries` in webpack config (fixes #165) (7892f24)
* Extend fixture for .vue files (closes #166) (89296a9)
* Simplify importCall visitor, let TS do the heavy lifting + improve import fixtures (4897063)
* Add minimal test to cover cli (closes #44) (10220fe)
* Add lockfile + cache (6a5854c)
* Refactor test scripts (f4cea7c)
* Move fixtures to root (fda4216)
* Add swc + prepare to move fixtures (43eea06)

## Release 2.16.1

* Update dev dependencies (2d8eefe)
* Add fixture for .vue files (3658311)
* Fix pattern of import call property assignment (fixes #164) (abcbd29)

## Release 2.16.0

* Edit the npx flags in doc (6993adf)
* Update handling-issues.md (#162) (e44c333)
* Update dependencies (82b133c)
* Add support for custom hooks path in husky plugin (cb15609)
* Improve tests for husky + npx combo (7398393)
* Add support for binaries executed from `npx` (5c8311c)
* Fix up execa fixture (fee0cac)
* Only explicit `--yes` will ignore dependency in npx resolver (535b573)
* Add test case for uncovered bash expression (9a9331f)
* Add `exec` to ignored binaries (1c59321)
* Improve glob usage comment (a65fda8)
* Pass `cwd` to return scripts in github action plugin test (4bae338)
* Add `c8` script resolver (3419fa6)
* Fix up child-spawning binaries in script parser (d1f42a3)
* Add support for `else` in script parser (6d98db5)
* Add support for `node_modules/.bin` locations in `tryResolveFilePath` (fixes #161) (2ff2d99)
* Normalize `tryResolveSpecifier[s]` return value (1d63022)

## Release 2.15.5

* Add app folder to next plugin (8228b35)
* Add `prepare-commit-msg` hook to husky plugin (8c5af37)

## Release 2.15.4

* Extend jest `moduleNameMapper` filter and add test cases (38839e2)
* Add `ignoreExportsUsedInFile` to JSON Schema (c76f90a)
* Format/fix code (9d19057)
* Add `parserOptions.babelOptions` to eslint plugin dependency resolver (a2684bb)
* Add `true` as a global binary to ignore (ce3a3c8)
* Update index.ts (#157) (c46d3af)

## Release 2.15.2

* No trailing comma (b72d377)
* Extend regex for eslint specifiers (closes #154) (7fc31dc)
* Use type `PackageJson` only from `@npmcli/package-json` (97f14b4)
* Update @typescript-eslint/* dependencies (184eb52)

## Release 2.15.1

* Replace `bash-parser` by `(at)ericcornelissen/bash-parser` (#153) (fdb0ab6)

## Release 2.15.0

* Update dependencies (7a68e67)
* Add stylelint plugin (resolves #110) (3d44217)
* Remove warning in create-plugin script (f35a5be)
* Fix filename in create-plugin script (ae8da4f)
* Add `ignoreExportsUsedInFile` option to docs (closes #149) (dbea4f1)
* Don't reuse tsconfig paths when both have `pathsBasePath` (fixes #152) (d633b6d)
* Add reporters to jest plugin (c6828de)
* Support jest config as an (async) function (7a9b6d4)

## Release 2.14.3

* Update dependencies (2df77c9)
* Fix module block (namespace) exports referenced in same file (fixes #147) (858054b)
* Move test namespace to imports-namespace (e13fc31)

## Release 2.14.2

* Improve external package heuristic for unresolved specifiers (fixes #146) (674b6e2)
* Add `moduleNameMapper` dependencies to jest plugin (resolves #145) (6bdf094)
* Check for `importHelpers` and add `tslib` from typescript plugin (resolves #144) (a9702b1)
* Add isIncludeEntryExports to base args in tests (4e69904)

## Release 2.14.1

* Add support to sentry plugin for nextjs middleware (#143) (deea4bc)

## Release 2.14.0

* Report unused members of re-exports (fixes #140) (f911062)
* Sync package names in fixtures (f2d787e)
* Finalize --include-entry-exports, include scripts (closes #142) (1e3d3b6)
* Fix TS issues in webpack plugin (bd26f9c)

## Release 2.14.0-next.1

* Don't report unused exports from config/plugin entry files (b1024bf)

## Release 2.14.0-next.0

* Re-introduce --include-entry-exports (e09c55c)
* Add cjs and mjs to next.config extensions (5c64578)
* Add pnpx to ignored global binaries (bc6b61e)
* Update dependencies (86bccd1)

## Release 2.13.0

* Update dependencies (0f9cf03)
* feat: add ignoreExportsUsedInFile option (#139) (73bd68e)

## Release 2.12.3

* Add Node.js v20 to test matrix (cb5bce0)
* Improve handling of packages that may be internal and external imports (d239317)
* Make `getPackageNameFromModuleSpecifier` return `undefined` if not package name (f0d74ef)

## Release 2.13.0-next-webpack.0

* Introduce custom resolver for webpack config inside next config (1f5a1a2)

## Release 2.12.2

* feat: add binaries type in config validator (#137) (e800a01)
* fix: correct devDependencies type in the table (#136) (dde95ac)

## Release 2.12.1

* Update dependencies (c68aeeb)
* Update postcss config type (647e14f)
* feat(postcss): enhance dependencies detection (#134) (5b23334)

## Release 2.12.0

* Update dependencies (52a7bc6)
* Fix postcss specs (b2f1592)
* Add `next` to `postcss` enablers (closes #131) (1429d8c)
* Log file path for JSON parse errors (6befebf)
* Add `postcss.config.json` to config file patterns (d00f8fc)
* feat(storybook): add support for framework (#133) (b1ba73e)

## Release 2.11.0

* Update dependencies (5e5dbf0)
* Look for typedoc config in package.json and tsconfig.json (closes #129) (66e9840)
* Require `eslint-config-prettier` if `eslint-plugin-prettier` is in `extends` (fixes #128) (3655301)
* Fix re-export edge case (ce29c84)

## Release 2.10.4

* Update dependencies (5c1f6bf)
* Exports may contain imports (d09da9d)
* Always store all localWorkspaces (7019c35)

## Release 2.10.3

* Add pnpm dedupe command (fixes #125) (df17305)
* Replace globstar with glob (b957901)
* Update dependencies (2257bdf)
* Update docs, add link to KB (8c0e527)
* Fix import ext in test (bf3fcbb)

## Release 2.10.2

* Update dependencies (b6cbf74)
* Fix unused export in re-export without star/namespace (fixes #123) (eb9ff0a)
* Make configuration hints more conservative (6751329)
* Rename test title (all unique) (a172a86)
* Consider ignore patterns for file dependencies from npm scripts & dependencies (f478fa7)
* Improve vitest config coverage (71e7225)
* Improve handling of node script references (fixes #122) (0ca15e0)
* Include scripts in eslint config (b20ff01)
* Add --no-warnings in test runs (so pretty in Node.js v20) (608d4e0)

## Release 2.10.1

* Update dependencies (aa3073d)
* Fix ignored workspaces (#120) (e308e1a)

## Release 2.10.0

* Move configuration hints logic to separate method (487be4b)
* Refactor binary and dependency handling and settling (fixes #120 and more) (0ad317c)
* Prevent infinite recursion for circular peer dependencies (maybe fixes #97) (5e8eeb9)
* Update docs (9f924ce)
* Improve handing of re-exports (cfebc6b)
* Add cli and main to default entry file patterns (c14bad0)
* Fix entry paths from package.json#exports that should be ignored (f7fe398)
* Improve eslint settings parser (d9a3dd8)

## Release 2.9.0

* Add grep to ignored global binaries (resolves #118) (063c082)
* Add test for typescript plugin, and to assert trailing commas in JSON are fine (2ac27fa)
* Support trailing commas in JSON files (resolves #83) (e8c003c)

## Release 2.8.2

* Update docs (465a31e)
* Rename "unresolved" to unlisted binaries (25be703)

## Release 2.8.1

* Fix unused ignored dependency if referenced but unlisted (and vice versa) (8d38888)
* Add flag to disable configuration hints (85949a9)

## Release 2.8.0

* Dog foodin' works... (15831c9)
* Update dependencies (a7b6852)
* Add getOrSet Map helper (f83f852)
* Unskip test for local modules without a relative path (a0bf7bf)
* Add assertions for configuration hints (491b4bf)
* Introduce configuration hints (resolves #69) (4790928)
* Add bash and cat to ignored global binaries (resolves #116) (80059b0)
* Add issue type for unlisted binaries (resolves #117) (55e5367)

## Release 2.7.1

* Add super secret easter egg boost 🐣 (e8aecc9)
* Early bail outs before globbing without patterns for small performance wins (d0e611f)

## Release 2.7.0

* Add -n (--no-progress) and -d (--debug) shorthands (990c179)
* Use jiti + custom transformer for eslint loader (7fe2968)
* Improve eslint plugin resolver for scoped package names (d865e32)
* Show readable error for unknown CLI args (b54e814)
* Show readable error for config validation issues (56b15e7)
* Improve descendant workspace comparator (d68bf53)

## Release 2.6.1

* Update dependencies (11228e9)
* Show packageName over specifier for unlisted things from node_modules (dcf8306)

## Release 2.6.0

* Rename "warning" to "warn" (dbd4b35)
* Fix edge case with string values of settings in eslint plugin (7744d6b)
* Use getKeysByValue where applicable (0bff9b9)
* Fix bug for local executable node scripts (not a binary, but entry file) (7e54670)
* Optimize performance for some include/exclude combos (08d7736)
* Refactor `report` out of ProjectPrincipal constructor options (e48f050)
* Print issues with severity "warning" in grey/faded (9bee5ee)
* Add rules config and only add issues of severity "error" to total error count (closes #94) (d564367)
* Refactor IssueCollector a little (ee457a3)
* Change eslint-plugin-node to eslint-plugin-n (#115) (91fca40)
* Add issue templates (a532417)

## Release 2.5.0

* Plugins don't need to worry about win32/posix paths, reflect in tests (2ba4e59)
* Introduce toAbsolute and toRelative path helpers and simplify call sites a bit (aae2126)
* Wrap up new docs/updates for now (660e5d5)
* Add contributing and development doc (close #112) (8821323)
* Add code of conduct (b966ad0)
* Use built-in path.isAbsolute over custom one (371cbc0)
* Add eslint-plugin-node and disallow built-in node:path module (enforce cross-OS compat) (7b5d2ca)
* Doc edits & separate page about handling issues (fdf9f03)
* Extend default test file patterns (57e6d06)
* Add yarn `upgrade` command (3b99268)

## Release 2.4.0

* Update release-it to use automated github.comments with releases (cf23455)
* feat: added detection for execa (#113) (4bdc3b5)
* Unfix typescript version (#114) (82f2f79)

## Release 2.3.2

* Add --test-only launcher (e8dd86b)
* Improve split between binaries and packages (369c6eb)
* Settle and simplify handling of certain local/self import (edge) cases (95c711c)

## Release 2.3.1

* Doc edits (df43932)
* Fix up remaining specs wrt gitignore (related to 4fac49b) (13b6232)
* Refactor resolveExtendsSpecifier and make tests pass (67d4f03)
* Introduce bin: prefix/protocol for binaries in specifiers (1b8e18f)
* Remove unused config from test (316e385)

## Release 2.3.0

* Housekeeping the tests/titles a bit (fa48589)
* Auto-format readme (a27de43)
* Look in main, bin and exports of package.json for entry files (4fac49b)
* Add main, bin and exports fields as entry files (ab0672c)
* Add esbuild to fallback binary arg filters (ed5a5c1)
* Fix eslint plugin name resolver issue (4719a8e)
* Add contributors section to readme (again, sorry) (143c2d4)

## Release 2.2.4

* Try to fix up eslint extends-that-are-actually-plugins? handling (6b3e7ec)
* Handle recursive overrides config in eslint plugin (224607a)
* Fix dynamic import issue with type import (#106) (11329c9)

## Release 2.2.3

* Update dependencies (eea11a8)
* Add example to `ignoreWorkspaces` with globs (2de03c4)
* Vitest reporters can be a string too (fixes #105) (5643893)
* Improve nx plugin for other shape of repos (1a42f75)

## Release 2.2.2

* Update dependencies (362dfec)
* Run require and require.resolve visitors in TS files too (325fca9)

## Release 2.2.1

* A few doc edits (b9780ae)
* Refactor importCall visitor and Introduce isDynamic imports to defer to LS.findReferences (5b4f5d5)

## Release 2.2.0

* Fix file casing (2818d68)
* Remove unused export (671de45)
* Return single dependencies array from _getDependenciesFromScripts (4a77e35)
* Bring all ignored dependencies + binaries handling together and later in the process (300035a)
* Minor refactor in workspace config normalizer for readability (38ce7d9)
* Introduce script node visitors (46b8110)
* Fix npx binary resolver (522c8a7)
* Add --quiet and --verbose to generic binary resolver (20680f4)
* Add custom zx resolver (6830f97)
* Fix nodemon resolver (c72149e)
* Start using generic arg resolvers in fallback binary resolver (425d306)
* Move AST visitors to their own factories and add file condition (c5da961)
* Minor refactor return value of compilers helper (fcccb26)
* Case file names after their class (6c08af3)
* Ignore @public class/enum members (7e4e8e0)

## Release 2.1.3

* Update dependencies (c295f01)
* Update tailwind docs (a2f8ce3)
* Update tailwindcss plugin with .cjs support (#102) (6dc5217)

## Release 2.1.2

* Remove $lib/* from docs (already in `.svelte-kit/tsoncig.json) after fixing regression in ab1c6449aa1630ab5a354b256b956254822cd55b (cc4b288)
* Swallow bash parser errors (but show in --debug) (9989522)
* Improve error handling a bit (7b2d232)
* Update docs (28170c7)
* Rename paths to pathKeys for clarity (5856d62)
* Resolve only custom paths from config (ab1c644)
* docs: add additional svelte import paths (#101) (1c66d2b)

## Release 2.1.1

* Since TypeScript v5, extends can be an array (414ac29)
* Update dependencies (44dddb8)
* fix(svelte): layout reset reported as false positive (unused file) (#100) (44b525c)

## Release 2.1.0

* Add vite plugin (5b80b8c)
* Add condition to jest plugin enabler for internal jest-preset packages (fdef35d)
* Append /jest-preset to external preset specifiers so the main program can find them (b4401b0)
* Add package.json#jest to jest plugin confg file patterns (d51c42a)
* Add condition to eslint plugin enabler for internal eslint-config packages (709fa19)
* Improve output for loader errors (e436728)
* Simplify ts libLocation resolution (73833a0)
* Split entry and config file patterns in vitest plugin (fixes #99) (e31ab3a)
* Remove cruft from fixtures (83c9348)
* Move two fixture files (1cd1477)
* Remove .prettierignore (a458bc5)
* Format files in test fixtures (11dd60c)

## Release 2.0.0

Please see https://github.com/webpro/knip/blob/main/docs/release-notes-v2.md for release notes for v2.

---

* Update next to v2 in schema refs (8845813)
* Update dependencies (3579181)
* Add tailwind plugin (d09773b)

## Release 2.0.0-beta.2

* Add releases notes for v2 (e9c589c)
* Fix up CLI args docs (39263f0)
* Ignore deno style specifiers and specifiers w/ ignored extensions (37d50d4)
* Replace todo with explanation (f777a20)
* Remove seemingly obsolete logic (44b3794)
* Improve variable names in eslint plugin helpers (2a9c8d7)
* Add rollup binary resolver (5bfb2ac)
* Refactor and improve variable names in fallback binaries resolver (7c680c2)
* Convert SymbolType to enum (a70bf7b)
* Fix import order (23a21bb)
* Don't include ancestors when analyzing single workspace (4949a8c)
* Add projects using knip and more doc edits (f8405f4)
* Bring config validator up to date and extend plugin creation script (5ea76d7)
* Fix npm prebuild script (2cc7a94)
* Introduce c8 (code coverage) (77c6ad7)
* Another round of docs improvements (feee471)

## Release 2.0.0-beta.1

* Minor refactorings/edits in ast walker (67a4b3d)
* Edit the docs (7db7549)
* Rename to literally "devDependencies" as a report type title (9456a32)
* Improve exports fixtures + screenshot (a9abc18)
* Improve dependencies fixtures + screenshot (d1fcf3d)
* Use less "foo" and "bar" in fixtures etc. (7da2f2f)
* Don't report unused members if enum or class itself is not used (5e2ce79)
* Make names in the workspaces fixture a more real-world example (74a320c)
* Filter out odd paths to binaries (ebb08ca)
* test: add subpath import and subpath pattern tests (#93) (190d4a3)
* feat: add new plugin commitizen (#91) (f900f2a)

## Release 1.17.0

* Update dependencies (bcfadb4)
* Bring config validator up to date and extend plugin creation script (8c7d9c8)
* feat: add new plugin commitizen (6c811db)
* Add tailwind plugin (4808906)
* Convert link refs for plugins to strings (d8459e5)
* feat: add new plugin ava (#85) (62feb51)

## Release 2.0.0-beta.0

* Remove obsolete dependency nano-memoize (78c4112)
* Add fallback to resolveSpecifier and be brave enough to report any unresolved items (10a0249)

## Release 2.0.0-alpha.10

* Fix principal reusage (regressed with 3f223293783ed127ece07fcf1ed1468eb296878d) (dc63cc2)
* Housekeeping and increase fail-safety of resolver helpers (12f5f14)
* feat: add support for package self-referencing (#88) (3a9ef07)
* Rename console to streamer (429fe00)
* Add link to extensions used by TS (a4272a2)

## Release 2.0.0-alpha.9

* Format docs (62d99b1)
* Move ast helper (e13bcb7)
* Update dependencies (including typescript v5) (be434ba)
* fix: add support for .d.cts and .d.mts declaration files (#90) (18703a8)
* Fix require.resolve in createHosts (for --performance) (32cfd93)
* Add document about compilers (22ee161)
* Revisit the svelte fixture (0ae6fd8)
* Add .mts and .cts to default extensions (closes #89) (3440257)
* Rename doc to "writing a plugin" (e86802f)
* Add document/guide for writing plugins (1ca241e)
* Fix up plugin scaffolding (3200662)
* Housekeeping the plugins (d799c02)
* Correct method name (7157679)
* Re-generate docs (ce9ba87)

## Release 2.0.0-alpha.8

* No more packageName resolutions necessary in plugins (55f8ec9)
* Fix paths to /tests directory (abc9cf6)
* Merge branch 'main' into v2 (dd33f0e)

## Release 2.0.0-alpha.7

* Fix a few remaining lint issues (2595a6c)
* Update dependencies (9ce599a)
* Move main test files up for shorter paths (d8e05d7)
* Lift binaries modules a directory up (0442e9d)
* Extend plugin package.json template (63267be)
* Add knip config + fixtures for svelte plugin (e6b739f)
* Add svelte plugin (0c9a148)
* Merge npm-scripts tests (b4b5f25)
* Add eslint to ignoredDependencies for Knip itself (4caef54)
* Update dependencies (3aa719c)
* Minor refactorings (ab3b0f7)
* Include peerDependencies in strict mode (#76) (6368fd6)
* Dedupe ignored binaries and dependencies (a2aade3)

## Release 1.16.0

* Fix up link refs (5465d82)
* feat: add semantic-release plugin (#78) (1450b81)
* perf: refactor to improve performance (4021f76)
* fix: parse rc configs with no extension as either yaml or json (357fca3)
* Add contributors section to readme (534be72)

## Release 1.15.0

* Fix typedoc test (1e69cfe)
* Support entry files in typedoc plugnin (fixes #77) (1ce30d9)
* chore: add launch.json config to allow easily testing a single test file in vscode (f8ac2e4)
* refactor: use getPackageNameFromModuleSpecifier (2103120)
* docs: update (d4c6a64)
* chore: tidy up (732efbe)
* feat: add new plugin cspell (c12c495)
* docs: move docs lint (c02f6e3)
* fix: improve support of commitlint configs (8d4b426)

## Release 2.0.0-alpha.6

* Dogfooding is good (7dca5eb)
* Add test for workspaces-paths fixture (1eb84dc)
* Fix up package names in workspaces fixtures (eaa4dbb)
* Make package names in fixtures resilient against name conflicts in tests (16ac8b7)
* Improve babel plugin types (b213023)
* Improve @local/package handling (6cc3747)
* Fix total file counter (when using multiple principals) (7968f79)
* Fix up tests after refactoring (db141f3)
* Move dependency resolution from plugins to central location in main flow (3bf9a0e)

## Release 2.0.0-alpha.5

* Use ts.parseJsonConfigFileContent to load extended TS configs (fixes #75, related to #74) (3f22329)
* Fix up and rename tsconfig-paths-implicit test (e933aea)

## Release 2.0.0-alpha.4

* Dogfooding is good (52650c3)
* Wrap up the refactoring (eb5035f)
* Fall back to root workspace name (4c2f99a)
* Throw when no package.json is loaded successfuly (related to #68) (e0a3c8f)
* Un-comment test (oops) (d945f53)
* Merge finalizing methods of WorkspaceWorker into a single method (60fcda2)
* Rename some methods in ConfigurationChief (9b49554)
* Remove isRoot from findManifestDependencies (9273676)
* Use sharedGlobOptions to compress all the workspace globbing logic (be44104)
* Structure return value of getImportsAndExports (a64159d)
* Clean up the IssueCollector (553f28d)
* Merge ProgressUpdater and LineRewriter into a single ConsoleStreamer (a4300ff)
* Rename resolveIncludedIssueTypes to getIssueTypesToReport (18e7f83)

## Release 2.0.0-alpha.3

* Re-enable windows in github action (de58cd0)
* Normalize paths for cross-OS path handling (c6bfd69)

## Release 2.0.0-alpha.2

* Update links in readme (55d2efa)
* Add (npm run) qa script (9eaed37)
* Move test files around to not conflict with default test patterns in the program (2bcd18e)
* Clean up after the merge (fa35c5a)
* Merge branch 'main' into v2 (b3c29f9)

## Release 2.0.0-alpha.1

* Add unresolved to (cli) docs (b83301f)
* Fix level of ignoreBinaries and ignoreDependencies in schema (f0a9937)
* Prefer next over alpha as npm dist tag (3a4881c)
* Update docs for v2 (aed991c)

## Release 1.14.3

* Extend default test file patterns, and remove patterns that overlap in plugins (569b516)
* Prefer next over alpha as npm dist tag (19bab96)
* Add note about v2 (258017e)

## Release 2.0.0-alpha.0

* See https://github.com/webpro/knip/issues/73 for more details about this commit (d4e058a)

## Release 1.14.2

* Update dependencies (64cb22b)
* Improve workspace name sorter (1235b04)
* Add colors to array debug logger (208f546)
* Fix case of relative preset paths in jest plugin (fca13bc)
* Merge loader flows and fix edge case in eslint plugin (da15f1f)

## Release 1.14.1

* Prefer save-exact (627f057)
* Update dependencies (7044698)
* fix: name of property typedoc plugins are specified in (905e565)

## Release 1.14.0

* Move eslint to devDependencies and lazy load in eslint plugin's fallback (1af0aac)
* Update dependencies (d556309)
* Organize some type-only imports (65069a7)

## Release 1.13.1

* Fix some (absolute) path handling for Windows (6de24be)

## Release 1.13.0

* Misc. minor improvements in binary helpers/tests (db25d0c)
* Add babel-node to fallback arg resolver (b7b7829)
* Add support for basic expansions in bash command parser (2f38296)
* Add .mjs, .cjs and .jsx extensions to default glob patterns (2e204bd)
* Add (deprecated) default entry file to cypress plugin (ad1058b)
* Fix incomplete entry file resolver in eslint plugin (a51fc7e)
* Improve jest plugin and return entryFiles (d787e09)
* Add package.json to stryker fixture (2ae3d4c)
* Simplify plugin callback type (0122d9f)
* Add typedoc plugin (73c3c5f)
* Add lefthook plugin (54718ba)
* Add entryFiles and missing .jsx extension to storybook plugin (0dfad1a)
* Fix incomplete entry file resolver in webpack plugin (1463f08)

## Release 1.12.4

* Remove comment since `isBuiltin` has been added to @types/node (7aaa01d)
* Suppress TS issue since CompilerOptions types of ts-getconfig and type-fest differ slightly (64b5640)
* Update dependencies (2b8df2b)
* Add cjs extension to stryker plugin and add tests (fca3e00)
* Load .mjs directly through import call (0920366)

## Release 1.12.3

* Default to custom dependency resolver in eslint plugin (fallback to eslint itself) (a93ae15)
* Minor refactorings (fd99098)
* Store binaries before potential lookup in dependency reference check (a86577a)

## Release 1.12.2

* Fix file paths in node resolver that can't be a package (83a0a34)

## Release 1.12.1

* Tweak pnpm/yarn resolvers (4b7d129)
* Refactor getBinariesFromScript to improve names and recursive calls (0e8410d)
* Minor refactoring for consistency (2cb9b98)
* Refactor Performance class/usage (3d46dd9)
* Refactor a few things around posix paths (e78da3e)

## Release 1.12.0

* Start using `entry` files from Webpack config (bbf63f5)

## Release 1.11.0

* Update dependencies (a7d8286)
* Add try/catch to loadJSON (2ece814)
* Fix absolute path check for Windows (ba2b65c)
* Refactor enabled plugins mechanics and improve decoupling (ee12307)
* Refactor and improve script parser & binaries resolution (bccf192)
* Enable plugins to return entry files as well (451c7ff)
* Resolve node file paths and also return entry files from manifest resolver (9bde5df)
* Add bun and sh to IGNORED_GLOBAL_BINARIES (9675888)
* Use bash-parser and minimist to find binaries in all kinds of scripts (0f09983)
* Update comment about import/order issue (5fa2753)
* Add example + note about root workspace to docs (218fd67)

## Release 1.10.0

* Support rule.loader and rule or use as a function in webpack config (332a7f6)
* Prettier config + fixes (df5bf8a)
* Introduce two passes for webpack config resolution + extend tests (e183975)
* Ignore (only) error thrown by @rushstack/eslint-patch in eslint plugin (56e275e)
* Minor refactorings (355472f)
* Install dummy extension handlers for non JS/TS files (6154b4b)
* Ignore only specific error from get-tsconfig, re-throw everything else (7b44475)
* Re-throw all esm-loader exceptions (6079848)
* Improve heuristic to find first positional arg (fixes #55) (000e7d3)
* Fix removal of project path on Windows (3d61ca5)

## Release 1.9.0

* Add --version and impove --help (fixes #51) (68efc69)
* Remove unused file (af0205b)
* Clarify unresolved configuration debug object (#54) (1e50aae)
* Document, fix and test usage of knip.ts as config file (8ace8ca)
* Update .gitignore (c2509a1)
* Fix some $schema locations (ed85d96)

## Release 1.8.0

* Extends docs for workspaces a bit (7a3d882)
* Fix a few instances of sync findFile/isFile (e2dce38)
* Support workspace directories from pnpm-workspace.yaml (37f99b2)

## Release 1.7.1

* Fix return value of commitlint plugin (a3aaeb2)

## Release 1.7.0

* Add some binaries to IGNORED_GLOBAL_BINARIES (e509553)
* Update dependencies (5702f6a)
* Add section "ignore" to docs (4744f5c)
* Add binaries from nx:run-commands executors (closes #32) (e9e44bd)
* Disable line to satisfy eslint import/order plugin in Windows (947493e)

## Release 1.6.1

* Edit the docs (b66cde6)
* Start using semver ranges for dependencies (except the patched one) (ebc1172)
* Compact dependency array from vitest plugin (3dc3984)
* Add action config file to github-actions plugin (592ad52)
* Fix lint issues (4de2886)
* Update dependencies (5160165)

## Release 1.6.0

* Add vitest plugin (fd23482)
* Swap variable names for readability (da2d2c6)
* Add support for `paths` (aka import aliases) (fd8611f)
* Fix async isEnabled call for github-actions plugin (2ade97b)
* Add new plugins to config validator (2f959e1)

## Release 1.5.0

* Add husky plugin (73445e8)
* Fix typos in the github-actions test (96e470a)

## Release 1.4.1

* Fix eol in Windows in github-actions plugin (d356c83)

## Release 1.4.0

* Remove unused log method (14be951)
* Update dependencies (c186e55)
* Remove obsolete `@public` tags (4c0130d)
* Export a few types for user-facing APIs (Configuration, ReporterOptions) (157535b)
* Use esm loader also for custom reporters (fixes #23) (20041f5)
* Make isFile sync but not throw (3a9323e)
* Add github-actions plugin (d09db3d)
* Refactor and improve extraction of binaries from scripts (1421206)
* Support custom string as plugin enable text (97aa0c4)

## Release 1.3.0

* Bump esbuild (fixes #43) (508f2bb)
* Update docs (c7a0ae8)
* Fix bug with plugin name casing (5d8bf5e)
* Add npm-package-json-lint plugin (3867e26)
* Add markdownlint plugin (1b9299f)

## Release 1.2.0

* Add support for dynamic JS/TS config files (4e7834f)
* Add .knip,json and .knip.jsonc to default config file locations (4619030)
* Move default workspace config to constants (d7bf1c4)

## Release 1.1.0

* Add FAQ entry about CI + larger projects (33ccfbc)
* Apply some housekeeping in tests (25b6553)
* Ignore namespace re-exports in entry files (unless --include-entry-exports) (a07daa4)
* Rename some test files (1756dd4)
* Add `--dependencies` and `--exports` shortcuts (705d96e)

## Release 1.0.2

* Update dependencies (656c3f8)
* Add $schema to Knip's own config (a5fd4c6)
* Implement more of babel config api mock (fixes #42) (7ff9363)

## Release 1.0.1

* Use single way to `maybeAddListedReferencedDependency` and add tests (4917172)
* Point remaining url's from next to main branch (246fd61)

## Release 1.0.0

This release makes the work that started with the [Atlantic release](https://github.com/webpro/knip/releases/tag/1.0.0-alpha.0) back in november generally available. It marks the support for workspaces and plugins. The major drivers are less configuration in your projects and a better architecture for future work. A lot of groundwork has been done, using unit tests and a few pretty large codebases.

Knip's core idea is to find unused files, exports and dependencies, which isn't trivial given the wide range of project structures and the many ways to configure repositories and frameworks nowadays. When exploring the matters in various projects, it has become clear that Knip will never be perfect and 100% accurate, and without any configuration for Knip, large projects will likely have false positives. But I think this is only normal in this type of software development. For instance, ESLint will also not prevent bugs in your code, it helps to find problems in your code. Knip has a similar ambition, but beyond the scope of single files. Motivation and ambition has only grown to do as good as possible to keep projects of any size more maintainable. I believe the investment in developing Knip is totally worth it!

**Breaking changes**

When coming from version v0.13.3 or before, please see [migration to v1](https://github.com/webpro/knip/blob/main/docs/migration-to-v1.md).

---

Changes since the latest beta (`1.0.0-beta.12`):

* Merge branch 'next' (8241d34)
* Disable line to satisfy eslint import/order plugin in Windows (f04a45d)
* Update config schema url in docs (6d9110b)
* Fix for empty webpack config (e57b86c)
* Bump TS target to es2022 (ac15d39)
* Organize package.json differently (bb61a05)
* Add lint-staged and release-it to config validator (e92d218)
* Update some comments in code (f58e713)
* Use central `logIfDebug` helper (8a3f9f6)
* Use single `require` instance everywhere (572b89e)
* Remove workspace cancellation (70bd2ba)
* Housekeeping knip.json (d235b31)
* Always run lint with release (57dac72)
* Fix lint issues (0c2ecdf)

## Release 1.0.0-beta.12

* Fix ts config paths with baseUrl in descendent workspaces (d254ead)
* Fix extends array in nyc config (a188300)
* Fix require array in mocha plugin (8619872)
* Optimize/simplify TS config loader (6cb883e)

## Release 1.0.0-beta.11

* Move TS config loader to smaller dependency (5535018)
* Add strict production mode to release hooks and GA workflow (663a045)

## Release 1.0.0-beta.10

* Update dependencies (c6f4453)
* Move typescript to production dependencies (08ed168)
* Add strict production mode to own dog food (7195318)
* Fix a few type imports (d8d6058)
* Add `postinstall` npm script in production mode (6113699)
* Revisit peer dependencies handling and add tests (80469a1)
* Consider only non-type imports in strict production mode (b2c8266)
* Revisit the --production and --strict modes (e03e8d0)
* Add FAQ and all around edits (12e8353)

## Release 1.0.0-beta.9

* Improve storybook plugin addons handling + add glob patterns for stories to project files (620ed63)
* Support regexes to match package name in plugin enabler (5a01d66)
* Update docs (f768eba)
* Improve create-plugin script and add test + fixture dir (145aa9c)
* Add plugin for lint-staged (closes #33) (6dcc813)
* Improve regex to get package name from absolute path (1b75bab)
* Bail out for the `npx -y` exception (then a dependency does not need to be listed) (0412eec)
* Add release-it plugin (closes #34) (da30a28)
* Add coverage for a plugin config depending an another workspace by package name (8779a4e)
* Move test files (745dc65)

## Release 1.0.0-beta.8

* Move breaking changes to separate migration to v1 document and more doc edits and fixes (8c5cc42)
* Support array of configs and babel options in webpack plugin (11931c9)

## Release 1.0.0-beta.7

* Update dependencies (3107f33)
* Fix isStrict flag for dependencies and improve docs + tests (3d6adf4)
* Rename npm-scripts folder to manifest (8885523)
* Add special case related to typed peer dependency to test (f62d8bb)
* Improve webpack config file pattern and allow config to be a function (12d78c7)
* Minor changes all around (0fb209b)
* Fix up sentry plugin (8fd756f)
* Add test for babel plugin (0646558)
* Improve titles of tests (5e5dbcf)
* Add fixtures and tests for commitlint, nyc, prettier, sentry & webpack plugins (6f71d26)

## Release 1.0.0-beta.6

* Update dependencies (89d1b8c)
* Use root workspace name constant where possible (aec03d5)
* Fix bug where plugin config as array is not handled properly (444ce80)

## Release 1.0.0-beta.5

* Tweak npm publish/release scripts (645f0f1)
* Minor fixes in glob helper (cc277e3)
* Use plugin title in debug output (e485769)
* Add script to create plugin and mention in docs (2a99cf7)
* Add ignoreDependencies to npm test config (32d45ab)
* Generate plugin docs (8b02325)
* Prepare all plugins for docs generator (2afd5bd)
* Add script to generate plugin docs and update index (c0e75a8)
* Prepend ignore patterns in descendant workspace glob (a8b1879)
* Add script to update cli arguments help text in README.md (4becc1a)
* Co-locate help text with parsed cli arguments (d9c5813)
* Remove unused isStrict var (a95ae22)
* Reverse --ignore-entry-exports to --include-entry-exports (better default) (97b0fb7)

## Release 1.0.0-beta.4

* Back to minimal test matrix config (now that the Windows tests pass) (9df6cae)
* Fix and improve zero-config spec (529f741)
* Update dependencies (6aeefe4)
* Use ensurePosixPath to fix issues on Windows/PS (62bd617)
* Fix issue (in Windows) in tests with dynamic import (b745ba9)
* Remove unused cli argument (3036e0a)
* Refactor unused members helpers for cleaner API (2b02141)
* Restore --include-entry-files (with --ignore-entry-exports) (2f37ab9)

## Release 1.0.0-beta.3

* Add new dir and binaries to ignore (d38b216)
* Update dependencies (92b6c0e)
* A bit of housekeeping in tests (3050f8e)
* Exclude template literals with substitutions (410a65d)
* Rename util file (52ff0a5)
* Improve handling of descendent workspaces including negated patterns (a5d27c6)
* Also use defaults in production mode (af87f53)
* Minor refactoring (7d88a75)
* Improve docs and schema.json (9aa46f6)
* Add convenience for creating new plugins (9164321)

## Release 1.0.0-beta.2

* Add entry files to postcss plugin and tests (39c80a1)
* Move cypress spec (7c7aed4)
* Allow to disable config, entry and project globs with empty array (45ec3dd)

## Release 1.0.0-beta.1

* Update dependencies (b5ce140)
* Remove old `exclude` glob in tsconfig.json (d0f9bac)
* Add support for .eslintrc.yml, fix plugin name resolver, and more tests to the eslint plugin (32634df)
* Use one try/catch in the generic loader (02793b9)
* Update docs (da11dc4)

## Release 1.0.0-beta.0

* Update docs (a67bb70)
* Move plugin fixtures to their own dir (479b0b0)
* Add fixture + test for js-only project (w/o tsconfig.json) (bae6533)
* Some housekeeping in plugins (00a2fb2)
* Improve test dir structure (722ce74)

## Release 1.0.0-alpha.8

* Include experimental tasks in test matrix (7f463b7)
* Publish schema.json (0be22a3)

## Release 1.0.0-alpha.7

* Add prettier plugin (c30a351)
* Shorten `skipExportsAnalysisFor` a bit (4d335d7)
* Use defaults for entry/project config per workspace (edb1165)
* Now run tests in sub dirs too (85e3feb)
* Build knip before eating own dog food (a113aba)
* Restore error log in JSON loader, only show in debug/no-progress in generic esm loader (f1aaa60)
* Add sentry plugin (10d4371)
* Add nyc plugin (a93863f)
* Improve a few glob patterns (d980214)
* Allow to disable plugin (per workspace) using `false` (ccbaa20)
* Fix scoped definitely typed package name helpers (d2b7ef1)
* Improve handling of loader/require args in npm scripts + more tests (efd08aa)
* Refactor workspace init/sort (8faa1c9)
* Move "static" class member `resolvePackageName` to helper (788fc8c)
* Update dependencies (2bc78c1)
* Patch esbuild-register to use recent `target`, so @esbuild-kit/esm-loader uses the same as Knip itself (17cd1a2)
* Add commitlint plugin (1b7d373)
* Add config file and exception for prettier config to eslint plugin (68fe292)
* Extend/improve webpack plugin (20f0b7c)
* Add option to ignore dependencies (9a859ca)
* Add support for `plugins` configurations in typescript plugin (6e569cb)
* Add support for `env` configurations in babel plugin and fix/resolve package names (0cc8d42)
* Defer reading TS project options and add test (8bf9937)
* Add webpack plugin (3972c3a)
* Minor change to increase readability (2c4e5c2)
* Add tmp folder to .gitignore (b52f270)
* Add some new keywords to manifest file (6810665)
* Fix missing addons in storybook plugin (8ecf399)
* Fix preset handling in jest plugin (2f6404c)
* Improve (progress) output (c74a7ec)
* Refactor and improve resolving entry files (834ac56)
* Refactor handling of binaries (5b5fa5e)
* Add JSON Schema for project configuration (175abac)
* Refactor configuration schema (breaking change) (70bfe6a)
* Remove obsolete `paths` from config (66026b4)
* Add server.ts to production file entry file patterns in remix plugin (d7e9ac7)
* Remove duplicate patterns and sample file paths in eslint plugin (0f388ca)
* Use constants for issue types and titles (c606202)
* Include root workspace only when configured (56c0452)
* Restore negated workspace patterns (263e326)
* Filter knip itself from dependency issues (4aafb8e)
* Add debug info to eslint plugin (1d39b6c)
* Improve handling of installed binaries/unused dependencies (782c786)
* Move some CLI arguments to constructor for testability (82964a9)
* Remove debug-level arg (0b53d93)
* Remove quotes from enum members (6d3074a)
* Fix issue type titles (016aa4e)

## Release 0.13.3

* Update dependencies (29788ea)
* Add link to releases (949141a)

## Release 1.0.0-alpha.6

* Update dependencies (580b627)
* Get rid of some @​ts-ignore's (2aba9df)
* Improve and colorize output of reporters a bit (3af6624)

## Release 1.0.0-alpha.5

* Replace total sum from performance table with actual total time (831d222)
* Timerify loader (5294626)
* Memoize glob function calls (3ec1420)

## Release 1.0.0-alpha.4

* Don't use non-positionals as first argument binary (43a2dfc)
* Include only plugins with production entry files in production mode (1427e48)
* Fix multiple dependencies sharing the same binary name (46bf9f7)
* Add typescript plugin (cb1675f)
* Fix using `eslint-config` prefix in `extends` (c84e4fd)
* Include (only `start`) npm scripts in production mode (db16e56)
* Exclude plugin globs from source code project file pattern (ebd1a5e)
* Ignore typed dependencies that have a peer dependency that's referenced (c41b504)
* Add `npx` to binaries that take a binary as their first (positional) argument (415be5b)
* Fix initial `NaN` in progress updater (e1e8b68)
* Add getter for peer dependencies (WIP) (cb68bd2)
* Add installed binaries in root workspace referenced from descendant workspaces (dfe59b9)

## Release 1.0.0-alpha.3

* Refactor for readability (1b44c23)
* Defer production suffix removal until usage (63e9f03)
* Refactor eslint plugin to find samples for calculateConfigForFile (5c80263)
* Start support for yaml files in loader (b93e530)
* Add deno and git to global binaries to ignore (4b9a949)
* Some housekeeping in test folder (4330b62)
* No need to sort glob patterns (f23f2ae)
* Fix overrides for plugin configs (c07061b)
* Update docs (12723af)
* Update dependencies (b3135b2)
* Minor refactorings (10bbf9e)
* Improve babel plugin + spec (93d4a9f)
* Add docs for plugins (2359c39)
* Improve eslint plugin (3f417cd)
* Add stryker plugin (cf181a7)
* Add mocha plugin (394da64)
* Remove unused/empty arrays from plugins (269e3c3)
* Some housekeeping across codebase (50c64d9)
* Add --no-exit-code flag (9ea5ce9)
* Less repetition when adding new plugins (2c17f2c)

## Release 1.0.0-alpha.2

* Extend rollup entry file patterns for `rollup.config.ts` files (ecda91e)
* Add `sampleFiles` to (eslint) plugin config & pass config to custom resolver (763e675)
* Improve separation of concerns around source file analyzer (7fb4c1f)
* Refactor and improve handling of DefinitelyTyped (@types/*) packages (5b71a56)

## Release 1.0.0-alpha.1

* Housekeeping (0f6ea29)
* Streamline issue objects (b0c65c6)
* Decouple last bit of entanglement in classes (de7bbaf)
* Add remaining test coverage for plugins (f1e5c8f)

## Release 1.0.0-alpha.0 - Atlantic

This release marks the support for workspaces and plugins. The major drivers are less configuration in your projects and a better architecture for future work. A lot of groundwork has been done, using unit tests and a few pretty large codebases. Releasing this early version allows interested developers to try out the new features. In this early stage, expect bugs and false positives, although I believe Knip can already provide a lot of value.

Knip's core idea is to find unused files, exports and dependencies, which isn't trivial given the wide range of project structures and the many ways to configure repositories and frameworks nowadays. When exploring the matters in various projects, it has become clear that Knip will never be perfect and 100% accurate, and without any configuration for Knip, large projects will likely have false positives. But I think this is only normal in this type of software development. For instance, ESLint will also not prevent bugs in your code, it _helps_ to find problems in your code. Knip has a similar ambition, but beyond the scope of single files. Motivation and ambition has only grown to do as good as possible to keep projects of any size more maintainable. I believe the investment in developing Knip is totally worth it!

Fun fact: this release is named after the Atlantic Ocean since it was done from a height of 10K above sea level:

![IMG_1841](https://user-images.githubusercontent.com/456426/203539299-744d2eac-be1b-44c3-889b-12c30be98292.jpg)

## Release 0.13.2

* Exclude dependencies when dogfooding for now (9d7c2d0)
* Add esbuild dependency (89118d4)

## Release 0.13.1

* Fix up info message (1b98eae)
* Add esm-loader (fixes #23) (0560728)
* Fix ts import (closes #24) (4069971)
* Move unused class/enum members to current features in docs (2a80f35)

## Release 0.13.0

* Update docs (782eff5)
* Rename helper boolean (02a9f3b)
* Move findUnusedClassMembers and findUnusedEnumMembers to util module (a4d74c9)
* Fix runner bail-outs (65cbaec)
* Use easy-table for symbols reporter (567f814)
* Add enumMembers and classMembers to json reporter (a51646a)
* Add parentSymbol to issues (bbaaac1)
* Add initial support for finding unused enum and class members (#11 and #20) (4ff8cc9)

## Release 0.12.2

* Never throw in runner (70e79eb)

## Release 0.12.1

* Update docs (2475576)
* Add remark + remark-preset-webpro (dc8bb40)
* Remove jsdoc options and always read JSDoc public tag (510da6b)
* Set package names in specs (1dafd8d)

## Release 0.13.0-members.1

* Fix runner bail-outs (9cfc0d9)
* Use easy-table for symbols reporter (edc2ac3)
* Add enumMembers and classMembers to json reporter (43aac85)
* Add parentSymbol to issues (1dced2e)

## Release 0.13.0-members.0

* Try initial support for finding unused enum and class members (#11 and #20) (cafb7fe)

## Release 0.12.0

* Update dependency & bump required engine to v18.6 (eaa10cf)
* Use createRequire to loadJSON (for Windows compat) (af56457)
* Use the built-in isBuiltin module (f50700d)
* Add --performance to measure running time of expensive functions and display stats table (bdcbd5d)
* Fix and simplify handling of --dev argument (3fe06c4)
* Migrate to ESM (b2f2f7b)

## Release 0.11.2

* Fix globs on Windows (7d56682)
* Add test to assert support for jsx/tsx files (eda33c4)

## Release 0.11.1

* Reuse base arguments object across specs (4b16a57)
* Add dynamic imports to basic spec (614b542)
* Update dependencies (89ecbfc)

## Release 0.11.0

* Update docs (62c927d)
* Remove external source files from project (fd31f9d)
* Move globbing to its own module (952230b)
* Add (dev) dependencies issues to json reporter (733a663)
* Throw without package.json and assign (dev) dependencies issues to it (c85664e)

## Release 0.10.0

* Use path.posix in pattern modifiers for globs (9ab4d81)
* Normalize key in issues (838f666)
* Add globstar for Windows globbing in npm script (e375f37)
* Add windows-latest to test matrix (aca2223)
* Always ignore node_modules when globbing (cd9e1ce)
* Add devDependencies to base config in specs (1abb0b2)
* Add specs to cover tsconfig paths & globs (03b2e3f)
* Doc edits (fb94502)
* Fix include/exclude CLI argument overrides (db4ebdc)
* Housekeeping the unresolved dependency analyzer (2ae97ec)
* Pass only debug to loggers (08ca0c9)

## Release 0.9.1

* Knip everything again (3b910ea)
* Match issue and report types to simplify code and types (726d403)
* Include dev property when resolving config (f570af5)
* Replace path.relative with relative from cwd (26dad4a)
* Update index.ts (f8e585a)

## Release 0.9.0

* Add json reporter (f3d4c29)
* Fine-tune and document supported Node.js versions (92a09a7)
* Update dependencies (73d65f4)
* Prettify (87707cb)

## Release 0.8.2

* Eat less dog food until we can ignore more fine-grained (81d8933)
* Truncate long duplicates in symbols reporter (37616c9)
* Extract out counters updater and add init messages (41caba9)
* Disable progress updater in debug mode (ae0427b)
* Merge pull request #17 from juliensnz/main (e4b322d)
* fix return code to match the documentation (37a65b5)

## Release 0.8.1

* Increase readability in debug messages (92f431a)
* Fix (un)used anonymous default exports (8e8b537)

## Release 0.8.0

* Add license file (8df3c4f)
* Add fake identifier when no ReferenceFindableNode or Identifier is available (4223df1)
* Use strict and assert.equal more in tests (b6e41f7)
* File finder will not look in parent of cwd (76ff4fa)
* Support zero-config (using tsconfig.json) (7a7895b)
* Merge pull request #14 from sorrycc/patch-1 (7d2d0e7)
* Update README.md (f8db8eb)

## Release 0.7.3

* Fix name in debug output (265fa4f)
* Work the docs again (a1bee4c)

## Release 0.7.2

* Work the docs (f4e7c4d)
* Add Action to run tests in matrix (96085ce)
* Add fixtures and test for JS entry and project files (184774f)

## Release 0.7.1

* Update dependencies (46bdcf4)
* Don't try to parse reporter options when there are none (eb197e7)

## Release 0.7.0

* Clean up some imports/exports (600b0e7)
* Update docs (a6846a7)
* Add codeowners reporter (closes #4) (84893f9)

## Release 0.6.0

* Include peerDependencies and optionalDependencies and add test (closes #9) (9d6a946)

## Release 0.5.0

* Update package.json description and keywords (25425e9)
* Add some basic debugging and comments for future self (closes #6) (3834713)
* Fix processed files count (a6ae54c)

## Release 0.4.2

* Fixed regression in tsconfig path (9595c75)
* Start using custom error classes (a4a2af6)
* Sorry, I couldn't resist (8eed621)

## Release 0.4.1

* Use workaround for globby require/import incompat (a913825)
* Rework gitignore handling (278cbe8)
* Refactor cli and runner (more config flexibility and better tests) (44b6dac)
* Add better reasoning, comparison table and explain name (3170543)
* Fix --cwd to --dir and minor edits in docs (f9f7a95)

## Release 0.4.0

* Knip unused exports (2e7b67a)
* Add --ignore and --no-gitignore options (fixes #8) (b1d10b9)

## Release 0.3.0

* Update docs (60a1280)
* Rename cwd to dir (4054958)
* Skip `export default` syntax (a01f80f)
* Add support for alternative tsconfig.json file path (fb7091f)
* Add support for JavaScript projects (without tsconfig.json) (4e47301)
* Always insert title for unused dev dependency report type (70f018a)
* Minor (0d0ca55)
* Add convenience to add "dev" config and add tests (a468189)

## Release 0.2.0

* Update docs & help (674b29b)
* Find unused and unlisted (dev) dependencies (67d31f3)
* Improve --max-issues and --no-progress handling (984fc5a)

## Release 0.1.2

* Rename project from exportman to knip (dc32cb8)

## Release 0.1.1

* Fix assertions for progress indicator (1d386f3)
* Eating my own dog food (03d6ce1)
* Eat your own dog food (bfe6fba)

## Release 0.1.0

* Update docs (e2629db)
* Swap groups in the reports (49e2c28)
* Rename filePatterns to projectFiles (64f2dc9)
* Fix type output for unreferenced ns types (76b0309)
* Split namespaces members into nsExports & nsTypes (58bd222)
* Use snake-case for CLI arguments (36ac63f)
* Improve default config resolution (f2e3146)
* Fix up tsconfig.json (949c2ab)
* Rename "unused" to "unreferenced" in code (31ba4fa)
* Update docs (48a7acf)
* Look for package.json#exportman and ./exportman.json when no --config is provided (2801e14)
* Minor (826ae9c)
* Add prettier + config (48e83f2)
* Exit with non-zero code until --maxIssues (default: 1) (7279a58)
* Use only & exclude report groups (299326e)

## Release 0.0.6

* Bail out when unused ns member in file was already reported (30d33b1)
* Add links to package.json (744bd65)

## Release 0.0.5

* Update specs (b40c460)
* Update docs (5b8d45b)
* Fix up reporters (f6c1d6b)
* Add jsdoc public tag parsing (ce3c42d)
* Add unused namespace members (68833d9)
* Fix identifier finder for type declarations (7b1b2e1)

## Release 0.0.4

* Refactor issue counters & introduce (custom) reporters (5992620)
* Improve docs (65d93ca)

## Release 0.0.3

* Add feature to use different working dir using --cwd and glob-based config (36e67c7)
* Improve a few names (458cb5a)

## Release 0.0.2

* Fix executable name in docs & help (13f1cf7)
* Refactor issue types to Maps & fix duplicate issue in report (f35e577)
* Fix referenced files for identifier (9f353b4)
* Support `exports.[identifier]` syntax (e787e5d)

## Release 0.0.1

* Initial commit (9589dfe)

