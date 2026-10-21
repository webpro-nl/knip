#[derive(Debug, PartialEq, Eq)]
pub(crate) enum AnalysisError {
    InvalidArgument(String),
    InvalidPackage { raw: String, name: bool },
    HostCallback,
}

pub(crate) type Result<T> = std::result::Result<T, AnalysisError>;

impl AnalysisError {
    pub fn message(&self) -> String {
        match self {
            Self::InvalidArgument(message) => message.clone(),
            Self::InvalidPackage { .. } => "Invalid package metadata requires host analysis".into(),
            Self::HostCallback => "Native analysis requires a host callback".into(),
        }
    }

    pub fn into_napi(self) -> napi::Error {
        match self {
            Self::InvalidArgument(message) => napi::Error::new(napi::Status::InvalidArg, message),
            error => napi::Error::from_reason(error.message()),
        }
    }
}
