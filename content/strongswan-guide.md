+++
title = 'Strongswan Guide'
description = "" 
date = 2026-04-05T12:49:24+06:00
draft = false
tags = ["general"]
authors = ["Redoan"]
+++

| local_ts         | remote_ts     | Meaning                                        |
| ---------------- | ------------- | ---------------------------------------------- |
| `0.0.0.0/0`      | `0.0.0.0/0`   | **Full tunnel** (all traffic goes through VPN) |
| `192.168.1.0/24` | `10.0.0.0/24` | Site-to-site VPN                               |
| `10.0.0.5/32`    | `0.0.0.0/0`   | Roadwarrior client access                      |
