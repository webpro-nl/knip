use napi_derive::napi;

mod analyzer;
mod comments;
mod containment;
mod error;
mod graph;
mod parse;
mod positions;
mod resolver;
mod specifiers;

#[napi]
pub fn engine_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
