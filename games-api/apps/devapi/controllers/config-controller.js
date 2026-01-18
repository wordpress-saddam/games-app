const logger = require('../../../core_libs/utils/logger');
const configHelper = require('../../../core_libs/helpers/config_helper/general-config-helper');
const apiExceptions = require('../../../config/api-exceptions').project;
const ProjectModel = require('../../../core_libs/models/mongodb/db-projects')
const AppGeneralSettingModel = require('../../../core_libs/models/mongodb/db-apps-general-settings');
const notificationsHelper = require('../../../core_libs/helpers/notifications/notifications-helper');
const projectsHelper = require('../../../core_libs/helpers/project/projects-helper');
const ProjectDomainsModel = require('../../../core_libs/models/mongodb/db-project-domains');
const WebPagesModel = require('../../../core_libs/models/mongodb/db-webpages')
const RedirectionUrlsModel = require('../../../core_libs/models/mongodb/db-project-redirection-urls')
const getAllConfigData = async (req, res, next) => {
    try {
        // const {pId} = req.params;

        const project_id = req.project_id;

        let ConfigData = await configHelper.getConfigData(project_id);

        if (ConfigData) {
            //global.sendSuccessResponse(res, false, 200, ConfigData);
            for (const key in ConfigData) {
                if(key !== "project_id" &&  key !== "updatedAt"){
                    ConfigData[key] = JSON.parse(ConfigData[key])
                }
            }
            const projectDomain = await ProjectDomainsModel.findOne({
                    project_id
            })
            let domainName = projectDomain.cdn_url ? `https://${projectDomain.cdn_url}` : projectDomain.demo_host;

            if (projectDomain.status == 4) {
                domainName = "https://" + projectDomain.public_host;
            }
            // TODO will live it after testing
            configHelper.assetsWrapper(domainName, ConfigData);

            ConfigData["notification"] = await notificationsHelper.getNotificationConfig(req.project_id)

            const {templateName,templatePlatform} = await projectsHelper.getProjectTemplateNameWithPlatform(req.project_id);
            ConfigData["template_name"] = templateName;
            ConfigData["cms_platform"] = templatePlatform;

            console.log(ConfigData["notification"])
            let isAmpOnlyEnabled = false;
            if(ConfigData["general_settings"] && ConfigData["general_settings"]["project_meta"] &&  ConfigData["general_settings"]["project_meta"]["amp_only_site"]) {
                isAmpOnlyEnabled = true;
            }
            let defaultSortdService = isAmpOnlyEnabled ? 'amp_only' : 'pwa_and_amp_both';
            let projectSetting = await projectsHelper.getProjectSettings(req.project_id);
            if(projectSetting && ConfigData["article"] && ConfigData["article"]["design"]){
                ConfigData["article"]["design"]["self_canonical"] = projectSetting.self_canonical || false;
            }else{
                ConfigData["article"] = {
                    ...ConfigData["article"],
                    ["design"]:{
                        ...ConfigData["article"]?.["design"],
                        ["self_canonical"] : projectSetting.self_canonical || false,
                    }
                }
            }
            if(projectSetting && ConfigData["general_settings"] &&  ConfigData["general_settings"]["design"] && (typeof(ConfigData["general_settings"]["design"]["shorts_category_id"])==='undefined' || ConfigData["general_settings"]["design"]["shorts_category_id"]==='')){
                ConfigData["general_settings"]["design"]["shorts_category_id"] = projectSetting.shorts_category_id || '';
            }
            if(ConfigData["general_settings"] && ConfigData["general_settings"]["design"] && ConfigData["general_settings"]["design"]["enable_dynamic_pages"]){
                const webPageDetails = await WebPagesModel.find({project_id:req.project_id,status:true},"-_id guid slug");
                if(webPageDetails){
                    ConfigData["webpages"] = webPageDetails;
                }
            }

            console.log("projectSetting: ",projectSetting);

            if (projectSetting) {
                ConfigData['sortd_service'] = projectSetting.sortd_service || defaultSortdService;
                ConfigData['enable_category_in_article'] = projectSetting.enable_category_in_article || false;
                ConfigData['enable_category_alias_url'] = projectSetting.enable_category_alias_url || false;
                ConfigData['enable_txnmy_slug_in_cat_url'] = projectSetting.enable_txnmy_slug_in_cat_url || false;
                ConfigData['enable_posttype_slug_in_article_url'] = projectSetting.enable_posttype_slug_in_article_url || false;
                ConfigData['enable_posttype_slug_in_cat_url'] = projectSetting.enable_posttype_slug_in_cat_url || false;
                ConfigData['disable_guid_in_article_url'] = projectSetting.disable_guid_in_article_url || false;
                ConfigData['enable_article_slug_url'] = projectSetting.enable_article_slug_url || false;

                let features = {};
                features["paid_article_enabled"] = projectSetting.paid_article || false;
                features["support_widget_enabled"] = projectSetting.support_widget || false;
                features["trending_articles_enabled"] = projectSetting.trending_articles || false;
                ConfigData["features"] = features;
            }else{
                ConfigData['sortd_service'] = defaultSortdService;
                let features = {};
                features["paid_article_enabled"] = false;
                features["support_widget_enabled"] =  false;
                features["trending_articles_enabled"] = false;
                ConfigData["features"] = features;
            }

            let projectData = await ProjectModel.findOne({_id:req.project_id})
            if(projectData){
                ConfigData["features"]['enable_article_view_count'] = projectData.enable_article_view_count ??false;
            }
            else{
                ConfigData["features"]["enable_article_view_count"] = false;
            }
            if(projectSetting && projectSetting.enable_redirection_urls){
                ConfigData["features"]["enable_redirection_urls"] = projectSetting.enable_redirection_urls || false;
                let redirectionUrls = await RedirectionUrlsModel.findOne({project_id:req.project_id},"urls");
                if(redirectionUrls){
                    ConfigData["redirection_urls"] = redirectionUrls.urls || [];
                }
                else{
                    ConfigData["redirection_urls"] = [];
                }
            }else{
                ConfigData["features"]["enable_redirection_urls"] = false;
                ConfigData["redirection_urls"] = [];
            }

            req.status = true;
            req.responseCode = 200;
            req.data = ConfigData;
            req.apiType = "config";
            req.cacheListId = []
            req.cacheListId.push(project_id);
            next()

        } else {
            global.sendErrorResponse(res, false, 200, apiExceptions.configNotFound.code, apiExceptions.configNotFound.msg);
        }
    } catch (err) {
        console.log(err)

        global.sendErrorResponse(res, false, 200, apiExceptions.configNotFound.code, apiExceptions.configNotFound.msg);
    }
}

