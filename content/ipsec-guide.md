+++
title = 'Ipsec Guide'
description = "A comprehensive guide to IPsec, IKE, and packet structure with NAT-T" 
date = 2026-03-09T12:31:21+06:00
draft = false
tags = ["general"]
authors = ["Redoan"]
+++

# IPsec Guide

## Introduction

![IPsec Packet Structure](/images/ipsec-packet.webp)

**IPsec (Internet Protocol Security)** is a suite of protocols used to
secure IP communications by authenticating and encrypting each IP packet
in a communication session. It is widely used to build VPNs and secure
network traffic between hosts or networks.

IPsec operates in two main modes:

-   **Transport Mode** -- protects the payload of the IP packet\
-   **Tunnel Mode** -- encapsulates the entire IP packet inside a new IP
    packet

------------------------------------------------------------------------

# IPsec Packet Structure

### Transport Mode

-   Only the payload is encrypted/authenticated\
-   The original IP header remains unchanged\
-   Used for host-to-host communication

### Tunnel Mode

-   Entire original IP packet is encrypted\
-   A new outer IP header is added\
-   Used in VPN gateways

------------------------------------------------------------------------

# IKE and IPsec

## What is IKE?

**IKE (Internet Key Exchange)** is used to establish a secure
communication channel (Security Association - SA).

### Responsibilities

-   Negotiates:
    -   Encryption (AES)
    -   Integrity (SHA)
    -   DH groups
-   Authenticates peers using:
    -   Pre-Shared Keys (PSK)
    -   Certificates
    -   EAP
-   Produces:
    -   Security Associations
    -   Keys
    -   Tunnel parameters

------------------------------------------------------------------------

## IKE Phase 1

-   Establishes IKE SA\
-   Performs authentication\
-   Diffie-Hellman key exchange

------------------------------------------------------------------------

## IKE Phase 2

-   Negotiates IPsec parameters\
-   Generates keys\
-   Creates Child SA

------------------------------------------------------------------------

## IKEv2

-   More efficient than IKEv1\
-   Uses cookies to prevent DoS attacks\
-   Supports NAT traversal and mobility

------------------------------------------------------------------------

# NAT Traversal (NAT-T)

-   Detects NAT using IP + port hashes\
-   Switches to UDP 4500 when NAT is detected\
-   Encapsulates ESP inside UDP

------------------------------------------------------------------------

# Step-by-Step IPsec with NAT-T

## Phase 1: IKE_SA_INIT

    HDR, SAi1, KEi, Ni, NAT_DETECTION_SOURCE_IP, NAT_DETECTION_DESTINATION_IP

    HDR, SAr1, KEr, Nr, NAT_DETECTION_SOURCE_IP, NAT_DETECTION_DESTINATION_IP

------------------------------------------------------------------------

## Phase 2: IKE_AUTH

    HDR, SK { IDi, AUTH, SAi2, TSi, TSr }

    HDR, SK { IDr, AUTH, SAr2, TSi, TSr }

------------------------------------------------------------------------

# Data Flow After Tunnel

    Outer IP Header
    UDP (4500 if NAT-T)
    ESP Header
    Encrypted Payload
    ESP Trailer

------------------------------------------------------------------------

# References

1.  http://www.unixwiz.net/techtips/iguide-ipsec.html\
2.  https://sc1.checkpoint.com/documents/R81/WebAdminGuides/EN/CP_R81_SitetoSiteVPN_AdminGuide/Topics-VPNSG/IPsec-and-IKE.html\
3.  https://ipsec.guru/