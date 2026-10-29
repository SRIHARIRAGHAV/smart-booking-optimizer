# Roamly — Frontend

The Roamly React and TypeScript travel-planning interface. It includes trip inspiration, natural-language and structured search, itinerary recommendations, clarification, approval, travel-planning guidance, FAQs, and a floating trip companion. Inspiration examples reflect routes present in the current demonstration inventory. The companion submits requests through the existing `/api/trips/plan` workflow; in demo mode it uses backend sample inventory rather than a separate conversational AI model.

## Run locally

```powershell
cd frontend
npm install
npm run dev
```

The Vite development server proxies `/api` requests to `http://localhost:8000`, as configured in `vite.config.ts`. Start the existing backend separately to use trip planning and health checks; this frontend does not change the backend or its API contract.

## Validate

```powershell
npm run build
npm run lint
```

Flight, hotel, and price data shown by the current backend are demonstration inventory, not live quotes. The UI presents recommendations for review; it does not place bookings. Authentication, live provider search, reservations, and payment are not provided by this frontend.
