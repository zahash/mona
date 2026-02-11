#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(serde::Serialize)]
pub struct ErrorResponse {
    message: String,

    #[cfg(feature = "datetime")]
    #[serde(serialize_with = "ser_iso8601")]
    #[cfg_attr(feature = "openapi", schema(example = "2025-08-01T12:34:56Z"))]
    datetime: time::OffsetDateTime,

    #[cfg(feature = "kind")]
    #[cfg_attr(feature = "openapi", schema(example = "username.invalid"))]
    kind: Option<String>,

    #[cfg(feature = "help")]
    #[cfg_attr(
        feature = "openapi",
        schema(example = "Please check the response headers for `x-trace-id`")
    )]
    help: Option<String>,
}

impl ErrorResponse {
    pub fn new(message: String) -> Self {
        Self {
            message,

            #[cfg(feature = "datetime")]
            datetime: time::OffsetDateTime::now_utc(),

            #[cfg(feature = "kind")]
            kind: None,

            #[cfg(feature = "help")]
            help: None,
        }
    }

    pub fn message(&self) -> &str {
        &self.message
    }

    #[cfg(feature = "datetime")]
    pub fn datetime(&self) -> time::OffsetDateTime {
        self.datetime
    }

    #[cfg(feature = "datetime")]
    pub fn override_datetime(mut self, datetime: time::OffsetDateTime) -> Self {
        self.datetime = datetime;
        self
    }

    #[cfg(feature = "kind")]
    pub fn kind(&self) -> Option<&str> {
        self.kind.as_deref()
    }

    #[cfg(feature = "kind")]
    pub fn with_kind(mut self, kind: String) -> Self {
        self.kind = Some(kind);
        self
    }

    #[cfg(feature = "help")]
    pub fn help(&self) -> Option<&str> {
        self.help.as_deref()
    }

    #[cfg(feature = "help")]
    pub fn with_help(mut self, help: String) -> Self {
        self.help = Some(help);
        self
    }
}

#[cfg(feature = "datetime")]
fn ser_iso8601<S: serde::Serializer>(
    datetime: &time::OffsetDateTime,
    s: S,
) -> Result<S::Ok, S::Error> {
    s.serialize_str(&format!(
        "{}-{}-{}T{}:{}:{}Z",
        datetime.year(),
        datetime.month(),
        datetime.day(),
        datetime.hour(),
        datetime.minute(),
        datetime.second()
    ))
}
