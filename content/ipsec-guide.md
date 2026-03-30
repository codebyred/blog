+++
title = 'Ipsec Guide'
description = "" 
date = 2026-03-09T12:31:21+06:00
draft = false
tags = ["general"]
authors = ["Redoan"]
+++

# Ipsec Packet Structure of Transport and Tunnel Mode
![Ipsec Packet Structure](/public/images/ipsec-packet.webp)

# Ipsec and IKE

## Internet Key Exchange(IKE) V1

IKE builds the VPN tunnel by authenticating both sides and reaching an agreement on methods of encryption and integrity. The outcome of an IKE negotiation is a Security Association (SA).

**Negotiates security parameters**

* encryption algorithm (AES, etc.)
* integrity algorithm (SHA, etc.)
* Diffie-Hellman group


**Authenticates the vpn peers**

* Pre-Shared Key (PSK)
* Digital certificates
* EAP

**Outcome: Security Association**

* encryption algorithm
* integrity algorithm
* keys
* lifetime
* tunnel parameters


## IKE Phase 1
Runs in two modes, main and aggressive
* The peers authenticate using certificates or pre-shared secret.
* A diffie-hellman key is created. Both side generates a shared key.
* key material(prime number (p), generator (g), random bits) and agreement on methods for IKE pahse 2 are exchanged between peers.
Outcome of phase 1 is the IKE SA, agreement on keys and method for IKE phase 2.

## IKE Phase 2

Key materials for building IPsec keys are exchanged.
Outcome of this phase is IPsec Security Association.

**Methods of Encryption and Integrity**

Are used for both IKE phase 1 and IKE phase 2. Using different key on each phase ensures Perfect Forward Secrecy(PFS)
* Encryption Algorithms(AES-128, 3DES)
* Hash Algorithm(SHA-256, MD5) ensures integrity


## IKE V2
Uses AES encryption and EAP for authentication
In IKE_SA_INIT, the responder has to do expensive cryptographic computations. So attacker can spoof source ip and send many fake IKE_SA_INIT.
The responder will see many open session and suspect dos attack. In order to verify the sender, it sends a cookie. As attacker spoofed ip, they will not receive the cookie, so sessions will be lost. But if it is a legit user, they will receive the cookie and send the the IKE_SA_INIT with the cookie next time.

# Step by step with NAT-T
## Phase-1: IKE_SA_INIT (NAT detection phase)

Initiator → Responder

```
HDR, SAi1, KEi, Ni, NAT_DETECTION_SOURCE_IP, NAT_DETECTION_DESTINATION_IP
```

Responder → Initiator
```
HDR, SAr1, KEr, Nr, NAT_DETECTION_SOURCE_IP, NAT_DETECTION_DESTINATION_IP
```

**What happens:**
* SAi1 / SAr1 → propose crypto (AES, SHA, DH group)
* KEi / KEr → Diffie-Hellman key exchange
* Ni / Nr → nonces (random values)

**Result:**
* Both sides derive a shared secret key
* IKE SA (secure control channel) is created

**What are these NAT detection payloads**

They are hashes of IP+ PORT. Each side calculates HASH = hash(source IP + source port). Then compares hash of other side. If mismatch, NAT detected.
If NAT is detected IKE traffic switches UDP 500 -> UDP 4500. ESP is encapsulated inside UDP.

## Phase-2: IKE_AUTH (authentication + Child SA)

Initiator -> Responder
```
HDR, SK { IDi, AUTH, SAi2, TSi, TSr }
```

Responder -> Initiator
```
HDR, SK { IDr, AUTH, SAr2, TSi, TSr }
```

**Inside encrypted payload (SK {...}):**
* IDi / IDr → identity (IP, FQDN, etc.)
* AUTH → proves identity (PSK/cert)
* SAi2 / SAr2 → IPsec proposal (ESP)
* TSi / TSr → traffic selectors (which IPs/subnets)

**Result:**
* Authentication complete
* Child SA created (this is actual IPsec tunnel)

## After Phase-2: ESP Data Flow

Initiator -> Responder
```
Outer Ip Header(NAT IP -> Public IP)
UDP (Port 4500)
ESP Header (SPI, Seq)
ESP Trailer (Padding, PadLength, NextHDR)
```

# References
1. http://www.unixwiz.net/techtips/iguide-ipsec.html
2. https://sc1.checkpoint.com/documents/R81/WebAdminGuides/EN/CP_R81_SitetoSiteVPN_AdminGuide/Topics-VPNSG/IPsec-and-IKE.html
3. https://ipsec.guru/