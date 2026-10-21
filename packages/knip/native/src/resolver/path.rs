use std::collections::{
    HashMap, HashSet,
    hash_map::{DefaultHasher, Entry},
};
use std::ffi::OsString;
use std::hash::{Hash, Hasher};
use std::io;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};

use oxc_resolver::{
    FileMetadata, FileSystem, FileSystemOs, ResolveError, ResolveOptions, ResolverGeneric,
};

pub type Text = Vec<u16>;

#[derive(Clone, Copy, Eq, Hash, PartialEq)]
enum ProbeKind {
    Metadata,
    SymlinkMetadata,
    ReadLink,
    Canonicalize,
}

#[derive(Eq, PartialEq)]
enum ProbeResult {
    Metadata(bool, bool, bool),
    Path(PathBuf),
    Error(io::ErrorKind),
    Unsupported,
}

fn metadata_result(result: Result<FileMetadata, &io::Error>) -> ProbeResult {
    match result {
        Ok(metadata) => {
            ProbeResult::Metadata(metadata.is_file(), metadata.is_dir(), metadata.is_symlink())
        }
        Err(error) => ProbeResult::Error(error.kind()),
    }
}

fn path_result(result: &io::Result<PathBuf>) -> ProbeResult {
    match result {
        Ok(path) => ProbeResult::Path(path.clone()),
        Err(error) => ProbeResult::Error(error.kind()),
    }
}

fn link_result(result: &Result<PathBuf, ResolveError>) -> ProbeResult {
    match result {
        Ok(path) => ProbeResult::Path(path.clone()),
        Err(ResolveError::IOError(error)) => {
            ProbeResult::Error(io::Error::from(error.clone()).kind())
        }
        Err(_) => ProbeResult::Unsupported,
    }
}

impl ProbeKind {
    fn inspect(self, path: &Path) -> ProbeResult {
        match self {
            Self::Metadata => metadata_result(FileSystemOs::metadata(path).as_ref().copied()),
            Self::SymlinkMetadata => {
                metadata_result(FileSystemOs::symlink_metadata(path).as_ref().copied())
            }
            Self::ReadLink => link_result(&FileSystemOs::read_link(path)),
            Self::Canonicalize => path_result(&FileSystemOs::canonicalize(path)),
        }
    }
}

#[derive(Default)]
pub struct ResolutionDependencies {
    paths: Mutex<HashSet<PathBuf>>,
    files: Mutex<HashMap<PathBuf, Option<u64>>>,
    probes: Mutex<HashMap<(PathBuf, ProbeKind), ProbeResult>>,
    invalidated: AtomicBool,
    disabled: AtomicBool,
}

pub struct FileObservation {
    path: PathBuf,
    contents: Option<u64>,
}

impl FileObservation {
    pub fn new(path: &Path, contents: Option<&[u8]>) -> Self {
        Self {
            path: path.to_path_buf(),
            contents: contents.map(content_hash),
        }
    }
}

impl ResolutionDependencies {
    pub fn recording(&self) -> bool {
        !self.disabled.load(Ordering::Relaxed)
    }

    pub fn set_recording(&self, recording: bool) {
        self.disabled.store(!recording, Ordering::Relaxed);
    }

    fn should_record(&self) -> bool {
        if self.recording() {
            return true;
        }
        if !self.invalidated.load(Ordering::Relaxed) {
            self.invalidated.store(true, Ordering::Relaxed);
        }
        false
    }

    pub fn record(&self, path: &Path) {
        if !self.should_record() {
            return;
        }
        self.paths.lock().unwrap().insert(path.to_path_buf());
    }

    pub fn record_file(&self, path: &Path, contents: Option<&[u8]>) {
        if !self.should_record() {
            return;
        }
        self.record_file_hash(path, contents.map(content_hash));
    }

    pub fn record_observation(&self, observation: Option<&FileObservation>) {
        if !self.should_record() {
            return;
        }
        if let Some(observation) = observation {
            self.record_file_hash(&observation.path, observation.contents);
        } else {
            self.invalidated.store(true, Ordering::Relaxed);
        }
    }

    fn record_file_hash(&self, path: &Path, observed: Option<u64>) {
        self.record(path);
        match self.files.lock().unwrap().entry(path.to_path_buf()) {
            Entry::Vacant(entry) => {
                entry.insert(observed);
            }
            Entry::Occupied(entry) => {
                if *entry.get() != observed {
                    self.invalidated.store(true, Ordering::Relaxed);
                }
            }
        }
    }

    fn record_probe(&self, path: &Path, kind: ProbeKind, observed: impl FnOnce() -> ProbeResult) {
        if !self.should_record() {
            return;
        }
        let observed = observed();
        self.record(path);
        match self
            .probes
            .lock()
            .unwrap()
            .entry((path.to_path_buf(), kind))
        {
            Entry::Vacant(entry) => {
                entry.insert(observed);
            }
            Entry::Occupied(entry) => {
                if *entry.get() != observed {
                    self.invalidated.store(true, Ordering::Relaxed);
                }
            }
        }
    }

    pub fn extend_paths(&self, paths: &mut HashSet<PathBuf>, files: &mut HashSet<PathBuf>) {
        paths.extend(self.paths.lock().unwrap().iter().cloned());
        files.extend(self.files.lock().unwrap().keys().cloned());
    }

    pub fn complete(&self) -> bool {
        self.complete_with_workers(validation_worker_count)
    }

    fn complete_with_workers(&self, workers: impl Fn(usize) -> usize) -> bool {
        if !self.recording() || self.invalidated.load(Ordering::Relaxed) {
            return false;
        }
        {
            let files = self.files.lock().unwrap();
            if !validate_observations(&files, workers(files.len()), |path, expected| {
                let actual = match std::fs::read(path) {
                    Ok(bytes) => Some(content_hash(&bytes)),
                    Err(error) if missing(&error) => None,
                    Err(_) => return false,
                };
                &actual == expected
            }) {
                return false;
            }
        }
        let probes = self.probes.lock().unwrap();
        validate_observations(&probes, workers(probes.len()), |(path, kind), expected| {
            *expected != ProbeResult::Unsupported && kind.inspect(path) == *expected
        })
    }

