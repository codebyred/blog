+++
title = 'Trex Guide'
description = "" 
date = 2026-02-22T12:56:36+06:00
draft = true
tags = ["general"]
authors = ["Redoan"]
+++

# Trex Full Data Path (TX Direction - Sending Packets)
```
             ┌────────────────────────────┐
             │        TRex (App)          │
             │  - builds packets          │
             │  - manages flows           │
             └──────────────┬─────────────┘
                            │
                            ▼
             ┌────────────────────────────┐
             │        DPDK (EAL)          │
             │  - initializes NIC         │
             │  - allocates memory        │
             │  - runs poll-mode driver   │
             └──────────────┬─────────────┘
                            │
                            ▼
             ┌────────────────────────────┐
             │      Hugepages Memory      │
             │  - packet buffers          │
             │  - zero-copy memory        │
             └──────────────┬─────────────┘
                            │
                            ▼
             ┌────────────────────────────┐
             │       CPU Core (Thread)    │
             │  - polls NIC continuously  │
             │  - pushes packets          │
             └──────────────┬─────────────┘
                            │
                            ▼
             ┌────────────────────────────┐
             │         NUMA Node          │
             │  - memory locality         │
             │  - socket affinity         │
             └──────────────┬─────────────┘
                            │
                            ▼
             ┌────────────────────────────┐
             │            NIC             │
             │  - DMA from hugepage mem   │
             │  - transmits on wire       │
             └────────────────────────────┘
```
# DPDK(Data Plane Development Kit)
![](/blog/images/dpdk.jpg)

# NUMA
NUMA = Non-Uniform Memory Access

On modern multi-socket servers, you don’t just have:

CPUs → one shared RAM pool

Instead, you have something like this:
```
CPU Socket 0  ─── Local RAM (NUMA Node 0)
CPU Socket 1  ─── Local RAM (NUMA Node 1)
```
Each CPU socket has its own directly attached memory.

## Why is it called "Non-Uniform"?

Because memory access time is not equal.

* If CPU 0 accesses RAM attached to CPU 0 → ✅ FAST (local access)

* If CPU 0 accesses RAM attached to CPU 1 → ❌ SLOWER (remote access)

Remote access must travel across interconnects like:

* QPI (older Intel)

* UPI (newer Intel)

* Infinity Fabric (AMD)

So latency increases and bandwidth drops.

## Visual Example
### Local Access (Good)
```
Thread on CPU 0
        ↓
Local Memory (Node 0)
```
Fast, low latency.

### Remote Access (Bad)
```
Thread on CPU 0
        ↓
Memory on Node 1
```
Slower because it crosses CPU interconnect.

## Why This Matters for DPDK

DPDK is:

* High-performance

* Poll-mode driven

* Extremely latency sensitive

* Designed for millions of packets per second

If:

* Your DPDK thread runs on CPU 0

* But its memory buffers (mbufs, rings, hugepages) are allocated on NUMA Node 1

Then every packet access becomes a remote memory access.

That means:

* Higher latency

* Lower throughput

* CPU stalls

* Cache inefficiency

Even a few nanoseconds matter at 10G/25G/40G speeds.

# Zero Copy
Zero-copy involves mapping the same physical memory pages into both kernel space and user space, or allowing peripherals (like network cards) to directly access user-space memory, which relies on the MMU and TLB to manage address translation without copying data. 
Here is how they are related:
* **Virtual Memory Mapping**: Zero-copy techniques often use memory mapping (mmap) to share buffer locations between applications and the kernel. The TLB caches these virtual-to-physical address mappings, ensuring fast access.
* **TLB Shootdowns**: When a zero-copy operation modifies page mappings (e.g., freeing or remapping a shared buffer), the operating system must invalidate the corresponding entries in the TLB across all CPU cores. This process, known as a TLB shootdown, is a significant overhead in high-performance zero-copy scenarios.
* **Performance Impact**: High TLB miss rates can degrade the performance of zero-copy systems, especially in microkernel operating systems where IPC (Inter-Process Communication) relies heavily on zero-copy. Optimizing TLB management (e.g., using larger page sizes or optimized flushing) is crucial to realizing the speed benefits of zero-copy.
* **DMA and IOMMU**: In many zero-copy scenarios, peripheral devices (like NICs) use Direct Memory Access (DMA) to access memory. The IOMMU (Input-Output Memory Management Unit) uses TLB-like structures to translate these device accesses, allowing zero-copy transfers. 
The Institute of Electronics, Information and Communication Engineers
The Institute of Electronics, Information and Communication Engineers

In summary, zero-copy removes the data copy overhead, but it places a higher dependency on the TLB to efficiently manage virtual-to-physical address translation


# Using Trex without DPDK
Instead of using DPDK:
```
TRex → DPDK → Hugepages → NIC
```

It uses Linux AF_PACKET sockets:
```
TRex → Linux kernel network stack → NIC
```

* The Linux kernel handles packet transmission

* TRex can still generate packets, but only one core handles TX/RX

* Performance is much lower (~1Mpps)

Think of it as “software-only” TRex using standard Linux networking.

## Summary of Differences

| Feature       | DPDK Mode                             | AF_PACKET Mode               |
| ------------- | ------------------------------------- | ---------------------------- |
| NIC type      | PCI (DPDK-supported)                  | Any Linux NIC                |
| Hugepages     | Required                              | Not required                 |
| Kernel module | Required (`igb_uio` / `vfio-pci`)     | Not required                 |
| Performance   | Very high (~10G / 40G+)               | Low (~1Mpps)                 |
| Capture       | Hard (need DPDK mirror)               | Easy (`tcpdump` / Wireshark) |
| CPU cores     | Multiple (master + latency + traffic) | Single core for TX/RX        |

# Trex Counters (Cumulative — never reset)
Example:
```
ipackets = 2
ipackets = 10
ipackets = 150
ipackets = 5000
```
This number keeps increasing.
Rates (Calculated every refresh interval)

TRex calculates:
```
(Current counter - Previous counter) / Time interval
```

# References
1. https://www.intel.cn/content/www/cn/zh/developer/articles/technical/memory-in-dpdk-part-1-general-concepts.html