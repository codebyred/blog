+++
title = 'Proxmox Ceph'
description = "High Availability in Proxmox Cluster using Ceph Storage" 
date = 2026-02-14T18:30:27+06:00
draft = false
tags = ["Proxmox","Ceph"]
authors = ["Redoan"]
+++

## **What Proxmox HA Does**

Proxmox VE’s HA system automatically:

- Detects node or VM failures
- Migrates VMs or containers to another healthy node
- Restarts them automatically using **shared storage (Ceph RBD or CephFS)**

HA is managed by:

- **pve-ha-manager** (global controller)
- **pve-ha-crm** (cluster resource manager)
- **pve-ha-lrm** (local resource manager on each node)