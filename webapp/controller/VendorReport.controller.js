sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("zf110.controller.VendorReport", {
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteVendorReport").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            var sEncodedData = oEvent.getParameter("arguments").query;
            var oParams = JSON.parse(atob(sEncodedData)); // Decode Base64

            // Now use oParams to filter your OData service
            this._loadReportData(oParams);
        },

        _loadReportData: function (oParams) {
            var oModel = this.getOwnerComponent().getModel();
            var oTable = this.byId("idReportTable");
            oTable.setBusy(true);

            // Create Filters based on passed oParams
            var aFilters = [
                new sap.ui.model.Filter("CompanyCode", "EQ", oParams.company)
            ];

            oModel.read("/ZOpenVendorVH", {
                filters: aFilters,
                success: function (oData) {
                    var oReportModel = new JSONModel(oData);
                    this.getView().setModel(oReportModel, "reportModel");
                    oTable.setBusy(false);
                }.bind(this),
                error: function () {
                    oTable.setBusy(false);
                }
            });
        },

        onNavBack: function () {
            window.history.go(-1);
        }
    });
});