# Smart Warehouse  Opertations & Order Filfillment System

Build a complete, polished, hackathon-ready web application called WAREMIND — Smart Warehouse Decision & Operations Platform.

1. PRODUCT VISION
WAREMIND is not a basic CRUD warehouse management system. It is an intelligent warehouse operations platform that acts as a decision-making co-pilot for warehouse managers and teams. The core idea: "Don't just show what is happening in the warehouse. Decide what should happen next, explain why, and help the team execute the decision." The application must simulate a realistic warehouse using mock/sample data. No real-world APIs or external warehouse integrations are required. The application should feel like a real SaaS product built for a professional warehouse operation and should be polished enough for a hackathon demonstration.

2. CORE WORKFLOW
Implement the complete order fulfillment lifecycle: Order Created → Priority Determined → Inventory Checked → Inventory Allocated → Picking → Packing → Quality Check → Dispatch → Inventory Updated. Every stage should update the relevant order, inventory, and operational metrics.

Also implement the core pattern: Exception → Decision → Resolution. Whenever something goes wrong, the system should not merely display an error. It should: 1. Detect the exception. 2. Explain the problem. 3. Recommend a decision. 4. Allow the user to apply the recommendation. 5. Update the warehouse state. 6. Mark the exception as resolved.

3. TECHNOLOGY / IMPLEMENTATION
Build a responsive modern web application using React, TypeScript, Tailwind CSS, modern component architecture, reusable UI components, mock/sample warehouse data, local state or a suitable lightweight data layer, charts and visual analytics, responsive design for desktop, tablet, and mobile. Do NOT depend on real warehouse APIs. The application must work immediately using realistic mock data. Do not create a static prototype where buttons do nothing. Important interactions should actually modify application state.

4. DESIGN DIRECTION
Create a premium modern warehouse command-center / operations control room aesthetic. Use: dark professional dashboard, clean typography, subtle gradients, glass/soft-card effects where appropriate, high-quality icons, clear status badges, smooth micro-interactions, professional charts, excellent spacing, responsive layouts, minimal visual clutter. Use status colors intelligently: Red = Critical/danger, Orange = Warning, Yellow = At risk, Green = Healthy/completed, Blue = Information/active. Avoid making it look like a generic admin template. The UI should feel like a modern enterprise SaaS product.

5. GLOBAL NAVIGATION
Create a left sidebar with: WAREMIND logo, Dashboard, Orders, Inventory, Allocation, Picking, Packing, Dispatch, Exceptions, Analytics, What-If Simulator, AI Assistant, Settings. The sidebar should be collapsible. On mobile, convert it into a responsive navigation drawer.

6. MAIN DASHBOARD — WAREHOUSE DECISION CENTER
Header: "Good Evening, Manager 👋". Subtitle: "Warehouse Decision Center". Show high-level warehouse health cards: Inventory Health, Total Orders, Orders At Risk, Pending Picking, Pending Packing, Ready for Dispatch, Fulfillment Rate, Active Exceptions. Example mock data: Inventory Health: 92%, Orders Today: 124, Orders At Risk: 7, Pending Picking: 38, Pending Packing: 21, Ready to Dispatch: 14, Fulfillment Rate: 91%, Active Exceptions: 3. Use animated counters where appropriate.

7. CRITICAL EXCEPTIONS SECTION
Create a highly visible "CRITICAL EXCEPTIONS" section. Example: Order #1042 — Stock Shortage, Priority: HIGH, Required: 10 units, Available: 7 units, Shortage: 3 units, Dispatch deadline: 2 hours. Show an AI-style recommendation card: RECOMMENDED ACTION: "Allocate all 7 available units to Order #1042, place the remaining 3 units on backorder, and trigger replenishment." Reason: "Order #1042 has a higher priority and an earlier dispatch deadline than competing orders." Buttons: APPLY RECOMMENDATION, VIEW ALTERNATIVES, DISMISS. When APPLY RECOMMENDATION is clicked: allocate available inventory, update inventory quantity, move Order #1042 to appropriate status, create replenishment request, update affected lower-priority orders, resolve the exception, add an entry to the decision history. Show a success notification.

