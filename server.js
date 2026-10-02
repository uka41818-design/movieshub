const express=require("express"),multer=require("multer"),fs=require("fs"),path=require("path"),crypto=require("crypto");
const app=express(),PORT=process.env.PORT||3000,ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"CHANGE_ME";
const uploadDir=path.join(__dirname,"uploads"),db=path.join(__dirname,"data/movies.json");
app.use(express.json()); app.use("/uploads",express.static(uploadDir)); app.use(express.static(path.join(__dirname,"public")));
const storage=multer.diskStorage({destination:uploadDir,filename:(r,f,cb)=>cb(null,Date.now()+"-"+crypto.randomBytes(5).toString("hex")+path.extname(f.originalname).toLowerCase())});
const upload=multer({storage,limits:{fileSize:700*1024*1024},fileFilter:(r,f,cb)=>cb(null,["image/jpeg","image/png","image/webp","video/mp4","video/webm","video/quicktime"].includes(f.mimetype))});
const read=()=>JSON.parse(fs.readFileSync(db,"utf8")); const write=x=>fs.writeFileSync(db,JSON.stringify(x,null,2));
function auth(req,res,next){if((req.headers["x-admin-password"]||"")!==ADMIN_PASSWORD)return res.status(401).json({error:"Wrong admin password"});next()}
app.get("/api/movies",(req,res)=>res.json(read()));
app.post("/api/movies",auth,upload.fields([{name:"poster",maxCount:1},{name:"video",maxCount:1}]),(req,res)=>{
 const f=req.files||{}; if(!req.body.title||!f.video)return res.status(400).json({error:"Title and video are required"});
 const m={id:crypto.randomUUID(),title:req.body.title,year:req.body.year||"",genre:req.body.genre||"Other",rating:req.body.rating||"",description:req.body.description||"",poster:f.poster?"/uploads/"+f.poster[0].filename:"",video:"/uploads/"+f.video[0].filename,createdAt:new Date().toISOString()};
 const a=read();a.unshift(m);write(a);res.json(m);
});
app.delete("/api/movies/:id",auth,(req,res)=>{const a=read(),m=a.find(x=>x.id===req.params.id);if(!m)return res.status(404).json({error:"Not found"});[m.poster,m.video].forEach(u=>{if(u){let p=path.join(uploadDir,path.basename(u));if(fs.existsSync(p))fs.unlinkSync(p)}});write(a.filter(x=>x.id!==m.id));res.json({ok:true})});
app.listen(PORT,()=>console.log("MoviesHub: http://localhost:"+PORT));