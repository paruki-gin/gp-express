(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([[36],{"5WY0":function(e,a,t){e.exports={main:"antd-pro-pages-user-register-main",getCaptcha:"antd-pro-pages-user-register-getCaptcha",submit:"antd-pro-pages-user-register-submit",login:"antd-pro-pages-user-register-login",error:"antd-pro-pages-user-register-error",success:"antd-pro-pages-user-register-success",warning:"antd-pro-pages-user-register-warning","progress-pass":"antd-pro-pages-user-register-progress-pass",progress:"antd-pro-pages-user-register-progress"}},cq3J:function(e,a,t){"use strict";t.r(a);t("14J3");var r,s,i,n,o=t("BMrR"),l=(t("+L6B"),t("2/Rp")),c=(t("jCWc"),t("kPKH")),m=(t("Q9mQ"),t("diRs")),p=(t("MXD1"),t("CFYs")),d=t("p0pE"),g=t.n(d),u=t("2Taf"),f=t.n(u),h=t("vZ4D"),v=t.n(h),E=t("l4Ni"),b=t.n(E),w=t("ujKo"),M=t.n(w),y=t("MhPg"),O=t.n(y),j=(t("5NDa"),t("5rEg")),k=(t("OaEy"),t("2fM7")),F=(t("y8nQ"),t("Vl3Y")),P=t("q1tI"),C=t.n(P),S=t("MuoO"),N=t("Y2fQ"),q=t("mOP9"),x=t("usdK"),D=t("5WY0"),z=t.n(D),I=F["a"].Item,V=k["a"].Option,W=j["a"].Group,Y={ok:C.a.createElement("div",{className:z.a.success},C.a.createElement(N["FormattedMessage"],{id:"validation.password.strength.strong"})),pass:C.a.createElement("div",{className:z.a.warning},C.a.createElement(N["FormattedMessage"],{id:"validation.password.strength.medium"})),poor:C.a.createElement("div",{className:z.a.error},C.a.createElement(N["FormattedMessage"],{id:"validation.password.strength.short"}))},J={ok:"success",pass:"normal",poor:"exception"},Q=(r=Object(S["connect"])(function(e){var a=e.register,t=e.loading;return{register:a,submitting:t.effects["register/submit"]}}),s=F["a"].create(),r(i=s((n=function(e){function a(){var e,t;f()(this,a);for(var r=arguments.length,s=new Array(r),i=0;i<r;i++)s[i]=arguments[i];return t=b()(this,(e=M()(a)).call.apply(e,[this].concat(s))),t.state={count:0,confirmDirty:!1,visible:!1,help:"",prefix:"86"},t.onGetCaptcha=function(){var e=59;t.setState({count:e}),t.interval=setInterval(function(){e-=1,t.setState({count:e}),0===e&&clearInterval(t.interval)},1e3)},t.getPasswordStatus=function(){var e=t.props.form,a=e.getFieldValue("password");return a&&a.length>9?"ok":a&&a.length>5?"pass":"poor"},t.handleSubmit=function(e){e.preventDefault();var a=t.props,r=a.form,s=a.dispatch;r.validateFields({force:!0},function(e,a){if(!e){var r=t.state.prefix;s({type:"register/submit",payload:g()({},a,{prefix:r})})}})},t.handleConfirmBlur=function(e){var a=e.target.value,r=t.state.confirmDirty;t.setState({confirmDirty:r||!!a})},t.checkConfirm=function(e,a,r){var s=t.props.form;a&&a!==s.getFieldValue("password")?r(Object(N["formatMessage"])({id:"validation.password.twice"})):r()},t.checkPassword=function(e,a,r){var s=t.state,i=s.visible,n=s.confirmDirty;if(a)if(t.setState({help:""}),i||t.setState({visible:!!a}),a.length<6)r("error");else{var o=t.props.form;a&&n&&o.validateFields(["confirm"],{force:!0}),r()}else t.setState({help:Object(N["formatMessage"])({id:"validation.password.required"}),visible:!!a}),r("error")},t.changePrefix=function(e){t.setState({prefix:e})},t.renderPasswordProgress=function(){var e=t.props.form,a=e.getFieldValue("password"),r=t.getPasswordStatus();return a&&a.length?C.a.createElement("div",{className:z.a["progress-".concat(r)]},C.a.createElement(p["a"],{status:J[r],className:z.a.progress,strokeWidth:6,percent:10*a.length>100?100:10*a.length,showInfo:!1})):null},t}return O()(a,e),v()(a,[{key:"componentDidUpdate",value:function(){var e=this.props,a=e.form,t=e.register,r=a.getFieldValue("mail");"ok"===t.status&&x["a"].push({pathname:"/user/register-result",state:{account:r}})}},{key:"componentWillUnmount",value:function(){clearInterval(this.interval)}},{key:"render",value:function(){var e=this.props,a=e.form,t=e.submitting,r=a.getFieldDecorator,s=this.state,i=s.count,n=s.prefix,p=s.help,d=s.visible;return C.a.createElement("div",{className:z.a.main},C.a.createElement("h3",null,C.a.createElement(N["FormattedMessage"],{id:"app.register.register"})),C.a.createElement(F["a"],{onSubmit:this.handleSubmit},C.a.createElement(I,null,r("mail",{rules:[{required:!0,message:Object(N["formatMessage"])({id:"validation.email.required"})},{type:"email",message:Object(N["formatMessage"])({id:"validation.email.wrong-format"})}]})(C.a.createElement(j["a"],{size:"large",placeholder:Object(N["formatMessage"])({id:"form.email.placeholder"})}))),C.a.createElement(I,{help:p},C.a.createElement(m["a"],{getPopupContainer:function(e){return e.parentNode},content:C.a.createElement("div",{style:{padding:"4px 0"}},Y[this.getPasswordStatus()],this.renderPasswordProgress(),C.a.createElement("div",{style:{marginTop:10}},C.a.createElement(N["FormattedMessage"],{id:"validation.password.strength.msg"}))),overlayStyle:{width:240},placement:"right",visible:d},r("password",{rules:[{validator:this.checkPassword}]})(C.a.createElement(j["a"],{size:"large",type:"password",placeholder:Object(N["formatMessage"])({id:"form.password.placeholder"})})))),C.a.createElement(I,null,r("confirm",{rules:[{required:!0,message:Object(N["formatMessage"])({id:"validation.confirm-password.required"})},{validator:this.checkConfirm}]})(C.a.createElement(j["a"],{size:"large",type:"password",placeholder:Object(N["formatMessage"])({id:"form.confirm-password.placeholder"})}))),C.a.createElement(I,null,C.a.createElement(W,{compact:!0},C.a.createElement(k["a"],{size:"large",value:n,onChange:this.changePrefix,style:{width:"20%"}},C.a.createElement(V,{value:"86"},"+86"),C.a.createElement(V,{value:"87"},"+87")),r("mobile",{rules:[{required:!0,message:Object(N["formatMessage"])({id:"validation.phone-number.required"})},{pattern:/^\d{11}$/,message:Object(N["formatMessage"])({id:"validation.phone-number.wrong-format"})}]})(C.a.createElement(j["a"],{size:"large",style:{width:"80%"},placeholder:Object(N["formatMessage"])({id:"form.phone-number.placeholder"})})))),C.a.createElement(I,null,C.a.createElement(o["a"],{gutter:8},C.a.createElement(c["a"],{span:16},r("captcha",{rules:[{required:!0,message:Object(N["formatMessage"])({id:"validation.verification-code.required"})}]})(C.a.createElement(j["a"],{size:"large",placeholder:Object(N["formatMessage"])({id:"form.verification-code.placeholder"})}))),C.a.createElement(c["a"],{span:8},C.a.createElement(l["a"],{size:"large",disabled:i,className:z.a.getCaptcha,onClick:this.onGetCaptcha},i?"".concat(i," s"):Object(N["formatMessage"])({id:"app.register.get-verification-code"}))))),C.a.createElement(I,null,C.a.createElement(l["a"],{size:"large",loading:t,className:z.a.submit,type:"primary",htmlType:"submit"},C.a.createElement(N["FormattedMessage"],{id:"app.register.register"})),C.a.createElement(q["a"],{className:z.a.login,to:"/User/Login"},C.a.createElement(N["FormattedMessage"],{id:"app.register.sign-in"})))))}}]),a}(P["Component"]),i=n))||i)||i);a["default"]=Q}}]);