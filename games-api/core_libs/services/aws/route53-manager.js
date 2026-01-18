const { Route53 } = require("@aws-sdk/client-route-53");

const awsConfig = require("../../../config/config").aws;

const route53 = new Route53({
    credentials:{
        ...awsConfig.credentials
    },
    region: 'us-east-1',
})

const creatingAliasForCloudfront = (cdnDnsName, aliasName ) => (
    new Promise((resolve, reject) => {
        const params = {
            ChangeBatch: {
                Changes: [{
                    Action: "CREATE",
                    ResourceRecordSet: {
                        AliasTarget: {
                            DNSName: cdnDnsName,
                            EvaluateTargetHealth: false,
                            HostedZoneId: "Z2FDTNDATAQYW2",
                        },
                        Name: aliasName,
                        Type: "A"
                    }
                }],
                Comment: `CloudFront distribution for ${cdnDnsName}`
            },
            HostedZoneId: awsConfig.hostedZoneId // Depends on the type of resource that you want to route traffic to
        }
        route53.changeResourceRecordSets(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        })
    })
)

const listResourceRecordSets = () => (
    new Promise((resolve, reject)=>{
        const params ={
            HostedZoneId: awsConfig.hostedZoneId,
            StartRecordType:"A",
            MaxItems: "1"
        }

        route53.listResourceRecordSets(params, (err, data)=>{
            if(err){
                reject(err);
            }else{
                resolve(data);
            }
        })
    })
)

module.exports = {
    creatingAliasForCloudfront,
    listResourceRecordSets
}