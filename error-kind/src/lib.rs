pub trait ErrorKind {
    fn kind(&self) -> String;
}