    pub fn clear(&self) {
        self.paths.lock().unwrap().clear();
        self.files.lock().unwrap().clear();
        self.probes.lock().unwrap().clear();
        self.invalidated.store(false, Ordering::Relaxed);
    }
}

fn validation_worker_count(observations: usize) -> usize {
    if cfg!(target_family = "wasm") || observations < 2048 {
        return 1;
    }
    std::thread::available_parallelism()
        .map_or(1, usize::from)
        .min(4)
        .min(observations / 1024)
}

fn validate_observations<K: Sync, V: Sync>(
    observations: &HashMap<K, V>,
    workers: usize,
    validate: impl Fn(&K, &V) -> bool + Sync,
) -> bool {
    let workers = workers.max(1).min(observations.len().max(1));
    if workers == 1 {
        return observations.iter().all(|(key, value)| validate(key, value));
    }
    let entries: Vec<_> = observations.iter().collect();
    let failed = AtomicBool::new(false);
    let run = |entries: &[(&K, &V)]| {
        for (key, value) in entries {
            if failed.load(Ordering::Relaxed) {
                break;
            }
            if !validate(key, value) {
                failed.store(true, Ordering::Relaxed);
                break;
            }
        }
    };
    std::thread::scope(|scope| {
        let mut chunks = entries.chunks(entries.len().div_ceil(workers));
        let first = chunks.next().unwrap();
        let mut handles = Vec::with_capacity(workers - 1);
        for chunk in chunks {
            let run = &run;
            match std::thread::Builder::new().spawn_scoped(scope, move || run(chunk)) {
                Ok(handle) => handles.push(handle),
                Err(_) => run(chunk),
            }
        }
        run(first);
        let mut panic = None;
        for handle in handles {
            if let Err(error) = handle.join() {
                if panic.is_none() {
                    panic = Some(error);
                }
            }
        }
        if let Some(error) = panic {
            std::panic::resume_unwind(error);
        }
    });
    !failed.load(Ordering::Relaxed)
}

fn content_hash(bytes: &[u8]) -> u64 {
    let mut hash = DefaultHasher::new();
    bytes.hash(&mut hash);
    hash.finish()
}

fn missing(error: &io::Error) -> bool {
    matches!(
        error.kind(),
        io::ErrorKind::NotFound | io::ErrorKind::NotADirectory
    )
}

pub struct TrackedResolver {
    inner: ResolverGeneric<RecordingFileSystem>,
    pub dependencies: Arc<ResolutionDependencies>,
    pub complete: bool,
    generation: AtomicU64,
}

impl TrackedResolver {
    pub fn new(options: ResolveOptions) -> Self {
        let dependencies = Arc::new(ResolutionDependencies::default());
        let file_system = RecordingFileSystem {
            inner: FileSystemOs::new(options.yarn_pnp),
            dependencies: Arc::clone(&dependencies),
        };
        Self {
            complete: !options.yarn_pnp,
            inner: ResolverGeneric::new_with_file_system(file_system, options),
            dependencies,
            generation: AtomicU64::new(0),
        }
    }

    pub fn clear_cache(&self) {
        self.inner.clear_cache();
        self.dependencies.clear();
        self.generation.fetch_add(1, Ordering::Relaxed);
    }

    pub fn generation(&self) -> u64 {
        self.generation.load(Ordering::Relaxed)
    }
}

impl std::ops::Deref for TrackedResolver {
    type Target = ResolverGeneric<RecordingFileSystem>;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

pub struct RecordingFileSystem {
    inner: FileSystemOs,
    dependencies: Arc<ResolutionDependencies>,
}

impl FileSystem for RecordingFileSystem {
    fn new(yarn_pnp: bool) -> Self {
        Self {
            inner: FileSystemOs::new(yarn_pnp),
            dependencies: Arc::new(ResolutionDependencies::default()),
        }
    }

    fn read(&self, path: &Path) -> io::Result<Vec<u8>> {
        let result = self.inner.read(path);
        self.dependencies.record_file(path, result.as_deref().ok());
        result
    }

    fn read_to_string(&self, path: &Path) -> io::Result<String> {
        let result = FileSystem::read_to_string(&self.inner, path);
        self.dependencies
            .record_file(path, result.as_ref().ok().map(|value| value.as_bytes()));
        result
    }

    fn metadata(&self, path: &Path) -> io::Result<FileMetadata> {
        let result = FileSystem::metadata(&self.inner, path);
        self.dependencies
            .record_probe(path, ProbeKind::Metadata, || {
                metadata_result(result.as_ref().copied())
            });
        result
    }

    fn symlink_metadata(&self, path: &Path) -> io::Result<FileMetadata> {
        let result = FileSystem::symlink_metadata(&self.inner, path);
        self.dependencies
            .record_probe(path, ProbeKind::SymlinkMetadata, || {
                metadata_result(result.as_ref().copied())
            });
        result
    }

    fn read_link(&self, path: &Path) -> std::result::Result<PathBuf, ResolveError> {
        let result = FileSystem::read_link(&self.inner, path);
        self.dependencies
            .record_probe(path, ProbeKind::ReadLink, || link_result(&result));
        result
    }

