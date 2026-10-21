use std::sync::{Arc, Mutex};

use napi::bindgen_prelude::Utf16String;
use napi_derive::napi;

use super::{ResolverCore, ResolverPlan};
use crate::analyzer::common::{decode_utf16, encode_utf16};
use crate::analyzer::{AnalyzerOptions, CompactFile, RawCompactFile, analyze_source};

#[napi(object)]
pub struct AnalyzeFileRequest {
    pub file_path: Utf16String,
    pub options: AnalyzerOptions,
}

#[napi(object, object_from_js = false)]
pub struct AnalyzeFileResult {
    pub file: Option<CompactFile>,
    pub filters: Vec<Vec<Utf16String>>,
    pub unreadable: Option<bool>,
    pub error: Option<String>,
}

#[derive(Debug, Default, PartialEq, Eq)]
pub(super) struct RawFileResult {
    pub file: Option<RawCompactFile>,
    pub filters: Vec<(Vec<u16>, Vec<u16>)>,
    pub unreadable: bool,
    pub error: Option<String>,
}

impl From<RawFileResult> for AnalyzeFileResult {
    fn from(result: RawFileResult) -> Self {
        Self {
            file: result.file.map(Into::into),
            filters: result
                .filters
                .into_iter()
                .map(|(pattern, flags)| vec![pattern.into(), flags.into()])
                .collect(),
            unreadable: result.unreadable.then_some(true),
            error: result.error,
        }
    }
}

fn analyze_file(core: &mut ResolverCore, mut request: AnalyzeFileRequest) -> RawFileResult {
    let bytes = match std::fs::read(String::from_utf16_lossy(&request.file_path)) {
        Ok(bytes) => bytes,
        Err(_) => {
            return RawFileResult {
                unreadable: true,
                ..RawFileResult::default()
            };
        }
    };
    request.options.path_strings_lossy = Some(core.plan.path_style.lossy);
    let mut filters = Vec::new();
    let source = String::from_utf8_lossy(&bytes);
    let mut resolve = |specifier: &str, builtin: bool| {
        core.classify(
            &decode_utf16(specifier),
            &request.file_path,
            builtin,
            &mut |_, _| Ok(()),
        )
    };
    let mut validate = |pattern: &str, flags: &str| {
        filters.push((decode_utf16(pattern), decode_utf16(flags)));
        Ok(())
    };
    match analyze_source(
        &encode_utf16(&request.file_path),
        &source,
        None,
        request.options,
        &mut resolve,
        &mut validate,
    ) {
        Ok(file) => RawFileResult {
            file: Some(file),
            filters,
            ..RawFileResult::default()
        },
        Err(error) => RawFileResult {
            error: Some(error.message()),
            ..RawFileResult::default()
        },
    }
}

fn worker_count(requests: usize) -> usize {
    if cfg!(target_family = "wasm") || requests < 4 {
        return usize::from(requests > 0);
    }
    std::thread::available_parallelism()
        .map_or(1, usize::from)
        .min(4)
        .min(requests)
}

pub(super) fn analyze_files(
    plan: &Arc<ResolverPlan>,
    workers: &mut Vec<ResolverCore>,
    requests: Vec<AnalyzeFileRequest>,
) -> Vec<RawFileResult> {
    analyze_with_workers(plan, workers, requests, worker_count)
}

