sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/SearchField",
    "sap/m/Label",
    "sap/ui/table/Column",
    "sap/m/Text",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/ui/model/type/String",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "sap/m/BusyDialog",
    "sap/m/Input",
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/comp/filterbar/FilterGroupItem"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("zf110.controller.View1", {

        onInit: function () {
            this.byId("idDate").setDateValue(new Date());
            this.byId("idDate").setEditable(false);
            this.byId("companyCode").setEditable(false);
            this.byId("idCurrency").setEditable(false);
            this.byId("idAccount").setEditable(false);
            this.byId("idIdent").setEditable(false);
            this.byId("idVendor").setEditable(false);
            this.byId("idProfit").setEditable(false);
            this.byId("idMSME").setEditable(false);

        },

        onCreateNew: function () {

            this.byId("companyCode").setEditable(true);
            this.byId("idDate").setEditable(true);
            this.byId("idAccount").setEditable(true);
            this.byId("idVendor").setEditable(true);
            this.byId("idProfit").setEditable(true);
            this.byId("idMSME").setEditable(true);

        },

        onProfitVH: function () {

            MessageToast.show("Profit Center Value Help");

        },

        onMSMEVH: function () {

            MessageToast.show("MSME Vendor Value Help");

        },

        vhformatter: (sOriginalText) => {
            var sWhitespace = " ",
                sUnicodeWhitespaceCharacter = "\u00A0";
            if (typeof sOriginalText !== "string") {
                return sOriginalText;
            }

            return sOriginalText
                .replaceAll((sWhitespace + sWhitespace), (sWhitespace + sUnicodeWhitespaceCharacter)); // replace spaces
        },
        onBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("page1", null, true);
            }
        },

        onCompanyCodeVH: function () {
            var oView = this.getView();
            var that = this;
            var oModel = this.getOwnerComponent().getModel();

            if (!this._oCompanyCodeDialog) {
                this._oCompanyCodeDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                    title: "Company Code",
                    supportMultiselect: false,
                    key: "CompanyCode",
                    descriptionKey: "CompanyCodeName",
                    ok: function (oEvent) {
                        var aTokens = oEvent.getParameter("tokens");
                        if (aTokens.length > 0) {
                            oView.byId("companyCode").setValue(aTokens[0].getKey());
                        }
                        this.close();
                    },
                    cancel: function () { this.close(); }
                });
                var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
                    advancedMode: true,
                    filterGroupItems: [
                        new sap.ui.comp.filterbar.FilterGroupItem({
                            groupName: "G1",
                            name: "CompanyCode",
                            label: "Company Code",
                            control: new sap.m.Input()
                        }),
                        new sap.ui.comp.filterbar.FilterGroupItem({
                            groupName: "G1",
                            name: "CompanyCodeName",
                            label: "Company Name",
                            control: new sap.m.Input()
                        })
                    ], search: function (oEvt) {
                        var aSelectionSet = oEvt.getParameter("selectionSet");
                        var sCode = aSelectionSet[0].getValue().toLowerCase();
                        var sName = aSelectionSet[1].getValue().toLowerCase();

                        var oTable = that._oCompanyCodeDialog.getTable();
                        var oBinding = oTable.getBinding("rows");

                        var aFilters = [];
                        if (sCode) {
                            aFilters.push(new sap.ui.model.Filter("CompanyCode", "Contains", sCode));
                        }
                        if (sName) {
                            aFilters.push(new sap.ui.model.Filter("CompanyCodeName", "Contains", sName));
                        }

                        oBinding.filter(aFilters);
                    }
                });

                this._oCompanyCodeDialog.setFilterBar(oFilterBar);
                var oTable = this._oCompanyCodeDialog.getTable();
                var oColModel = new sap.ui.model.json.JSONModel({
                    cols: [
                        { label: "Company Code", template: "CompanyCode" },
                        { label: "Company Name", template: "CompanyCodeName" }
                    ]
                })
                oTable.setModel(oColModel, "columns");
            }

            this._oCompanyCodeDialog.open();
            this._oCompanyCodeDialog.getTable().setBusy(true);
            oModel.read("/ZCDS_Comp_AccountVH", {
                urlParameters: {
                    "$select": "CompanyCode,CompanyCodeName"
                },
                success: function (oData) {

                    var aUnique = oData.results.reduce(function (acc, current) {

                        var x = acc.find(function (item) {
                            return item.CompanyCode === current.CompanyCode;
                        });

                        if (!x) {
                            acc.push(current);
                        }

                        return acc;

                    }, []);

                    var oLocalModel = new sap.ui.model.json.JSONModel({
                        results: aUnique
                    });

                    var oTable = that._oCompanyCodeDialog.getTable();

                    oTable.setModel(oLocalModel);
                    oTable.bindRows("/results");

                    that._oCompanyCodeDialog.update();

                    that._oCompanyCodeDialog.setTitle(
                        "Company Code (" + aUnique.length + ")"
                    );

                    oTable.setBusy(false);
                },
                error: function () {
                    that._oCompanyCodeDialog.getTable().setBusy(false);
                }
            });
        },

        onAccountVH: function () {
            var oView = this.getView();
            var that = this;
            var sCompanyCode = oView.byId("companyCode").getValue();

            if (!this._oAccountIDDialog) {
                this._oAccountIDDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                    title: "Account ID",
                    supportMultiselect: false,
                    key: "HouseBankAccount",
                    descriptionKey: "HouseBankAccountDescription",
                    ok: function (oEvent) {
                        var aTokens = oEvent.getParameter("tokens");
                        if (aTokens && aTokens.length > 0) {
                            var sSelectedAccount = aTokens[0].getKey();
                            oView.byId("idAccount").setValue(sSelectedAccount);
                            var oRowData = aTokens[0].getCustomData().find(d => d.getKey() === "row").getValue();

                            if (oRowData && oRowData.BankAccountCurrency) {
                                oView.byId("idCurrency").setValue(oRowData.BankAccountCurrency);
                            }
                        }
                        this.close();
                    },
                    cancel: function () {
                        that._oAccountIDDialog.close();
                    }
                });

                var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
                    advancedMode: true,
                    filterGroupItems: [
                        new sap.ui.comp.filterbar.FilterGroupItem({
                            groupName: "gn1",
                            name: "n1",
                            label: "Account ID",
                            control: new sap.m.Input()
                        }),
                        new sap.ui.comp.filterbar.FilterGroupItem({
                            groupName: "gn1",
                            name: "n2",
                            label: "Description",
                            control: new sap.m.Input()
                        }),
                        new sap.ui.comp.filterbar.FilterGroupItem({
                            groupName: "gn1",
                            name: "n3",
                            label: "G/L Account",
                            control: new sap.m.Input()
                        })
                    ],
                    search: function (oEvt) {
                        var aSelectionSet = oEvt.getParameter("selectionSet");
                        var sAccountID = aSelectionSet[0].getValue();
                        var sDescription = aSelectionSet[1].getValue();
                        var sGlaccount = aSelectionSet[2].getValue();
                        that._applyFilters(sCompanyCode, sAccountID, sDescription, sGlaccount);
                    }
                });

                this._oAccountIDDialog.setFilterBar(oFilterBar);

                var oTable = this._oAccountIDDialog.getTable();
                oTable.setModel(this.getOwnerComponent().getModel());
                var oColModel = new sap.ui.model.json.JSONModel({
                    cols: [
                        { label: "House Bank", template: "HouseBank" },
                        { label: "Account ID", template: "HouseBankAccount" },
                        { label: "Description", template: "HouseBankAccountDescription" },
                        { label: "G/L Account", template: "GLAccount" },
                        { label: "Bank Account Currency", template: "BankAccountCurrency" }
                    ]
                });
                oTable.setModel(oColModel, "columns");
            }
            this._applyFilters(sCompanyCode, "", "", "");

            this._oAccountIDDialog.open();
        },
        _applyFilters: function (sCompanyCode, sAccountID, sDescription, sGlaccount) {
            var oTable = this._oAccountIDDialog.getTable();
            var aFilters = [];
            if (sCompanyCode) {
                aFilters.push(new sap.ui.model.Filter("CompanyCode", sap.ui.model.FilterOperator.EQ, sCompanyCode));
            }
            if (sAccountID) {
                aFilters.push(new sap.ui.model.Filter("HouseBankAccount", sap.ui.model.FilterOperator.Contains, sAccountID));
            }
            if (sDescription) {
                aFilters.push(new sap.ui.model.Filter("HouseBankAccountDescription", sap.ui.model.FilterOperator.Contains, sDescription));
            }
            if (sGlaccount) {
                aFilters.push(new sap.ui.model.Filter("GLAccount", sap.ui.model.FilterOperator.Contains, sGlaccount));
            }
            oTable.bindRows({
                path: "/ZCDS_Comp_AccountVH",
                filters: aFilters,
                parameters: { "$top": "5000" }
            });
            var oBinding = oTable.getBinding("rows");

            if (oBinding) {
                oBinding.attachDataReceived(function () {
                    this._oAccountIDDialog.update();
                }.bind(this));
            }
        },
        onSubmit: function () {
            var oView = this.getView();
            var oModel = this.getOwnerComponent().getModel();
            var oCurrInput = oView.byId("idCurrency");
            var oCompInput = oView.byId("companyCode");

            var sCurr = oCurrInput.getValue();
            var sComp = oCompInput.getValue();
            var sAcc = oView.byId("idAccount").getValue();
            var sRundate = oView.byId("idDate").getValue();

            if (!sCurr || !sComp) {
                if (!sCurr) oCurrInput.setValueState("Error");
                if (!sComp) oCompInput.setValueState("Error");
                sap.m.MessageToast.show("Please fill in all mandatory fields.");
                return;
            }

            oCurrInput.setValueState("None");
            oCompInput.setValueState("None");
            oView.setBusy(true);

            var aAccountFilters = [
                new sap.ui.model.Filter("CompanyCode", sap.ui.model.FilterOperator.EQ, sComp),
                new sap.ui.model.Filter("HouseBankAccount", sap.ui.model.FilterOperator.EQ, sAcc)
            ];

            oModel.read("/ZCDS_Comp_AccountVH", {
                filters: aAccountFilters,
                success: function (oDataResults) {
                    oView.setBusy(false);
                    var oAccountInfo = oDataResults.results[0] || {};

                    var aVendors = oView.byId("idVendor").getTokens().map(function (oToken) {
                        return oToken.getKey();
                    });
                    var aProfitCenters = oView.byId("idProfit").getTokens().map(function (oToken) {
                        return oToken.getKey();
                    });

                    var sMSME = oView.byId("idMSME").getSelectedKey();
                    var oNavigationData = {
                        company: sComp,
                        account: sAcc,
                        houseBank: oAccountInfo.HouseBank || "",
                        glAccount: oAccountInfo.GLAccount || "",
                        currency: sCurr,
                        rundate: sRundate,
                        vendors: aVendors,
                        profitCenters: aProfitCenters,
                        msme: sMSME
                    };

                    try {
                        var sJsonData = JSON.stringify(oNavigationData);
                        var sEncodedData = btoa(encodeURIComponent(sJsonData));
                        this.getOwnerComponent().getRouter().navTo("RouteVendorReport", {
                            query: sEncodedData
                        });
                    } catch (e) {
                        sap.m.MessageBox.error("Error encoding navigation data.");
                    }
                }.bind(this),
                error: function () {
                    oView.setBusy(false);
                    sap.m.MessageToast.show("Failed to fetch account details.");
                }
            });
        },
        onInputChange: function (oEvent) {
            var oInput = oEvent.getSource();
            if (oInput.getValue()) {
                oInput.setValueState("None");
            }
        },
        // onCurrencyVH: function () {
        //     var oView = this.getView();
        //     var that = this;
        //     var oModel = this.getOwnerComponent().getModel();

        //     if (!this._oCurrencyDialog) {
        //         this._oCurrencyDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
        //             title: "TransactionCurrency",
        //             supportMultiselect: false,
        //             key: "TransactionCurrency",

        //             ok: function (oEvent) {
        //                 var aTokens = oEvent.getParameter("tokens");
        //                 if (aTokens.length > 0) {
        //                     oView.byId("idCurrency").setValue(aTokens[0].getKey());
        //                 }
        //                 this.close();
        //             },
        //             cancel: function () { this.close(); }
        //         });
        //         var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
        //             advancedMode: true,
        //             filterGroupItems: [
        //                 new sap.ui.comp.filterbar.FilterGroupItem({
        //                     groupName: "G1",
        //                     name: "Currency",
        //                     label: "Currency Code",
        //                     control: new sap.m.Input()
        //                 })
        //             ],
        //             search: function (oEvt) {
        //                 var sSearchValue = oEvt.getParameter("selectionSet")[0].getValue();
        //                 var oTable = that._oCurrencyDialog.getTable();
        //                 var oBinding = oTable.getBinding("rows");

        //                 if (sSearchValue) {
        //                     oBinding.filter([
        //                         new sap.ui.model.Filter("TransactionCurrency", sap.ui.model.FilterOperator.Contains, sSearchValue)
        //                     ]);
        //                 } else {
        //                     oBinding.filter([]);
        //                 }
        //             }
        //         });
        //         this._oCurrencyDialog.setFilterBar(oFilterBar);

        //         var oTable = this._oCurrencyDialog.getTable();

        //         var oColModel = new sap.ui.model.json.JSONModel({
        //             cols: [
        //                 { label: "Transaction Currency", template: "TransactionCurrency" },
        //             ]
        //         });
        //         oTable.setModel(oColModel, "columns");
        //     }

        //     this._oCurrencyDialog.open();
        //     this._oCurrencyDialog.getTable().setBusy(true);

        //     oModel.read("/ZOpenVendorVH", {
        //         urlParameters: {
        //             "$select": "TransactionCurrency"
        //         },
        //         success: function (oData) {
        //             var aUnique = oData.results.reduce(function (acc, current) {
        //                 var x = acc.find(item => item.TransactionCurrency === current.TransactionCurrency);
        //                 if (!x) {
        //                     return acc.concat([current]);
        //                 } else {
        //                     return acc;
        //                 }
        //             }, []);
        //             var oLocalModel = new sap.ui.model.json.JSONModel();
        //             oLocalModel.setData(aUnique);

        //             var oTable = that._oCurrencyDialog.getTable();
        //             oTable.setModel(oLocalModel);
        //             that._oCurrencyDialog.update();
        //             oTable.bindRows("/");

        //             oTable.setBusy(false);
        //         },
        //         error: function () {
        //             that._oCurrencyDialog.getTable().setBusy(false);
        //         }
        //     });
        // },


        onVendorVH: function () {
            var oView = this.getView();
            var that = this;
            var oModel = this.getOwnerComponent().getModel();

            var sCompanyCode = oView.byId("companyCode").getValue();
            var sCurrency = oView.byId("idCurrency").getValue();

            if (!this._oVendorDialog) {
                this._oVendorDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                    title: "Vendor",
                    supportMultiselect: true,
                    key: "Supplier",
                    descriptionKey: "SupplierFullName",
                    ok: function (oEvent) {
                        var aTokens = oEvent.getParameter("tokens");
                        var oMultiInput = oView.byId("idVendor");
                        oMultiInput.setTokens(aTokens);

                        this.close();
                    },
                    cancel: function () { this.close(); }
                });

                var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
                    advancedMode: true,
                    filterGroupItems: [
                        new sap.ui.comp.filterbar.FilterGroupItem({
                            groupName: "G1",
                            name: "Supplier",
                            label: "Vendor ID",
                            control: new sap.m.Input()
                        }),
                        new sap.ui.comp.filterbar.FilterGroupItem({
                            groupName: "G1",
                            name: "SupplierFullName",
                            label: "Vendor Name",
                            control: new sap.m.Input()
                        })
                    ],
                    search: function (oEvt) {
                        var aSelectionSet = oEvt.getParameter("selectionSet");
                        var sID = aSelectionSet[0].getValue();
                        var sName = aSelectionSet[1].getValue();

                        var oTable = that._oVendorDialog.getTable();
                        var oBinding = oTable.getBinding("rows");
                        var aFilters = [];

                        if (sID) {
                            aFilters.push(new sap.ui.model.Filter("Supplier", "Contains", sID));
                        }
                        if (sName) {
                            aFilters.push(new sap.ui.model.Filter("SupplierFullName", "Contains", sName));
                        }

                        oBinding.filter(aFilters);
                    }
                });

                this._oVendorDialog.setFilterBar(oFilterBar);

                var oTable = this._oVendorDialog.getTable();
                var oColModel = new sap.ui.model.json.JSONModel({
                    cols: [
                        { label: "Vendor", template: "Supplier" },
                        { label: "Vendor Name", template: "SupplierFullName" }
                    ]
                });
                oTable.setModel(oColModel, "columns");
            }

            this._oVendorDialog.setTokens(this.getView().byId("idVendor").getTokens());
            this._oVendorDialog.open();
            var oTable = this._oVendorDialog.getTable();
            oTable.setBusy(true);

            var aODataFilters = [];
            if (sCompanyCode) {
                aODataFilters.push(new sap.ui.model.Filter("CompanyCode", "EQ", sCompanyCode));
            }
            if (sCurrency) {
                aODataFilters.push(new sap.ui.model.Filter("TransactionCurrency", "EQ", sCurrency));
            }

            oModel.read("/ZOpenVendorVH", {
                filters: aODataFilters,
                urlParameters: {
                    "$select": "Supplier,SupplierFullName"
                },
                success: function (oData) {
                    var aItems = oData.results;
                    var oLocalModel = new sap.ui.model.json.JSONModel({
                        results: aItems
                    });
                    oTable.setModel(oLocalModel);
                    oTable.bindRows("/results");

                    that._oVendorDialog.update();
                    that._oVendorDialog.setTitle("Vendor (" + oData.length + ")");
                    oTable.setBusy(false);
                },
                error: function () {
                    oTable.setBusy(false);
                    sap.m.MessageToast.show("Error fetching vendors.");
                }
            });
        },
        onProfitVH: function () {
            var oView = this.getView();
            var that = this;
            var oModel = this.getOwnerComponent().getModel();

            var oMultiInput = oView.byId("idProfit");
            var sCompanyCode = oView.byId("companyCode").getValue();
            var sCurrency = oView.byId("idCurrency").getValue();
            var sAccountID = oView.byId("idAccount").getValue();
            var aVendorTokens = oView.byId("idVendor").getTokens();

            if (!this._oProfitCenterDialog) {
                this._oProfitCenterDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                    title: "Select Profit Center",
                    supportMultiselect: true,
                    key: "ProfitCenter",
                    ok: function (oEvent) {
                        var aTokens = oEvent.getParameter("tokens");
                        oMultiInput.setTokens(aTokens);
                        this.close();
                    },
                    cancel: function () {
                        this.close();
                    }
                });

                var oTable = this._oProfitCenterDialog.getTable();
                var oColModel = new sap.ui.model.json.JSONModel({
                    cols: [
                        { label: "Profit Center", template: "ProfitCenter" },
                        { label: "Account ID", template: "HouseBankAccount" },
                        { label: "Vendor", template: "Supplier" },
                    ]
                });
                oTable.setModel(oColModel, "columns");
            }

            this._oProfitCenterDialog.setTokens(oMultiInput.getTokens());
            this._oProfitCenterDialog.open();

            var oTable = this._oProfitCenterDialog.getTable();
            oTable.setBusy(true);

            var aFilters = [];
            if (sCompanyCode) {
                aFilters.push(new sap.ui.model.Filter("CompanyCode", "EQ", sCompanyCode));
            }
            if (sCurrency) {
                aFilters.push(new sap.ui.model.Filter("TransactionCurrency", "EQ", sCurrency));
            }
            if (sAccountID) {
                aFilters.push(new sap.ui.model.Filter("HouseBankAccount", "EQ", sAccountID));
            }
            if (aVendorTokens.length > 0) {
                var aVendorFilters = aVendorTokens.map(function (oToken) {
                    return new sap.ui.model.Filter("Supplier", "EQ", oToken.getKey());
                });
                aFilters.push(new sap.ui.model.Filter({
                    filters: aVendorFilters,
                    and: false
                }));
            }

            oModel.read("/ZCDS_ProfitCenterVH", {
                filters: aFilters,
                urlParameters: {
                    "$select": "ProfitCenter,HouseBankAccount,Supplier"
                },
                success: function (oData) {
                    var aItems = oData.results;
                    var aUniqueProfitCenters = aItems.filter(function (vItem, iIndex, aArray) {
                        return aArray.findIndex(function (vSearch) {
                            return vSearch.ProfitCenter === vItem.ProfitCenter;
                        }) === iIndex;
                    });

                    var oLocalModel = new sap.ui.model.json.JSONModel({ results: aUniqueProfitCenters });
                    oTable.setModel(oLocalModel);
                    oTable.bindRows("/results");
                    that._oProfitCenterDialog.update();
                    oTable.setBusy(false);
                },
                error: function () {
                    oTable.setBusy(false);
                    sap.m.MessageToast.show("Error fetching vendors.");
                }
            });
        },
        onPostProposal: function () {
            var oView = this.getView();
            var oModel = this.getOwnerComponent().getModel();
            this.getOwnerComponent().getRouter().navTo("RouteApprovalPosting");
        },
        onInvoicePosting:function () {
            var oView = this.getView();
            var oModel = this.getOwnerComponent().getModel();
            this.getOwnerComponent().getRouter().navTo("RouteInvoicePosting");
        }

    });
});