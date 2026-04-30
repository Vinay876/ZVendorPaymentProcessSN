sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], (Controller, Filter, FilterOperator, MessageToast) => {
    "use strict";

    return Controller.extend("zf110.controller.ApprovalPosting", {
        onInit() {
            this._oModel = this.getOwnerComponent().getModel();
        },

        onGoPress: function () {
            this.getView().byId("idSmartTable").rebindTable();
        },

        onBeforeRebindTable: function (oEvent) {
            var mBindingParams = oEvent.getParameter("bindingParams");
            var sIdValue = this.getView().byId("idIdentificationInput").getValue();
            var iSelectedIndex = this.getView().byId("idUserRadioGroup").getSelectedIndex();
            if (sIdValue) {
                var oIdFilter = new Filter("IdNo", FilterOperator.Contains, sIdValue);
                mBindingParams.filters.push(oIdFilter);
            }

            if (iSelectedIndex === 1) {
            }
        },

        onApprovePress: function () {
            var oSmartTable = this.getView().byId("idSmartTable");
            var oTable = oSmartTable.getTable();
            var aSelectedIndices = oTable.getSelectedIndices();
            debugger;

            if (aSelectedIndices.length === 0) {
                sap.m.MessageBox.error("No Entry Selected");
                return;
            }

            sap.ui.core.BusyIndicator.show();

            aSelectedIndices.forEach(function (iIndex) {
                var oContext = oTable.getContextByIndex(iIndex);
                var sGuid = oContext.getProperty("Db_Key");

                this._oModel.create('/approveProposal', {}, {
                    urlParameters: {
                        "db_key": "guid'" + sGuid + "'"
                    },
                    headers: {
                        "If-Match": "*",
                        "Prefer": "handling=strict"
                    },
                    success: function (oData, response) {
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageBox.success("Proposal Approved successfully");
                        oSmartTable.rebindTable();
                    }.bind(this),
                    error: function (oError) {
                        sap.ui.core.BusyIndicator.hide();
                        try {
                            var sMsg = JSON.parse(oError.responseText).error.message.value;
                            sap.m.MessageBox.error(sMsg);
                        } catch (e) {
                            sap.m.MessageBox.error("Approval failed. Check if 'db_key' is the correct parameter name in metadata.");
                        }
                    }.bind(this)
                });
            }.bind(this));
        },

        onDeletePress: function () {
            var oTable = this.getView().byId("_IDGenTable");
            var aSelectedIndices = oTable.getSelectedIndices();

            if (aSelectedIndices.length === 0) {
                MessageToast.show("Please select at least one proposal to reject.");
                return;
            }

            MessageToast.show("Rejecting selected proposals...");
        }
    });
});