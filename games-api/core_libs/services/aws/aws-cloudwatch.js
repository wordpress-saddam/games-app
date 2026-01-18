const {
    CloudWatch
} = require('@aws-sdk/client-cloudwatch');

const awsConfig = require("../../../config/config").aws;

const cw = new CloudWatch({
    credentials: {
        ...awsConfig.credentials,
    },
    region: 'us-east-1'
})


const getCloudfrontStats = (distributionId, startTime, endTime, metricName) => (
    new Promise((resolve, reject) => {
        var statParams = {
            StartTime: new Date(startTime * 1000),
            EndTime: new Date(endTime * 1000),
            MetricName: metricName,
            Namespace: 'AWS/CloudFront',
            Dimensions: [{
                    Name: 'Region',
                    /* required */
                    Value: 'Global' /* required */
                },
                {
                    Name: 'DistributionId',
                    /* required */
                    Value: distributionId /* required */
                }

                /* more items */
            ],
            Period: 86400,
            /* required */
            Statistics: ['Sum']
        };


        cw.getMetricStatistics(statParams, function (err, data) {
            if (err) {
                reject(err)
            } else {
                console.log(data)
                resolve(data)
            }
        });
    })

)

// getCloudfrontStats("E140N720QX6DAP",1639915200,1640174400).then(data=>{
//     console.log(data)
// }).catch(err=>{
//     console.log(err)
// })

module.exports = {
    getCloudfrontStats
}

// var params = {
//     StartTime:1639915200,
//     EndTime:1640174400,

//     MetricDataQueries: [ /* required */
//         {
//           Id: 'metric_aliasmetricsviewgraph1', /* required */
//           //AccountId: 'STRING_VALUE',
//           //Expression: 'STRING_VALUE',
//           Label: 'STRING_VALUE',
//           MetricStat: {
//             Metric: { /* required */
//               Dimensions: [
//                 {
//                     Name: 'Region', /* required */
//                     Value: 'Global' /* required */
//                   },
//                 {
//                   Name: 'DistributionId', /* required */
//                   Value: 'E140N720QX6DAP' /* required */
//                 }

//                 /* more items */
//               ],
//               MetricName: 'BytesDownloaded',
//               Namespace: 'AWS/CloudFront'
//             },
//             Period: 86400, /* required */
//             Stat: 'Sum', /* required */
//             //Unit: 'None'
//           },
//          // Period: 86400,
//           ReturnData: true
//         }
//         /* more items */
//       ]
//   };

//   cw.getMetricData(params, function(err, data) {
//     if (err) {
//       console.log("Error", err);
//     } else {
//         console.log(data)
//       console.log("Metrics", JSON.stringify(data.MetricDataResults));
//     }
//   });

//   cw.getMetricStatistics(statParams, function(err, data) {
//     if (err) {
//       console.log("Error", err);
//     } else {
//         console.log(data)
//       console.log("Metrics", JSON.stringify(data.Metrics));
//     }
//   });