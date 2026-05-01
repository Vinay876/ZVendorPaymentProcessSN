sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("zf110.controller.InvoicePosting", {

        onSmartTableInit: function (oEvent) {
            var oSmartTable = oEvent.getSource();
            var oFilter1 = new Filter("Approval1Status", FilterOperator.EQ, true);
            var oFilter2 = new Filter("Approval2Status", FilterOperator.EQ, true);
            
            var oCombinedFilter = new Filter({
                filters: [oFilter1, oFilter2],
                and: true
            });
            oSmartTable.rebindTable();
        },

        onBeforeRebindTable: function (oEvent) {
            var mBindingParams = oEvent.getParameter("bindingParams");
            var oFilter1 = new Filter("Approval1Status", FilterOperator.EQ, true);
            var oFilter2 = new Filter("Approval2Status", FilterOperator.EQ, true);
            
            mBindingParams.filters.push(oFilter1);
            mBindingParams.filters.push(oFilter2);
        },

        onPostPress: function() {

        },

        onClearingPress: function() {
        }
    });
});