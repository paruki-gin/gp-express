(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([[8],{ZOrW:function(a,e,t){"use strict";t.r(e);t("14J3");var n,s,l,r=t("BMrR"),i=(t("jCWc"),t("kPKH")),o=(t("qVdP"),t("jsC+")),c=(t("Pwec"),t("CtXQ")),d=(t("lUTK"),t("BvKs")),p=t("2Taf"),u=t.n(p),h=t("vZ4D"),g=t.n(h),y=t("l4Ni"),m=t.n(y),f=t("ujKo"),b=t.n(f),v=t("MhPg"),k=t.n(v),D=t("q1tI"),E=t.n(D),T=t("MuoO"),C=t("v99g"),P=t("+n12"),S=t("lVjH"),x=t.n(S),w=t("xqX8"),R=E.a.lazy(function(){return Promise.all([t.e(1),t.e(0),t.e(41)]).then(t.bind(null,"Y65U"))}),j=E.a.lazy(function(){return Promise.all([t.e(1),t.e(0),t.e(44)]).then(t.bind(null,"20K/"))}),K=E.a.lazy(function(){return Promise.all([t.e(1),t.e(0),t.e(45)]).then(t.bind(null,"b2ve"))}),V=E.a.lazy(function(){return Promise.all([t.e(1),t.e(0),t.e(43)]).then(t.bind(null,"tLGd"))}),O=E.a.lazy(function(){return Promise.all([t.e(1),t.e(0),t.e(42)]).then(t.bind(null,"Jqna"))}),q=(n=Object(T["connect"])(function(a){var e=a.chart,t=a.loading;return{chart:e,loading:t.effects["chart/fetch"]}}),n((l=function(a){function e(){var a,t;u()(this,e);for(var n=arguments.length,s=new Array(n),l=0;l<n;l++)s[l]=arguments[l];return t=m()(this,(a=b()(e)).call.apply(a,[this].concat(s))),t.state={salesType:"all",currentTabKey:"",rangePickerValue:Object(P["d"])("year")},t.handleChangeSalesType=function(a){t.setState({salesType:a.target.value})},t.handleTabChange=function(a){t.setState({currentTabKey:a})},t.handleRangePickerChange=function(a){var e=t.props.dispatch;t.setState({rangePickerValue:a}),e({type:"chart/fetchSalesData"})},t.selectDate=function(a){var e=t.props.dispatch;t.setState({rangePickerValue:Object(P["d"])(a)}),e({type:"chart/fetchSalesData"})},t.isActive=function(a){var e=t.state.rangePickerValue,n=Object(P["d"])(a);return e[0]&&e[1]&&e[0].isSame(n[0],"day")&&e[1].isSame(n[1],"day")?x.a.currentDate:""},t}return k()(e,a),g()(e,[{key:"componentDidMount",value:function(){var a=this.props.dispatch;this.reqRef=requestAnimationFrame(function(){a({type:"chart/fetch"})})}},{key:"componentWillUnmount",value:function(){var a=this.props.dispatch;a({type:"chart/clear"}),cancelAnimationFrame(this.reqRef)}},{key:"render",value:function(){var a,e=this.state,t=e.rangePickerValue,n=e.salesType,s=e.currentTabKey,l=this.props,p=l.chart,u=l.loading,h=p.visitData,g=p.visitData2,y=p.salesData,m=p.searchData,f=p.offlineData,b=p.offlineChartData,v=p.salesTypeData,k=p.salesTypeDataOnline,T=p.salesTypeDataOffline;a="all"===n?v:"online"===n?k:T;var P=E.a.createElement(d["a"],null,E.a.createElement(d["a"].Item,null,"\u64cd\u4f5c\u4e00"),E.a.createElement(d["a"].Item,null,"\u64cd\u4f5c\u4e8c")),S=E.a.createElement("span",{className:x.a.iconGroup},E.a.createElement(o["a"],{overlay:P,placement:"bottomRight"},E.a.createElement(c["a"],{type:"ellipsis"}))),q=s||f[0]&&f[0].name;return E.a.createElement(C["a"],null,E.a.createElement(D["Suspense"],{fallback:E.a.createElement(w["default"],null)},E.a.createElement(R,{loading:u,visitData:h})),E.a.createElement(D["Suspense"],{fallback:null},E.a.createElement(j,{rangePickerValue:t,salesData:y,isActive:this.isActive,handleRangePickerChange:this.handleRangePickerChange,loading:u,selectDate:this.selectDate})),E.a.createElement("div",{className:x.a.twoColLayout},E.a.createElement(r["a"],{gutter:24},E.a.createElement(i["a"],{xl:12,lg:24,md:24,sm:24,xs:24},E.a.createElement(D["Suspense"],{fallback:null},E.a.createElement(K,{loading:u,visitData2:g,selectDate:this.selectDate,searchData:m,dropdownGroup:S}))),E.a.createElement(i["a"],{xl:12,lg:24,md:24,sm:24,xs:24},E.a.createElement(D["Suspense"],{fallback:null},E.a.createElement(V,{dropdownGroup:S,salesType:n,loading:u,salesPieData:a,handleChangeSalesType:this.handleChangeSalesType}))))),E.a.createElement(D["Suspense"],{fallback:null},E.a.createElement(O,{activeKey:q,loading:u,offlineData:f,offlineChartData:b,handleTabChange:this.handleTabChange})))}}]),e}(D["Component"]),s=l))||s);e["default"]=q},lVjH:function(a,e,t){a.exports={iconGroup:"antd-pro-pages-dashboard-analysis-iconGroup",rankingList:"antd-pro-pages-dashboard-analysis-rankingList",rankingItemNumber:"antd-pro-pages-dashboard-analysis-rankingItemNumber",active:"antd-pro-pages-dashboard-analysis-active",rankingItemTitle:"antd-pro-pages-dashboard-analysis-rankingItemTitle",salesExtra:"antd-pro-pages-dashboard-analysis-salesExtra",currentDate:"antd-pro-pages-dashboard-analysis-currentDate",salesCard:"antd-pro-pages-dashboard-analysis-salesCard",salesBar:"antd-pro-pages-dashboard-analysis-salesBar",salesRank:"antd-pro-pages-dashboard-analysis-salesRank",salesCardExtra:"antd-pro-pages-dashboard-analysis-salesCardExtra",salesTypeRadio:"antd-pro-pages-dashboard-analysis-salesTypeRadio",offlineCard:"antd-pro-pages-dashboard-analysis-offlineCard",twoColLayout:"antd-pro-pages-dashboard-analysis-twoColLayout",trendText:"antd-pro-pages-dashboard-analysis-trendText",rankingTitle:"antd-pro-pages-dashboard-analysis-rankingTitle",salesExtraWrap:"antd-pro-pages-dashboard-analysis-salesExtraWrap"}}}]);