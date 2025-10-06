import BrookHttp from "./classes/http.js";
import Auth from "./jobs/auth.js";

const server = new BrookHttp(3001, 'localhost');
await server.perform();
