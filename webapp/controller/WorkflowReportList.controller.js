sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    // "sap/ui/export/Spreadsheet", // Not available in OpenUI5 - only in commercial SAPUI5
    "sap/m/MessageToast"
], function (Controller, JSONModel, Filter, FilterOperator, /* Spreadsheet, */ MessageToast) {
    "use strict";

    return Controller.extend("workflowReport.workflowReport.controller.WorkflowReportList", {
        onInit: function () {
            this._iPageSize = 20;
            this._iSkip = 0;
            this._aCurrentFilters = [];

            // Page state model
            var oViewModel = new JSONModel({
                currentPage: 0
            });
            this.getView().setModel(oViewModel, "view");

            this.loadWorkflowLogData();
        },

        loadWorkflowLogData: function (filters, bIsExport) {
            var that = this;
            var sServiceUrl = "/lmsproject/hana/xsodata/WorkflowReportService.xsodata";
            var aFilterObjects = filters || [];

            // Build filter query string
            var sFilterQuery = "";
            if (aFilterObjects.length > 0) {
                var aFilterStrings = aFilterObjects.map(function(oFilter) {
                    var sOperator = "";
                    switch(oFilter.sOperator) {
                        case FilterOperator.Contains:
                            // For Contains, we use substringof in OData v2
                            return "substringof('" + encodeURIComponent(oFilter.oValue1) + "'," + oFilter.sPath + ")";
                        case FilterOperator.EQ:
                            sOperator = "eq";
                            break;
                        case FilterOperator.BT:
                            return oFilter.sPath + " ge datetime'" + oFilter.oValue1.toISOString().split('.')[0] + "' and " +
                                   oFilter.sPath + " le datetime'" + oFilter.oValue2.toISOString().split('.')[0] + "'";
                        case FilterOperator.GE:
                            return oFilter.sPath + " ge datetime'" + oFilter.oValue1.toISOString().split('.')[0] + "'";
                        case FilterOperator.LE:
                            return oFilter.sPath + " le datetime'" + oFilter.oValue1.toISOString().split('.')[0] + "'";
                        default:
                            sOperator = "eq";
                    }
                    return oFilter.sPath + " " + sOperator + " '" + encodeURIComponent(oFilter.oValue1) + "'";
                });
                sFilterQuery = "?$filter=" + aFilterStrings.join(" and ");
            }

            // Build pagination query
            var sPaginationQuery = "";
            if (!bIsExport && sFilterQuery) {
                sPaginationQuery = "&$skip=" + this._iSkip + "&$top=" + this._iPageSize;
            } else if (!bIsExport) {
                sPaginationQuery = "?$skip=" + this._iSkip + "&$top=" + this._iPageSize;
            }

            // 1. Fetch total count
            var oCountModel = new JSONModel();
            var sCountUrl = sServiceUrl + "/WorkflowLogView/$count" + sFilterQuery;
            oCountModel.loadData(sCountUrl, null, true, "GET", false, false, {
                "Content-Type": "application/json"
            });
            oCountModel.attachRequestCompleted(function() {
                var sCount = oCountModel.getData();
                that.getView().setModel(new JSONModel({ total: parseInt(sCount, 10) }), "countModel");
            });

            // 2. Fetch paged or full data
            var oDataModel = new JSONModel();
            var sDataUrl = sServiceUrl + "/WorkflowLogView" + sFilterQuery + sPaginationQuery;

            this.getView().byId("workflowLogTable").setBusy(true);

            oDataModel.loadData(sDataUrl, null, true, "GET", false, false, {
                "Content-Type": "application/json"
            });

            oDataModel.attachRequestCompleted(function() {
                var oData = oDataModel.getData();
                if (oData && oData.d && oData.d.results) {
                    var uniqueData = that._getUniqueData(oData.d.results);
                    var oJsonModel = new JSONModel(uniqueData);
                    that.getView().setModel(oJsonModel, "workflowLogModel");
                }
                that.getView().byId("workflowLogTable").setBusy(false);
            });

            oDataModel.attachRequestFailed(function(oEvent) {
                console.error("Error loading WorkflowLog data");
                that.getView().byId("workflowLogTable").setBusy(false);
            });
        },

        onSearch: function () {
            var aFilters = [];

            var sEmployeeId = this.byId("employeeIdInput").getValue();
            var sTrainingType = this.byId("trainingTypeInput").getSelectedKey();
            var sWorkflowId = this.byId("workflowIdInput").getValue();
            var sClassId = this.byId("classIdInput").getValue();
            var sClassTitle = this.byId("classTitleInput").getValue();
            var sEmployeeOrgId = this.byId("employeeOrgIdInput").getValue();
            var dCreationDateFrom = this.byId("creationDateFrom").getDateValue();
            var dCreationDateTo = this.byId("creationDateTo").getDateValue();
            // var sApproverId = this.byId("approverIdInput").getValue();
            var sRequestId = this.byId("requestIdInput").getValue();
            var sWorkflowStatus = this.byId("workflowStatusInput").getSelectedKey();

            if (sRequestId) aFilters.push(new Filter("REQUEST_ID", FilterOperator.Contains, sRequestId));
            if (sEmployeeId) aFilters.push(new Filter("EMPLOYEE_ID", FilterOperator.Contains, sEmployeeId));
            // if (sApproverId) aFilters.push(new Filter("CA_APPROVER_ID", FilterOperator.Contains, sApproverId));
            if (sTrainingType) aFilters.push(new Filter("TRAINING_TYPE_ID", FilterOperator.EQ, sTrainingType));
            if (sWorkflowId) aFilters.push(new Filter("WORKFLOW_INSTANCE_ID", FilterOperator.Contains, sWorkflowId));
            if (sClassId) aFilters.push(new Filter("CLASS_ID", FilterOperator.Contains, sClassId));
            if (sClassTitle) aFilters.push(new Filter("CLASS_TITLE", FilterOperator.Contains, sClassTitle));
            if (sEmployeeOrgId) aFilters.push(new Filter("EMPLOYEE_ORGANIZATION_ID", FilterOperator.Contains, sEmployeeOrgId));
            if (sWorkflowStatus) aFilters.push(new Filter("WORKFLOW_STATUS", FilterOperator.EQ, sWorkflowStatus));

            if (dCreationDateFrom && dCreationDateTo) {
                aFilters.push(new Filter("WLR_CREATION_DATE", FilterOperator.BT, dCreationDateFrom, dCreationDateTo));
            } else if (dCreationDateFrom) {
                aFilters.push(new Filter("WLR_CREATION_DATE", FilterOperator.GE, dCreationDateFrom));
            } else if (dCreationDateTo) {
                aFilters.push(new Filter("WLR_CREATION_DATE", FilterOperator.LE, dCreationDateTo));
            }

            this._iSkip = 0;
            this.getView().getModel("view").setProperty("/currentPage", 0);
            this._aCurrentFilters = aFilters;
            this.loadWorkflowLogData(aFilters);
        },

        onNextPage: function () {
            this._iSkip += this._iPageSize;
            const oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/currentPage", this._iSkip / this._iPageSize);
            this.loadWorkflowLogData(this._aCurrentFilters);
        },

        onPreviousPage: function () {
            if (this._iSkip >= this._iPageSize) {
                this._iSkip -= this._iPageSize;
                const oViewModel = this.getView().getModel("view");
                oViewModel.setProperty("/currentPage", this._iSkip / this._iPageSize);
                this.loadWorkflowLogData(this._aCurrentFilters);
            }
        },

        onExportToExcel: function () {
            // Excel export using sap/ui/export/Spreadsheet is not available in OpenUI5
            // This feature requires commercial SAPUI5 license
            MessageToast.show("Excel export is only available in commercial SAPUI5. Please use commercial SAPUI5 for this feature.");

            // Alternative: Export as CSV for OpenUI5
            // Uncomment below to enable CSV export
            /*
            var that = this;
            var oModel = new ODataModel("/lmsproject/hana/xsodata/WorkflowReportService.xsodata/");

            oModel.read("/WorkflowLogView", {
                filters: this._aCurrentFilters || [],
                success: function (data) {
                    var uniqueData = that._getUniqueData(data.results);
                    if (!uniqueData || uniqueData.length === 0) {
                        MessageToast.show("No data available to export.");
                        return;
                    }

                    // Convert to CSV and download
                    var csv = that._convertToCSV(uniqueData);
                    that._downloadCSV(csv, "Workflow_Report.csv");
                    MessageToast.show("Export to CSV successful!");
                },
                error: function (error) {
                    console.error("Failed to export data:", error);
                }
            });
            */
        },

        onItemPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
            var oBindingContext = oItem.getBindingContext("workflowLogModel");
            if (!oBindingContext) return;

            var sRequestId = oBindingContext.getProperty("WORKFLOW_INSTANCE_ID");
            if (!sRequestId) return;

            sap.ui.core.UIComponent.getRouterFor(this).navTo("workflowReportDetails", {
                requestId: sRequestId
            });
        },

        formatDate: function (sDate) {
            if (!sDate) return "";
            let oDate;

            if (typeof sDate === "string" && sDate.startsWith("/Date(")) {
                const iTimestamp = parseInt(sDate.match(/\d+/)[0], 10);
                oDate = new Date(iTimestamp);
            } else {
                oDate = new Date(sDate);
            }

            if (isNaN(oDate.getTime())) return "";

            return sap.ui.core.format.DateFormat.getDateInstance({ style: "medium" }).format(oDate);
        },

        _getUniqueData: function (data) {
            const map = new Map();
            data.forEach(item => {
                if (!map.has(item.WORKFLOW_INSTANCE_ID)) {
                    map.set(item.WORKFLOW_INSTANCE_ID, item);
                }
            });
            return data; // Array.from(map.values());
        }
    });
});