8. INTELLIGENT ORDER PRIORITY ENGINE
Orders must NOT simply have manually assigned priorities. Create a decision engine that calculates a priority score from: Customer Priority, Delivery Urgency, Dispatch Deadline, Order Age, Inventory Availability. Normalize the score between 0 and 100. Example: Order #1042 → 94 → Critical; Order #1038 → 61 → Medium; Order #1045 → 32 → Low. Display priority score, priority level, and reason for score, e.g. Order #1042, Priority Score: 94, HIGH PRIORITY, Reason: Premium customer, Dispatch deadline approaching, Limited inventory, High urgency. Allow the Orders page to sort automatically by intelligent priority.

9. SMART INVENTORY ALLOCATION ENGINE
When multiple orders require the same limited inventory, the system should intelligently decide how to allocate stock. Example: Product A stock = 7; Order #1042 requires 10 → HIGH; Order #1043 requires 5 → MEDIUM; Order #1044 requires 2 → LOW. The system should recommend: Order #1042 → Allocate 7, Order #1043 → Allocate 0, Order #1044 → Allocate 0. Then: Order #1042 becomes partially fulfilled/picking-ready according to workflow, Order #1043 waits for stock, Order #1044 waits for stock, Replenishment is triggered. Show the reasoning clearly. Create an Allocation page containing: Available stock, Requested quantity, Allocated quantity, Shortage, Priority, Allocation score, Recommended action, Apply allocation button. Include an allocation history.

10. "WHAT SHOULD I DO?" FEATURE
Every important exception should have a prominent button: "🤖 WHAT SHOULD I DO?". When clicked, show a decision panel. Example: Problem: "Product SKU-109 has insufficient inventory for all pending orders." Recommendation: "Allocate available stock to the highest-priority order and delay lower-priority orders." Reason: "This minimizes the number of high-impact delayed shipments." Alternative options: 1. Maximize urgent orders, 2. Maximize number of orders completed, 3. Maximize premium customer fulfillment. Show the predicted impact of each option. Allow the manager to select and apply one.

11. EXCEPTION → DECISION → RESOLUTION TIMELINE
Create a visual timeline for every major exception, e.g. EXCEPTION: Stock shortage detected → DECISION: Allocate 7 units to high-priority Order #1042 → RESOLUTION: 7 units allocated, 3 units backordered, Replenishment triggered → STATUS: Exception Resolved. Display timestamps and responsible user/system. Create a Decision History page showing previous automated recommendations and applied decisions.

12. SMART REORDER INTELLIGENCE
Create intelligent reorder recommendations, not just "low stock". For each product calculate: Current Stock, Average Daily Demand, Estimated Days of Stock Remaining, Reorder Threshold, Incoming Stock, Supplier Lead Time, Recommended Reorder Quantity. Example: SKU-204, Current Stock: 18, Average Daily Demand: 12, Days Remaining: 1.5, Incoming Stock: 0, Status: REORDER NOW, Recommendation: Order 60 units, Reason: "Current inventory is insufficient to cover projected demand during the expected replenishment period." Create a Reorder Recommendations section.

13. SMART PICKING OPTIMIZATION
Create a Picking module showing: Orders waiting for picking, Picker assignments, Product locations, Quantity, Picking status, Estimated time. Create a mock warehouse grid with zones Zone A, Zone B, Zone C, example locations A-01, A-05, B-03, B-10, C-02. When multiple products need to be picked, generate an optimized picking sequence, e.g. 1. A-01, 2. A-05, 3. B-03, 4. B-10, 5. C-02. Show: Previous estimated distance: 237m, Optimized distance: 142m, Optimization: 40% reduction. Provide an OPTIMIZE ROUTE button; when clicked, recalculate the route and update the UI.

14. PICKER DASHBOARD
Create a dedicated picker view showing: Assigned orders, Current task, Picking progress, Product, Quantity, Warehouse location, Optimized route, Estimated completion time. Allow picker to mark items: Picked, Missing, Damaged. When an item is marked missing or damaged, automatically create an exception.

15. PACKING MODULE
Create a Packing dashboard showing orders waiting for packing. Each order should display: Order ID, Items, Quantity, Packing status, Assigned packer, Priority, QC status. Workflow: Picking Complete → Packing → Quality Check → Ready for Dispatch. Allow users to mark packing complete.

16. QUALITY CHECK
Before dispatch, implement a Quality Check step checking: Correct items, Correct quantity, Damaged items, Packaging condition. Allow PASS/FAIL. If FAIL: automatically create an exception and recommend a resolution, e.g. "Damaged item detected." Recommendation: "Replace damaged item from available stock and repeat quality check."

