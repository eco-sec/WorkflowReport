sap.ui.define([
	"sap/ui/core/util/MockServer",
	"./mockdata",
	"sap/ui/thirdparty/jquery"
], function (MockServer, MockData, jQuery) {
	"use strict";

	var _mockServer = null;

	return {
		/**
		 * Initializes the mock server
		 * @public
		 */
		init: function () {
			var oMockData = MockData;

			console.log("🔧 Initializing Mock Server with jQuery AJAX interception...");

			// ✅ Store original jQuery.ajax
			var originalAjax = jQuery.ajax;

			// ✅ Override jQuery.ajax to intercept ALL calls
			jQuery.ajax = function(url, options) {
				// Handle both jQuery.ajax(url, options) and jQuery.ajax(options)
				if (typeof url === "object") {
					options = url;
					url = options.url;
				}
				options = options || {};
				url = url || options.url;

				console.log("🌐 AJAX Request intercepted:", url);

				var mockData = null;
				var shouldMock = false;

				// Mock User API
				if (url.indexOf("/services/userapi/currentUser") > -1 || url.indexOf("/scpServices/userAPI/currentUser") > -1) {
					console.log("✅ Mocking: User API");
					mockData = oMockData.currentUser;
					shouldMock = true;
				}

				// Mock Subordinates API
				else if (url.indexOf("/cpi/employee/getSubordinate") > -1 || url.indexOf("/cpi/tc/getSubordinate") > -1) {
					console.log("✅ Mocking: Subordinates API");
					mockData = oMockData.subordinates;
					shouldMock = true;
				}

				// Mock Workflow Report List (WorkflowLogView)
				else if (url.indexOf("/lmsproject/hana/xsodata/WorkflowReportService.xsodata/WorkflowLogView") > -1) {
					console.log("✅ Mocking: Workflow Report List API");

					// Check if filtering by employee ID
					var employeeIdMatch = url.match(/EMPLOYEE_ID eq '(\d+)'/);
					var employeeId = employeeIdMatch ? employeeIdMatch[1] : null;

					if (employeeId) {
						// Filter workflow data for specific employee
						var filteredData = JSON.parse(JSON.stringify(oMockData.workflowReport));
						filteredData.d.results = filteredData.d.results.filter(function(item) {
							return item.EMPLOYEE_ID === employeeId;
						});
						mockData = filteredData;
					} else {
						mockData = oMockData.workflowReport;
					}
					shouldMock = true;
				}

				// Mock Workflow Details (single request)
				else if (url.match(/WorkflowReportService\.xsodata\/WorkflowLogView\('([^']+)'\)/)) {
					console.log("✅ Mocking: Workflow Details API");
					var requestIdMatch = url.match(/WorkflowLogView\('([^']+)'\)/);
					var requestId = requestIdMatch ? requestIdMatch[1] : "WF001";

					// Find the workflow in mock data
					var workflow = oMockData.workflowReport.d.results.find(function(item) {
						return item.REQUEST_ID === requestId;
					});

					if (workflow) {
						mockData = { d: workflow };
					} else {
						// Return default details
						var detailsData = JSON.parse(JSON.stringify(oMockData.workflowDetails));
						detailsData.d.REQUEST_ID = requestId;
						mockData = detailsData;
					}
					shouldMock = true;
				}

				// Mock Picklist Service
				else if (url.indexOf("/lmsproject/hana/xsjs/PicklistService.xsjs") > -1) {
					console.log("✅ Mocking: Picklist Service");
					mockData = oMockData.picklists;
					shouldMock = true;
				}

				// Mock Workflow Approval
				else if (url.indexOf("/cpi/workflow/approve") > -1) {
					console.log("✅ Mocking: Workflow Approval API");
					mockData = oMockData.approvalResponse;
					shouldMock = true;
				}

				// Mock Workflow Rejection
				else if (url.indexOf("/cpi/workflow/reject") > -1) {
					console.log("✅ Mocking: Workflow Rejection API");
					mockData = oMockData.rejectionResponse;
					shouldMock = true;
				}

				// If should mock, create a fake jqXHR
				if (shouldMock) {
					var dfd = jQuery.Deferred();
					var mockXhr = {
						readyState: 4,
						status: 200,
						statusText: "OK",
						responseText: JSON.stringify(mockData),
						responseJSON: mockData,
						getResponseHeader: function() { return "application/json"; },
						getAllResponseHeaders: function() { return ""; }
					};

					setTimeout(function() {
						// Call success callback if provided
						if (options.success) {
							options.success(mockData, "success", mockXhr);
						}
						// Call complete callback if provided
						if (options.complete) {
							options.complete(mockXhr, "success");
						}
						// Resolve the deferred
						dfd.resolve(mockData, "success", mockXhr);
					}, 300); // Reduced delay for better UX

					// Return a promise-like object
					var promise = dfd.promise(mockXhr);
					promise.success = promise.done;
					promise.error = promise.fail;
					return promise;
				}

				// If not mocked, call original ajax
				return originalAjax.apply(this, arguments);
			};

			// Create mock server with root URI
			_mockServer = new MockServer({
				rootUri: "/"
			});

			// Configure mock server
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: 300
			});

			// Define custom responses
			var aRequests = _mockServer.getRequests();

			// Mock user API - must match EXACT paths
			aRequests.push({
				method: "GET",
				path: /.*\/services\/userapi\/currentUser.*/,
				response: function(oXhr) {
					console.log("✅ Mocking: User API (/services/userapi/currentUser)");
					oXhr.respondJSON(200, {}, oMockData.currentUser);
				}
			});

			aRequests.push({
				method: "GET",
				path: /.*\/scpServices\/userAPI\/currentUser.*/,
				response: function(oXhr) {
					console.log("✅ Mocking: User API (/scpServices/userAPI/currentUser)");
					oXhr.respondJSON(200, {}, oMockData.currentUser);
				}
			});

			// Mock Employee Service - get subordinates
			aRequests.push({
				method: "GET",
				path: /.*\/cpi\/(employee|tc)\/getSubordinate.*/,
				response: function(oXhr) {
					console.log("✅ Mocking: Get Subordinates API");
					oXhr.respondJSON(200, {}, oMockData.subordinates);
				}
			});

			// Mock Workflow Report List
			aRequests.push({
				method: "GET",
				path: /.*\/lmsproject\/hana\/xsodata\/WorkflowReportService\.xsodata\/WorkflowLogView.*/,
				response: function(oXhr) {
					console.log("✅ Mocking: Workflow Log View API");

					// Extract employee ID from URL
					var url = oXhr.url;
					var employeeIdMatch = url.match(/EMPLOYEE_ID eq '(\d+)'/);
					var employeeId = employeeIdMatch ? employeeIdMatch[1] : null;

					if (employeeId) {
						// Filter workflow data for specific employee
						var filteredData = JSON.parse(JSON.stringify(oMockData.workflowReport));
						filteredData.d.results = filteredData.d.results.filter(function(item) {
							return item.EMPLOYEE_ID === employeeId;
						});
						oXhr.respondJSON(200, {}, filteredData);
					} else {
						oXhr.respondJSON(200, {}, oMockData.workflowReport);
					}
				}
			});

			// Mock Picklist Service
			aRequests.push({
				method: "GET",
				path: /.*\/lmsproject\/hana\/xsjs\/PicklistService\.xsjs.*/,
				response: function(oXhr) {
					console.log("✅ Mocking: Picklist Service API");
					oXhr.respondJSON(200, {}, oMockData.picklists);
				}
			});

			// Mock Workflow Approval
			aRequests.push({
				method: "POST",
				path: /.*\/cpi\/workflow\/approve.*/,
				response: function(oXhr) {
					console.log("✅ Mocking: Workflow Approval API");
					oXhr.respondJSON(200, {}, oMockData.approvalResponse);
				}
			});

			// Mock Workflow Rejection
			aRequests.push({
				method: "POST",
				path: /.*\/cpi\/workflow\/reject.*/,
				response: function(oXhr) {
					console.log("✅ Mocking: Workflow Rejection API");
					oXhr.respondJSON(200, {}, oMockData.rejectionResponse);
				}
			});

			// Mock OData metadata
			aRequests.push({
				method: "GET",
				path: /.*\$metadata.*/,
				response: function(oXhr) {
					console.log("✅ Mocking: OData Metadata");
					oXhr.respond(200, { "Content-Type": "application/xml" },
						'<?xml version="1.0" encoding="utf-8"?><edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx"><edmx:DataServices m:DataServiceVersion="2.0" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata"><Schema Namespace="WorkflowReportService" xmlns="http://schemas.microsoft.com/ado/2008/09/edm"><EntityType Name="WorkflowLogView"><Key><PropertyRef Name="REQUEST_ID"/></Key><Property Name="REQUEST_ID" Type="Edm.String" Nullable="false"/><Property Name="EMPLOYEE_ID" Type="Edm.String"/><Property Name="EMPLOYEE_NAME" Type="Edm.String"/><Property Name="WORKFLOW_TYPE" Type="Edm.String"/><Property Name="WORKFLOW_STATUS" Type="Edm.String"/><Property Name="CLASS_ID" Type="Edm.String"/><Property Name="CLASS_TITLE" Type="Edm.String"/><Property Name="CLASS_START_DATE" Type="Edm.DateTime"/><Property Name="CLASS_END_DATE" Type="Edm.DateTime"/><Property Name="CREATED_DATE" Type="Edm.DateTime"/></EntityType><EntityContainer Name="WorkflowReportServiceEntities" m:IsDefaultEntityContainer="true"><EntitySet Name="WorkflowLogView" EntityType="WorkflowReportService.WorkflowLogView"/></EntityContainer></Schema></edmx:DataServices></edmx:Edmx>');
				}
			});

			_mockServer.setRequests(aRequests);
			_mockServer.start();

			console.log("✅ Mock server started successfully!");
			console.log("📊 Available mock data:");
			console.log("   - Current User: Ahmed Hassan (107119)");
			console.log("   - Subordinates: 50 employees");
			console.log("   - Workflow Reports: 6 requests with various statuses");
			console.log("All backend API calls will be intercepted and mocked");
		},

		getMockServer: function() {
			return _mockServer;
		}
	};
});
