use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};

use super::SourceMapping;
use crate::error::Result;
use napi::bindgen_prelude::Utf16String;
use napi_derive::napi;

use super::package_name;
use super::path::{
    PathStyle, ResolutionDependencies, Text, ascii, exists, is_dts, is_file, is_ts,
    replace_module_extension, under,
};

#[napi(object)]
pub struct WorkspaceInput {
    pub dir: Utf16String,
    pub source_maps: Vec<SourceMapInput>,
    pub imports: Option<PackageTargetInput>,
    pub exports: Option<PackageTargetInput>,
}

#[napi(object)]
pub struct SourceMapInput {
    pub src_dir: Utf16String,
    pub out_dir: Utf16String,
}

#[napi(object)]
pub struct PackageWorkspaceInput {
    pub name: Utf16String,
    pub index: u32,
}

#[napi(object)]
pub struct PackageTargetInput {
    pub kind: u32,
    pub text: Option<Utf16String>,
    pub keys: Vec<Utf16String>,
    pub children: Vec<PackageTargetInput>,
}

pub struct WorkspacePlan {
    path_style: PathStyle,
    available: HashSet<Text>,
    workspaces: Vec<WorkspaceInput>,
    by_dir: HashMap<Text, usize>,
    by_package: HashMap<Text, usize>,
    source_cache: Mutex<HashMap<Text, Option<Text>>>,
    dependencies: Arc<ResolutionDependencies>,
    #[cfg(debug_assertions)]
    source_mappings: Mutex<Vec<(Text, Text)>>,
}

pub struct WorkspaceIndex {
    plan: Arc<WorkspacePlan>,
    by_file: HashMap<Text, Option<usize>>,
}

impl WorkspacePlan {
    pub fn new(
        available: Vec<Utf16String>,
        workspaces: Vec<WorkspaceInput>,
        by_package: Vec<PackageWorkspaceInput>,
        path_style: PathStyle,
        dependencies: Arc<ResolutionDependencies>,
    ) -> Self {
        let mut directories = HashSet::with_capacity(available.len());
        for dir in available {
            directories.insert(dir.to_vec());
        }
        let mut by_dir = HashMap::with_capacity(workspaces.len());
        for (index, workspace) in workspaces.iter().enumerate() {
            if dependencies.recording() {
                let manifest = String::from_utf16_lossy(
                    &path_style.join(&[&workspace.dir, &ascii("package.json")]),
                );
                let contents = std::fs::read(&manifest);
                dependencies.record_file(std::path::Path::new(&manifest), contents.as_deref().ok());
            }
            by_dir.insert(workspace.dir.to_vec(), index);
        }
        let mut packages = HashMap::with_capacity(by_package.len());
        for package in by_package {
            packages.insert(package.name.to_vec(), package.index as usize);
        }
        Self {
            path_style,
            available: directories,
            workspaces,
            by_dir,
            by_package: packages,
            source_cache: Mutex::new(HashMap::new()),
            dependencies,
            #[cfg(debug_assertions)]
            source_mappings: Mutex::new(Vec::new()),
        }
    }
}

impl WorkspaceIndex {
    pub fn new(plan: Arc<WorkspacePlan>) -> Self {
        Self {
            plan,
            by_file: HashMap::new(),
        }
    }

    fn find_workspace(&mut self, file_path: &[u16]) -> Option<usize> {
        if let Some(result) = self.by_file.get(file_path) {
            return *result;
        }
        let mut result = None;
        for index in (0..file_path.len()).rev() {
            if file_path[index] != 47 {
                continue;
            }
            let dir = &file_path[..index];
            if self.plan.available.contains(dir) {
                result = self.plan.by_dir.get(dir).copied();
                break;
            }
        }
        self.by_file.insert(file_path.to_vec(), result);
        result
    }

