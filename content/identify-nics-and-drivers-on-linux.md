+++
title = 'Identify Nics and Drivers on Linux'
description = "" 
date = 2026-02-19T14:39:13+06:00
draft = false
tags = ["general"]
authors = ["Redoan"]
+++

## Introduction

When managing Linux servers or bare-metal systems, it’s crucial to know **what network interface cards (NICs) are installed**, their **exact models**, and which **drivers** they use. This is especially important for Intel NICs like **X710, I210, or X520**, which may have different capabilities (1G, 10G, offload features).

This guide shows you how to discover **all NICs on your system** using built-in Linux tools like `ethtool`, `lspci`, and `lshw`.

---

## 1. List All Network Interfaces

Start by listing the network interfaces on your system:

```bash
ip link show
```

Example output:

```
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
2: ens18: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
3: ens19: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
```

> Here, `ens18` and `ens19` are your physical NICs.

---

## 2. Using `ethtool` to Get Driver Info

`ethtool` shows **driver, firmware version, and bus info** for a given interface:

```bash
ethtool -i ens18
```

Example output:

```
driver: i40e
version: 2.19.3
firmware-version: 8.40 0x80009bdf
bus-info: 0000:03:00.0
```

> The `driver` field indicates the NIC family:  
> - `i40e` → Intel X710/XL710  
> - `ixgbe` → Intel X520/X540/X550  
> - `igb` → Intel I210/I350

---

## 3. Using `lspci` to Get Exact Model

To see the exact NIC model:

```bash
lspci | grep -i ethernet
```

Example output:

```
03:00.0 Ethernet controller: Intel Corporation Ethernet Controller X710 for 10GbE SFP+
04:00.0 Ethernet controller: Intel Corporation I210 Gigabit Network Connection
```

> Now you know the **exact model**, not just the driver family.

---

## 4. Discover All NICs at Once Using a Single Command

To check all interfaces in one command:

```bash
for iface in $(ls /sys/class/net/ | grep -v lo); do
    echo "=== $iface ===";
    ethtool -i $iface;
    lspci -nnk | grep -A 3 $(basename $(readlink /sys/class/net/$iface/device));
done
```

This outputs all NICs, their **driver, bus info, and exact model**.

---

## 5. Using `lshw` for a Cleaner All-in-One View

`lshw` can show all NICs, their **interface names, drivers, speed, and capabilities** in one go:

### Short Output:
```bash
sudo lshw -class network -short
```

Example:

```
H/W path        Device      Class      Description
===================================================
pci@0000:03:00.0 ens18      network    Intel X710 for 10GbE SFP+
pci@0000:04:00.0 ens19      network    Intel I210 Gigabit Network Connection
```

### Detailed Output:
```bash
sudo lshw -class network
```

Includes:
- Interface name  
- Product/Model  
- Driver & driver version  
- MAC address  
- Speed & capabilities  

> This is ideal for **documentation and reporting**.

---

## 6. Summary Table (Example)

| Interface | Model                   | Driver | Speed  |
|-----------|------------------------|--------|--------|
| ens18     | Intel X710 10GbE SFP+  | i40e   | 10G    |
| ens19     | Intel I210 Gigabit     | igb    | 1G     |

---

## Conclusion

Using these tools:
- **`ethtool`** → quick driver and firmware info  
- **`lspci`** → exact NIC model  
- **`lshw`** → all NICs at once, easy to document

This is essential for **server inventory, troubleshooting, and bare-metal deployments**, especially when dealing with multiple Intel NIC types.

---

## Optional Tip

You can redirect output to a file for documentation:

```bash
sudo lshw -class network > nic_inventory.txt
```
