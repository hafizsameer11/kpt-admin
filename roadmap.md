# Kipit admin prototype roadmap

Admin / ops console only. Consumer app lives in `../kipitapp`.

## Built
- ADM-001–003 auth (sign in, two-factor, session lock, access reset)
- ADM-010 Executive dashboard (+ FUM breakdown, maturity tracker, operational alerts)
- ADM-020–025 User management
- ADM-030–035 Compliance & KYC
- ADM-040–041 Global transactions
- ADM-050–052 Withdrawal queue
- ADM-060–064 Product management
- ADM-070–073 Rate management
- ADM-080–081 Plan adjustments
- ADM-090–092 Reconciliation
- ADM-100–105 Marketing
- ADM-110–111 Support
- ADM-120–122 Admin users / roles
- ADM-130 Global audit log
- Ask AI session log

## Routes

Admin URLs are rooted at `/` in this project (e.g. `/users`, `/compliance`) — not under `/admin`.
