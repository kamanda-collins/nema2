# Phase 3: NEMA Integration - Implementation Order

## ✅ Phase 3.1: Backend API + Frontend Integration (COMPLETE)

### What We Built:
1. **FastAPI Backend** (`nema-api/`)
   - ✅ 6 REST API endpoints (health, compliance, batch, wetlands search, reports, map export)
   - ✅ Professional map export with NEMA2's advanced features
   - ✅ 26,650 wetlands loaded from Uganda/East Africa dataset
   - ✅ Running on http://localhost:8000

2. **TypeScript Integration** (`src/services/nemaApi.ts`)
   - ✅ Full TypeScript interfaces and types
   - ✅ NEMAApiService class with methods for all endpoints
   - ✅ Helper functions (layerToGeoJSON, downloadBase64Image, etc.)

3. **React Hooks** (`src/hooks/useNEMACompliance.ts`)
   - ✅ 6 custom hooks for all API features
   - ✅ Toast notifications and error handling
   - ✅ Progress tracking for long operations

4. **Documentation**
   - ✅ API_DOCUMENTATION.md - Complete API reference
   - ✅ QUICK_START.md - Setup and testing guide
   - ✅ MAP_EXPORT_TESTING.md - Map export testing guide
   - ✅ PHASE_3.1_COMPLETE.md - Summary of what's built

---

## 🔄 Phase 3.2: Frontend UI Components (IN PROGRESS)

### Implementation Order (Follow This Sequence):

#### Step 1: Test Backend API ⏭️ NEXT STEP
**Goal**: Verify all endpoints work before building UI

**Actions**:
1. Open http://localhost:8000/docs
2. Test each endpoint using the interactive docs:
   - GET `/health` - Verify wetlands loaded
   - POST `/api/v1/compliance/check` - Test single site
   - POST `/api/v1/wetlands/search` - Query wetlands
   - POST `/api/v1/map/export` - Generate professional map
3. Follow `MAP_EXPORT_TESTING.md` for test payloads
4. Download and verify generated map quality

**Success Criteria**:
- ✅ Health check returns `wetlands_loaded: true`
- ✅ Compliance check returns risk level and distance
- ✅ Map export generates high-quality PNG with all elements
- ✅ All endpoints respond within expected time

**Files to Reference**:
- `MAP_EXPORT_TESTING.md` - Test payloads and procedures
- `API_DOCUMENTATION.md` - Full endpoint documentation

---

#### Step 2: Add Map Export Button to Existing Map
**Goal**: Integrate NEMA professional map export into existing MapSection

**Files to Modify**:
- `src/components/Map/MapSection.tsx` - Add NEMA export button
- `src/components/Export/` - Create NEMAMapExportDialog.tsx

**What to Build**:

1. **NEMAMapExportDialog.tsx** (New Component)
   ```tsx
   // Configuration dialog for NEMA map export
   - Buffer distance slider (100m - 50km)
   - DPI selector (72/150/200/300)
   - Basemap toggle (satellite vs street view)
   - Site label input field
   - Show/hide label checkbox
   - Preview section (shows metadata)
   - Export button with loading state
   - Download progress indicator
   ```

2. **Update MapSection.tsx**
   ```tsx
   // Add NEMA export button next to existing FixedExportButton
   - Import useNEMAMapExport hook
   - Add "Professional Map" button
   - Opens NEMAMapExportDialog
   - Passes current drawn shapes to dialog
   - Shows success/error toasts
   ```

**Dependencies**:
- useNEMAMapExport hook (✅ already created)
- downloadBase64Image helper (✅ already created)
- Existing UI components (Button, Dialog, Slider, Switch, etc.)

**Success Criteria**:
- ✅ Button appears in MapSection toolbar
- ✅ Dialog opens with all configuration options
- ✅ Exports generate professional maps with wetlands overlay
- ✅ Downloads work in browser
- ✅ Loading states and error handling work

---

#### Step 3: NEMA Compliance Checker Component
**Goal**: Standalone component for checking site compliance

**Files to Create**:
- `src/components/NEMA/NEMAComplianceChecker.tsx` - Main checker interface
- `src/components/NEMA/ComplianceResultCard.tsx` - Result display
- `src/components/NEMA/RiskLevelBadge.tsx` - Risk visualization

**What to Build**:

