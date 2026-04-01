# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm start              # Dev server on port 8081 (auto-enables mock server on localhost)
npm run build          # Production build with manifest bundle + cachebuster
npm run zip:clean      # MANDATORY after every code change — regenerates deployment zip
```

**IMPORTANT:** Always run `npm run zip:clean` after ANY code change. The zip file (format: `WorkflowReport{YYYYMMDD}.zip`) is the deployment artifact for SAP WebIDE.

## Architecture

SAP UI5 MVC app for viewing/managing workflow training requests. Three page types:

- **WorkflowReportList** (`/`) — Paginated table (20/page) with multi-field search, Excel export
- **WorkflowReportDetails** (`/details/{requestId}`) — Detail view with tabs per training type
- **WorkflowReportListSingle** (`/{employeeId}/{startDate}/{endDate}`) — Filtered single-employee view

### Data Flow (Details Page)

1. **OData query** → `WorkflowSingleApproverView` filtered by `WORKFLOW_INSTANCE_ID` → `workflowLogModel` (always has status + attendance error)
2. **Business Event check** → If `TRAINING_TYPE_ID === "12"`, fetch from `GetEventById.xsjs` → `businessEventModel`
3. **CPI call** → `/cpi/lms/instance-work-items?taskId=` → `workflowReportModel` (approver lists)
4. **Fallback** → If CPI fails/empty, `workflowReportModel` is populated from OData data

### Tab Visibility (Details Page)

| Training Type ID | Tab Shown |
|---|---|
| `"11"` | Direct Enrollment (uses `workflowLogModel`) |
| `"12"` | Business Event (uses `businessEventModel`) |
| Other | Training Request (uses `workflowReportModel`) |

Approver tabs (Current Approvers, Approvers, Comments) only show when CPI returns data.

## Service Endpoints

| Service | URL Pattern |
|---|---|
| OData (workflow data) | `/lmsproject/hana/xsodata/WorkflowReportService.xsodata/WorkflowSingleApproverView` |
| XSJS (events) | `/lmsproject/hana/xsjs/GetEventById.xsjs?id=` |
| XSJS (picklists) | `/lmsproject/hana/xsjs/PicklistService.xsjs` |
| CPI (work items) | `/cpi/lms/instance-work-items?taskId=` |
| CPI (employee) | `/cpidev/employee/details?employeeId=` |

## Date Handling

- SAP epoch dates: `/Date(1234567890000)/` — extract timestamp with regex `\d+`
- Time durations: ISO 8601 `PT6H30M11S` — parse H/M/S components
- Display format: `dd-MM-yyyy` for dates, `d MMM yyyy, HH:mm:ss` for datetime
- OData date fields: `WLR_CREATION_DATE`, `CLASS_START_DATE`, `CLASS_END_DATE`

## Key Field Mappings

OData uses UPPER_SNAKE_CASE (`WORKFLOW_STATUS`, `REQUEST_ID`, `ATTENDANCE_REQUEST_ERROR`).
CPI/workflowReportModel uses camelCase (`status`, `requestId`, `attendanceError`).

When both sources are available, OData `WORKFLOW_STATUS` is the source of truth for status.
