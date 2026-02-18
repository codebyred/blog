+++
title = 'Vlan Configuration in Mikrotik Interface Vlan vs Bridge Vlan'
description = "" 
date = 2026-02-18T15:12:11+06:00
draft = false
tags = ["general"]
authors = ["Redoan"]
+++

# Overview

MikroTik supports VLAN implementation at both Layer 2 (Switching) and Layer 3 (Routing). Correctly distinguishing Interface VLAN and Bridge VLAN is essential for proper network segmentation, routing, and management.

# Interface VLAN (L3 VLAN Interface)
## Description

An Interface VLAN is a logical Layer 3 interface created on top of a physical interface or bridge. It is used to assign IP addresses and route traffic for a specific VLAN.

## Purpose

Provide IP addressing to VLANs

Act as the default gateway for devices within a VLAN

Enable inter-VLAN routing and firewall control

## Example Configuration

```
/interface vlan
add name=vlan10 vlan-id=10 interface=bridge

/ip address
add address=192.168.10.1/24 interface=vlan10
```

Use Cases

* Inter-VLAN routing

* Management VLAN IP assignment

* Firewall policies per VLAN

# Bridge VLAN (L2 VLAN Filtering)
## Description

A Bridge VLAN configuration is applied at Layer 2, inside a bridge interface. It defines which ports carry which VLANs, and whether traffic is tagged or untagged.

## Purpose

Control VLAN propagation on bridge ports

Define tagged and untagged ports (trunk vs access)

Segregate traffic at Layer 2 before routing

## Example Configuration
```
/interface bridge
add name=br1 vlan-filtering=yes

/interface bridge port
add bridge=br1 interface=ether1
add bridge=br1 interface=ether2

/interface bridge vlan
add bridge=br1 vlan-ids=10 tagged=ether1 untagged=ether2
```
# Use Cases

Trunk ports connecting switches

Access ports for end devices

Hardware-accelerated switching and VLAN segmentation

# Interface VLAN vs Bridge VLAN: Summary
| Feature                         | Interface VLAN | Bridge VLAN |
| ------------------------------- | -------------- | ----------- |
| Layer                           | L3             | L2          |
| Assign IP / Gateway             | ✅              | ❌           |
| Route between VLANs             | ✅              | ❌           |
| Control tagged/untagged traffic | ❌              | ✅           |
| Switch port segmentation        | ❌              | ✅           |

# Recommended Configuration Approach

Configure Bridge VLANs to control Layer 2 traffic and define tagged/untagged ports.

Create Interface VLANs on the bridge for Layer 3 IP addressing and routing.

Example Workflow:

Step 1 → Bridge VLAN: Allow VLAN10 on ports ether1 (tagged) and ether2 (untagged)
Step 2 → Interface VLAN: Assign IP 192.168.10.1/24 to VLAN10 interface for routing

# Common Pitfalls

Creating only Interface VLAN without updating the Bridge VLAN table may prevent VLAN traffic from reaching the router.

Forgetting to set vlan-filtering=yes on the bridge disables VLAN segregation.