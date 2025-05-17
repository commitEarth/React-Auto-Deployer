const express= require('express');
const app = express();
const cors= require('cors');
const httpProxy= require('http-proxy');
const PORT= 8000;

const proxy= httpProxy.createProxy();

const basePath= `https://riyan-vercelclone-outputs.s3.ap-southeast-2.amazonaws.com/__outputs`;
app.use(cors());
app.use((req,res)=>{
    console.log(`Request for ${req.url}`);
    const hostname = req.hostname;
    const subDomain=hostname.split('.')[0];
 
    const resolvesTo=`${basePath}/${subDomain}/`;
    
   return  proxy.web(req,res,{target:resolvesTo,changeOrigin:true},()=>{console.log(`Redirected to S3 ${subDomain}`);
   });
})

proxy.on('proxyReq',(proxyReq,req,res)=>{

    const url = req.url;
    if(url==='/'){
        proxyReq.path+= 'index.html';
    }

})


app.listen(PORT,()=>{console.log(`Server is running on port ${PORT}`)});