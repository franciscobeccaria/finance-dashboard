# Feature: Backend Integration for Budgets and Transactions

## Overview

This update connects the application’s budget and transaction features directly with the backend API. It enhances data accuracy, user experience, and maintainability by replacing local storage persistence with server-based data syncing.

---

## Changes by Section

### 1. Budgets

- **Backend Sync:** Budgets now load from the API instead of local storage.
- **Creation & Update:** Added server-side creation and update flows.
- **Deletion:** Supports budget removal with API confirmation.
- **Spending Calculation:** Budgets dynamically recalculate available amounts based on linked transactions.

### 2. Transactions

- **Backend Integration:** Fetch transactions from the API at load.
- **Manual Creation:** Users can create new transactions via a validated form.
- **Budget Linking:** Transactions can now be assigned to specific budgets, automatically affecting budget balances.
- **Loading States:** Added loaders for form submissions to improve feedback.

### 3. User Interface Enhancements

- **Avatar & Menu:** Introduced user avatar component with dropdown menu, built using Radix UI for accessibility.
- **Responsive Layout:** Minor adjustments for consistent UI across devices.

### 4. Data Persistence Changes

- **Removed LocalStorage:** Eliminated all local storage persistence for budgets and transactions.
- **Breaking Change:** Old local-only data will no longer load; all data is now fetched from the server.

---

## Impact for Users

- **Improved Accuracy:** Budgets and transactions always reflect the latest server data.
- **Better UX:** Loader feedback and structured menus enhance usability.
- **Unified Data:** No risk of local changes going out of sync with the backend.

---

## Technical Notes

- Uses centralized API service for CRUD operations.
- Maintains validation rules previously implemented on the client.
- Uses Radix UI components for better accessibility and design consistency.

---

## Type of Change

- `feat`: Adds backend integration for budgets and transactions.
- `refactor`: Replaces local persistence with server sync.
- `breaking`: Removes legacy local storage functionality.
