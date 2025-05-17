const express= require('express');
const cors= require('cors');


const {generateSlug} =require('random-word-slugs')

const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs')

const redis =require('ioredis');
const {Server}=require('socket.io');


const subscriber=new redis({
    host:'redis-16157.c291.ap-southeast-2-1.ec2.redns.redis-cloud.com',
    port:16157,
    password:''
})

// const publishLog=(log)=>{
//     publisher.publish(`logs:${PROJECT_ID}`,JSON.stringify({log}));
// }
const io=new Server({cors:'*'});

io.on('connection',(socket)=>{
    socket.on('subscribe',channel=>{
        socket.join(channel);
        socket.emit('message',`Joined${channel}`);
    })
});
io.listen(9001,()=>console.log("Socket server is running on port 9001"))



const PORT=9000;
const app=express();
app.use(cors());
app.use(express.json());

const ecsClient= new ECSClient({ 
    credentials:{
        accessKeyId:'',
        secretAccessKey:''
    },
   })

const config={
    CLUSTER:'arn:aws:ecs:ap-southeast-2:010526270421:cluster/builder-cluster-2',
    TASK:'arn:aws:ecs:ap-southeast-2:010526270421:task-definition/builder-task-2'
}




app.post('/project',async(req,res)=>{

   

    const {githubUrl,Slug}=req.body;

    if(!githubUrl)res.status(400).json({status:'error',message:'githubUrl is required'});

     let slug= Slug? Slug :generateSlug();

    const command =new RunTaskCommand({
        cluster:config.CLUSTER,
        taskDefinition:config.TASK,
        launchType:'FARGATE',
        count:1,
        networkConfiguration:{
            awsvpcConfiguration:{
                assignPublicIp:'ENABLED',
                subnets:['subnet-02a682b3fddefbfe0','subnet-09d440205182d3c62','subnet-04fe45e467ded7f3a'],
                securityGroups:['sg-0db69406ec4c3e126'],
        }
    },
    overrides:{
        containerOverrides:[
            {
                name:'builder-image-2',
                environment:[
                    {name:'GIT_REPOSITORY',value:githubUrl},
                    {name:'PROJECT_ID',value:slug},
                ]
            },
            
        ]
    }
    })
    
    await ecsClient.send(command);

    return res.json({status:'queued',data:{slug,url:`http://${slug}.localhost:8000`}});

    
})


const initRedisSubscibe=async()=>{
    console.log('subscribed to logs');
    
    subscriber.psubscribe('logs:*');
    subscriber.on('pmessage',(pattern,channel,message)=>{
        console.log("subscription onn Message");
        io.to(channel).emit('message',message);
    })
}
initRedisSubscibe();

app.listen(PORT,()=>{console.log(`API Server is running on port ${PORT}`)});