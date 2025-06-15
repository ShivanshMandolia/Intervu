// backend/index.js
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app ,server} from './app.js';

dotenv.config({
    path: './.env'
});

connectDB()
.then(() => {
    server.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port: ${process.env.PORT || 8000}`);
        console.log(`🚀 Socket.IO server initialized`);
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
});