fn analyze_with_workers(
    plan: &Arc<ResolverPlan>,
    workers: &mut Vec<ResolverCore>,
    requests: Vec<AnalyzeFileRequest>,
    count: impl FnOnce(usize) -> usize,
) -> Vec<RawFileResult> {
    if requests.is_empty() {
        return Vec::new();
    }
    let worker_count = count(requests.len()).max(1).min(requests.len());
    while workers.len() < worker_count {
        workers.push(ResolverCore::new(Arc::clone(plan)));
    }
    if worker_count == 1 {
        return requests
            .into_iter()
            .map(|request| analyze_file(&mut workers[0], request))
            .collect();
    }
    let mut results: Vec<_> = (0..requests.len())
        .map(|_| RawFileResult::default())
        .collect();
    let requests = Mutex::new(requests.into_iter().enumerate());
    let run = |core: &mut ResolverCore| {
        let mut results = Vec::new();
        loop {
            let request = requests.lock().unwrap().next();
            let Some((index, request)) = request else {
                break;
            };
            results.push((index, analyze_file(core, request)));
        }
        results
    };
    std::thread::scope(|scope| {
        let (first, rest) = workers[..worker_count].split_first_mut().unwrap();
        let mut handles = Vec::with_capacity(rest.len());
        for core in rest {
            let run = &run;
            handles.push(scope.spawn(move || run(core)));
        }
        for (index, result) in run(first) {
            results[index] = result;
        }
        for handle in handles {
            for (index, result) in handle.join().unwrap() {
                results[index] = result;
            }
        }
    });
    results
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::resolver::{NativeResolverCache, NativeResolverPlan, path::ascii};
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicUsize, Ordering};

    struct Fixture(PathBuf);

    impl Fixture {
        fn new() -> Self {
            static NEXT: AtomicUsize = AtomicUsize::new(0);
            let root = std::env::temp_dir().join(format!(
                "knip-native-batch-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            std::fs::create_dir(&root).unwrap();
            let fixture = Self(root.canonicalize().unwrap());
            fixture.put("package.json", br#"{"name":"batch-test","type":"module"}"#);
            fixture
        }

        fn put(&self, name: &str, contents: impl AsRef<[u8]>) -> String {
            let path = self.0.join(name);
            std::fs::create_dir_all(path.parent().unwrap()).unwrap();
            std::fs::write(&path, contents).unwrap();
            path.to_str().unwrap().to_owned()
        }

        fn path(&self, name: &str) -> Utf16String {
            self.0.join(name).to_str().unwrap().to_owned().into()
        }

        fn plan(&self) -> Arc<ResolverPlan> {
            let cache = NativeResolverCache::new(false, false, cfg!(windows), false);
            Arc::new(ResolverPlan::new(
                NativeResolverPlan {
                    custom_compiler_extensions: Vec::new(),
                    ts_config_file: None,
                    scoped_paths: Vec::new(),
                    scoped_root_dirs: Vec::new(),
                    available_workspace_dirs: Vec::new(),
                    workspaces: Vec::new(),
                    workspace_by_package_name: Vec::new(),
                    builtin_specifiers: vec!["node:fs".to_owned().into()],
                    yarn_pnp: false,
                },
                &cache,
            ))
        }

        fn request(&self, name: &str) -> AnalyzeFileRequest {
            AnalyzeFileRequest {
                file_path: self.path(name),
                options: AnalyzerOptions {
                    is_fix_exports: true,
                    is_fix_types: true,
                    is_report_exports: true,
                    include_local_refs: true,
                    count_ref_types: vec!["*".into()],
                    tags: vec![vec![], vec![]],
                    plugins: vec!["webpack".into(), "vite".into()],
                    ..AnalyzerOptions::default()
                },
            }
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            std::fs::remove_dir_all(&self.0).unwrap();
        }
    }

    fn compatibility(core: &mut ResolverCore, request: AnalyzeFileRequest) -> RawFileResult {
        let bytes = std::fs::read(String::from_utf16_lossy(&request.file_path)).unwrap();
        let original: Vec<_> = String::from_utf8_lossy(&bytes).encode_utf16().collect();
        let source =
            crate::parse::parser_text(&original, request.options.wasi_parser.unwrap_or(false));
        let mut filters = Vec::new();
        let file = analyze_source(
            &encode_utf16(&request.file_path),
            &source,
            Some(&original),
            request.options,
            &mut |specifier, builtin| {
                core.classify(
                    &decode_utf16(specifier),
                    &request.file_path,
                    builtin,
                    &mut |_, _| Ok(()),
                )
            },
            &mut |pattern, flags| {
                filters.push((decode_utf16(pattern), decode_utf16(flags)));
                Ok(())
            },
        )
        .unwrap();
        RawFileResult {
            file: Some(file),
            filters,
            ..RawFileResult::default()
        }
    }

    #[test]
    fn workers_and_results_are_send_without_host_handles() {
        fn send<T: Send>() {}
        fn sync<T: Sync>() {}
        send::<ResolverCore>();
        sync::<ResolverPlan>();
        send::<AnalyzeFileRequest>();
        send::<RawFileResult>();
        assert_eq!(worker_count(0), 0);
        assert_eq!(worker_count(1), 1);
        assert!((1..=4).contains(&worker_count(100)));
    }

    #[test]
    fn serial_and_worker_cores_share_source_mapping_misses() {
        let fixture = Fixture::new();
        let target = ascii(&fixture.put("dist/value.js", "export const value = 1;"));
        let mut plan = fixture.plan();
        Arc::get_mut(&mut plan).unwrap().workspace = Arc::new(super::super::WorkspacePlan::new(
            vec![fixture.0.to_str().unwrap().to_owned().into()],
            vec![super::super::workspace::WorkspaceInput {
                dir: fixture.0.to_str().unwrap().to_owned().into(),
                source_maps: vec![super::super::workspace::SourceMapInput {
                    src_dir: fixture.path("src"),
                    out_dir: fixture.path("dist"),
                }],
                imports: None,
                exports: None,
            }],
            vec![],
            plan.path_style,
            Arc::clone(&plan.dependencies),
        ));
        let mut serial = ResolverCore::new(Arc::clone(&plan));
        let mut workers: Vec<_> = (0..4)
            .map(|_| ResolverCore::new(Arc::clone(&plan)))
            .collect();
        let initial = workers[0]
            .resolve(&target, &fixture.path("first/index.ts"), &mut |_, _| Ok(()))
            .unwrap()
            .unwrap();
        assert_eq!(initial.path, target);
        fixture.put("src/value.ts", "export const value = 2;");
        assert!(!plan.dependencies.complete());
        plan.resolver.clear_cache();
        plan.fallback.clear_cache();
        plan.module_cache.lock().unwrap().clear();
        for (index, core) in workers.iter_mut().chain([&mut serial]).enumerate() {
            let resolved = core
                .resolve(
                    &target,
                    &fixture.path(&format!("later-{index}/index.ts")),
                    &mut |_, _| Ok(()),
                )
                .unwrap()
                .unwrap();
            assert_eq!(resolved.path, target, "core {index}");
        }
    }

    #[test]
    fn dependency_recording_covers_configs_packages_and_missing_candidates() {
        let fixture = Fixture::new();
        fixture.put("src/index.ts", "");
        let target = fixture.put("src/value.ts", "export const value = 1;");
        fixture.put(
            "tsconfig.json",
            r#"{"extends":"./config/base.json","references":[{"path":"./referenced"}]}"#,
        );
        fixture.put(
            "config/base.json",
            r#"{"compilerOptions":{"baseUrl":"..","paths":{"@value":["src/value.ts"]}}}"#,
        );
        fixture.put("referenced/tsconfig.json", r#"{"include":["./*.ts"]}"#);
        fixture.put(
            "node_modules/example/package.json",
            r#"{"name":"example","exports":"./one.js"}"#,
        );
        fixture.put("node_modules/example/one.js", "");
        let plan = fixture.plan();
        let mut core = ResolverCore::new(Arc::clone(&plan));
        assert_eq!(
            core.resolve(
                &ascii("@value"),
                &fixture.path("src/index.ts"),
                &mut |_, _| Ok(())
            )
            .unwrap()
            .unwrap()
            .path,
            ascii(&target)
        );
        assert!(
            core.resolve(
                &ascii("./later"),
                &fixture.path("src/index.ts"),
                &mut |_, _| Ok(())
            )
            .unwrap()
            .is_none()
        );
        assert!(
            core.resolve(
                &ascii("example"),
                &fixture.path("src/index.ts"),
                &mut |_, _| Ok(())
            )
            .unwrap()
            .is_some()
        );
        let mut paths = std::collections::HashSet::new();
        let mut files = std::collections::HashSet::new();
        for dependencies in [
            &plan.resolver.dependencies,
            &plan.fallback.dependencies,
            &plan.dependencies,
        ] {
            dependencies.extend_paths(&mut paths, &mut files);
            assert!(dependencies.complete());
        }
        for name in [
            "tsconfig.json",
            "config/base.json",
            "referenced/tsconfig.json",
            "node_modules/example/package.json",
        ] {
            assert!(files.contains(&fixture.0.join(name)), "{name}");
        }
        for name in ["src/value.ts", "src/later.ts", "src/tsconfig.json"] {
            assert!(paths.contains(&fixture.0.join(name)), "{name}");
        }
        assert!(!files.contains(&fixture.0.join("src/value.ts")));
        let fingerprint = || {
            super::super::path::dependency_fingerprint(
                paths.iter().cloned().collect(),
                files.iter().cloned().collect(),
            )
            .unwrap()
        };
        let initial = fingerprint();
        fixture.put("src/value.ts", "export const changedValue = 123456;");
        fixture.put("src/unrelated.ts", "");
        assert_eq!(fingerprint(), initial);
        fixture.put("src/later.ts", "");
        assert_ne!(fingerprint(), initial);
        std::fs::remove_file(fixture.0.join("src/later.ts")).unwrap();
        assert_eq!(fingerprint(), initial);
        fixture.put("config/base.json", "{}");
        assert_ne!(fingerprint(), initial);
        assert!(!plan.resolver.dependencies.complete());
    }

    #[test]
    fn observed_backend_probes_reject_late_higher_priority_targets() {
        let fixture = Fixture::new();
        fixture.put("src/index.ts", "");
        let target = fixture.put("generated/target.ts", "export const value = 1;");
        let plan = fixture.plan();
        let mut core = ResolverCore::new(Arc::clone(&plan));
        let resolve = |core: &mut ResolverCore| {
            core.resolve(
                &ascii("../generated/target"),
                &fixture.path("src/index.ts"),
                &mut |_, _| Ok(()),
            )
            .unwrap()
            .unwrap()
            .path
        };
        assert_eq!(resolve(&mut core), ascii(&target));
        assert!(plan.resolver.dependencies.complete());
        let generated = fixture.put("generated/target.js", "export const value = 2;");
        assert_eq!(resolve(&mut core), ascii(&target));
        assert!(!plan.resolver.dependencies.complete());
        let mut fresh = ResolverCore::new(fixture.plan());
        assert_eq!(resolve(&mut fresh), ascii(&generated));
    }

    #[test]
    fn dropped_resolver_plans_release_registered_module_caches() {
        let cache = NativeResolverCache::new(false, false, cfg!(windows), false);
        let plan = Arc::new(ResolverPlan::new(
            NativeResolverPlan {
                custom_compiler_extensions: vec![".vue".to_owned().into()],
                ts_config_file: None,
                scoped_paths: Vec::new(),
                scoped_root_dirs: Vec::new(),
                available_workspace_dirs: Vec::new(),
                workspaces: Vec::new(),
                workspace_by_package_name: Vec::new(),
                builtin_specifiers: Vec::new(),
                yarn_pnp: false,
            },
            &cache,
        ));
        let modules = Arc::downgrade(&plan.module_cache);
        let backend = Arc::downgrade(&plan.resolver);
        let worker = ResolverCore::new(Arc::clone(&plan));
        plan.module_cache
            .lock()
            .unwrap()
            .entry(ascii("/workspace"))
            .or_default()
            .insert(ascii("./absent"), None);
        cache.clear_module_caches();
        assert!(plan.module_cache.lock().unwrap().is_empty());
        let before = plan.resolver.generation();
        cache.clear(None);
        assert_ne!(plan.resolver.generation(), before);
        drop(plan);
        assert!(modules.upgrade().is_some());
        assert!(backend.upgrade().is_some());
        drop(worker);
        assert!(modules.upgrade().is_none());
        assert!(backend.upgrade().is_none());
        cache.clear_module_caches();
        cache.clear(None);
        assert!(cache.module_caches.lock().unwrap().is_empty());
        assert_eq!(cache.instances.lock().unwrap().len(), 3);
        let file_resolver = cache.create_file_resolver(vec![".vue".to_owned().into()], None, false);
        let backend = Arc::downgrade(&file_resolver.resolver);
        drop(file_resolver);
        assert!(backend.upgrade().is_none());
        cache.clear(None);
        assert_eq!(cache.instances.lock().unwrap().len(), 3);
    }

    #[test]
    #[cfg(unix)]
    fn dependency_fingerprints_track_symlink_redirects_and_probe_types() {
        let fixture = Fixture::new();
        let first = PathBuf::from(fixture.put("first.ts", "export const first = 1;"));
        let second = PathBuf::from(fixture.put("second.ts", "export const second = 1;"));
        let link = fixture.0.join("linked.ts");
        std::os::unix::fs::symlink(&first, &link).unwrap();
        let paths = vec![
            link.clone(),
            first.clone(),
            fixture.0.join("missing.ts"),
            fixture.0.clone(),
        ];
        let fingerprint = || {
            super::super::path::dependency_fingerprint(paths.clone(), Default::default()).unwrap()
        };
        let initial = fingerprint();
        fixture.put("first.ts", "export const changed = 'different length';");
        fixture.put("unrelated.ts", "");
        assert_eq!(fingerprint(), initial);
        std::fs::remove_file(&link).unwrap();
        std::os::unix::fs::symlink(&second, &link).unwrap();
        assert_ne!(fingerprint(), initial);
        std::fs::remove_file(&link).unwrap();
        std::os::unix::fs::symlink(&first, &link).unwrap();
        assert_eq!(fingerprint(), initial);
        std::fs::remove_file(&first).unwrap();
        assert_ne!(fingerprint(), initial);
    }

    #[test]
    fn parallel_results_preserve_order_and_match_sequential_utf16_analysis() {
        let fixture = Fixture::new();
        for index in 0..48 {
            fixture.put(&format!("module-{index}.ts"), format!(
                "import {{ value as previous }} from './module-{}.js';\nimport 'node:fs';\nconst emoji = '🍎';\n/** @public */\nexport const value = [previous, emoji, {index}];\nexport enum Fruit {{ Apple, Pear }}\nrequire.context('./contexts', true, /🍐/u);",
                (index + 1) % 48
            ));
        }
        let mut serial = ResolverCore::new(fixture.plan());
        let expected: Vec<_> = (0..48)
            .map(|index| compatibility(&mut serial, fixture.request(&format!("module-{index}.ts"))))
            .collect();
        let plan = fixture.plan();
        let mut workers = Vec::new();
        for count in [1, 4, 2, 4] {
            let requests = (0..48)
                .map(|index| fixture.request(&format!("module-{index}.ts")))
                .collect();
            let actual = analyze_with_workers(&plan, &mut workers, requests, |_| count);
            assert_eq!(actual, expected);
            for worker in &workers {
                assert!(Arc::ptr_eq(&plan, &worker.plan));
                assert!(Arc::ptr_eq(&plan.resolver, &worker.plan.resolver));
            }
        }
        assert!(analyze_files(&plan, &mut workers, Vec::new()).is_empty());
    }

    #[test]
    fn unreadable_and_failed_files_do_not_displace_successful_results() {
        let fixture = Fixture::new();
        fixture.put("first.ts", "export const first = 1;");
        fixture.put("unsupported.ts", "export const unsupported = 1;");
        fixture.put("last.ts", "export const last = 1;");
        let target = fixture.put(
            "node_modules/.store/example/package/index.js",
            "export default 1;",
        );
        fixture.put(
            "node_modules/.store/example/package/package.json",
            br#"{"name":{"startsWith":"x"}}"#,
        );
        fixture.put(
            "metadata.ts",
            format!(
                "import value from {};",
                serde_json::to_string(&target).unwrap()
            ),
        );
        let mut invalid = fixture.request("unsupported.ts");
        invalid.options.plugins = vec!["unsupported".into()];
        let plan = fixture.plan();
        let results = analyze_with_workers(
            &plan,
            &mut Vec::new(),
            vec![
                fixture.request("first.ts"),
                fixture.request("missing.ts"),
                invalid,
                fixture.request("metadata.ts"),
                fixture.request(""),
                fixture.request("last.ts"),
            ],
            |_| 4,
        );
        assert_eq!(results.len(), 6);
        assert!(
            results[0]
                .file
                .as_ref()
                .unwrap()
                .strings
                .contains(&ascii("first"))
        );
        assert!(results[1].unreadable);
        assert_eq!(
            results[2].error.as_deref(),
            Some("Unsupported native visitor: unsupported")
        );
        assert_eq!(
            results[3].error.as_deref(),
            Some("Invalid package metadata requires host analysis")
        );
        assert!(results[4].unreadable);
        assert!(
            results[5]
                .file
                .as_ref()
                .unwrap()
                .strings
                .contains(&ascii("last"))
        );
        for result in &results[1..5] {
            assert!(result.file.is_none());
            assert!(result.filters.is_empty());
        }
        let mut serial = ResolverCore::new(plan);
        assert!(matches!(
            serial.classify(
                &ascii(&target),
                &fixture.path("metadata.ts"),
                false,
                &mut |_, _| Ok(())
            ),
            Err(crate::error::AnalysisError::InvalidPackage { name: false, .. })
        ));
    }

    #[test]
    fn decoding_and_utf16_positions_match_node_replacement_rules() {
        let fixture = Fixture::new();
        let cases: &[(&[u8], &str)] = &[
            (&[0xed, 0xa0, 0x80], "���"),
            (&[0xf0, 0x9f, 0x8d], "�"),
            (&[0xe2, 0x82, 0x41], "�A"),
            (&[0xf4, 0x90, 0x80, 0x80], "����"),
            (&[0xc0, 0xaf], "��"),
            (&[0xff, 0xfe], "��"),
        ];
        for (index, (bytes, expected)) in cases.iter().enumerate() {
            assert_eq!(String::from_utf8_lossy(bytes), *expected);
            let mut source = "\u{feff}// 🍎\r\n/** @public */\r\nexport const 中文 = '"
                .as_bytes()
                .to_vec();
            source.extend_from_slice(bytes);
            source.extend_from_slice("';\nexport { 中文 as café };".as_bytes());
            fixture.put(&format!("café-{index}.ts"), source);
        }
        let plan = fixture.plan();
        let mut serial = ResolverCore::new(fixture.plan());
        for raw_comments in [false, true] {
            for wasi_parser in [false, true] {
                let request = |index| {
                    let mut request = fixture.request(&format!("café-{index}.ts"));
                    request.options.raw_comments = Some(raw_comments);
                    request.options.wasi_parser = Some(wasi_parser);
                    request
                };
                let expected: Vec<_> = (0..cases.len())
                    .map(|index| compatibility(&mut serial, request(index)))
                    .collect();
                let results = analyze_with_workers(
                    &plan,
                    &mut Vec::new(),
                    (0..cases.len()).map(request).collect(),
                    |_| 4,
                );
                assert_eq!(results, expected);
            }
        }
    }

    #[test]
    fn regexp_validation_is_deferred_in_encounter_order() {
        let fixture = Fixture::new();
        fixture.put("contexts.js", r#"require.context('./first', true, /\.tsx$/i); require.context('./second', false, /(/u);"#);
        let results = analyze_files(
            &fixture.plan(),
            &mut Vec::new(),
            vec![fixture.request("contexts.js")],
        );
        assert!(results[0].file.is_some());
        assert_eq!(
            results[0].filters,
            [(ascii(r"\.tsx$"), ascii("i")), (ascii("("), ascii("u"))]
        );
    }
}
