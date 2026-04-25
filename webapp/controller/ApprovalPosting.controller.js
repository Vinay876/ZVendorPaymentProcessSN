sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("zf110.controller.ApprovalPosting", {
        onInit() {
            this._oModel = this.getOwnerComponent().getModel();
        },
        onGoPress: function () {
            // Trigger SmartTable refresh
            this.getView().byId("idSmartTable").rebindTable();
        },

        onBeforeRebindTable: function (oEvent) {
            var mBindingParams = oEvent.getParameter("bindingParams");
            var sIdValue = this.getView().byId("idIdentificationInput").getValue();

            if (sIdValue) {
                var oFilter = new Filter("IdNo", FilterOperator.EQ, sIdValue);
                mBindingParams.filters.push(oFilter);
            }
        }
    });
});