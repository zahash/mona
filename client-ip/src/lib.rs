use std::{net::IpAddr, str::FromStr};

use forwarded_header_value::{ForwardedHeaderValue, Identifier};
use http::{Request, header::FORWARDED};

pub fn client_ip<B>(request: &Request<B>) -> Option<IpAddr> {
    let client_ip = request
        .headers()
        .get(FORWARDED)
        .and_then(|val| val.to_str().ok())
        .and_then(|val| ForwardedHeaderValue::from_str(val).ok())
        .map(|forwarded| forwarded.into_remotest())
        .and_then(|stanza| stanza.forwarded_for)
        .and_then(|identifier| match identifier {
            Identifier::SocketAddr(socket_addr) => Some(socket_addr.ip()),
            Identifier::IpAddr(ip_addr) => Some(ip_addr),
            _ => None,
        });

    #[cfg(feature = "axum")]
    let client_ip = client_ip.or_else(|| {
        use axum::extract::ConnectInfo;
        use std::net::SocketAddr;
        request
            .extensions()
            .get::<ConnectInfo<SocketAddr>>()
            .map(|connect_info| connect_info.0.ip())
    });

    client_ip
}
