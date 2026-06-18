import i18n from "./locals";
// 校验邮箱
function validateEmail(value: string): boolean {
    const regExp: RegExp = /^[a-z0-9_]+@[a-z0-9]+\.[a-z]+$/i;
    return regExp.test(value);
}

// 校验密码
function validatePassword(value: string): boolean {
    const regPassword: RegExp = /^(?!\D+$)(?![^a-zA-Z]+$)\S{6,20}$/;
    return regPassword.test(value);
}

// 校验验证码
function validateCode(value: string): boolean {
    const regCode: RegExp = /^[0-9]{6}$/;
    return regCode.test(value);
}

//发布======
//校验目录2
function validateDir(value:string): boolean {
    const regDir: RegExp = /^[a-zA-Z0-9_]+$/;
    return regDir.test(value);
}
//校验目录
function shareValidateDir(rule: any, value: any, callback: any): any {
    const regDir: RegExp = /^[a-zA-Z0-9_]+$/;
    if(!value){
        return callback(new Error(i18n.global.t('addproject.project_name_message')));
    }
    if(regDir.test(value)){
        callback();
    }else{
        callback(new Error(i18n.global.t('addproject.project_name_message_error')));
    }
}
//校验版本号
function shareValidateVersion(rule: any, value: any, callback: any): any {
    // 正则表达式，匹配以字母开头，后面可以跟一个或多个点，再跟一个或多个数字，最后可以跟一个连字符和任意数量的字母或数字
    const regVersion: RegExp = /^[a-zA-Z0-9]+(\.[0-9]+){0,2}$/;
    if(!value){
        return callback(new Error(i18n.global.t('addproject.project_version_message')));
    }
    if(regVersion.test(value)){
        callback();
    }else{
        callback(new Error(i18n.global.t('addproject.project_version_message_error')));
    }
}

//校验用户名
function validateUsername(value:string):boolean {
    // 匹配长度在3到20个字符之间，并且只包含字母（大小写均可）和数字，且不能以下划线开头或结尾的正则表达式
    const regUserName: RegExp = /^[a-zA-Z0-9]{3,20}$/;
    return regUserName.test(value);
  }

export default { validateEmail, validatePassword, validateCode, validateUsername,shareValidateVersion,shareValidateDir,validateDir };
