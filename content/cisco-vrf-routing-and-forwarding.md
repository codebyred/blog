+++
title = 'Cisco Vrf Routing and Forwarding'
description = "" 
date = 2026-03-04T11:22:32+06:00
draft = true
tags = ["general"]
authors = ["Redoan"]
+++

# Topology

# Overview
* Only ISP(PE) router needs VRF
* CE routers use normal OSPF
* OSPF runs between CE ↔ PE
* PE shares routes inside VRF

# Configuration
## ISP
```
ISP# configure terminal

ISP(config)# vrf definition CustomerX

ISP(config-vrf)# vrf definition CustomerY

ISP(config-vrf)# vrf definition CustomerZ

ISP(config-vrf)# end
```
Setting IPv4 & IPv6 Address Families
```
ISP(config-vrf)# address-family ipv4

ISP(config-vrf-af)# exit

ISP(config-vrf)# address-family ipv6

ISP(config-vrf-af)# exit
```
Assigning Interfaces to VRFs
```
ISP(config)# interface gi0/0

ISP(config-if)# ip vrf forwarding CustomerX

ISP(config-if)# ip address 10.10.10.2 255.255.255.0

ISP(config-if)# no shutdown

ISP(config-if)# exit

ISP(config)# interface gi0/1

ISP(config-if)# ip vrf forwarding CustomerX

ISP(config-if)# ip address 20.20.20.2 255.255.255.0

ISP(config-if)# no shutdown

ISP(config-if)# end

ISP(config)# interface gi0/2

ISP(config-if)# ip vrf forwarding CustomerX

ISP(config-if)# ip address 10.10.10.2 255.255.255.0

ISP(config-if)# no shutdown

ISP(config-if)# end

ISP(config)# interface gi0/3

ISP(config-if)# ip vrf forwarding CustomerX

ISP(config-if)# ip address 20.20.20.2 255.255.255.0

ISP(config-if)# no shutdown

ISP(config-if)# end

ISP(config)# interface gi0/4

ISP(config-if)# ip vrf forwarding CustomerX

ISP(config-if)# ip address 10.10.10.2 255.255.255.0

ISP(config-if)# no shutdown

ISP(config-if)# end

ISP(config)# interface gi0/5

ISP(config-if)# ip vrf forwarding CustomerX

ISP(config-if)# ip address 20.20.20.2 255.255.255.0

ISP(config-if)# no shutdown

ISP(config-if)# end
```
Enabling Routing For Interfaces. For ospf routing, the neighbours must be in same subnet
```
router ospf 1 vrf CustomerX
 network 10.10.10.0 0.0.0.255 area 0
 network 20.20.20.0 0.0.0.255 area 0
```
## X1
Interface configuration
```
Router(config)#int g0/0
Router(config-if)#ip address 10.10.10.1 255.255.255.0
Router(config-if)#no shutdown
```
Routing
```
router ospf 1
 network 10.10.10.0 0.0.0.255 area 0
```

## X2
Interface configuration
```
Router(config)#int g0/0
Router(config-if)#ip address 20.20.20.1 255.255.255.0
Router(config-if)#no shutdown
```
Routing
```
router ospf 1
 network 20.20.20.0 0.0.0.255 area 0
```

# References

1. https://ipcisco.com/lesson/cisco-virtual-routing-and-forwarding-vrf/