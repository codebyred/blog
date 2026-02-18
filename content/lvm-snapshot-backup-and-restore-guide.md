+++
title = 'Lvm Snapshot Backup and Restore Guide'
description = "" 
date = 2026-02-16T10:12:42+06:00
draft = false
tags = ["Linux","Backup"]
authors = ["Redoan"]
+++

# Overview

This document explains how to perform block-level backup and restore of an LVM logical volume using:

* LVM snapshots (point-in-time consistency)

* dd (block copy)

* pigz (parallel compression)

* ssh (secure transfer)

This method is suitable for:

* Full system backup

* Bare-metal restore scenarios

* Disaster recovery preparation

* Exact disk state preservation

# Backup Transfer Methods

Two supported transfer methods are available:
1. Method A — SSH Streaming Pipeline
2. Method B — SCP File Transfer

# Environment Example

| Component           | Value       |
| ------------------- | ----------- |
| Volume Group        | ubuntu-vg   |
| Root Logical Volume | ubuntu-lv   |
| Snapshot Name       | root_snap   |
| Backup Server       | 10.10.30.57 |
| Backup Path         | /backup     |
| Compression Tool    | pigz        |

# Prerequisites

## Install Required Tools

### Backup Storage Server
```
sudo apt update
sudo apt install pigz -y
```
### Backup Target Server
```
sudo apt install pigz -y
```
## PART 1 — Create LVM Snapshot
### Step 1 — Verify Volume Group Free Space
```
sudo vgs
```
**Requirement**

Snapshot COW space must be available in VG free space.
Typical planning:

| Workload Type         | Recommended Snapshot Size |
| --------------------- | ------------------------- |
| Low write activity    | 5–10% of LV               |
| Medium write activity | 15–20%                    |
| High write activity   | 30%+                      |


### Step 2 — Create Snapshot

```
sudo lvcreate -L 5G -s -n root_snap /dev/ubuntu-vg/ubuntu-lv
```

**Explanation**

| Option         | Meaning                   |
| -------------- | ------------------------- |
| `-L 5G`        | Snapshot COW storage size |
| `-s`           | Create snapshot           |
| `-n root_snap` | Snapshot name             |

### Step 3 — Verify Snapshot

```
sudo lvs
```

## PART 2 — Backup Snapshot to Remote Server
### Step 4 

**Method-1: Stream Snapshot Using pigz + SSH**

This method streams snapshot data directly to the remote server without creating a local backup file.

Advantages

* No temporary disk usage on source

* Fast for automation

* Single pipeline command

* Less storage required on source server

Disadvantages

* Cannot resume if interrupted

* Harder to verify mid-transfer

* Requires stable network connection

Backup Command

```
sudo dd if=/dev/ubuntu-vg/root_snap bs=16M status=progress \
| pigz -1 \
| ssh root@10.10.30.57 "cat > /backup/root_snap.img.gz"
```

**Why This Pipeline Works Well**

| Component | Purpose                                 |
| --------- | --------------------------------------- |
| dd        | Reads raw block data                    |
| pigz      | Parallel compression (faster than gzip) |
| ssh       | Secure transport                        |

When To Use SSH Streaming

* Backup runs automatically (cron / automation)

* Source disk space is limited

* Network is reliable

* Fastest transfer required

**Method B — Backup Using SCP Transfer (File-Based Method)**

This method creates a compressed backup file locally, then transfers it using SCP.

Advantages

* Easy to verify backup before transfer

* Transfer can be retried separately

* Easier troubleshooting

* Allows checksum validation

* Supports resume using rsync (if needed later)

Disadvantages

* Requires local storage equal to compressed backup size

* Two-step process (backup + transfer)

First run this

```
sudo dd if=/dev/ubuntu-vg/root_snap bs=16M status=progress \
| pigz -1 > /tmp/root_snap.img.gz
```
Verfiy Local Backup

```
ls -lh /tmp/root_snap.img.gz
```
Transfer Using SCP

```
scp /tmp/root_snap.img.gz root@10.10.30.57:/backup/
```

### Step 5 — Verify Backup File

```
ssh root@10.10.30.57 "ls -lh /backup/root_snap.img.gz"
```

### Step 6 — Remove Snapshot (Recommended)

```
sudo lvremove -y /dev/ubuntu-vg/root_snap
```

Why Remove Snapshot?

Snapshots slow down disk performance and consume COW storage.

## PART 3 — Restore from Backup
⚠ CRITICAL WARNING

Restore overwrites the entire logical volume.
Restore overwrites the entire logical volume.

Perform restore from:
* Rescue Mode

* Live ISO

* Maintenance environment
Never restore while system is running from that LV.

### Step 7 — Activate LVM (If Needed)

```
sudo vgchange -ay
```

### Step 8 — Restore Snapshot Image

```
ssh root@10.10.30.57 "cat /backup/root_snap.img.gz" \
| pigz -d \
| sudo dd of=/dev/ubuntu-vg/ubuntu-lv bs=16M conv=fsync status=progress
```
### Step 9 — Flush Disk Cache

```
sync
```

### Step 10 — Reboot

```
sudo reboot
```
# Storage Planning Guidelines
## Target Machine

| Requirement                   | Notes                     |
| ----------------------------- | ------------------------- |
| VG free space ≥ snapshot size | Required for COW          |
| Snapshot size                 | Depends on write activity |

## Backup Storage Server

| Requirement                  | Notes                         |
| ---------------------------- | ----------------------------- |
| Storage ≥ LV size per backup | dd creates full image         |
| Large file support           | ext4 / XFS recommended        |
| CPU for compression          | pigz benefits from multi-core |
| Network bandwidth            | Impacts backup duration       |

## Example Storage Scenario

| Component          | Size            |
| ------------------ | --------------- |
| Root LV            | 15 GB           |
| Snapshot mapping   | 15 GB (virtual) |
| Snapshot COW       | 5 GB            |
| Compressed backup  | ~7–8 GB         |
| 3 backup retention | ~21–24 GB       |

# Technical Concepts

1. LVM Snapshot — What It Is

A snapshot is a point-in-time logical volume view.

```
Live LV → continues changing
Snapshot → frozen at creation time
```

2. Copy-On-Write (COW) — How It Works

When a block is modified:

```
1. Original block copied to snapshot COW
2. New block written to main LV
```
This preserves snapshot integrity.

3. Snapshot Data Lifecycle Example

| Event     | Original LV | Snapshot | COW Stored |
| --------- | ----------- | -------- | ---------- |
| Initial   | 1           | 1        | Empty      |
| Write → 2 | 2           | 1        | 1          |
| Write → 3 | 3           | 1        | 1          |

Only first change is stored.

4. Why Use dd Instead of rsync?

Disk Structure Layers

```
Boot Sector
Partition Table
Filesystem
LVM Metadata
Files
```

5. rsync vs dd Comparison

| Feature            | rsync | dd    |
| ------------------ | ----- | ----- |
| Level              | File  | Block |
| Bootloader backup  | No    | Yes   |
| Disk layout        | No    | Yes   |
| Incremental backup | Yes   | No    |
| Exact clone        | No    | Yes   |

6. When to Use This Method

* Full system recovery
* Bare metal restore
* LVM infrastructure backup
* Golden image cloning

7. When NOT to Use This Method

* Frequent incremental backups
* File-level restore needs
* Very large storage environments without deduplication

# Common Failure Scenarios

| Problem          | Cause                     |
| ---------------- | ------------------------- |
| Snapshot invalid | COW space filled          |
| Slow system      | Snapshot active too long  |
| Corrupt restore  | Interrupted dd or network |