17. DAMAGED / MISSING ITEM HANDLING
Create a dedicated exception workflow. Missing Item: system checks inventory records, previous allocation, picking status, then recommends "Reallocate replacement inventory." Damaged Item: system recommends "Replace item and move damaged item to quarantine inventory." Create statuses: Reported, Investigating, Action Recommended, Resolved.

18. DISPATCH TRACKING
Create a Dispatch module showing: Ready to Dispatch, Dispatch deadline, Priority, Package status, Dispatch status. Statuses: Ready, Packed, QC Passed, Dispatched, Delayed. Create a dispatch timeline. When an order is dispatched: update order status, update inventory, update fulfillment metrics, add activity log.

19. BOTTLENECK DETECTION
Create an Analytics page with a "BOTTLENECK DETECTOR" section that automatically detects operational bottlenecks (not just charts). Example: Zone C Picking Bottleneck, 18 orders waiting, Average processing time: 18 min/order, Expected: 10 min/order, System recommendation: "Assign one additional picker to Zone C." Button: APPLY RECOMMENDATION. Other possible bottlenecks: Packing queue, Inventory shortage, QC delays, Dispatch delays, Picker overload.

20. ANALYTICS DASHBOARD
Create professional visual analytics including: Orders per hour, Fulfillment rate, Average picking time, Average packing time, Dispatch performance, Inventory turnover, Stockout frequency, Exception frequency, Order priority distribution, Warehouse zone workload. Use charts and graphs. Include date/time filters. Add an "OPERATIONAL INSIGHTS" section, e.g. "Picking is currently the largest bottleneck.", "Zone C has 42% of pending picking tasks.", "8% of orders are currently at risk of missing dispatch deadlines.", "SKU-204 is likely to stock out within 2 days."

21. WHAT-IF SIMULATOR
Create a page called "WHAT-IF SIMULATOR" allowing the manager to simulate operational decisions without permanently changing the real warehouse state. Scenario 1: "What happens if Product A becomes out of stock?" — show Orders affected, High-priority orders affected, Expected delays, Recommended action. Scenario 2: "What happens if we prioritize premium customers?" — compare CURRENT: 96 fulfilled, 8 delayed vs SIMULATED: 99 premium orders fulfilled, 5 normal orders delayed. Scenario 3: "What happens if we assign one more picker to Zone C?" — show predicted Picking time ↓, Orders processed ↑, Bottleneck risk ↓. Display results using before/after cards and charts. Add a RUN SIMULATION button. Important: simulation must not modify actual warehouse state.

22. AI WAREHOUSE ASSISTANT
Create a warehouse-specific AI assistant, not a generic chatbot. It should answer questions using the application's mock warehouse data. Example questions: "What orders are at risk?", "Which product will stock out first?", "Why is Zone C slow?", "What should I prioritize right now?", "Which orders should receive the available stock?", "Why was Order #1042 prioritized?" Responses should contain: Clear answer, Relevant data, Reasoning, Recommended action. Example: User: "Which orders are at risk?" Assistant: "4 orders are currently at risk. Order #1042 is the highest priority because only 7 of 10 required units are available and its dispatch deadline is in 2 hours. Recommended action: Allocate available inventory and trigger replenishment." Provide suggested question chips such as: Orders at Risk, Stockout Risks, Current Bottleneck, Recommended Actions, Today's Priorities.

23. ROLE-BASED EXPERIENCE
Create role selection / mock authentication. Roles: Warehouse Manager (access: everything), Picker (access: picking tasks, route optimization, item exceptions), Packer (access: packing and quality check), Dispatch Operator (access: dispatch queue and tracking). The dashboard should adapt based on the selected role. Mock authentication is sufficient.

24. ORDER MANAGEMENT PAGE
Create a professional order table with columns: Order ID, Customer, Priority, Priority Score, Items, Total Quantity, Status, Dispatch Deadline, Risk, Recommended Action. Filters: All, Critical, High, Medium, Low, At Risk, Delayed, Ready to Pick, Picking, Packing, QC, Ready to Dispatch, Dispatched. Clicking an order should open a detailed order page.

25. ORDER DETAIL PAGE
Show: Order ID, Customer, Priority Score, Items, Inventory allocation, Picking status, Packing status, Quality check, Dispatch, Timeline, Exceptions, Decision history, AI recommendation. Create a visual fulfillment timeline: Created → Prioritized → Allocated → Picking → Packing → QC → Dispatch.

