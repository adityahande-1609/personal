import express from 'express';import cors from 'cors';import helmet from 'helmet';import rateLimit from 'express-rate-limit';
const app=express();app.use(helmet());app.use(cors({origin:process.env.FRONTEND_URL||'http://localhost:5173',credentials:true}));app.use(express.json({limit:'1mb'}));app.use(rateLimit({windowMs:15*60*1000,max:200}));
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'rental-platform-api'}));
app.use((_req,res)=>res.status(404).json({error:'Not found'}));
app.listen(Number(process.env.PORT||4000),()=>console.log('API listening on http://localhost:4000'));
