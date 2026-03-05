+++
title = 'Cisco Vrf Routing and Forwarding'
description = "" 
date = 2026-03-04T11:22:32+06:00
draft = true
tags = ["general"]
authors = ["Redoan"]
+++

# Topology

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
Enabling Routing For Interfaces
```
router ospf 1 vrf CustomerX
```
## X1
Interface configuration
```
Router(config)#int g0/0
Router(config-if)#ip address 10.10.10.1 255.255.255.0
Router(config-if)#no shutdown
```

# References

1. https://ipcisco.com/lesson/cisco-virtual-routing-and-forwarding-vrf/