    pub fn to_source(
        &mut self,
        file_path: &[u16],
        extensions: &[Text],
        source_mapping: &mut SourceMapping<'_>,
    ) -> Result<Option<Text>> {
        if !self.plan.path_style.internal(file_path) || is_ts(file_path) {
            return Ok(None);
        }
        if let Some(result) = self
            .plan
            .source_cache
            .lock()
            .unwrap()
            .get(file_path)
            .cloned()
        {
            return Ok(result);
        }
        let mut result = None;
        if let Some(index) = self.find_workspace(file_path) {
            for pair in &self.plan.workspaces[index].source_maps {
                if !under(file_path, &pair.out_dir) && *pair.src_dir != *pair.out_dir {
                    continue;
                }
                let mut base = pair.src_dir.to_vec();
                base.extend_from_slice(&file_path[pair.out_dir.len().min(file_path.len())..]);
                let base = replace_module_extension(&base);
                for extension in extensions {
                    let mut candidate = base.clone();
                    candidate.extend_from_slice(extension);
                    if exists(&candidate, &self.plan.dependencies) {
                        if candidate != file_path {
                            result = Some(candidate);
                        }
                        break;
                    }
                }
                if result.is_some() {
                    break;
                }
            }
        }
        if let Some(source) = &result {
            source_mapping(file_path, source)?;
            #[cfg(debug_assertions)]
            self.plan
                .source_mappings
                .lock()
                .unwrap()
                .push((file_path.to_vec(), source.clone()));
        }
        Ok(self
            .plan
            .source_cache
            .lock()
            .unwrap()
            .entry(file_path.to_vec())
            .or_insert(result)
            .clone())
    }

    pub fn recover_target(
        &mut self,
        specifier: &[u16],
        containing_file: &[u16],
        source_extensions: &[Text],
        module_extensions: &HashSet<Text>,
        source_mapping: &mut SourceMapping<'_>,
    ) -> Result<Option<Text>> {
        let is_imports = specifier.first() == Some(&35);
        let selected = (|| {
            let (index, key) = if is_imports {
                (self.find_workspace(containing_file)?, specifier.to_vec())
            } else {
                let package = package_name(specifier)?;
                let index = *self.plan.by_package.get(&package)?;
                let mut key = vec![46];
                if package != specifier {
                    key.extend_from_slice(&specifier[package.len()..]);
                }
                (index, key)
            };
            let workspace = self.plan.workspaces.get(index)?;
            let map = package_map(workspace, is_imports)?;
            let selected = get_package_map_target(map, &key)?;
            let source_target = pick_string_target(selected.target(map))
                .and_then(|target| expand_package_target(target, selected.pattern_match.as_deref()))
                .and_then(|target| to_package_path(&workspace.dir, &target, self.plan.path_style));
            Some((index, selected, source_target))
        })();
        let Some((index, selected, source_target)) = selected else {
            return Ok(None);
        };
        if let Some(target) = source_target {
            if let Some(source) = self.to_source(&target, source_extensions, source_mapping)? {
                return Ok(Some(source));
            }
        }
        let workspace = &self.plan.workspaces[index];
        let Some(map) = package_map(workspace, is_imports) else {
            return Ok(None);
        };
        Ok(pick_existing_package_target(
            selected.target(map),
            &workspace.dir,
            selected.pattern_match.as_deref(),
            module_extensions,
            self.plan.path_style,
            &self.plan.dependencies,
        ))
    }

    #[cfg(debug_assertions)]

    pub fn take_source_mappings(&mut self) -> Vec<(Text, Text)> {
        std::mem::take(&mut self.plan.source_mappings.lock().unwrap())
    }
}

fn package_map(workspace: &WorkspaceInput, is_imports: bool) -> Option<&PackageTargetInput> {
    if is_imports {
        workspace.imports.as_ref()
    } else {
        workspace.exports.as_ref()
    }
}

struct PackageMapTarget {
    child: Option<usize>,
    pattern_match: Option<Text>,
}

impl PackageMapTarget {
    fn target<'a>(&self, map: &'a PackageTargetInput) -> &'a PackageTargetInput {
        self.child.map_or(map, |index| &map.children[index])
    }
}

fn get_package_map_target(map: &PackageTargetInput, key: &[u16]) -> Option<PackageMapTarget> {
    let root = || {
        (key == [46]).then_some(PackageMapTarget {
            child: None,
            pattern_match: None,
        })
    };
    if map.kind != 3 {
        return root();
    }
    let mut has_subpaths = false;
    for (index, subpath) in map.keys.iter().enumerate() {
        if !matches!(subpath.first(), Some(46 | 35)) {
            continue;
        }
        has_subpaths = true;
        if &**subpath == key {
            return Some(PackageMapTarget {
                child: Some(index),
                pattern_match: None,
            });
        }
    }
    if !has_subpaths {
        return root();
    }
    let mut best = None;
    let mut best_prefix = 0;
    let mut best_length = 0;
    for (index, subpath) in map.keys.iter().enumerate() {
        let Some(star) = subpath.iter().position(|unit| *unit == 42) else {
            continue;
        };
        let prefix = &subpath[..star];
        let suffix = &subpath[star + 1..];
        if key.len() < prefix.len() + suffix.len()
            || !key.starts_with(prefix)
            || !key.ends_with(suffix)
        {
            continue;
        }
        if best.is_none()
            || prefix.len() > best_prefix
            || (prefix.len() == best_prefix && subpath.len() > best_length)
        {
            best = Some(PackageMapTarget {
                child: Some(index),
                pattern_match: Some(key[prefix.len()..key.len() - suffix.len()].to_vec()),
            });
            best_prefix = prefix.len();
            best_length = subpath.len();
        }
    }
    best
}