26. INVENTORY PAGE
Create a professional inventory table with columns: SKU, Product, Category, Warehouse Zone, Current Stock, Reserved, Available, Daily Demand, Days Remaining, Reorder Status, Risk. Use status indicators: Healthy, Low, Critical, Out of Stock. Create search and filters.

27. NOTIFICATION CENTER
Create notifications for: Low stock, Stockout, Order at risk, Picking bottleneck, Damaged item, Missing item, QC failure, Dispatch deadline approaching, Reorder recommendation. Use realistic mock notifications.

28. ACTIVITY / DECISION LOG
Create an activity feed, e.g. "AI allocated 7 units of SKU-109 to Order #1042.", "Picker reported missing item SKU-204.", "Replenishment recommendation created for SKU-204.", "Order #1042 moved to Picking.", "Zone C bottleneck detected." This makes the system feel like a real operational product.

29. HACKATHON DEMO SCENARIO
Preload the application with a special demo scenario: Product A, Stock: 7. Order #1042, Required: 10, Priority: HIGH, Dispatch deadline: 2 hours. Order #1043, Required: 5, Priority: MEDIUM, Dispatch deadline: 8 hours. Order #1044, Required: 2, Priority: LOW, Dispatch deadline: Tomorrow. When the dashboard loads, immediately show "CRITICAL INVENTORY CONFLICT", then show: Available stock: 7, Total demand: 17. System recommendation: "Allocate all 7 units to Order #1042 because it has the highest operational priority. Hold lower-priority orders and trigger replenishment." This should be the main hackathon demonstration.

30. IMPORTANT: REAL INTERACTIONS
Do NOT create fake buttons. These interactions must work: Apply recommendation, Allocate inventory, Change order status, Optimize picking route, Mark item picked, Report damaged item, Report missing item, Pass/fail QC, Dispatch order, Trigger reorder, Resolve exception, Run simulation, Change roles, Search/filter orders, Open order details, View decision history. When actions occur, update the relevant mock data across the application. E.g. if 7 units are allocated, inventory available quantity must actually decrease; if an order is dispatched, the order status must change and analytics must update; if an item is damaged, an exception must appear.

31. DATA MODEL
Create realistic mock entities: Users, Products, Inventory, Orders, OrderItems, WarehouseLocations, PickTasks, PackTasks, QualityChecks, Dispatches, Exceptions, Recommendations, DecisionLogs, Notifications. Use at least 20 products, 15+ orders, multiple warehouse zones, different priorities, some low-stock products, some out-of-stock products, some damaged/missing scenarios, some delayed orders, some completed orders. Make the data rich enough that the dashboard looks realistic.

32. EMPTY / LOADING / ERROR STATES
Every major page should have polished loading state, empty state, error state, success notification, and confirmation dialog where needed. Do not leave blank screens.

33. RESPONSIVE DESIGN
The application must work well on desktop, laptop, tablet, and mobile. On smaller screens: sidebar becomes drawer, tables become scrollable or card-based, dashboard cards stack, charts resize, buttons remain accessible.

34. UX PRINCIPLE
Always answer three questions for the warehouse manager: WHAT IS HAPPENING? (show current operational status), WHY IS IT HAPPENING? (show the reason/contributing factors), WHAT SHOULD I DO? (provide a recommendation and actionable button). This should be the central UX philosophy throughout the entire application.

35. BRANDING
Product name: WAREMIND. Tagline: "The decision engine for smarter warehouse operations." Create a professional logo/icon concept based around warehouse + intelligence + connected operations. Use the WAREMIND branding consistently throughout the application.

36. FINAL QUALITY REQUIREMENT
This is for a competitive hackathon. Do not make it look like a simple student CRUD project. Prioritize: 1. Decision-making, 2. Smart inventory allocation, 3. Exception handling, 4. Workflow automation, 5. Picking optimization, 6. Bottleneck detection, 7. What-if simulation, 8. Professional UI/UX, 9. Realistic mock data, 10. Fast, smooth interactions. The final product should communicate: "WAREMIND doesn't just manage warehouse data. It continuously analyzes warehouse conditions, identifies operational risks, recommends the best next action, and helps warehouse teams execute that decision." Build the application completely and make the main dashboard and demo scenario polished enough to be presented directly to hackathon judges.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://waremind-decision-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9226eb4e-dcb3-4acf-ae27-b7b47e328f36).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
