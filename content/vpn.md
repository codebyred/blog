+++
title = 'Vpn'
description = "" 
date = 2026-02-26T11:23:34+06:00
draft = true
tags = ["general"]
authors = ["Redoan"]
+++

PN Data Flow Inside the OS

When you use any VPN protocol (IPsec, OpenVPN, WireGuard, etc.):

Applications generate data

Example: Your browser sends an HTTP request to 8.8.8.8.

This data exists as IP packets in the OS networking stack.

Routing sends packets to the virtual interface

If using TUN/TAP (OpenVPN, WireGuard user-space in Linux):

The OS looks at the routing table.

It sees that the destination matches the VPN route.

Packets are sent to tun0 (or tap0).

If using IPsec XFRM interface:

Packets are routed according to policy.

The virtual XFRM interface (nm-xfrm-*) receives them in kernel space.

VPN software/process encrypts packets

User-space VPN (OpenVPN/TUN):

Reads packets from tun0

Encrypts them

Adds outer headers (UDP/TCP + outer IP)

Sends to physical NIC via kernel socket

Kernel VPN (WireGuard, IPsec XFRM):

Encryption happens in kernel

Packet is modified in-place

No extra copies to user space → faster

Physical interface sends the encrypted packet to the network

The NIC (eth0, ens18, etc.) transmits the packet over the Internet.

To the outside, it looks like “just a UDP/TCP packet” — everything else is encrypted.

On the other side

The remote VPN gateway receives the packet

Decrypts it

Injects the original IP packet into its virtual interface (tun0, nm-xfrm-*)

Delivers to its OS networking stack → application sees original data