fn ascii_eq(value: &[u16], ascii: &[u8]) -> bool {
    value
        .iter()
        .copied()
        .eq(ascii.iter().copied().map(u16::from))
}

fn pick_string_target(value: &PackageTargetInput) -> Option<&[u16]> {
    match value.kind {
        1 => value.text.as_deref(),
        2 | 3 => {
            if value.kind == 3 {
                for (key, child) in value.keys.iter().zip(&value.children) {
                    if ![b"default".as_slice(), b"node", b"import", b"require"]
                        .iter()
                        .any(|condition| ascii_eq(key, condition))
                    {
                        continue;
                    }
                    if let Some(target) = pick_string_target(child).filter(|text| !text.is_empty())
                    {
                        return Some(target);
                    }
                }
            }
            for child in &value.children {
                if let Some(target) = pick_string_target(child).filter(|text| !text.is_empty()) {
                    return Some(target);
                }
            }
            None
        }
        _ => None,
    }
}

fn strip_dot(segment: &[u16]) -> Option<&[u16]> {
    if let Some(rest) = segment.strip_prefix(&[46]) {
        return Some(rest);
    }
    if segment.starts_with(&[37, 50]) && matches!(segment.get(2), Some(69 | 101)) {
        return Some(&segment[3..]);
    }
    None
}

fn has_invalid_segments(value: &[u16]) -> bool {
    for segment in value.split(|unit| *unit == 47 || *unit == 92) {
        if segment
            .iter()
            .copied()
            .map(|unit| {
                if (65..=90).contains(&unit) {
                    unit + 32
                } else {
                    unit
                }
            })
            .eq(b"node_modules".iter().copied().map(u16::from))
        {
            return true;
        }
        if let Some(rest) = strip_dot(segment) {
            if rest.is_empty() || strip_dot(rest).is_some_and(|tail| tail.is_empty()) {
                return true;
            }
        }
    }
    false
}

fn expand_package_target(target: &[u16], pattern_match: Option<&[u16]>) -> Option<Text> {
    if !target.starts_with(&[46, 47]) || has_invalid_segments(&target[2..]) {
        return None;
    }
    if !target.contains(&42) {
        return Some(target.to_vec());
    }
    let capture = pattern_match?;
    if has_invalid_segments(capture) {
        return None;
    }
    let mut result = Vec::with_capacity(target.len());
    let mut start = 0;
    for (star, unit) in target.iter().enumerate() {
        if *unit != 42 {
            continue;
        }
        result.extend_from_slice(&target[start..star]);
        let mut index = 0;
        while index < capture.len() {
            if capture[index] == 36 {
                match capture.get(index + 1) {
                    Some(36) => result.push(36),
                    Some(38) => result.push(42),
                    Some(96) => result.extend_from_slice(&target[..star]),
                    Some(39) => result.extend_from_slice(&target[star + 1..]),
                    _ => {
                        result.push(36);
                        index += 1;
                        continue;
                    }
                }
                index += 2;
            } else {
                result.push(capture[index]);
                index += 1;
            }
        }
        start = star + 1;
    }
    result.extend_from_slice(&target[start..]);
    Some(result)
}

fn to_package_path(dir: &[u16], target: &[u16], path_style: PathStyle) -> Option<Text> {
    let candidate = path_style.join(&[dir, target]);
    (candidate.starts_with(dir) && candidate.get(dir.len()) == Some(&47)).then_some(candidate)
}

