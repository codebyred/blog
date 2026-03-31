+++
title = 'IPsec & IKEv2 Comprehensive Guide'
description = "A technical deep-dive into IPsec modes, IKEv2 exchange flows, and NAT Traversal (NAT-T) packet structures." 
date = 2026-03-30T15:10:00+06:00
draft = false
tags = ["networking", "security", "vpn"]
authors = ["Redoan", "Gemini"]
+++

## Introduction

![IPsec Packet Structure](/images/ipsec-packet.webp)

**IPsec (Internet Protocol Security)** is a framework of open standards for ensuring private, secure communications over IP networks. It provides data confidentiality (encryption), integrity (hash), and authentication.

IPsec operates in two distinct modes:

* **Transport Mode**: Only the IP payload is encrypted. The original IP header is preserved. This is typically used for **host-to-host** (End-to-End) communication.
* **Tunnel Mode**: The entire original IP packet is encrypted and encapsulated within a new IP header. This is the standard for **Site-to-Site VPNs**.

---

## IKEv2: The Control Plane

**IKE (Internet Key Exchange)** is the protocol used to set up the Security Association (SA) in the IPsec protocol suite. While IKEv1 is still seen, **IKEv2** is the modern standard due to its reduced latency and built-in NAT-T support.

### The Two Stages of IKEv2

Unlike the "Main Mode" and "Aggressive Mode" of IKEv1, IKEv2 simplifies the process into two primary exchanges:

1.  **IKE_SA_INIT**: Negotiates cryptographic algorithms and performs a Diffie-Hellman (DH) exchange.
2.  **IKE_AUTH**: Authenticates the identities of both peers and establishes the first **Child SA** (the tunnel that actually carries data).

---

## NAT Traversal (NAT-T)

Since **ESP (Encapsulating Security Payload)** is a Layer 4 protocol without port numbers, it often fails when passing through a NAT device (which expects TCP/UDP ports to translate).

**How NAT-T Solves This:**
* **Detection**: During `IKE_SA_INIT`, both peers send "NAT Detection" hashes.
* **Port Switching**: If a NAT is detected, the communication switches from **UDP 500** to **UDP 4500**.
* **Encapsulation**: The ESP packet is wrapped inside a UDP header. The NAT device can now translate the UDP ports as usual.

---

## Step-by-Step Packet Exchange (IKEv2)

### 1. IKE_SA_INIT (Unencrypted)
The peers agree on the security "proposal" and exchange DH values.
* **Initiator**: `HDR, SAi1, KEi, Ni, NAT_DETECTION_SOURCE_IP, NAT_DETECTION_DESTINATION_IP`
* **Responder**: `HDR, SAr1, KEr, Nr, NAT_DETECTION_SOURCE_IP, NAT_DETECTION_DESTINATION_IP`

### 2. IKE_AUTH (Encrypted)
Once keys are derived, identities are exchanged and the tunnel is built.
* **Initiator**: `HDR, SK { IDi, AUTH, SAi2, TSi, TSr }`
* **Responder**: `HDR, SK { IDr, AUTH, SAr2, TSi, TSr }`

---

## Understanding Security Associations (SA)

The result of the exchange above is the creation of two distinct types of "Associations." Think of the **IKE SA** as the management office and the **Child SA** as the actual armored truck carrying the cash.

### IKE SA (The Control Plane)
The IKE SA is a bidirectional secure channel used solely for management. It handles re-keying, error reporting, and the creation of new Child SAs.

### Child SA (The Data Plane)
Also known as the **IPsec SA**, this is what actually encrypts your user data.
* **Unidirectional**: A single tunnel consists of two Child SAs—one for inbound and one for outbound.
* **Traffic Selectors (TS)**: These define which subnets (e.g., `10.0.1.0/24` to `192.168.1.0/24`) are allowed to enter the tunnel.
* **CREATE_CHILD_SA**: This specific exchange occurs when a tunnel needs to be "re-keyed" or when a new set of subnets needs a tunnel.

---

## Data Flow: Encapsulation Hierarchy

When NAT-T is active in **Tunnel Mode**, the packet structure follows this specific order:

| Layer | Component | Function |
| :--- | :--- | :--- |
| **Outer IP** | New IP Header | Routes the packet between VPN Gateways. |
| **UDP 4500** | NAT-T Header | Allows the packet to traverse NAT devices. |
| **ESP Header** | Security SPI | Identifies which SA should be used to decrypt. |
| **Payload** | **Encrypted Data** | The original IP packet (Header + Data). |
| **ESP Trailer** | Padding | Ensures data fits encryption block sizes. |
| **ESP Auth** | ICV | Integrity Check Value to ensure no tampering. |


---

## IPsec Architecture: How the Kernel Thinks

1. **Packet Outbound**: 
   - OS checks **SPD** (Should I encrypt this?).
   - If yes, it finds the **SA** in the **SAD**.
   - It encrypts the packet, adds the **SPI** to the header, and sends it.

2. **Packet Inbound**:
   - OS sees an ESP packet and extracts the **SPI**.
   - It lookups the **SPI** in the **SAD** to find the decryption key.
   - It decrypts and then verifies against the **SPD** to ensure the packet was supposed to be encrypted.

## The "Brain" of the Operation: SPD and SAD
To handle these tunnels efficiently, the system kernel maintains two specialized databases:

Security Policy Database (SPD): The Decision Maker. It contains the rules that decide if a packet should be Encrypted, Bypassed (sent in cleartext), or Discarded (dropped).

Security Association Database (SAD): The Vault. Once the SPD decides to encrypt, the kernel looks here to find the active encryption keys and the SPI (Security Parameter Index)—a unique ID tag that ensures the receiver uses the correct key for that specific session.

## References

1.  **RFC 7296**: Internet Key Exchange Protocol Version 2 (IKEv2)
2.  **RFC 3948**: UDP Encapsulation of IPsec ESP Packets
3.  **Unixwiz**: [An Illustrated Guide to IPsec](http://www.unixwiz.net/techtips/iguide-ipsec.html)
4. **IpsecGuru**: https://ipsec.guru/