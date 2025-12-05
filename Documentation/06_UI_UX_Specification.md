# 06. UI/UX Specification

> **Project**: The Curator (Global News Aggregator)
> **Status**: Draft
> **Last Updated**: 2025-12-01


## 0. Isolation & User Story Mapping

Each workflow (public site, admin portal, scraper, WordPress export) is mapped to a user story and must be independently accessible and testable. UI components should not assume the presence of other modules. All user stories must be supported by independent UI flows.

### 1.2 Color Palette
*   **Primary**: Deep Navy Blue (Professional, Trustworthy).
*   **Secondary**: Gold/Bronze (Premium accent).
*   **Background**: White / Off-White (#FAFAFA).
*   **Text**: Dark Grey (#1A1A1A) for high contrast.

## 2. Public Interface (Wireframes)

### 2.1 Page: Home (`/`)
```text
+---------------------------------------------------------------+
|  [LOGO]  World  Business  Tech  Lifestyle      [EN/繁] (O)  |
+---------------------------------------------------------------+
|                                                               |
|  +--------------------------------+  +---------------------+  |
|  |                                |  | LATEST UPDATES      |  |
|  |   [ HERO IMAGE 800x500 ]       |  |                     |  |
|  |                                |  | 10:05 AM            |  |
|  |                                |  | Market Rally Contin.|  |
|  |   Global Markets Rally As      |  | ------------------- |  |
|  |   Tech Stocks Surge            |  | 09:30 AM            |  |
|  |                                |  | New AI Regulations  |  |
|  |   [Read More ->]               |  | ------------------- |  |
|  |                                |  | 08:15 AM            |  |
|  +--------------------------------+  | Local News Update   |  |
|                                      +---------------------+  |
|                                                               |
|  LATEST STORIES --------------------------------------------  |
|                                                               |
|  +--------------+  +--------------+  +--------------+         |
|  | [Img]        |  | [Img]        |  | [Img]        |         |
|  | BUSINESS     |  | TECH         |  | LIFESTYLE    |         |
|  | Stock Trends |  | New Gadget   |  | Best Cafes   |         |
|  | 2h ago       |  | 4h ago       |  | 6h ago       |         |
|  +--------------+  +--------------+  +--------------+         |
|                                                               |
+---------------------------------------------------------------+
```

### 2.2 Page: Article Detail (`/news/[id]`)
```text
+---------------------------------------------------------------+
|  [LOGO]  World  Business  Tech  Lifestyle      [EN/繁] (O)  |
+---------------------------------------------------------------+
|                                                               |
|   +-------------------------------------------------------+   |
|   |                                                       |   |
|   |           [ FULL WIDTH HEADER IMAGE ]                 |   |
|   |                                                       |   |
|   |   TITLE: Global Markets Rally As Tech Stocks Surge    |   |
|   |                                                       |   |
|   +-------------------------------------------------------+   |
|                                                               |
|       By John Doe  |  2025-12-01  |  Source: Ming Pao         |
|                                                               |
|       (P) Lorem ipsum dolor sit amet, consectetur...          |
|       adipiscing elit. Sed do eiusmod tempor...               |
|                                                               |
|           "This is a pull quote highlighting a            |   |
|            key point from the article."                   |   |
|                                                               |
|       (P) Ut enim ad minim veniam, quis nostrud...            |
|       exercitation ullamco laboris nisi ut aliquip...         |
|                                                               |
+---------------------------------------------------------------+
```

## 3. Admin Portal (Wireframes)

> **Language**: Admin Portal is **Chinese-only**. No multi-language toggle needed.

### 3.1 Page: Dashboard (`/admin`)
```text
+------------------+--------------------------------------------+
|  [ ADMIN ]       |  Welcome back, Super Admin                 |
+------------------+--------------------------------------------+
|                  |                                            |
|  [#] Dashboard   |  +----------+  +----------+  +----------+  |
|                  |  | ARTICLES |  | SCRAPED  |  | ERRORS   |  |
|  [@] Extraction  |  |   1,240  |  |    45    |  |    0     |  |
|                  |  +----------+  +----------+  +----------+  |
|  [=] Articles    |                                            |
|                  |  QUICK ACTIONS --------------------------  |
|  [&] Users       |  [ Trigger Oriental ]  [ Trigger HK01 ]    |
|                  |                                            |
|  [*] Settings    |  RECENT ACTIVITY ------------------------  |
|                  |  | Time  | Source   | Status    | Items |  |
|                  |  |-------|----------|-----------|-------|  |
|  [User Profile]  |  | 10:00 | Oriental | [Success] |   12  |  |
|                  |  | 09:00 | Ming Pao | [Success] |   8   |  |
|                  |  | 08:00 | HK01     | [Failed ] |   0   |  |
+------------------+--------------------------------------------+
```

### 3.2 Page: Content Manager (`/admin/articles`)
```text
+------------------+--------------------------------------------+
|  [ ADMIN ]       |  Articles Management                       |
+------------------+--------------------------------------------+
|                  |                                            |
|  [#] Dashboard   |  [ Search...       ] [Source v] [Date v]   |
|                  |                                            |
|  [@] Extraction  |  | Sts | Title           | Src | AI | Act ||
|                  |  |-----|-----------------|-----|----|-----||
|  [=] Articles    |  | (O) | Global Mkts...  | [M] | [R]| E W ||
|                  |  | (G) | Local Cafe...   | [H] | [-]| E W ||
|  [&] Users       |  | (O) | Tech News...    | [O] | [R]| E W ||
|                  |  | (O) | Politics...     | [M] | [-]| E W ||
|  [*] Settings    |                                            |
|                  |  (O)=Draft (G)=Pub     [M]=Ming [H]=HK01   |
|                  |  [R]=Rewritten         E=Edit W=PushWP     |
+------------------+--------------------------------------------+
```
