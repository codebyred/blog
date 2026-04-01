+++
title = 'Fixing Ubuntu Installer Crashes'
description = "" 
date = 2026-04-01T16:35:29+06:00
draft = false
tags = ["general"]
authors = ["Redoan"]
+++

Fixing Ubuntu Installer Crashes: Wiping Proxmox LVM Metadata via BashTitle Strategy: Highly specific to capture users hitting the exact curtain error in Subiquity, while remains searchable for general LVM locking issues.1. Introduction & PreconditionsWhen transitioning a server from Proxmox VE to Ubuntu Server, the installation often fails during the storage configuration phase. This is typically signaled by a crash in the Subiquity installer or a "Curtain" command failure.The ConflictProxmox uses a complex LVM (Logical Volume Management) stack that auto-activates upon detection.Subiquity/Curtain (Ubuntu's installer engine) detects these active volumes and, as a safety precaution, refuses to modify the partition table of a "busy" device.Result: The installer hangs or crashes because it cannot gain exclusive write access to the disk.Preconditions for this FixA server with an existing Proxmox/LVM installation.An Ubuntu Server installer that is failing at the "Storage" step.A "Live" Linux environment (like the Arch Linux ISO) to perform manual disk surgery.Physical or Serial Console access to the machine.2. Bypassing the InstallerTo resolve this, we must drop into a raw Bash shell to manually "deconstruct" the Proxmox storage stack before the Ubuntu installer ever sees it.Step 1: Boot into a Shell-First EnvironmentFlash an Arch Linux ISO to a USB. When booting, if you are using a Serial Console cable, press e at the boot menu and append the following to the kernel line:Bashconsole=ttyS0,115200
Step 2: Identify the "Locked" HardwareOnce at the # prompt, identify your target NVMe or SATA drive:Bashlsblk
Look for the drive showing pve-root, pve-swap, or pve-data partitions.3. The "Nuke" Sequence (The Fix)The goal is to move from the top of the storage stack (Logical Volumes) down to the physical disk.A. Deactivate the Volume GroupsThe kernel cannot wipe a disk while LVM is "holding" it. We must tell the kernel to release the volumes:Bashvgchange -an
Expected Output: 0 logical volume(s) in volume group "pve" now activeB. Wipe Filesystem & LVM SignaturesThis erases the "magic strings" that tell installers "I am a Proxmox disk":Bashwipefs -a /dev/nvme0n1
(Replace /dev/nvme0n1 with your actual disk name).C. Zap the GPT Partition TableProxmox uses GPT, which stores a backup table at the end of the disk. We must destroy both:Bashsgdisk --zap-all /dev/nvme0n1
D. Clear the Device Mapper (If Busy)If the commands above still say "Device or resource busy," use the nuclear option to clear all virtual mappings:Bashdmsetup remove_all
4. Verification & Next StepsRun lsblk again. The disk should now appear as a single, empty line:PlaintextNAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
nvme0n1     259:0    0 953.9G  0 disk 
You can now reboot, plug in your Ubuntu Server USB, and proceed. Subiquity will now see a "Brand New" uninitialized disk and will no longer crash.Summary of CommandsCommandActionvgchange -anShuts down LVM volumes to release kernel locks.wipefs -aErases the LVM/FS signatures.sgdisk --zap-allDestroys primary and backup GPT partition tables.dmsetup remove_allForces the removal of any remaining virtual device handles.