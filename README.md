# 🏡 Madison Real Estate Explorer

An intelligent property insights platform built with the Modelence framework.  
This app helps users explore property listings in Madison, WI — enhanced with market trends, crime overlays, and community context.

---

## 🔧 Tech Stack

- **Modelence** — backend framework (modular, MongoDB-powered)
- **MongoDB** — user data, property cache, crime summaries
- **RentCast API** — real estate data (valuation, listings, market stats)
- **CrimeoMeter or FBI API** — crime data (cached per ZIP)
- **React (Planned)** — frontend interface (not yet in scope)

---

## 🧩 Current Modules

### `user`
Handles user authentication and allows saving/unsaving properties.

### `property` *(up next)*
Will store RentCast data for properties (cached by ZIP/address)

### `crime` *(planned)*
Will store crime data by ZIP code (daily refresh)

---

## ✅ Features (MVP Scope)

- User signup & login
- Search Madison-based properties (via RentCast)
- Save properties to personal list
- View cached crime summaries by ZIP

---

## 🚫 Not in Scope (for now)

- Nationwide search
- Real-time listings with images
- School info or MLS scraping
- Deployment (local development only)

---

## 📍 Focus

Initially scoped to **Madison, WI** for fast iteration and reliable data caching.

---

## 🗺️ Roadmap

- [x] Initialize project with Modelence
- [x] Implement `user` module
- [ ] Add `property` module with RentCast integration
- [ ] Add `crime` module with cache strategy
- [ ] Implement API routes to power frontend

---

## 📂 Setup

- Requires MongoDB connection string in `.env`
- Start with `modelence dev` (if installed globally)
- Ensure RentCast API key is available for future property queries

---

Let me know if you'd like to contribute or test!
