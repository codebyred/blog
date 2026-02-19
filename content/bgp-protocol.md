+++
title = 'Bgp Protocol'
description = "" 
date = 2026-02-19T10:20:00+06:00
draft = false
tags = ["general"]
authors = ["Redoan"]
+++

# BGP Speakers and Peers
BGP Speaker – A router running the BGP protocol.
BGP Peer (Neighbor) – Two BGP speakers with an established BGP session between them.

Scenario: 5 Routers Running BGP

**Routers:**

R1, R2, R3, R4, R5

All routers are BGP speakers because BGP is enabled.

However:

They are only BGP peers with routers they form sessions with.

If no BGP session exists between two routers, they are not peers.

**Cases**

Case 1 – Full Mesh (All Are Peers)

Every router forms a session with every other router.

Number of required sessions:
```
n(n - 1) / 2
5(4) / 2 = 10 sessions
```

In this case, all routers are peers with each other.

Case 2 – Partial Peering

Example:

* R1 ↔ R2

* R2 ↔ R3

* R3 ↔ R4

* R4 ↔ R5

Here:

* Not all routers are peers.

* They are still BGP speakers.

* Peering exists only where sessions are configured and established.