    fn canonicalize(&self, path: &Path) -> io::Result<PathBuf> {
        let result = FileSystem::canonicalize(&self.inner, path);
        self.dependencies
            .record_probe(path, ProbeKind::Canonicalize, || path_result(&result));
        if let Ok(canonical) = &result {
            self.dependencies.record(canonical);
        }
        result
    }
}

#[derive(Default)]
struct CanonicalDirectories {
    paths: HashMap<PathBuf, PathBuf>,
    names: HashMap<PathBuf, Option<HashSet<OsString>>>,
}

impl CanonicalDirectories {
    fn resolve(&mut self, path: &Path, symlink: bool, directory: bool) -> io::Result<PathBuf> {
        if cfg!(windows) {
            return std::fs::canonicalize(path);
        }
        let split = path
            .parent()
            .zip(path.file_name())
            .filter(|(parent, name)| parent.join(name).as_os_str() == path.as_os_str());
        let mut canonical = None;
        if !symlink {
            if let Some((parent, name)) = split {
                if let Some(parent) = self.paths.get(parent) {
                    let names = self.names.entry(parent.clone()).or_insert_with(|| {
                        std::fs::read_dir(parent)
                            .ok()?
                            .map(|entry| entry.map(|entry| entry.file_name()))
                            .collect::<io::Result<HashSet<_>>>()
                            .ok()
                    });
                    if names.as_ref().is_some_and(|names| names.contains(name)) {
                        canonical = Some(parent.join(name));
                    }
                }
            }
        }
        let canonical = match canonical {
            Some(canonical) => canonical,
            None => std::fs::canonicalize(path)?,
        };
        if directory {
            self.paths.insert(path.to_path_buf(), canonical.clone());
        }
        if !symlink {
            if let Some(((parent, _), canonical_parent)) = split.zip(canonical.parent()) {
                self.paths
                    .entry(parent.to_path_buf())
                    .or_insert_with(|| canonical_parent.to_path_buf());
            }
        }
        Ok(canonical)
    }
}

pub fn dependency_fingerprint(paths: Vec<PathBuf>, files: Vec<PathBuf>) -> Option<String> {
    fingerprint_with_workers(paths, files, fingerprint_worker_count)
}

fn fingerprint_worker_count(paths: usize) -> usize {
    if cfg!(target_family = "wasm") || paths < 8192 {
        return 1;
    }
    std::thread::available_parallelism()
        .map_or(1, usize::from)
        .min(4)
        .min(paths / 4096)
}

fn fingerprint_with_workers(
    mut paths: Vec<PathBuf>,
    files: Vec<PathBuf>,
    worker_count: impl FnOnce(usize) -> usize,
) -> Option<String> {
    paths.extend(files.iter().cloned());
    paths.sort_unstable_by(|left, right| left.as_os_str().cmp(right.as_os_str()));
    paths.dedup_by(|left, right| left.as_os_str() == right.as_os_str());
    let files: HashSet<PathBuf> = files.into_iter().collect();
    let workers = worker_count(paths.len()).max(1).min(paths.len().max(1));
    let run = |paths: &[PathBuf]| {
        let mut directories = CanonicalDirectories::default();
        fingerprint_with_canonicalize(paths, &files, |path, symlink, directory| {
            directories.resolve(path, symlink, directory)
        })
    };
    let mut hash = DefaultHasher::new();
    paths.len().hash(&mut hash);
    if workers == 1 {
        for digest in run(&paths)? {
            digest.hash(&mut hash);
        }
    } else {
        std::thread::scope(|scope| {
            let mut handles = Vec::with_capacity(workers);
            let mut complete = true;
            for chunk in paths.chunks(paths.len().div_ceil(workers)) {
                let run = &run;
                match std::thread::Builder::new().spawn_scoped(scope, move || run(chunk)) {
                    Ok(handle) => handles.push(handle),
                    Err(_) => {
                        complete = false;
                        break;
                    }
                }
            }
            for handle in handles {
                match handle.join() {
                    Ok(Some(digests)) => {
                        for digest in digests {
                            digest.hash(&mut hash);
                        }
                    }
                    _ => complete = false,
                }
            }
            complete.then_some(())
        })?;
    }
    Some(format!("2:{:016x}", hash.finish()))
}

fn fingerprint_with_canonicalize(
    paths: &[PathBuf],
    files: &HashSet<PathBuf>,
    mut canonicalize: impl FnMut(&Path, bool, bool) -> io::Result<PathBuf>,
) -> Option<Vec<u64>> {
    let mut digests = Vec::with_capacity(paths.len());
    for path in paths {
        let mut hash = DefaultHasher::new();
        path.hash(&mut hash);
        let link = match std::fs::symlink_metadata(path) {
            Ok(metadata) => metadata,
            Err(error) if missing(&error) => {
                0_u8.hash(&mut hash);
                digests.push(hash.finish());
                continue;
            }
            Err(_) => return None,
        };
        let symlink = link.is_symlink();
        let metadata = if symlink {
            1_u8.hash(&mut hash);
            std::fs::read_link(path).ok()?.hash(&mut hash);
            match std::fs::metadata(path) {
                Ok(metadata) => metadata,
                Err(error) if missing(&error) => {
                    0_u8.hash(&mut hash);
                    digests.push(hash.finish());
                    continue;
                }
                Err(_) => return None,
            }
        } else {
            2_u8.hash(&mut hash);
            link
        };
        canonicalize(path, symlink, metadata.is_dir())
            .ok()?
            .hash(&mut hash);
        metadata.is_file().hash(&mut hash);
        metadata.is_dir().hash(&mut hash);
        let content = files.contains(path);
        content.hash(&mut hash);
        if content && metadata.is_file() {
            metadata.len().hash(&mut hash);
            metadata.modified().ok()?.hash(&mut hash);
            #[cfg(unix)]
            {
                use std::os::unix::fs::MetadataExt;
                metadata.dev().hash(&mut hash);
                metadata.ino().hash(&mut hash);
                metadata.ctime().hash(&mut hash);
                metadata.ctime_nsec().hash(&mut hash);
            }
            std::fs::read(path).ok()?.hash(&mut hash);
        } else if !metadata.is_dir() && !metadata.is_file() {
            return None;
        }
        digests.push(hash.finish());
    }
    Some(digests)
}

pub fn ascii(value: &str) -> Text {
    value.encode_utf16().collect()
}

pub fn contains(value: &[u16], part: &[u16]) -> bool {
    part.is_empty() || value.windows(part.len()).any(|window| window == part)
}

pub fn dirname(value: &[u16]) -> Text {
    let root = value.first() == Some(&47);
    let mut matched_slash = true;
    for index in (1..value.len()).rev() {
        if value[index] == 47 {
            if !matched_slash {
                return if root && index == 1 {
                    ascii("//")
                } else {
                    value[..index].to_vec()
                };
            }
        } else {
            matched_slash = false;
        }
    }
    ascii(if root { "/" } else { "." })
}

pub fn extname(value: &[u16]) -> Text {
    let mut start_dot = None;
    let mut start_part = 0;
    let mut end = None;
    let mut matched_slash = true;
    let mut pre_dot_state = 0;
    for index in (0..value.len()).rev() {
        let ch = value[index];
        if ch == 47 {
            if !matched_slash {
                start_part = index + 1;
                break;
            }
            continue;
        }
        if end.is_none() {
            matched_slash = false;
            end = Some(index + 1);
        }
        if ch == 46 {
            if start_dot.is_none() {
                start_dot = Some(index);
            } else if pre_dot_state != 1 {
                pre_dot_state = 1;
            }
        } else if start_dot.is_some() {
            pre_dot_state = -1;
        }
    }
    let (Some(start), Some(end)) = (start_dot, end) else {
        return Vec::new();
    };
    if pre_dot_state == 0 || (pre_dot_state == 1 && start == end - 1 && start == start_part + 1) {
        Vec::new()
    } else {
        value[start..end].to_vec()
    }
}

pub fn join(values: &[&[u16]]) -> Text {
    let mut joined = Vec::new();
    for value in values {
        if value.is_empty() {
            continue;
        }
        if !joined.is_empty() {
            joined.push(47);
        }
        joined.extend_from_slice(value);
    }
    if joined.is_empty() {
        return ascii(".");
    }
    let absolute = joined.first() == Some(&47);
    let trailing = joined.last() == Some(&47);
    let mut parts: Vec<&[u16]> = Vec::new();
    for part in joined.split(|unit| *unit == 47) {
        if part.is_empty() || part == [46] {
            continue;
        }
        if part == [46, 46] {
            if parts.last().is_some_and(|previous| *previous != [46, 46]) {
                parts.pop();
            } else if !absolute {
                parts.push(part);
            }
        } else {
            parts.push(part);
        }
    }
    let mut result = Vec::new();
    if absolute {
        result.push(47);
    }
    for (index, part) in parts.iter().enumerate() {
        if index > 0 {
            result.push(47);
        }
        result.extend_from_slice(part);
    }
    if result.is_empty() {
        result.push(46);
    }
    if trailing && result.last() != Some(&47) {
        result.push(47);
    }
    result
}

pub fn is_absolute(value: &[u16], windows: bool) -> bool {
    if windows {
        value.first().is_some_and(|unit| *unit == 47 || *unit == 92)
            || (value.len() > 2
                && ((65..=90).contains(&value[0]) || (97..=122).contains(&value[0]))
                && value[1] == 58
                && (value[2] == 47 || value[2] == 92))
    } else {
        value.first() == Some(&47)
    }
}

pub fn in_node_modules(value: &[u16]) -> bool {
    contains(
        value,
        &[110, 111, 100, 101, 95, 109, 111, 100, 117, 108, 101, 115],
    )
}

pub fn is_dts(value: &[u16]) -> bool {
    [".d.ts", ".d.mts", ".d.cts"]
        .iter()
        .any(|ext| value.ends_with(&ascii(ext)))
}

pub fn is_ts(value: &[u16]) -> bool {
    for ext in [".ts", ".tsx", ".mts", ".mtsx", ".cts", ".ctsx"] {
        let suffix = ascii(ext);
        if value.ends_with(&suffix) && !value[..value.len() - suffix.len()].ends_with(&[46, 100]) {
            return true;
        }
    }
    false
}

pub fn replace_module_extension(value: &[u16]) -> Text {
    for prefix in [".d.", "."] {
        for modifier in ["m", "c", ""] {
            for ext in ["jsx", "tsx", "js", "ts"] {
                let suffix = ascii(&format!("{prefix}{modifier}{ext}"));
                if value.ends_with(&suffix) {
                    return value[..value.len() - suffix.len()].to_vec();
                }
            }
        }
    }
    value.to_vec()
}

pub fn exists(value: &[u16], dependencies: &ResolutionDependencies) -> bool {
    let path = String::from_utf16_lossy(value);
    let metadata = std::fs::metadata(&path);
    dependencies.record_probe(Path::new(&path), ProbeKind::Metadata, || {
        metadata_result(metadata.as_ref().map(|metadata| {
            FileMetadata::new(metadata.is_file(), metadata.is_dir(), metadata.is_symlink())
        }))
    });
    metadata.is_ok()
}

pub fn is_file(value: &[u16], dependencies: &ResolutionDependencies) -> bool {
    let path = String::from_utf16_lossy(value);
    let metadata = std::fs::metadata(&path);
    dependencies.record_probe(Path::new(&path), ProbeKind::Metadata, || {
        metadata_result(metadata.as_ref().map(|metadata| {
            FileMetadata::new(metadata.is_file(), metadata.is_dir(), metadata.is_symlink())
        }))
    });
    metadata.is_ok_and(|metadata| metadata.is_file())
}

pub fn under(value: &[u16], directory: &[u16]) -> bool {
    value == directory || (value.starts_with(directory) && value.get(directory.len()) == Some(&47))
}

pub fn to_posix(value: &str, windows: bool) -> Text {
    value
        .encode_utf16()
        .map(|unit| if windows && unit == 92 { 47 } else { unit })
        .collect()
}

#[derive(Clone, Copy)]
pub struct PathStyle {
    pub lossy: bool,
    pub windows: bool,
}

impl PathStyle {
    pub fn absolute(self, value: &[u16]) -> bool {
        is_absolute(value, self.windows)
    }
    pub fn internal(self, value: &[u16]) -> bool {
        (value.first() == Some(&46) || self.absolute(value)) && !in_node_modules(value)
    }
    pub fn to_posix(self, value: &str) -> Text {
        to_posix(value, self.windows)
    }
    fn text(self, value: Text) -> Text {
        if self.lossy {
            String::from_utf16_lossy(&value).encode_utf16().collect()
        } else {
            value
        }
    }

