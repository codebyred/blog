+++
title = 'Vlan Configuration in Cisco Switches'
description = "" 
date = 2026-02-18T15:27:39+06:00
draft = false
tags = ["cisco","switch","vlan"]
authors = ["Redoan"]
+++

# Overview

On Cisco switches, VLAN configuration is primarily performed at Layer 2 (switching) using VLAN databases and per-port VLAN assignment.
Layer 3 VLAN routing is performed using SVI (Switched Virtual Interface) on Layer 3 switches or routers.

Cisco separates VLAN configuration into two main components:

1. Switchport VLAN Configuration (Layer 2)

2. SVI – Switched Virtual Interface (Layer 3)

# Switchport VLAN (Layer 2 VLAN Switching)

## Description

Switchport VLAN configuration defines:

* Which VLAN a port belongs to

* Whether the port is Access (untagged) or Trunk (tagged multiple VLANs)

## Purpose

* Segregate broadcast domains

* Control VLAN tagging

* Define access vs trunk ports

## Example Configuration
Create VLAN
```
vlan 10
 name USERS
```
Access Port (Like MikroTik Untagged Port)
```
interface GigabitEthernet0/1
 switchport mode access
 switchport access vlan 10
```
Trunk Port (Like MikroTik Tagged Port)
```
interface GigabitEthernet0/24
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30
```

# SVI (Switched Virtual Interface) — Layer 3
## Description
SVI is Cisco’s Layer 3 interface for a VLAN.
It acts as:

* VLAN gateway

* Routing interface

* IP endpoint for management or routing

## Example Configuration
```
interface vlan 10
 ip address 192.168.10.1 255.255.255.0
 no shutdown
```

## Requirements
* VLAN must exist

* At least one active port in that VLAN

* Switch must support Layer 3 routing (or use router-on-a-stick)

# Cisco vs MikroTik Concept Mapping
| Cisco                  | MikroTik Equivalent    |
| ---------------------- | ---------------------- |
| Access Port            | Bridge VLAN Untagged   |
| Trunk Port             | Bridge VLAN Tagged     |
| VLAN Database          | Bridge VLAN Table      |
| SVI (interface vlan X) | Interface VLAN         |
| `ip routing`           | Router enabled routing |

# Typical Cisco Deployment Models
Layer 2 Switch + Router (Router-on-a-Stick)
```
Switch → VLANs L2 only
Router → Subinterfaces for VLAN routing
```
Example:
```
Router:
interface g0/0.10
 encapsulation dot1q 10
 ip address 192.168.10.1 255.255.255.0
```
# Layer 3 Switch (Most Modern Networks)
```
Switch handles both L2 + L3
SVI does routing between VLANs
```
```
ip routing
interface vlan 10
 ip address 192.168.10.1 255.255.255.0
```
# Key Design Differences (Cisco vs MikroTik)
| Topic              | Cisco                          | MikroTik                           |
| ------------------ | ------------------------------ | ---------------------------------- |
| VLAN Switching     | Switchport VLAN                | Bridge VLAN                        |
| VLAN Routing       | SVI                            | Interface VLAN                     |
| Default Behavior   | VLAN exists even without ports | VLAN needs bridge filtering config |
| Hardware Switching | Automatic                      | Requires correct bridge setup      |

# Common Cisco Mistakes

Creating SVI but forgetting to enable routing:
```
ip routing
```
VLAN exists but no ports assigned → SVI stays down

Trunk missing VLAN in allowed list

# Simple Mental Model
## Cisco
```
Switchport Config → Controls VLAN traffic flow
SVI → Gives VLAN an IP and routing
```
## MikroTik
```
Bridge VLAN → Controls VLAN traffic flow
Interface VLAN → Gives VLAN an IP and routing
```
