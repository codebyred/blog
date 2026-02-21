+++
title = 'Fixing Root SSH Login Failure on Ubuntu'
description = "Enable remote ssh using root user and password" 
date = 2026-02-14T16:34:04+06:00
draft = false
tags = ["fix","ssh","linux","ubuntu"]
authors = ["Redoan"]
+++

# Overview

Attempting to log in as root over SSH may fail with errors such as:

```
Connection closed by authenticating user root [preauth]
pam_unix(sshd:auth): authentication failure
```


Even after enabling:

```
PermitRootLogin yes
```

the login may still fail.

# Root Cause

On Ubuntu systems:

* The root account is locked by default

* Password authentication over SSH is often disabled

Example Check
```
sudo passwd -S root
```

Example Output:
```
root L YYYY-MM-DD 0 99999 7 -1
```

Meaning:

| Flag | Meaning                  |
|------|--------------------------|
| L    | Locked account           |
| P    | Password set (Unlocked)  |


If the account is locked, SSH password authentication will fail even if root login is permitted.

Resolution
Step 1 — Enable Root Login and Password Authentication

Edit SSH configuration:

sudo nano /etc/ssh/sshd_config


Ensure the following lines exist and are not commented:

PermitRootLogin yes
PasswordAuthentication yes
UsePAM yes

Step 1.1 — Check SSH Override Configuration

Some systems override settings using included config files:

sudo nano /etc/ssh/sshd_config.d/*.conf


Verify these files do not override the above settings.

Step 2 — Unlock Root Account and Set Password

Set root password:

sudo passwd root

Step 2.1 — Verify Root Account Status
sudo passwd -S root


Expected Output:

root P YYYY-MM-DD 0 99999 7 -1


P confirms the account is unlocked and password is set.

Step 3 — Restart SSH Service
sudo systemctl restart ssh

Step 4 — Verify Effective SSH Configuration
sshd -T | grep -E 'permitrootlogin|passwordauthentication'


Expected Output:

permitrootlogin yes
passwordauthentication yes

Validation

Test SSH login:

ssh root@server-ip

Security Considerations (Important)

⚠ Enabling root SSH login with password authentication is not recommended for:

Production systems

Internet-facing servers

Recommended Secure Configuration

Use key-based or sudo-based access instead.

PermitRootLogin prohibit-password
PasswordAuthentication no


Recommended workflow:

ssh user@server
sudo -i

Best Practice Recommendations

Use SSH key authentication

Disable password authentication when possible

Restrict root login

Use sudo for privilege escalation

Consider fail2ban or similar protection

Summary
Issue	Cause	Fix
Root SSH login fails	Root account locked	Set root password
PermitRootLogin yes not working	Password auth disabled or root locked	Enable password auth + unlock root
Authentication failure logs	PAM + locked account	Unlock root and verify SSH config