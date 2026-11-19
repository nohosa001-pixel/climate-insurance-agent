# Trade-Enabling Climate & Compliance Oracle Subsystem

> **Role:** Physical Climate, EUDR Deforestation & Supply-Chain Disruption Oracle Subsystem  
> **Sibling Subsystem:** `global-earthquake` (Seismic Hazard Oracle)  
> **Primary Consumers:** EUDR Compliance Engine, Minerals Oracle, Trade Finance & Maritime Logistics  
> **Unified Schema:** `trade-hazard-oracle/1.0`

---

## System Identity

This subsystem provides verified physical climate risk, drought/flood/heatwave disruption scoring, and EUDR deforestation-free polygon audits so external trade systems can clear, caution, reroute, or hold shipments without managing insurance underwriting or futures trading directly.

---

## Trade Oracle API Specification

### 1. Unified Trade Hazard Schema
- **Method:** `GET`
- **Endpoint:** `/api/trade-oracle/schema`
- **Purpose:** Returns the standardized `trade-hazard-oracle/1.0` contract shared with `global-earthquake` (`trade_actions`: `CLEAR | CAUTION | REROUTE | HOLD_COMPLIANCE`).

### 2. Global Trade Hub Presets
- **Method:** `GET`
- **Endpoint:** `/api/trade-oracle/presets`
- **Purpose:** Returns pre-configured Minerals Oracle mines (Atacama Lithium, Morowali Nickel, Cerro Verde Copper), maritime corridors (Panama Canal, Santos), and EUDR agricultural polygons.

### 3. Single Asset / Polygon Risk Assessment
- **Method:** `POST`
- **Endpoint:** `/api/trade-oracle/assess`
- **Payload:**
```json
{
  "asset_id": "MINE-ID-MOROWALI",
  "lat": -2.82,
  "lng": 122.15,
  "asset_type": "MINE",
  "commodity": "NICKEL",
  "region_id": "SE_ASIA_SULAWESI",
  "canopy_loss_pct": 0.3,
  "use_live_feed": true
}
```

### 4. End-to-End Trade Route Assessment
- **Method:** `POST`
- **Endpoint:** `/api/trade-oracle/assess-route`
- **Payload:**
```json
{
  "waypoints": [
    {"asset_id": "MINE-CL-ATACAMA", "lat": -23.5, "lng": -68.25, "asset_type": "MINE", "commodity": "LITHIUM"},
    {"asset_id": "PORT-PA-PANAMA", "lat": 9.1, "lng": -79.92, "asset_type": "PORT", "commodity": "MARITIME_CORRIDOR"}
  ],
  "use_live_feed": true
}
```

### 5. EUDR Deforestation-Free Polygon Audit & Billing
- `POST /api/security/eudr/audit` — Direct EUDR polygon compliance check
- `POST /api/billing/session` — Multi-chain USDC API / Audit Pack billing

---

## License
MIT License.