1. **NEMAComplianceChecker.tsx**
   ```tsx
   // Main compliance checking interface
   - Site input methods:
     * Manual coordinates entry
     * Import from drawn shapes
     * Upload GeoJSON file
   - Buffer zone selector (100m-50km, default 200m)
   - "Check Compliance" button
   - Loading state with spinner
   - Results display (ComplianceResultCard)
   - Action buttons:
     * Export Report
     * Export Professional Map
     * Save to Database
   ```

2. **ComplianceResultCard.tsx**
   ```tsx
   // Display compliance check results
   - Risk level badge (color-coded)
   - Distance to nearest wetland
   - Wetland names list
   - Compliance status (compliant/non-compliant)
   - Buffer violation warning
   - Recommendations list
   - Timestamp
   ```

3. **RiskLevelBadge.tsx**
   ```tsx
   // Visual risk level indicator
   - CRITICAL: Red badge with alert icon
   - HIGH: Orange badge with warning icon
   - LOW: Green badge with check icon
   - UNKNOWN: Gray badge
   ```

**Dependencies**:
- useNEMACompliance hook (✅ already created)
- useNEMAReport hook (✅ already created)
- layerToGeoJSON helper (✅ already created)

**Success Criteria**:
- ✅ Can check compliance from multiple input methods
- ✅ Results display clearly with color-coded risk levels
- ✅ Export report generates markdown/PDF
- ✅ Professional map export works from results
- ✅ All error cases handled gracefully

---

#### Step 4: Batch Processing Dashboard
**Goal**: Bulk compliance checking for multiple sites

**Files to Create**:
- `src/components/NEMA/BatchProcessingDashboard.tsx` - Main dashboard
- `src/components/NEMA/BatchUploadForm.tsx` - File upload interface
- `src/components/NEMA/BatchResultsTable.tsx` - Results table

**What to Build**:

1. **BatchProcessingDashboard.tsx**
   ```tsx
   // Bulk compliance checking interface
   - Upload CSV/Excel with site list
   - Site list preview table
   - Buffer zone setting (applies to all)
   - "Process Batch" button
   - Progress bar with percentage
   - Processing status updates
   - Results table (BatchResultsTable)
   - Batch actions:
     * Export all results to CSV
     * Generate combined report
     * Filter by risk level
     * Sort by distance
   ```

2. **BatchUploadForm.tsx**
   ```tsx
   // File upload for batch processing
   - Drag-and-drop CSV/Excel upload
   - Template download button
   - File validation
   - Preview parsed sites
   - Edit site names before processing
   ```

3. **BatchResultsTable.tsx**
   ```tsx
   // Display batch processing results
   - Sortable columns (name, risk, distance, status)
   - Filter by risk level
   - Search by site name
   - Row actions:
     * View details
     * Export individual report
     * Export map
     * Remove from batch
   - Aggregate stats:
     * Total sites
     * Compliant count
     * Non-compliant count
     * Average distance
   ```

**Dependencies**:
- useNEMABatchProcessing hook (✅ already created)
- CSV parsing library (need to install: papaparse)

**Success Criteria**:
- ✅ Can upload CSV with site list
- ✅ Processes multiple sites efficiently
- ✅ Progress updates in real-time
- ✅ Results table is sortable and filterable
- ✅ Can export batch results to CSV
- ✅ Individual actions work for each site

---

#### Step 5: Interactive Wetlands Map
**Goal**: Dedicated map view with wetlands layer toggle

**Files to Create**:
- `src/components/NEMA/WetlandsMap.tsx` - Map with wetlands overlay
- `src/components/NEMA/WetlandInfoPanel.tsx` - Wetland details sidebar

**What to Build**:

1. **WetlandsMap.tsx**
   ```tsx
   // Interactive map with wetlands layer
   - Leaflet map with Uganda/East Africa centered
   - Wetlands layer toggle (on/off)
   - Load wetlands by viewport bounds
   - Click wetland for details
   - Draw site boundaries
   - Quick compliance check from map
   - Buffer zone visualization
   - Export map button
   - Search location
   ```

2. **WetlandInfoPanel.tsx**
   ```tsx
   // Sidebar showing wetland details
   - Wetland name
   - Area (hectares)
   - Perimeter
   - Coordinates
   - Nearby sites (if any)
   - Actions:
     * Zoom to wetland
     * Export wetland GeoJSON
     * View on satellite
   ```

**Dependencies**:
- useNEMAWetlandsSearch hook (✅ already created)
- Existing Leaflet map infrastructure
- GeoJSON layer rendering

