+++
title = 'Trex Guide'
description = "" 
date = 2026-02-22T12:56:36+06:00
draft = true
tags = ["trex","imix","traffic-profile"]
authors = ["Redoan"]
+++

# Requirements

| VM     | SW & ROLE                  | OS                   | CPU | MEM (GB) | HDD (GB) |
|--------|----------------------------|----------------------|-----|----------|----------|
| vm-tg  | TRex Traffic Generator     | Ubuntu 24.04 Server  | 3   | 2        | 32       |
| vm-dut | DUT                        | Ubuntu 24.04 Server  | 2   | 2        | 32       |

| VM     | DEVICE | BRIDGE      | IP ADDRESS          | INTERFACE |
|--------|--------|------------|--------------------|-----------|
| vm-tg  | ens18  | VLAN_TRUNK | 10.10.30.56/24     | mgmt      |
|        | ens19  | vmbr1      | 192.168.130.5/24   |           |
|        | ens20  | vmbr2      | 192.168.47.19/28   |           |
| vm-dut | ens18  | VLAN_TRUNK | 10.10.30.57/24     | mgmt      |
|        | ens20  | vmbr1      | 192.168.130.1/24   |           |
|        | ens21  | vmbr2      | 192.168.47.18/28   |           |


# VM-TG Configuration

Install trex

Run the following command

```
sudo ./t-rex-64 -f cap2/http_simple.yaml -d 30 -m i -c i -k 5 --nc
```
After running this command you may face the following issues, Go to [Issues](#issues) section to find proper fix.



# VM-DUT Configuration
This is a simple ubuntu machine acting like a Firewall/FTD. The netplan config is following

```
network:
  version: 2
  renderer: networkd
  ethernets:
    ens19:
      dhcp4: no
      addresses:
        - 192.168.130.1/24
      routes:
        - to: 16.0.0.0/16
          via: 192.168.130.5
          metric: 100
    ens20:
      dhcp4: no
      addresses:
        - 192.168.47.18/28
      routes:
        - to: 48.0.0.0/16
          via: 192.168.47.19
          metric: 100
```
Enable ip forwarding in order to forward traffic from ens19 to ens20

```
sudo sysctl -w net.ipv4.ip_forward=1
```

# Notes

1. When we assign ports to trex, they will become unavailable from linux kernel. So any ips on this ports can only be configured by trex. Also if trex server is not running, this ports will be unreachable. Run the trex server using `t-rex-64` if you want to ping from another device to trex server ports.

2. Comparison of trex/stl and trex/cap2
| TRex Mode | Profile Type                       | Purpose                                     |
| --------- | ---------------------------------- | ------------------------------------------- |
| STL       | **Traffic profile + Load profile** | Traffic template vs rate/time               |
| CAP2      | **Traffic profile only**           | Packets + approximate sending rate together |


# Issues

## EAL(DPDK Error): Hugepages size mismatch

**Issue**

while running this, you may encounter this error

```
EAL: Cannot get hugepage information.
 You might need to run ./trex-cfg  once  
EAL: Error - exiting with code: 1
Invalid EAL arguments
```

**Fix**

HugePages Setup (Ubuntu VM)

Modern Ubuntu systems automatically mount hugetlbfs at:

```
/dev/hugepages
```

Therefore, only HugePage allocation is required.

1. Check Current HugePages
grep Huge /proc/meminfo

If:

HugePages_Total: 0

HugePages must be allocated.

2. Allocate HugePages (Temporary)

Example: Allocate 1024 × 2MB pages (~2GB)

sudo sysctl -w vm.nr_hugepages=1024

Verify:

grep Huge /proc/meminfo
3. Verify hugetlbfs Mount

Ubuntu automatically mounts:

```
mount | grep huge
```

Expected output:

```
hugetlbfs on /dev/hugepages type hugetlbfs (pagesize=2M)
```

⚠ Do NOT create additional mounts like /mnt/huge unless specifically required.

Multiple hugetlbfs mounts with different page sizes may cause DPDK EAL initialization errors.

## EAL(DPDK Error): MTU size mismatch

**Isse**

while runnign `t-rex-64` you may get the following error

```
ETHDEV: MTU (2018) > device max MTU (1500) for port_id 0
EAL: Error - exiting with code: 1
Cannot configure device: err=-22, port=0
```

**Fix**

Append the following line in the `/etc/trex_cfg.yaml` file

```
port_mtu: 1500
```

# Appendix

## Trex Full Data Path (TX Direction - Sending Packets)
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

## DPDK(Data Plane Development Kit)
![](/blog/images/dpdk.jpg)

## NUMA
NUMA = Non-Uniform Memory Access

On modern multi-socket servers, you don’t just have:

CPUs → one shared RAM pool

Instead, you have something like this:
```
CPU Socket 0  ─── Local RAM (NUMA Node 0)
CPU Socket 1  ─── Local RAM (NUMA Node 1)
```
Each CPU socket has its own directly attached memory.

### Why is it called "Non-Uniform"?

Because memory access time is not equal.

* If CPU 0 accesses RAM attached to CPU 0 → ✅ FAST (local access)

* If CPU 0 accesses RAM attached to CPU 1 → ❌ SLOWER (remote access)

Remote access must travel across interconnects like:

* QPI (older Intel)

* UPI (newer Intel)

* Infinity Fabric (AMD)

So latency increases and bandwidth drops.

### Visual Example
**Local Access (Good)**
```
Thread on CPU 0
        ↓
Local Memory (Node 0)
```
Fast, low latency.

**Remote Access (Bad)**
```
Thread on CPU 0
        ↓
Memory on Node 1
```
Slower because it crosses CPU interconnect.

### Why This Matters for DPDK

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

## Zero Copy
Zero-copy involves mapping the same physical memory pages into both kernel space and user space, or allowing peripherals (like network cards) to directly access user-space memory, which relies on the MMU and TLB to manage address translation without copying data. 
Here is how they are related:
* **Virtual Memory Mapping**: Zero-copy techniques often use memory mapping (mmap) to share buffer locations between applications and the kernel. The TLB caches these virtual-to-physical address mappings, ensuring fast access.
* **TLB Shootdowns**: When a zero-copy operation modifies page mappings (e.g., freeing or remapping a shared buffer), the operating system must invalidate the corresponding entries in the TLB across all CPU cores. This process, known as a TLB shootdown, is a significant overhead in high-performance zero-copy scenarios.
* **Performance Impact**: High TLB miss rates can degrade the performance of zero-copy systems, especially in microkernel operating systems where IPC (Inter-Process Communication) relies heavily on zero-copy. Optimizing TLB management (e.g., using larger page sizes or optimized flushing) is crucial to realizing the speed benefits of zero-copy.
* **DMA and IOMMU**: In many zero-copy scenarios, peripheral devices (like NICs) use Direct Memory Access (DMA) to access memory. The IOMMU (Input-Output Memory Management Unit) uses TLB-like structures to translate these device accesses, allowing zero-copy transfers. 
The Institute of Electronics, Information and Communication Engineers
The Institute of Electronics, Information and Communication Engineers

In summary, zero-copy removes the data copy overhead, but it places a higher dependency on the TLB to efficiently manage virtual-to-physical address translation


# References
1. https://www.intel.cn/content/www/cn/zh/developer/articles/technical/memory-in-dpdk-part-1-general-concepts.html
2. https://blog.hacksbrain.com/cisco-trex-packet-generator-step-by-step
3. https://github.com/s5uishida/install_trex?tab=readme-ov-file#check
4. https://github.com/cisco-system-traffic-generator/trex-core