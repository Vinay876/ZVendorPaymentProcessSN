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

                formatRowClass: function (bIsTotalRow) {
                        debugger;
                        return bIsTotalRow ? "background" : "";
                },
                _loadReportData: function (oParams) {
                        var oModel = this.getOwnerComponent().getModel();
                        var oTable = this.byId("idReportTable");
                        oTable.setBusy(true);

                        var aFilters = [];
                        if (oParams.company) {
                                aFilters.push(new Filter("CompanyCode", FilterOperator.EQ, oParams.company));
                        }

                        if (oParams.currency) {
                                aFilters.push(new Filter("TransactionCurrency", FilterOperator.EQ, oParams.currency));
                        }

                        // if (oParams.rundate) {
                        //         aFilters.push(new Filter("PostingDate", FilterOperator.EQ, oParams.rundate));
                        // }

                        if (oParams.msme) {
                                aFilters.push(new Filter("IndustryType", FilterOperator.EQ, oParams.msme));
                        }
                        // aFilters.push(new sap.ui.model.Filter("IdNo", sap.ui.model.FilterOperator.EQ, ""));

                        if (oParams.vendors && oParams.vendors.length > 0) {
                                var aVendorFilters = oParams.vendors.map(s => new Filter("Supplier", FilterOperator.EQ, s));
                                aFilters.push(new Filter({ filters: aVendorFilters, and: false }));
                        }
                        if (oParams.profitCenters && oParams.profitCenters.length > 0) {
                                var aPCFilters = oParams.profitCenters.map(function (s) {
                                        var sPaddedPC = String(s).padStart(10, '0');

                                        return new sap.ui.model.Filter("ProfitCenter", sap.ui.model.FilterOperator.EQ, sPaddedPC);
                                });
                                if (aPCFilters.length > 0) {
                                        aFilters.push(new sap.ui.model.Filter({
                                                filters: aPCFilters,
                                                and: false
                                        }));
                                }
                        }

                        oModel.read("/ZFI_VendorOpenReport", {
                                filters: aFilters,
                                urlParameters: {
                                        "$top": 5000
                                },
                                success: function (oData) {
                                        var aItems = oData.results;
                                        var aProcessedData = [];
                                        var mGroups = {};

                                        var fGrandTotalInvoice = 0;
                                        var fGrandTotalBalanceToBePAid = 0;
                                        var sFixedHouseBank = oParams.houseBank || "";
                                        var sFixedHouseAccount = oParams.account || "";
                                        var sFixedGLAccount = oParams.glAccount || "";

                                        aItems.forEach(function (item) {
                                                if (!mGroups[item.Supplier]) {
                                                        mGroups[item.Supplier] = {
                                                                items: [],
                                                                total: 0,
                                                                totalAmountAlreadyPaid: 0,
                                                                totalbalancetobepaid: 0,
                                                                totalamountproposal: 0
                                                        };
                                                }
                                                var oNewItem = Object.assign({}, item, {
                                                        isSelected: false,
                                                        isTotalRow: false,
                                                        HouseBank: sFixedHouseBank,
                                                        HouseBankAccount: sFixedHouseAccount,
                                                        GLAccount: sFixedGLAccount
                                                });
                                                mGroups[item.Supplier].items.push(oNewItem);
                                        });
                                        Object.keys(mGroups).sort().forEach(function (supplierId) {
                                                var oGroup = mGroups[supplierId];

                                                var mSeenREKeys = {};

                                                oGroup.items.forEach(function (item) {
                                                        var sKey = item.JournalEntryType + "_" + item.journalEntry;
                                                        var bIsRE = item.JournalEntryType === "RE";

                                                        if (bIsRE && mSeenREKeys[sKey]) {
                                                                item._displayInvoiceValue = "";
                                                                item._displayAmountAlreadyPaid = "";
                                                                item._displayBalanceToBePaid = "";
                                                                item._displayAmountProposal = "";
                                                                item._isDuplicate = true;
                                                        } else {
                                                                item._displayInvoiceValue = item.InvoiceValue;
                                                                item._displayAmountAlreadyPaid = item.AmountAlreadyPaid;
                                                                item._displayBalanceToBePaid = item.BalanceToBePaid;
                                                                item._displayAmountProposal = item.AmountProposal;
                                                                item._isDuplicate = false;

                                                                var invVal = parseFloat(item.InvoiceValue || 0);
                                                                var paidVal = parseFloat(item.AmountAlreadyPaid || 0);
                                                                var balVal = parseFloat(item.BalanceToBePaid || 0);
                                                                var propVal = parseFloat(item.AmountProposal || 0);

                                                                oGroup.total += invVal;
                                                                oGroup.totalAmountAlreadyPaid += paidVal;
                                                                oGroup.totalbalancetobepaid += balVal;
                                                                oGroup.totalamountproposal += propVal;

                                                                fGrandTotalInvoice += invVal;
                                                                fGrandTotalBalanceToBePAid += balVal;

                                                                if (bIsRE) {
                                                                        mSeenREKeys[sKey] = true;
                                                                }
                                                        }
                                                });

                                                aProcessedData = aProcessedData.concat(oGroup.items);

                                                aProcessedData.push({
                                                        isTotalRow: true,
                                                        isSelected: false,
                                                        Supplier: supplierId,
                                                        // rowClass: "lightYellowSubtotal",
                                                        CompanyCode: "SUB TOTAL",
                                                        _displayInvoiceValue: oGroup.total.toFixed(2),
                                                        _displayAmountAlreadyPaid: oGroup.totalAmountAlreadyPaid.toFixed(2),
                                                        _displayBalanceToBePaid: oGroup.totalbalancetobepaid.toFixed(2),
                                                        _displayAmountProposal: oGroup.totalamountproposal.toFixed(2),
                                                        TransactionCurrency: oGroup.items[0] ? oGroup.items[0].TransactionCurrency : "",
                                                        HouseBank: "",
                                                        HouseBankAccount: "",
                                                        GLAccount: "",
                                                        AccountingDocument: "",
                                                        FiscalYear: "",
                                                        ProfitCenter: ""
                                                });
                                        });

                                        aProcessedData.push({
                                                isTotalRow: true,
                                                isGrandTotal: true,
                                                _groupKey: "ZZZZ",
                                                Supplier: "GRAND TOTAL",
                                                CompanyCode: "",
                                                _displayInvoiceValue: fGrandTotalInvoice.toFixed(2),
                                                _displayBalanceToBePaid: fGrandTotalBalanceToBePAid.toFixed(2),
                                                TransactionCurrency: aItems[0] ? aItems[0].TransactionCurrency : ""
                                        });

                                        this.getView().setModel(new JSONModel(aProcessedData), "reportModel");

                                        var iCheckboxCount = aProcessedData.filter(function (item) {
                                                return item.isTotalRow === false;
                                        }).length;
                                        this.getView().setModel(
                                                new sap.ui.model.json.JSONModel({ totalItems: iCheckboxCount }),
                                                "countModel"
                                        );
                                        oTable.setBusy(false);
                                }.bind(this),
                                error: function () {
                                        oTable.setBusy(false);
                                        MessageToast.show("Failed to fetch records.");
                                }
                        });
                },

                onSaveReport: function () {
                        var oReportModel = this.getView().getModel("reportModel");
                        var aData = oReportModel.getData();
                        var aToSave = aData.filter(item => !item.isTotalRow && item.isSelected);

                        if (aToSave.length === 0) {
                                MessageToast.show("Please select at least one vendor item.");
                                return;
                        }

                        var oView = this.getView();
                        var oModel = oView.getModel();
                        var oTable = oView.byId("idReportTable");
                        oView.setBusy(true);

                        oModel.setUseBatch(true);
                        var sGroupId = "saveProposalGroup1";
                        aToSave.forEach(function (oData) {
                                var oPayload = {
                                        "CompanyCode": oData.CompanyCode,
                                        "JournalEntry": oData.journalEntry,
                                        "JournalEntryType": oData.JournalEntryType,
                                        "Supplier": oData.Supplier,
                                        "SupplierFullName": oData.SupplierFullName,
                                        "FiscalYear": oData.FiscalYear,
                                        "FiscalPeriod": oData.FiscalPeriod,
                                        "IndustryType": oData.IndustryType,
                                        "InvoiceDate": oData.InvoiceDate,
                                        "PostingDate": oData.PostingDate,
                                        "PaymentDays": oData.Paymentdays,
                                        "InvoiceNo": oData.invoice_No,
                                        "InvoiceValue": oData.invoice_Value,
                                        "HouseBank": oData.HouseBank,
                                        "HouseBankAccount": oData.HouseBankAccount,
                                        "GlAccount": oData.GLAccount,
                                        "BankProfitCenter": oData.BankProfitCenter,
                                        "AmountAlreadyPaid": oData.AmountAlreadyPaid,
                                        "BalanceToBePaid": oData.BalanceToBePaid,
                                        "AmountProposal": oData.AmountProposal,
                                        "Rate": oData.Rate,
                                        "ProfitCenter": oData.ProfitCenter,
                                        "TransactionCurrency": oData.TransactionCurrency,
                                        "InvoiceDocNumber": oData.InvoiceDocumentNumber,
                                        "PoHistoryDocItem": oData.PurchasingHistoryDocumentItem,
                                        "PoDocumentDate": oData.PoDocumentDate,
                                        "PoPostingDate": oData.PoPostingDate,
                                        "Material": oData.Material,
                                        "MaterialType": oData.MaterialType,
                                        "PoQtyUnit": oData.PurchaseOrderQuantityUnit,
                                        "InvoiceValuePo": oData.InvoiceValue,
                                        "Currency": oData.Currency,
                                        "PurchaseOrder": oData.PurchaseOrder,
                                        "ActualBilledQty": oData.ActualBilledQuantity,
                                        "GrnNumber": oData.GRNNumber,
                                        "Batch": oData.Batch,
                                        "GrnQuantity": oData.GRNQuantity,
                                        "ConsumptionQuantity": oData.ConsumptionQuantity,
                                        "BalanceQuantity": oData.BalanceQuantity,
                                        "ConsumptionPercentage": oData.ConsumptionPercentage,
                                        "ProposalStatus": "PENDING"
                                };

                                oModel.create("/VendorPayment", oPayload, {
                                        groupId: sGroupId
                                });
                        });
                        oModel.submitChanges({
                                groupId: sGroupId,
                                success: function (oData) {
                                        oView.setBusy(false);
                                        MessageToast.show("Data saved successfully for " + aToSave.length + " items.");
                                        oTable.removeSelections();
                                        window.location.reload();
                                }.bind(this),
                                error: function (oError) {
                                        oView.setBusy(false);
                                        MessageToast.error("Error occurred while saving data.");
                                }
                        });
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