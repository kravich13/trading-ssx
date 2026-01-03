# Trading Statistics (SSX)

Local project for trading statistics management.

## Table of Contents
- [Trading Statistics (SSX)](#trading-statistics-ssx)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
    - [Core Logic](#core-logic)
  - [Trading Logic \& Examples](#trading-logic--examples)
    - [Example: 3 Participants (You + 2 Investors)](#example-3-participants-you--2-investors)
      - [1. Capital Distribution (The "100%" Base)](#1-capital-distribution-the-100-base)
      - [2. Deposit Distribution (Actual Funds)](#2-deposit-distribution-actual-funds)
      - [3. Execution](#3-execution)
    - [Dynamic Changes](#dynamic-changes)
  - [Development Progress (TODO)](#development-progress-todo)
  - [Technologies](#technologies)
  - [Installation](#installation)
  - [Development](#development)
  - [Project Structure](#project-structure)

## Project Overview

This tool is designed for a trader managing combined capital from multiple investors and their own funds. It distinguishes between two key concepts:
- **Capital**: The notional amount used for calculating position sizes and risk management.
- **Deposit**: The actual funds available on exchange accounts.

### Core Logic
- **Position Sizing**: Based on the total **Capital** of all participants.
- **Leverage**: Used to execute trades as if the total Capital were fully deposited on the exchange.
- **Risk Management**: Standard risk per trade is 0.5-2% of the total Capital.
- **Flexibility**: Investors can adjust their Capital and Deposit independently. Changes in these values dynamically affect future position sizes.

## Trading Logic & Examples

This project implements a mathematical model for managing shared risk.

### Example: 3 Participants (You + 2 Investors)

#### 1. Capital Distribution (The "100%" Base)
The total notional capital is **$10,000**.

| Participant | Notional Capital | % of Total |
|-------------|------------------|------------|
| You (Me)    | $5,000           | 50%        |
| Investor A  | $2,000           | 20%        |
| Investor B  | $3,000           | 30%        |
| **Total**   | **$10,000**      | **100%**   |

#### 2. Deposit Distribution (Actual Funds)
The total amount of money actually sent to the exchange is **$3,500**.

| Participant | Actual Deposit |
|-------------|----------------|
| You (Me)    | $2,000         |
| Investor A  | $500           |
| Investor B  | $1,000         |
| **Total**   | **$3,500**     |

#### 3. Execution
When taking a trade with **1% risk** on capital ($100), you use the **$3,500** actual deposit with leverage to open a position size scaled to the **$10,000** total capital.

### Dynamic Changes
- **Adding Capital (No Deposit)**: If an investor increases their capital (e.g., $2k -> $4k), the total capital grows ($12k). Future position sizes increase, and leverage on the existing $3.5k deposit increases.
- **Adding Deposit (No Capital)**: If an investor adds funds to the exchange but keeps their capital the same, the position sizes remain identical, but the account safety (margin) improves as leverage decreases.

## Development Progress (TODO)

- [x] **1. Database & Infrastructure**
  - [x] Install dependencies (`better-sqlite3`, `sass`)
  - [x] Design SQLite schema (Investors, Ledger for trades and balance changes)
  - [x] Implement database connection utility
- [x] **2. Management Screen**
  - [x] Add/Delete investors
  - [x] Update individual investor Capital/Deposit (row-by-row logic)
  - [x] Display change history in investor's personal table
- [x] **3. Main Dashboard**
  - [x] Header with Total Capital and Total Deposit (sum of all investors)
  - [x] Table of all investors with their current Capital and Deposit
- [ ] **4. Trading Logs**
  - [x] Investor Detail View: List of all trades + capital changes (as shown in Excel)
  - [x] Total Trades View: Global log of all trading activity across the project
  - [x] Statistics Dashboard (above Total Trades):
    - Trade counts (Total, Positive, Negative)
    - Profit/Loss metrics (Total Profit, Total Loss, P/L Correlation, Reward Ratio)
    - Averages (USD and % of depo for both P and L)
    - Streaks & Extremes (Max Profit/Loss, Max Win/Loss series)
    - Accuracy (Win Rate %)
  - [ ] Visual Analytics (on Total Trades screen):
    - **Equity Curve Chart**: Capital growth based strictly on trade results (ignoring manual capital changes)
    - **Galton Board (Histogram)**: Dynamic distribution of trade returns (PL%)
- [ ] **5. Core Logic Implementation**
  - [ ] Calculation of position sizes based on total capital
  - [ ] Row-by-row balance updates (changes only affect future rows)
- [ ] **6. Trade Entry**
  - [ ] Screen to add a new trade with all Excel parameters (Ticker, PL%, PL$, Closed Date, Default Risk%)
  - [ ] Show total capital of all copy-traders when adding a trade
  - [ ] Automated calculation of trade impact on each investor's balance

## Technologies

- **Next.js 16.1.1** - React framework with App Router
- **Architecture: FSD (Feature-Sliced Design)** - Project organization
- **React 19.2.3** - UI library
- **TypeScript 5** - type safety
- **SQLite (better-sqlite3)** - local file-based database
- **SCSS (Sass)** - CSS preprocessor
- **Yarn 4.12.0** - package manager

## Installation

```bash
yarn install
```

## Development

```bash
yarn dev
```

Open [http://localhost:7777](http://localhost:7777) in your browser.

## Project Structure

- `app/` - Next.js App Router (Routing and Page entry points)
- `src/` - FSD Architecture:
  - `features/` - User interactions and page-level feature components (e.g., `investors-management`)
    - `ui/`, `api/`, `lib/`, `types/`, `styles/`
  - `entities/` - Business logic and data (e.g., `investor`, `trade`)
    - `ui/`, `api/`, `lib/`, `types/`
  - `shared/` - Reusable helpers and UI
    - `api/`, `lib/`, `ui/`
- `*.db` - SQLite database files
