+++
title = 'Secure Site Access via Strongswan Ikev2 Roadwarrior Vpn'
description = "" 
date = 2026-04-07T13:03:10+06:00
draft = false
tags = ["linux","ipsec","strongswan,"roadwarrior"]
authors = ["Redoan"]
+++

## Objective

-   Roadwarrior client connects to VPN gateway over `10.10.80.0/24`
-   Access protected LAN `10.10.30.0/24`
-   Client gets virtual IP from `192.168.98.0/24`

------------------------------------------------------------------------

## Network Topology

    [ Roadwarrior Client ]
            |
            | 10.10.80.0/24
            |
    [ VPN Server (StrongSwan) ]
       - ens19: 10.10.80.200
       - ens18: 10.10.30.51
            |
            | 10.10.30.0/24
            |
    [ MikroTik Router ]
       - Gateway: 10.10.30.1

------------------------------------------------------------------------

## Server Configuration (`/etc/swanctl/swanctl.conf`)

``` ini
connections {
  rw {
    version = 2
    local_addrs = 10.10.80.200

    local {
      auth = psk
      id = 10.10.80.200
    }

    remote {
      auth = psk
      id = %any
    }

    children {
      net {
        local_ts = 10.10.30.0/24
        start_action = none
      }
    }

    pools = vpn-pool
  }
}

secrets {
  ike-psk {
    secret = "Dnet@123!"
  }
}

pools {
  vpn-pool {
    addrs = 192.168.98.0/24
  }
}
```

------------------------------------------------------------------------

## Client Configuration

``` ini
connections {
  home {
    version = 2
    remote_addrs = 10.10.80.200

    local {
      auth = psk
      id = 10.10.80.201
    }

    remote {
      auth = psk
      id = 10.10.80.200
    }

    vips = 0.0.0.0

    children {
      net {
        remote_ts = 10.10.30.0/24
        start_action = start
      }
    }
  }
}

secrets {
  ike-psk {
    secret = "Dnet@123!"
  }
}
```

------------------------------------------------------------------------

## Enable IP Forwarding

``` bash
sysctl -w net.ipv4.ip_forward=1
```

Persist:

``` bash
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
```

------------------------------------------------------------------------

## MikroTik Route

``` bash
/ip route add dst-address=192.168.98.0/24 gateway=10.10.30.51
```

------------------------------------------------------------------------

## Start VPN

``` bash
sudo swanctl --initiate --ike home --child net
```

------------------------------------------------------------------------

## Stop VPN

``` bash
sudo swanctl --terminate --child net
sudo swanctl --terminate --ike home
```

------------------------------------------------------------------------

## Verification

Check IP:

``` bash
ip addr
```

Check routes:

``` bash
ip route
```

Test:

``` bash
ping 10.10.30.51
ping 10.10.30.1
```

------------------------------------------------------------------------

## Key Concepts

-   VIP assigned from pool (`192.168.98.0/24`)
-   Traffic to LAN routed via IPsec
-   MikroTik handles return path

------------------------------------------------------------------------

## Common Issues

-   Missing route on MikroTik
-   IP forwarding disabled
-   Incorrect traffic selectors
-   No VIP assignment

------------------------------------------------------------------------

## Result

-   Secure tunnel established
-   Client accesses internal LAN successfully