    pub fn dirname(self, value: &[u16]) -> Text {
        self.text(dirname(value))
    }
    pub fn extname(self, value: &[u16]) -> Text {
        self.text(extname(value))
    }
    pub fn join(self, values: &[&[u16]]) -> Text {
        self.text(join(values))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn disabled_observations_skip_maps_and_probe_materialization() {
        let dependencies = ResolutionDependencies::default();
        dependencies.set_recording(false);
        let path = Path::new("unobserved.json");
        let paths = dependencies.paths.lock().unwrap();
        let files = dependencies.files.lock().unwrap();
        let probes = dependencies.probes.lock().unwrap();
        dependencies.record(path);
        dependencies.record_file(path, Some(b"contents"));
        dependencies.record_probe(path, ProbeKind::Metadata, || panic!("unexpected probe"));
        assert!(!dependencies.complete());
        assert!(paths.is_empty());
        assert!(files.is_empty());
        assert!(probes.is_empty());
        dependencies.set_recording(true);
        assert!(!dependencies.complete());
    }

    #[test]
    fn clearing_backend_observations_starts_a_fresh_recording_generation() {
        let fixture = Fixture::new();
        let path = fixture.0.join("package.json");
        std::fs::write(&path, "{}").unwrap();
        let resolver = TrackedResolver::new(ResolveOptions::default());
        resolver.dependencies.set_recording(false);
        resolver.dependencies.record_file(&path, Some(b"{}"));
        let generation = resolver.generation();
        resolver.clear_cache();
        assert_ne!(resolver.generation(), generation);
        assert!(!resolver.dependencies.complete());
        resolver.dependencies.set_recording(true);
        resolver.dependencies.record_file(&path, Some(b"{}"));
        assert!(resolver.dependencies.complete());
        std::fs::write(&path, "{\"name\":\"changed\"}").unwrap();
        assert!(!resolver.dependencies.complete());
    }

    struct Fixture(PathBuf);

    impl Fixture {
        fn new() -> Self {
            static NEXT: AtomicU64 = AtomicU64::new(0);
            let root = std::env::temp_dir().join(format!(
                "knip-resolution-observations-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            std::fs::create_dir(&root).unwrap();
            Self(root.canonicalize().unwrap())
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            std::fs::remove_dir_all(&self.0).unwrap();
        }
    }

    fn reference_fingerprint(paths: Vec<PathBuf>, files: Vec<PathBuf>) -> Option<String> {
        let mut paths = paths;
        paths.extend(files.iter().cloned());
        paths.sort_unstable_by(|left, right| left.as_os_str().cmp(right.as_os_str()));
        paths.dedup_by(|left, right| left.as_os_str() == right.as_os_str());
        let files = files.into_iter().collect();
        let mut hash = DefaultHasher::new();
        paths.len().hash(&mut hash);
        for digest in
            fingerprint_with_canonicalize(&paths, &files, |path, _, _| std::fs::canonicalize(path))?
        {
            digest.hash(&mut hash);
        }
        Some(format!("2:{:016x}", hash.finish()))
    }

    fn assert_fingerprint_workers(paths: &[PathBuf], files: &[PathBuf]) -> Option<String> {
        let expected = reference_fingerprint(paths.to_vec(), files.to_vec());
        assert_eq!(
            dependency_fingerprint(paths.to_vec(), files.to_vec()),
            expected
        );
        let mut reversed_paths = paths.to_vec();
        reversed_paths.reverse();
        reversed_paths.extend(paths.iter().cloned());
        let mut reversed_files = files.to_vec();
        reversed_files.reverse();
        reversed_files.extend(files.iter().cloned());
        for workers in 1..=4 {
            assert_eq!(
                fingerprint_with_workers(paths.to_vec(), files.to_vec(), |_| workers),
                expected
            );
            assert_eq!(
                fingerprint_with_workers(reversed_paths.clone(), reversed_files.clone(), |_| {
                    workers
                }),
                expected
            );
        }
        expected
    }

    #[test]
    fn dependency_fingerprint_workers_are_bounded_and_small_inputs_are_serial() {
        for paths in [0, 1, 4096, 8191] {
            assert_eq!(fingerprint_worker_count(paths), 1);
        }
        for paths in [8192, 16384, usize::MAX] {
            let expected = if cfg!(target_family = "wasm") {
                1
            } else {
                std::thread::available_parallelism()
                    .map_or(1, usize::from)
                    .min(4)
                    .min(paths / 4096)
            };
            assert_eq!(fingerprint_worker_count(paths), expected);
        }
        assert!(
            assert_fingerprint_workers(&[], &[])
                .unwrap()
                .starts_with("2:")
        );
    }

    #[test]
    fn parallel_fingerprints_preserve_content_probe_and_error_semantics() {
        let fixture = Fixture::new();
        let source = fixture.0.join("source.ts");
        let read_source = fixture.0.join("read-source.ts");
        let config = fixture.0.join("config.json");
        let missing = fixture.0.join("missing.ts");
        std::fs::write(&source, "source").unwrap();
        std::fs::write(&read_source, "read source").unwrap();
        std::fs::write(&config, "{}").unwrap();
        let paths = vec![fixture.0.clone(), source.clone(), missing.clone()];
        let files = vec![config.clone(), read_source.clone()];
        let fingerprint = || assert_fingerprint_workers(&paths, &files).unwrap();
        let initial = fingerprint();
        std::fs::write(&source, "different source contents").unwrap();
        std::fs::write(fixture.0.join("unrelated.ts"), "").unwrap();
        assert_eq!(fingerprint(), initial);
        std::fs::write(&missing, "").unwrap();
        assert_ne!(fingerprint(), initial);
        std::fs::remove_file(&missing).unwrap();
        assert_eq!(fingerprint(), initial);
        std::fs::create_dir(&missing).unwrap();
        assert_ne!(fingerprint(), initial);
        std::fs::remove_dir(&missing).unwrap();
        assert_eq!(fingerprint(), initial);
        let modified = std::fs::metadata(&config).unwrap().modified().unwrap();
        std::fs::File::options()
            .write(true)
            .open(&config)
            .unwrap()
            .set_modified(modified + std::time::Duration::from_secs(10))
            .unwrap();
        let changed_metadata = fingerprint();
        assert_ne!(changed_metadata, initial);
        std::fs::write(&config, "{\"changed\":true}").unwrap();
        let changed_config = fingerprint();
        assert_ne!(changed_config, changed_metadata);
        std::fs::write(&read_source, "updated read source").unwrap();
        assert_ne!(fingerprint(), changed_config);
        let mut invalid = paths.clone();
        invalid.push(fixture.0.join("invalid\0path"));
        assert!(assert_fingerprint_workers(&invalid, &files).is_none());
        assert!(
            fingerprint_with_canonicalize(&paths, &HashSet::new(), |_, _, _| {
                Err(io::Error::from(io::ErrorKind::PermissionDenied))
            })
            .is_none()
        );
        let large: Vec<_> = (0..8192)
            .map(|index| fixture.0.join(format!("absent-{index}")))
            .collect();
        assert_eq!(
            dependency_fingerprint(large.clone(), files.clone()),
            fingerprint_with_workers(large, files, |_| 1)
        );
    }

    #[test]
    #[cfg(unix)]
    fn dependency_fingerprint_preserves_symlink_spellings_in_any_input_order() {
        let fixture = Fixture::new();
        std::fs::create_dir(fixture.0.join("actual")).unwrap();
        std::os::unix::fs::symlink("actual", fixture.0.join("alias")).unwrap();
        let link = fixture.0.join("alias");
        let directory = fixture.0.join("alias/");
        assert_ne!(
            dependency_fingerprint(vec![link.clone()], Vec::new()),
            dependency_fingerprint(vec![directory.clone()], Vec::new())
        );
        assert_eq!(
            dependency_fingerprint(vec![link.clone(), directory.clone()], Vec::new()),
            dependency_fingerprint(vec![directory.clone(), link.clone()], Vec::new())
        );
        assert_fingerprint_workers(&[link.clone(), directory.clone()], &[]).unwrap();
        assert_fingerprint_workers(&[], &[link, directory]).unwrap();
    }

    #[test]
    fn canonical_parent_memo_matches_reference_for_exact_path_spellings() {
        let fixture = Fixture::new();
        let directory = fixture.0.join("Directory");
        std::fs::create_dir(&directory).unwrap();
        std::fs::write(directory.join("MiXeD.ts"), "export const value = 1;").unwrap();
        std::fs::write(directory.join("café.ts"), "").unwrap();
        std::fs::write(directory.join("other.ts"), "").unwrap();
        std::fs::write(fixture.0.join("config.json"), "{}").unwrap();
        let mut paths = vec![fixture.0.clone(), directory.clone()];
        for spelling in [
            "Directory/MiXeD.ts",
            "Directory/mixed.ts",
            "directory/MiXeD.ts",
            "Directory/café.ts",
            "Directory/cafe\u{301}.ts",
            "Directory/other.ts",
            "Directory/./MiXeD.ts",
            "Directory/../Directory/MiXeD.ts",
            "Directory//MiXeD.ts",
            "Directory/",
            "Directory/.",
            "Directory/..",
            "Directory/MiXeD.ts/../other.ts",
            "Directory/missing.ts",
            "config.json",
        ] {
            paths.push(fixture.0.join(spelling));
        }
        #[cfg(windows)]
        {
            paths.push(directory.join("..\\Directory\\MiXeD.ts"));
            paths.push(std::fs::canonicalize(&directory).unwrap().join("MiXeD.ts"));
        }
        let files = vec![fixture.0.join("config.json")];
        let expected = reference_fingerprint(paths.clone(), files.clone()).unwrap();
        assert_eq!(
            assert_fingerprint_workers(&paths, &files).unwrap(),
            expected
        );
        assert_eq!(
            dependency_fingerprint(paths.clone(), files.clone()).unwrap(),
            expected
        );
        paths.reverse();
        assert_eq!(dependency_fingerprint(paths, files).unwrap(), expected);
    }

    #[test]
    #[cfg(unix)]
    fn canonical_parent_memo_matches_reference_through_symlinks_and_parent_segments() {
        let fixture = Fixture::new();
        let directory = fixture.0.join("actual");
        std::fs::create_dir_all(directory.join("nested")).unwrap();
        std::fs::write(directory.join("value.ts"), "").unwrap();
        std::fs::write(directory.join("nested/other.ts"), "").unwrap();
        std::os::unix::fs::symlink("actual/nested", fixture.0.join("alias")).unwrap();
        std::os::unix::fs::symlink("../value.ts", directory.join("nested/linked.ts")).unwrap();
        std::os::unix::fs::symlink("absent.ts", directory.join("nested/broken.ts")).unwrap();
        let mut paths = vec![
            fixture.0.clone(),
            directory.clone(),
            directory.join("nested"),
        ];
        for spelling in [
            "alias",
            "alias/",
            "alias/other.ts",
            "alias/linked.ts",
            "alias/broken.ts",
            "alias/../value.ts",
            "alias/../nested/other.ts",
            "actual/nested/linked.ts",
            "actual/nested/broken.ts",
            "actual/nested/./other.ts",
            "actual//nested/other.ts",
        ] {
            paths.push(fixture.0.join(spelling));
        }
        let expected = reference_fingerprint(paths.clone(), Vec::new()).unwrap();
        assert_eq!(assert_fingerprint_workers(&paths, &[]).unwrap(), expected);
        assert_eq!(
            dependency_fingerprint(paths.clone(), Vec::new()).unwrap(),
            expected
        );
        std::fs::remove_file(directory.join("nested/linked.ts")).unwrap();
        std::os::unix::fs::symlink("other.ts", directory.join("nested/linked.ts")).unwrap();
        let redirected = assert_fingerprint_workers(&paths, &[]).unwrap();
        assert_ne!(redirected, expected);
        std::fs::remove_file(directory.join("nested/broken.ts")).unwrap();
        std::os::unix::fs::symlink("different.ts", directory.join("nested/broken.ts")).unwrap();
        let dangling = assert_fingerprint_workers(&paths, &[]).unwrap();
        assert_ne!(dangling, redirected);
        std::fs::write(directory.join("nested/different.ts"), "").unwrap();
        assert_ne!(assert_fingerprint_workers(&paths, &[]).unwrap(), dangling);
    }

    #[test]
    #[ignore]
    fn dependency_fingerprint_offline_benchmark() {
        let input = std::env::var("KNIP_RESOLUTION_DEPENDENCIES").unwrap();
        let input: serde_json::Value =
            serde_json::from_slice(&std::fs::read(input).unwrap()).unwrap();
        let paths: Vec<PathBuf> = input["paths"]
            .as_array()
            .unwrap()
            .iter()
            .map(|path| path.as_str().unwrap().into())
            .collect();
        let files: Vec<PathBuf> = input["files"]
            .as_array()
            .unwrap()
            .iter()
            .map(|path| path.as_str().unwrap().into())
            .collect();
        let expected = reference_fingerprint(paths.clone(), files.clone()).unwrap();
        assert_eq!(
            dependency_fingerprint(paths.clone(), files.clone()).unwrap(),
            expected
        );
        eprintln!(
            "paths={} files={} matches_saved={}",
            paths.len(),
            files.len(),
            input["fingerprint"].as_str() == Some(&expected)
        );
        for round in 0..6 {
            for candidate in [round % 2 != 0, round % 2 == 0] {
                let start = std::time::Instant::now();
                let actual = if candidate {
                    dependency_fingerprint(paths.clone(), files.clone())
                } else {
                    reference_fingerprint(paths.clone(), files.clone())
                };
                assert_eq!(actual.as_deref(), Some(expected.as_str()));
                eprintln!(
                    "round={round} candidate={candidate} elapsed_ms={:.3}",
                    start.elapsed().as_secs_f64() * 1000.0
                );
            }
        }
    }

    fn serial_complete(dependencies: &ResolutionDependencies) -> bool {
        if dependencies.invalidated.load(Ordering::Relaxed) {
            return false;
        }
        for (path, expected) in dependencies.files.lock().unwrap().iter() {
            let actual = match std::fs::read(path) {
                Ok(bytes) => Some(content_hash(&bytes)),
                Err(error) if missing(&error) => None,
                Err(_) => return false,
            };
            if &actual != expected {
                return false;
            }
        }
        for ((path, kind), expected) in dependencies.probes.lock().unwrap().iter() {
            if *expected == ProbeResult::Unsupported || kind.inspect(path) != *expected {
                return false;
            }
        }
        true
    }

    fn assert_complete_workers(dependencies: &ResolutionDependencies, expected: bool) {
        assert_eq!(serial_complete(dependencies), expected);
        assert_eq!(dependencies.complete(), expected);
        for workers in 1..=4 {
            assert_eq!(dependencies.complete_with_workers(|_| workers), expected);
        }
    }

    #[test]
    fn observation_validation_worker_bounds_and_failure_propagation() {
        for entries in [0, 1, 1024, 2047] {
            assert_eq!(validation_worker_count(entries), 1);
        }
        for entries in [2048, 4096, usize::MAX] {
            let workers = validation_worker_count(entries);
            assert!((1..=4).contains(&workers));
            assert!(workers <= std::thread::available_parallelism().map_or(1, usize::from));
            if cfg!(target_family = "wasm") {
                assert_eq!(workers, 1);
            }
        }
        let observations: HashMap<_, _> = (0..16).map(|index| (index, index)).collect();
        for workers in 1..=4 {
            assert!(validate_observations(
                &observations,
                workers,
                |key, value| key == value
            ));
            assert!(!validate_observations(
                &observations,
                workers,
                |key, _| *key != 7
            ));
            assert!(
                std::panic::catch_unwind(|| {
                    validate_observations(&observations, workers, |_, _| panic!("validation panic"))
                })
                .is_err()
            );
        }
    }

    #[test]
    #[cfg(not(target_family = "wasm"))]
    fn observation_validation_propagates_worker_panics_without_a_caller_panic() {
        let observations: HashMap<_, _> = (0..12).map(|index| (index, index)).collect();
        let caller = std::thread::current().id();
        for workers in 2..=4 {
            let caller_ran = AtomicBool::new(false);
            let worker_panicked = AtomicBool::new(false);
            let result = std::panic::catch_unwind(|| {
                validate_observations(&observations, workers, |_, _| {
                    if std::thread::current().id() == caller {
                        caller_ran.store(true, Ordering::Relaxed);
                        true
                    } else {
                        worker_panicked.store(true, Ordering::Relaxed);
                        panic!("worker validation panic");
                    }
                })
            });
            assert!(caller_ran.load(Ordering::Relaxed));
            assert!(worker_panicked.load(Ordering::Relaxed));
            let panic = result.expect_err("worker panic must reach the caller");
            assert_eq!(
                panic.downcast_ref::<&str>(),
                Some(&"worker validation panic")
            );
        }
    }

    #[test]
    fn parallel_complete_matches_serial_for_files_errors_and_probe_types() {
        let fixture = Fixture::new();
        let file_system = RecordingFileSystem::new(false);
        let config = fixture.0.join("config.json");
        let missing = fixture.0.join("missing.json");
        std::fs::write(&config, "original").unwrap();
        file_system.read(&config).unwrap();
        assert!(file_system.read(&missing).is_err());
        assert_complete_workers(&file_system.dependencies, true);
        std::fs::write(&config, "modified").unwrap();
        assert_complete_workers(&file_system.dependencies, false);
        std::fs::write(&config, "original").unwrap();
        assert_complete_workers(&file_system.dependencies, true);
        std::fs::write(&missing, "").unwrap();
        assert_complete_workers(&file_system.dependencies, false);
        std::fs::remove_file(&missing).unwrap();
        assert_complete_workers(&file_system.dependencies, true);
        std::fs::create_dir(&missing).unwrap();
        assert_complete_workers(&file_system.dependencies, false);
        let invalid = RecordingFileSystem::new(false);
        assert!(invalid.read(&fixture.0.join("invalid\0path")).is_err());
        assert_complete_workers(&invalid.dependencies, false);
        let unsupported = ResolutionDependencies::default();
        unsupported.record_probe(&config, ProbeKind::Metadata, || ProbeResult::Unsupported);
        assert_complete_workers(&unsupported, false);
        let probes = RecordingFileSystem::new(false);
        for index in 0..4096 {
            assert!(
                probes
                    .metadata(&fixture.0.join(format!("absent-{index}")))
                    .is_err()
            );
        }
        assert_complete_workers(&probes.dependencies, true);
        std::fs::write(fixture.0.join("absent-2048"), "").unwrap();
        assert_complete_workers(&probes.dependencies, false);
    }

    #[test]
    fn filesystem_observations_preserve_failed_probe_results() {
        let fixture = Fixture::new();
        for (index, kind) in [
            ProbeKind::Metadata,
            ProbeKind::SymlinkMetadata,
            ProbeKind::Canonicalize,
        ]
        .into_iter()
        .enumerate()
        {
            let file_system = RecordingFileSystem::new(false);
            let path = fixture.0.join(format!("missing-{index}.ts"));
            match kind {
                ProbeKind::Metadata => {
                    assert!(file_system.metadata(&path).is_err());
                }
                ProbeKind::SymlinkMetadata => {
                    assert!(file_system.symlink_metadata(&path).is_err());
                }
                ProbeKind::Canonicalize => {
                    assert!(file_system.canonicalize(&path).is_err());
                }
                ProbeKind::ReadLink => unreachable!(),
            }
            assert_complete_workers(&file_system.dependencies, true);
            std::fs::write(&path, "").unwrap();
            assert_complete_workers(&file_system.dependencies, false);
        }
    }

    #[test]
    fn conflicting_consumed_observations_cannot_become_complete_after_restoration() {
        let fixture = Fixture::new();
        let path = fixture.0.join("value.ts");
        let file_system = RecordingFileSystem::new(false);
        assert!(file_system.metadata(&path).is_err());
        std::fs::write(&path, "").unwrap();
        assert!(file_system.metadata(&path).unwrap().is_file());
        std::fs::remove_file(&path).unwrap();
        assert_complete_workers(&file_system.dependencies, false);

        let file_system = RecordingFileSystem::new(false);
        std::fs::write(&path, "before").unwrap();
        assert_eq!(file_system.read(&path).unwrap(), b"before");
        std::fs::write(&path, "after").unwrap();
        assert_eq!(file_system.read(&path).unwrap(), b"after");
        std::fs::write(&path, "before").unwrap();
        assert_complete_workers(&file_system.dependencies, false);
    }

    #[test]
    #[cfg(unix)]
    fn filesystem_observations_preserve_link_and_canonical_targets() {
        let fixture = Fixture::new();
        let first = fixture.0.join("first.ts");
        let second = fixture.0.join("second.ts");
        let links: Vec<_> = (0..12)
            .map(|index| fixture.0.join(format!("linked-{index}.ts")))
            .collect();
        std::fs::write(&first, "").unwrap();
        std::fs::write(&second, "").unwrap();
        for kind in [ProbeKind::ReadLink, ProbeKind::Canonicalize] {
            let file_system = RecordingFileSystem::new(false);
            for link in &links {
                std::os::unix::fs::symlink(&first, link).unwrap();
                match kind {
                    ProbeKind::ReadLink => {
                        assert_eq!(file_system.read_link(link).unwrap(), first);
                    }
                    ProbeKind::Canonicalize => {
                        assert_eq!(file_system.canonicalize(link).unwrap(), first);
                    }
                    _ => unreachable!(),
                }
            }
            assert_complete_workers(&file_system.dependencies, true);
            for link in &links {
                std::fs::remove_file(link).unwrap();
                std::os::unix::fs::symlink(&second, link).unwrap();
                assert_complete_workers(&file_system.dependencies, false);
                std::fs::remove_file(link).unwrap();
                std::os::unix::fs::symlink(&first, link).unwrap();
                assert_complete_workers(&file_system.dependencies, true);
            }
            for link in &links {
                std::fs::remove_file(link).unwrap();
            }
        }
    }

    #[test]
    fn wrapper_paths_follow_host_platform_independently_of_target() {
        let posix = PathStyle {
            lossy: false,
            windows: false,
        };
        let windows = PathStyle {
            lossy: false,
            windows: true,
        };
        for path in [
            "C:\\project\\index.ts",
            "C:/project/index.ts",
            "\\\\server\\share",
            "\\root",
        ] {
            assert!(!posix.absolute(&ascii(path)));
            assert!(windows.absolute(&ascii(path)));
        }
        for style in [posix, windows] {
            assert!(style.absolute(&ascii("/root")));
            assert!(!style.absolute(&ascii("C:relative")));
            assert_eq!(style.dirname(&ascii("C:\\project\\index.ts")), ascii("."));
        }
        assert_eq!(
            windows.to_posix("C:\\project\\index.ts"),
            ascii("C:/project/index.ts")
        );
        assert_eq!(
            posix.to_posix("C:\\project\\index.ts"),
            ascii("C:\\project\\index.ts")
        );
        let units = vec![47, 0xd800, 47, 0xdc00, 0, 83, 100, 56, 48, 48];
        assert_eq!(posix.join(&[&units]), units);
        assert_eq!(
            PathStyle {
                lossy: true,
                windows: false
            }
            .join(&[&units]),
            String::from_utf16_lossy(&units)
                .encode_utf16()
                .collect::<Text>()
        );
    }
}