const getGroupConfigData = async (req, res, next) => {
    try {
        const {
            groupName
        } = req.params;

        const project_id = req.project_id;

        let ConfigData = await configHelper.getConfigDataByGroup(project_id, groupName);
        console.log(ConfigData)
        if (ConfigData) {
            //global.sendSuccessResponse(res, false, 200, ConfigData); 
            ConfigData[groupName] = JSON.parse(ConfigData[groupName]);
            req.status = true;
            req.responseCode = 200;
            req.data = ConfigData;
            req.apiType = "config";
            req.cacheListId = []
            req.cacheListId.push(project_id);
            next()
        } else {
            global.sendErrorResponse(res, false, 200, apiExceptions.configNotFound.code, apiExceptions.configNotFound.msg);
        }
    } catch (err) {
        console.log(err)
        global.sendErrorResponse(res, false, 200, apiExceptions.configNotFound.code, apiExceptions.configNotFound.msg);
    }
}

const getAllAppConfigData = async (req, res, next) => {
    try {
        // const {pId} = req.params;

        const project_id = req.project_id;
        console.log("version",req.query.version);
        let ConfigData = await configHelper.getAppConfigData(project_id ,req.query.version);
        if (ConfigData) {
            //global.sendSuccessResponse(res, false, 200, ConfigData);
            for (const key in ConfigData) {
                if(key !== "updatedAt" && key !== "name" && key !== "version" && ConfigData[key]){
                    ConfigData[key] = JSON.parse(ConfigData[key])
                }
            }

            ConfigData["template_name"] = await projectsHelper.getProjectTemplateName(req.project_id);
            console.log(ConfigData["notification"])
            let projectSetting = await projectsHelper.getProjectSettings(req.project_id);
            if (projectSetting) {
                let features = {};
                features["paid_article_enabled"] = projectSetting.paid_article || false;
                features["support_widget_enabled"] = projectSetting.support_widget || false;
                features["trending_articles_enabled"] = projectSetting.trending_articles || false;
                ConfigData["project_features"] = features;
            }else {
                let features = {};
                features["paid_article_enabled"] = false;
                features["support_widget_enabled"] =  false;
                features["trending_articles_enabled"] = false;
                ConfigData["project_features"] = features;
            }
            const generalSetting = await AppGeneralSettingModel.findOne({project_id}, "app_logo launcher_icon ios_fcm_topic android_fcm_topic")

            if(generalSetting){
                ConfigData["general_settings"] = {
                    app_logo: generalSetting.app_logo,
                    launcher_icon: generalSetting.launcher_icon,
                    ios_fcm_topic: generalSetting.ios_fcm_topic,
                    android_fcm_topic: generalSetting.android_fcm_topic,
                }
            }



            // req.status = true;
            // req.responseCode = 200;
            // req.data = ConfigData;
            // req.apiType = "config";
            // req.cacheListId = []
            // req.cacheListId.push(project_id);
            // next()
            return res.status(200).json({
                status: true,
                data: ConfigData
            })

        } else {
            console.log("Config not found");
            global.sendErrorResponse(res, false, 200, apiExceptions.configNotFound.code, apiExceptions.configNotFound.msg);
        }
    } catch (err) {
        console.log(err)

        global.sendErrorResponse(res, false, 200, apiExceptions.configNotFound.code, apiExceptions.configNotFound.msg);
    }
}

