module.exports = {
    acm: {
        requestCertificate: {
            DomainName: "", //from input
            IdempotencyToken: "",
            ValidationMethod: "EMAIL", // | DNS,
            DomainValidationOptions: [{
                DomainName: "",
                ValidationDomain: ""
            }, ],
            Options: {
                CertificateTransparencyLoggingPreference: "ENABLED", // | DISABLED
            },
            // SubjectAlternativeNames: [],
            // Tags: [],
        }
    },
    cloudfront: {
        cachePolicy: {
            CachePolicyConfig: {
                MinTTL: 0,
                Name: '',
                DefaultTTL: '',
                MaxTTL: '',
                ParametersInCacheKeyAndForwardedToOrigin: {
                    EnableAcceptEncodingGzip: true,
                    EnableAcceptEncodingBrotli: true,
                    CookiesConfig: {
                        CookieBehavior: "none", //none | whitelist | allExcept | all,
                        // Cookies: {
                        //     Quantity: 0,
                        //     Items: []
                        // }
                    },
                    HeadersConfig: {
                        HeaderBehavior: "none", //none | whitelist,
                        // Headers: {
                        //     Quantity: 0,
                        //     Items: []
                        // }
                    },
                    QueryStringsConfig: {
                        QueryStringBehavior: "none", //none | whitelist | allExcept | all,
                        // QueryStrings: {
                        //     Quantity: 0,
                        //     Items: [

                        //     ]
                        // }
                    },
                }
            }
        },
        originRequest: {
            OriginRequestPolicyConfig: {
                CookiesConfig: {
                    CookieBehavior: "none", // none | whitelist | all,
                    Cookies: {
                        Quantity: 0,
                        Items: [
                            // ''
                        ]
                    }
                },
                HeadersConfig: {
                    HeaderBehavior: "none", //none | whitelist | allViewer | allViewerAndWhitelistCloudFront,
                    Headers: {
                        Quantity: 0,
                        Items: [
                            // ''
                        ]
                    }
                },
                Name: '',
                QueryStringsConfig: {
                    QueryStringBehavior: "", //none | whitelist | all,
                    QueryStrings: {
                        Quantity: 0,
                        Items: [
                            // '',
                        ]
                    }
                },
            }
        },
        createDistributionWithTags: {
            DistributionConfigWithTags: {
                DistributionConfig: {

                    CallerReference: '', //from input*
                    Enabled: true,
                    HttpVersion: 'http2', //default http2     //http1.1 | http2, 
                    IsIPV6Enabled: true, //default                                               
                    PriceClass: "PriceClass_All", //default   PriceClass_100 | PriceClass_200 | PriceClass_All

                    Aliases: { //from input 
                        Quantity: 0
                    },

                    DefaultCacheBehavior: {
                        TargetOriginId: '', //from input*
                        ViewerProtocolPolicy: "redirect-to-https",
                        // CachePolicyId: '', //from input 
                        Compress: true, //always true
                        // OriginRequestPolicyId: '', //from input
                        SmoothStreaming: false, //default false
                        AllowedMethods: { //config defined
                            Items: [
                                "GET" //, HEAD, POST,
                            ],
                            Quantity: 3,
                            CachedMethods: {
                                Items: [
                                    "GET" //| HEAD | POST | PUT | PATCH | OPTIONS | DELETE, only get
                                ],
                                Quantity: 1
                            }
                        }
                    },
                    Origins: {

                    },
                    CacheBehaviors: {

                    },
                    ViewerCertificate: { //from input

                    },
                },
                Tags: { //from input

                }
            }
        }
    }
}


//tags key ->
//publichser
// project
//type of resourece