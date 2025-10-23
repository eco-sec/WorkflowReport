sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "sap/m/MessageToast"
], function (Controller, JSONModel, ODataModel, Filter, FilterOperator, Spreadsheet, MessageToast) {
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
            var oModel = new ODataModel("/lmsproject/hana/xsodata/WorkflowReportService.xsodata/");
            var aFilterObjects = filters || [];

            // 1. Fetch total count
            oModel.read("/WorkflowLogView/$count", {
                filters: aFilterObjects,
                success: function (iCount) {
                    var oCountModel = new JSONModel({ total: parseInt(iCount, 10) });
                    that.getView().setModel(oCountModel, "countModel");
                }
            });

            // 2. Fetch paged or full data
            var mParams = {
                filters: aFilterObjects,
                success: function (data) {
                    var uniqueData = that._getUniqueData(data.results);
                    var oJsonModel = new JSONModel(uniqueData);
                    that.getView().setModel(oJsonModel, "workflowLogModel");
                    that.getView().byId("workflowLogTable").setBusy(false);
                },
                error: function (error) {
                    console.error("Error loading WorkflowLog data:", error);
                    that.getView().byId("workflowLogTable").setBusy(false);
                }
            };

            if (!bIsExport) {
                mParams.urlParameters = {
                    "$skip": this._iSkip,
                    "$top": this._iPageSize
                };
            }

            this.getView().byId("workflowLogTable").setBusy(true);
            oModel.read("/WorkflowLogView", mParams);
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

                    var aColumns = [
                        { label: "Request ID", property: "REQUEST_ID" },
                        { label: "Employee ID", property: "EMPLOYEE_ID" },
                        { label: "Employee Name", property: "EMPLOYEE_NAME" },
                        { label: "Employee Organization ID", property: "EMPLOYEE_ORGANIZATION_ID" },
                        { label: "Class ID", property: "CLASS_ID" },
                        { label: "Class Title", property: "CLASS_TITLE" },
                        { label: "Status", property: "WORKFLOW_STATUS" },
                        { label: "Training Type", property: "TRAINING_TYPE_DESC" },
                        {
                            label: "Creation Date",
                            property: "WLR_CREATION_DATE",
                            type: "date",
                            format: "dd/MM/yyyy"
                        }
                    ];

                    var oSpreadsheet = new Spreadsheet({
                        workbook: { columns: aColumns },
                        dataSource: uniqueData,
                        fileName: "Workflow_Report.xlsx"
                    });

                    oSpreadsheet.build()
                        .then(() => MessageToast.show("Export to Excel successful!"))
                        .catch(console.error)
                        .finally(() => oSpreadsheet.destroy());
                },
                error: function (error) {
                    console.error("Failed to export data:", error);
                }
            });
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