const getAppGroupConfigData = async (req, res, next) => {
    try {
        const {
            groupName
        } = req.params;

        const project_id = req.project_id;

        let ConfigData = await configHelper.getAppConfigDataByGroup(project_id, groupName);
        console.log(ConfigData)
        if (ConfigData) {
            //global.sendSuccessResponse(res, false, 200, ConfigData); 
            ConfigData[groupName] = JSON.parse(ConfigData[groupName]);
            // req.status = true;
            // req.responseCode = 200;
            // req.data = ConfigData;
            // req.apiType = "config";
            
            // req.cacheListId = []
            // req.cacheListId.push(project_id);
            // next()
            return res.status(200).json({
                status: true,
                data: ConfigData
            })
        } else {
            global.sendErrorResponse(res, false, 200, apiExceptions.configNotFound.code, apiExceptions.configNotFound.msg);
        }
    } catch (err) {
        console.log(err)
        global.sendErrorResponse(res, false, 200, apiExceptions.configNotFound.code, apiExceptions.configNotFound.msg);
    }
}


const getAppGeneralConfigData = async (req, res, next) => {
    try {
        const project_id = req.project_id;

        let ConfigData = await configHelper.getAppGeneralConfigData(project_id);
        console.log(ConfigData)
        if (ConfigData) {
            // req.status = true;
            // req.responseCode = 200;
            // req.data = ConfigData;
            // req.apiType = "config";
            // req.cacheListId = []
            // req.cacheListId.push(project_id);
            // next()
            return res.status(200).send({
                status: true,
                data: ConfigData
            })
        } else {
            global.sendErrorResponse(res, false, 200, apiExceptions.configNotFound.code, apiExceptions.configNotFound.msg);
        }
    } catch (err) {
        console.log(err)
        global.sendErrorResponse(res, false, 200, apiExceptions.configNotFound.code, apiExceptions.configNotFound.msg);
    }
}

const getAllV2AppConfigData = async (req, res, next) => {
    try {
        const { platform } = req.headers;
        const project_id = req.project_id;
        const {engine_version} = req.query

        let ConfigData = await configHelper.getV2AppConfigData(project_id ,req.query.version,platform,engine_version||""); 

        if (ConfigData) {
            for (const key in ConfigData) {
                if (key !== "updatedAt" && key !== "name" && key !== "version" && key !== "engine_version" && key !=="platform" && ConfigData[key]){
                    ConfigData[key] = JSON.parse(ConfigData[key])
                }
            }
            ConfigData["template_name"] = await projectsHelper.getProjectTemplateName(req.project_id,platform); 
            let projectSetting = await projectsHelper.getProjectSettings(req.project_id);
            if (projectSetting) {
                let features = {};
                features["paid_article_enabled"] = projectSetting.paid_article || false;
                features["support_widget_enabled"] = projectSetting.support_widget || false;
                features["trending_articles_enabled"] = projectSetting.trending_articles || false;
                ConfigData["project_features"] = features;
            }else {
                let features = {};
                features["paid_article_enabled"] = false;
                features["support_widget_enabled"] =  false;
                features["trending_articles_enabled"] = false;
                ConfigData["project_features"] = features;
            }
            const generalSetting = await AppGeneralSettingModel.findOne({project_id}, "app_logo launcher_icon ios_fcm_topic android_fcm_topic")

            if(generalSetting){
                ConfigData["general_settings"] = {
                    app_logo: generalSetting.app_logo,
                    launcher_icon: generalSetting.launcher_icon,
                    ios_fcm_topic: generalSetting.ios_fcm_topic,
                    android_fcm_topic: generalSetting.android_fcm_topic,
                }
            }
            return res.status(200).json({
                status: true,
                data: ConfigData
            })

        } else {
            global.sendErrorResponse(res, false, 200, apiExceptions.configNotFound.code, apiExceptions.configNotFound.msg);
        }
    } catch (err) {
        console.log(err)
        global.sendErrorResponse(res, false, 200, apiExceptions.configNotFound.code, apiExceptions.configNotFound.msg);
    }
}

module.exports = {
    getAllConfigData,
    getGroupConfigData,
    getAllAppConfigData,
    getAppGroupConfigData,
    getAppGeneralConfigData,
    getAllV2AppConfigData
}