# Next-Grocery Project Flowchart

This flowchart visualizes the high-level architecture of your Next.js e-commerce application. It demonstrates the flow of data across the different layers of your application architecture: from the frontend components and state providers to the server logic (Next.js API Routes and specialized library utilities) down to your database models.

```mermaid
graph TD
    %% User Endpoints
    Shopper(("🛍️ Shopper (Client)"))
    SysAdmin(("⚙️ Admin (Client)"))

    %% Subgraphs for separation of concerns
    subgraph Frontend["Frontend Client (src/app, src/components)"]
        UI["Public Storefront Pages (Home, Checkout, Offers)"]
        GlobalState["Context Providers (Cart, Wishlist, Auth)"]
        Comps["Reusable UI (Nav, Product Cards, Maps)"]
        AI_Widget["AI Components (Floating Chat, AI Assistant)"]
        AdminApp["Admin Dashboard Pages"]
    end

    subgraph InternalDeps["Internal Logic & State (src/context, src/lib)"]
        AuthProv["AuthProvider & NextAuth Session"]
    end

    subgraph API_Layer["Next.js Server API Layer (src/app/api)"]
        AuthAPI["/api/auth (Login/Register/Session)"]
        UserAPI["/api/products, /api/orders, /api/payments"]
        GeoAPI["/api/geocode & /api/delivery"]
        AI_API["/api/ai (Chat Endpoints)"]
        AdminAPI["/api/admin (Stats, Manage DB)"]
    end

    subgraph Services["Server Libs (src/lib)"]
        DBConn["Database Connector (mongodb.ts)"]
        MailService["Email Service (email.ts)"]
        HelperLibs["Utils (imageUtils.ts, actions.ts)"]
    end

    subgraph DataTier["MongoDB (src/models)"]
        UserDB[("User Model")]
        ProductDB[("Product & Category Model")]
        OrderDB[("Order Model")]
        MarketingDB[("News, HeroSlide, Coupon")]
    end

    %% Paths & Interactivity
    Shopper -->|Browses Site| UI
    SysAdmin -->|Manages Store| AdminApp
    Shopper -->|Interacts| AI_Widget

    UI --> GlobalState
    UI --> Comps
    AdminApp --> GlobalState

    %% Next Auth / Context Flow
    GlobalState --> AuthProv

    %% Request flows
    UI -.->|Fetches/Submits Data| UserAPI
    UI -.->|Maps/Location Requests| GeoAPI
    AI_Widget -.->|Generates Prompts| AI_API
    AuthProv -.->|Authenticates| AuthAPI
    AdminApp -.->|Privileged Actions| AdminAPI

    %% API to Services
    AuthAPI --> DBConn
    UserAPI --> DBConn
    GeoAPI --> DBConn
    AdminAPI --> DBConn
    AdminAPI --> HelperLibs
    UserAPI --> MailService

    %% Services to DB
    DBConn ==> UserDB
    DBConn ==> ProductDB
    DBConn ==> OrderDB
    DBConn ==> MarketingDB

    %% Style definitions
    classDef clientApp fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0f172a;
    classDef serverApi fill:#fce7f3,stroke:#db2777,stroke-width:2px,color:#0f172a;
    classDef database fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#0f172a;
    classDef defaultActor fill:#f3f4f6,stroke:#6b7280;

    class Frontend,InternalDeps clientApp;
    class API_Layer,Services serverApi;
    class DataTier database;
```

### Flowchart Breakdown

1. **Frontend Client**: Shows the separation between the standard shopping interface (`Public Storefront Pages`) and the `Admin Dashboard`. It utilizes contexts for state management, mapping components, and interactive AI widgets. Data visually flows into context providers.
2. **Server API Layer**: Divides into your public/user APIs, admin-only routes, authentication endpoints, and specific utility endpoints like Geo/Map lookup and AI Chat generation.
3. **Server Libraries**: Illustrates the underlying library files (`src/lib`) acting as a bridge. For instance, the DB connection utility, image handlers, and the email dispatcher service.
4. **Data Tier (MongoDB)**: Represents your schema and modeling abstractions from `src/models`, maintaining strict structures for records like Orders, Users, Products, and other application settings.
