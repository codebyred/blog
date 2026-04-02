+++
title = 'Understanding IPsec Security Policy (SP) and Security Association (SA)'
description = "" 
date = 2026-04-02T16:31:25+06:00
draft = false
tags = ["general"]
authors = ["Redoan"]
+++

When working with IPsec—whether using tools like **strongSwan** or the Linux **XFRM/IPsec stack**—two core concepts define how secure communication happens:

* **Security Policy (SP)**
* **Security Association (SA)**

These form the backbone of how IPsec decides *what to protect* and *how to protect it*.

---

## 1. What is a Security Policy (SP)?

A **Security Policy** defines **which traffic should be protected and what action to take**.

It acts like a rule in a firewall, but instead of allowing or blocking traffic, it determines whether traffic should:

* Be encrypted (protected)
* Be allowed without IPsec (bypass)
* Be dropped (discard)

### Key Components

* Source IP / Subnet
* Destination IP / Subnet
* Protocol (TCP, UDP, ICMP, ANY)
* Direction (inbound, outbound, forward)
* Action (protect, bypass, discard)

---

### Example Policy

```
Source:      192.168.1.0/24
Destination: 10.10.10.0/24
Action:      PROTECT (use IPsec)
```

Meaning: Any traffic between these networks must be encrypted.

---

### Linux Example

```bash
ip xfrm policy
```

Sample output:

```
src 192.168.1.0/24 dst 10.10.10.0/24
    dir out
    tmpl src 203.0.113.1 dst 198.51.100.1
         proto esp mode tunnel
```

This tells the kernel:

* Match traffic between subnets
* Use IPsec ESP in tunnel mode

---

## 2. What is a Security Association (SA)?

A **Security Association** defines **how the traffic is actually protected**.

While SP says *“protect this traffic”*, SA says:

“Use this encryption algorithm, this key, and this identifier.”

---

### Key Characteristics

* **Unidirectional** (one SA per direction)
* Identified by:

  * SPI (Security Parameter Index)
  * Destination IP
  * Protocol (ESP or AH)

---

### Example SA

```
SPI:           0x12345678
Encryption:    AES-256
Authentication: SHA-256
Mode:          Tunnel
```

---

### Linux Example

```bash
ip xfrm state
```

Sample output:

```
src 203.0.113.1 dst 198.51.100.1
    proto esp spi 0x12345678 mode tunnel
    enc aes 0xabcdef...
    auth sha256 0x123456...
```

This defines:

* Which algorithm is used
* Which key is used
* How packets are encrypted

---

## 3. How SP and SA Work Together

The interaction between SP and SA is what enables IPsec to function.

### Packet Flow

```
[Incoming/Outgoing Packet]
        ↓
[Security Policy Database (SPD)]
        ↓
 Match found → Action = PROTECT
        ↓
[Security Association Database (SAD)]
        ↓
Apply encryption/authentication
        ↓
[Encrypted ESP Packet]
```

---

### Mapping the Roles

| Component        | Role                                |
| ---------------- | ----------------------------------- |
| SP (Policy)      | Decides if traffic needs protection |
| SA (Association) | Defines how protection is applied   |

---

## 4. Real-World Example (strongSwan)

### Configuration (Policy Definition)

```
leftsubnet=192.168.1.0/24
rightsubnet=10.10.10.0/24
```

This generates Security Policies automatically.

---

### Runtime (SA After Tunnel Establishment)

```bash
ipsec statusall
```

Example:

```
Security Associations (1 up):
   net-net[1]: ESTABLISHED
   AES_CBC-256/HMAC_SHA2_256
```

This shows:

* Active tunnel
* Encryption/authentication algorithms

---

## Key Takeaways

* **Security Policy (SP)** = *What traffic should be protected*
* **Security Association (SA)** = *How the traffic is protected*
* SP uses matching rules (like ACLs)
* SA uses cryptographic parameters (keys, algorithms)
* Both are required for IPsec to function

---

## Final Analogy

Think of IPsec like sending a secure package:

* **SP** → Decides *which packages need protection*
* **SA** → Defines *how the package is locked and sealed*

---

If you're diving deeper, the next step is understanding how **IKE (Internet Key Exchange)** dynamically builds these SAs and keeps them updated.
