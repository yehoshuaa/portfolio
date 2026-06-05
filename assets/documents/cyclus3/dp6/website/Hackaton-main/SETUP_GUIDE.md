# 🗺️ Campus Navigation System - Complete Setup

## ✅ WHAT I FIXED:

### 1. ONE JS FILE ONLY ✓
- **File**: `js/routescript.js`
- Route.html uses ONLY this file
- Supports URL parameters: `?room=AC1.18`
- Empty routes section ready for your data

### 2. ROUTE BUILDER - EXACTLY LIKE ROUTE.HTML ✓
- **New File**: `route_builder.html` (USE THIS ONE!)
- Same look and feel as Route.html
- Same map interaction (zoom, pan, drag)
- Auto-loads floor maps
- Click on map to add waypoints
- Saves to localStorage
- Downloads code when ready

### 3. INDEX PAGE - ALL ROOMS ✓
- **File**: `pages/index.html`
- AC1.01 through AC1.99 (99 rooms)
- AC2.01 through AC2.99 (99 rooms)
- Total: 198 classroom buttons
- Search box to filter
- Click any room → Route.html?room=AC1.XX

### 4. RESPONSIVE ON ALL DEVICES ✓
- Map stays same size on phone/tablet/desktop/laptop
- Minimum height: 70vh on desktop, 65vh on mobile
- No more shrinking!
- Routes look identical everywhere

## 📋 YOUR WORKFLOW:

### Step 1: Create Routes
1. Open **`route_builder.html`** in browser
2. Select floor (AC1 or AC2) - map loads automatically
3. Enter room number (e.g., "AC1.18")
4. Select route type (main/accessible/quiet)
5. **Click on the map** to add waypoints
6. Click "💾 Save Route"
7. Repeat for other rooms/route types

### Step 2: Export Routes
1. When you're done creating routes
2. Click "⬇️ Download All Routes"
3. A text file downloads

### Step 3: Add to Project
1. Open the downloaded `routes_to_paste.txt`
2. Open `js/routescript.js` in VS Code
3. Find the `routes: {` section for AC1 or AC2
4. Paste the generated code there
5. Save the file

### Step 4: Test
1. Open `pages/index.html`
2. Click on any room button
3. See your route!

## 📂 FILE STRUCTURE:

```
Hackaton/
├── pages/
│   ├── index.html          (Room selection page - 198 rooms)
│   ├── Route.html          (Route display page)
│   └── assets/
│       ├── Circus1eV.png   (AC1 floor plan)
│       └── Circus2eV.png   (AC2 floor plan)
├── js/
│   └── routescript.js      (ONLY JS FILE - add routes here)
├── css/
│   └── routestyle.css      (Styling)
└── route_builder.html      (CREATE ROUTES HERE!)
```

## 🎯 IMPORTANT FILES:

- **route_builder.html** - Use this to create new routes
- **pages/index.html** - Student room selection page
- **pages/Route.html** - Shows the route for selected room
- **js/routescript.js** - The ONLY JavaScript file (paste routes here)

## 🚀 FEATURES:

✓ Auto-loads floor maps
✓ Click to add waypoints
✓ Drag to pan map
✓ Scroll/pinch to zoom
✓ Works on all devices
✓ Saves routes automatically
✓ Download code with one click
✓ 198 rooms ready to map

## 💡 TIP:

Start with a few rooms to test, then add more as needed!
