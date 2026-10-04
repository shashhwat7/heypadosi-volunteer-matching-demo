# PadosiCast 📡
### Amazon SNS Simulation & Geo-Radius Fan-Out Demonstration Platform

[![Amazon SNS](https://img.shields.io/badge/AWS-Amazon%20SNS-orange.svg)](https://aws.amazon.com/sns/)
[![AWS SDK v3](https://img.shields.io/badge/AWS%20SDK-JavaScript%20v3-232f3e.svg)](https://aws.amazon.com/sdk-for-javascript/)
[![React 18](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet%20%2B%20OpenStreetMap-199900.svg)](https://leafletjs.com/)
[![Uber H3](https://img.shields.io/badge/Spatial-Uber%20H3%20Res%209-7928ca.svg)](https://h3geo.org/)

---

## 1. What is PadosiCast?

**PadosiCast** is an educational cloud messaging demonstration platform built to provide an interactive, visual understanding of **Amazon Simple Notification Service (Amazon SNS)** and modern event-driven fan-out architecture.

In real-world campus and neighborhood communications ("Padosi" meaning neighbor), notifications often need to be published to a centralized broadcast topic, evaluated against recipient preferences (such as urgent security alerts or parcel deliveries), and constrained by geographic delivery bounds.

PadosiCast allows developers, students, and cloud architects to visualize:
1. **SNS Topic Management**: Creation of Standard and FIFO topics with AWS Topic ARNs.
2. **Subscriptions & Handshake**: Email, SMS, and HTTP protocols transitioning from `PendingConfirmation` to `Confirmed`.
3. **Message Attributes & Filter Policies**: SNS server-side JSON filter policies evaluating incoming message attributes.
4. **PadosiCast Geo-Radius Enhancement**: Publisher-owned delivery radius evaluated via **Uber H3 resolution 9** hexagonal candidate selection and exact **Haversine spherical distance**.
5. **Fan-Out Delivery & Auditing**: Real-time delivery to simulated Email Inboxes and SMS mobile phones, backed by deep audit logs.

---

## 2. Real Amazon SNS vs. PadosiCast Enhancement

> [!IMPORTANT]
> **Geo-radius filtering is a PadosiCast enhancement, NOT a native Amazon SNS capability.**
> Amazon SNS does not natively possess awareness of geographical coordinates or spatial distance circles.

| Dimension | Native Amazon SNS | PadosiCast Enhancement |
| :--- | :--- | :--- |
| **Topic Architecture** | Standard topics (best-effort, unlimited throughput) & FIFO topics (strict ordering & deduplication). | Fully supported and visualized with official AWS ARN structure. |
| **Subscription Lifecycle** | Handshake requiring confirmation token before receiving messages (`PendingConfirmation` &rarr; `Confirmed`). | Supported with interactive 1-click token confirmation and status indicators. |
| **Message Attributes** | Key-value pairs (`DataType`: `String`, `Number`, `Binary`) published alongside payloads. | 100% compliant with SNS message attribute standards. |
| **Filter Policies** | JSON expressions (`exact`, `prefix`, `numeric`, `anything-but`, `exists`) evaluated at topic layer. | Evaluated with 100% SNS filter policy algorithmic fidelity. |
| **Spatial Awareness** | **None.** SNS has no spatial or GPS awareness. | **PadosiCast Feature:** Publisher specifies origin coordinates and radius (km). Subscriptions evaluated via H3 Res 9 + Haversine. |
| **Delivery Endpoints** | Dispatches to real telecom carrier networks, SMTP servers, and HTTP endpoints. | Dispatches to interactive simulated Webmail client and Smartphone simulator for zero-cost demos. |

---

## 3. Core Amazon SNS Concepts Demonstrated

```text
Publisher
    ↓
SNS Topic (Standard / FIFO)
    ↓
Confirmed Subscriptions (Pending subscriptions discarded)
    ↓
Amazon SNS Subscription Filter Policy Engine
    ↓
PadosiCast Geo-Radius Eligibility Check (H3 + Haversine)
    ↓
Eligible Subscribers
    ↓
Simultaneous Fan-out Delivery (Email Inbox / SMS Phone)
```

1. **Publish/Subscribe Fan-Out**: Decouples message producers from consumers. One published message fans out simultaneously to multiple disparate endpoints.
2. **Subscription Confirmation**: Unconfirmed subscriptions never receive broadcasts, preventing unauthorized spamming.
3. **Cost & Compute Optimization via Filter Policies**: Unmatched messages are discarded directly by SNS without invoking subscriber endpoints or incurring delivery charges.
4. **Deduplication in FIFO Topics**: FIFO topics enforce exactly-once delivery and strict chronological ordering using deduplication IDs.

---

## 4. AWS Cloud Architecture

```text
React + TypeScript + Tailwind (AWS Console UI)
                  ↓  HTTP / REST
         Amazon API Gateway
                  ↓  Proxy Event
          AWS Lambda Backend
                  ↓  AWS SDK v3 (@aws-sdk/client-sns)
            Amazon SNS Topic
                  ↓  Fan-out / Filter Policies
          Lambda / Application Logic
                  ↓
          Amazon DynamoDB
          (Subscriber locations, filter policies, delivery logs, simulated inboxes)
```

### Security & Privilege Boundary
* **No AWS credentials or secret keys are ever bundled or exposed in the frontend client.**
* All communication with AWS services executes securely on the backend via `@aws-sdk/client-sns` and `@aws-sdk/lib-dynamodb`.

---

## 5. Geo-Radius Filtering: H3 + Haversine Approach

### The Model: Publisher Owns the Radius
In PadosiCast:
* **The publisher/cast defines the delivery radius** (e.g. 1.5 km around Main Gate).
* Subscribers have registered coordinate metadata stored in DynamoDB.
* Subscribers **do not** define their own delivery radius.
* Radii are **never** automatically expanded.

### Algorithmic Execution:
1. **Uber H3 Resolution 9 Indexing**:
   * Latitude and longitude coordinates are converted into an H3 resolution 9 cell index (~105m hex edge length).
   * Nearby candidate subscriber cells are queried via H3 grid disks.
2. **Haversine Spherical Distance Verification**:
   $$\Delta\sigma = 2 \arcsin \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}$$
   $$d = R \cdot \Delta\sigma \quad (R = 6371\text{ km})$$
3. **Eligibility Condition**:
   $$\text{Eligible} \iff (\text{Status} = \text{"Confirmed"}) \land (\text{SNS Filter Matches}) \land (d \le r_{\text{publisher}})$$

---

## 6. Project Structure

```text
e:/awsdemo/
├── server/                      # Backend (Node.js / Express simulating API Gateway + Lambda)
│   ├── types.ts                 # SNS topic, subscription, and log data models
│   ├── geo.ts                   # H3 resolution 9 and Haversine distance calculations
│   ├── snsFilterEvaluator.ts    # Official Amazon SNS Subscription Filter Policy engine
│   ├── awsService.ts            # AWS SDK v3 client + High-fidelity simulation adapter
│   └── index.ts                 # REST API endpoints
├── src/                         # Frontend (React 18 + TypeScript + Vite + Tailwind)
│   ├── components/
│   │   ├── Header.tsx           # AWS Management Console navigation bar
│   │   ├── Dashboard.tsx        # Cloud metrics & visual fan-out pipeline
│   │   ├── TopicsView.tsx       # Standard & FIFO topic manager
│   │   ├── SubscriptionsView.tsx# Endpoints, confirmation status & filter editor
│   │   ├── PublishView.tsx      # Publish wizard with attributes & geo slider
│   │   ├── DeliveryLogsView.tsx # Audit logs with filter & geo skip explanations
│   │   ├── GeoMapView.tsx       # Leaflet interactive map with publisher radius & pins
│   │   ├── EmailInboxView.tsx   # Simulated webmail client for email endpoints
│   │   ├── SmsInboxView.tsx     # Simulated smartphone for SMS endpoints
│   │   └── ArchitectureView.tsx # SNS vs PadosiCast educational guide
│   ├── services/
│   │   └── api.ts               # Backend API communication client
│   ├── types.ts                 # Frontend data types
│   ├── App.tsx                  # Root application router
│   ├── main.tsx                 # React DOM mount point
│   └── index.css                # Tailwind directives & custom AWS styling
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── .env.example
```

---

## 7. Setup & Local Development

### Prerequisites
* **Node.js** (v18+ or v20+ recommended)
* **npm** (v9+)

### Installation
```bash
# Clone or navigate to repository root
cd e:/awsdemo

# Install all dependencies (Frontend, Backend, AWS SDK, Leaflet, H3)
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default contents:
```env
PORT=3001
VITE_API_URL=http://localhost:3001

# AWS Configuration (Optional for offline demo; required for live AWS)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
```

> [!NOTE]
> If AWS credentials are empty, PadosiCast **automatically runs in high-fidelity simulation mode**. You can run the entire classroom demonstration immediately out-of-the-box with zero AWS billing!

### Running the Application
To run both the backend API (port 3001) and frontend dev server (port 5173) concurrently:
```bash
npm run dev
```

Open your browser at:
`http://localhost:5173`

---

## 8. Step-by-Step Demonstration Walkthrough

Follow this sequence to deliver a complete demonstration during an AWS practical or presentation:

### Step 1: Explore Topics
1. Navigate to the **Topics** tab.
2. Observe pre-seeded topics:
   * `campus-alerts` (Standard Topic)
   * `urgent-security.fifo` (FIFO Topic)
3. Click **"Create Topic"** to create a new topic:
   * Select **Standard** or **FIFO**.
   * Enter a topic name (e.g. `hostel-notifications`).
   * Enter a display name for SMS sender identification.

### Step 2: Manage Subscriptions & Filter Policies
1. Navigate to the **Subscriptions** tab.
2. Note the endpoints registered with different protocols:
   * `rahul.sharma@campus.edu` (Email, Confirmed, Filter: `{"category": ["parcel", "food"]}`)
   * `+919876543210` (SMS, Confirmed, Filter: `{"priority": ["urgent"]}`)
   * `ananya.rao@alumni.org` (Email, Confirmed, Filter: None / accepts all)
   * `+919123456780` (SMS, **PendingConfirmation**)
3. Demonstrate subscription confirmation:
   * Click **"Confirm Now"** on any pending subscription to simulate the user token confirmation handshake.
4. Click **"Edit Policy"** to view and modify the JSON filter policy.

### Step 3: Publish a Message with Attributes & Geo-Radius
1. Navigate to the **Publish Message** tab.
2. Select target topic: `campus-alerts`.
3. Click the preset **"Campus Parcel"** demo scenario:
   * Subject: `Campus Parcel Delivery Ready`
   * Attributes: `category = parcel`, `priority = urgent`, `area = campus`
   * Geo-Radius: Checked (`1.5 km` around Campus Gate).
4. Click **"Publish Message"**.
5. Observe the instant **Fan-out Delivery Decisions** breakdown:
   * **Rahul Sharma** (`rahul.sharma@campus.edu`): **Delivered** (Filter matched `category=parcel` AND within 0.4km).
   * **Priya Patel** (`+919876543210`): **Delivered** (Filter matched `priority=urgent` AND within 0.9km).
   * **Vikram Nair** (`vikram.nair@suburb.in`): **Skipped** (Filter matched, but 7.5km away, exceeding 1.5km radius).
   * **Kiran Verma**: **Skipped** if pending confirmation.

### Step 4: Inspect the Geo-Radius Map
1. Navigate to the **Geo-Radius Map** tab.
2. See the publisher marker at the center with a glowing orange delivery perimeter circle.
3. Observe subscriber pins:
   * 🟢 **Green**: Confirmed subscriber inside delivery radius.
   * ⚪ **Gray**: Subscriber located outside the delivery radius.
   * 🟡 **Amber**: Subscription pending confirmation.
4. Drag the slider to expand the radius (e.g. to 8 km) or click anywhere on the map to change the publisher location.

### Step 5: Verify Deliveries in Simulated Inboxes
1. Navigate to **Email Inbox**:
   * Open the delivered message to Rahul Sharma.
   * Note the realistic AWS SNS email headers (`From: "Campus Community Alerts" <no-reply@sns.amazonaws.com>`), attached SNS attributes, and unsubscribe notice.
2. Navigate to **SMS Phone**:
   * Select Priya Patel's phone (`+919876543210`).
   * View the message rendered inside the realistic smartphone messaging interface.

### Step 6: Review Audit Delivery Logs
1. Navigate to **Delivery Logs**.
2. Filter by status (`Delivered`, `Skipped`, `Failed`).
3. Click **"Inspect"** on any row to open the complete JSON audit drawer detailing the filter policy match evaluation and Haversine distance equation.

---

## 9. Connecting to Real Amazon SNS

To connect PadosiCast to your live AWS account:
1. Provide AWS credentials in `.env`:
   ```env
   AWS_REGION=ap-south-1
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   ```
2. Ensure your IAM user has the following permissions:
   * `sns:CreateTopic`
   * `sns:ListTopics`
   * `sns:GetTopicAttributes`
   * `sns:Subscribe`
   * `sns:Publish`
3. Restart the server with `npm run dev`.
4. The top header badge will change to 🟢 **Real AWS SDK Active**.

---

## 10. License & Attribution
PadosiCast is built for educational demonstrations and university cloud engineering labs.
Released under the MIT License.
