# DNS cutover for lomviko.com mail

Change the VPS reverse DNS (PTR) first:

```text
185.25.117.161 -> mail.lomviko.com
```

The forward record must continue to resolve in the other direction:

```text
mail.lomviko.com -> 185.25.117.161
```

Publish these DNS records after PTR has propagated. In ADM.tools, use `@` for the root domain. A trailing dot in a target is optional if the panel adds it automatically.

| Subdomain | Type | Priority | Value |
| --- | --- | ---: | --- |
| `mail` | A |  | `185.25.117.161` |
| `webmail` | A |  | `185.25.117.161` |
| `mail-admin` | A |  | `185.25.117.161` |
| `@` | MX | `10` | `mail.lomviko.com.` |
| `@` | TXT |  | `v=spf1 mx -all` |
| `mail` | TXT |  | `v=spf1 a -all` |
| `v1-ed25519-20261015._domainkey` | TXT |  | `v=DKIM1; k=ed25519; h=sha256; p=jhooDtaMhQfXduryX0kTJbOR7TV0J9i9UzzfKHgpyfU=` |
| `v1-rsa-20261015._domainkey` | TXT |  | `v=DKIM1; k=rsa; h=sha256; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyaPORTEaaqM4JJ7z4RcbwKhk9l7jyui/vy4H0RRWrlI3YczzjB98U8WA/Jt+qF/a8ZSlG0ntYSAbmWUsMTscv82h8wQH2lqfrSyb6O1gqIRENalNs6EGbxJi0nuSdqM96m0pyxyOOA5Wk5V6+fkQADJquwkjOQbwDiDkVKOda7l87cpEK7ZXg2qKb/qMu6FaI6g7L4gPApBSWeG40lyIt1YbPEnxgoUXHfg7sm4ftkyHpEfqefDUkN3K/U0FQpHc4D0TM7/UVUUerECqZ1OX00cRgemVxKb5MfxQoh7VCJF0FebVI7HlNEJHDi25wEgZYvjWxkwI0hLtzuO0ipfjDQIDAQAB` |
| `_dmarc` | TXT |  | `v=DMARC1; p=none; rua=mailto:postmaster@lomviko.com; adkim=s; aspf=s; fo=1; pct=100` |
| `_imaps._tcp` | SRV | `0` | `1 993 mail.lomviko.com.` |
| `_submission._tcp` | SRV | `0` | `1 587 mail.lomviko.com.` |
| `_submissions._tcp` | SRV | `0` | `1 465 mail.lomviko.com.` |
| `autoconfig` | CNAME |  | `mail.lomviko.com.` |
| `autodiscover` | CNAME |  | `mail.lomviko.com.` |
| `ua-auto-config` | CNAME |  | `mail.lomviko.com.` |
| `_ua-auto-config` | TXT |  | `v=UAAC1; a=sha256; d=xj3UkFhdUotpHR0CFKy+z+E414qQ/xpOfV+FGDuoYPE=` |
| `mta-sts` | CNAME |  | `mail.lomviko.com.` |
| `_mta-sts` | TXT |  | `v=STSv1; id=574297639447157272` |
| `_smtp._tls` | TXT |  | `v=TLSRPTv1; rua=mailto:postmaster@lomviko.com` |

Replace the existing root MX record `0 mx.services.` and the existing root SPF record `v=spf1 include:_spf.ukraine.com.ua ~all`; do not leave two SPF records at the root.

DMARC starts in monitoring mode (`p=none`). After real delivery tests pass and reports stay clean, change it to `p=quarantine`, then `p=reject`.
