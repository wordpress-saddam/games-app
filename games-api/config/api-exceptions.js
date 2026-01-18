module.exports = {
    user: {
        //range -> 101 to 199
        unknownUser: {
            code: 101,
            msg: "User is not registerd with sortd",
        },
        alreadyRegistered: {
            code: 102,
            msg: "User already registerd with sortd",
        },
        invalidOtp: {
            code: 103,
            msg: "Invalid Otp",
        },
        wrongPassword: {
            code: 104,
            msg: "Wrong Password",
        },
        invalidToken: {
            code: 105,
            msg: "Invalid Token",
        },
        otpLimitReached: {
            code: 106,
            msg: "OTP limit reached",
        },
        otpExpired: {
            code: 107,
            msg: "OTP expired",
        },
    },
    project: {
        //range -> 1001 to 1099
        configNotFound: {
            code: 1001,
            msg: "Project config Not found",
        },
        paramNotFound: {
            code: 1002,
            msg: "Invalid api param",
        },
        projectNotFound: {
            code: 1003,
            msg: "Project Not found Invalid Project id",
        },
        suspended: {
            code: 1004,
            msg: "This project has been suspended! for more detail contact our support team at support@sortd.mobi",
        },
        deleted: {
            code: 1005,
            msg: "This project is Inactive! for more detail contact our support team at support@sortd.mobi",
        },
        notificationConfigNotFound: {
            code: 1006,
            msg: "Notification config Not found",
        },
        domainNotFound: {
            code: 1007,
            msg: "No domain found for this project",
        },
        quotaLimitReached: {
            code: 1008,
            msg: "Quota limit reached. Please upgrade your Plan",
        },
        templatesNotFound: {
            code: 1009,
            msg: "No templates found for this project",
        },
        invalidDomain: {
            code: 1010,
            msg: "Invalid Domain name, try with www.example.com or m.example.com",
        },
        domainNameExist: {
            code: 1011,
            msg: "Domain name already exist",
        },
        deployementComplted: {
            code: 1012,
            msg: "Deployment already completed",
        },
        editDomainNotAllowed: {
            code: 1011,
            msg: "Edit domain name is not allowed, SSL request sent already",
        },
        caaRecordsRequired: {
            code: 1012,
            msg: "Before generating SSL, following CAA record need to be added in DNS",
        },
        projectDeletionNotAllowed: {
            code: 1013,
            msg: "You are not authorized to delete this project",
        },
        invalidAppstoreAPIKeys: {
            code: 1014,
            msg: "Invalid Api key id or issuer id",
        },
        iosAppNotFound: {
            code: 1015,
            msg: "No IOS App found with this package name",
        },
        iosAPITokenError: {
            code: 1016,
            msg: "Invalid API key id /issuerId",
        },
        contractExpired: {
            code: 1017,
            msg: "Contract Expired",
        },
    },
    request: {
        //range -> 2001 to 2099
        serverError: {
            code: 2001,
            msg: "There was an error. Please try again.",
        },
        invalidRequestData: {
            code: 2002,
            msg: "Invalid request data",
        },
    },
    categories: {
        //range -> 3001 to 3099
        paramNotFound: {
            code: 3001,
            msg: "Invalid api param",
        },
        syncError: {
            code: 3002,
            msg: "Category Not synced",
        },
        notFound: {
            code: 3003,
            msg: "Category Not Found",
        },
        renameError: {
            code: 3004,
            msg: "Category Not renamed",
        },
        removeError: {
            code: 3005,
            msg: "Category Not removed",
        },
        reorderError: {
            code: 3006,
            msg: "Category Not reordered",
        },
        updatePostsOrderError: {
            code: 3007,
            msg: "Unable to update category posts order",
        },
        invalidActionForOrderUpdate: {
            code: 3007,
            msg: "Invalid action type.",
        },
    },
    tags: {
        //range -> 3201 to 3299
        paramNotFound: {
            code: 3201,
            msg: "Invalid api param",
        },
        syncError: {
            code: 3202,
            msg: "Tag Not synced",
        },
        notFound: {
            code: 3203,
            msg: "Tag Not Found",
        },
        renameError: {
            code: 3204,
            msg: "Tag Not renamed",
        },
        removeError: {
            code: 3205,
            msg: "Tag Not removed",
        },
    },
    taxonomy: {
        //range -> 3301 to 3399
        paramNotFound: {
            code: 3201,
            msg: "Invalid api param",
        },
        syncError: {
            code: 3202,
            msg: "Failed to sync.",
        },
        notFound: {
            code: 3203,
            msg: "Not found",
        },
        invalidPostType: {
            code: 3204,
            msg: "Invalid Post Type",
        },
        removeError: {
            code: 3205,
            msg: "Failed to unsync.",
        },
    },
    authors: {
        //range -> 3101 to 3199
        paramNotFound: {
            code: 3101,
            msg: "Invalid api param",
        },
        syncError: {
            code: 3102,
            msg: "Author Not synced",
        },
        notFound: {
            code: 3103,
            msg: "Author Not Found",
        },
        removeError: {
            code: 3104,
            msg: "Author Not removed",
        },
    },
    webPages: {
        //range -> 3301 to 3399
        paramNotFound: {
            code: 3301,
            msg: "Invalid api param",
        },
        syncError: {
            code: 3302,
            msg: "Page Not synced",
        },
        notFound: {
            code: 3303,
            msg: "Page Not Found",
        },
        renameError: {
            code: 3304,
            msg: "Page Not renamed",
        },
        removeError: {
            code: 3305,
            msg: "Page Not removed",
        },
    },
    articles: {
        //range-> 4001 to 4099
        notFound: {
            code: 4001,
            msg: "No article found",
        },
        articleDataRequired: {
            code: 4002,
            msg: "Article data is required",
        },
        invalidCategoryId: {
            code: 4003,
            msg: "Invalid category guid",
        },
        invalidArticleGuid: {
            code: 4004,
            msg: "Invalid article guid",
        },
        requiedArticleGuid: {
            code: 4005,
            msg: "Article guid is required",
        },
        invalidParameters: {
            code: 4006,
            msg: "Invalid parameters",
        },
    },
    alert: {
        unableToMarkAsRead: {
            code: 6001,
            msg: "Unable to update alert read status",
        },
        noAlertFound: {
            code: 6002,
            msg: "No Alert found for this project",
        },
    },
    devapi: {
        // range -> 5000 - 5099
        invalidAuthCred: {
            code: 5001,
            msg: "Invaild access or secret key",
        },
        invalidToken: {
            code: 5002,
            msg: "Invalid token or expired",
        },
        invalidIdentity: {
            code: 5007,
            msg: "Invalid identity",
        },
        invalidQueryString: {
            code: 5003,
            msg: "Invalid query string, Please verify",
        },
        projectSuspended: {
            code: 5005,
            msg: "This project has been suspended",
        },
        noContractFound: {
            code: 5006,
            msg: "No contract found for this project",
        },
        inValidArgument: {
            code: 5007,
            msg: "Request contains an invalid argument",
        },
    },
    appsbuild: {
        platform: {
            code: 7001,
            msg: "Platform not found for build creation",
        },
    },
    webstory: {
        //range-> 4001 to 4099
        notFound: {
            code: 4001,
            msg: "No article found",
        },
        articleDataRequired: {
            code: 4002,
            msg: "Article data is required",
        },
        invalidData: {
            code: 4003,
            msg: "Invalid Data for Web Story",
        },
        invalidArticleGuid: {
            code: 4004,
            msg: "Invalid article guid",
        },
        requiedArticleGuid: {
            code: 4005,
            msg: "Article guid is required",
        },
        invalidParameters: {
            code: 4006,
            msg: "Invalid parameters",
        },
    },
    wpWebstories: {
        notFound: {
            code: 8001,
            msg: "No webstory found",
        },
        webstoryDataRequired: {
            code: 8002,
            msg: "Webstory data is required",
        },
        invalidWebstoryGuid: {
            code: 8003,
            msg: "Invalid webstory guid",
        },
        requiedWebstoryGuid: {
            code: 8004,
            msg: "Invalid guid is required",
        },
        invalidParameters: {
            code: 8005,
            msg: "Invalid parameters",
        },
        categoryNotFound: {
            code: 8006,
            msg: "Category not found",
        },
    },
    validation: {
        missingParameters: {
            code: 9001,
            msg: "Missing Parameters",
        },
    },
    permission: {
        permissionDenied: {
            code: 403,
            msg: "You are not authorized",
        },
    },
    youtubeAPI: {
        invalidArgument: {
            code: 400,
            msg: "Request contains an invalid argument",
        },
    },
    connectedTV:{
        platformNotFound:{
            code: 5201,
            msg:"Invalid platform"
        },
        appNotFound:{
            code:5202,
            msg:"App not found with this package name"
        },
        appNotEnabled:{
            code:5203,
            msg:"App not enabled for the project"
        }
    },
    publicUser: {
        userCreationFailed: {
            code: 500,
            msg: "An unexpected error occurred while creating the user",
        },
        userAuthenticationFailed: {
            code: 500,
            msg: "An unexpected error occurred while authenticating the user",
        },
        userNotLoggedIn: {
            code: 401,
            msg: "User not logged In",
        },
    },
    genAIAPI: {
        invalidArgument: {
            code: 400,
            msg: "Invalid request body"
        },
        contentBlocked: {
            code: 10001,
            msg: 'The response was blocked due to potential inclusion of violent, sexual, or derogatory content.'
        }
    },
    connectedTV: {
        platformNotFound: {
            code: 5201,
            msg: "Invalid platform"
        },
        appNotFound: {
            code: 5202,
            msg: "App not found with this package name"
        },
        appNotEnabled:{
            code:5203,
            msg:"App not enabled for the project"
        },
        videosNotFound:{
            code:5204,
            msg:"Video not found"
        }
    },
    tickets: {
        paramNotFound: {
            code: 10001,
            msg: "Invalid api param",
        },
        createError: {
            code: 10002,
            msg: "Unable to create ticket",
        },
        notFound: {
            code: 10003,
            msg: "Ticket not found.",
        },
        deleteError: {
            code: 10004,
            msg: "Unable to remove ticket.",
        },
        commentError: {
            code : 10005,
            msg : "Unable to comment on ticket."
        }
    },
    subscription : {
        paramNotFound: {
            code: 3201,
            msg: "Invalid api param",
        },
        planNotFound: {
            code: 3203,
            msg: "Plan not found",
        },
        notFound: {
            code: 10003,
            msg: "Subscription not found.",
        },
        txnNotFound: {
            code: 10004,
            msg: "Transaction not found.",
        },
    },
    admin: {
        // Authentication errors (201-299)
        validationFailed: {
            code: 201,
            msg: "Validation failed"
        },
        // Feed validation uses error code 2702 (from error-codes.js)
        feedValidationFailed: {
            code: 2702,
            msg: "Validation Failed"
        },
        invalidEmail: {
            code: 202,
            msg: "Invalid email format"
        },
        weakPassword: {
            code: 203,
            msg: "Password does not meet requirements"
        },
        alreadyExists: {
            code: 204,
            msg: "User already exists"
        },
        registrationFailed: {
            code: 205,
            msg: "Registration failed"
        },
        invalidCredentials: {
            code: 206,
            msg: "Invalid email or password"
        },
        loginFailed: {
            code: 207,
            msg: "Login failed"
        },
        invalidToken: {
            code: 208,
            msg: "Invalid or expired token"
        },
        tokenExpired: {
            code: 209,
            msg: "Token has expired"
        },
        userNotFound: {
            code: 210,
            msg: "User not found"
        },
        accountInactive: {
            code: 211,
            msg: "Account is inactive"
        },
        // Feed errors (301-399)
        invalidFeedUrl: {
            code: 301,
            msg: "Invalid feed URL"
        },
        invalidFeedFormat: {
            code: 302,
            msg: "Invalid RSS feed format"
        },
        feedCreationFailed: {
            code: 303,
            msg: "Failed to create feed"
        },
        feedAlreadyExists: {
            code: 304,
            msg: "Feed with this URL already exists"
        },
        feedNotFound: {
            code: 305,
            msg: "Feed not found"
        },
        feedUpdateFailed: {
            code: 306,
            msg: "Failed to update feed"
        },
        feedDeleteFailed: {
            code: 307,
            msg: "Failed to delete feed"
        },
        feedFetchFailed: {
            code: 308,
            msg: "Failed to fetch feeds"
        },
        feedTestFailed: {
            code: 309,
            msg: "Failed to test feed"
        },
        feedInactive: {
            code: 310,
            msg: "Feed is inactive"
        },
        // FeedArticle errors (401-499)
        feedArticleNotFound: {
            code: 401,
            msg: "Feed article not found"
        },
        feedArticleFetchFailed: {
            code: 402,
            msg: "Failed to fetch feed articles"
        },
        feedArticleUpdateFailed: {
            code: 403,
            msg: "Failed to update feed article"
        },
        feedArticleDeleteFailed: {
            code: 404,
            msg: "Failed to delete feed article"
        },
        // Settings errors (501-599)
        settingsFetchFailed: {
            code: 501,
            msg: "Failed to fetch settings"
        },
        settingsUpdateFailed: {
            code: 502,
            msg: "Failed to update settings"
        },
        invalidInterval: {
            code: 503,
            msg: "Invalid import interval"
        },
        // Import errors (601-699)
        feedImportFailed: {
            code: 601,
            msg: "Failed to import feed"
        },
        historyFetchFailed: {
            code: 602,
            msg: "Failed to fetch import history"
        },
        // Game Settings errors (701-799)
        settingsNotFound: {
            code: 701,
            msg: "Game settings not found"
        },
        settingsDeleteFailed: {
            code: 702,
            msg: "Failed to delete game settings"
        }
    }
};
  
