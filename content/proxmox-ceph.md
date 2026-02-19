+++
title = 'Proxmox HA and Ceph Storage — Deployment & Concepts Guide'
description = "High Availability in Proxmox Cluster using Ceph Storage" 
date = 2026-02-14T18:30:27+06:00
draft = false
tags = ["proxmox","ceph"]
authors = ["Redoan"]
+++

# Overview

This document explains:

* How High Availability (HA) works in Proxmox VE

* The storage requirements for HA

* Core Ceph architecture concepts

* Ceph sizing and configuration parameters

* A step-by-step guide to simulating HA in a nested environment

* Extending a Ceph cluster using a standalone Ubuntu storage node

This guide is intended for lab experimentation or foundational understanding before production deployment.

# Proxmox High Availability
## What Proxmox HA Provides

Proxmox VE’s High Availability subsystem automatically:

* Detects node or VM failures

* Migrates workloads to healthy nodes

* Restarts services without manual intervention

This ensures service continuity when hardware or host failures occur.

**HA Components**
| Component          | Role                            |
| ------------------ | ------------------------------- |
| **pve-ha-manager** | Global HA controller            |
| **pve-ha-crm**     | Cluster Resource Manager        |
| **pve-ha-lrm**     | Local Resource Manager per node |

## HA Requirements
Two fundamental requirements must be met:
| Requirement        | Description                    |
| ------------------ | ------------------------------ |
| **Cluster Setup**  | Minimum 3 nodes for quorum     |
| **Shared Storage** | All nodes must access VM disks |
Without shared storage, failover is impossible.

## Storage Options for HA
| Storage Type      | Shared | Notes                        |
| ----------------- | ------ | ---------------------------- |
| local-lvm         | ❌      | Node-local only              |
| NFS / iSCSI / SMB | ✅      | Simple external sharing      |
| Ceph (RBD/CephFS) | ✅      | Distributed & fault-tolerant |
| ZFS Replication   | ⚠️     | Not real-time shared         |
Ceph is the native production-grade solution.

# Ceph Architecture Concepts
## File Write Flow (CephFS)
When writing a file:

1. Client contacts MDS

2. MDS determines namespace placement

3. File split into objects (default 4MB)

4. Objects mapped to Placement Groups

5. PGs mapped to OSDs

6. Replication performed
Example (10 MB file):
```
report.pdf.00000000
report.pdf.00000001
report.pdf.00000002
```
## Object Placement
* Objects hashed via CRUSH

* Assigned to PGs

* PGs distributed across OSDs

* Replicated across multiple disks

Example:
```
PG217 → OSD1 OSD2 OSD3
PG219 → OSD2 OSD4 OSD5
```

## File Read Flow
1. Client queries MDS

2. MDS returns object map

3. Client reads objects directly from OSDs in parallel
This enables horizontal scaling.

# Ceph Daemons
| Daemon  | Purpose                  |
| ------- | ------------------------ |
| **OSD** | Stores data, replication |
| **MON** | Cluster state & quorum   |
| **MGR** | Metrics & dashboard      |
| **MDS** | CephFS metadata          |
| **RGW** | S3/Swift object gateway  |

# Deployment Methods

* cephadm (container-based)

* Rook (Kubernetes)

* Ansible automation

* Salt integration

* Manual installation

This guide uses cephadm on Ubuntu 22.04

# Conceptual Comparison with LVM
| LVM            | Ceph        |
| -------------- | ----------- |
| Physical Disk  | OSD         |
| Volume Group   | Cluster     |
| Logical Volume | Pool        |
| Filesystem     | CephFS      |
| RAID           | Replication |
| Single Node    | Distributed |

# Pool Redundancy Parameters
## size (Replication Factor)
Defines total copies stored.
```
Usable Capacity = Raw Capacity / size
```
* size = 3 → three copies

* Tolerates two disk failures

* Recommended production value

## min_size (Write Quorum)
Minimum replicas required to accept writes.

* Prevents data corruption

* Typical:
```
min_size = size − 1
```
Example:
| size | min_size |
| ---- | -------- |
| 3    | 2        |

# Hardware Requirements
## MON
* CPU: 2 cores

* RAM: 2–4 GB

* Storage: SSD preferred

* Minimum: 3 nodes
## MGR
* CPU: 2 cores

* RAM: 1–2 GB

* Deploy 2 for HA
## OSD
| Resource | Recommended |
| -------- | ----------- |
| CPU      | 2–4 cores   |
| RAM      | 4–8 GB      |
| Disk     | 1 per OSD   |
| Network  | 10GbE       |
Guidelines:
* No RAID

* Separate WAL/DB if possible

* Raw disks preferred

## Network Layout
| Network | Purpose     |
| ------- | ----------- |
| Public  | Client IO   |
| Cluster | Replication |

# Example Small Cluster
| Node  | Roles       |
| ----- | ----------- |
| node1 | MON MGR OSD |
| node2 | MON MGR OSD |
| node3 | MON MGR OSD |

Provides:

* 3 MON

* 2 MGR

* 6 OSD

* size=3 redundancy

# Simulating HA in Nested Proxmox
Step 1 — Create 3 Proxmox VMs

Each VM:

* OS disk

* Ceph disk

* Extra disks for OSDs

Step 2 — Create Cluster

GUI:
```
Datacenter → Cluster → Create
```
Join others via:
```
Join Information
```
CLI:
```
pvecm create cluster
pvecm add <ip>
pvecm status
```
Step 3 — Deploy Ceph
Install
```
Node → Ceph → Install
```
Create MON/MGR
```
Ceph → Monitor
Ceph → Manager
```
Add OSD
```
Ceph → OSD → Create
```
Create Pool
```
Ceph → Pools → Create
```
Optional CephFS
```
CephFS → Create
Datacenter → Storage → Add
```
Step 4 — Enable HA
```
Datacenter → HA → Add Resource
```
VM now migrates automatically.
# Local Storage vs Ceph
| Feature        | local-lvm | Ceph |
| -------------- | --------- | ---- |
| Live migration | ❌         | ✅    |
| HA failover    | ❌         | ✅    |
| Shared access  | ❌         | ✅    |
# Adding Ubuntu as Storage Node
## Concept

Ubuntu node joins Ceph cluster only

NOT Proxmox cluster.

Acts purely as OSD host.
## Preparation Steps
Install packages
```
apt install ceph ceph-common ceph-volume
```
## Configure networking

Populate /etc/hosts
## Open firewall ports
```
6789
3300
6800-7300
```
Copy config + keys
```
ceph.conf
admin.keyring
bootstrap-osd.keyring
```
Place under:
```
/etc/ceph
/var/lib/ceph/bootstrap-osd
```
## Modify config paths
Comment Proxmox-specific keyring paths.
## Create OSD
```
ceph-volume lvm create --data /dev/sdb
```
Node becomes active storage provider.

# Version Compatibility Note
Ceph version mismatches may occur when:

* Proxmox uses packaged Ceph

* Ubuntu uses newer libraries

Always align versions where possible.

# Conclusion
This guide demonstrated:

* HA fundamentals in Proxmox

* Why shared storage is mandatory

* Internal workings of Ceph distribution

* Deployment practices

* Cluster scaling using external nodes

Together, Proxmox HA and Ceph provide:

* Automatic failover

* Distributed storage

* Horizontal scalability

* Enterprise-grade resilience