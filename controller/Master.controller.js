sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"../model/formatter"
], function (BaseController, JSONModel, History, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter) {
	"use strict";
	var Yetki;

	return BaseController.extend("eve.ui.Z_MMASRAF03.controller.Master", {

		formatter: formatter,

		onInit: function () {
			
		
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			this._oGroupFunctions = {
				Wrbtr: function (oContext) {
					var iNumber = oContext.getProperty('Wrbtr'),
						key, text;
					if (iNumber <= 20) {
						key = "LE20";
						text = this.getResourceBundle().getText("masterGroup1Header1");
					} else {
						key = "GT20";
						text = this.getResourceBundle().getText("masterGroup1Header2");
					}
					return {
						key: key,
						text: text
					};
				}.bind(this)
			};

			this._oList = oList;
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.setModel(oViewModel, "masterView");
			oList.attachEventOnce("updateFinished", function () {
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.getView().addEventDelegate({
				onBeforeFirstShow: function () {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().getRoute("RefreshMaster").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);
				
					this.GetRole();
				setTimeout(function() {
			this.onSearch1();
						}.bind(this), 1000);
						
					sap.ui.getCore().getEventBus().subscribe("channelName", "eventName", this.onEventTriggered, this);
					
		},
		onEventTriggered: function (channel, event, data) {
			// İlgili fonksiyonu burada çağır
			this.masterRefresh();
		},

		onUpdateFinished: function (oEvent) {
			this._updateListItemCount(oEvent.getParameter("total"));
		},

		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				this.onRefresh();
				return;
			}

			var sQuery = oEvent.getParameter("query");

			if (sQuery) {
				this._oListFilterState.aSearch = [new Filter("Statu", FilterOperator.EQ, Yetki)];
			} else {
				this._oListFilterState.aSearch = [];
			}
			this._applyFilterSearch();

		},
			onSearch1: function () {
			// if (oEvent.getParameters().refreshButtonPressed) {
			// 	this.onRefresh();
			// 	return;
			// }

			// var sQuery = oEvent.getParameter("query");

			// if (sQuery) {
				this._oListFilterState.aSearch = [new Filter("Statu", FilterOperator.EQ, Yetki)];
			// } else {
				// this._oListFilterState.aSearch = [];
			// }
			this._applyFilterSearch();

		},

		onRefresh: function () {
			this._oList.getBinding("items").refresh();
		},

		onOpenViewSettings: function (oEvent) {
			var sDialogTab = "filter";
			if (oEvent.getSource() instanceof sap.m.Button) {
				var sButtonId = oEvent.getSource().getId();
				if (sButtonId.match("sort")) {
					sDialogTab = "sort";
				} else if (sButtonId.match("group")) {
					sDialogTab = "group";
				}
			}

			if (!this.byId("viewSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "eve.ui.Z_MMASRAF03.view.ViewSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialog").open(sDialogTab);
			}
		},

		onConfirmViewSettingsDialog: function (oEvent) {
			var aFilterItems = oEvent.getParameters().filterItems,
				aFilters = [],
				aCaptions = [];

			aFilterItems.forEach(function (oItem) {
				switch (oItem.getKey()) {
				case "Filter1":
					aFilters.push(new Filter("Wrbtr", FilterOperator.LE, 100));
					break;
				case "Filter2":
					aFilters.push(new Filter("Wrbtr", FilterOperator.GT, 100));
					break;
				default:
					break;
				}
				aCaptions.push(oItem.getText());
			});

			this._oListFilterState.aFilter = aFilters;
			this._updateFilterBar(aCaptions.join(", "));
			this._applyFilterSearch();
			this._applySortGroup(oEvent);
		},

		_applySortGroup: function (oEvent) {
			var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];

			if (mParams.groupItem) {
				sPath = mParams.groupItem.getKey();
				bDescending = mParams.groupDescending;
				var vGroup = this._oGroupFunctions[sPath];
				aSorters.push(new Sorter(sPath, bDescending, vGroup));
			}
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));
			this._oList.getBinding("items").sort(aSorters);
		},

		onSelectionChange: function (oEvent) {
			var oList = oEvent.getSource(),
				bSelected = oEvent.getParameter("selected");

			if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			}
		},

		onBypassed: function () {
			this._oList.removeSelections(true);
		},

		createGroupHeader: function (oGroup) {
			
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		onNavBack: function () {
			history.go(-1);
		},

		_createViewModel: function () {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "Monat",
				groupBy: "None"
			});
		},
				masterRefresh: function () {
			var _oComponent = this.getOwnerComponent();
			var oList = _oComponent.oListSelector._oList;
			var oListBinding = oList.getBinding("items");
			oListBinding.refresh(true);
		},
		_onMasterMatched: function (oEvent) {
			var paramYenile = oEvent.getParameter("arguments").Yenile;
			this.getModel("appView").setProperty("/layout", "OneColumn");
			if (paramYenile === "true") {
				this.onRefresh();
				this._oList.removeSelections(true);
			}
		},

		_showDetail: function (oItem) {
			var bReplace = !Device.system.phone;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("Requestid"),
				Statu: oItem.getBindingContext().getProperty("Statu")
			}, bReplace);
		},
			GetRole: function () {
			var that = this;
			var oDataModel = this.getOwnerComponent().getModel();

			sap.ui.core.BusyIndicator.show();

			oDataModel.read("/GetRoleSet(Uname='" + '' + "')", {
				success: mySuccessHandler,
				error: myErrorHandler
			});

			function mySuccessHandler(data, response) {
				// Yetki = "03";
				Yetki = data.Yetki;
			
				sap.ui.core.BusyIndicator.hide();
			}

			function myErrorHandler(data, response) {
				sap.m.MessageBox.error("Bir hata oluştu. Lütfen sistem yöneticiniz ile iletişime geçiniz.");
				sap.ui.core.BusyIndicator.hide();
			}
		},
	

		_updateListItemCount: function (iTotalItems) {
			var sTitle;
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		_applyFilterSearch: function () {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		_updateFilterBar: function (sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		}

	});

});