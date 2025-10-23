sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"workflowReport/workflowReport/model/models",
	"sap/ui/model/odata/v2/ODataModel"

], function (UIComponent, Device, models, ODataModel) {
	"use strict";

	return UIComponent.extend("workflowReport.workflowReport.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// Initialize mock server for local development
			var sHostname = window.location.hostname;
			var bIsLocalhost = sHostname === "localhost" || sHostname === "127.0.0.1";

			if (bIsLocalhost) {
				console.log("🔧 Running on localhost - initializing mock server");
				sap.ui.require(["workflowReport/workflowReport/localService/mockserver"], function(mockserver) {
					mockserver.init();
					console.log("✅ Mock server initialized successfully");
				});
			} else {
				console.log("🌐 Running on production server - using real backend");
			}

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// Create and set the OData model
			var oModel = new ODataModel("/lmsproject/hana/xsodata/WorkflowReportService.xsodata/");
			this.setModel(oModel);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		}
	});
});