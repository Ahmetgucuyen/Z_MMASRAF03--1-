sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, formatter, MessageBox, MessageToast, mobileLibrary, Filter, FilterOperator) {
	"use strict";

	var selectedLines = [];
	
var tableDocShow2 = [];
	var oTable;
	var Statu;
	var tableData = [];
	var oView;
var oninit;
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("eve.ui.Z_MMASRAF03.controller.Detail", {

		formatter: formatter,

		onInit: function () {
	
			oView = this.getView();
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},
				bindView2D: function () {
			var oViewModel = new sap.ui.model.json.JSONModel();
			oViewModel.setData({
				tableDocShow2: tableDocShow2
			});
			this.getView().setModel(oViewModel, "DocList2");
			this.getView().getModel("DocList2").refresh(true);
		},
			bindView3D: function () {
			var oViewModel = new sap.ui.model.json.JSONModel();
			oViewModel.setData({
				tableDocShow2: tableDocShow2
			});
			this.getView().setModel(oViewModel, "DocList2");
			this.getView().getModel("DocList2").refresh(true);

		},
	

		onSendEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},
			onDocShow2: function (IstekNo) {
			var filter = [];
			var sServiceURL = this.getView().getModel().sServiceUrl;
			// var IstekNo = "F111";
			filter.push(new sap.ui.model.Filter("IvReqid", sap.ui.model.FilterOperator.EQ, IstekNo));
			var that = this;
			var oModel = this.getView().getModel();
			oModel.read("/DocList2Set", {
				filters: filter,
				success: function (resp) {
					tableDocShow2 = [];
					if (resp.results.length === 0) {
						that.bindView2D();
					} else {
						var tableDocShow3 = [];
						for (var mt = 0; mt < resp.results.length; mt++) {
							var url = sServiceURL + "/" + "FileUSet(IvReqid='" + IstekNo +
								"',IvDocid='" + resp.results[mt].Docid + "')/$value";
							resp.results[mt].url = url;
							var Guid = resp.results[mt].Guid;
							if (tableDocShow3.length !== 0) {
								if (tableDocShow3.findIndex(x => x.Guid === Guid) === 0) {
									tableDocShow3.push(resp.results[mt]);
								} else {
									tableDocShow3 = [];
									tableDocShow3.push(resp.results[mt]);
								}
							} else {
								tableDocShow3.push(resp.results[mt]);
							}

							// var index = talepMsg.findIndex(x => x.Guid === Guid);
							// talepMsg[index].tableDocShow3 = tableDocShow3;

							tableDocShow2.push(resp.results[mt]);
							// urldosya = resp.results[mt].url;
						}
						that.bindView3D();
						// that.bindViewD();
					}
				},
				error: function () {}
			});
		},
	
			onActionPressedDR: function (oEvent) {
			var item = oEvent.getSource();
			var sAction = item.getCustomData()[0].getValue();
			var sServiceURL = this.getView().getModel().sServiceUrl;
			URLHelper.redirect(sAction, true);
			// window.open(sAction, "_blank");
		},
			onClose2: function () {
			this.dosya.close()
		},  
				onPressDosya: function (oEvent) {
			var IstekNo = this.Expno;
			var oFragmentModel = new sap.ui.model.json.JSONModel({
				dialogTitle: IstekNo
			});
			this.getView().setModel(oFragmentModel, "fragment");
			this.onDocShow2(IstekNo);
			// sap.ui.getCore().byId("idDocListD1").setVisible(true);

			if (!this.dosya) {
				this.dosya = sap.ui.xmlfragment("eve.ui.Z_MMASRAF03.view.fragment.Dosya", this);
				this.getView().addDependent(this.dosya);
			}
			this.dosya.open();
			// for(var i = 0; i<sepet.length; i++ ){

			// 	sap.ui.getCore().byId("uploadColIkDokuman").addItem(sepet[i]);
			// }

		},
	

		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			var stat = oEvent.getParameter("arguments").Statu;
			// bukrs = bkrs;
			Statu = stat;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("MasterApproveSet", {
					Requestid: sObjectId
								// Aciklama: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
			var that = this;
			this.Expno = sObjectId;
			sap.ui.core.BusyIndicator.show();
			setTimeout(function () {
				that.onSelectionChange();
				that.byId("lineItemsList").removeSelections(true);
				that.getDocumentDetail(sObjectId);
			}, 2000);
		},

		getDocumentDetail: function (Requestid) {
			sap.ui.core.BusyIndicator.show();
			var that = this;
			var oDataModel = this.getOwnerComponent().getModel();
			var filters = [];
			var sFilter = new sap.ui.model.Filter("Requestid", sap.ui.model.FilterOperator.EQ, Requestid);
			var s1Filter = new sap.ui.model.Filter("Statu", sap.ui.model.FilterOperator.EQ, Statu);
			filters.push(s1Filter);
			filters.push(sFilter);

			oDataModel.read("/DetailSet", {
				success: mySuccessHandler,
				filters: filters,
				error: myErrorHandler
			});

			function mySuccessHandler(data, response) {
				tableData = data.results;

				var oViewModel = new JSONModel({
					tableData: tableData
				});

				oView.setModel(oViewModel, "docDetailModel");

				sap.ui.core.BusyIndicator.hide();
			}

			function myErrorHandler(response) {
				sap.m.MessageBox.error("Bir hata oluştu. Lütfen sistem yöneticinizle iletişime geçiniz.");
				sap.ui.core.BusyIndicator.hide();
			}
		},

		_bindView: function (sObjectPath) {
			var oViewModel = this.getModel("detailView");

			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.Expno,
				sObjectName = oObject.Monat,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function () {
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			oViewModel.setProperty("/delay", 0);

			oViewModel.setProperty("/busy", true);

			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},
			onTamamlaRed: function () {
					var redNedeni = this.getModel("detailView").getProperty("/RedNedeni");
			if (redNedeni === "") {
				MessageToast.show("Reddetme nedeni boş bırakılamaz");
				return;
			}
			var oEntry = {};
			var aSelectedItems = oTable.getSelectedItems();
			var selectedItems1 = [];

			// aSelectedItems dizisi seçilen satırları içerir
			for (var i = 0; i < aSelectedItems.length; i++) {
				var oSelectedItem = aSelectedItems[i];
				var oBindingContext = oSelectedItem.getBindingContext("docDetailModel");
				var oSelectedData = oBindingContext.getObject();

				var selectedDataMatnr = {
					Requestid: oSelectedData.Requestid,
					Masrafyeri: oSelectedData.Masrafyeri,
					Itemno: oSelectedData.Itemno,
					Rednedeni: redNedeni,
					Statu: "R",
					Bukrs: oSelectedData.Bukrs
						// Fark: oSelectedData.Fark
				};

				selectedItems1.push(selectedDataMatnr);
			}

			// oEntry.R = sayimId;
			oEntry.NAVISDATA = selectedItems1;
			oEntry.NAVRETURN = [{
				"Id": "",
				"Number": "",
				"Message": "",
				"Type": ""
			}];
			// console.log("Seçilen Satırlar:", selectedItems);

			var oModel = this.getOwnerComponent().getModel();

			sap.ui.core.BusyIndicator.show();
			var that = this;
			oModel.create("/OnayCreateDeepSet", oEntry, {

				success: function (data) {
					// that.getView().byId("idbuton").setVisible(true);
				

					sap.ui.core.BusyIndicator.hide();
						that.redNedeniFrag.close();
					MessageToast.show("Reddedildi");
					
						that.getDocumentDetail(that.Expno);
					
			// var oTable = that.getView().byId("lineItemsList");
			// var oBinding = oTable.getBinding("items");
			// 		oBinding.refresh(true);
			
			that.getView().getModel("docDetailModel").refresh(true);
					// 	that.onFark();
					// 	// that._tamamla2();
					// }
					// that.getView().byId("LineItemsSmartTable").rebindTable();

				},
				error: function (e) {
					// var mesaj = e.Message;
					alert("error");
					sap.ui.core.BusyIndicator.hide();
				},
			});

		},

		onTamamla: function () {
			var oEntry = {};
			var aSelectedItems = oTable.getSelectedItems();
			var selectedItems1 = [];

			// aSelectedItems dizisi seçilen satırları içerir
			for (var i = 0; i < aSelectedItems.length; i++) {
				var oSelectedItem = aSelectedItems[i];
				var oBindingContext = oSelectedItem.getBindingContext("docDetailModel");
				var oSelectedData = oBindingContext.getObject();

				var selectedDataMatnr = {
					Requestid: oSelectedData.Requestid,
					Masrafyeri: oSelectedData.Masrafyeri,
						Itemno: oSelectedData.Itemno,
					Statu: "",
					Bukrs: oSelectedData.Bukrs
						// Fark: oSelectedData.Fark
				};

				selectedItems1.push(selectedDataMatnr);
			}

			// oEntry.R = sayimId;
			oEntry.NAVISDATA = selectedItems1;
			oEntry.NAVRETURN = [{
				"Id": "",
				"Number": "",
				"Message": "",
				"Type": ""
			}];
			// console.log("Seçilen Satırlar:", selectedItems);

			var oModel = this.getOwnerComponent().getModel();

			sap.ui.core.BusyIndicator.show();
			var that = this;
			oModel.create("/OnayCreateDeepSet", oEntry, {

				success: function (data) {
					that.getView().byId("idbuton").setVisible(true);
				

					sap.ui.core.BusyIndicator.hide();
					MessageToast.show("Onaylandı");
					
						that.getDocumentDetail(that.Expno);
					
			// var oTable = that.getView().byId("lineItemsList");
			// var oBinding = oTable.getBinding("items");
			// 		oBinding.refresh(true);
			
			that.getView().getModel("docDetailModel").refresh(true);
					// 	that.onFark();
					// 	// that._tamamla2();
					// }
					// that.getView().byId("LineItemsSmartTable").rebindTable();

				},
				error: function (e) {
					// var mesaj = e.Message;
					alert("error");
					sap.ui.core.BusyIndicator.hide();
				},
			});

		},

		onPressOnayla: function (oEvent) {

			var oModel = this.getView().getModel();
			var oEntry = {};
			oEntry.Statu = "";
			var that = this;
			oModel.update("/MasterApproveSet(Requestid='" + this.Expno + "')", oEntry, {
				method: "POST",
				success: function (data) {
					MessageToast.show("Onaya Gönderildi");
					
			sap.ui.getCore().getEventBus().publish("channelName", "eventName", {});
			
									that.getDocumentDetail(that.Expno);
									that.onCloseDetailPress();
				},
				error: function (e) {
					alert("error");
					// flag = 0;
				},
			});

			// }
		},
	onPressReddet: function (oEvent) {

			var oModel = this.getView().getModel();
			var oEntry = {};
			oEntry.Statu = "R";
			var that = this;
				var redNedeni = this.getModel("detailView").getProperty("/RedNedeni");
			if (redNedeni === "") {
				MessageToast.show("Reddetme nedeni boş bırakılamaz");
				return;
			}
			var oTable = this.getView().byId("lineItemsList");
			var items = oTable.getSelectedItems();
			var oModel = this.getView().getModel();
			var returnMsg = [{}];
			var data = {}; //Create deep data
			var requestInput = [];
			var that = this;

			for (var i = 0; i < items.length; i++) {
				var context = items[i].getBindingContext("docDetailModel");
				var obj = context.getProperty(null, context);
				requestInput.push({
					Brsed: obj.Brsed,
					Excode: '',
					Extext: '',
					Expno: obj.Expno,
					PernrUst: '',
					Statu: '',
					UnameText: '',
					Wrbtr: obj.Wrbtr,
					Brset: null
				});
			}

			data.IStatu = 'C';
			data.IRed = redNedeni.toUpperCase();
			data.NavInput = requestInput;
			data.NavReturn = returnMsg;


			oModel.update("/MasterApproveSet(Requestid='" + this.Expno + "')", oEntry, {
				method: "POST",
				success: function (data) {
					// if(data.Statu !== "Y"){
					// 	var mesaj = data.Message;
					// if(mesaj ===""){

					MessageToast.show("Reddedildi");
					// }
					// else{

					// 	alert(mesaj);

					// }

					// }else if (data.Statu === "Y"){
					// 	var carinumber = data.Object_id;
					// 	alert(carinumber + " numaralı cari yaratıldı");

					// that.onPressDosyaFinal(FormnoOnay);
					// }
					// oBinding.refresh(true);
					// flag = 0;
				},
				error: function (e) {
					alert("error");
					// flag = 0;
				},
			});

			// }
		},

		onOnayla: function (oEvent) {
			sap.ui.core.BusyIndicator.show();
			var oTable = this.getView().byId("lineItemsList");
			var items = oTable.getSelectedItems();
			var oModel = this.getView().getModel();
			var returnMsg = [{}];
			var data = {};
			var requestInput = [];
			var validStatu = true;
			var that = this;

			for (var i = 0; i < items.length; i++) {
				var context = items[i].getBindingContext("docDetailModel");
				var obj = context.getProperty(null, context);
				requestInput.push({
					Brsed: obj.Brsed,
					Excode: '',
					Extext: '',
					Expno: obj.Expno,
					PernrUst: '',
					Statu: obj.Statu,
					UnameText: '',
					Wrbtr: obj.Wrbtr,
					Brset: null
				});
			}

			for (var x = 0; x < requestInput.length; x++) {
				if ((requestInput[x].Statu == "B") || (requestInput[x].Statu == "C") || (requestInput[x].Statu == "F")) {
					validStatu = false;
				}
			}

			if (validStatu != false) {
				data.IStatu = 'B';
				data.IRed = '';
				data.NavInput = requestInput;
				data.NavReturn = returnMsg;

				var mParameters = {
					success: function (oData) {
						sap.ui.core.BusyIndicator.hide();
						MessageBox.success("İşlem başarıyla tamamlamıştır.");
						that.getDocumentDetail(that.Expno);
						oTable.removeSelections(true);
						that.getModel().refresh();
						that.getRouter().navTo("RefreshMaster", {
							Yenile: "true"
						});
					}.bind(this),
					error: function (oError) {
						sap.ui.core.BusyIndicator.hide();
						MessageBox.error("İşlem sırasında hata meydana geldi!");
					}.bind(this)
				};

				oModel.create("/SMCreateSet", data, mParameters);
			} else {
				MessageBox.warning("Durumu 'Onaylandı' veya 'Reddedildi' statüsünde olan kayıtlar için onaylama işlemi yapılamaz!");
				sap.ui.core.BusyIndicator.hide();
			}

		},

		onReddetFragOpen: function () {
			var validStatu = true;

			var oTable = this.getView().byId("lineItemsList");
			var items = oTable.getSelectedItems();
			var oModel = this.getView().getModel();
			var returnMsg = [{}];
			var data = {};
			var requestInput = [];

			for (var i = 0; i < items.length; i++) {
				var context = items[i].getBindingContext("docDetailModel");
				var obj = context.getProperty(null, context);
				requestInput.push({
					Brsed: obj.Brsed,
					Excode: '',
					Extext: '',
					Expno: obj.Expno,
					PernrUst: '',
					Statu: obj.Statu,
					UnameText: '',
					Wrbtr: obj.Wrbtr,
					Brset: null
				});
			}

			for (var x = 0; x < requestInput.length; x++) {
				if ((requestInput[x].Statu == "B") || (requestInput[x].Statu == "C") || (requestInput[x].Statu == "F")) {
					validStatu = false;
				}
			}

			if (validStatu != false) {
				if (!this.redNedeniFrag) {
					this.getModel("detailView").setProperty("/RedNedeni", "");
					this.redNedeniFrag = sap.ui.xmlfragment("eve.ui.Z_MMASRAF03.view.fragment.RedNedeni", this);
					this.redNedeniFrag.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					this.getView().addDependent(this.redNedeniFrag);
				}
				this.redNedeniFrag.open();
			} else {
				MessageBox.warning("Durumu 'Onaylandı' veya 'Reddedildi' statüsünde olan kayıtlar için reddetme işlemi yapılamaz!");
			}

		},

		onSelectionChange: function () {
			// if (this.byId("statuText").getText() == "D") {
			// 	this.byId("lineItemsList").setMode("MultiSelect");
			// } else {
			// 	this.byId("lineItemsList").setMode("MultiSelect");
			// }

			// if (this.byId("lineItemsList").getSelectedItems().length < 1) {
				// this.byId("onaylaButton").setVisible(false);
				// this.byId("reddetButton").setVisible(false);
			// } else {
				// if (this.byId("statuText").getText() == "B") {
					this.byId("onaylaButton").setVisible(true);
					this.byId("reddetButton").setVisible(true);
				// } else {
					// this.byId("onaylaButton").setVisible(false);
					// this.byId("reddetButton").setVisible(false);
				// }
			// }
		},

		onRedNedeniFragAccept: function (oEvent) {
			var redNedeni = this.getModel("detailView").getProperty("/RedNedeni");
			if (redNedeni === "") {
				MessageToast.show("Reddetme nedeni boş bırakılamaz");
				return;
			}
			var oTable = this.getView().byId("lineItemsList");
			var items = oTable.getSelectedItems();
			var oModel = this.getView().getModel();
			var returnMsg = [{}];
			var data = {}; //Create deep data
			var requestInput = [];
			var that = this;

			for (var i = 0; i < items.length; i++) {
				var context = items[i].getBindingContext("docDetailModel");
				var obj = context.getProperty(null, context);
				requestInput.push({
					Brsed: obj.Brsed,
					Excode: '',
					Extext: '',
					Expno: obj.Expno,
					PernrUst: '',
					Statu: '',
					UnameText: '',
					Wrbtr: obj.Wrbtr,
					Brset: null
				});
			}

			data.IStatu = 'C';
			data.IRed = redNedeni.toUpperCase();
			data.NavInput = requestInput;
			data.NavReturn = returnMsg;

			var mParameters = {
				success: function (oData) {
					this.redNedeniFrag.close();
					MessageBox.success("İşlem başarıyla tamamlamıştır.");
					oTable.getBinding("items").refresh();
					that.getModel().refresh();
					that.getRouter().navTo("RefreshMaster", {
						Yenile: "true"
					});
					oTable.removeSelections(true);
				}.bind(this),
				error: function (oError) {
					MessageBox.error("İşlem sırasında hata meydana geldi!");
				}.bind(this)
			};

			oModel.create("/SMCreateSet", data, mParameters);
		},
		onSelectionChange1: function (oEvent) {
			oTable = oEvent.getSource();

		},
		onRedNedeniFragClose: function (oEvent) {
			this.redNedeniFrag.close();
		},

		formatDate: function (time) {
			function addZ(n) {
				return (n < 10 ? "0" : "") + n;
			}
			return time.getFullYear() + "-" +
				addZ(time.getMonth() + 1) + "-" +
				addZ(time.getDate()) + "T03:00:00";
		},
		formatDate1: function (baslangicSaati) {

			return "PT" + baslangicSaati.getHours() + "H" + baslangicSaati.getMinutes() + "M00S";

		},
		timeFormat: function (oValue) {
			debugger;
			if (oValue && oValue.ms !== 0 && oValue.ms !== undefined) {
				var oDate = new Date(oValue.ms),
					oHour = oDate.getUTCHours().toString(),
					oMinute = oDate.getUTCMinutes().toString(),
					oSeconds = oDate.getUTCSeconds().toString();

				return "PT" + oHour + "H" + oMinute + "M" + oSeconds + "S";
				//	PT12 H22 M38S

			}
		},
		onShowDoc: function (e) {

			var formattedBrsed = this.formatDate(e.getSource().getBindingContext("docDetailModel").getObject().Brsed);
			/*			var formattedBrsetV = e.getSource().getBindingContext("docDetailModel").getObject().Brset;
						var oType = new sap.ui.model.odata.type.DateTime({
							pattern: "PThh'H'mm'M'ss'S'"
						});
						var formattedBrset = oType.formatValue(new Date(formattedBrsetV.ms), 'string');*/
			var formattedBrset1 = this.timeFormat(e.getSource().getBindingContext("docDetailModel").getObject().Brset);

			var t = this.getModel().sServiceUrl,
				i = "/DocDownloadSMSet(Expno='",
				b = "',IBrsed=datetime'" + formattedBrsed + "",
				c = "',IBrset=time'" + formattedBrset1 + "",
				s = "',Itemno='",
				a = "',Docid='",
				o = "')/$value";
			this.getModel("detailView").setProperty("/url", t);
			this.getModel("detailView").setProperty("/ExpnoStr", i);
			this.getModel("detailView").setProperty("/BrsedStr", b);
			this.getModel("detailView").setProperty("/BrsetStr", c);
			this.getModel("detailView").setProperty("/ItemnoStr", s);
			this.getModel("detailView").setProperty("/DocidStr", a);
			this.getModel("detailView").setProperty("/value", o);
			sap.ui.core.BusyIndicator.show(0);
			if (!this.DocListFrag) {
				this.DocListFrag = sap.ui.xmlfragment("eve.ui.Z_MMASRAF03.view.fragment.DocList", this);
				this.DocListFrag.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				this.getView().addDependent(this.DocListFrag);
			}
			var r = [];
			r.push(new Filter("IExpno", FilterOperator.EQ, e.getSource().getBindingContext().getObject().Expno));
			r.push(new Filter("IBrsed", FilterOperator.EQ, e.getSource().getBindingContext("docDetailModel").getObject().Brsed));
			r.push(new Filter("IBrset", FilterOperator.EQ, e.getSource().getBindingContext("docDetailModel").getObject().Brset));
			// r.push(new n("Itemno", g.EQ, e.getSource().getBindingContext().getObject().Itemno));
			this.Expno = e.getSource().getBindingContext().getObject().Expno;
			this.Itemno = e.getSource().getBindingContext().getObject().Itemno;
			var d = this;
			var l = this.getView().getModel();
			l.read("/DocListSMSet", {
				filters: r,
				success: function (e) {
					for (var mt = 0; mt < e.results.length; mt++) {
						//	e.results[mt].IBrset.ms = formattedBrsetV.ms;
						e.results[mt].IBrset = e.results[mt].Uzeit;
					}
					d.getModel("detailView").setProperty("/DocListItems", e.results);
					d.DocListFrag.open();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function () {}
			});
		},
		onCloseDocDialogDocList: function () {
			this.DocListFrag.close();
		},

		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
			}
		}
	});

});