fn pick_existing_package_target(
    value: &PackageTargetInput,
    dir: &[u16],
    pattern_match: Option<&[u16]>,
    module_extensions: &HashSet<Text>,
    path_style: PathStyle,
    dependencies: &ResolutionDependencies,
) -> Option<Text> {
    match value.kind {
        1 => {
            let target = expand_package_target(value.text.as_deref()?, pattern_match)?;
            if is_dts(&target) || !module_extensions.contains(&path_style.extname(&target)) {
                return None;
            }
            let candidate = to_package_path(dir, &target, path_style)?;
            is_file(&candidate, dependencies).then_some(candidate)
        }
        2 | 3 => {
            for (index, child) in value.children.iter().enumerate() {
                if value.kind == 3
                    && value
                        .keys
                        .get(index)
                        .is_some_and(|key| ascii_eq(key, b"types"))
                {
                    continue;
                }
                if let Some(target) = pick_existing_package_target(
                    child,
                    dir,
                    pattern_match,
                    module_extensions,
                    path_style,
                    dependencies,
                ) {
                    return Some(target);
                }
            }
            None
        }
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicUsize, Ordering};

    struct Fixture(PathBuf);

    impl Fixture {
        fn new() -> Self {
            static NEXT: AtomicUsize = AtomicUsize::new(0);
            let path = std::env::temp_dir().join(format!(
                "knip-source-memo-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            std::fs::create_dir_all(path.join("src")).unwrap();
            Self(path.canonicalize().unwrap())
        }

        fn path(&self, file: &str) -> Text {
            ascii(self.0.join(file).to_str().unwrap())
        }

        fn plan(&self) -> Arc<WorkspacePlan> {
            let dir = ascii(self.0.to_str().unwrap());
            Arc::new(WorkspacePlan::new(
                vec![dir.clone().into()],
                vec![WorkspaceInput {
                    dir: dir.into(),
                    source_maps: vec![SourceMapInput {
                        src_dir: self.path("src").into(),
                        out_dir: self.path("dist").into(),
                    }],
                    imports: None,
                    exports: None,
                }],
                vec![],
                PathStyle {
                    lossy: false,
                    windows: cfg!(windows),
                },
                Arc::new(ResolutionDependencies::default()),
            ))
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            std::fs::remove_dir_all(&self.0).unwrap();
        }
    }

    #[test]
    fn source_mapping_callbacks_run_unlocked_and_failures_do_not_cache() {
        let fixture = Fixture::new();
        std::fs::write(fixture.0.join("src/value.ts"), "").unwrap();
        let plan = fixture.plan();
        let target = fixture.path("dist/value.js");
        let extensions = [ascii(".js"), ascii(".ts")];
        let error =
            WorkspaceIndex::new(Arc::clone(&plan)).to_source(&target, &extensions, &mut |_, _| {
                assert!(plan.source_cache.try_lock().unwrap().is_empty());
                Err(crate::error::AnalysisError::HostCallback)
            });
        assert!(matches!(
            error,
            Err(crate::error::AnalysisError::HostCallback)
        ));
        assert!(plan.source_cache.lock().unwrap().is_empty());
        let source = WorkspaceIndex::new(Arc::clone(&plan))
            .to_source(&target, &extensions, &mut |_, _| Ok(()))
            .unwrap();
        assert_eq!(source, Some(fixture.path("src/value.ts")));
    }

    #[test]
    fn concurrent_source_mapping_probes_return_the_committed_winner() {
        let fixture = Fixture::new();
        std::fs::write(fixture.0.join("src/value.js"), "").unwrap();
        let plan = fixture.plan();
        let target = fixture.path("dist/value.js");
        let extensions = [ascii(".js"), ascii(".ts")];
        let (ready, wait_ready) = std::sync::mpsc::sync_channel(0);
        let (resume, wait_resume) = std::sync::mpsc::sync_channel(0);
        std::thread::scope(|scope| {
            let first_plan = Arc::clone(&plan);
            let first_target = target.clone();
            let first_extensions = extensions.clone();
            let first = scope.spawn(move || {
                WorkspaceIndex::new(Arc::clone(&first_plan))
                    .to_source(&first_target, &first_extensions, &mut |_, _| {
                        assert!(first_plan.source_cache.try_lock().unwrap().is_empty());
                        ready.send(()).unwrap();
                        wait_resume.recv().unwrap();
                        Ok(())
                    })
                    .unwrap()
            });
            wait_ready.recv().unwrap();
            std::fs::remove_file(fixture.0.join("src/value.js")).unwrap();
            std::fs::write(fixture.0.join("src/value.ts"), "").unwrap();
            let second = WorkspaceIndex::new(Arc::clone(&plan))
                .to_source(&target, &extensions, &mut |_, _| Ok(()))
                .unwrap();
            assert_eq!(second, Some(fixture.path("src/value.ts")));
            resume.send(()).unwrap();
            assert_eq!(first.join().unwrap(), second);
        });
    }
}
