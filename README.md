# Trade-Enabling Climate & Compliance Oracle Subsystem (v3.0)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Schema: trade-hazard-oracle/1.0](https://img.shields.io/badge/Schema-trade--hazard--oracle%2F1.0-emerald.svg)](AGENTS.md)

> **Physical Climate, EUDR Deforestation & Supply-Chain Disruption Oracle Subsystem**  
> Designed to feed **EUDR**, **Minerals Oracle**, and global trade/logistics systems alongside the sibling `global-earthquake` seismic subsystem.

---

## Overview

This subsystem evaluates physical climate hazards (heatwaves, flood/precipitation spikes, drought), multi-source BFT oracle consensus, and EUDR deforestation-free polygon compliance for arbitrary geospatial coordinates (`lat`, `lng`) and multi-waypoint trade routes.

Instead of operating standalone futures trading or insurance underwriting, it outputs standardized trade clearance decisions (`CLEAR | CAUTION | REROUTE | HOLD_COMPLIANCE`) with cryptographic proof digests.

---

## Quick Start

```bash
pip install -r backend/requirements.txt
python run.py
```

- **Swagger UI**: `http://localhost:8500/docs`
- **Health Check**: `GET /health`

---

## Core API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/trade-oracle/schema` | Unified `trade-hazard-oracle/1.0` contract shared with `global-earthquake` |
| `GET` | `/api/trade-oracle/presets` | Global Minerals Oracle mines, maritime corridors, and EUDR polygons |
| `POST` | `/api/trade-oracle/assess` | Single asset / polygon climate & EUDR assessment |
| `POST` | `/api/trade-oracle/assess-route` | End-to-end multi-waypoint supply chain route assessment |
| `POST` | `/api/security/eudr/audit` | Direct EUDR deforestation-free polygon compliance audit |
| `GET` | `/api/security-gate/status` | BFT consensus, circuit breaker & audit log telemetry |
| `POST` | `/api/billing/session` | Multi-chain USDC API / Audit Pack billing session |

---

## Testing

```bash
python -m pytest backend/tests/test_trade_oracle.py -v
```

---

## License

MIT License — see [LICENSE](LICENSE).
