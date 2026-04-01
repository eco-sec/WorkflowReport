sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"workflowReport/workflowReport/service/WorkflowReportService"
], function (Controller, JSONModel, MessageToast, WorkflowReportService) {
	"use strict";

	return Controller.extend("workflowReport.workflowReport.controller.WorkflowReportDetails", {

		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("workflowReportDetails").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function (oEvent) {
			var sEventId = oEvent.getParameter("arguments").requestId;
			console.log("📋 Details page - Loading workflow:", sEventId);
			if (sEventId) {
				this._loadEventData(sEventId);
			}
		},
		formatter: {
			formatEpochDate: function (sValue) {
				if (!sValue) return "";
				const match = sValue.match(/\d+/);
				if (!match) return "";
				return new Date(parseInt(match[0], 10)).toISOString().slice(0, 10); // yyyy-MM-dd
			},

			formatISOTime: function (sValue) {
				if (!sValue) return "";
				return sValue.replace("PT", "").replace("H", ":").replace("M", ":").replace("S", "");
			},

			formatDateTime: function (sDate, sTime) {
				if (!sDate || !sTime) return "";
				const dateMatch = sDate.match(/\d+/);
				if (!dateMatch) return "";
				const formattedDate = new Date(parseInt(dateMatch[0], 10)).toISOString().slice(0, 10);
				const formattedTime = sTime.substring(0, 2) + ":" + sTime.substring(2, 4) + ":" + sTime.substring(4, 6);
				return formattedDate + " " + formattedTime;
			}
		},

		formatDateTimeFromEpoch: function (sDate, sTime) {
			if (!sDate) return "";
			var oDate;
			if (typeof sDate === "string" && sDate.startsWith("/Date(")) {
				const match = sDate.match(/\d+/);
				if (!match) return "";
				oDate = new Date(parseInt(match[0], 10));
			} else {
				oDate = new Date(sDate);
			}
			if (isNaN(oDate.getTime())) return "";

			// Parse ISO 8601 duration time format (e.g., "PT6H30M11S")
			if (sTime && typeof sTime === "string" && sTime.startsWith("PT")) {
				var hours = 0, minutes = 0, seconds = 0;
				var hourMatch = sTime.match(/(\d+)H/);
				var minMatch = sTime.match(/(\d+)M/);
				var secMatch = sTime.match(/(\d+)S/);
				if (hourMatch) hours = parseInt(hourMatch[1], 10);
				if (minMatch) minutes = parseInt(minMatch[1], 10);
				if (secMatch) seconds = parseInt(secMatch[1], 10);
				oDate.setHours(hours, minutes, seconds);
			}

			return sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "d MMM yyyy, HH:mm:ss" }).format(oDate);
		},

		_loadEventData: function (sEventId) {
			var that = this;

			console.log("  → Step 1: Fetching WorkflowLog for ID:", sEventId);

			// Step 1: Get WorkflowLog by ID (OData - always has status and attendance error)
			WorkflowReportService.getWorkflowLogById(sEventId)
				.then(function (workflowLogData) {
					console.log("  ✅ WorkflowLog data received:", workflowLogData);
					that.getView().setModel(new JSONModel(workflowLogData), "workflowLogModel");
					var trainingTypeId = workflowLogData.TRAINING_TYPE_ID;

					// Step 2: Check if this is a Business Event type (TRAINING_TYPE === "12")
					var isBusinessEvent = workflowLogData.TRAINING_TYPE_ID === "12";

					var businessEventPromise = Promise.resolve();
					if (isBusinessEvent) {
						businessEventPromise = WorkflowReportService.getEventById(workflowLogData.REQUEST_ID)
							.then(function (eventData) {
								var oBusinessEventModel = new JSONModel({
									eventDetails: eventData.eventDetails,
									attachments: Array.isArray(eventData.attachments) ? eventData.attachments : [eventData.attachments]
								});
								that.getView().setModel(oBusinessEventModel, "businessEventModel");
							});
					}

					// Step 3: Get workflow request details from CPI, fallback to OData if instance is empty
					return businessEventPromise.then(function () {
						return WorkflowReportService.getRequestDetailsById(sEventId)
							.then(function (oData) {
								// Use status and attendance error from OData as the source of truth
								oData.status = workflowLogData.WORKFLOW_STATUS || oData.status;
								oData.attendanceError = workflowLogData.ATTENDANCE_REQUEST_ERROR || oData.attendanceError;
								var oModel = new JSONModel(oData);
								that.getView().setModel(oModel, "workflowReportModel");

								var oTabVisibility = {
									showWorkflowLogInfoTab: trainingTypeId === "11",
									showInfoTab: trainingTypeId !== "11" && trainingTypeId !== "12",
									showBusinessEventTab: trainingTypeId === "12",
									showCurrentApproverList: !!(oData.currentApproverList && oData.currentApproverList.length > 0),
									showApproverList: !!(oData.approverList && oData.approverList.length > 0),
									showApproverCommentList: !!(oData.ApproverCommentList && oData.ApproverCommentList.length > 0)
								};

								that.getView().setModel(new JSONModel(oTabVisibility), "tabVisibility");
							})
							.catch(function (oCpiError) {
								// CPI instance is empty/failed - use OData data as fallback
								console.warn("CPI request details not found, using OData data:", oCpiError);

								var oFallbackData = {
									requestId: workflowLogData.REQUEST_ID,
									status: workflowLogData.WORKFLOW_STATUS,
									trainingTypeId: workflowLogData.TRAINING_TYPE_ID,
									trainingTypeDesc: workflowLogData.TRAINING_TYPE_DESC,
									classId: workflowLogData.CLASS_ID,
									classTitle: workflowLogData.CLASS_TITLE,
									classDescription: workflowLogData.CLASS_DESCRIPTION,
									classTotalDays: workflowLogData.CLASS_TOTAL_DAYS,
									classStartDateDesc: workflowLogData.CLASS_START_DATE,
									classEndDateDesc: workflowLogData.CLASS_END_DATE,
									employeeId: workflowLogData.EMPLOYEE_ID,
									employeeName: workflowLogData.EMPLOYEE_NAME,
									employeeMail: workflowLogData.EMPLOYEE_EMAIL,
									employeeOrganizationId: workflowLogData.EMPLOYEE_ORGANIZATION_ID,
									price: workflowLogData.PRICE,
									currency: workflowLogData.CURRENCY,
									trainingLanguage: workflowLogData.TRAINING_LANGUAGE,
									trainingDuration: workflowLogData.TRAINING_DURATION,
									facility: workflowLogData.FACILITY_DESC,
									attendanceError: workflowLogData.ATTENDANCE_REQUEST_ERROR
								};
								that.getView().setModel(new JSONModel(oFallbackData), "workflowReportModel");

								var oTabVisibility = {
									showWorkflowLogInfoTab: trainingTypeId === "11",
									showInfoTab: trainingTypeId !== "11" && trainingTypeId !== "12",
									showBusinessEventTab: trainingTypeId === "12",
									showCurrentApproverList: false,
									showApproverList: false,
									showApproverCommentList: false
								};

								that.getView().setModel(new JSONModel(oTabVisibility), "tabVisibility");
							});
					});
				})
				.catch(function (oError) {
					sap.m.MessageToast.show("Event data could not be retrieved.");
					console.error("Error retrieving event data:", oError);
				});
		}

	});

});