sap.ui.define([
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageToast"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast) {
        "use strict";

        return Controller.extend("zf110.controller.VendorReport", {
                onInit: function () {
                        var oRouter = this.getOwnerComponent().getRouter();
                        oRouter.getRoute("RouteVendorReport").attachPatternMatched(this._onObjectMatched, this);
                },
                _onObjectMatched: function (oEvent) {
                        var sEncodedData = oEvent.getParameter("arguments").query;
                        if (sEncodedData) {
                                try {
                                        var sDecodedData = decodeURIComponent(atob(sEncodedData));
                                        var oParams = JSON.parse(sDecodedData);
                                        this._loadReportData(oParams);
                                } catch (e) {
                                        console.error("Failed to decode navigation data", e);
                                }
                        }
                },

                _loadReportData: function (oParams) {
                        var oModel = this.getOwnerComponent().getModel();
                        var oTable = this.byId("idReportTable");
                        oTable.setBusy(true);

                        var aFilters = [];
                        if (oParams.company) {
                                aFilters.push(new Filter("CompanyCode", FilterOperator.EQ, oParams.company));
                        }

                        // if (oParams.account) {
                        //         aFilters.push(new Filter("AccountingDocument", FilterOperator.EQ, oParams.account));
                        // }

                        if (oParams.currency) {
                                aFilters.push(new Filter("TransactionCurrency", FilterOperator.EQ, oParams.currency));
                        }

                        // if (oParams.rundate) {
                        //         aFilters.push(new Filter("PostingDate", FilterOperator.EQ, oParams.rundate));
                        // }

                        if (oParams.msme) {
                                aFilters.push(new Filter("IndustryType", FilterOperator.EQ, oParams.msme));
                        }

                        if (oParams.vendors && oParams.vendors.length > 0) {
                                var aVendorFilters = oParams.vendors.map(s => new Filter("Supplier", FilterOperator.EQ, s));
                                aFilters.push(new Filter({ filters: aVendorFilters, and: false }));
                        }

                        if (oParams.profitCenters && oParams.profitCenters.length > 0) {
                                var aPCFilters = oParams.profitCenters.map(s => new Filter("ProfitCenter", FilterOperator.EQ, s));
                                aFilters.push(new Filter({ filters: aPCFilters, and: false }));
                        }
                        oModel.read("/ZFI_VendorOpenReport", {
                                filters: aFilters,
                                success: function (oData) {
                                        var aItems = oData.results;
                                        var aProcessedData = [];
                                        var mGroups = {};
                                        aItems.forEach(function (item) {
                                                if (!mGroups[item.Supplier]) {
                                                        mGroups[item.Supplier] = { items: [], total: 0 };
                                                }
                                                mGroups[item.Supplier].items.push(Object.assign({}, item, { isSelected: false, isTotalRow: false }));
                                                mGroups[item.Supplier].total += parseFloat(item.AmountInCompanyCodeCurrency || 0);
                                        });
                                        Object.keys(mGroups).sort().forEach(function (supplierId) {
                                                var oGroup = mGroups[supplierId];
                                                aProcessedData = aProcessedData.concat(oGroup.items);
                                                aProcessedData.push({
                                                        isTotalRow: true,
                                                        isSelected: false,
                                                        Supplier: supplierId,
                                                        CompanyCode: "SUB-TOTAL",
                                                        AmountInCompanyCodeCurrency: oGroup.total.toFixed(2),
                                                        TransactionCurrency: oGroup.items[0] ? oGroup.items[0].TransactionCurrency : "",
                                                        AccountingDocument: "",
                                                        FiscalYear: "",
                                                        ProfitCenter: ""
                                                });
                                        });

                                        this.getView().setModel(new JSONModel(aProcessedData), "reportModel");
                                        oTable.setBusy(false);
                                }.bind(this),
                                error: function () {
                                        oTable.setBusy(false);
                                        MessageToast.show("Failed to fetch records.");
                                }
                        });
                },

                onSaveReport: function () {
                        var aData = this.getView().getModel("reportModel").getData();
                        var aToSave = aData.filter(item => !item.isTotalRow && item.isSelected);

                        if (aToSave.length === 0) {
                                MessageToast.show("Please select at least one vendor item.");
                                return;
                        }

                        console.log("Proceeding to save:", aToSave);
                        MessageToast.show("Saving " + aToSave.length + " items...");

                        //saving logic
                },

                onNavBack: function () {
                        var oHistory = sap.ui.core.routing.History.getInstance();
                        var sPreviousHash = oHistory.getPreviousHash();

                        if (sPreviousHash !== undefined) {
                                window.history.go(-1);
                        } else {
                                this.getOwnerComponent().getRouter().navTo("RouteView1", {}, true);
                        }
                }
        });
});