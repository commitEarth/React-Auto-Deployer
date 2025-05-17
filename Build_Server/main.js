console.log("Executing main.js STARTED...");

const {exec }   =require('child_process');
const fs = require('fs');
const path = require('path');
const {S3Client,PutObjectCommand} = require('@aws-sdk/client-s3')
const mimetype=require('mime-types');

const redis=require('ioredis');

const publisher=new redis({
    host:'redis-16157.c291.ap-southeast-2-1.ec2.redns.redis-cloud.com',
    port:16157,
    password:''
})

const publishLog=(log)=>{
    publisher.publish(`logs:${PROJECT_ID}`,JSON.stringify({log}));
}




const s3client=new S3Client({
    region:'ap-southeast-2',
    credentials:{
        accessKeyId:'',
        secretAccessKey:''
    }
})

const PROJECT_ID=process.env.PROJECT_ID;

const init =async()=>{
    const outputDir=path.join(__dirname,'output');
    console.log("INITIALIZING...");
    publishLog("Build Started")

    const p = exec(`cd ${outputDir} && npm install && npm run build`);

    p.stdout.on('data',(data)=>{
        console.log(data.toString());
        publishLog(data.toString());
        
    })
    p.stderr.on('data',(err)=>{
        console.log("Error",err.toString());
        publishLog(`error: ${err.toString()}`);
        
    })
    p.on('close',async()=>{
        console.log(`BUILD Complete SUCCESSFULL`);
        publishLog("Build Complete Successfull");

        const distFolderPath=path.join(__dirname,'output','dist');

        const distfolderContent= fs.readdirSync(distFolderPath,{recursive:true});

        console.log("Uploading to S3...");
        publishLog("Uploading to S3...");
        
        
        for(const  file of distfolderContent){
            const filePath=path.join(distFolderPath,file);

            if(fs.lstatSync(filePath).isDirectory())continue;
            console.log(`Uploading ${filePath}...`);
            publishLog(`Uploading ${filePath}...`);
            
            
            const command = new PutObjectCommand({
                Bucket:'riyan-vercelclone-outputs',
                Key:`__outputs/${PROJECT_ID}/${file}`,
                Body:fs.createReadStream(filePath),
                ContentType:mimetype.lookup(filePath)
                
            })
            await s3client.send(command);  
             console.log("Uploaded to S3...",filePath);
             publishLog(`Uploaded to S3...${filePath}`);

        }
           
    })
}


init();