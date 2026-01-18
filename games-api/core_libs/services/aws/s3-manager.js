// const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const { S3, S3Client, CreateBucketCommand , PutPublicAccessBlockCommand,GetBucketAclCommand} = require("@aws-sdk/client-s3");
const awsConfig = require("../../../config/config").aws;


// AWS.config.update(awsConfig.credentials);


// const s3 = new AWS.S3({
//     apiVersion: '2006-03-01'
// });

const s3 = new S3({
    region: awsConfig.credentials.region,
    credentials: {
      accessKeyId: awsConfig.credentials.accessKeyId,
      secretAccessKey: awsConfig.credentials.secretAccessKey
    }
})

const client = new S3Client({
  region: awsConfig.credentials.region,
  credentials: {
    accessKeyId: awsConfig.credentials.accessKeyId,
    secretAccessKey: awsConfig.credentials.secretAccessKey
  }
});

const getS3BucketList = () => (
    new Promise((resolve, reject) => {
        s3.listBuckets({},(err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
)

//ACL options : private | public-read | public-read-write | authenticated-read,
const disableBlockPublicAccessPolicy =  (bucketName) => (
    new Promise((resolve, reject) => {
        const params = {
            Bucket: bucketName,
            PublicAccessBlockConfiguration : {
                BlockPublicPolicy : false
            }
        };
        s3.putPublicAccessBlock(params, (err, data) => {
            if (err) {
                console.log(err)
                reject(err);
            } else {
                resolve({
                    data,
                    bucket_name: bucketName,
                    bucket_region: awsConfig.bucketRegion
                });
            }
        })
    })
)
const createS3Bucket = (bucketName) => (
    new Promise((resolve, reject) => {
        bucketName = bucketName + awsConfig.bucketSuffix;
        const params = {
            Bucket: bucketName,
            ACL: "private"
        };
        s3.createBucket(params, (err, data) => {
            if (err) {
                console.log(err)
                reject(err);
            } else {
                resolve({
                    data,
                    bucket_name: bucketName,
                    bucket_region: awsConfig.bucketRegion
                });
            }
        });
    })
)

//uploading an arbitraty sized payload in parts when it it is large
//here need to pass absolute path of the file
const uploadToS3 = (bucketName, filePath, keyName = "", ACL) => (
    new Promise((resolve, reject) => {
        if (!bucketName) {
            return reject("Bucket Name is required");
        }
        if (!filePath) {
            return reject("File path is required");
        }
        let uploadParams = {
            Bucket: bucketName,
            Key: "",
            Body: "",
            ACL
        };
        if (keyName !== "") {
            uploadParams.Key = keyName;
        } else {
            uploadParams.Key = path.basename(filePath);
        }

        let fileStream = fs.createReadStream(filePath);

        fileStream.on("error", (error) => {
            return reject("unable to read file");
        })

        uploadParams.Body = fileStream;

        s3.upload(uploadParams, (err, data) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(data.Location);
            }
        });
    })
)

const getBucketObjectsList = (bucketName) => (
    new Promise((resolve, reject) => {
        if (!bucketName) {
            return reject("bucket name is required")
        }
        const bucketParams = {
            Bucket: bucketName
        }
        s3.listObjects(bucketParams, (err, data) => {
            if (err) {
                return reject(err)
            } else {
                return resolve(data)
            }
        })
    })
)

const deleteS3Bucket = (bucketName) => (
    new Promise((resolve, reject) => {

        const bucketParams = {
            Bucket: bucketName
        }

        if (!bucketName) {
            return reject("Bucket name is required")
        }
        s3.deleteBucket(bucketParams, (err, data) => {
            if (err) {
                return reject(err)
            }
            return resolve(data)
        })
    })
)

const deleteS3BucketObjects = (bucketName, objects) => (
    new Promise((resolve, reject) => {
        if (!bucketName) {
            return reject("Bucket name is required")
        }
        if (!objects) {
            return reject("Objects is required")
        }
        const params = {
            Bucket: bucketName,
            Delete:{
                Objects: objects
            }
        }
        s3.deleteObjects(params, (err, data) => {
            if (err) {
                return reject(err)
            }
            return resolve(data)
        })
    })
)

// put object: adding an object to the bucket
const putObjectStandard = (bucketName, srcFilePath, Key, ACL = "private") => (
    new Promise((resolve, reject) => {
        bucketName = bucketName + awsConfig.bucketSuffix;

        let putParams = {
            Bucket: bucketName,
            Body: "",
            Key,
            ACL
        }

        let fileStream = fs.createReadStream(srcFilePath);

        fileStream.on("error", (error) => {
            return rejecobjetctsobjetctst("Unable to read the file");
        });

        putParams.Body = fileStream;

        s3.putObject(putParams, (err, data) => {
            if (err) {
                return reject(err)
            }
            return resolve(data)
        })
    })
)


const putObjectStandardFromBuffer = (bucketName, bufferString, Key, contentType, ACL = "private") => (
    new Promise((resolve, reject) => {
        // bucketName = bucketName + awsConfig.bucketSuffix;

        console.log(bucketName, Key);

        console.log("\n\n contentType: ", contentType,"\n\n")

        let putParams = {
            Bucket: bucketName,
            Body: "",
            ContentType:contentType,
            Key,
            ACL
        }

        putParams.Body = bufferString;

        s3.putObject(putParams, (err, data) => {
            if (err) {
                return reject(err)
            }
            return resolve(bucketName)
        })
    })
)

const putObjectInVideosFromBuffer = (bucketName, bufferString, Key, contentType, ACL = "private") => (
    new Promise((resolve, reject) => {
        // bucketName = bucketName + awsConfig.bucketSuffix;

        console.log(bucketName, Key);

        let putParams = {
            Bucket: bucketName,
            Body: "",
            ContentType:contentType,
            Key:`videos/${Key}`,
            ACL
        }

        putParams.Body = bufferString;

        s3.putObject(putParams, (err, data) => {
            if (err) {
                return reject(err)
            }
            return resolve(bucketName)
        })
    })
)


const getObjectFromS3Bucket = (bucketName, key) => (
    new Promise((resolve, reject) => {
        // bucketName = bucketName + awsConfig.bucketSuffix;

        const params = {
            Bucket: bucketName,
            Key: key
        }
        s3.getObject(params, (err, data) => {
            if (err) {
                return reject(err)
            }
            return resolve(data)
        })
    })
)

const changeObjectAcl = (bucketName, keyName, acl) =>(

    new Promise((resolve, reject) => {

        const params = {
            Bucket: bucketName,
            Key: keyName,
            ACL:acl
        }
        s3.putObjectAcl(params, (err, data) => {
            if (err) {
                return reject(err)
            }
            return resolve(data)
        })
    })
)

const copyFromOneBucketToAnother = (sourceBucketName, destinationBucketName, objectKey, ACL = "private") =>(

    new Promise((resolve, reject) => {

        const params = { 
            Bucket: destinationBucketName,
            CopySource:`/${sourceBucketName}/${objectKey}`,
            Key: objectKey,
            ACL
        };
        
        s3.copyObject(params, (err, data) => {
            if (err) {
                return reject(err)
            }
            return resolve(data)
        })
    })
)

const moveVideoToVideosFolder = (sourceBucketName, destinationBucketName, objectKey, ACL = "private") =>(

    new Promise((resolve, reject) => {

        const params = { 
            Bucket: destinationBucketName ,
            CopySource:`/${sourceBucketName}/${objectKey}`,
            Key: `videos/${objectKey}`,
            ACL
        };
        
        s3.copyObject(params, (err, data) => {
            if (err) {
                // console.log(err)
                return resolve(false);
            }
            return resolve(data)
        })
    })
)

const disableBlockPublicAccessPolicyV3 =  (bucketName) => (
    new Promise((resolve, reject) => {
        const params = {
            Bucket: bucketName,
            PublicAccessBlockConfiguration : {
                BlockPublicPolicy : false
            }
        };
        const command = new  PutPublicAccessBlockCommand(params);
        client.send(command, (err, data) => {
            if (err) {
                console.log(err)
                reject(err);
            } else {
                resolve({
                    data,
                    bucket_name: bucketName,
                    bucket_region: awsConfig.bucketRegion
                });
            }
        })
    })
)
const createS3BucketV3 = (bucketName)=>(
    new Promise((resolve, reject) => {
        const params = {
            Bucket: bucketName,
            ACL: "private",
            ObjectOwnership : 'ObjectWriter'
        };
        const command = new CreateBucketCommand(params);
        client.send(command, (err, data) => {
            if (err) {
                console.log(err)
                reject(err);
            } else {
                resolve({
                    data,
                    bucket_name: bucketName,
                    bucket_region: awsConfig.bucketRegion
                });
            }
        })
    })
)



const createS3BucketAndUpdatePolicyV3 = (bucketName) => (
    new Promise(async (resolve, reject) => {
        bucketName = bucketName + awsConfig.bucketSuffix;
        const data = await createS3BucketV3(bucketName);

        if(data && data.bucket_name) {
            await disableBlockPublicAccessPolicyV3(bucketName);
            resolve(data);
        }else{
            reject(data);
        }
        
    })
)

const getS3BucketDetails = async(bucketName) => {
    return new Promise(async(resolve,reject) => {

        const params = {
            Bucket: bucketName,
        }
        const command = new GetBucketAclCommand(params);
        client.send(command,(err,data) => {
            if(err){
                console.log(err);
                reject(err);
            }else{
                console.log(data);
                resolve(data);
            }
        })
    })
}

module.exports = {
    createS3Bucket,
    uploadToS3,
    putObjectStandard,
    getObjectFromS3Bucket,
    getS3BucketList,
    getBucketObjectsList,
    deleteS3Bucket,
    deleteS3BucketObjects,
    putObjectStandardFromBuffer,
    changeObjectAcl,
    copyFromOneBucketToAnother,
    moveVideoToVideosFolder,
    putObjectInVideosFromBuffer,
    disableBlockPublicAccessPolicy,
    disableBlockPublicAccessPolicyV3,
    createS3BucketV3,
    createS3BucketAndUpdatePolicyV3,
    getS3BucketDetails,
}


// createBucketAndUpdatePolicy('june-new-2').then(result => {console.log("result",result);}).catch(result => {console.log("result",result);});