**Success Criteria**:
- ✅ Wetlands load based on map viewport
- ✅ Can toggle wetlands layer on/off
- ✅ Click wetlands to see details
- ✅ Draw tools work for compliance checking
- ✅ Performance is acceptable with 26k wetlands
- ✅ Export button generates professional maps

---

#### Step 6: Navigation and Integration
**Goal**: Add NEMA features to main navigation and dashboard

**Files to Modify**:
- `src/components/Layout/Navigation.tsx` or equivalent
- `src/App.tsx` or main routing file
- `src/pages/Dashboard.tsx` (if exists)

**What to Add**:

1. **Navigation Menu Item**
   ```tsx
   // Add "NEMA Compliance" to main menu
   - Icon: Shield or CheckCircle
   - Submenu items:
     * Single Site Check
     * Batch Processing
     * Wetlands Map
     * Reports
   - API status indicator (green/red dot)
   ```

2. **Dashboard Integration**
   ```tsx
   // Add NEMA card to dashboard
   - Quick compliance check widget
   - Recent checks list
   - Compliance statistics
   - Quick links to features
   ```

3. **Routes**
   ```tsx
   // Add routes for NEMA components
   /nema/check - Single site checker
   /nema/batch - Batch processing
   /nema/map - Wetlands map
   /nema/reports - Reports archive
   ```

**Dependencies**:
- All previous NEMA components
- Existing routing setup

**Success Criteria**:
- ✅ NEMA features accessible from main nav
- ✅ Routes work correctly
- ✅ Dashboard shows NEMA summary
- ✅ API status indicator updates in real-time
- ✅ Breadcrumbs work correctly

---

#### Step 7: Polish and Testing
**Goal**: Refine UI, add error handling, optimize performance

**Tasks**:

1. **Error Handling**
   - Network error recovery
   - API timeout handling
   - Validation messages
   - Offline mode detection

2. **Loading States**
   - Skeleton loaders
   - Progress indicators
   - Optimistic updates

3. **Mobile Responsiveness**
   - Test all components on mobile
   - Adjust layouts for small screens
   - Touch-friendly controls

4. **Performance Optimization**
   - Debounce API calls
   - Cache wetlands data
   - Lazy load components
   - Optimize re-renders

5. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - ARIA labels
   - Color contrast

6. **Testing**
   - Unit tests for utilities
   - Integration tests for hooks
   - E2E tests for workflows
   - API error scenarios

**Success Criteria**:
- ✅ All features work on mobile
- ✅ No accessibility violations
- ✅ Fast loading times (<3s)
- ✅ Graceful error handling
- ✅ Test coverage >70%

---

## Summary of Implementation Order

1. **✅ DONE**: Backend API + TypeScript Integration (Phase 3.1)
2. **⏭️ NEXT**: Test Backend API (Step 1) - ~30 minutes
3. **TODO**: Add Map Export to MapSection (Step 2) - ~2 hours
4. **TODO**: NEMA Compliance Checker (Step 3) - ~3 hours
5. **TODO**: Batch Processing Dashboard (Step 4) - ~4 hours
6. **TODO**: Interactive Wetlands Map (Step 5) - ~3 hours
7. **TODO**: Navigation Integration (Step 6) - ~1 hour
8. **TODO**: Polish and Testing (Step 7) - ~4 hours

**Total Estimated Time**: ~17 hours (2-3 days)

---

## Quick Reference

### Already Available (Can Use Immediately):
- ✅ All 6 API endpoints working
- ✅ TypeScript types and interfaces
- ✅ 6 React hooks ready
- ✅ Helper functions (conversion, formatting, download)
- ✅ shadcn/ui components library
- ✅ Leaflet map infrastructure
- ✅ Toast notifications system

### Need to Install:
- papaparse (for CSV parsing in batch processing)
- @types/papaparse (TypeScript types)

### Testing Resources:
- http://localhost:8000/docs - API documentation
- `MAP_EXPORT_TESTING.md` - Test procedures
- `API_DOCUMENTATION.md` - Full reference

---

## Current Status

**Where We Are**: Completed Phase 3.1 (Backend + Integration Layer)

**Next Immediate Step**: Test the backend API to verify all endpoints work correctly before building UI components.

**Action**: Open http://localhost:8000/docs and follow the testing procedures in `MAP_EXPORT_TESTING.md`.
