mod batch;
mod json;
pub(crate) mod path;
use json::{PackageName, read_package_name};
mod workspace;

use crate::analyzer::{AnalyzerOptions, CompactFile, Resolution};
use crate::error::{AnalysisError, Result};
use crate::parse::parser_text as backend_text;
use batch::{AnalyzeFileRequest, AnalyzeFileResult};
use napi::bindgen_prelude::{FnArgs, Function, FunctionRef, Utf16String};
use napi_derive::napi;
use oxc_resolver::{ResolveOptions, TsconfigDiscovery, TsconfigOptions, TsconfigReferences};
use path::TrackedResolver as Resolver;
use path::*;
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, LazyLock, Mutex, Weak};
use workspace::{PackageWorkspaceInput, WorkspaceIndex, WorkspaceInput, WorkspacePlan};

#[napi(object)]
pub struct PathEntryInput {
    pub name: Utf16String,
    pub values: Vec<Utf16String>,
}

#[napi(object)]
pub struct ScopedPathsInput {
    pub scope: Utf16String,
    pub paths: Vec<PathEntryInput>,
}

#[napi(object)]
pub struct ScopedRootDirsInput {
    pub scope: Utf16String,
    pub root_dirs: Vec<Utf16String>,
}

#[napi(object)]
pub struct NativeResolverPlan {
    pub custom_compiler_extensions: Vec<Utf16String>,
    pub ts_config_file: Option<Utf16String>,
    pub scoped_paths: Vec<ScopedPathsInput>,
    pub scoped_root_dirs: Vec<ScopedRootDirsInput>,
    pub available_workspace_dirs: Vec<Utf16String>,
    pub workspaces: Vec<WorkspaceInput>,
    pub workspace_by_package_name: Vec<PackageWorkspaceInput>,
    pub builtin_specifiers: Vec<Utf16String>,
    pub yarn_pnp: bool,
}

#[napi(object)]
pub struct NativeResolvedModule {
    pub resolved_file_name: Utf16String,
    pub is_external_library_import: bool,
    pub package_name: Option<Utf16String>,
    pub package_json: Option<String>,
    pub has_package_name: bool,
}

#[napi(object)]
pub struct NativeClassifiedModule {
    pub kind: String,
    pub resolved_file_name: Option<Utf16String>,
    pub is_external_library_import: Option<bool>,
    pub external_specifier: Option<Utf16String>,
}

#[napi(object, object_from_js = false)]
pub struct NativeResolutionDependencies {
    pub paths: Vec<Utf16String>,
    pub files: Vec<Utf16String>,
    pub complete: bool,
}

#[derive(Clone)]
struct Resolved {
    path: Text,
    external: bool,
    package: Option<PackageName>,
    has_package: bool,
}

struct PathMapping {
    scope: Text,
    prefix: Text,
    wildcard: bool,
    values: Vec<Text>,
}

struct StoredPackageName {
    name: Option<PackageName>,
    observation: Option<FileObservation>,
}

type SourceMapping<'a> = dyn FnMut(&[u16], &[u16]) -> Result<()> + 'a;

#[napi]
pub struct NativeModuleResolver {
    core: ResolverCore,
    workers: Vec<ResolverCore>,
    invalid_package_value: FunctionRef<FnArgs<(String, bool)>, ()>,
    source_mapping: Option<FunctionRef<FnArgs<(Utf16String, Utf16String)>, ()>>,
    env: napi::Env,
}

struct ResolverPlan {
    dependencies: Arc<ResolutionDependencies>,
    store_dependencies: Arc<ResolutionDependencies>,
    backend_generations: [u64; 3],
    store_names: Arc<Mutex<HashMap<Text, StoredPackageName>>>,
    path_style: PathStyle,
    wasi_resolver: bool,
    resolver: Arc<Resolver>,
    fallback: Arc<Resolver>,
    manifest: Arc<Resolver>,
    module_cache: Arc<Mutex<ModuleCache>>,
    custom_extensions: HashSet<Text>,
    source_extensions: Vec<Text>,
    module_extensions: HashSet<Text>,
    paths: Vec<PathMapping>,
    root_dirs: Vec<(Text, Vec<Text>)>,
    workspace: Arc<WorkspacePlan>,
    builtins: HashSet<Text>,
}

struct ResolverCore {
    plan: Arc<ResolverPlan>,
    workspace: WorkspaceIndex,
}

impl ResolverCore {
    fn new(plan: Arc<ResolverPlan>) -> Self {
        Self {
            workspace: WorkspaceIndex::new(Arc::clone(&plan.workspace)),
            plan,
        }
    }
}

type ModuleCache = HashMap<Text, HashMap<Text, Option<Resolved>>>;

const DEFAULT_EXTENSIONS: [&str; 8] =
    [".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".mts", ".cts"];

fn create_backends(
    extensions: Vec<String>,
    tsconfig: Option<Utf16String>,
    yarn_pnp: bool,
    wasi_resolver: bool,
) -> (Arc<Resolver>, Arc<Resolver>) {
    let base = ResolveOptions {
        extensions,
        extension_alias: [
            (".js", vec![".js", ".ts", ".tsx", ".d.ts"]),
            (".jsx", vec![".jsx", ".tsx"]),
            (".mjs", vec![".mjs", ".mts", ".d.mts"]),
            (".cjs", vec![".cjs", ".cts", ".d.cts"]),
        ]
        .into_iter()
        .map(|(k, v)| (k.to_owned(), v.into_iter().map(str::to_owned).collect()))
        .collect(),
        condition_names: vec![
            "require".into(),
            "import".into(),
            "node".into(),
            "default".into(),
        ],
        node_path: false,
        yarn_pnp,
        ..ResolveOptions::default()
    };
    let resolver = Arc::new(Resolver::new(ResolveOptions {
        tsconfig: Some(match tsconfig {
            Some(file) => TsconfigDiscovery::Manual(TsconfigOptions {
                config_file: backend_text(&file, wasi_resolver).into(),
                references: TsconfigReferences::Auto,
            }),
            None => TsconfigDiscovery::Auto,
        }),
        ..base.clone()
    }));
    let fallback = Arc::new(Resolver::new(ResolveOptions {
        condition_names: vec![
            "require".into(),
            "import".into(),
            "browser".into(),
            "default".into(),
        ],
        ..base
    }));
    (resolver, fallback)
}

#[napi]
pub struct NativeResolverCache {
    dependencies: Arc<ResolutionDependencies>,
    path_style: PathStyle,
    wasi_resolver: bool,
    module_caches: Mutex<Vec<Weak<Mutex<ModuleCache>>>>,
    store_names: Arc<Mutex<HashMap<Text, StoredPackageName>>>,
    resolver: Arc<Resolver>,
    fallback: Arc<Resolver>,
    manifest: Arc<Resolver>,
    instances: Mutex<Vec<Weak<Resolver>>>,
}

#[napi]
impl NativeResolverCache {
    #[napi(constructor)]
    pub fn new(
        yarn_pnp: bool,
        path_strings_lossy: bool,
        host_windows: bool,
        wasi_resolver: bool,
    ) -> Self {
        let (resolver, fallback) = create_backends(
            DEFAULT_EXTENSIONS
                .iter()
                .chain([".d.ts", ".d.mts", ".d.cts", ".json", ".jsonc"].iter())
                .map(|s| s.to_string())
                .collect(),
            None,
            yarn_pnp,
            wasi_resolver,
        );
        let manifest = Arc::new(Resolver::new(ResolveOptions {
            extensions: vec![".json".into()],
            exports_fields: vec![],
            node_path: false,
            yarn_pnp,
            ..ResolveOptions::default()
        }));
        Self {
            dependencies: Arc::new(ResolutionDependencies::default()),
            wasi_resolver,
            path_style: PathStyle {
                lossy: path_strings_lossy,
                windows: host_windows,
            },
            module_caches: Mutex::new(Vec::new()),
            store_names: Arc::new(Mutex::new(HashMap::new())),
            instances: Mutex::new(vec![
                Arc::downgrade(&resolver),
                Arc::downgrade(&fallback),
                Arc::downgrade(&manifest),
            ]),
            resolver,
            fallback,
            manifest,
        }
    }

    #[napi]
    pub fn clear(&self, recording: Option<bool>) {
        if let Some(recording) = recording {
            self.dependencies.clear();
            self.dependencies.set_recording(recording);
        }
        self.instances.lock().unwrap().retain(|resolver| {
            let Some(resolver) = resolver.upgrade() else {
                return false;
            };
            resolver.clear_cache();
            resolver
                .dependencies
                .set_recording(self.dependencies.recording());
            true
        });
    }
    #[napi]
    pub fn clear_module_caches(&self) {
        self.module_caches.lock().unwrap().retain(|cache| {
            let Some(cache) = cache.upgrade() else {
                return false;
            };
            cache.lock().unwrap().clear();
            true
        });
    }

    #[napi]
    pub fn resolve_file(
        &self,
        specifier: Utf16String,
        containing_file: Utf16String,
    ) -> Option<Utf16String> {
        resolve_file(
            &self.resolver,
            &self.fallback,
            self.path_style,
            self.wasi_resolver,
            &specifier,
            &containing_file,
        )
        .map(Into::into)
    }

    #[napi]
    pub fn resolve_package_manifest_path(
        &self,
        package: Utf16String,
        directory: Utf16String,
    ) -> Option<Utf16String> {
        self.manifest
            .resolve(
                backend_text(&directory, self.wasi_resolver),
                &backend_text(
                    &[package.as_ref(), &ascii("/package.json")].concat(),
                    self.wasi_resolver,
                ),
            )
            .ok()
            .map(|result| {
                self.path_style
                    .to_posix(&result.full_path().to_string_lossy())
                    .into()
            })
    }

    #[napi]
    pub fn read_store_package_name(&self, root: Utf16String) -> Option<NativePackageName> {
        store_name(
            &self.store_names,
            self.path_style,
            &root,
            &self.dependencies,
        )
        .map(|name| match name {
            PackageName::Text(value) => NativePackageName {
                text: Some(value.into()),
                json: None,
            },
            PackageName::Other(value) => NativePackageName {
                text: None,
                json: Some(value),
            },
        })
    }

    #[napi]
    pub fn create_file_resolver(
        &self,
        extensions: Vec<Utf16String>,
        tsconfig: Option<Utf16String>,
        yarn_pnp: bool,
    ) -> NativeFileResolver {
        let (resolver, fallback) = create_backends(
            extensions
                .iter()
                .map(|s| backend_text(s, self.wasi_resolver))
                .collect(),
            tsconfig.filter(|file| !file.is_empty()),
            yarn_pnp,
            self.wasi_resolver,
        );
        resolver
            .dependencies
            .set_recording(self.dependencies.recording());
        fallback
            .dependencies
            .set_recording(self.dependencies.recording());
        {
            let mut instances = self.instances.lock().unwrap();
            instances.retain(|resolver| resolver.strong_count() > 0);
            instances.extend([Arc::downgrade(&resolver), Arc::downgrade(&fallback)]);
        }
        NativeFileResolver {
            resolver,
            fallback,
            path_style: self.path_style,
            wasi_resolver: self.wasi_resolver,
        }
    }
}

fn store_name(
    cache: &Mutex<HashMap<Text, StoredPackageName>>,
    style: PathStyle,
    root: &[u16],
    dependencies: &ResolutionDependencies,
) -> Option<PackageName> {
    if let Some(cached) = cache.lock().unwrap().get(root) {
        dependencies.record_observation(cached.observation.as_ref());
        return cached.name.clone();
    }
    let manifest = style.join(&[root, &ascii("package.json")]);
    let observation = dependencies.recording().then(|| {
        let path = String::from_utf16_lossy(&manifest);
        let contents = std::fs::read(&path);
        FileObservation::new(std::path::Path::new(&path), contents.as_deref().ok())
    });
    dependencies.record_observation(observation.as_ref());
    let name = read_package_name(&manifest);
    cache.lock().unwrap().insert(
        root.to_vec(),
        StoredPackageName {
            name: name.clone(),
            observation,
        },
    );
    name
}

#[napi(object)]
pub struct NativePackageName {
    pub text: Option<Utf16String>,
    pub json: Option<String>,
}

#[napi]
pub struct NativeFileResolver {
    resolver: Arc<Resolver>,
    fallback: Arc<Resolver>,
    path_style: PathStyle,
    wasi_resolver: bool,
}

#[napi]
impl NativeFileResolver {
    #[napi]
    pub fn resolve_file(
        &self,
        specifier: Utf16String,
        containing_file: Utf16String,
    ) -> Option<Utf16String> {
        resolve_file(
            &self.resolver,
            &self.fallback,
            self.path_style,
            self.wasi_resolver,
            &specifier,
            &containing_file,
        )
        .map(Into::into)
    }
}

fn resolve_file(
    resolver: &Resolver,
    fallback: &Resolver,
    path_style: PathStyle,
    wasi_resolver: bool,
    specifier: &[u16],
    file: &[u16],
) -> Option<Text> {
    let file = backend_text(file, wasi_resolver);
    let specifier = backend_text(specifier, wasi_resolver);
    resolver
        .resolve_file(&file, &specifier)
        .or_else(|_| fallback.resolve_file(&file, &specifier))
        .ok()
        .map(|result| path_style.to_posix(&result.full_path().to_string_lossy()))
}

impl ResolverPlan {
    fn new(plan: NativeResolverPlan, cache: &NativeResolverCache) -> Self {
        let custom: Vec<Text> = plan
            .custom_compiler_extensions
            .iter()
            .map(|s| s.to_vec())
            .collect();
        let source_extensions: Vec<Text> = DEFAULT_EXTENSIONS
            .iter()
            .map(|s| ascii(s))
            .chain(custom.iter().cloned())
            .collect();
        let module_extensions = source_extensions
            .iter()
            .cloned()
            .chain([ascii(".json"), ascii(".jsonc")])
            .collect();
        let tsconfig = plan.ts_config_file.filter(|file| !file.is_empty());
        let (resolver, fallback) = if custom.is_empty() && tsconfig.is_none() {
            (Arc::clone(&cache.resolver), Arc::clone(&cache.fallback))
        } else {
            let (resolver, fallback) = create_backends(
                source_extensions
                    .iter()
                    .map(|s| backend_text(s, cache.wasi_resolver))
                    .chain(
                        [".d.ts", ".d.mts", ".d.cts", ".json", ".jsonc"]
                            .iter()
                            .map(|s| s.to_string()),
                    )
                    .collect(),
                tsconfig,
                plan.yarn_pnp,
                cache.wasi_resolver,
            );
            resolver
                .dependencies
                .set_recording(cache.dependencies.recording());
            fallback
                .dependencies
                .set_recording(cache.dependencies.recording());
            {
                let mut instances = cache.instances.lock().unwrap();
                instances.retain(|resolver| resolver.strong_count() > 0);
                instances.extend([Arc::downgrade(&resolver), Arc::downgrade(&fallback)]);
            }
            (resolver, fallback)
        };
        let manifest = Arc::clone(&cache.manifest);
        let backend_generations = [
            resolver.generation(),
            fallback.generation(),
            manifest.generation(),
        ];
        let dependencies = Arc::new(ResolutionDependencies::default());
        dependencies.set_recording(cache.dependencies.recording());
        let mut paths = Vec::new();
        for scope in plan.scoped_paths {
            for entry in scope.paths {
                let star = entry.name.iter().position(|u| *u == 42);
                paths.push(PathMapping {
                    scope: scope.scope.to_vec(),
                    prefix: entry.name[..star.unwrap_or(entry.name.len())].to_vec(),
                    wildcard: star.is_some(),
                    values: entry.values.into_iter().map(|s| s.to_vec()).collect(),
                });
            }
        }
        paths.sort_by_key(|entry| std::cmp::Reverse(entry.scope.len()));
        let mut root_dirs: Vec<(Text, Vec<Text>)> = plan
            .scoped_root_dirs
            .into_iter()
            .filter(|s| s.root_dirs.len() > 1)
            .map(|s| {
                (
                    s.scope.to_vec(),
                    s.root_dirs.into_iter().map(|s| s.to_vec()).collect(),
                )
            })
            .collect();
        root_dirs.sort_by_key(|entry| std::cmp::Reverse(entry.0.len()));
        let module_cache = Arc::new(Mutex::new(HashMap::new()));
        {
            let mut caches = cache.module_caches.lock().unwrap();
            caches.retain(|cache| cache.strong_count() > 0);
            caches.push(Arc::downgrade(&module_cache));
        }
        Self {
            dependencies: Arc::clone(&dependencies),
            store_dependencies: Arc::clone(&cache.dependencies),
            backend_generations,
            store_names: Arc::clone(&cache.store_names),
            path_style: cache.path_style,
            wasi_resolver: cache.wasi_resolver,
            resolver,
            fallback,
            manifest,
            module_cache,
            custom_extensions: custom.into_iter().collect(),
            source_extensions,
            module_extensions,
            paths,
            root_dirs,
            workspace: Arc::new(WorkspacePlan::new(
                plan.available_workspace_dirs,
                plan.workspaces,
                plan.workspace_by_package_name,
                cache.path_style,
                dependencies,
            )),
            builtins: plan
                .builtin_specifiers
                .into_iter()
                .map(|s| s.to_vec())
                .collect(),
        }
    }
}

#[napi]
impl NativeModuleResolver {
    #[napi(constructor)]
    pub fn new(
        env: napi::Env,
        plan: NativeResolverPlan,
        cache: &NativeResolverCache,
        invalid_package_value: FunctionRef<FnArgs<(String, bool)>, ()>,
        source_mapping: Option<FunctionRef<FnArgs<(Utf16String, Utf16String)>, ()>>,
    ) -> Self {
        Self {
            core: ResolverCore::new(Arc::new(ResolverPlan::new(plan, cache))),
            workers: Vec::new(),
            invalid_package_value,
            source_mapping,
            env,
        }
    }

    #[napi]
    pub fn analyze_files(
        &mut self,
        requests: Vec<AnalyzeFileRequest>,
    ) -> napi::Result<Vec<AnalyzeFileResult>> {
        if self.source_mapping.is_some() {
            return Err(napi::Error::from_reason(
                "Batch analysis does not support source-mapping callbacks",
            ));
        }
        Ok(
            batch::analyze_files(&self.core.plan, &mut self.workers, requests)
                .into_iter()
                .map(Into::into)
                .collect(),
        )
    }

    #[napi]
    pub fn resolution_dependencies(&self) -> NativeResolutionDependencies {
        let plan = &self.core.plan;
        let mut paths = HashSet::new();
        let mut files = HashSet::new();
        plan.dependencies.extend_paths(&mut paths, &mut files);
        plan.store_dependencies.extend_paths(&mut paths, &mut files);
        let mut complete = plan.dependencies.complete() && plan.store_dependencies.complete();
        for (index, backend) in [&plan.resolver, &plan.fallback, &plan.manifest]
            .into_iter()
            .enumerate()
        {
            backend.dependencies.extend_paths(&mut paths, &mut files);
            complete &= backend.complete
                && backend.generation() == plan.backend_generations[index]
                && backend.dependencies.complete();
        }
        let mut paths: Vec<Text> = paths
            .into_iter()
            .map(|path| plan.path_style.to_posix(&path.to_string_lossy()))
            .collect();
        paths.sort_unstable();
        paths.dedup();
        let mut files: Vec<Text> = files
            .into_iter()
            .map(|path| plan.path_style.to_posix(&path.to_string_lossy()))
            .collect();
        files.sort_unstable();
        files.dedup();
        NativeResolutionDependencies {
            paths: paths.into_iter().map(Into::into).collect(),
            files: files.into_iter().map(Into::into).collect(),
            complete,
        }
    }

    #[napi]
    pub fn resolution_dependency_fingerprint(
        &self,
        paths: Vec<Utf16String>,
        files: Option<Vec<Utf16String>>,
    ) -> Option<String> {
        dependency_fingerprint(
            paths
                .into_iter()
                .map(|path| String::from_utf16_lossy(&path).into())
                .collect(),
            files
                .unwrap_or_default()
                .into_iter()
                .map(|path| String::from_utf16_lossy(&path).into())
                .collect(),
        )
    }

    #[napi]
    pub fn clear_backend_caches(&self) {
        self.core.plan.resolver.clear_cache();
        self.core.plan.fallback.clear_cache();
        self.core.plan.manifest.clear_cache();
    }

    #[napi]
    pub fn clear_module_cache(&mut self) {
        self.core.plan.module_cache.lock().unwrap().clear();
    }

    #[napi]
    pub fn resolve_module(
        &mut self,
        specifier: Utf16String,
        containing_file: Utf16String,
    ) -> napi::Result<Option<NativeResolvedModule>> {
        Ok(self
            .resolve(&specifier, &containing_file)?
            .map(|r| NativeResolvedModule {
                resolved_file_name: r.path.into(),
                is_external_library_import: r.external,
                package_name: r
                    .package
                    .as_ref()
                    .and_then(|p| p.text())
                    .cloned()
                    .map(Into::into),
                package_json: r.package.and_then(|p| {
                    if let PackageName::Other(raw) = p {
                        Some(raw)
                    } else {
                        None
                    }
                }),
                has_package_name: r.has_package,
            }))
    }

    #[napi]
    pub fn classify_module(
        &mut self,
        specifier: Utf16String,
        containing_file: Utf16String,
        resolve_builtin: bool,
    ) -> napi::Result<NativeClassifiedModule> {
        let r = self.classify(&specifier, &containing_file, resolve_builtin)?;
        Ok(NativeClassifiedModule {
            kind: r.kind,
            resolved_file_name: r
                .resolved_file_name
                .map(|s| crate::analyzer::common::utf16(&s)),
            is_external_library_import: r.is_external_library_import,
            external_specifier: r
                .external_specifier
                .map(|s| crate::analyzer::common::utf16(&s)),
        })
    }

    #[napi]
    pub fn analyze_file(
        &mut self,
        file_path: Utf16String,
        source_text: Utf16String,
        mut options: AnalyzerOptions,
        validate_reg_exp: Function<FnArgs<(Utf16String, Utf16String)>, ()>,
    ) -> napi::Result<CompactFile> {
        options.path_strings_lossy = Some(self.core.plan.path_style.lossy);
        let file = file_path.to_vec();
        let file_path = crate::analyzer::common::encode_utf16(&file);
        let mut resolve = |specifier: &str, builtin: bool| {
            let value = crate::analyzer::common::utf16(specifier);
            self.classify(&value, &file, builtin)
        };
        let mut validate = |pattern: &str, flags: &str| {
            validate_reg_exp.call(
                (
                    crate::analyzer::common::utf16(pattern),
                    crate::analyzer::common::utf16(flags),
                )
                    .into(),
            )
        };
        crate::analyzer::analyze_with_resolver(
            file_path,
            source_text,
            options,
            &mut resolve,
            &mut validate,
        )
    }
}

#[cfg(debug_assertions)]
#[napi]
impl NativeModuleResolver {
    #[napi]
    pub fn take_source_mappings(&mut self) -> Vec<Vec<Utf16String>> {
        self.core
            .workspace
            .take_source_mappings()
            .into_iter()
            .map(|(from, to)| vec![from.into(), to.into()])
            .collect()
    }

    #[napi]
    pub fn inspect_source_path(
        &mut self,
        file: Utf16String,
        extensions: Vec<Utf16String>,
    ) -> napi::Result<Option<Utf16String>> {
        self.with_core(|core, mapping| {
            core.workspace.to_source(
                &file,
                &extensions.iter().map(|s| s.to_vec()).collect::<Vec<_>>(),
                mapping,
            )
        })
        .map(|result| result.map(Into::into))
    }

    #[napi]
    pub fn inspect_package_target(
        &mut self,
        specifier: Utf16String,
        file: Utf16String,
        sources: Vec<Utf16String>,
        modules: Vec<Utf16String>,
    ) -> napi::Result<Option<Utf16String>> {
        self.with_core(|core, mapping| {
            core.workspace.recover_target(
                &specifier,
                &file,
                &sources.iter().map(|s| s.to_vec()).collect::<Vec<_>>(),
                &modules.iter().map(|s| s.to_vec()).collect(),
                mapping,
            )
        })
        .map(|result| result.map(Into::into))
    }

    #[napi]
    pub fn inspect_module_helpers(&mut self, value: Utf16String) -> Vec<Option<Utf16String>> {
        vec![
            Some(sanitize(&value, self.core.plan.path_style).into()),
            package_name(&value).map(Into::into),
            self.core
                .package_from_path(&value)
                .text()
                .cloned()
                .map(Into::into),
        ]
    }

    #[napi]
    pub fn inspect_paths(&self, value: Utf16String, parts: Vec<Utf16String>) -> Vec<Utf16String> {
        vec![
            self.core.plan.path_style.dirname(&value).into(),
            self.core.plan.path_style.extname(&value).into(),
            self.core
                .plan
                .path_style
                .join(&parts.iter().map(|p| p.as_ref()).collect::<Vec<_>>())
                .into(),
            replace_module_extension(&value).into(),
        ]
    }
}

impl NativeModuleResolver {
    fn with_core<T>(
        &mut self,
        operation: impl FnOnce(&mut ResolverCore, &mut SourceMapping<'_>) -> Result<T>,
    ) -> napi::Result<T> {
        let mut callback_error = None;
        let mut mapping = |from: &[u16], to: &[u16]| {
            if let Some(callback) = &self.source_mapping {
                callback
                    .borrow_back(&self.env)
                    .and_then(|callback| {
                        callback.call((from.to_vec().into(), to.to_vec().into()).into())
                    })
                    .map_err(|error| {
                        callback_error = Some(error);
                        AnalysisError::HostCallback
                    })?;
            }
            Ok(())
        };
        operation(&mut self.core, &mut mapping).map_err(|error| {
            if let Some(error) = callback_error {
                return error;
            }
            if let AnalysisError::InvalidPackage { raw, name } = error {
                return self
                    .invalid_package_value
                    .borrow_back(&self.env)
                    .and_then(|callback| callback.call((raw, name).into()))
                    .err()
                    .unwrap_or_else(|| {
                        napi::Error::from_reason("Invalid package metadata handler did not throw")
                    });
            }
            error.into_napi()
        })
    }

    fn resolve(&mut self, name: &[u16], file: &[u16]) -> napi::Result<Option<Resolved>> {
        self.with_core(|core, mapping| core.resolve(name, file, mapping))
    }

    fn classify(&mut self, name: &[u16], file: &[u16], builtin: bool) -> napi::Result<Resolution> {
        self.with_core(|core, mapping| core.classify(name, file, builtin, mapping))
    }
}

impl ResolverCore {
    fn backend(&self, specifier: &[u16], file: &[u16]) -> Option<Text> {
        resolve_file(
            &self.plan.resolver,
            &self.plan.fallback,
            self.plan.path_style,
            self.plan.wasi_resolver,
            specifier,
            file,
        )
    }

    fn resolve(
        &mut self,
        name: &[u16],
        file: &[u16],
        source_mapping: &mut SourceMapping<'_>,
    ) -> Result<Option<Resolved>> {
        let dir = self.plan.path_style.dirname(file);
        if let Some(result) = self
            .plan
            .module_cache
            .lock()
            .unwrap()
            .get(&dir)
            .and_then(|cache| cache.get(name))
        {
            return Ok(result.clone());
        }
        let result = self.uncached(name, file, &dir, source_mapping)?;
        self.plan
            .module_cache
            .lock()
            .unwrap()
            .entry(dir)
            .or_default()
            .insert(name.to_vec(), result.clone());
        Ok(result)
    }

    fn uncached(
        &mut self,
        name: &[u16],
        file: &[u16],
        dir: &[u16],
        source_mapping: &mut SourceMapping<'_>,
    ) -> Result<Option<Resolved>> {
        let specifier = sanitize(name, self.plan.path_style);
        if self.plan.builtins.contains(&specifier) {
            return Ok(None);
        }
        if let Some(path) = self.backend(&specifier, file) {
            return self
                .to_result(&specifier, file, path, source_mapping)
                .map(Some);
        }
        for mapping in &self.plan.paths {
            if !under(dir, &mapping.scope) {
                continue;
            }
            if if mapping.wildcard {
                specifier.starts_with(&mapping.prefix)
            } else {
                specifier == mapping.prefix
            } {
                let captured = if mapping.wildcard {
                    &specifier[mapping.prefix.len()..]
                } else {
                    &[]
                };
                for value in &mapping.values {
                    let mapped = if let Some(star) = value.iter().position(|u| *u == 42) {
                        [&value[..star], captured, &value[star + 1..]].concat()
                    } else {
                        value.clone()
                    };
                    if let Some(path) = self.backend(&mapped, file) {
                        return self
                            .to_result(&specifier, file, path, source_mapping)
                            .map(Some);
                    }
                }
            }
        }
        if !self.plan.path_style.absolute(&specifier) {
            for (scope, roots) in &self.plan.root_dirs {
                if !under(dir, scope) {
                    continue;
                }
                for root in roots {
                    if !under(dir, root) {
                        continue;
                    }
                    let relative = if dir == root {
                        &[]
                    } else {
                        &dir[root.len() + 1..]
                    };
                    for target in roots {
                        if target == root {
                            continue;
                        }
                        if let Some(path) = self.backend(
                            &self.plan.path_style.join(&[target, relative, &specifier]),
                            file,
                        ) {
                            return self
                                .to_result(&specifier, file, path, source_mapping)
                                .map(Some);
                        }
                    }
                }
            }
        }
        if let Some(path) = self.workspace.recover_target(
            &specifier,
            file,
            &self.plan.source_extensions,
            &self.plan.module_extensions,
            source_mapping,
        )? {
            return self
                .to_result(&specifier, file, path, source_mapping)
                .map(Some);
        }
        let candidate = if self.plan.path_style.absolute(&specifier) {
            specifier
        } else {
            self.plan.path_style.join(&[dir, &specifier])
        };
        Ok(
            exists(&candidate, &self.plan.dependencies).then_some(Resolved {
                path: candidate,
                external: false,
                package: None,
                has_package: false,
            }),
        )
    }

    fn to_result(
        &mut self,
        specifier: &[u16],
        file: &[u16],
        path: Text,
        source_mapping: &mut SourceMapping<'_>,
    ) -> Result<Resolved> {
        let mapped = if !self
            .plan
            .custom_extensions
            .contains(&self.plan.path_style.extname(&path))
        {
            self.workspace
                .to_source(&path, &self.plan.source_extensions, source_mapping)?
        } else {
            None
        };
        let external =
            mapped.as_ref().is_none_or(|mapped| mapped == &path) && in_node_modules(&path);
        let package = external.then(|| self.attributed_package(specifier, file, &path));
        Ok(Resolved {
            path: mapped.unwrap_or(path),
            external,
            package,
            has_package: true,
        })
    }

    fn attributed_package(&mut self, specifier: &[u16], file: &[u16], path: &[u16]) -> PackageName {
        let package = self.package_from_path(path);
        let Some(requested) = package_name(specifier) else {
            return package;
        };
        if package.text() == Some(&requested) {
            return package;
        }
        let request = [requested.as_slice(), &ascii("/package.json")].concat();
        let dir = backend_text(&self.plan.path_style.dirname(file), self.plan.wasi_resolver);
        if let Ok(manifest) = self
            .plan
            .manifest
            .resolve(dir, &backend_text(&request, self.plan.wasi_resolver))
        {
            let root = self.plan.path_style.dirname(
                &self
                    .plan
                    .path_style
                    .to_posix(&manifest.full_path().to_string_lossy()),
            );
            if path.starts_with(&root) && path.get(root.len()) == Some(&47) {
                return PackageName::Text(requested);
            }
        }
        package
    }

    fn package_from_path(&mut self, original: &[u16]) -> PackageName {
        let original = original
            .strip_prefix(ascii("file://").as_slice())
            .unwrap_or(original);
        if contains(original, &ascii("node_modules/.bin/")) {
            return PackageName::Text(extract_binary(original));
        }
        let value: Text = original
            .iter()
            .map(|u| {
                if self.plan.path_style.windows && *u == 92 {
                    47
                } else {
                    *u
                }
            })
            .collect();
        let marker = ascii("node_modules/");
        let mut last = None;
        let mut cursor = 0;
        let mut previous_end = 0;
        while cursor + marker.len() <= value.len() {
            if value[cursor..].starts_with(&marker) {
                let start = cursor + marker.len();
                if start >= previous_end && start < value.len() && value[start] != 47 {
                    let first_end = value[start..]
                        .iter()
                        .position(|u| *u == 47)
                        .map_or(value.len(), |p| start + p);
                    let end = if value[start] == 64
                        && first_end > start + 1
                        && first_end < value.len()
                        && value.get(first_end + 1).is_some_and(|u| *u != 47)
                    {
                        value[first_end + 1..]
                            .iter()
                            .position(|u| *u == 47)
                            .map_or(value.len(), |p| first_end + 1 + p)
                    } else {
                        first_end
                    };
                    last = Some(value[start..end].to_vec());
                    previous_end = end;
                    cursor += 1;
                    continue;
                }
            }
            cursor += 1;
        }
        let Some(last) = last else {
            return PackageName::Text(original.to_vec());
        };
        if last != ascii(".store") {
            return PackageName::Text(last);
        }
        let store = ascii("/node_modules/.store/");
        let mut root = None;
        for index in 0..value.len() {
            if !value[index..].starts_with(&store)
                || value[..index]
                    .iter()
                    .any(|u| [10, 13, 0x2028, 0x2029].contains(u))
            {
                continue;
            }
            let start = index + store.len();
            let Some(end) = value[start..]
                .iter()
                .position(|u| *u == 47)
                .map(|p| start + p)
            else {
                continue;
            };
            if end == start {
                continue;
            }
            let package = ascii("/package");
            if value[end..].starts_with(&package)
                && (end + package.len() == value.len()
                    || value.get(end + package.len()) == Some(&47))
            {
                root = Some(value[..end + package.len()].to_vec());
            }
        }
        let Some(root) = root else {
            return PackageName::Text(last);
        };
        store_name(
            &self.plan.store_names,
            self.plan.path_style,
            &root,
            &self.plan.store_dependencies,
        )
        .unwrap_or(PackageName::Text(last))
    }

    fn classify(
        &mut self,
        specifier: &[u16],
        file: &[u16],
        resolve_builtin: bool,
        source_mapping: &mut SourceMapping<'_>,
    ) -> Result<Resolution> {
        let builtin = self.plan.builtins.contains(specifier);
        if builtin && !resolve_builtin {
            return Ok(Resolution {
                kind: "builtin".into(),
                ..Resolution::default()
            });
        }
        let Some(module) = self.resolve(specifier, file, source_mapping)? else {
            return Ok(Resolution {
                kind: if builtin { "builtin" } else { "unresolved" }.into(),
                ..Resolution::default()
            });
        };
        let mut external = None;
        if module.external {
            let initial = if in_node_modules(specifier) {
                self.package_from_path(specifier)
            } else {
                PackageName::Text(specifier.to_vec())
            };
            let Some(initial) = initial.text() else {
                return self.invalid_package(&initial, false);
            };
            let mut sanitized = sanitize(initial, self.plan.path_style);
            if let Some(package) = &module.package {
                if package.truthy() {
                    let Some(package) = package.text() else {
                        return self.invalid_package(package, true);
                    };
                    if starts_like_package(package)
                        && package_name(&sanitized).as_ref() != Some(package)
                    {
                        sanitized = package.clone();
                    }
                }
            }
            if starts_like_package(&sanitized) {
                external = Some(crate::analyzer::common::encode_utf16(&sanitized));
            }
        }
        Ok(Resolution {
            kind: if builtin { "builtin" } else { "resolved" }.into(),
            resolved_file_name: Some(crate::analyzer::common::encode_utf16(&module.path)),
            is_external_library_import: Some(module.external),
            external_specifier: external,
        })
    }

    fn invalid_package(&self, value: &PackageName, name: bool) -> Result<Resolution> {
        if let PackageName::Other(raw) = value {
            return Err(AnalysisError::InvalidPackage {
                raw: raw.clone(),
                name,
            });
        }
        Err(AnalysisError::InvalidArgument(
            "Invalid package metadata handler did not throw".into(),
        ))
    }
}

fn starts_like_package(specifier: &[u16]) -> bool {
    fn start(u: u16) -> bool {
        (65..=90).contains(&u) || (97..=122).contains(&u) || (48..=57).contains(&u)
    }
    match specifier.first() {
        Some(64) => specifier
            .get(1)
            .is_some_and(|u| start(*u) || [46, 95, 126].contains(u)),
        Some(u) => start(*u),
        None => false,
    }
}

fn package_name(specifier: &[u16]) -> Option<Text> {
    let tilde = specifier.first() == Some(&126)
        && specifier.get(1).is_some_and(|u| starts_like_package(&[*u]));
    if !starts_like_package(specifier) && !tilde {
        return None;
    }
    let start = if specifier.first() == Some(&64) {
        let Some(slash) = specifier[1..].iter().position(|u| *u == 47).map(|p| p + 1) else {
            return Some(specifier.to_vec());
        };
        slash + 1
    } else {
        0
    };
    let end = specifier[start..]
        .iter()
        .position(|u| *u == 47 || *u == 64)
        .map_or(specifier.len(), |p| start + p);
    Some(specifier[..end].to_vec())
}

fn sanitize(specifier: &[u16], path_style: PathStyle) -> Text {
    if specifier.starts_with(&ascii("node:"))
        || path_style.absolute(specifier)
        || specifier.first() == Some(&58)
        || specifier.starts_with(&ascii("virtual:"))
    {
        return specifier.to_vec();
    }
    let subpath = specifier.first() == Some(&35);
    let mut start = 0;
    let mut end = specifier.len();
    let mut colon = None;
    let mut slash = false;
    for (index, unit) in specifier.iter().enumerate() {
        if index == start && (*unit == 33 || *unit == 45) {
            start += 1;
            continue;
        }
        if *unit == 47 && colon.is_none() {
            slash = true;
        }
        if colon.is_none() && *unit == 58 && !slash && !subpath {
            colon = Some(index);
        }
        if *unit == 33 || *unit == 63 || (*unit == 35 && index > start) {
            end = index;
            break;
        }
    }
    specifier[start..colon.filter(|p| *p < end).unwrap_or(end)].to_vec()
}

fn extract_binary(value: &[u16]) -> Text {
    static NODE_MODULES: LazyLock<regex::Regex> =
        LazyLock::new(|| regex::Regex::new(r"(?:\.{0,2}/)*node_modules/").unwrap());
    static NPM_BIN: LazyLock<regex::Regex> =
        LazyLock::new(|| regex::Regex::new(r"\$\(npm bin\)/([A-Za-z0-9_]+)").unwrap());
    static VERSION: LazyLock<regex::Regex> = LazyLock::new(|| {
        regex::Regex::new(r"([^\t\n\x0b\x0c\r \u{00a0}\u{1680}\u{2000}-\u{200a}\u{2028}\u{2029}\u{202f}\u{205f}\u{3000}\u{feff}]+)@[^\n\r\u{2028}\u{2029}]*").unwrap()
    });
    let encoded = crate::analyzer::common::encode_utf16(value);
    let stripped = NODE_MODULES.replace(&encoded, "");
    let stripped = stripped.strip_prefix(".bin/").unwrap_or(&stripped);
    let stripped = NPM_BIN.replace(stripped, "$1");
    let stripped = VERSION.replace(&stripped, "$1");
    crate::analyzer::common::utf16(&stripped).to_vec()
}
